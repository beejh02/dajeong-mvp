"use client";

import { formatPrice } from "../constants";
import type { CartItem } from "../types";

type CartSectionProps = {
  cartItems: CartItem[];
  onClearCart: () => void;
  onDecreaseQuantity: (id: string) => void;
  onIncreaseQuantity: (id: string) => void;
  onRemoveCartItem: (id: string) => void;
};

export default function CartSection({
  cartItems,
  onClearCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveCartItem,
}: CartSectionProps) {
  return (
    <section className="kiosk-b-cart-area">
      <div className="kiosk-b-cart-header">
        <div>
          <p className="kiosk-b-kicker">MY CART</p>
          <h3>장바구니</h3>
        </div>

        {cartItems.length > 0 && (
          <button type="button" className="kiosk-b-clear-btn" onClick={onClearCart}>
            전체 비우기
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="kiosk-b-empty-cart">
          <span>🛒</span>
          <p>담긴 메뉴가 없습니다.</p>
        </div>
      ) : (
        <div className="kiosk-b-cart-list">
          {cartItems.map((item) => (
            <div key={item.cartId} className="kiosk-b-cart-item">
              <div className="kiosk-b-cart-name">
                <strong>{item.name}</strong>
                {item.selectedOptionChoices.length > 0 && (
                  <small className="kiosk-b-cart-options">
                    {item.selectedOptionChoices
                      .map((choice) => choice.choiceName)
                      .join(", ")}
                  </small>
                )}
                <span>₩ {formatPrice(item.unitPrice)}</span>
              </div>

              <div className="kiosk-b-quantity-control">
                <button type="button" onClick={() => onDecreaseQuantity(item.cartId)}>
                  -
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => onIncreaseQuantity(item.cartId)}>
                  +
                </button>
              </div>

              <button
                type="button"
                className="kiosk-b-remove-btn"
                onClick={() => onRemoveCartItem(item.cartId)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
