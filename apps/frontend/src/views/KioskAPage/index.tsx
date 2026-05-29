"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, menuData } from "./constants";
import CartFooter from "./components/CartFooter";
import CartPanel from "./components/CartPanel";
import CategorySidebar from "./components/CategorySidebar";
import KioskAHeader from "./components/KioskAHeader";
import MenuSections from "./components/MenuSections";
import type { CartItem, MenuItem } from "./types";

export default function KioskAPage() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState("category-burger");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);

  const menuItemsById = useMemo(() => {
    return new Map(
      menuData.flatMap((category) =>
        category.items.map((item) => [item.id, item] as const),
      ),
    );
  }, []);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

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

  useEffect(() => {
    const pageElement = pageRef.current;

    if (!pageElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) return;

      const cartButton = target.closest<HTMLButtonElement>("[data-cart-item-id]");

      if (cartButton && pageElement.contains(cartButton)) {
        const itemId = cartButton.dataset.cartItemId;
        const item = itemId ? menuItemsById.get(itemId) : undefined;

        if (item) {
          addToCart(item);
        }

        return;
      }

      const categoryButton = target.closest<HTMLButtonElement>("[data-category-id]");

      if (categoryButton && pageElement.contains(categoryButton)) {
        const categoryId = categoryButton.dataset.categoryId;

        if (categoryId) {
          scrollToCategory(categoryId);
        }
      }
    };

    pageElement.addEventListener("click", handleClick);

    return () => pageElement.removeEventListener("click", handleClick);
  }, [addToCart, menuItemsById, scrollToCategory]);

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
    <div ref={pageRef} className="menu-page-container" data-kiosk-page="a">
      <KioskAHeader onBack={() => router.push("/")} />

      <main className="menu-main">
        <CategorySidebar
          categories={menuData}
          activeCategory={activeCategory}
        />

        <MenuSections
          categories={menuData}
          scrollRef={scrollRef}
        />

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

      <CartFooter
        cartItemCount={cartItems.length}
        totalQuantity={totalQuantity}
        totalPrice={totalPrice}
        onOrder={handleOrder}
      />
    </div>
  );
}
