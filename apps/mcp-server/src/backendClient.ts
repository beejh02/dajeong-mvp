import { BACKEND_API_URL } from "./config.js";
import type {
  CompanyListResponse,
  MenuListResponse,
  OrderCreateRequest,
  OrderResponse,
} from "./types.js";

export async function requestBackendJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Backend API request failed: ${path} (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function getCompanies(): Promise<CompanyListResponse> {
  return requestBackendJson<CompanyListResponse>("/companies");
}

export function getCompanyMenus(companyId: string): Promise<MenuListResponse> {
  return requestBackendJson<MenuListResponse>(
    `/companies/${encodeURIComponent(companyId)}/menus`,
  );
}

export function createOrder(
  orderRequest: OrderCreateRequest,
): Promise<OrderResponse> {
  return requestBackendJson<OrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(orderRequest),
  });
}
