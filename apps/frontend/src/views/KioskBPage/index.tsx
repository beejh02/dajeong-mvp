"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adaptMenusToCategories } from "../../lib/adapters/menuAdapter";
import { getCompanyMenus } from "../../lib/api/menus";
import { createOrder } from "../../lib/api/orders";
import CartSection from "./components/CartSection";
import CategoryTabs from "./components/CategoryTabs";
import HeroSection from "./components/HeroSection";
import KioskBFooter from "./components/KioskBFooter";
import KioskBHeader from "./components/KioskBHeader";
import MenuCarousel from "./components/MenuCarousel";
import type { CartItem, MenuCategory, MenuItem } from "./types";

type OrderResult = {
  orderNumber: string;
  waitingNumber: number;
  totalPrice: number;
};

export default function KioskBPage() {
  const router = useRouter();

  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const activeCategory = useMemo(() => {
    return (
      menuCategories.find((category) => category.id === activeCategoryId) ??
      menuCategories[0] ??
      null
    );
  }, [activeCategoryId, menuCategories]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const loadMenus = useCallback(async () => {
    setIsMenuLoading(true);
    setMenuError(null);

    try {
      const response = await getCompanyMenus("company-b");
      const categories = adaptMenusToCategories(response.menus);

      setMenuCategories(categories);
      setActiveCategoryId(categories[0]?.id ?? "");
    } catch {
      setMenuError("메뉴를 불러오지 못했습니다. Backend API 연결을 확인하세요.");
      setMenuCategories([]);
      setActiveCategoryId("");
    } finally {
      setIsMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getCompanyMenus("company-b")
      .then((response) => {
        if (!isMounted) return;

        const categories = adaptMenusToCategories(response.menus);

        setMenuCategories(categories);
        setActiveCategoryId(categories[0]?.id ?? "");
      })
      .catch(() => {
        if (!isMounted) return;

        setMenuError("메뉴를 불러오지 못했습니다. Backend API 연결을 확인하세요.");
        setMenuCategories([]);
        setActiveCategoryId("");
      })
      .finally(() => {
        if (isMounted) {
          setIsMenuLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
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
  }, []);

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

  const handleOrder = async () => {
    if (cartItems.length === 0 || isOrdering) return;

    setIsOrdering(true);
    setOrderError(null);

    try {
      const order = await createOrder({
        companyId: "company-b",
        userId: "user-demo-1",
        items: cartItems.map((item) => ({
          menuId: item.id,
          quantity: item.quantity,
          selectedOptionIds: [],
        })),
      });

      setOrderResult({
        orderNumber: order.orderNumber,
        waitingNumber: order.waitingNumber,
        totalPrice: order.totalPrice,
      });
      clearCart();
    } catch {
      setOrderError("주문을 접수하지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setIsOrdering(false);
    }
  };

  const renderMenuContent = () => {
    if (isMenuLoading) {
      return (
        <section className="kiosk-b-state" role="status">
          <strong>메뉴를 불러오는 중입니다.</strong>
          <p>Backend API에서 B기업 메뉴 데이터를 가져오고 있습니다.</p>
        </section>
      );
    }

    if (menuError) {
      return (
        <section className="kiosk-b-state error" role="alert">
          <strong>{menuError}</strong>
          <button type="button" onClick={loadMenus}>
            다시 시도
          </button>
        </section>
      );
    }

    if (!activeCategory) {
      return (
        <section className="kiosk-b-state" role="status">
          <strong>표시할 메뉴가 없습니다.</strong>
          <p>현재 판매 가능한 B기업 메뉴가 없습니다.</p>
        </section>
      );
    }

    return (
      <>
        <HeroSection activeCategory={activeCategory} />
        <MenuCarousel activeCategory={activeCategory} onAddToCart={addToCart} />
      </>
    );
  };

  return (
    <div className="kiosk-b-page" data-kiosk-page="b">
      <KioskBHeader totalQuantity={totalQuantity} onBack={() => router.push("/")} />

      <CategoryTabs
        categories={menuCategories}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      <main className="kiosk-b-main">
        {renderMenuContent()}

        <CartSection
          cartItems={cartItems}
          onClearCart={clearCart}
          onDecreaseQuantity={decreaseQuantity}
          onIncreaseQuantity={increaseQuantity}
          onRemoveCartItem={removeCartItem}
        />
      </main>

      {(orderResult || orderError) && (
        <section
          className={`kiosk-b-order-feedback ${orderError ? "error" : ""}`}
          role={orderError ? "alert" : "status"}
        >
          {orderResult && (
            <>
              <strong>주문 {orderResult.orderNumber} 접수 완료</strong>
              <span>
                대기번호 {orderResult.waitingNumber} · 총 ₩{" "}
                {orderResult.totalPrice.toLocaleString("ko-KR")}
              </span>
            </>
          )}
          {orderError && <strong>{orderError}</strong>}
        </section>
      )}

      <KioskBFooter
        cartItemCount={cartItems.length}
        totalPrice={totalPrice}
        isOrdering={isOrdering}
        onOrder={handleOrder}
      />
    </div>
  );
}
