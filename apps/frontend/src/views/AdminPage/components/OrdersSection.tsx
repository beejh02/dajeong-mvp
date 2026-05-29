import type { Order } from "../types";
import { orders } from "../constants";

type OrdersSectionProps = {
  onViewDetail: (order: Order) => void;
};

export default function OrdersSection({ onViewDetail }: OrdersSectionProps) {
  return (
    <section className="orders-panel">
      <div className="orders-panel-header">
        <div>
          <p className="panel-eyebrow">최근 주문</p>
          <h1>최근 주문 목록</h1>
        </div>

        <button className="view-all-button" type="button">
          전체 보기
        </button>
      </div>

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>주문</th>
              <th>고객</th>
              <th>출처</th>
              <th>주문 상태</th>
              <th>결제</th>
              <th>포인트</th>
              <th>영수증</th>
              <th>금액</th>
              <th>생성 시각</th>
              <th>상세</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  <strong className="customer-name">{order.customer}</strong>
                  <span className="customer-email">{order.email}</span>
                </td>
                <td>{order.source}</td>
                <td>
                  <span className="status-badge">{order.status}</span>
                </td>
                <td>
                  <span className="status-badge">{order.payment}</span>
                </td>
                <td>{order.point}</td>
                <td>
                  <span className="status-badge">{order.receipt}</span>
                </td>
                <td>{order.amount}</td>
                <td>{order.createdAt}</td>
                <td>
                  <button
                    className="detail-button"
                    type="button"
                    onClick={() => onViewDetail(order)}
                  >
                    보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
