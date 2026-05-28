import { useState } from "react";
import { Link } from "react-router-dom";
import type { AdminTab, Order } from "./types";
import { orders } from "./constants";
import OverviewSection from "./components/OverviewSection";
import OrdersSection from "./components/OrdersSection";
import OrderDetailSection from "./components/OrderDetailSection";
import "./AdminPage.css";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedOrder, setSelectedOrder] = useState<Order>(orders[0]);

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
          <Link className="admin-back-link" to="/">
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
        {activeTab === "overview" && <OverviewSection />}
        {activeTab === "orders" && (
          <OrdersSection onViewDetail={handleViewDetail} />
        )}
        {activeTab === "detail" && (
          <OrderDetailSection order={selectedOrder} onBack={handleMoveOrders} />
        )}
      </section>
    </main>
  );
}
