// 이 파일은 Gemini function calling declaration만 정의한다.
// 실제 실행은 toolHandlers.ts에서 처리한다.
// confirm_order는 사용자 확인 이후에만 실행되어야 한다.

export type GeminiToolName =
  | "get_companies"
  | "get_company_menus"
  | "search_menu"
  | "create_order_draft"
  | "confirm_order";

const selectedOptionGroupSchema = {
  type: "object",
  properties: {
    groupId: {
      type: "string",
      description: "Option group id.",
    },
    choiceIds: {
      type: "array",
      description: "Selected option choice ids.",
      items: {
        type: "string",
      },
    },
  },
  required: ["groupId", "choiceIds"],
} as const;

const orderItemSchema = {
  type: "object",
  properties: {
    menuId: {
      type: "string",
      description: "Menu id to order.",
    },
    quantity: {
      type: "number",
      description: "Menu item quantity.",
    },
    selectedOptionGroups: {
      type: "array",
      description: "Selected options grouped by option group.",
      items: selectedOptionGroupSchema,
    },
  },
  required: ["menuId", "quantity", "selectedOptionGroups"],
} as const;

const pointAccrualSchema = {
  type: "object",
  properties: {
    enabled: {
      type: "boolean",
      description: "Whether point accrual is requested.",
    },
    phone: {
      type: "string",
      description: "Phone number for point accrual. Use empty string when phone is absent.",
    },
  },
  required: ["enabled", "phone"],
} as const;

export const getCompaniesDeclaration = {
  name: "get_companies",
  description: "연결 가능한 데모 기업 목록을 조회한다.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
} as const;

export const getCompanyMenusDeclaration = {
  name: "get_company_menus",
  description: "특정 기업의 메뉴 목록을 조회한다.",
  parameters: {
    type: "object",
    properties: {
      companyId: {
        type: "string",
        description: "Menu target company id. Example: company-a or company-b.",
      },
    },
    required: ["companyId"],
  },
} as const;

export const searchMenuDeclaration = {
  name: "search_menu",
  description: "특정 기업 메뉴에서 자연어 keyword로 메뉴 후보를 검색한다.",
  parameters: {
    type: "object",
    properties: {
      companyId: {
        type: "string",
        description: "Menu target company id. Example: company-a or company-b.",
      },
      query: {
        type: "string",
        description: "Natural-language menu search keyword.",
      },
    },
    required: ["companyId", "query"],
  },
} as const;

export const createOrderDraftDeclaration = {
  name: "create_order_draft",
  description:
    "실제 주문을 생성하지 않고 사용자 확인용 주문 초안을 만든다. This tool must not create a real order. It only creates a draft for user confirmation.",
  parameters: {
    type: "object",
    properties: {
      companyId: {
        type: "string",
        description: "Menu target company id. Example: company-a or company-b.",
      },
      userId: {
        type: "string",
        description: "User id for the draft order.",
      },
      items: {
        type: "array",
        description: "Draft order items.",
        items: orderItemSchema,
      },
      fulfillmentType: {
        type: "string",
        description: "Order fulfillment type.",
        enum: ["dine_in", "pickup"],
      },
      paymentMethod: {
        type: "string",
        description: "Payment method selected by the user.",
        enum: ["credit_card", "coupon", "cash"],
      },
      pointAccrual: pointAccrualSchema,
    },
    required: ["companyId", "userId", "items", "fulfillmentType", "paymentMethod", "pointAccrual"],
  },
} as const;

export const confirmOrderDeclaration = {
  name: "confirm_order",
  description:
    "사용자가 UI에서 확인한 주문 초안을 실제 주문으로 생성한다. Only call this tool after the user pressed confirm in the order_draft card. The local handler must reject the call unless confirmedByUser is true.",
  parameters: {
    type: "object",
    properties: {
      draftId: {
        type: "string",
        description: "Confirmed draft id.",
      },
      confirmedByUser: {
        type: "boolean",
        description: "Must be true only after the user pressed confirm in the order_draft card.",
      },
      order: {
        type: "object",
        properties: {
          companyId: {
            type: "string",
            description: "Target company id.",
          },
          userId: {
            type: "string",
            description: "User id for the order.",
          },
          sourceChannel: {
            type: "string",
            description: "Order source channel. Must be dajeong_ai for Gemini chat orders.",
            enum: ["dajeong_ai"],
          },
          items: {
            type: "array",
            description: "Confirmed order items.",
            items: orderItemSchema,
          },
          fulfillmentType: {
            type: "string",
            description: "Order fulfillment type.",
            enum: ["dine_in", "pickup"],
          },
          paymentMethod: {
            type: "string",
            description: "Payment method selected by the user.",
            enum: ["credit_card", "coupon", "cash"],
          },
          pointAccrual: pointAccrualSchema,
        },
        required: [
          "companyId",
          "userId",
          "sourceChannel",
          "items",
          "fulfillmentType",
          "paymentMethod",
          "pointAccrual",
        ],
      },
    },
    required: ["draftId", "confirmedByUser", "order"],
  },
} as const;

export const dajeongFunctionDeclarations = [
  getCompaniesDeclaration,
  getCompanyMenusDeclaration,
  searchMenuDeclaration,
  createOrderDraftDeclaration,
  confirmOrderDeclaration,
] as const;
