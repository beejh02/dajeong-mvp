import type {
  FulfillmentType,
  PaymentMethod,
  PointAccrualRequest,
} from "../lib/api/types";

export type KioskCheckoutState = {
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  pointAccrual: PointAccrualRequest;
};

export const FULFILLMENT_OPTIONS: Array<{
  value: FulfillmentType;
  label: string;
}> = [
  { value: "dine_in", label: "매장에서 먹기" },
  { value: "pickup", label: "픽업해가기" },
];

export const FULFILLMENT_TYPE_LABELS: Record<FulfillmentType, string> = {
  dine_in: "매장에서 먹기",
  pickup: "픽업해가기",
};

export const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  { value: "credit_card", label: "신용카드" },
  { value: "coupon", label: "쿠폰으로 결제하기" },
  { value: "cash", label: "현금결제하기" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: "신용카드",
  coupon: "쿠폰",
  cash: "현금",
};
