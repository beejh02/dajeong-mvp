import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const selectedOptionGroupSchema = {
  type: "object",
  properties: {
    groupId: { type: "string", minLength: 1 },
    choiceIds: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
  },
  required: ["groupId", "choiceIds"],
};

const orderItemSchema = {
  type: "object",
  properties: {
    menuId: { type: "string", minLength: 1 },
    quantity: { type: "integer", minimum: 1 },
    selectedOptionGroups: {
      type: "array",
      items: selectedOptionGroupSchema,
    },
  },
  required: ["menuId", "quantity", "selectedOptionGroups"],
};

const pointAccrualSchema = {
  type: "object",
  properties: {
    enabled: { type: "boolean" },
    phone: { type: ["string", "null"] },
  },
  required: ["enabled"],
};

const orderRequestSchema = {
  type: "object",
  properties: {
    companyId: { type: "string", minLength: 1 },
    userId: { type: "string", minLength: 1 },
    sourceChannel: {
      type: "string",
      enum: ["kiosk_a", "kiosk_b", "dajeong_ai"],
    },
    items: {
      type: "array",
      minItems: 1,
      items: orderItemSchema,
    },
    fulfillmentType: {
      type: "string",
      enum: ["dine_in", "pickup"],
    },
    paymentMethod: {
      type: "string",
      enum: ["credit_card", "coupon", "cash"],
    },
    pointAccrual: pointAccrualSchema,
  },
  required: [
    "companyId",
    "userId",
    "items",
    "fulfillmentType",
    "paymentMethod",
    "pointAccrual",
  ],
};

export const dajeongMcpServerTools = [
  {
    name: "get_companies",
    title: "Get companies",
    description: "Return the companies available through Dajeong.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "get_company_menus",
    title: "Get company menus",
    description: "Return menu data for one Dajeong company.",
    inputSchema: {
      type: "object",
      properties: {
        companyId: { type: "string", minLength: 1 },
      },
      required: ["companyId"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "search_menu",
    title: "Search menu",
    description: "Search available menu items for one Dajeong company.",
    inputSchema: {
      type: "object",
      properties: {
        companyId: { type: "string", minLength: 1 },
        query: { type: "string", minLength: 1 },
      },
      required: ["companyId", "query"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "create_order_draft",
    title: "Create order draft",
    description:
      "Validate menu selections and return a draft that requires explicit UI confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        companyId: { type: "string", minLength: 1 },
        userId: { type: "string", minLength: 1 },
        items: {
          type: "array",
          minItems: 1,
          items: orderItemSchema,
        },
        fulfillmentType: {
          type: "string",
          enum: ["dine_in", "pickup"],
        },
        paymentMethod: {
          type: "string",
          enum: ["credit_card", "coupon", "cash"],
        },
        pointAccrual: pointAccrualSchema,
      },
      required: [
        "companyId",
        "userId",
        "items",
        "fulfillmentType",
        "paymentMethod",
        "pointAccrual",
      ],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "confirm_order",
    title: "Confirm order",
    description:
      "Create the order after trusted UI confirmation; the server forces sourceChannel to dajeong_ai.",
    inputSchema: {
      type: "object",
      properties: {
        draftId: { type: "string", minLength: 1 },
        confirmedByUser: { type: "boolean", const: true },
        order: orderRequestSchema,
      },
      required: ["draftId", "confirmedByUser", "order"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
] satisfies Tool[];
