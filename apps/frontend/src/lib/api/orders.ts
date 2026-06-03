import { postJson } from "./client";
import type { OrderCreateRequest, OrderResponse } from "./types";

export function createOrder(
  orderRequest: OrderCreateRequest,
): Promise<OrderResponse> {
  return postJson<OrderResponse, OrderCreateRequest>("/orders", orderRequest);
}
