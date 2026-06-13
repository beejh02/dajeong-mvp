import type {
  CardAction,
  ChatResponse,
  DajeongCard,
  MenuCandidatesCard,
  OrderDraftCard,
} from "./cardSchema";

const MAX_MENU_CANDIDATES = 5;
const DEFAULT_MESSAGE_TITLE = "다정 AI";

export type CapturedDajeongToolResult = {
  toolInput: unknown;
  toolResult: unknown;
};

type DajeongToolInput = {
  toolName: string;
};

type CreateOrderDraftResultLike = {
  draftId: string;
  companyName: string;
  items: DraftItemLike[];
  totalPrice: number;
  recommendedCardType: "order_draft";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDajeongToolInput(value: unknown): value is DajeongToolInput {
  return isRecord(value) && typeof value.toolName === "string";
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

export function createOrderDraftCard(
  result: unknown,
): OrderDraftCard | undefined {
  if (!isCreateOrderDraftResultLike(result)) {
    return undefined;
  }

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
    actions: [
      { type: "confirm", label: "주문 확정" },
      { type: "edit", label: "수정" },
      { type: "reject", label: "취소" },
    ],
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
    message: "원하는 메뉴를 선택해 주세요.",
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
      return createOrderDraftCard(capturedResult.toolResult);
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

export function createChatResponseFromToolResults(
  message: string,
  capturedResults: readonly CapturedDajeongToolResult[],
  conversationId?: string,
): ChatResponse {
  const card = [...capturedResults]
    .reverse()
    .map((capturedResult) => createCardFromCapturedResult(message, capturedResult))
    .find((candidateCard): candidateCard is DajeongCard => candidateCard !== undefined);
  const cards = card ? [card] : [createMessageCard(message)];

  return {
    message,
    cards,
    requiredUserAction: cards.some(cardRequiresUserAction),
    ...(conversationId ? { conversationId } : {}),
  };
}
