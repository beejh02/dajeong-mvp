"use client";

type KioskCheckoutPanelProps = {
  phone: string;
  totalPrice: number;
  isOrdering: boolean;
  formatPrice: (price: number) => string;
  onCancel: () => void;
  onPhoneChange: (phone: string) => void;
  onSubmitWithPoints: () => void;
  onSubmitWithoutPoints: () => void;
};

export default function KioskCheckoutPanel({
  phone,
  totalPrice,
  isOrdering,
  formatPrice,
  onCancel,
  onPhoneChange,
  onSubmitWithPoints,
  onSubmitWithoutPoints,
}: KioskCheckoutPanelProps) {
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
            <p className="kiosk-option-kicker">POINT</p>
            <h2 id="kiosk-checkout-title">포인트 적립</h2>
          </div>
          <strong>₩ {formatPrice(totalPrice)}</strong>
        </div>

        <p className="kiosk-checkout-copy">
          전화번호를 입력하면 주문 완료 후 포인트 적립 예정으로 표시됩니다.
        </p>

        <label className="kiosk-phone-field">
          <span>전화번호</span>
          <input
            type="tel"
            inputMode="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(event) =>
              onPhoneChange(event.currentTarget.value.replace(/[^\d-]/g, ""))
            }
            disabled={isOrdering}
          />
        </label>

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
            className="kiosk-secondary-btn"
            onClick={onSubmitWithoutPoints}
            disabled={isOrdering}
          >
            적립 없이 주문
          </button>
          <button
            type="button"
            className="kiosk-primary-btn"
            onClick={onSubmitWithPoints}
            disabled={isOrdering || phone.trim().length === 0}
          >
            {isOrdering ? "주문 중..." : "포인트 적립 후 주문"}
          </button>
        </div>
      </div>
    </section>
  );
}
