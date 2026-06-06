"use client";

import { useCallback, useMemo, useState } from "react";
import { createOrder } from "../../lib/api/orders";
import {
  createCartItem,
  toggleOptionChoice,
  upsertCartItem,
  validateSelectedOptionGroups,
  type KioskCartItem,
  type KioskMenuItemWithOptions,
  type SelectedOptionGroup,
} from "../kioskCart";
import type { KioskCheckoutState } from "../kioskCheckout";

export type KioskOrderResult = {
  orderNumber: string;
  waitingNumber: number;
  totalPrice: number;
  fulfillmentType: KioskCheckoutState["fulfillmentType"];
  paymentMethod: KioskCheckoutState["paymentMethod"];
  pointAccrual: KioskCheckoutState["pointAccrual"];
};

type UseKioskOrderFlowOptions = {
  companyId: string;
  userId?: string;
};

export function useKioskOrderFlow<TMenuItem extends KioskMenuItemWithOptions>({
  companyId,
  userId = "user-demo-1",
}: UseKioskOrderFlowOptions) {
  const [cartItems, setCartItems] = useState<KioskCartItem<TMenuItem>[]>([]);
  const [optionTarget, setOptionTarget] = useState<TMenuItem | null>(null);
  const [selectedOptionGroups, setSelectedOptionGroups] = useState<
    SelectedOptionGroup[]
  >([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<KioskOrderResult | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

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

    return createCartItem(optionTarget, selectedOptionGroups);
  }, [optionTarget, selectedOptionGroups]);

  const optionValidationMessage = useMemo(() => {
    if (!optionTarget) return null;

    return validateSelectedOptionGroups(
      optionTarget.optionGroups,
      selectedOptionGroups,
    );
  }, [optionTarget, selectedOptionGroups]);

  const addCartItem = useCallback(
    (item: TMenuItem, optionGroups: SelectedOptionGroup[] = []) => {
      setCartItems((prevItems) => {
        return upsertCartItem(prevItems, createCartItem(item, optionGroups));
      });
    },
    [],
  );

  const closeOptionDialog = useCallback(() => {
    setOptionTarget(null);
    setSelectedOptionGroups([]);
  }, []);

  const handleMenuSelect = useCallback(
    (item: TMenuItem) => {
      if (item.optionGroups.length === 0) {
        addCartItem(item);
        return;
      }

      setOptionTarget(item);
      setSelectedOptionGroups([]);
    },
    [addCartItem],
  );

  const toggleOptionSelection = useCallback(
    (groupId: string, choiceId: string) => {
      if (!optionTarget) return;

      setSelectedOptionGroups((currentGroups) =>
        toggleOptionChoice(
          currentGroups,
          optionTarget.optionGroups,
          groupId,
          choiceId,
        ),
      );
    },
    [optionTarget],
  );

  const confirmOptionSelection = useCallback(() => {
    if (!optionTarget) return;
    if (optionValidationMessage) return;

    addCartItem(optionTarget, selectedOptionGroups);
    closeOptionDialog();
  }, [
    addCartItem,
    closeOptionDialog,
    optionTarget,
    optionValidationMessage,
    selectedOptionGroups,
  ]);

  const increaseQuantity = useCallback((cartId: string) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }, []);

  const decreaseQuantity = useCallback((cartId: string) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeCartItem = useCallback((cartId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.cartId !== cartId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setIsCheckoutOpen(false);
  }, []);

  const handleOrder = useCallback(() => {
    if (cartItems.length === 0 || isOrdering) return;

    setIsCheckoutOpen(true);
    setOrderResult(null);
    setOrderError(null);
  }, [cartItems.length, isOrdering]);

  const submitOrder = useCallback(
    async (checkout: KioskCheckoutState) => {
      if (cartItems.length === 0 || isOrdering) return;

      setIsOrdering(true);
      setOrderError(null);

      try {
        // TODO: Resolve phone-based point members to a real userId when the backend API exists.
        const order = await createOrder({
          companyId,
          userId,
          items: cartItems.map((item) => ({
            menuId: item.id,
            quantity: item.quantity,
            selectedOptionGroups: item.selectedOptionGroups,
          })),
          fulfillmentType: checkout.fulfillmentType,
          paymentMethod: checkout.paymentMethod,
          pointAccrual: checkout.pointAccrual,
        });

        setOrderResult({
          orderNumber: order.orderNumber,
          waitingNumber: order.waitingNumber,
          totalPrice: order.totalPrice,
          fulfillmentType: checkout.fulfillmentType,
          paymentMethod: checkout.paymentMethod,
          pointAccrual: checkout.pointAccrual,
        });
        clearCart();
      } catch {
        setOrderError("주문을 접수하지 못했습니다. 잠시 후 다시 시도하세요.");
      } finally {
        setIsOrdering(false);
      }
    },
    [cartItems, clearCart, companyId, isOrdering, userId],
  );

  return {
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
  };
}
