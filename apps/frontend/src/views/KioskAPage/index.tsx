"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { maskPhoneNumber } from "../../lib/privacy";
import KioskCheckoutPanel from "../components/KioskCheckoutPanel";
import KioskOptionDialog from "../components/KioskOptionDialog";
import {
  FULFILLMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "../kioskCheckout";
import { useKioskMenu } from "../hooks/useKioskMenu";
import { useKioskOrderFlow } from "../hooks/useKioskOrderFlow";
import { formatPrice } from "./constants";
import CartFooter from "./components/CartFooter";
import CartPanel from "./components/CartPanel";
import CategorySidebar from "./components/CategorySidebar";
import KioskAHeader from "./components/KioskAHeader";
import MenuSections from "./components/MenuSections";
import type { MenuItem } from "./types";

export default function KioskAPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLElement | null>(null);
  const {
    menuCategories,
    activeCategoryId: activeCategory,
    setActiveCategoryId: setActiveCategory,
    isMenuLoading,
    menuError,
    loadMenus,
  } = useKioskMenu("company-a");
  const {
    cartItems,
    optionTarget,
    selectedOptionGroups,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isOrdering,
    orderResult,
    orderError,
    totalQuantity,
    totalPrice,
    optionPreviewItem,
    optionValidationMessage,
    closeOptionDialog,
    handleMenuSelect,
    toggleOptionSelection,
    confirmOptionSelection,
    increaseQuantity,
    decreaseQuantity,
    removeCartItem,
    clearCart,
    handleOrder,
    submitOrder,
  } = useKioskOrderFlow<MenuItem>({
    companyId: "company-a",
    sourceChannel: "kiosk_a",
  });

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
  }, [menuCategories, setActiveCategory]);

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
  }, [setActiveCategory]);

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
          selectedOptionGroups={selectedOptionGroups}
          unitPrice={optionPreviewItem.unitPrice}
          validationMessage={optionValidationMessage}
          formatPrice={formatPrice}
          onCancel={closeOptionDialog}
          onConfirm={confirmOptionSelection}
          onToggleChoice={toggleOptionSelection}
        />
      )}

      {isCheckoutOpen && (
        <KioskCheckoutPanel
          totalPrice={totalPrice}
          isOrdering={isOrdering}
          formatPrice={formatPrice}
          onCancel={() => setIsCheckoutOpen(false)}
          onSubmit={(checkout) => {
            void submitOrder(checkout);
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
              <span>
                이용 방식: {FULFILLMENT_TYPE_LABELS[orderResult.fulfillmentType]}
              </span>
              <span>
                결제 방식: {PAYMENT_METHOD_LABELS[orderResult.paymentMethod]}
              </span>
              <span>
                포인트 적립:{" "}
                {orderResult.pointAccrual.enabled ? "적립함" : "적립 안 함"}
              </span>
              {orderResult.pointAccrual.enabled &&
                orderResult.pointAccrual.phone && (
                <span>
                  입력한 전화번호 {maskPhoneNumber(orderResult.pointAccrual.phone)}로
                  포인트 적립 예정
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
