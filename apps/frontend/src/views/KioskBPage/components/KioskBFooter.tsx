"use client";

import { formatPrice } from "../constants";

type KioskBFooterProps = {
  cartItemCount: number;
  totalPrice: number;
  onOrder: () => void;
};

export default function KioskBFooter({
  cartItemCount,
  totalPrice,
  onOrder,
}: KioskBFooterProps) {
  return (
    <footer className="kiosk-b-footer">
      <div className="kiosk-b-total-box">
        <p>총 결제금액</p>
        <strong>₩ {formatPrice(totalPrice)}</strong>
      </div>

      <button
        type="button"
        className="kiosk-b-pay-btn"
        disabled={cartItemCount === 0}
        onClick={onOrder}
      >
        결제하기
      </button>
    </footer>
  );
}
