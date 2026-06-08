import type { Order } from "../types";
import { DetailCard, DetailItem } from "./DetailCard";

type OrderDetailSectionProps = {
  order: Order;
  onBack: () => void;
};

export default function OrderDetailSection({ order, onBack }: OrderDetailSectionProps) {
  return (
    <>
      <div className="detail-header">
        <div>
          <p className="panel-eyebrow">주문 상세</p>
          <h1>주문 {order.id}</h1>
        </div>

        <button className="view-all-button" type="button" onClick={onBack}>
          목록으로
        </button>
      </div>

      <section className="detail-grid">
        <DetailCard title="주문 정보">
          <DetailItem label="고객" value={order.customer} />
          <DetailItem label="이메일" value={order.email} />
          <DetailItem label="출처" value={order.source} />
          <DetailItem label="대상 기업" value={order.targetCompany} />
          <DetailItem label="이용 방식" value={order.fulfillment} />
          <DetailItem
            label="주문 상태"
            value={<span className="status-badge">{order.status}</span>}
          />
          <DetailItem label="생성 시각" value={order.createdAt} last />
        </DetailCard>

        <DetailCard title="금액">
          <DetailItem label="상품 합계" value={order.amount} />
          <DetailItem label="할인" value="₩0" />
          <DetailItem label="결제 금액" value={order.amount} />
          <DetailItem label="적립 포인트" value={order.point} last />
        </DetailCard>

        <DetailCard title="결제 상태">
          <DetailItem
            label="상태"
            value={<span className="status-badge">{order.payment}</span>}
          />
          <DetailItem label="승인 금액" value={order.amount} />
          <DetailItem label="승인 코드" value={order.approvedCode} />
          <DetailItem label="승인 시각" value={order.createdAt} last />
        </DetailCard>

        <DetailCard title="영수증 발급 상태">
          <DetailItem
            label="상태"
            value={<span className="status-badge">{order.receipt}</span>}
          />
          <DetailItem label="영수증 번호" value={order.receiptNumber} />
          <DetailItem label="발급 시각" value={order.createdAt} last />
        </DetailCard>
      </section>

      <section className="detail-panel">
        <p className="panel-eyebrow">주문 구성</p>
        <h2>상품 내역</h2>

        <article className="product-card">
          <div>
            <strong>{order.productName}</strong>
            <span>1개 · 단가 {order.amount}</span>
            <ul>
              {order.productOptions.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </div>

          <strong>{order.amount}</strong>
        </article>
      </section>

      <section className="detail-panel">
        <p className="panel-eyebrow">포인트</p>
        <h2>적립 내역</h2>

        <div className="point-table-wrap">
          <table className="point-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>금액</th>
                <th>잔액</th>
                <th>전화번호</th>
                <th>처리 시각</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{order.pointAccrualStatus}</td>
                <td>{order.point}</td>
                <td>{order.pointBalance}</td>
                <td>{order.pointPhone}</td>
                <td>{order.createdAt}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
