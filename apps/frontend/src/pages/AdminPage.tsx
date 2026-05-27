import "./AdminPage.css";

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
  {
    name: "클래식 키오스크",
    orders: 0,
    paidOrders: 0,
    revenue: 0,
  },
  {
    name: "가이드 키오스크",
    orders: 0,
    paidOrders: 0,
    revenue: 0,
  },
  {
    name: "다정 프리미엄",
    orders: 8,
    paidOrders: 6,
    revenue: 47400,
  },
  {
    name: "AI Agent",
    orders: 5,
    paidOrders: 5,
    revenue: 39500,
  },
  {
    name: "MCP",
    orders: 3,
    paidOrders: 3,
    revenue: 23700,
  },
];

const maxRevenue = Math.max(...channelStats.map((item) => item.revenue), 1);

function formatCurrency(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

export default function AdminPage() {
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
          <button className="active" type="button">
            개요
          </button>
          <button type="button">주문</button>
          <button type="button">로그아웃</button>
        </div>
      </nav>

      <section className="admin-container">
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

        <section className="admin-panel" aria-labelledby="channel-title">
          <p className="panel-eyebrow">출처 통계</p>
          <h2 id="channel-title">주문 출처별 현황</h2>

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

                  <div className="channel-bar" aria-hidden="true">
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
      </section>
    </main>
  );
}