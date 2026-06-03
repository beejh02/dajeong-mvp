import { getJson } from "./client";
import type { AdminSummaryResponse, OrderListResponse, OrderResponse } from "./types";

export function getAdminSummary(): Promise<AdminSummaryResponse> {
  return getJson<AdminSummaryResponse>("/admin/summary");
}

export function getAdminOrders(): Promise<OrderListResponse> {
  return getJson<OrderListResponse>("/admin/orders");
}

export function getAdminOrder(orderId: string): Promise<OrderResponse> {
  return getJson<OrderResponse>(`/admin/orders/${orderId}`);
}
