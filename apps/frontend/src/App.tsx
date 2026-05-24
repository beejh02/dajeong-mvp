import "./App.css";

export default function App() {
  const movePage = (path) => {
    window.location.href = path;
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="header-name">다정 키오스크 플랫폼</h1>
          <p className="header-description">
            관리자 페이지와 기업별 키오스크를 선택하세요.
          </p>
        </div>

        <div className="sub-header">
          <button className="login-btn">로그인</button>
        </div>
      </header>

      <main className="content">
        <section className="admin-section">
          <button
            className="page-card admin-card"
            onClick={() => movePage("/admin")}
          >
            <span className="card-label">ADMIN</span>
            <h2>관리자 페이지</h2>
            <p>주문 내역, 대기 번호, 적립 여부를 확인합니다.</p>
            <span className="card-link">관리자 페이지로 이동 →</span>
          </button>
        </section>

        <section className="kiosk-section">
          <button
            className="page-card kiosk-card"
            onClick={() => movePage("/kiosk-a")}
          >
            <span className="card-label">KIOSK A</span>
            <h2>A기업 Kiosk</h2>
            <p>실제 API와 연결될 대표 키오스크 화면입니다.</p>
            <span className="card-link">A기업 키오스크로 이동 →</span>
          </button>

          <button
            className="page-card kiosk-card"
            onClick={() => movePage("/kiosk-b")}
          >
            <span className="card-label">KIOSK B</span>
            <h2>B기업 Kiosk</h2>
            <p>다른 UI 구조를 가진 비교용 키오스크 화면입니다.</p>
            <span className="card-link">B기업 키오스크로 이동 →</span>
          </button>
        </section>
      </main>
    </div>
  );
}