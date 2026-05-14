const readinessItems = [
  "주문 목록 화면 자리",
  "주문 상세 화면 자리",
  "MCP 호출 로그 화면 자리",
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="status-panel">
        <p className="eyebrow">Phase 1 Scaffold</p>
        <h1>Dajeong Admin Dashboard</h1>
        <p className="summary">
          현재 화면은 관리자 앱 실행 확인용 골격입니다. 주문과 MCP 로그 조회는
          백엔드 API가 준비된 뒤 연결합니다.
        </p>
        <ul>
          {readinessItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
