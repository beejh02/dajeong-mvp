import type {
  ChatResponse,
  OrderDraftConfirmationPayload,
} from "../../../../lib/gemini/cardSchema";
import { trustedConfirmDajeongOrder } from "../../../../lib/gemini/mcpClientAdapter";

type ConfirmOrderRequest = {
  confirmationPayload: OrderDraftConfirmationPayload;
  conversationId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFulfillmentType(
  value: unknown,
): value is OrderDraftConfirmationPayload["order"]["fulfillmentType"] {
  return value === "dine_in" || value === "pickup";
}

function isPaymentMethod(
  value: unknown,
): value is OrderDraftConfirmationPayload["order"]["paymentMethod"] {
  return value === "credit_card" || value === "coupon" || value === "cash";
}

function isSelectedOptionGroup(value: unknown) {
  return (
    isRecord(value) &&
    isNonEmptyString(value.groupId) &&
    Array.isArray(value.choiceIds) &&
    value.choiceIds.every(isNonEmptyString)
  );
}

function isOrderItem(value: unknown) {
  return (
    isRecord(value) &&
    isNonEmptyString(value.menuId) &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    Array.isArray(value.selectedOptionGroups) &&
    value.selectedOptionGroups.every(isSelectedOptionGroup)
  );
}

function isPointAccrual(
  value: unknown,
): value is OrderDraftConfirmationPayload["order"]["pointAccrual"] {
  return (
    isRecord(value) &&
    typeof value.enabled === "boolean" &&
    (value.phone === undefined ||
      value.phone === null ||
      typeof value.phone === "string")
  );
}

function normalizeConfirmationPayload(
  value: unknown,
): OrderDraftConfirmationPayload | undefined {
  if (!isRecord(value) || !isNonEmptyString(value.draftId)) {
    return undefined;
  }

  const order = isRecord(value.order) ? value.order : null;

  if (
    !order ||
    !isNonEmptyString(order.companyId) ||
    !isNonEmptyString(order.userId) ||
    !Array.isArray(order.items) ||
    !order.items.every(isOrderItem) ||
    !isFulfillmentType(order.fulfillmentType) ||
    !isPaymentMethod(order.paymentMethod) ||
    !isPointAccrual(order.pointAccrual)
  ) {
    return undefined;
  }

  return {
    draftId: value.draftId.trim(),
    order: {
      companyId: order.companyId.trim(),
      userId: order.userId.trim(),
      sourceChannel: "dajeong_ai",
      items: order.items,
      fulfillmentType: order.fulfillmentType,
      paymentMethod: order.paymentMethod,
      pointAccrual: order.pointAccrual,
    },
  };
}

function normalizeRequestBody(value: unknown): ConfirmOrderRequest | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const confirmationPayload = normalizeConfirmationPayload(
    value.confirmationPayload,
  );

  if (!confirmationPayload) {
    return undefined;
  }

  return {
    confirmationPayload,
    ...(typeof value.conversationId === "string"
      ? { conversationId: value.conversationId }
      : {}),
  };
}

function createErrorResponse(
  message: string,
  conversationId?: string,
): ChatResponse {
  return {
    message,
    cards: [
      {
        type: "error",
        title: "주문 확정 실패",
        message,
        recoverable: true,
        actions: [
          {
            type: "retry",
            label: "다시 시도",
          },
        ],
      },
    ],
    requiredUserAction: true,
    ...(conversationId ? { conversationId } : {}),
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse confirm-order request JSON", error);

    return Response.json(createErrorResponse("Invalid confirm-order request."), {
      status: 400,
    });
  }

  const normalizedBody = normalizeRequestBody(body);

  if (!normalizedBody) {
    return Response.json(createErrorResponse("Invalid confirm-order request."), {
      status: 400,
    });
  }

  try {
    const order = await trustedConfirmDajeongOrder(
      normalizedBody.confirmationPayload,
    );
    const message = `주문이 접수되었습니다. 주문번호 ${order.orderNumber}, 대기번호 ${order.waitingNumber}번입니다.`;

    return Response.json(
      {
        message,
        cards: [
          {
            type: "order_confirmed",
            title: "주문 접수 완료",
            orderNumber: order.orderNumber,
            waitingNumber: order.waitingNumber,
            status: order.status,
            totalPrice: order.totalPrice,
            message,
          },
        ],
        requiredUserAction: false,
        ...(normalizedBody.conversationId
          ? { conversationId: normalizedBody.conversationId }
          : {}),
      } satisfies ChatResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Trusted order confirmation failed", error);

    return Response.json(
      createErrorResponse(
        "주문 확정을 처리하지 못했습니다. 다시 시도해 주세요.",
        normalizedBody.conversationId,
      ),
      { status: 500 },
    );
  }
}
