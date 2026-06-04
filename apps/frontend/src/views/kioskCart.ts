export type KioskOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type KioskMenuItemWithOptions = {
  id: string;
  price: number;
  options: KioskOption[];
};

export type KioskCartItem<TMenuItem extends KioskMenuItemWithOptions> =
  TMenuItem & {
    cartId: string;
    quantity: number;
    selectedOptionIds: string[];
    selectedOptions: KioskOption[];
    unitPrice: number;
  };

function normalizeOptionIds(optionIds: string[]) {
  return Array.from(new Set(optionIds)).sort();
}

export function buildCartId(menuId: string, selectedOptionIds: string[]) {
  return [menuId, ...normalizeOptionIds(selectedOptionIds)].join("__");
}

export function getSelectedOptions<TMenuItem extends KioskMenuItemWithOptions>(
  item: TMenuItem,
  selectedOptionIds: string[],
) {
  const optionMap = new Map(item.options.map((option) => [option.id, option]));

  return normalizeOptionIds(selectedOptionIds).flatMap((optionId) => {
    const option = optionMap.get(optionId);
    return option ? [option] : [];
  });
}

export function calculateUnitPrice(
  basePrice: number,
  selectedOptions: KioskOption[],
) {
  return selectedOptions.reduce(
    (sum, option) => sum + option.priceDelta,
    basePrice,
  );
}

export function createCartItem<TMenuItem extends KioskMenuItemWithOptions>(
  item: TMenuItem,
  selectedOptionIds: string[],
): KioskCartItem<TMenuItem> {
  const selectedOptions = getSelectedOptions(item, selectedOptionIds);
  const normalizedOptionIds = selectedOptions.map((option) => option.id);

  return {
    ...item,
    cartId: buildCartId(item.id, normalizedOptionIds),
    quantity: 1,
    selectedOptionIds: normalizedOptionIds,
    selectedOptions,
    unitPrice: calculateUnitPrice(item.price, selectedOptions),
  };
}

export function upsertCartItem<TCartItem extends { cartId: string; quantity: number }>(
  cartItems: TCartItem[],
  nextItem: TCartItem,
) {
  const existingItem = cartItems.find(
    (cartItem) => cartItem.cartId === nextItem.cartId,
  );

  if (!existingItem) {
    return [...cartItems, nextItem];
  }

  return cartItems.map((cartItem) =>
    cartItem.cartId === nextItem.cartId
      ? { ...cartItem, quantity: cartItem.quantity + nextItem.quantity }
      : cartItem,
  );
}
