import type { ChatMessage } from "../types";

type ChatMessageListProps = {
  messages: ChatMessage[];
};

export function ChatMessageList({ messages }: ChatMessageListProps) {
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
        </div>
      ))}
    </div>
  );
}
