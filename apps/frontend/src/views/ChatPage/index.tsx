"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type {
  CardAction,
  ChatResponse,
  DajeongCard,
  ErrorCard,
  MenuCandidatesCard,
  MessageCard,
  MissingOptionCard,
  OrderConfirmedCard,
  OrderDraftCard,
  OrderDraftConfirmationPayload,
} from "../../lib/gemini/cardSchema";
import { ChatInput } from "./components/ChatInput";
import type { ChatCardActionPayload } from "./components/ChatCardRenderer";
import { ChatMessageList } from "./components/ChatMessageList";
import type { ChatMessage } from "./types";

const INITIAL_ASSISTANT_MESSAGE =
  "안녕하세요. 어떤 기업에서 무엇을 주문할까요?";
const CHAT_ERROR_MESSAGE =
  "채팅 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const CONFIRM_ORDER_ERROR_MESSAGE =
  "주문 확정을 처리하지 못했습니다. 다시 시도해 주세요.";
const MISSING_CONFIRMATION_PAYLOAD_MESSAGE =
  "주문 확정에 필요한 정보가 부족합니다. 주문 초안을 다시 만들어 주세요.";
const EDIT_DRAFT_MESSAGE = "수정할 내용을 입력해 주세요.";
const REJECT_DRAFT_MESSAGE = "주문 초안을 취소했습니다. 다시 주문해 주세요.";

const CARD_ACTION_TYPES = new Set<CardAction["type"]>([
  "confirm",
  "edit",
  "reject",
  "select_option",
  "select_menu",
  "retry",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCardAction(value: unknown): value is CardAction {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    CARD_ACTION_TYPES.has(value.type as CardAction["type"]) &&
    typeof value.label === "string" &&
    (value.value === undefined || typeof value.value === "string")
  );
}

function isCardActionArray(value: unknown): value is CardAction[] {
  return Array.isArray(value) && value.every(isCardAction);
}

function isMessageCard(value: unknown): value is MessageCard {
  return (
    isRecord(value) &&
    value.type === "message" &&
    typeof value.title === "string" &&
    typeof value.message === "string"
  );
}

function isMenuCandidate(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.menuId === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    typeof value.description === "string"
  );
}

function isMenuCandidatesCard(value: unknown): value is MenuCandidatesCard {
  return (
    isRecord(value) &&
    value.type === "menu_candidates" &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isMenuCandidate) &&
    isCardActionArray(value.actions)
  );
}

function isMissingOption(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.value === "string"
  );
}

function isMissingOptionCard(value: unknown): value is MissingOptionCard {
  return (
    isRecord(value) &&
    value.type === "missing_option" &&
    typeof value.title === "string" &&
    typeof value.question === "string" &&
    typeof value.groupId === "string" &&
    Array.isArray(value.options) &&
    value.options.every(isMissingOption) &&
    isCardActionArray(value.actions)
  );
}

function isOrderDraftItem(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.menuName === "string" &&
    typeof value.quantity === "number" &&
    isStringArray(value.options) &&
    typeof value.price === "number"
  );
}

function isOrderDraftCard(value: unknown): value is OrderDraftCard {
  return (
    isRecord(value) &&
    value.type === "order_draft" &&
    typeof value.title === "string" &&
    typeof value.draftId === "string" &&
    typeof value.companyName === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isOrderDraftItem) &&
    typeof value.totalPrice === "number" &&
    isCardActionArray(value.actions)
  );
}

function isOrderConfirmedCard(value: unknown): value is OrderConfirmedCard {
  return (
    isRecord(value) &&
    value.type === "order_confirmed" &&
    typeof value.title === "string" &&
    typeof value.orderNumber === "string" &&
    typeof value.waitingNumber === "number" &&
    typeof value.status === "string" &&
    typeof value.totalPrice === "number" &&
    typeof value.message === "string"
  );
}

function isErrorCard(value: unknown): value is ErrorCard {
  return (
    isRecord(value) &&
    value.type === "error" &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    typeof value.recoverable === "boolean" &&
    (value.actions === undefined || isCardActionArray(value.actions))
  );
}

function isDajeongCard(value: unknown): value is DajeongCard {
  if (!isRecord(value)) return false;

  switch (value.type) {
    case "message":
      return isMessageCard(value);
    case "menu_candidates":
      return isMenuCandidatesCard(value);
    case "missing_option":
      return isMissingOptionCard(value);
    case "order_draft":
      return isOrderDraftCard(value);
    case "order_confirmed":
      return isOrderConfirmedCard(value);
    case "error":
      return isErrorCard(value);
    default:
      return false;
  }
}

function isChatResponse(value: unknown): value is ChatResponse {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    Array.isArray(value.cards) &&
    value.cards.every(isDajeongCard) &&
    typeof value.requiredUserAction === "boolean" &&
    (value.conversationId === undefined ||
      typeof value.conversationId === "string")
  );
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
  cards?: DajeongCard[],
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    ...(cards?.length ? { cards } : {}),
  };
}

