type KioskBHeaderProps = {
  totalQuantity: number;
  onBack: () => void;
};

export default function KioskBHeader({ totalQuantity, onBack }: KioskBHeaderProps) {
  return (
    <header className="kiosk-b-header">
      <div className="kiosk-b-brand">
        <button className="kiosk-b-home-btn" type="button" onClick={onBack}>
          ←
        </button>

        <div>
          <p className="kiosk-b-kicker">HORIZONTAL KIOSK</p>
          <h1>
            BURGER <span>LANE</span>
          </h1>
        </div>
      </div>

      <div className="kiosk-b-order-status">
        <p>선택 메뉴</p>
        <strong>{totalQuantity}개</strong>
      </div>
    </header>
  );
}
