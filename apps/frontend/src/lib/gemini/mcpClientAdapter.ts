import { callDajeongMcpServerTool } from "../../../../mcp-server/src/index";
import { handleGeminiToolCall } from "./toolHandlers";
import type {
  ConfirmOrderArgs,
  ConfirmOrderResult,
  DajeongMcpToolResult,
} from "./toolHandlers";
import {
  dajeongMcpToolNames,
  type DajeongMcpGatewayInput,
  type DajeongMcpToolName,
} from "./tools";

type NormalizedDajeongMcpGatewayInput = DajeongMcpGatewayInput & {
  toolName: DajeongMcpToolName;
};

type DajeongMcpRuntimeMode = "local" | "server";

export function getDajeongMcpRuntimeMode(): DajeongMcpRuntimeMode {
  const value = process.env.DAJEONG_MCP_RUNTIME_MODE;

  return value === "server" ? "server" : "local";
}

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

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be a string array.`);
  }

  return value.map((item, index) =>
    requireNonEmptyString(item, `${fieldName}[${index}]`),
  );
}

function requireFulfillmentType(
  value: unknown,
): ConfirmOrderArgs["order"]["fulfillmentType"] {
  if (value !== "dine_in" && value !== "pickup") {
    throw new Error("fulfillmentType must be dine_in or pickup.");
  }

  return value;
}

function requirePaymentMethod(
  value: unknown,
): ConfirmOrderArgs["order"]["paymentMethod"] {
  if (value !== "credit_card" && value !== "coupon" && value !== "cash") {
    throw new Error("paymentMethod must be credit_card, coupon, or cash.");
  }

  return value;
}

function normalizeOrderItems(
  rawItems: unknown,
): ConfirmOrderArgs["order"]["items"] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("order.items must include at least one item.");
  }

  return rawItems.map((rawItem, itemIndex) => {
    const item = requireObject(rawItem, `order.items[${itemIndex}]`);

    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error(
        `order.items[${itemIndex}].quantity must be an integer greater than 0.`,
      );
    }

    if (!Array.isArray(item.selectedOptionGroups)) {
      throw new Error(
        `order.items[${itemIndex}].selectedOptionGroups must be an array.`,
      );
    }

    return {
      menuId: requireNonEmptyString(
        item.menuId,
        `order.items[${itemIndex}].menuId`,
      ),
      quantity: item.quantity,
      selectedOptionGroups: item.selectedOptionGroups.map(
        (rawGroup, groupIndex) => {
          const group = requireObject(
            rawGroup,
            `order.items[${itemIndex}].selectedOptionGroups[${groupIndex}]`,
          );

          return {
            groupId: requireNonEmptyString(
              group.groupId,
              `order.items[${itemIndex}].selectedOptionGroups[${groupIndex}].groupId`,
            ),
            choiceIds: requireStringArray(
              group.choiceIds,
              `order.items[${itemIndex}].selectedOptionGroups[${groupIndex}].choiceIds`,
            ),
          };
        },
      ),
    };
  });
}

function normalizePointAccrual(
  value: unknown,
): ConfirmOrderArgs["order"]["pointAccrual"] {
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
    phone: pointAccrual.phone ?? "",
  };
}

function normalizeTrustedConfirmArgs(input: unknown): ConfirmOrderArgs {
  const payload = requireObject(input, "confirmationPayload");
  const order = requireObject(payload.order, "confirmationPayload.order");

  return {
    draftId: requireNonEmptyString(payload.draftId, "confirmationPayload.draftId"),
    confirmedByUser: true,
    order: {
      companyId: requireNonEmptyString(
        order.companyId,
        "confirmationPayload.order.companyId",
      ),
      userId: requireNonEmptyString(
        order.userId,
        "confirmationPayload.order.userId",
      ),
      sourceChannel: "dajeong_ai",
      items: normalizeOrderItems(order.items),
      fulfillmentType: requireFulfillmentType(order.fulfillmentType),
      paymentMethod: requirePaymentMethod(order.paymentMethod),
      pointAccrual: normalizePointAccrual(order.pointAccrual),
    },
  };
}

function isDajeongMcpToolName(value: string): value is DajeongMcpToolName {
  return dajeongMcpToolNames.some((toolName) => toolName === value);
}

function normalizeGatewayInput(
  input: unknown,
): NormalizedDajeongMcpGatewayInput {
  if (!isRecord(input)) {
    throw new Error("MCP gateway input must be an object.");
  }

  if (typeof input.toolName !== "string" || input.toolName.trim() === "") {
    throw new Error("toolName is required.");
  }

  const toolName = input.toolName.trim();

  if (!isDajeongMcpToolName(toolName)) {
    throw new Error(`Unknown Dajeong MCP tool: ${toolName}`);
  }

  if (!isRecord(input.arguments)) {
    throw new Error("arguments must be an object.");
  }

  return {
    toolName,
    arguments: input.arguments,
  };
}

function normalizeConfirmOrderResult(value: unknown): ConfirmOrderResult {
  const result = requireObject(value, "confirm_order result");

  if (typeof result.waitingNumber !== "number") {
    throw new Error("confirm_order result.waitingNumber must be a number.");
  }

  if (typeof result.totalPrice !== "number") {
    throw new Error("confirm_order result.totalPrice must be a number.");
  }

  return {
    orderNumber: requireNonEmptyString(
      result.orderNumber,
      "confirm_order result.orderNumber",
    ),
    waitingNumber: result.waitingNumber,
    status: requireNonEmptyString(result.status, "confirm_order result.status"),
    totalPrice: result.totalPrice,
    recommendedCardType: "order_confirmed",
  };
}

export async function callDajeongMcpTool(
  input: unknown,
): Promise<DajeongMcpToolResult> {
  const normalizedInput = normalizeGatewayInput(input);

  if (normalizedInput.toolName === "confirm_order") {
    throw new Error(
      "confirm_order is not callable through the Gemini MCP gateway. Confirm orders only through the trusted UI confirmation route.",
    );
  }

  if (getDajeongMcpRuntimeMode() === "server") {
    return callDajeongMcpServerTool(
      normalizedInput.toolName,
      normalizedInput.arguments,
    );
  }

  // Local fallback remains the default until MCP transport wiring exists.
  return handleGeminiToolCall(
    normalizedInput.toolName,
    normalizedInput.arguments,
  );
}

export async function trustedConfirmDajeongOrder(
  input: unknown,
): Promise<ConfirmOrderResult> {
  const normalizedConfirmArgs = normalizeTrustedConfirmArgs(input);

  if (getDajeongMcpRuntimeMode() === "server") {
    return normalizeConfirmOrderResult(
      await callDajeongMcpServerTool("confirm_order", normalizedConfirmArgs),
    );
  }

  return handleGeminiToolCall(
    "confirm_order",
    normalizedConfirmArgs,
  ) as Promise<ConfirmOrderResult>;
}
