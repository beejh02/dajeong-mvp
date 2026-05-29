"use client";

import type { RefObject } from "react";
import { formatPrice } from "../constants";
import type { MenuCategory } from "../types";

type MenuSectionsProps = {
  categories: MenuCategory[];
  scrollRef: RefObject<HTMLElement | null>;
};

export default function MenuSections({
  categories,
  scrollRef,
}: MenuSectionsProps) {
  return (
    <section ref={scrollRef} className="scroll-content">
      <div className="menu-intro">
        <p className="intro-kicker">TODAY MENU</p>
        <h1>원하는 메뉴를 선택하세요</h1>
        <p>메뉴 카드를 누르면 장바구니에 담깁니다.</p>
      </div>

      {categories.map((category) => (
        <div key={category.id} id={category.id} className="menu-section">
          <div className="section-heading">
            <h2 className="category-title">
              <span>{category.icon}</span>
              {category.title}
            </h2>
            <p>{category.items.length}개 메뉴</p>
          </div>

          <div className="menu-grid">
            {category.items.map((item) => (
              <article key={item.id} className="menu-card">
                <button
                  type="button"
                  className="menu-card-button"
                  data-cart-item-id={item.id}
                  aria-label={`${item.name} 장바구니에 담기`}
                >
                  <div className="image-box">
                    {item.badge && <span className="menu-badge">{item.badge}</span>}

                    {item.img ? (
                      <>
                        <img
                          src={item.img}
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.hidden = true;

                            const fallback =
                              event.currentTarget.parentElement?.querySelector(
                                ".image-fallback",
                              );

                            fallback?.removeAttribute("hidden");
                          }}
                        />
                        <div className="image-fallback" hidden>
                          {category.icon}
                        </div>
                      </>
                    ) : (
                      <div className="image-fallback">{category.icon}</div>
                    )}
                  </div>

                  <div className="menu-info">
                    <div>
                      <p className="menu-name">{item.name}</p>
                      <p className="menu-description">{item.description}</p>
                    </div>

                    <div className="menu-bottom">
                      <p className="menu-price">₩ {formatPrice(item.price)}</p>
                      <span className="add-chip">담기 +</span>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
