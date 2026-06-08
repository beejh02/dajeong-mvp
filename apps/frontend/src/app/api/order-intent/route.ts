import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const GEMINI_FLASH_MODEL = "gemini-2.5-flash";

const orderIntentSchema = z.object({
  companyId: z.enum(["company-a", "company-b"]).nullable().default(null),
  menuKeyword: z.string().nullable().default(null),
  optionKeywords: z.array(z.string()).default([]),
  quantity: z.number().int().positive().default(1),
  quantityMentioned: z.boolean().default(false),
  fulfillmentType: z.enum(["dine_in", "pickup"]).default("dine_in"),
  fulfillmentTypeMentioned: z.boolean().default(false),
  paymentMethod: z.enum(["credit_card", "coupon", "cash"]).default("credit_card"),
  paymentMethodMentioned: z.boolean().default(false),
  pointAccrual: z
    .object({
      enabled: z.boolean().default(false),
      phone: z.string().nullable().default(null),
    })
    .default({ enabled: false, phone: null }),
});

const INTENT_EXTRACTION_SYSTEM_PROMPT = `
You extract an order intent object from a Korean natural-language ordering sentence.
Return only an object that matches the schema. Do not create or confirm an actual order.

Rules:
- Do not invent menu IDs, option IDs, order IDs, menu-a-001, bun-normal, or similar identifiers.
- menuKeyword is a short natural-language search keyword for the menu the user wants.
- optionKeywords is an array of short natural-language search keywords for options the user mentioned.
- If the company is clear, normalize A기업, 에이기업, A company, or A to company-a, and B기업, 비기업, B company, or B to company-b.
- If the company is unclear, use companyId null.
- If the menu is unclear, use menuKeyword null.
- If options are absent or unclear, use optionKeywords [].
- If quantity is not mentioned, use quantity 1 and quantityMentioned false.
- If fulfillment type is not mentioned, use fulfillmentType "dine_in" and fulfillmentTypeMentioned false.
- If payment method is not mentioned, use paymentMethod "credit_card" and paymentMethodMentioned false.
- If the user clearly intends point accrual and provides a phone number, set pointAccrual.enabled true and put the phone number in pointAccrual.phone.
- If a phone number appears but point accrual intent is unclear, keep pointAccrual.enabled false.
`.trim();

function isRequestBody(value: unknown): value is { text: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "text" in value &&
    typeof value.text === "string" &&
    value.text.trim().length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRequestBody(body)) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "Gemini intent extraction is not configured yet" },
      { status: 503 },
    );
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const { object } = await generateObject({
      model: google(GEMINI_FLASH_MODEL),
      schema: orderIntentSchema,
      schemaName: "ParsedOrderIntent",
      schemaDescription:
        "Normalized intent extracted from a Korean ordering sentence for the Dajeong MVP.",
      system: INTENT_EXTRACTION_SYSTEM_PROMPT,
      prompt: `User ordering sentence:\n${body.text.trim()}`,
      temperature: 0,
    });

    return Response.json(orderIntentSchema.parse(object), { status: 200 });
  } catch (error) {
    console.error("Gemini intent extraction failed", error);

    return Response.json(
      { error: "Gemini intent extraction failed" },
      { status: 500 },
    );
  }
}
