"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  adaptAdminSummary,
  adaptOrderToAdminOrder,
  adaptOrdersToChannelStats,
} from "../../lib/adapters/adminAdapter";
import { getAdminOrders, getAdminSummary } from "../../lib/api/admin";
import type { AdminTab, ChannelStat, Order, SummaryCard } from "./types";
import OverviewSection from "./components/OverviewSection";
import OrdersSection from "./components/OrdersSection";
import OrderDetailSection from "./components/OrderDetailSection";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);
  const isMountedRef = useRef(false);

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    setAdminError(null);

    try {
      const [summary, orderList] = await Promise.all([
        getAdminSummary(),
        getAdminOrders(),
      ]);
      const adaptedOrders = orderList.orders.map(adaptOrderToAdminOrder);

      if (!isMountedRef.current) return;

      setSummaryCards(adaptAdminSummary(summary));
      setChannelStats(adaptOrdersToChannelStats(orderList.orders));
      setOrders(adaptedOrders);
      setSelectedOrder((currentOrder) => currentOrder ?? adaptedOrders[0] ?? null);
    } catch {
      if (!isMountedRef.current) return;

      setAdminError("관리자 데이터를 불러오지 못했습니다. Backend API 연결을 확인하세요.");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const loadTimer = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
      isMountedRef.current = false;
    };
  }, [loadAdminData]);

  const handleMoveOrders = () => setActiveTab("orders");
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab("detail");
  };

  return (
    <main className="admin-page">
      <nav className="admin-nav">
        <div className="admin-brand">
          <div className="admin-logo">D</div>
          <div>
            <strong>Dajung</strong>
            <span>관리자</span>
          </div>
        </div>

        <div className="admin-nav-menu">
          <Link className="admin-back-link" href="/">
            뒤로가기
          </Link>
          <button
            className={activeTab === "overview" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("overview")}
          >
            개요
          </button>
          <button
            className={activeTab === "orders" || activeTab === "detail" ? "active" : ""}
            type="button"
            onClick={handleMoveOrders}
          >
            주문
          </button>
          <button type="button">로그아웃</button>
        </div>
      </nav>

      <section className="admin-container">
        {isLoading && (
          <section className="admin-state" role="status">
            <strong>관리자 데이터를 불러오는 중입니다.</strong>
            <p>Backend API에서 주문과 요약 데이터를 가져오고 있습니다.</p>
          </section>
        )}

        {!isLoading && adminError && (
          <section className="admin-state error" role="alert">
            <strong>{adminError}</strong>
            <button type="button" onClick={loadAdminData}>
              다시 시도
            </button>
          </section>
        )}

        {!isLoading && !adminError && activeTab === "overview" && (
          <OverviewSection summaryCards={summaryCards} channelStats={channelStats} />
        )}

        {!isLoading && !adminError && activeTab === "orders" && (
          <OrdersSection orders={orders} onViewDetail={handleViewDetail} />
        )}
        {!isLoading && !adminError && activeTab === "detail" && selectedOrder && (
          <OrderDetailSection order={selectedOrder} onBack={handleMoveOrders} />
        )}
      </section>
    </main>
  );
}
