"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import CartSection from "./components/CartSection";
import CategoryTabs from "./components/CategoryTabs";
import HeroSection from "./components/HeroSection";
import KioskBFooter from "./components/KioskBFooter";
import KioskBHeader from "./components/KioskBHeader";
import MenuCarousel from "./components/MenuCarousel";
import { formatPrice } from "./constants";
import type { CartItem, MenuCategory, MenuItem } from "./types";

type OrderResult = {
  orderNumber: string;
  waitingNumber: number;
  totalPrice: number;
  pointPhone?: string;
};

export default function KioskBPage() {
  const router = useRouter();

  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
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
        companyId: "company-b",
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
        <MenuCarousel
          activeCategory={activeCategory}
          onAddToCart={handleMenuSelect}
        />
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
          className={`kiosk-b-order-feedback ${orderError ? "error" : ""}`}
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

      <KioskBFooter
        cartItemCount={cartItems.length}
        totalPrice={totalPrice}
        isOrdering={isOrdering}
        onOrder={handleOrder}
      />
    </div>
  );
}
