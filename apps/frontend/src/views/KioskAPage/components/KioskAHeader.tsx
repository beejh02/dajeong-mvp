type KioskAHeaderProps = {
  onBack: () => void;
};

export default function KioskAHeader({ onBack }: KioskAHeaderProps) {
  return (
    <header className="menu-header">
      <div className="brand-area">
        <div className="brand-mark">BK</div>
        <div>
          <div className="logo">
            <span>BURGER</span> KINGDOM
          </div>
          <p className="brand-subtitle">빠르고 쉽게 주문하세요</p>
        </div>
      </div>

      <button className="back-btn" type="button" onClick={onBack}>
        처음으로
      </button>
    </header>
  );
}
