// 이 파일은 Gemini function calling의 local tool handler를 제공한다.
// 이번 단계에서는 조회성 low-risk tool만 구현한다.
// 주문 생성은 confirm_order handler에서만 다루며, 이 파일의 현재 구현에는 포함하지 않는다.

import { BACKEND_API_URL } from "../api/client";
import type { CompanyListResponse, MenuItem, MenuListResponse } from "../api/types";

export type GetCompaniesArgs = Record<string, never>;

export type GetCompanyMenusArgs = {
  companyId: string;
};

export type SearchMenuArgs = {
  companyId: string;
  query: string;
};

export type CreateOrderDraftArgs = {
  companyId: string;
  userId: string;
  items: Array<{
    menuId: string;
    quantity: number;
    selectedOptionGroups: Array<{
      groupId: string;
      choiceIds: string[];
    }>;
  }>;
  fulfillmentType: "dine_in" | "pickup";
  paymentMethod: "credit_card" | "coupon" | "cash";
  pointAccrual: {
    enabled: boolean;
    phone: string;
  };
};

export type CreateOrderDraftResult = {
  draftId: string;
  companyId: string;
  companyName: string;
  items: Array<{
    menuId: string;
    menuName: string;
    quantity: number;
    selectedOptions: Array<{
      groupId: string;
      groupTitle: string;
      choices: Array<{
        id: string;
        name: string;
        priceDelta: number;
      }>;
    }>;
    unitPrice: number;
    itemPrice: number;
  }>;
  totalPrice: number;
  warnings: string[];
  requiredUserAction: true;
  recommendedCardType: "order_draft";
};

async function requestBackendJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_API_URL}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Backend API request failed: ${path} (${response.status})`);
  }

  return response.json() as Promise<T>;
}

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

function requireStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be a string array.`);
  }

  return value.map((item, index) =>
    requireNonEmptyString(item, `${fieldName}[${index}]`),
  );
}

function requireFulfillmentType(value: unknown): CreateOrderDraftArgs["fulfillmentType"] {
  if (value !== "dine_in" && value !== "pickup") {
    throw new Error("fulfillmentType must be dine_in or pickup.");
  }

  return value;
}

function requirePaymentMethod(value: unknown): CreateOrderDraftArgs["paymentMethod"] {
  if (value !== "credit_card" && value !== "coupon" && value !== "cash") {
    throw new Error("paymentMethod must be credit_card, coupon, or cash.");
  }

  return value;
}

function normalizeCreateOrderDraftArgs(
  args: CreateOrderDraftArgs,
): CreateOrderDraftArgs {
  const input = requireObject(args, "args");
  const rawItems = input.items;
  const pointAccrual = requireObject(input.pointAccrual, "pointAccrual");

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("items must include at least one item.");
  }

  if (typeof pointAccrual.enabled !== "boolean") {
    throw new Error("pointAccrual.enabled must be a boolean.");
  }

  if (typeof pointAccrual.phone !== "string") {
    throw new Error("pointAccrual.phone must be a string.");
  }

  return {
    companyId: requireNonEmptyString(input.companyId, "companyId"),
    userId: requireNonEmptyString(input.userId, "userId"),
    items: rawItems.map((rawItem, itemIndex) => {
      const item = requireObject(rawItem, `items[${itemIndex}]`);
      const quantity = item.quantity;
      const selectedOptionGroups = item.selectedOptionGroups;

      if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error(`items[${itemIndex}].quantity must be an integer greater than 0.`);
      }

      if (!Array.isArray(selectedOptionGroups)) {
        throw new Error(`items[${itemIndex}].selectedOptionGroups must be an array.`);
      }

      return {
        menuId: requireNonEmptyString(item.menuId, `items[${itemIndex}].menuId`),
        quantity,
        selectedOptionGroups: selectedOptionGroups.map((rawGroup, groupIndex) => {
          const group = requireObject(
            rawGroup,
            `items[${itemIndex}].selectedOptionGroups[${groupIndex}]`,
          );

          return {
            groupId: requireNonEmptyString(
              group.groupId,
              `items[${itemIndex}].selectedOptionGroups[${groupIndex}].groupId`,
            ),
            choiceIds: requireStringArray(
              group.choiceIds,
              `items[${itemIndex}].selectedOptionGroups[${groupIndex}].choiceIds`,
            ),
          };
        }),
      };
    }),
    fulfillmentType: requireFulfillmentType(input.fulfillmentType),
    paymentMethod: requirePaymentMethod(input.paymentMethod),
    pointAccrual: {
      enabled: pointAccrual.enabled,
      phone: pointAccrual.phone,
    },
  };
}

