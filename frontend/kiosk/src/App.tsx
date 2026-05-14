const readinessItems = [
  "A기업 실제 주문 UI 자리",
  "B/C기업 Mock 키오스크 자리",
  "Dajeong Chat 진입 자리",
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="status-panel">
        <p className="eyebrow">Phase 1 Scaffold</p>
        <h1>Dajeong Kiosk MVP</h1>
        <p className="summary">
          현재 화면은 키오스크 앱 실행 확인용 골격입니다. 주문, 결제, 채팅
          기능은 다음 Phase에서 API와 연결합니다.
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
