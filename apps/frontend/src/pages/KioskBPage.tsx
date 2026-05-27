import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./KioskBPage.css";

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
    title: "버거 메뉴",
    icon: "🍔",
    label: "버거",
    items: [
      {
        id: "burger-dancing",
        name: "춤추는 버거",
        description: "불향 패티와 달콤한 특제 소스",
        price: 7900,
        img: "/src/assets/firstHamburger.gif",
        badge: "BEST",
      },
      {
        id: "burger-krabby",
        name: "집게버거",
        description: "두툼한 패티와 신선한 야채",
        price: 8500,
        img: "/src/assets/krabby_patty.jpg",
      },
      {
        id: "burger-hambugi",
        name: "햄부기햄북",
        description: "가볍게 먹기 좋은 기본 버거",
        price: 6900,
        img: "/src/assets/hambugi.png",
      },
      {
        id: "burger-cheese",
        name: "치즈킹 버거",
        description: "진한 체다치즈와 고소한 패티",
        price: 8200,
        img: "",
        badge: "NEW",
      },
      {
        id: "burger-fire",
        name: "불타는 와퍼",
        description: "매콤한 소스와 그릴드 패티",
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
        id: "side-fries",
        name: "흔들흔들 감자",
        description: "시즈닝을 넣고 흔들어 먹는 감자튀김",
        price: 2500,
        img: "",
        badge: "추천",
      },
      {
        id: "side-cheese-stick",
        name: "치즈 폭발 스틱",
        description: "쭉 늘어나는 모짜렐라 치즈",
        price: 3000,
        img: "",
      },
      {
        id: "side-onion",
        name: "어니언 링링",
        description: "바삭하게 튀긴 양파링",
        price: 2800,
        img: "",
      },
      {
        id: "side-nugget",
        name: "바삭 치킨너겟",
        description: "한입 크기 치킨 너겟 6조각",
        price: 3500,
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
        description: "버거와 잘 어울리는 기본 탄산음료",
        price: 2000,
        img: "",
      },
      {
        id: "drink-zero",
        name: "제로 콜라",
        description: "당 부담 없이 즐기는 탄산음료",
        price: 2000,
        img: "",
        badge: "ZERO",
      },
      {
        id: "drink-ade",
        name: "레몬 에이드",
        description: "상큼한 레몬향 에이드",
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
        id: "dessert-cookie",
        name: "왕초코 쿠키",
        description: "진한 초코칩이 들어간 쿠키",
        price: 2200,
        img: "",
        badge: "달콤",
      },
      {
        id: "dessert-pie",
        name: "초코 파이",
        description: "따뜻하게 먹기 좋은 초코 디저트",
        price: 2500,
        img: "",
      },
    ],
  },
];

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

export default function KioskBPage() {
  const navigate = useNavigate();

  const [activeCategoryId, setActiveCategoryId] = useState(menuData[0].id);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const activeCategory = useMemo(() => {
    return menuData.find((category) => category.id === activeCategoryId) ?? menuData[0];
  }, [activeCategoryId]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

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
    <div className="kiosk-b-page">
      <header className="kiosk-b-header">
        <div className="kiosk-b-brand">
          <button className="kiosk-b-home-btn" onClick={() => navigate("/")}>
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

      <nav className="kiosk-b-category-tabs" aria-label="메뉴 카테고리">
        {menuData.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`kiosk-b-category-tab ${
              activeCategoryId === category.id ? "active" : ""
            }`}
            onClick={() => setActiveCategoryId(category.id)}
          >
            <span className="tab-icon">{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </nav>

      <main className="kiosk-b-main">
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
                  onClick={() => addToCart(item)}
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
                      <div className="kiosk-b-image-fallback">
                        {activeCategory.icon}
                      </div>
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

        <section className="kiosk-b-cart-area">
          <div className="kiosk-b-cart-header">
            <div>
              <p className="kiosk-b-kicker">MY CART</p>
              <h3>장바구니</h3>
            </div>

            {cartItems.length > 0 && (
              <button type="button" className="kiosk-b-clear-btn" onClick={clearCart}>
                전체 비우기
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="kiosk-b-empty-cart">
              <span>🛒</span>
              <p>담긴 메뉴가 없습니다.</p>
            </div>
          ) : (
            <div className="kiosk-b-cart-list">
              {cartItems.map((item) => (
                <div key={item.id} className="kiosk-b-cart-item">
                  <div className="kiosk-b-cart-name">
                    <strong>{item.name}</strong>
                    <span>₩ {formatPrice(item.price)}</span>
                  </div>

                  <div className="kiosk-b-quantity-control">
                    <button type="button" onClick={() => decreaseQuantity(item.id)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => increaseQuantity(item.id)}>
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="kiosk-b-remove-btn"
                    onClick={() => removeCartItem(item.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="kiosk-b-footer">
        <div className="kiosk-b-total-box">
          <p>총 결제금액</p>
          <strong>₩ {formatPrice(totalPrice)}</strong>
        </div>

        <button
          type="button"
          className="kiosk-b-pay-btn"
          disabled={cartItems.length === 0}
          onClick={handleOrder}
        >
          결제하기
        </button>
      </footer>
    </div>
  );
}
