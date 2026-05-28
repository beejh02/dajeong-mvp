import type { MenuCategory } from "../types";

type HeroSectionProps = {
  activeCategory: MenuCategory;
};

export default function HeroSection({ activeCategory }: HeroSectionProps) {
  return (
    <section className="kiosk-b-hero">
      <div>
        <p className="kiosk-b-kicker">SELECT MENU</p>
        <h2>{activeCategory.title}</h2>
        <p>
          좌우로 메뉴를 넘겨보면서 원하는 메뉴를 선택하세요. 카드를 누르면 바로
          장바구니에 담깁니다.
        </p>
      </div>

      <div className="kiosk-b-hero-icon">{activeCategory.icon}</div>
    </section>
  );
}
