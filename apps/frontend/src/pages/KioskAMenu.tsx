import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./KioskAMenu.css";

type MenuItem = {
  name: string;
  price: string;
  img: string;
};

type MenuCategory = {
  id: string;
  title: string;
  icon: string;
  label: string;
  items: MenuItem[];
};

const menuData: MenuCategory[] = [
  {
    id: "category-burger",
    title: "추천 버거 메뉴",
    icon: "🍔",
    label: "버거",
    items: [
      { name: "춤추는 버거", price: "7,900", img: "/src/assets/firstHamburger.gif" },
      { name: "집게버거", price: "8,500", img: "/src/assets/krabby_patty.jpg" },
      { name: "햄부기햄북", price: "6,900", img: "/src/assets/hambugi.png" },
    ],
  },
  {
    id: "category-side",
    title: "사이드 메뉴",
    icon: "🍟",
    label: "사이드",
    items: [
      { name: "흔들흔들 감자", price: "2,500", img: "" },
      { name: "치즈 폭발 스틱", price: "3,000", img: "" },
      { name: "어니언 링링", price: "2,800", img: "" },
    ],
  },
];

export default function KioskAMenu() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("category-burger");
  const scrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      { root: scrollRef.current, threshold: 0.3 },
    );

    const sections = scrollRef.current?.querySelectorAll(".menu-section") ?? [];
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToCategory = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="menu-page-container">
      <header className="menu-header">
        <div className="logo">
          <span>BURGER</span> KINGDOM
        </div>
        <button className="back-btn" onClick={() => navigate("/")}>
          처음으로
        </button>
      </header>

      <main className="menu-main">
        <nav id="sidebar" aria-label="메뉴 카테고리">
          {menuData.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollToCategory(cat.id)}
              className={`nav-item ${activeCategory === cat.id ? "active" : ""}`}
            >
              <span className="nav-icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>

        <section ref={scrollRef} className="scroll-content">
          {menuData.map((category) => (
            <div key={category.id} id={category.id} className="menu-section">
              <h2 className="category-title">{category.title}</h2>
              <div className="menu-grid">
                {category.items.map((item) => (
                  <article key={item.name} className="menu-card">
                    <div className="image-box">
                      {item.img ? (
                        <>
                          <img
                            src={item.img}
                            alt={item.name}
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                              event.currentTarget.nextElementSibling?.removeAttribute("hidden");
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
                      <p className="menu-name">{item.name}</p>
                      <p className="menu-price">₩ {item.price}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="cart-footer">
        <div className="cart-info">
          <p className="cart-count">선택한 메뉴 : 0개</p>
          <p className="cart-total">₩ 0</p>
        </div>
        <button className="order-btn">결제하기</button>
      </footer>
    </div>
  );
}
