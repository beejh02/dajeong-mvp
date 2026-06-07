"use client";

import type { OrderDraft } from "../types";

type OrderDraftCardProps = {
  draftOrder: OrderDraft;
  isOrdering: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onEdit: () => void;
};

const fulfillmentLabels = {
  dine_in: "매장 이용",
  pickup: "포장",
};

const paymentLabels = {
  credit_card: "신용카드",
  coupon: "쿠폰",
  cash: "현금",
};

function formatPrice(price: number) {
  return `₩ ${price.toLocaleString("ko-KR")}`;
}

export function OrderDraftCard({
  draftOrder,
  isOrdering,
  onCancel,
  onConfirm,
  onEdit,
}: OrderDraftCardProps) {
  return (
    <aside className="order-draft-card">
      <div>
        <span className="order-draft-label">주문 초안</span>
        <h2>{draftOrder.menuName}</h2>
        <p>{draftOrder.companyName}</p>
      </div>

      <dl className="order-draft-details">
        <div>
          <dt>수량</dt>
          <dd>{draftOrder.quantity}개</dd>
        </div>
        <div>
          <dt>옵션</dt>
          <dd>
            {draftOrder.selectedOptionGroups.length > 0
              ? draftOrder.selectedOptionGroups
                  .map(
                    (group) =>
                      `${group.groupTitle}: ${group.choiceNames.join(", ")}`,
                  )
                  .join(" / ")
              : "선택 옵션 없음"}
          </dd>
        </div>
        <div>
          <dt>이용 방식</dt>
          <dd>{fulfillmentLabels[draftOrder.fulfillmentType]}</dd>
        </div>
        <div>
          <dt>결제</dt>
          <dd>{paymentLabels[draftOrder.paymentMethod]}</dd>
        </div>
        <div>
          <dt>포인트</dt>
          <dd>
            {draftOrder.pointAccrual.enabled
              ? `적립 ${draftOrder.pointAccrual.phone ?? ""}`
              : "적립 안 함"}
          </dd>
        </div>
      </dl>

      <div className="order-draft-total">
        <span>총액</span>
        <strong>{formatPrice(draftOrder.totalPrice)}</strong>
      </div>

      <div className="order-draft-actions">
        <button disabled={isOrdering} onClick={onConfirm} type="button">
          {isOrdering ? "접수 중" : "주문 확정"}
        </button>
        <button disabled={isOrdering} onClick={onEdit} type="button">
          수정
        </button>
        <button disabled={isOrdering} onClick={onCancel} type="button">
          취소
        </button>
      </div>
    </aside>
  );
}
