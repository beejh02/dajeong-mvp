"use client";

import { useMemo } from "react";
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
import CartSection from "./components/CartSection";
import CategoryTabs from "./components/CategoryTabs";
import HeroSection from "./components/HeroSection";
import KioskBFooter from "./components/KioskBFooter";
import KioskBHeader from "./components/KioskBHeader";
import MenuCarousel from "./components/MenuCarousel";
import { formatPrice } from "./constants";
import type { MenuItem } from "./types";

export default function KioskBPage() {
  const router = useRouter();
  const {
    menuCategories,
    activeCategoryId,
    setActiveCategoryId,
    isMenuLoading,
    menuError,
    loadMenus,
  } = useKioskMenu("company-b");
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
  } = useKioskOrderFlow<MenuItem>({ companyId: "company-b" });

  const activeCategory = useMemo(() => {
    return (
      menuCategories.find((category) => category.id === activeCategoryId) ??
      menuCategories[0] ??
      null
    );
  }, [activeCategoryId, menuCategories]);

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

      <KioskBFooter
        cartItemCount={cartItems.length}
        totalPrice={totalPrice}
        isOrdering={isOrdering}
        onOrder={handleOrder}
      />
    </div>
  );
}
