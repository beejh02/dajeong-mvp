import { getJson } from "./client";
import type { AdminSummaryResponse, OrderListResponse, OrderResponse } from "./types";

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_DAJEONG_ADMIN_TOKEN?.trim();

function adminRequestInit(): RequestInit {
  if (!ADMIN_TOKEN) {
    return {};
  }

  // MVP demo guard only. NEXT_PUBLIC values are visible to the browser and are
  // not a substitute for real service authentication.
  return {
    headers: {
      "X-Dajeong-Admin-Token": ADMIN_TOKEN,
    },
  };
}

export function getAdminSummary(): Promise<AdminSummaryResponse> {
  return getJson<AdminSummaryResponse>("/admin/summary", adminRequestInit());
}

export function getAdminOrders(): Promise<OrderListResponse> {
  return getJson<OrderListResponse>("/admin/orders", adminRequestInit());
}

export function getAdminOrder(orderId: string): Promise<OrderResponse> {
  return getJson<OrderResponse>(`/admin/orders/${orderId}`, adminRequestInit());
}
