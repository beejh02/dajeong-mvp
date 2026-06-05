import type {
  MenuOptionChoice,
  MenuOptionGroup,
  SelectedOptionGroup,
} from "../lib/api/types";

export type KioskOption = MenuOptionChoice;
export type KioskOptionGroup = MenuOptionGroup;
export type { SelectedOptionGroup } from "../lib/api/types";

export type SelectedOptionChoiceSummary = {
  groupId: string;
  groupTitle: string;
  choiceId: string;
  choiceName: string;
  priceDelta: number;
};

export type KioskMenuItemWithOptions = {
  id: string;
  price: number;
  optionGroups: KioskOptionGroup[];
};

export type KioskCartItem<TMenuItem extends KioskMenuItemWithOptions> =
  TMenuItem & {
    cartId: string;
    quantity: number;
    selectedOptionGroups: SelectedOptionGroup[];
    selectedOptionChoices: SelectedOptionChoiceSummary[];
    unitPrice: number;
  };

function normalizeChoiceIds(choiceIds: string[]) {
  return Array.from(new Set(choiceIds)).filter(Boolean).sort();
}

function normalizeGroupsForCartId(selectedOptionGroups: SelectedOptionGroup[]) {
  return selectedOptionGroups
    .map((group) => ({
      groupId: group.groupId,
      choiceIds: normalizeChoiceIds(group.choiceIds),
    }))
    .filter((group) => group.groupId && group.choiceIds.length > 0)
    .sort((a, b) => a.groupId.localeCompare(b.groupId));
}

export function buildCartId(
  menuId: string,
  selectedOptionGroups: SelectedOptionGroup[],
) {
  const optionSegments = normalizeGroupsForCartId(selectedOptionGroups).map(
    (group) => `${group.groupId}:${group.choiceIds.join(",")}`,
  );

  return [menuId, ...optionSegments].join("__");
}

export function normalizeSelectedOptionGroups(
  selectedOptionGroups: SelectedOptionGroup[],
  optionGroups: MenuOptionGroup[],
): SelectedOptionGroup[] {
  const selectionByGroup = new Map(
    selectedOptionGroups.map((group) => [
      group.groupId,
      new Set(group.choiceIds),
    ]),
  );

  return optionGroups.flatMap((group) => {
    const requestedChoiceIds = selectionByGroup.get(group.id);

    if (!requestedChoiceIds) {
      return [];
    }

    const choiceIds = normalizeChoiceIds(
      group.choices
        .filter((choice) => requestedChoiceIds.has(choice.id))
        .map((choice) => choice.id),
    );

    if (choiceIds.length === 0) {
      return [];
    }

    return [{ groupId: group.id, choiceIds }];
  });
}

export function getSelectedOptionChoices<TMenuItem extends KioskMenuItemWithOptions>(
  item: TMenuItem,
  selectedOptionGroups: SelectedOptionGroup[],
): SelectedOptionChoiceSummary[] {
  const normalizedGroups = normalizeSelectedOptionGroups(
    selectedOptionGroups,
    item.optionGroups,
  );
  const choiceIdsByGroup = new Map(
    normalizedGroups.map((group) => [
      group.groupId,
      new Set(group.choiceIds),
    ]),
  );

  return item.optionGroups.flatMap((group) => {
    const choiceIds = choiceIdsByGroup.get(group.id);

    if (!choiceIds) {
      return [];
    }

    return group.choices
      .filter((choice) => choiceIds.has(choice.id))
      .map((choice) => ({
        groupId: group.id,
        groupTitle: group.title,
        choiceId: choice.id,
        choiceName: choice.name,
        priceDelta: choice.priceDelta,
      }));
  });
}

export function calculateUnitPrice(
  basePrice: number,
  selectedOptionChoices: SelectedOptionChoiceSummary[],
) {
  return selectedOptionChoices.reduce(
    (sum, choice) => sum + choice.priceDelta,
    basePrice,
  );
}

export function createCartItem<TMenuItem extends KioskMenuItemWithOptions>(
  item: TMenuItem,
  selectedOptionGroups: SelectedOptionGroup[],
): KioskCartItem<TMenuItem> {
  const normalizedGroups = normalizeSelectedOptionGroups(
    selectedOptionGroups,
    item.optionGroups,
  );
  const selectedOptionChoices = getSelectedOptionChoices(item, normalizedGroups);

  return {
    ...item,
    cartId: buildCartId(item.id, normalizedGroups),
    quantity: 1,
    selectedOptionGroups: normalizedGroups,
    selectedOptionChoices,
    unitPrice: calculateUnitPrice(item.price, selectedOptionChoices),
  };
}

export function toggleOptionChoice(
  currentGroups: SelectedOptionGroup[],
  optionGroups: MenuOptionGroup[],
  groupId: string,
  choiceId: string,
): SelectedOptionGroup[] {
  const optionGroup = optionGroups.find((group) => group.id === groupId);

  if (!optionGroup || !optionGroup.choices.some((choice) => choice.id === choiceId)) {
    return normalizeSelectedOptionGroups(currentGroups, optionGroups);
  }

  const currentSelection = normalizeSelectedOptionGroups(
    currentGroups,
    optionGroups,
  );
  const currentGroup = currentSelection.find((group) => group.groupId === groupId);
  const currentChoiceIds = currentGroup?.choiceIds ?? [];
  const isSelected = currentChoiceIds.includes(choiceId);
  let nextChoiceIds: string[];

  if (optionGroup.selectionMode === "single") {
    if (isSelected && (optionGroup.required || optionGroup.minSelect > 0)) {
      return currentSelection;
    }

    nextChoiceIds = isSelected ? [] : [choiceId];
  } else {
    if (isSelected) {
      nextChoiceIds = currentChoiceIds.filter((id) => id !== choiceId);
    } else if (
      optionGroup.maxSelect > 0 &&
      currentChoiceIds.length >= optionGroup.maxSelect
    ) {
      return currentSelection;
    } else {
      nextChoiceIds = [...currentChoiceIds, choiceId];
    }
  }

  const nextGroups = currentSelection
    .filter((group) => group.groupId !== groupId)
    .concat(
      nextChoiceIds.length > 0
        ? [{ groupId, choiceIds: normalizeChoiceIds(nextChoiceIds) }]
        : [],
    );

  return normalizeSelectedOptionGroups(nextGroups, optionGroups);
}

export function validateSelectedOptionGroups(
  optionGroups: MenuOptionGroup[],
  selectedOptionGroups: SelectedOptionGroup[],
) {
  const normalizedGroups = normalizeSelectedOptionGroups(
    selectedOptionGroups,
    optionGroups,
  );
  const countByGroup = new Map(
    normalizedGroups.map((group) => [group.groupId, group.choiceIds.length]),
  );

  for (const group of optionGroups) {
    const selectedCount = countByGroup.get(group.id) ?? 0;

    if (group.required && selectedCount === 0) {
      return `${group.title}은 필수입니다.`;
    }

    if (selectedCount < group.minSelect) {
      return `${group.title}은 최소 ${group.minSelect}개 선택해야 합니다.`;
    }

    if (group.maxSelect > 0 && selectedCount > group.maxSelect) {
      return `${group.title}은 최대 ${group.maxSelect}개까지 선택할 수 있습니다.`;
    }

    if (group.selectionMode === "single" && selectedCount > 1) {
      return `${group.title}은 하나만 선택할 수 있습니다.`;
    }
  }

  return null;
}

export function upsertCartItem<
  TCartItem extends { cartId: string; quantity: number },
>(cartItems: TCartItem[], nextItem: TCartItem) {
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
