"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adaptMenusToCategories } from "../../lib/adapters/menuAdapter";
import { getCompanyMenus } from "../../lib/api/menus";
import { createOrder } from "../../lib/api/orders";
import KioskCheckoutPanel from "../components/KioskCheckoutPanel";
import KioskOptionDialog from "../components/KioskOptionDialog";
import {
  buildSelectedOptionGroups,
  createCartItem,
  upsertCartItem,
} from "../kioskCart";
import { formatPrice } from "./constants";
import CartFooter from "./components/CartFooter";
import CartPanel from "./components/CartPanel";
import CategorySidebar from "./components/CategorySidebar";
import KioskAHeader from "./components/KioskAHeader";
import MenuSections from "./components/MenuSections";
import type { CartItem, MenuCategory, MenuItem } from "./types";

type OrderResult = {
  orderNumber: string;
  waitingNumber: number;
  totalPrice: number;
  pointPhone?: string;
};

export default function KioskAPage() {
  const router = useRouter();

  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [optionTarget, setOptionTarget] = useState<MenuItem | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  }, [cartItems]);

  const optionPreviewItem = useMemo(() => {
    if (!optionTarget) return null;

    return createCartItem(optionTarget, selectedOptionIds);
  }, [optionTarget, selectedOptionIds]);

  const loadMenus = useCallback(async () => {
    setIsMenuLoading(true);
    setMenuError(null);

    try {
      const response = await getCompanyMenus("company-a");
      const categories = adaptMenusToCategories(response.menus);

      setMenuCategories(categories);
      setActiveCategory(categories[0]?.id ?? "");
    } catch {
      setMenuError("메뉴를 불러오지 못했습니다. Backend API 연결을 확인하세요.");
      setMenuCategories([]);
      setActiveCategory("");
    } finally {
      setIsMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getCompanyMenus("company-a")
      .then((response) => {
        if (!isMounted) return;

        const categories = adaptMenusToCategories(response.menus);

        setMenuCategories(categories);
        setActiveCategory(categories[0]?.id ?? "");
      })
      .catch(() => {
        if (!isMounted) return;

        setMenuError("메뉴를 불러오지 못했습니다. Backend API 연결을 확인하세요.");
        setMenuCategories([]);
        setActiveCategory("");
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

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement || menuCategories.length === 0) return;

    const canObserveWithinMenu =
      scrollElement.scrollHeight > scrollElement.clientHeight &&
      getComputedStyle(scrollElement).overflowY !== "visible";

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
        root: canObserveWithinMenu ? scrollElement : null,
        rootMargin: canObserveWithinMenu ? "0px" : "-80px 0px -45% 0px",
        threshold: [0.25, 0.4, 0.6],
      },
    );

    const sections = scrollElement.querySelectorAll(".menu-section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [menuCategories]);

  const addCartItem = useCallback((item: MenuItem, optionIds: string[] = []) => {
    setCartItems((prevItems) => {
      return upsertCartItem(prevItems, createCartItem(item, optionIds));
    });
  }, []);

  const closeOptionDialog = useCallback(() => {
    setOptionTarget(null);
    setSelectedOptionIds([]);
  }, []);

  const handleMenuSelect = useCallback(
    (item: MenuItem) => {
      if (item.options.length === 0) {
        addCartItem(item);
        return;
      }

      setOptionTarget(item);
      setSelectedOptionIds([]);
    },
    [addCartItem],
  );

  const toggleOptionSelection = useCallback((optionId: string) => {
    setSelectedOptionIds((prevOptionIds) =>
      prevOptionIds.includes(optionId)
        ? prevOptionIds.filter((selectedOptionId) => selectedOptionId !== optionId)
        : [...prevOptionIds, optionId],
    );
  }, []);

  const confirmOptionSelection = useCallback(() => {
    if (!optionTarget) return;

    addCartItem(optionTarget, selectedOptionIds);
    closeOptionDialog();
  }, [addCartItem, closeOptionDialog, optionTarget, selectedOptionIds]);

  const scrollToCategory = useCallback((id: string) => {
    const scrollElement = scrollRef.current;
    const targetElement = document.getElementById(id);

    if (!targetElement) return;

    const canScrollWithinMenu =
      scrollElement &&
      scrollElement.scrollHeight > scrollElement.clientHeight &&
      getComputedStyle(scrollElement).overflowY !== "visible";

    if (canScrollWithinMenu) {
      scrollElement.scrollTo({
        top: targetElement.offsetTop - scrollElement.offsetTop - 18,
        behavior: "smooth",
      });
    } else {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setActiveCategory(id);
  }, []);

  const increaseQuantity = (cartId: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decreaseQuantity = (cartId: string) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeCartItem = (cartId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cartId !== cartId),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setIsCheckoutOpen(false);
  };

  const handleOrder = () => {
    if (cartItems.length === 0 || isOrdering) return;

    setCheckoutPhone("");
    setIsCheckoutOpen(true);
    setOrderResult(null);
    setOrderError(null);
  };

  const submitOrder = async (pointPhone?: string) => {
    if (cartItems.length === 0 || isOrdering) return;

    setIsOrdering(true);
    setOrderError(null);

    try {
      const normalizedPhone = pointPhone?.trim() ?? "";

      // TODO: Resolve phone to userId when the backend point membership API exists.
      const order = await createOrder({
        companyId: "company-a",
        userId: "user-demo-1",
        items: cartItems.map((item) => ({
          menuId: item.id,
          quantity: item.quantity,
          selectedOptionGroups: buildSelectedOptionGroups(item),
        })),
        fulfillmentType: "dine_in",
        paymentMethod: "credit_card",
        pointAccrual: normalizedPhone
          ? { enabled: true, phone: normalizedPhone }
          : { enabled: false, phone: null },
      });

      setOrderResult({
        orderNumber: order.orderNumber,
        waitingNumber: order.waitingNumber,
        totalPrice: order.totalPrice,
        ...(normalizedPhone ? { pointPhone: normalizedPhone } : {}),
      });
      clearCart();
      setCheckoutPhone("");
    } catch {
      setOrderError("주문을 접수하지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setIsOrdering(false);
    }
  };

  const renderMenuContent = () => {
    if (isMenuLoading) {
      return (
        <section className="scroll-content">
          <div className="menu-state" role="status">
            <strong>메뉴를 불러오는 중입니다.</strong>
            <p>Backend API에서 A기업 메뉴 데이터를 가져오고 있습니다.</p>
          </div>
        </section>
      );
    }

    if (menuError) {
      return (
        <section className="scroll-content">
          <div className="menu-state error" role="alert">
            <strong>{menuError}</strong>
            <button type="button" onClick={loadMenus}>
              다시 시도
            </button>
          </div>
        </section>
      );
    }

    if (menuCategories.length === 0) {
      return (
        <section className="scroll-content">
          <div className="menu-state" role="status">
            <strong>표시할 메뉴가 없습니다.</strong>
            <p>현재 판매 가능한 A기업 메뉴가 없습니다.</p>
          </div>
        </section>
      );
    }

    return (
      <MenuSections
        categories={menuCategories}
        scrollRef={scrollRef}
        onAddToCart={handleMenuSelect}
      />
    );
  };

  return (
    <div className="menu-page-container" data-kiosk-page="a">
      <KioskAHeader onBack={() => router.push("/")} />

      <main className="menu-main">
        <CategorySidebar
          categories={menuCategories}
          activeCategory={activeCategory}
          onSelect={scrollToCategory}
        />

        {renderMenuContent()}

        <CartPanel
          cartItems={cartItems}
          totalQuantity={totalQuantity}
          totalPrice={totalPrice}
          onClearCart={clearCart}
          onDecreaseQuantity={decreaseQuantity}
          onIncreaseQuantity={increaseQuantity}
          onRemoveCartItem={removeCartItem}
        />
      </main>

      {optionTarget && optionPreviewItem && (
        <KioskOptionDialog
          item={optionTarget}
          selectedOptionIds={selectedOptionIds}
          unitPrice={optionPreviewItem.unitPrice}
          formatPrice={formatPrice}
          onCancel={closeOptionDialog}
          onConfirm={confirmOptionSelection}
          onToggleOption={toggleOptionSelection}
        />
      )}

      {isCheckoutOpen && (
        <KioskCheckoutPanel
          phone={checkoutPhone}
          totalPrice={totalPrice}
          isOrdering={isOrdering}
          formatPrice={formatPrice}
          onCancel={() => setIsCheckoutOpen(false)}
          onPhoneChange={setCheckoutPhone}
          onSubmitWithPoints={() => {
            void submitOrder(checkoutPhone);
          }}
          onSubmitWithoutPoints={() => {
            void submitOrder();
          }}
        />
      )}

      {(orderResult || orderError) && (
        <section
          className={`kiosk-order-feedback ${orderError ? "error" : ""}`}
          role={orderError ? "alert" : "status"}
        >
          {orderResult && (
            <>
              <strong>주문 {orderResult.orderNumber} 접수 완료</strong>
              <span>
                대기번호 {orderResult.waitingNumber} · 총 ₩{" "}
                {formatPrice(orderResult.totalPrice)}
              </span>
              {orderResult.pointPhone && (
                <span>
                  입력한 전화번호 {orderResult.pointPhone}로 포인트 적립 예정
                </span>
              )}
            </>
          )}
          {orderError && <strong>{orderError}</strong>}
        </section>
      )}

      <CartFooter
        cartItemCount={cartItems.length}
        totalQuantity={totalQuantity}
        totalPrice={totalPrice}
        isOrdering={isOrdering}
        onOrder={handleOrder}
      />
    </div>
  );
}