function buildSelectedOptions(
  menu: MenuItem,
  item: CreateOrderDraftArgs["items"][number],
): CreateOrderDraftResult["items"][number]["selectedOptions"] {
  const optionGroupsById = new Map(menu.optionGroups.map((group) => [group.id, group]));
  const selectedGroupIds = new Set<string>();

  for (const optionGroup of menu.optionGroups) {
    const selectedGroup = item.selectedOptionGroups.find(
      (group) => group.groupId === optionGroup.id,
    );

    if (optionGroup.required && !selectedGroup) {
      throw new Error(`Required option group is missing: ${optionGroup.id}`);
    }
  }

  return item.selectedOptionGroups.map((selectedGroup) => {
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

export async function handleGetCompanies(
  _args: GetCompaniesArgs,
): Promise<CompanyListResponse> {
  void _args;

  return requestBackendJson<CompanyListResponse>("/companies");
}

export async function handleGetCompanyMenus(
  args: GetCompanyMenusArgs,
): Promise<MenuListResponse> {
  if (typeof args?.companyId !== "string" || args.companyId.trim() === "") {
    throw new Error("companyId is required.");
  }

  const companyId = args.companyId.trim();

  return requestBackendJson<MenuListResponse>(
    `/companies/${encodeURIComponent(companyId)}/menus`,
  );
}

export async function handleSearchMenu(
  args: SearchMenuArgs,
): Promise<{ menus: MenuItem[] }> {
  if (typeof args?.companyId !== "string" || args.companyId.trim() === "") {
    throw new Error("companyId is required.");
  }

  if (typeof args?.query !== "string" || args.query.trim() === "") {
    throw new Error("query is required.");
  }

  const companyId = args.companyId.trim();
  const query = args.query.trim().toLowerCase();
  const response = await requestBackendJson<MenuListResponse>(
    `/companies/${encodeURIComponent(companyId)}/menus`,
  );

  const filteredMenus = response.menus.filter((menu) => {
    if (!menu.isAvailable) {
      return false;
    }

    const searchableText = [menu.name, menu.category, menu.description]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });

  return { menus: filteredMenus };
}

// 이 handler는 실제 주문을 생성하지 않는다.
// 사용자 확인용 draft만 만들며 POST /orders를 호출하면 안 된다.
export async function handleCreateOrderDraft(
  args: CreateOrderDraftArgs,
): Promise<CreateOrderDraftResult> {
  const normalizedArgs = normalizeCreateOrderDraftArgs(args);
  const response = await requestBackendJson<MenuListResponse>(
    `/companies/${encodeURIComponent(normalizedArgs.companyId)}/menus`,
  );
  const menusById = new Map(response.menus.map((menu) => [menu.id, menu]));

  const draftItems = normalizedArgs.items.map((item) => {
    const menu = menusById.get(item.menuId);

    if (!menu) {
      throw new Error(`Unknown menu: ${item.menuId}`);
    }

    if (!menu.isAvailable) {
      throw new Error(`Menu is not available: ${item.menuId}`);
    }

    const selectedOptions = buildSelectedOptions(menu, item);
    const optionPriceDelta = selectedOptions.reduce(
      (optionTotal, selectedOption) =>
        optionTotal +
        selectedOption.choices.reduce(
          (choiceTotal, choice) => choiceTotal + choice.priceDelta,
          0,
        ),
      0,
    );
    const unitPrice = menu.price + optionPriceDelta;
    const itemPrice = unitPrice * item.quantity;

    return {
      menuId: menu.id,
      menuName: menu.name,
      quantity: item.quantity,
      selectedOptions,
      unitPrice,
      itemPrice,
    };
  });
  const totalPrice = draftItems.reduce((sum, item) => sum + item.itemPrice, 0);

  return {
    // MVP용 임시 draft id이며 보안적으로 중요한 식별자가 아니다.
    draftId: `draft-${Date.now()}`,
    companyId: normalizedArgs.companyId,
    companyName: response.company.name,
    items: draftItems,
    totalPrice,
    warnings: [],
    requiredUserAction: true,
    recommendedCardType: "order_draft",
  };
}
