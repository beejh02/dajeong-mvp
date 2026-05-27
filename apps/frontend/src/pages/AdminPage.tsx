import { useState } from "react";
import { Link } from "react-router-dom";
import "./AdminPage.css";

type AdminTab = "overview" | "orders" | "detail";

type SummaryCard = {
  label: string;
  value: string;
};

type ChannelStat = {
  name: string;
  orders: number;
  paidOrders: number;
  revenue: number;
};

type Order = {
  id: string;
  number: number;
  customer: string;
  email: string;
  source: string;
  status: string;
  payment: string;
  point: string;
  pointBalance: string;
  receipt: string;
  receiptNumber: string;
  amount: string;
  createdAt: string;
  approvedCode: string;
  productName: string;
  productOptions: string[];
};

const summaryCards: SummaryCard[] = [
  { label: "오늘 주문", value: "0건" },
  { label: "오늘 더미 매출", value: "₩0" },
  { label: "전체 주문", value: "16건" },
  { label: "전체 더미 매출", value: "₩110,600" },
  { label: "결제 대기", value: "2건" },
  { label: "결제 완료", value: "14건" },
  { label: "영수증 발급", value: "14건" },
  { label: "포인트 적립", value: "1,106 P" },
];

const channelStats: ChannelStat[] = [
  { name: "A기업 Kiosk", orders: 0, paidOrders: 0, revenue: 0 },
  { name: "B기업 Kiosk", orders: 8, paidOrders: 6, revenue: 47400 },
  { name: "AI Agent with MCP", orders: 5, paidOrders: 5, revenue: 39500 },
];

const orders: Order[] = [
  {
    id: "#16",
    number: 16,
    customer: "통합 검증 사용자",
    email: "phase10.1777825879-76c1c0e2@example.test",
    source: "MCP",
    status: "결제 완료",
    payment: "승인",
    point: "79 P",
    pointBalance: "237 P",
    receipt: "발급",
    receiptNumber: "R-00000016",
    amount: "₩7,900",
    createdAt: "26. 5. 3. 오후 4:31",
    approvedCode: "DUMMY-APPROVED-00000016",
    productName: "데리버거 세트",
    productOptions: ["음료 선택: 콜라", "사이드 선택: 감자튀김"],
  },
  {
    id: "#15",
    number: 15,
    customer: "통합 검증 사용자",
    email: "phase10.1777825879-76c1c0e2@example.test",
    source: "AI Agent",
    status: "결제 완료",
    payment: "승인",
    point: "79 P",
    pointBalance: "158 P",
    receipt: "발급",
    receiptNumber: "R-00000015",
    amount: "₩7,900",
    createdAt: "26. 5. 3. 오후 4:31",
    approvedCode: "DUMMY-APPROVED-00000015",
    productName: "데리버거 세트",
    productOptions: ["음료 선택: 콜라", "사이드 선택: 감자튀김"],
  },
  {
    id: "#14",
    number: 14,
    customer: "통합 검증 사용자",
    email: "phase10.1777825879-76c1c0e2@example.test",
    source: "다정 프리미엄",
    status: "결제 완료",
    payment: "승인",
    point: "79 P",
    pointBalance: "79 P",
    receipt: "발급",
    receiptNumber: "R-00000014",
    amount: "₩7,900",
    createdAt: "26. 5. 3. 오후 4:31",
    approvedCode: "DUMMY-APPROVED-00000014",
    productName: "데리버거 세트",
    productOptions: ["음료 선택: 콜라", "사이드 선택: 감자튀김"],
  },
];

const maxRevenue = Math.max(...channelStats.map((item) => item.revenue), 1);

function formatCurrency(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [selectedOrder, setSelectedOrder] = useState<Order>(orders[0]);

  const handleMoveOrders = () => {
    setActiveTab("orders");
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setActiveTab("detail");
  };

  return (
    <main className="admin-page">
      <nav className="admin-nav">
        <div className="admin-brand">
          <div className="admin-logo">D</div>
          <div>
            <strong>Dajung</strong>
            <span>관리자</span>
          </div>
        </div>

        <div className="admin-nav-menu">
          <Link className="admin-back-link" to="/">
            뒤로가기
          </Link>
          <button
            className={activeTab === "overview" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("overview")}
          >
            개요
          </button>
          <button
            className={activeTab === "orders" || activeTab === "detail" ? "active" : ""}
            type="button"
            onClick={handleMoveOrders}
          >
            주문
          </button>
          <button type="button">로그아웃</button>
        </div>
      </nav>

      <section className="admin-container">
        {activeTab === "overview" && <OverviewSection />}

        {activeTab === "orders" && (
          <OrdersSection onViewDetail={handleViewDetail} />
        )}

        {activeTab === "detail" && (
          <OrderDetailSection order={selectedOrder} onBack={handleMoveOrders} />
        )}
      </section>
    </main>
  );
}

function OverviewSection() {
  return (
    <>
      <header className="admin-header">
        <p>운영 개요</p>
        <h1>관리자 대시보드</h1>
      </header>

      <section className="admin-summary" aria-label="관리 요약">
        {summaryCards.map((card) => (
          <article className="summary-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <p className="panel-eyebrow">출처 통계</p>
        <h2>주문 출처별 현황</h2>

        <div className="channel-list">
          {channelStats.map((item) => {
            const percent = (item.revenue / maxRevenue) * 100;

            return (
              <article className="channel-row" key={item.name}>
                <div className="channel-info">
                  <strong>{item.name}</strong>
                  <span>
                    {item.orders}건 · 결제 완료 {item.paidOrders}건
                  </span>
                </div>

                <div className="channel-bar">
                  <div style={{ width: `${percent}%` }} />
                </div>

                <strong className="channel-price">
                  {formatCurrency(item.revenue)}
                </strong>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function OrdersSection({
  onViewDetail,
}: {
  onViewDetail: (order: Order) => void;
}) {
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

function OrderDetailSection({
  order,
  onBack,
}: {
  order: Order;
  onBack: () => void;
}) {
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
                <th>처리 시각</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>적립</td>
                <td>{order.point}</td>
                <td>{order.pointBalance}</td>
                <td>{order.createdAt}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="detail-card">
      <h2>{title}</h2>
      <div>{children}</div>
    </article>
  );
}

function DetailItem({
  label,
  value,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`detail-item ${last ? "last" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
