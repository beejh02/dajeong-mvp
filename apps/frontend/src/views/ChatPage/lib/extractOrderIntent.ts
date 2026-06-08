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

function isParsedOrderIntent(value: unknown): value is ParsedOrderIntent {
  if (!isRecord(value)) return false;

  return REQUIRED_INTENT_FIELDS.every((field) => field in value);
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
