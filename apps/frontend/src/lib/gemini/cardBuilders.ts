import type {
  CardAction,
  ChatResponse,
  DajeongCard,
  MenuCandidatesCard,
  MissingOptionCard,
  OrderDraftCard,
  OrderDraftConfirmationPayload,
} from "./cardSchema";

const MAX_MENU_CANDIDATES = 5;
const MENU_CANDIDATES_RESPONSE_MESSAGE =
  "아래 메뉴 중 원하는 항목을 선택해 주세요.";
const MISSING_OPTION_RESPONSE_MESSAGE =
  "선택하신 메뉴에 필요한 옵션을 골라 주세요.";
const ORDER_DRAFT_RESPONSE_MESSAGE = "주문 초안을 확인해 주세요.";
const STRUCTURED_TEXT_FALLBACK_MESSAGE =
  "요청을 처리했습니다. 필요한 내용을 다시 입력해 주세요.";
const DEFAULT_MESSAGE_TITLE = "다정 AI";

export type CapturedDajeongToolResult = {
  toolInput: unknown;
  toolResult: unknown;
};

type DajeongToolInput = {
  toolName: string;
  arguments?: unknown;
};

type CreateOrderDraftResultLike = {
  draftId: string;
  companyName: string;
  items: DraftItemLike[];
  totalPrice: number;
  recommendedCardType: "order_draft";
};

type MissingOptionChoiceLike = {
  id: string;
  name: string;
  priceDelta: number;
};

type MissingOptionResultLike = {
  recommendedCardType: "missing_option";
  menuId: string;
  menuName: string;
  optionGroupId: string;
  optionGroupTitle: string;
  choices: MissingOptionChoiceLike[];
};

type DraftItemLike = {
  menuName: string;
  quantity: number;
  selectedOptions: SelectedOptionGroupLike[];
  itemPrice: number;
};

type SelectedOptionGroupLike = {
  groupTitle: string;
  choices: Array<{
    name: string;
  }>;
};

type MenuCandidateLike = {
  id: string;
  name: string;
  price: number;
  description: string;
  isAvailable: boolean;
};

type OrderDraftToolArguments = OrderDraftConfirmationPayload["order"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDajeongToolInput(value: unknown): value is DajeongToolInput {
  return isRecord(value) && typeof value.toolName === "string";
}

function isFulfillmentType(value: unknown): value is OrderDraftToolArguments["fulfillmentType"] {
  return value === "dine_in" || value === "pickup";
}

function isPaymentMethod(value: unknown): value is OrderDraftToolArguments["paymentMethod"] {
  return value === "credit_card" || value === "coupon" || value === "cash";
}

function isPointAccrualRequestLike(
  value: unknown,
): value is OrderDraftToolArguments["pointAccrual"] {
  return (
    isRecord(value) &&
    typeof value.enabled === "boolean" &&
    (value.phone === undefined ||
      value.phone === null ||
      typeof value.phone === "string")
  );
}

function isSelectedOptionGroupRequestLike(
  value: unknown,
): value is OrderDraftToolArguments["items"][number]["selectedOptionGroups"][number] {
  return (
    isRecord(value) &&
    typeof value.groupId === "string" &&
    Array.isArray(value.choiceIds) &&
    value.choiceIds.every((choiceId) => typeof choiceId === "string")
  );
}

function isOrderItemRequestLike(
  value: unknown,
): value is OrderDraftToolArguments["items"][number] {
  return (
    isRecord(value) &&
    typeof value.menuId === "string" &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    Array.isArray(value.selectedOptionGroups) &&
    value.selectedOptionGroups.every(isSelectedOptionGroupRequestLike)
  );
}

function isOrderDraftToolArguments(
  value: unknown,
): value is OrderDraftToolArguments {
  return (
    isRecord(value) &&
    typeof value.companyId === "string" &&
    typeof value.userId === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isOrderItemRequestLike) &&
    isFulfillmentType(value.fulfillmentType) &&
    isPaymentMethod(value.paymentMethod) &&
    isPointAccrualRequestLike(value.pointAccrual)
  );
}

function isSelectedOptionGroupLike(
  value: unknown,
): value is SelectedOptionGroupLike {
  if (!isRecord(value) || typeof value.groupTitle !== "string") {
    return false;
  }

  return (
    Array.isArray(value.choices) &&
    value.choices.every(
      (choice) => isRecord(choice) && typeof choice.name === "string",
    )
  );
}

