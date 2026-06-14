import { createOrder } from "../backendClient.js";
import type {
  ConfirmOrderArgs,
  ConfirmOrderResult,
  FulfillmentType,
  OrderCreateRequest,
  PaymentMethod,
  PointAccrualRequest,
  SelectedOptionGroup,
} from "../types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  return value;
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function requireFulfillmentType(value: unknown): FulfillmentType {
  if (value !== "dine_in" && value !== "pickup") {
    throw new Error("order.fulfillmentType must be dine_in or pickup.");
  }

  return value;
}

function requirePaymentMethod(value: unknown): PaymentMethod {
  if (value !== "credit_card" && value !== "coupon" && value !== "cash") {
    throw new Error("order.paymentMethod must be credit_card, coupon, or cash.");
  }

  return value;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be a string array.`);
  }

  return value.map((item, index) =>
    requireNonEmptyString(item, `${fieldName}[${index}]`),
  );
}

function normalizeSelectedOptionGroups(
  value: unknown,
  fieldName: string,
): SelectedOptionGroup[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  return value.map((rawGroup, index) => {
    const group = requireObject(rawGroup, `${fieldName}[${index}]`);

    return {
      groupId: requireNonEmptyString(group.groupId, `${fieldName}[${index}].groupId`),
      choiceIds: requireStringArray(
        group.choiceIds,
        `${fieldName}[${index}].choiceIds`,
      ),
    };
  });
}

function normalizeItems(value: unknown): OrderCreateRequest["items"] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("order.items must include at least one item.");
  }

  return value.map((rawItem, index) => {
    const item = requireObject(rawItem, `order.items[${index}]`);

    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error(
        `order.items[${index}].quantity must be an integer greater than 0.`,
      );
    }

    return {
      menuId: requireNonEmptyString(item.menuId, `order.items[${index}].menuId`),
      quantity: item.quantity,
      selectedOptionGroups: normalizeSelectedOptionGroups(
        item.selectedOptionGroups,
        `order.items[${index}].selectedOptionGroups`,
      ),
    };
  });
}

function normalizePointAccrual(value: unknown): PointAccrualRequest {
  const pointAccrual = requireObject(value, "order.pointAccrual");

  if (typeof pointAccrual.enabled !== "boolean") {
    throw new Error("order.pointAccrual.enabled must be a boolean.");
  }

  if (
    pointAccrual.phone !== undefined &&
    pointAccrual.phone !== null &&
    typeof pointAccrual.phone !== "string"
  ) {
    throw new Error("order.pointAccrual.phone must be a string or null.");
  }

  return {
    enabled: pointAccrual.enabled,
    phone:
      typeof pointAccrual.phone === "string" && pointAccrual.phone.trim() !== ""
        ? pointAccrual.phone.trim()
        : null,
  };
}

function normalizeOrderRequest(args: ConfirmOrderArgs): OrderCreateRequest {
  const input = requireObject(args, "args");
  const order = requireObject(input.order, "order");

  requireNonEmptyString(input.draftId, "draftId");

  if (input.confirmedByUser !== true) {
    throw new Error("confirmedByUser must be true.");
  }

  return {
    companyId: requireNonEmptyString(order.companyId, "order.companyId"),
    userId: requireNonEmptyString(order.userId, "order.userId"),
    sourceChannel: "dajeong_ai",
    items: normalizeItems(order.items),
    fulfillmentType: requireFulfillmentType(order.fulfillmentType),
    paymentMethod: requirePaymentMethod(order.paymentMethod),
    pointAccrual: normalizePointAccrual(order.pointAccrual),
  };
}

export async function confirmOrderTool(
  args: ConfirmOrderArgs,
): Promise<ConfirmOrderResult> {
  const orderRequest = normalizeOrderRequest(args);
  const order = await createOrder(orderRequest);

  return {
    orderNumber: order.orderNumber,
    waitingNumber: order.waitingNumber,
    status: order.status,
    totalPrice: order.totalPrice,
    recommendedCardType: "order_confirmed",
  };
}
