export type KioskOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type KioskOptionGroup = {
  id: string;
  title: string;
  selectionMode: "single" | "multiple";
  required: boolean;
  minSelect: number;
  maxSelect: number;
  choices: KioskOption[];
};

export type SelectedOptionGroup = {
  groupId: string;
  choiceIds: string[];
};

export type KioskMenuItemWithOptions = {
  id: string;
  price: number;
  optionGroups: KioskOptionGroup[];
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

export function buildSelectedOptionGroups(
  item: KioskCartItem<KioskMenuItemWithOptions>,
): SelectedOptionGroup[] {
  const selectedOptionIdSet = new Set(item.selectedOptionIds);

  return item.optionGroups.flatMap((group) => {
    const selectedChoiceIds = group.choices
      .filter((choice) => selectedOptionIdSet.has(choice.id))
      .map((choice) => choice.id);

    if (
      selectedChoiceIds.length === 0 &&
      group.required &&
      group.choices.length > 0
    ) {
      return [{ groupId: group.id, choiceIds: [group.choices[0].id] }];
    }

    if (selectedChoiceIds.length === 0) {
      return [];
    }

    return [{ groupId: group.id, choiceIds: selectedChoiceIds }];
  });
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