async function requestChatResponse(
  message: string,
  conversationId: string | undefined,
) {
  const response = await fetch("/api/chat", {
    body: JSON.stringify({
      message,
      ...(conversationId ? { conversationId } : {}),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Chat request failed with ${response.status}`);
  }

  return parseChatResponseBody(response, "Invalid chat response");
}

async function parseChatResponseBody(response: Response, errorMessage: string) {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error(errorMessage);
  }

  if (!isChatResponse(body)) {
    throw new Error(errorMessage);
  }

  return body;
}

async function requestConfirmOrderResponse(
  confirmationPayload: OrderDraftConfirmationPayload,
  conversationId: string | undefined,
) {
  const response = await fetch("/api/chat/confirm-order", {
    body: JSON.stringify({
      confirmationPayload,
      ...(conversationId ? { conversationId } : {}),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseChatResponseBody(response, "Invalid confirm-order response");
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", INITIAL_ASSISTANT_MESSAGE),
  ]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appendMessage = useCallback(
    (role: ChatMessage["role"], content: string, cards?: DajeongCard[]) => {
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(role, content, cards),
      ]);
    },
    [],
  );

  const sendUserMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();

      if (!trimmedMessage || isLoading) return;

      setErrorMessage(null);
      setIsLoading(true);
      appendMessage("user", trimmedMessage);

      try {
        const chatResponse = await requestChatResponse(
          trimmedMessage,
          conversationId,
        );

        appendMessage(
          "assistant",
          chatResponse.message,
          chatResponse.cards,
        );

        if (chatResponse.conversationId) {
          setConversationId(chatResponse.conversationId);
        }
      } catch {
        setErrorMessage(CHAT_ERROR_MESSAGE);
        appendMessage("assistant", CHAT_ERROR_MESSAGE);
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, conversationId, isLoading],
  );

  const confirmOrderDraft = useCallback(
    async (card: OrderDraftCard) => {
      if (isLoading) return;

      if (!card.confirmationPayload) {
        setErrorMessage(MISSING_CONFIRMATION_PAYLOAD_MESSAGE);
        appendMessage("assistant", MISSING_CONFIRMATION_PAYLOAD_MESSAGE);
        return;
      }

      setErrorMessage(null);
      setIsLoading(true);

      try {
        const chatResponse = await requestConfirmOrderResponse(
          card.confirmationPayload,
          conversationId,
        );

        appendMessage(
          "assistant",
          chatResponse.message,
          chatResponse.cards,
        );

        if (chatResponse.conversationId) {
          setConversationId(chatResponse.conversationId);
        }
      } catch {
        setErrorMessage(CONFIRM_ORDER_ERROR_MESSAGE);
        appendMessage("assistant", CONFIRM_ORDER_ERROR_MESSAGE);
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, conversationId, isLoading],
  );

  const handleSubmit = useCallback(() => {
    const trimmedInput = inputValue.trim();

    if (!trimmedInput || isLoading) return;

    setInputValue("");
    void sendUserMessage(trimmedInput);
  }, [inputValue, isLoading, sendUserMessage]);

  const handleCardAction = useCallback(
    ({ action, card }: ChatCardActionPayload) => {
      if (action.type === "confirm") {
        if (card.type !== "order_draft") {
          appendMessage("assistant", MISSING_CONFIRMATION_PAYLOAD_MESSAGE);
          return;
        }

        void confirmOrderDraft(card);
        return;
      }

      if (action.type === "edit") {
        appendMessage("assistant", EDIT_DRAFT_MESSAGE);
        return;
      }

      if (action.type === "reject") {
        appendMessage("assistant", REJECT_DRAFT_MESSAGE);
        return;
      }

      const actionText = action.value ?? action.label;

      if (!actionText) return;

      if (action.type === "select_menu") {
        void sendUserMessage(`메뉴로 선택할게: ${actionText}`);
        return;
      }

      void sendUserMessage(actionText);
    },
    [appendMessage, confirmOrderDraft, sendUserMessage],
  );

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div>
          <span className="chat-eyebrow">DAJEONG AI</span>
          <h1>다정 AI 주문</h1>
          <p>대화 응답과 주문 후보 카드를 확인하며 주문 초안을 만들 수 있습니다.</p>
        </div>
        <Link className="chat-home-link" href="/">
          홈으로
        </Link>
      </header>

      <main className="chat-layout">
        <section className="chat-panel">
          <ChatMessageList
            messages={messages}
            onCardAction={handleCardAction}
          />
          {isLoading ? (
            <p className="chat-status">다정이 응답을 준비하는 중입니다.</p>
          ) : null}
          {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}
          <ChatInput
            disabled={isLoading}
            inputValue={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </section>

        <aside className="chat-empty-draft">
          <span>응답 카드</span>
          <p>메뉴 후보와 주문 초안은 대화 안의 카드로 표시됩니다.</p>
        </aside>
      </main>
    </div>
  );
}
