import { channelStats, maxRevenue, summaryCards, formatCurrency } from "../constants";

export default function OverviewSection() {
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