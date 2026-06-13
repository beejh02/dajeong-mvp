import type { ChatMessage } from "../types";
import {
  ChatCardRenderer,
  type ChatCardActionPayload,
} from "./ChatCardRenderer";

type ChatMessageListProps = {
  messages: ChatMessage[];
  onCardAction: (payload: ChatCardActionPayload) => void;
};

export function ChatMessageList({
  messages,
  onCardAction,
}: ChatMessageListProps) {
  return (
    <div className="chat-message-list" aria-live="polite">
      {messages.map((message) => (
        <div
          className={`chat-message chat-message-${message.role}`}
          key={message.id}
        >
          <span className="chat-message-role">
            {message.role === "assistant" ? "다정" : "사용자"}
          </span>
          <p>{message.content}</p>
          {message.cards?.length ? (
            <div className="chat-card-list">
              {message.cards.map((card, index) => (
                <ChatCardRenderer
                  card={card}
                  key={`${message.id}-${card.type}-${index}`}
                  onAction={onCardAction}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
