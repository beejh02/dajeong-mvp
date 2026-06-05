"use client";

import { useState } from "react";
import type {
  FulfillmentType,
  PaymentMethod,
  PointAccrualRequest,
} from "../../lib/api/types";
import { FULFILLMENT_OPTIONS, PAYMENT_OPTIONS } from "../kioskCheckout";

type CheckoutSubmitPayload = {
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  pointAccrual: PointAccrualRequest;
};

type KioskCheckoutPanelProps = {
  totalPrice: number;
  isOrdering: boolean;
  formatPrice: (price: number) => string;
  onCancel: () => void;
  onSubmit: (checkout: CheckoutSubmitPayload) => void;
};

export default function KioskCheckoutPanel({
  totalPrice,
  isOrdering,
  formatPrice,
  onCancel,
  onSubmit,
}: KioskCheckoutPanelProps) {
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [shouldAccruePoints, setShouldAccruePoints] = useState<boolean | null>(
    null,
  );
  const [phone, setPhone] = useState("");

  const normalizedPhone = phone.trim();
  const needsPhone = shouldAccruePoints === true;
  const validationMessage =
    !fulfillmentType
      ? "이용 방식을 선택해 주세요."
      : !paymentMethod
        ? "결제 방식을 선택해 주세요."
        : shouldAccruePoints === null
          ? "포인트 적립 여부를 선택해 주세요."
          : needsPhone && normalizedPhone.length === 0
            ? "포인트 적립 전화번호를 입력해 주세요."
            : null;
  const canSubmit = !isOrdering && !validationMessage;

  const submitCheckout = () => {
    if (!canSubmit || !fulfillmentType || !paymentMethod) {
      return;
    }

    const pointAccrual: PointAccrualRequest = needsPhone
      ? { enabled: true, phone: normalizedPhone }
      : { enabled: false, phone: null };

    onSubmit({
      fulfillmentType,
      paymentMethod,
      pointAccrual,
    });
  };

  return (
    <section
      className="kiosk-checkout-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kiosk-checkout-title"
    >
      <div className="kiosk-checkout-panel">
        <div className="kiosk-checkout-header">
          <div>
            <p className="kiosk-option-kicker">CHECKOUT</p>
            <h2 id="kiosk-checkout-title">주문 확인</h2>
          </div>
          <strong>₩ {formatPrice(totalPrice)}</strong>
        </div>

        <p className="kiosk-checkout-copy">
          이용 방식과 결제 방식을 선택한 뒤 포인트 적립 여부를 정해 주세요.
        </p>

        <div className="kiosk-checkout-step">
          <h3>이용 방식</h3>
          <div className="kiosk-checkout-choice-list">
            {FULFILLMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`kiosk-checkout-choice ${
                  fulfillmentType === option.value ? "active" : ""
                }`}
                aria-pressed={fulfillmentType === option.value}
                onClick={() => setFulfillmentType(option.value)}
                disabled={isOrdering}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="kiosk-checkout-step">
          <h3>결제 방식</h3>
          <div className="kiosk-checkout-choice-list">
            {PAYMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`kiosk-checkout-choice ${
                  paymentMethod === option.value ? "active" : ""
                }`}
                aria-pressed={paymentMethod === option.value}
                onClick={() => setPaymentMethod(option.value)}
                disabled={isOrdering}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="kiosk-checkout-step">
          <h3>포인트를 적립하시겠습니까?</h3>
          <div className="kiosk-checkout-choice-list">
            <button
              type="button"
              className={`kiosk-checkout-choice ${
                shouldAccruePoints === true ? "active" : ""
              }`}
              aria-pressed={shouldAccruePoints === true}
              onClick={() => setShouldAccruePoints(true)}
              disabled={isOrdering}
            >
              예, 적립할게요
            </button>
            <button
              type="button"
              className={`kiosk-checkout-choice ${
                shouldAccruePoints === false ? "active" : ""
              }`}
              aria-pressed={shouldAccruePoints === false}
              onClick={() => setShouldAccruePoints(false)}
              disabled={isOrdering}
            >
              아니요, 적립 없이 진행할게요
            </button>
          </div>
        </div>

        {needsPhone && (
          <label className="kiosk-phone-field">
            <span>전화번호</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(event) =>
                setPhone(event.currentTarget.value.replace(/[^\d-]/g, ""))
              }
              disabled={isOrdering}
            />
          </label>
        )}

        {validationMessage && (
          <p className="kiosk-option-validation" role="alert">
            {validationMessage}
          </p>
        )}

        <div className="kiosk-checkout-actions">
          <button
            type="button"
            className="kiosk-secondary-btn"
            onClick={onCancel}
            disabled={isOrdering}
          >
            취소
          </button>
          <button
            type="button"
            className="kiosk-primary-btn"
            onClick={submitCheckout}
            disabled={!canSubmit}
          >
            {isOrdering ? "주문을 접수하는 중입니다" : "주문 접수"}
          </button>
        </div>
      </div>
    </section>
  );
}