function isDraftItemLike(value: unknown): value is DraftItemLike {
  return (
    isRecord(value) &&
    typeof value.menuName === "string" &&
    typeof value.quantity === "number" &&
    typeof value.itemPrice === "number" &&
    Array.isArray(value.selectedOptions) &&
    value.selectedOptions.every(isSelectedOptionGroupLike)
  );
}

function isCreateOrderDraftResultLike(
  value: unknown,
): value is CreateOrderDraftResultLike {
  return (
    isRecord(value) &&
    value.recommendedCardType === "order_draft" &&
    typeof value.draftId === "string" &&
    typeof value.companyName === "string" &&
    typeof value.totalPrice === "number" &&
    Array.isArray(value.items) &&
    value.items.every(isDraftItemLike)
  );
}

function isMissingOptionChoiceLike(
  value: unknown,
): value is MissingOptionChoiceLike {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.priceDelta === "number"
  );
}

function isMissingOptionResultLike(
  value: unknown,
): value is MissingOptionResultLike {
  return (
    isRecord(value) &&
    value.recommendedCardType === "missing_option" &&
    typeof value.menuId === "string" &&
    typeof value.menuName === "string" &&
    typeof value.optionGroupId === "string" &&
    typeof value.optionGroupTitle === "string" &&
    Array.isArray(value.choices) &&
    value.choices.every(isMissingOptionChoiceLike)
  );
}

function isMenuCandidateLike(value: unknown): value is MenuCandidateLike {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    typeof value.description === "string" &&
    typeof value.isAvailable === "boolean"
  );
}

function extractMenuCandidates(value: unknown): MenuCandidateLike[] {
  if (!isRecord(value) || !Array.isArray(value.menus)) {
    return [];
  }

  return value.menus.filter(isMenuCandidateLike);
}

function formatSelectedOptions(
  selectedOptions: SelectedOptionGroupLike[],
): string[] {
  return selectedOptions.flatMap((selectedOption) => {
    const choiceNames = selectedOption.choices.map((choice) => choice.name);

    if (choiceNames.length === 0) {
      return [];
    }

    return [`${selectedOption.groupTitle}: ${choiceNames.join(", ")}`];
  });
}

function createConfirmationPayload(
  draftId: string,
  toolArguments: unknown,
): OrderDraftConfirmationPayload | undefined {
  if (!isOrderDraftToolArguments(toolArguments)) {
    return undefined;
  }

  return {
    draftId,
    order: {
      companyId: toolArguments.companyId,
      userId: toolArguments.userId,
      sourceChannel: "dajeong_ai",
      items: toolArguments.items,
      fulfillmentType: toolArguments.fulfillmentType,
      paymentMethod: toolArguments.paymentMethod,
      pointAccrual: toolArguments.pointAccrual,
    },
  };
}

export function createOrderDraftCard(
  result: unknown,
  toolArguments?: unknown,
): OrderDraftCard | undefined {
  if (!isCreateOrderDraftResultLike(result)) {
    return undefined;
  }

  const confirmationPayload = createConfirmationPayload(
    result.draftId,
    toolArguments,
  );

  return {
    type: "order_draft",
    title: "주문 초안",
    draftId: result.draftId,
    companyName: result.companyName,
    items: result.items.map((item) => ({
      menuName: item.menuName,
      quantity: item.quantity,
      options: formatSelectedOptions(item.selectedOptions),
      price: item.itemPrice,
    })),
    totalPrice: result.totalPrice,
    ...(confirmationPayload ? { confirmationPayload } : {}),
    actions: [
      { type: "confirm", label: "주문 확정" },
      { type: "edit", label: "수정" },
      { type: "reject", label: "취소" },
    ],
  };
}

function formatPriceDelta(priceDelta: number): string {
  if (priceDelta === 0) {
    return "";
  }

  const prefix = priceDelta > 0 ? "+" : "";

  return ` (${prefix}${priceDelta.toLocaleString("ko-KR")}원)`;
}

export function createMissingOptionCard(
  result: unknown,
): MissingOptionCard | undefined {
  if (!isMissingOptionResultLike(result) || result.choices.length === 0) {
    return undefined;
  }

  const options = result.choices.map((choice) => ({
    label: `${choice.name}${formatPriceDelta(choice.priceDelta)}`,
    value: choice.id,
  }));

  return {
    type: "missing_option",
    title: "옵션 선택",
    question: `${result.menuName}의 ${result.optionGroupTitle}을 골라 주세요.`,
    groupId: result.optionGroupId,
    options,
    actions: options.map<CardAction>((option) => ({
      type: "select_option",
      label: option.label,
      value: option.value,
    })),
  };
}

