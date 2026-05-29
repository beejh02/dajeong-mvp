"use client";

import { formatPrice } from "../constants";
import type { MenuCategory, MenuItem } from "../types";

type MenuCarouselProps = {
  activeCategory: MenuCategory;
  onAddToCart: (item: MenuItem) => void;
};

export default function MenuCarousel({
  activeCategory,
  onAddToCart,
}: MenuCarouselProps) {
  return (
    <section className="kiosk-b-menu-section">
      <div className="kiosk-b-section-title">
        <h3>{activeCategory.label} 전체 메뉴</h3>
        <p>{activeCategory.items.length}개 메뉴</p>
      </div>

      <div className="kiosk-b-horizontal-menu">
        {activeCategory.items.map((item) => (
          <article key={item.id} className="kiosk-b-menu-card">
            <button
              type="button"
              className="kiosk-b-menu-card-button"
              data-cart-item-id={item.id}
              onClick={() => onAddToCart(item)}
            >
              <div className="kiosk-b-image-box">
                {item.badge && <span className="kiosk-b-badge">{item.badge}</span>}

                {item.img ? (
                  <>
                    <img
                      src={item.img}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.hidden = true;

                        const fallback =
                          event.currentTarget.parentElement?.querySelector(
                            ".kiosk-b-image-fallback",
                          );

                        fallback?.removeAttribute("hidden");
                      }}
                    />
                    <div className="kiosk-b-image-fallback" hidden>
                      {activeCategory.icon}
                    </div>
                  </>
                ) : (
                  <div className="kiosk-b-image-fallback">{activeCategory.icon}</div>
                )}
              </div>

              <div className="kiosk-b-menu-info">
                <p className="kiosk-b-menu-name">{item.name}</p>
                <p className="kiosk-b-menu-description">{item.description}</p>

                <div className="kiosk-b-menu-bottom">
                  <strong>₩ {formatPrice(item.price)}</strong>
                  <span>담기 +</span>
                </div>
              </div>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
