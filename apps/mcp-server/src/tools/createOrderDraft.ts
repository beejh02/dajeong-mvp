import { getCompanyMenus } from "../backendClient.js";
import type {
  CreateOrderDraftArgs,
  CreateOrderDraftResult,
  FulfillmentType,
  MenuItem,
  PaymentMethod,
  PointAccrualRequest,
  SelectedOptionGroup,
} from "../types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  return value;
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function requireFulfillmentType(value: unknown): FulfillmentType {
  if (value !== "dine_in" && value !== "pickup") {
    throw new Error("fulfillmentType must be dine_in or pickup.");
  }

  return value;
}

function requirePaymentMethod(value: unknown): PaymentMethod {
  if (value !== "credit_card" && value !== "coupon" && value !== "cash") {
    throw new Error("paymentMethod must be credit_card, coupon, or cash.");
  }

  return value;
}

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be a string array.`);
  }

  return value.map((item, index) =>
    requireNonEmptyString(item, `${fieldName}[${index}]`),
  );
}

function normalizeSelectedOptionGroups(
  value: unknown,
  fieldName: string,
): SelectedOptionGroup[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  return value.map((rawGroup, index) => {
    const group = requireObject(rawGroup, `${fieldName}[${index}]`);

    return {
      groupId: requireNonEmptyString(group.groupId, `${fieldName}[${index}].groupId`),
      choiceIds: requireStringArray(
        group.choiceIds,
        `${fieldName}[${index}].choiceIds`,
      ),
    };
  });
}

function normalizeItems(
  value: unknown,
): CreateOrderDraftArgs["items"] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("items must include at least one item.");
  }

  return value.map((rawItem, index) => {
    const item = requireObject(rawItem, `items[${index}]`);

    if (
      typeof item.quantity !== "number" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error(`items[${index}].quantity must be an integer greater than 0.`);
    }

    return {
      menuId: requireNonEmptyString(item.menuId, `items[${index}].menuId`),
      quantity: item.quantity,
      selectedOptionGroups: normalizeSelectedOptionGroups(
        item.selectedOptionGroups,
        `items[${index}].selectedOptionGroups`,
      ),
    };
  });
}

function normalizePointAccrual(value: unknown): PointAccrualRequest {
  const pointAccrual = requireObject(value, "pointAccrual");

  if (typeof pointAccrual.enabled !== "boolean") {
    throw new Error("pointAccrual.enabled must be a boolean.");
  }

  if (
    pointAccrual.phone !== undefined &&
    pointAccrual.phone !== null &&
    typeof pointAccrual.phone !== "string"
  ) {
    throw new Error("pointAccrual.phone must be a string or null.");
  }

  return {
    enabled: pointAccrual.enabled,
    phone:
      typeof pointAccrual.phone === "string" && pointAccrual.phone.trim() !== ""
        ? pointAccrual.phone.trim()
        : null,
  };
}

function normalizeArgs(args: CreateOrderDraftArgs): CreateOrderDraftArgs {
  const input = requireObject(args, "args");

  return {
    companyId: requireNonEmptyString(input.companyId, "companyId"),
    userId: requireNonEmptyString(input.userId, "userId"),
    items: normalizeItems(input.items),
    fulfillmentType: requireFulfillmentType(input.fulfillmentType),
    paymentMethod: requirePaymentMethod(input.paymentMethod),
    pointAccrual: normalizePointAccrual(input.pointAccrual),
  };
}

function buildSelectedOptions(
  menu: MenuItem,
  selectedOptionGroups: SelectedOptionGroup[],
): CreateOrderDraftResult["items"][number]["selectedOptions"] {
  const optionGroupsById = new Map(menu.optionGroups.map((group) => [group.id, group]));
  const selectedGroupIds = new Set<string>();

  for (const optionGroup of menu.optionGroups) {
    const selectedGroup = selectedOptionGroups.find(
      (group) => group.groupId === optionGroup.id,
    );

    if (optionGroup.required && !selectedGroup) {
      throw new Error(`Required option group is missing: ${optionGroup.id}`);
    }
  }

  return selectedOptionGroups.map((selectedGroup) => {
    if (selectedGroupIds.has(selectedGroup.groupId)) {
      throw new Error(`Duplicate option group: ${selectedGroup.groupId}`);
    }

    selectedGroupIds.add(selectedGroup.groupId);

    const optionGroup = optionGroupsById.get(selectedGroup.groupId);

    if (!optionGroup) {
      throw new Error(`Unknown option group: ${selectedGroup.groupId}`);
    }

    const selectedChoiceIds = new Set<string>();
    const choices = selectedGroup.choiceIds.map((choiceId) => {
      if (selectedChoiceIds.has(choiceId)) {
        throw new Error(`Duplicate option choice: ${choiceId}`);
      }

      selectedChoiceIds.add(choiceId);

      const choice = optionGroup.choices.find((candidate) => candidate.id === choiceId);

      if (!choice) {
        throw new Error(`Unknown option choice: ${choiceId}`);
      }

      return {
        id: choice.id,
        name: choice.name,
        priceDelta: choice.priceDelta,
      };
    });

    if (optionGroup.selectionMode === "single" && choices.length > 1) {
      throw new Error(`Option group only allows one choice: ${optionGroup.id}`);
    }

    if (choices.length < optionGroup.minSelect) {
      throw new Error(`Too few choices selected for option group: ${optionGroup.id}`);
    }

    if (choices.length > optionGroup.maxSelect) {
      throw new Error(`Too many choices selected for option group: ${optionGroup.id}`);
    }

    return {
      groupId: optionGroup.id,
      groupTitle: optionGroup.title,
      choices,
    };
  });
}

function makeDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createOrderDraftTool(
  args: CreateOrderDraftArgs,
): Promise<CreateOrderDraftResult> {
  const normalizedArgs = normalizeArgs(args);
  const menuResponse = await getCompanyMenus(normalizedArgs.companyId);
  const menusById = new Map(menuResponse.menus.map((menu) => [menu.id, menu]));

  const items = normalizedArgs.items.map((item) => {
    const menu = menusById.get(item.menuId);

    if (!menu) {
      throw new Error(`Unknown menu: ${item.menuId}`);
    }

    if (!menu.isAvailable) {
      throw new Error(`Menu is not available: ${item.menuId}`);
    }

    const selectedOptions = buildSelectedOptions(menu, item.selectedOptionGroups);
    const optionTotal = selectedOptions.reduce(
      (groupTotal, selectedOption) =>
        groupTotal +
        selectedOption.choices.reduce(
          (choiceTotal, choice) => choiceTotal + choice.priceDelta,
          0,
        ),
      0,
    );
    const unitPrice = menu.price + optionTotal;

    return {
      menuId: menu.id,
      menuName: menu.name,
      quantity: item.quantity,
      selectedOptions,
      unitPrice,
      itemPrice: unitPrice * item.quantity,
    };
  });
  const totalPrice = items.reduce((sum, item) => sum + item.itemPrice, 0);

  return {
    draftId: makeDraftId(),
    companyId: normalizedArgs.companyId,
    companyName: menuResponse.company.name,
    items,
    totalPrice,
    warnings: [],
    requiredUserAction: true,
    recommendedCardType: "order_draft",
  };
}
