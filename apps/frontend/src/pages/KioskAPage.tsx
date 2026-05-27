import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./KioskAPage.css";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  img: string;
  badge?: string;
};

type MenuCategory = {
  id: string;
  title: string;
  icon: string;
  label: string;
  items: MenuItem[];
};

type CartItem = MenuItem & {
  quantity: number;
};

const menuData: MenuCategory[] = [
  {
    id: "category-burger",
    title: "추천 버거 메뉴",
    icon: "🍔",
    label: "버거",
    items: [
      {
        id: "burger-dancing",
        name: "춤추는 버거",
        description: "불향 패티와 달콤한 특제 소스가 들어간 대표 메뉴",
        price: 7900,
        img: "/src/assets/firstHamburger.gif",
        badge: "BEST",
      },
      {
        id: "burger-krabby",
        name: "집게버거",
        description: "두툼한 패티와 신선한 야채가 어울리는 클래식 버거",
        price: 8500,
        img: "/src/assets/krabby_patty.jpg",
        badge: "인기",
      },
      {
        id: "burger-hambugi",
        name: "햄부기햄북",
        description: "가볍게 먹기 좋은 담백한 기본 버거",
        price: 6900,
        img: "/src/assets/hambugi.png",
      },
      {
        id: "burger-cheese-king",
        name: "치즈킹 버거",
        description: "진한 체다치즈와 고소한 패티 조합",
        price: 8200,
        img: "",
        badge: "NEW",
      },
      {
        id: "burger-fire",
        name: "불타는 와퍼",
        description: "매콤한 소스와 그릴드 패티가 들어간 매운 버거",
        price: 8900,
        img: "",
      },
    ],
  },
  {
    id: "category-side",
    title: "사이드 메뉴",
    icon: "🍟",
    label: "사이드",
    items: [
      {
        id: "side-shake-fries",
        name: "흔들흔들 감자",
        description: "시즈닝을 넣고 흔들어 먹는 바삭한 감자튀김",
        price: 2500,
        img: "",
        badge: "추천",
      },
      {
        id: "side-cheese-stick",
        name: "치즈 폭발 스틱",
        description: "쭉 늘어나는 모짜렐라 치즈 스틱",
        price: 3000,
        img: "",
      },
      {
        id: "side-onion-ring",
        name: "어니언 링링",
        description: "달큰한 양파를 바삭하게 튀긴 사이드",
        price: 2800,
        img: "",
      },
      {
        id: "side-nugget",
        name: "바삭 치킨너겟",
        description: "한입 크기로 먹기 좋은 치킨 너겟 6조각",
        price: 3500,
        img: "",
      },
      {
        id: "side-corn",
        name: "버터 콘샐러드",
        description: "고소한 버터향이 들어간 달콤한 콘샐러드",
        price: 2200,
        img: "",
      },
    ],
  },
  {
    id: "category-drink",
    title: "음료 메뉴",
    icon: "🥤",
    label: "음료",
    items: [
      {
        id: "drink-cola",
        name: "콜라",
        description: "버거와 가장 잘 어울리는 기본 탄산음료",
        price: 2000,
        img: "",
      },
      {
        id: "drink-zero-cola",
        name: "제로 콜라",
        description: "당 부담 없이 즐기는 시원한 탄산음료",
        price: 2000,
        img: "",
        badge: "제로",
      },
      {
        id: "drink-ade",
        name: "레몬 에이드",
        description: "상큼한 레몬향이 살아있는 에이드",
        price: 3200,
        img: "",
      },
      {
        id: "drink-coffee",
        name: "아이스 아메리카노",
        description: "깔끔하고 진한 아이스 커피",
        price: 2800,
        img: "",
      },
    ],
  },
  {
    id: "category-dessert",
    title: "디저트 메뉴",
    icon: "🍦",
    label: "디저트",
    items: [
      {
        id: "dessert-icecream",
        name: "소프트 아이스크림",
        description: "부드럽고 달콤한 기본 아이스크림",
        price: 1800,
        img: "",
      },
      {
        id: "dessert-choco-pie",
        name: "초코 파이",
        description: "따뜻하게 먹으면 더 맛있는 달콤한 초코 디저트",
        price: 2500,
        img: "",
      },
      {
        id: "dessert-cookie",
        name: "왕초코 쿠키",
        description: "진한 초코칩이 들어간 큼직한 쿠키",
        price: 2200,
        img: "",
        badge: "달콤",
      },
    ],
  },
];

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

export default function KioskAPage() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("category-burger");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const scrollRef = useRef<HTMLElement | null>(null);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveCategory(visibleEntries[0].target.id);
        }
      },
      {
        root: scrollElement,
        threshold: [0.25, 0.4, 0.6],
      },
    );

    const sections = scrollElement.querySelectorAll(".menu-section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToCategory = (id: string) => {
    const scrollElement = scrollRef.current;
    const targetElement = document.getElementById(id);

    if (!scrollElement || !targetElement) return;

    scrollElement.scrollTo({
      top: targetElement.offsetTop - scrollElement.offsetTop - 18,
      behavior: "smooth",
    });

    setActiveCategory(id);
  };

  const addToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const increaseQuantity = (id: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decreaseQuantity = (id: string) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeCartItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleOrder = () => {
    if (cartItems.length === 0) return;

    alert(
      `주문이 접수되었습니다.\n선택한 메뉴: ${totalQuantity}개\n총 결제금액: ₩ ${formatPrice(
        totalPrice,
      )}`,
    );

    clearCart();
  };

  return (
    <div className="menu-page-container">
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
          <div className="menu-intro">
            <p className="intro-kicker">TODAY MENU</p>
            <h1>원하는 메뉴를 선택하세요</h1>
            <p>메뉴 카드를 누르면 장바구니에 담깁니다.</p>
          </div>

          {menuData.map((category) => (
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
                      onClick={() => addToCart(item)}
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

        <aside className="cart-panel" aria-label="장바구니">
          <div className="cart-panel-header">
            <div>
              <p className="cart-kicker">MY ORDER</p>
              <h2>장바구니</h2>
            </div>

            {cartItems.length > 0 && (
              <button type="button" className="clear-btn" onClick={clearCart}>
                비우기
              </button>
            )}
          </div>

          <div className="cart-list">
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <span>🛒</span>
                <p>아직 담은 메뉴가 없습니다.</p>
                <small>메뉴 카드를 눌러 장바구니에 추가하세요.</small>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <p>{item.name}</p>
                    <span>₩ {formatPrice(item.price)}</span>
                  </div>

                  <div className="quantity-control">
                    <button type="button" onClick={() => decreaseQuantity(item.id)}>
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button type="button" onClick={() => increaseQuantity(item.id)}>
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeCartItem(item.id)}
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div>
              <span>선택한 메뉴</span>
              <strong>{totalQuantity}개</strong>
            </div>
            <div>
              <span>총 결제금액</span>
              <strong>₩ {formatPrice(totalPrice)}</strong>
            </div>
          </div>
        </aside>
      </main>

      <footer className="cart-footer">
        <div className="cart-info">
          <p className="cart-count">선택한 메뉴 : {totalQuantity}개</p>
          <p className="cart-total">₩ {formatPrice(totalPrice)}</p>
        </div>

        <button
          className="order-btn"
          disabled={cartItems.length === 0}
          onClick={handleOrder}
        >
          결제하기
        </button>
      </footer>
    </div>
  );
}
