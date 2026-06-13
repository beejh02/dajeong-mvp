"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type {
  CardActionType,
  ChatResponse,
  DajeongCard,
} from "../../lib/gemini/cardSchema";
import { ChatInput } from "./components/ChatInput";
import { ChatMessageList } from "./components/ChatMessageList";
import type { ChatMessage } from "./types";

const INITIAL_ASSISTANT_MESSAGE =
  "안녕하세요. 어떤 기업에서 무엇을 주문할까요?";
const CHAT_ERROR_MESSAGE =
  "채팅 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const CONFIRM_DRAFT_MESSAGE =
  "주문 확정 처리는 다음 단계에서 연결합니다. 현재는 주문 초안 확인까지만 가능합니다.";
const EDIT_DRAFT_MESSAGE = "수정할 내용을 입력해 주세요.";
const REJECT_DRAFT_MESSAGE = "주문 초안을 취소했습니다. 다시 주문해 주세요.";

const DAJEONG_CARD_TYPES = new Set([
  "message",
  "menu_candidates",
  "missing_option",
  "order_draft",
  "order_confirmed",
  "error",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDajeongCard(value: unknown): value is DajeongCard {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    DAJEONG_CARD_TYPES.has(value.type)
  );
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

  const body: unknown = await response.json();

  if (!isChatResponse(body)) {
    throw new Error("Invalid chat response");
  }

  return body;
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

  const handleSubmit = useCallback(() => {
    const trimmedInput = inputValue.trim();

    if (!trimmedInput || isLoading) return;

    setInputValue("");
    void sendUserMessage(trimmedInput);
  }, [inputValue, isLoading, sendUserMessage]);

  const handleCardAction = useCallback(
    (actionType: CardActionType, value?: string, label?: string) => {
      if (actionType === "confirm") {
        appendMessage("assistant", CONFIRM_DRAFT_MESSAGE);
        return;
      }

      if (actionType === "edit") {
        appendMessage("assistant", EDIT_DRAFT_MESSAGE);
        return;
      }

      if (actionType === "reject") {
        appendMessage("assistant", REJECT_DRAFT_MESSAGE);
        return;
      }

      const actionText = value ?? label;

      if (!actionText) return;

      if (actionType === "select_menu") {
        void sendUserMessage(`메뉴로 선택할게: ${actionText}`);
        return;
      }

      void sendUserMessage(actionText);
    },
    [appendMessage, sendUserMessage],
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
