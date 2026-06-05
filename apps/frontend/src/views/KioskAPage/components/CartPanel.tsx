"use client";

import { formatPrice } from "../constants";
import type { CartItem } from "../types";

type CartPanelProps = {
  cartItems: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  onClearCart: () => void;
  onDecreaseQuantity: (id: string) => void;
  onIncreaseQuantity: (id: string) => void;
  onRemoveCartItem: (id: string) => void;
};

export default function CartPanel({
  cartItems,
  totalQuantity,
  totalPrice,
  onClearCart,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveCartItem,
}: CartPanelProps) {
  return (
    <aside className="cart-panel" aria-label="장바구니">
      <div className="cart-panel-header">
        <div>
          <p className="cart-kicker">MY ORDER</p>
          <h2>장바구니</h2>
        </div>

        {cartItems.length > 0 && (
          <button type="button" className="clear-btn" onClick={onClearCart}>
            비우기
          </button>
        )}
      </div>

      <div className="cart-list">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <span>🛒</span>
            <p>아직 담은 메뉴가 없습니다.</p>
            <small>메뉴 카드를 눌러 장바구니에 추가하세요.</small>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.cartId} className="cart-item">
              <div className="cart-item-info">
                <p>{item.name}</p>
                {item.selectedOptionChoices.length > 0 && (
                  <small className="cart-item-options">
                    {item.selectedOptionChoices
                      .map((choice) => choice.choiceName)
                      .join(", ")}
                  </small>
                )}
                <span>₩ {formatPrice(item.unitPrice)}</span>
              </div>

              <div className="quantity-control">
                <button type="button" onClick={() => onDecreaseQuantity(item.cartId)}>
                  -
                </button>
                <strong>{item.quantity}</strong>
                <button type="button" onClick={() => onIncreaseQuantity(item.cartId)}>
                  +
                </button>
              </div>

              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemoveCartItem(item.cartId)}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <div>
          <span>선택한 메뉴</span>
          <strong>{totalQuantity}개</strong>
        </div>
        <div>
          <span>총 결제금액</span>
          <strong>₩ {formatPrice(totalPrice)}</strong>
        </div>
      </div>
    </aside>
  );
}
