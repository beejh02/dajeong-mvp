import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice, menuData } from "./constants";
import CartSection from "./components/CartSection";
import CategoryTabs from "./components/CategoryTabs";
import HeroSection from "./components/HeroSection";
import KioskBFooter from "./components/KioskBFooter";
import KioskBHeader from "./components/KioskBHeader";
import MenuCarousel from "./components/MenuCarousel";
import type { CartItem, MenuItem } from "./types";
import "./KioskBPage.css";

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
      <KioskBHeader totalQuantity={totalQuantity} onBack={() => navigate("/")} />

      <CategoryTabs
        categories={menuData}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      <main className="kiosk-b-main">
        <HeroSection activeCategory={activeCategory} />

        <MenuCarousel activeCategory={activeCategory} onAddToCart={addToCart} />

        <CartSection
          cartItems={cartItems}
          onClearCart={clearCart}
          onDecreaseQuantity={decreaseQuantity}
          onIncreaseQuantity={increaseQuantity}
          onRemoveCartItem={removeCartItem}
        />
      </main>

      <KioskBFooter
        cartItemCount={cartItems.length}
        totalPrice={totalPrice}
        onOrder={handleOrder}
      />
    </div>
  );
}
