"use client";

import { formatPrice } from "../constants";

type CartFooterProps = {
  cartItemCount: number;
  totalQuantity: number;
  totalPrice: number;
  isOrdering?: boolean;
  onOrder: () => void;
};

export default function CartFooter({
  cartItemCount,
  totalQuantity,
  totalPrice,
  isOrdering = false,
  onOrder,
}: CartFooterProps) {
  return (
    <footer className="cart-footer">
      <div className="cart-info">
        <p className="cart-count">선택한 메뉴 : {totalQuantity}개</p>
        <p className="cart-total">₩ {formatPrice(totalPrice)}</p>
      </div>

      <button
        className="order-btn"
        disabled={cartItemCount === 0 || isOrdering}
        onClick={onOrder}
      >
        {isOrdering ? "주문 중..." : "결제하기"}
      </button>
    </footer>
  );
}
