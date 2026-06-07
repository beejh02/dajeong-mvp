"use client";

import type { FormEvent } from "react";

type ChatInputProps = {
  disabled: boolean;
  inputValue: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatInput({
  disabled,
  inputValue,
  onChange,
  onSubmit,
}: ChatInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        aria-label="주문 메시지"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예: A기업 불고기버거 하나 제로콜라로 주문해줘"
        type="text"
        value={inputValue}
      />
      <button disabled={disabled || inputValue.trim().length === 0} type="submit">
        보내기
      </button>
    </form>
  );
}