export function createMenuCandidatesCard(
  result: unknown,
): MenuCandidatesCard | undefined {
  const candidates = extractMenuCandidates(result)
    .filter((menu) => menu.isAvailable)
    .slice(0, MAX_MENU_CANDIDATES)
    .map((menu) => ({
      menuId: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
    }));

  if (candidates.length === 0) {
    return undefined;
  }

  return {
    type: "menu_candidates",
    title: "메뉴 후보",
    message: MENU_CANDIDATES_RESPONSE_MESSAGE,
    candidates,
    actions: candidates.map<CardAction>((candidate) => ({
      type: "select_menu",
      label: candidate.name,
      value: candidate.menuId,
    })),
  };
}

function shouldPresentCompanyMenusAsChoices(message: string): boolean {
  return /메뉴|후보|선택|골라|고르|원하는|추천/.test(message);
}

function createCardFromCapturedResult(
  message: string,
  capturedResult: CapturedDajeongToolResult,
): DajeongCard | undefined {
  if (!isDajeongToolInput(capturedResult.toolInput)) {
    return undefined;
  }

  switch (capturedResult.toolInput.toolName) {
    case "create_order_draft":
      return (
        createOrderDraftCard(
          capturedResult.toolResult,
          capturedResult.toolInput.arguments,
        ) ?? createMissingOptionCard(capturedResult.toolResult)
      );
    case "search_menu":
      return createMenuCandidatesCard(capturedResult.toolResult);
    case "get_company_menus":
      return shouldPresentCompanyMenusAsChoices(message)
        ? createMenuCandidatesCard(capturedResult.toolResult)
        : undefined;
    default:
      return undefined;
  }
}

function cardRequiresUserAction(card: DajeongCard): boolean {
  return (
    card.type === "order_draft" ||
    card.type === "menu_candidates" ||
    card.type === "missing_option"
  );
}

function createMessageCard(message: string): DajeongCard {
  return {
    type: "message",
    title: DEFAULT_MESSAGE_TITLE,
    message,
  };
}

function selectCardFromCapturedResults(
  message: string,
  capturedResults: readonly CapturedDajeongToolResult[],
): DajeongCard | undefined {
  const cardsByRecency = [...capturedResults]
    .reverse()
    .map((capturedResult) => createCardFromCapturedResult(message, capturedResult))
    .filter((candidateCard): candidateCard is DajeongCard => candidateCard !== undefined);

  for (const cardType of [
    "order_draft",
    "missing_option",
    "menu_candidates",
  ] satisfies DajeongCard["type"][]) {
    const card = cardsByRecency.find(
      (candidateCard) => candidateCard.type === cardType,
    );

    if (card) {
      return card;
    }
  }

  return cardsByRecency[0];
}

function isStructuredCardJsonText(message: string): boolean {
  const trimmed = message.trim();

  if (trimmed === "") {
    return false;
  }

  if (/^```(?:json)?/i.test(trimmed) || trimmed.includes("```json")) {
    return true;
  }

  if (trimmed.includes('"cards"') || trimmed.includes('"recommendedCardType"')) {
    return true;
  }

  const looksLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  return looksLikeJson && /"(message|cards|type|recommendedCardType)"/.test(trimmed);
}

function getCardResponseMessage(card: DajeongCard): string {
  switch (card.type) {
    case "order_draft":
      return ORDER_DRAFT_RESPONSE_MESSAGE;
    case "missing_option":
      return MISSING_OPTION_RESPONSE_MESSAGE;
    case "menu_candidates":
      return MENU_CANDIDATES_RESPONSE_MESSAGE;
    case "order_confirmed":
    case "error":
    case "message":
      return card.message;
    default:
      return STRUCTURED_TEXT_FALLBACK_MESSAGE;
  }
}

function createDisplayMessage(
  message: string,
  card: DajeongCard | undefined,
): string {
  if (card) {
    return getCardResponseMessage(card);
  }

  const trimmed = message.trim();

  if (trimmed === "" || isStructuredCardJsonText(trimmed)) {
    return STRUCTURED_TEXT_FALLBACK_MESSAGE;
  }

  return trimmed;
}

export function createChatResponseFromToolResults(
  message: string,
  capturedResults: readonly CapturedDajeongToolResult[],
  conversationId?: string,
): ChatResponse {
  const card = selectCardFromCapturedResults(message, capturedResults);
  const displayMessage = createDisplayMessage(message, card);
  const cards = card ? [card] : [createMessageCard(displayMessage)];

  return {
    message: displayMessage,
    cards,
    requiredUserAction: cards.some(cardRequiresUserAction),
    ...(conversationId ? { conversationId } : {}),
  };
}
