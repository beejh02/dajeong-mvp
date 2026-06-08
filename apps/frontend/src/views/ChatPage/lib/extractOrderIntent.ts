import type { ParsedOrderIntent } from "../types";
import { parseOrderText } from "./parseOrderText";

const REQUIRED_INTENT_FIELDS = [
  "companyId",
  "menuKeyword",
  "optionKeywords",
  "quantity",
  "quantityMentioned",
  "fulfillmentType",
  "fulfillmentTypeMentioned",
  "paymentMethod",
  "paymentMethodMentioned",
  "pointAccrual",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFulfillmentType(value: unknown) {
  return value === "dine_in" || value === "pickup";
}

function isPaymentMethod(value: unknown) {
  return value === "credit_card" || value === "coupon" || value === "cash";
}

function isPointAccrual(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.enabled === "boolean" &&
    isStringOrNull(value.phone)
  );
}

function isParsedOrderIntent(value: unknown): value is ParsedOrderIntent {
  if (!isRecord(value)) return false;

  return (
    REQUIRED_INTENT_FIELDS.every((field) => field in value) &&
    isStringOrNull(value.companyId) &&
    isStringOrNull(value.menuKeyword) &&
    isStringArray(value.optionKeywords) &&
    typeof value.quantity === "number" &&
    typeof value.quantityMentioned === "boolean" &&
    isFulfillmentType(value.fulfillmentType) &&
    typeof value.fulfillmentTypeMentioned === "boolean" &&
    isPaymentMethod(value.paymentMethod) &&
    typeof value.paymentMethodMentioned === "boolean" &&
    isPointAccrual(value.pointAccrual)
  );
}

export async function extractOrderIntent(
  text: string,
): Promise<ParsedOrderIntent> {
  try {
    const response = await fetch("/api/order-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (response.status !== 200) {
      return parseOrderText(text);
    }

    const intent: unknown = await response.json();

    if (!isParsedOrderIntent(intent)) {
      return parseOrderText(text);
    }

    return intent;
  } catch {
    return parseOrderText(text);
  }
}
