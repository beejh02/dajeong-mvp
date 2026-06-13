// This file expresses the card response contract from docs/ai-card-ui-contract.md
// as TypeScript types. order_draft is not an actual order and must only lead to
// confirm_order after a confirm action.

import type { OrderCreateRequest } from "../api/types";

export type CardActionType =
  | "confirm"
  | "edit"
  | "reject"
  | "select_option"
  | "select_menu"
  | "retry";

export type CardAction = {
  type: CardActionType;
  label: string;
  value?: string;
};

export type MessageCard = {
  type: "message";
  title: string;
  message: string;
};

export type MenuCandidatesCard = {
  type: "menu_candidates";
  title: string;
  message: string;
  candidates: Array<{
    menuId: string;
    name: string;
    price: number;
    description: string;
  }>;
  actions: CardAction[];
};

export type MissingOptionCard = {
  type: "missing_option";
  title: string;
  question: string;
  groupId: string;
  options: Array<{
    label: string;
    value: string;
  }>;
  actions: CardAction[];
};

export type OrderDraftConfirmationPayload = {
  draftId: string;
  order: Omit<OrderCreateRequest, "sourceChannel"> & {
    sourceChannel: "dajeong_ai";
  };
};

export type OrderDraftCard = {
  type: "order_draft";
  title: string;
  draftId: string;
  companyName: string;
  items: Array<{
    menuName: string;
    quantity: number;
    options: string[];
    price: number;
  }>;
  totalPrice: number;
  confirmationPayload?: OrderDraftConfirmationPayload;
  actions: CardAction[];
};

export type OrderConfirmedCard = {
  type: "order_confirmed";
  title: string;
  orderNumber: string;
  waitingNumber: number;
  status: string;
  totalPrice: number;
  message: string;
};

export type ErrorCard = {
  type: "error";
  title: string;
  message: string;
  recoverable: boolean;
  actions?: CardAction[];
};

export type DajeongCard =
  | MessageCard
  | MenuCandidatesCard
  | MissingOptionCard
  | OrderDraftCard
  | OrderConfirmedCard
  | ErrorCard;

export type ChatResponse = {
  message: string;
  cards: DajeongCard[];
  requiredUserAction: boolean;
  conversationId?: string;
};
