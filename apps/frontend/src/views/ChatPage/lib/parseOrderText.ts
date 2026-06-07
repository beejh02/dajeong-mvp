import type { ParsedOrderIntent } from "../types";

type KeywordRule = {
  keyword: string;
  terms: string[];
};

const MENU_KEYWORD_RULES: KeywordRule[] = [
  { keyword: "불고기", terms: ["불고기"] },
  { keyword: "새우", terms: ["새우"] },
  { keyword: "클래식", terms: ["클래식"] },
  { keyword: "샐러드", terms: ["샐러드"] },
  { keyword: "포테이토", terms: ["포테이토", "감자세트"] },
];

const OPTION_KEYWORD_RULES: KeywordRule[] = [
  { keyword: "번 굽기", terms: ["번굽기", "구워", "구운", "토스트"] },
  { keyword: "일반", terms: ["일반"] },
  { keyword: "제로콜라", terms: ["제로콜라", "제로"] },
  { keyword: "콜라 L", terms: ["콜라l", "콜라라지", "큰콜라"] },
  { keyword: "콜라", terms: ["콜라"] },
  { keyword: "감자튀김", terms: ["감자튀김", "감튀"] },
];

const KOREAN_QUANTITIES = [
  { value: 1, terms: ["하나", "한개", "한잔", "한"] },
  { value: 2, terms: ["두개", "두잔", "둘", "두"] },
  { value: 3, terms: ["세개", "세잔", "셋", "세"] },
  { value: 4, terms: ["네개", "네잔", "넷", "네"] },
];

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

function includesAny(normalizedText: string, terms: string[]) {
  return terms.some((term) => normalizedText.includes(normalizeText(term)));
}

function detectCompanyId(text: string, normalizedText: string) {
  if (
    normalizedText.includes("a기업") ||
    normalizedText.includes("에이") ||
    /(^|[^a-z0-9가-힣])a(?=$|[^a-z0-9가-힣])/i.test(text)
  ) {
    return "company-a";
  }

  if (
    normalizedText.includes("b기업") ||
    normalizedText.includes("비") ||
    /(^|[^a-z0-9가-힣])b(?=$|[^a-z0-9가-힣])/i.test(text)
  ) {
    return "company-b";
  }

  return null;
}

function detectMenuKeyword(normalizedText: string) {
  return (
    MENU_KEYWORD_RULES.find((rule) => includesAny(normalizedText, rule.terms))
      ?.keyword ?? null
  );
}

function detectOptionKeywords(normalizedText: string) {
  const keywords: string[] = [];

  for (const rule of OPTION_KEYWORD_RULES) {
    if (
      rule.keyword === "콜라" &&
      keywords.some((keyword) => keyword === "제로콜라" || keyword === "콜라 L")
    ) {
      continue;
    }

    if (includesAny(normalizedText, rule.terms)) {
      keywords.push(rule.keyword);
    }
  }

  return keywords;
}

function detectQuantity(text: string, normalizedText: string) {
  const digitMatch = text.match(/([1-9]\d*)\s*(개|잔|인분)?/);

  if (digitMatch) {
    return {
      quantity: Math.max(1, Number(digitMatch[1])),
      quantityMentioned: true,
    };
  }

  const koreanQuantity = KOREAN_QUANTITIES.find((quantity) =>
    includesAny(normalizedText, quantity.terms),
  );

  if (koreanQuantity) {
    return {
      quantity: koreanQuantity.value,
      quantityMentioned: true,
    };
  }

  return {
    quantity: 1,
    quantityMentioned: false,
  };
}

function detectFulfillmentType(normalizedText: string) {
  if (includesAny(normalizedText, ["포장", "가져갈게", "픽업"])) {
    return {
      fulfillmentType: "pickup" as const,
      fulfillmentTypeMentioned: true,
    };
  }

  if (includesAny(normalizedText, ["매장", "먹고갈게", "여기서"])) {
    return {
      fulfillmentType: "dine_in" as const,
      fulfillmentTypeMentioned: true,
    };
  }

  return {
    fulfillmentType: "dine_in" as const,
    fulfillmentTypeMentioned: false,
  };
}

function detectPaymentMethod(normalizedText: string) {
  if (normalizedText.includes("쿠폰")) {
    return {
      paymentMethod: "coupon" as const,
      paymentMethodMentioned: true,
    };
  }

  if (normalizedText.includes("현금")) {
    return {
      paymentMethod: "cash" as const,
      paymentMethodMentioned: true,
    };
  }

  if (normalizedText.includes("카드")) {
    return {
      paymentMethod: "credit_card" as const,
      paymentMethodMentioned: true,
    };
  }

  return {
    paymentMethod: "credit_card" as const,
    paymentMethodMentioned: false,
  };
}

function detectPointAccrual(text: string, normalizedText: string) {
  const phoneMatch = text.match(/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/);

  if (normalizedText.includes("적립") && phoneMatch) {
    return {
      enabled: true,
      phone: phoneMatch[0],
    };
  }

  return {
    enabled: false,
    phone: null,
  };
}

function mergeOptionKeywords(
  previousKeywords: string[],
  nextKeywords: string[],
) {
  return Array.from(new Set([...previousKeywords, ...nextKeywords]));
}

export function parseOrderText(text: string): ParsedOrderIntent {
  const normalizedText = normalizeText(text);
  const quantity = detectQuantity(text, normalizedText);
  const fulfillment = detectFulfillmentType(normalizedText);
  const payment = detectPaymentMethod(normalizedText);

  return {
    companyId: detectCompanyId(text, normalizedText),
    menuKeyword: detectMenuKeyword(normalizedText),
    optionKeywords: detectOptionKeywords(normalizedText),
    quantity: quantity.quantity,
    quantityMentioned: quantity.quantityMentioned,
    fulfillmentType: fulfillment.fulfillmentType,
    fulfillmentTypeMentioned: fulfillment.fulfillmentTypeMentioned,
    paymentMethod: payment.paymentMethod,
    paymentMethodMentioned: payment.paymentMethodMentioned,
    pointAccrual: detectPointAccrual(text, normalizedText),
  };
}

export function mergeParsedOrderIntent(
  previousIntent: ParsedOrderIntent | null,
  nextIntent: ParsedOrderIntent,
): ParsedOrderIntent {
  if (!previousIntent) return nextIntent;

  return {
    companyId: nextIntent.companyId ?? previousIntent.companyId,
    menuKeyword: nextIntent.menuKeyword ?? previousIntent.menuKeyword,
    optionKeywords: mergeOptionKeywords(
      previousIntent.optionKeywords,
      nextIntent.optionKeywords,
    ),
    quantity: nextIntent.quantityMentioned
      ? nextIntent.quantity
      : previousIntent.quantity,
    quantityMentioned:
      previousIntent.quantityMentioned || nextIntent.quantityMentioned,
    fulfillmentType: nextIntent.fulfillmentTypeMentioned
      ? nextIntent.fulfillmentType
      : previousIntent.fulfillmentType,
    fulfillmentTypeMentioned:
      previousIntent.fulfillmentTypeMentioned ||
      nextIntent.fulfillmentTypeMentioned,
    paymentMethod: nextIntent.paymentMethodMentioned
      ? nextIntent.paymentMethod
      : previousIntent.paymentMethod,
    paymentMethodMentioned:
      previousIntent.paymentMethodMentioned ||
      nextIntent.paymentMethodMentioned,
    pointAccrual: nextIntent.pointAccrual.enabled
      ? nextIntent.pointAccrual
      : previousIntent.pointAccrual,
  };
}
