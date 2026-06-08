"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { getCompanyMenus } from "../../lib/api/menus";
import { createOrder } from "../../lib/api/orders";
import type { MenuListResponse } from "../../lib/api/types";
import { ChatInput } from "./components/ChatInput";
import { ChatMessageList } from "./components/ChatMessageList";
import { OrderDraftCard } from "./components/OrderDraftCard";
import { buildOrderDraft } from "./lib/buildOrderDraft";
import { extractOrderIntent } from "./lib/extractOrderIntent";
import { mergeParsedOrderIntent } from "./lib/parseOrderText";
import {
  buildOrderCreateRequest,
  validateOrderDraft,
} from "./lib/validateOrderDraft";
import type {
  ChatMenuCache,
  ChatMessage,
  OrderDraft,
  ParsedOrderIntent,
} from "./types";

const DEMO_USER_ID = "user-demo-1";
const INITIAL_ASSISTANT_MESSAGE =
  "안녕하세요. 어떤 기업에서 무엇을 주문할까요?";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", INITIAL_ASSISTANT_MESSAGE),
  ]);
  const [inputValue, setInputValue] = useState("");
  const [draftOrder, setDraftOrder] = useState<OrderDraft | null>(null);
  const [pendingIntent, setPendingIntent] = useState<ParsedOrderIntent | null>(
    null,
  );
  const [menuCache, setMenuCache] = useState<ChatMenuCache>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const appendMessage = useCallback(
    (role: ChatMessage["role"], content: string) => {
      setMessages((currentMessages) => [
        ...currentMessages,
        createMessage(role, content),
      ]);
    },
    [],
  );

  const loadMenus = useCallback(
    async (companyId: string): Promise<MenuListResponse> => {
      const cachedMenus = menuCache[companyId];

      if (cachedMenus) return cachedMenus;

      const response = await getCompanyMenus(companyId);

      setMenuCache((currentCache) => ({
        ...currentCache,
        [companyId]: response,
      }));

      return response;
    },
    [menuCache],
  );

  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();

    if (!trimmedInput || isLoading) return;

    setInputValue("");
    setErrorMessage(null);
    appendMessage("user", trimmedInput);

    const parsedIntent = await extractOrderIntent(trimmedInput);
    const nextIntent = mergeParsedOrderIntent(pendingIntent, parsedIntent);
    setPendingIntent(nextIntent);

    if (!nextIntent.companyId) {
      setDraftOrder(null);
      appendMessage("assistant", "A기업과 B기업 중 어디에서 주문할까요?");
      return;
    }

    setIsLoading(true);

    try {
      const menuResponse = await loadMenus(nextIntent.companyId);
      const result = buildOrderDraft(nextIntent, menuResponse);

      appendMessage("assistant", result.message);

      if (result.status === "ready") {
        setDraftOrder(result.draft);
      } else {
        setDraftOrder(null);
      }
    } catch {
      setDraftOrder(null);
      setErrorMessage("메뉴를 불러오지 못했습니다. Backend API 연결을 확인하세요.");
      appendMessage(
        "assistant",
        "메뉴를 불러오지 못했습니다. Backend API 연결을 확인하세요.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [appendMessage, inputValue, isLoading, loadMenus, pendingIntent]);

  const handleConfirmOrder = useCallback(async () => {
    if (!draftOrder || isOrdering) return;

    const validationMessage = validateOrderDraft(draftOrder);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      appendMessage("assistant", validationMessage);
      return;
    }

    setIsOrdering(true);
    setErrorMessage(null);

    try {
      const order = await createOrder(
        buildOrderCreateRequest(draftOrder, DEMO_USER_ID, "dajeong_ai"),
      );

      appendMessage(
        "assistant",
        `주문이 접수되었습니다. 주문번호 ${order.orderNumber}, 대기번호 ${order.waitingNumber}번입니다.`,
      );
      setDraftOrder(null);
      setPendingIntent(null);
    } catch {
      const message =
        "주문을 접수하지 못했습니다. Backend API 연결 또는 주문 옵션을 확인해 주세요.";

      setErrorMessage(message);
      appendMessage("assistant", message);
    } finally {
      setIsOrdering(false);
    }
  }, [appendMessage, draftOrder, isOrdering]);

  const handleCancelDraft = useCallback(() => {
    setDraftOrder(null);
    setPendingIntent(null);
    appendMessage("assistant", "주문 초안을 취소했습니다. 다시 주문해 주세요.");
  }, [appendMessage]);

  const handleEditDraft = useCallback(() => {
    setDraftOrder(null);
    appendMessage("assistant", "수정할 내용을 입력해 주세요.");
  }, [appendMessage]);

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div>
          <span className="chat-eyebrow">DAJEONG AI</span>
          <h1>다정 AI 주문</h1>
          <p>자연어로 메뉴와 옵션을 고르면 주문 초안을 만들어 드립니다.</p>
        </div>
        <Link className="chat-home-link" href="/">
          홈으로
        </Link>
      </header>

      <main className="chat-layout">
        <section className="chat-panel">
          <ChatMessageList messages={messages} />
          {isLoading ? (
            <p className="chat-status">다정이 메뉴를 확인하는 중입니다.</p>
          ) : null}
          {errorMessage ? <p className="chat-error">{errorMessage}</p> : null}
          <ChatInput
            disabled={isLoading || isOrdering}
            inputValue={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </section>

        {draftOrder ? (
          <OrderDraftCard
            draftOrder={draftOrder}
            isOrdering={isOrdering}
            onCancel={handleCancelDraft}
            onConfirm={handleConfirmOrder}
            onEdit={handleEditDraft}
          />
        ) : (
          <aside className="chat-empty-draft">
            <span>주문 초안</span>
            <p>기업, 메뉴, 필수 옵션이 확인되면 이곳에 카드가 표시됩니다.</p>
          </aside>
        )}
      </main>
    </div>
  );
}
