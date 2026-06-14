export type Company = {
  id: string;
  name: string;
  displayName: string;
  uiType: string;
  description: string;
};

export type CompanyListResponse = {
  companies: Company[];
};

export type MenuOptionChoice = {
  id: string;
  name: string;
  priceDelta: number;
};

export type MenuOptionGroup = {
  id: string;
  title: string;
  selectionMode: "single" | "multiple";
  required: boolean;
  minSelect: number;
  maxSelect: number;
  choices: MenuOptionChoice[];
};

export type MenuItem = {
  id: string;
  companyId: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  optionGroups: MenuOptionGroup[];
  badge?: string;
};

export type MenuListResponse = {
  company: Company;
  menus: MenuItem[];
};

export type SelectedOptionGroup = {
  groupId: string;
  choiceIds: string[];
};

export type FulfillmentType = "dine_in" | "pickup";

export type PaymentMethod = "credit_card" | "coupon" | "cash";

export type SourceChannel = "kiosk_a" | "kiosk_b" | "dajeong_ai";

export type PointAccrualRequest = {
  enabled: boolean;
  phone?: string | null;
};

export type OrderItemRequest = {
  menuId: string;
  quantity: number;
  selectedOptionGroups: SelectedOptionGroup[];
};

export type OrderCreateRequest = {
  companyId: string;
  userId: string;
  sourceChannel: SourceChannel;
  items: OrderItemRequest[];
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  pointAccrual: PointAccrualRequest;
};

export type SelectedOptionGroupResponse = {
  groupId: string;
  groupTitle: string;
  choices: MenuOptionChoice[];
};

export type OrderItemResponse = {
  id: string;
  orderId: string;
  menuId: string;
  menuName: string;
  quantity: number;
  selectedOptionGroups: SelectedOptionGroupResponse[];
  unitPrice: number;
  itemPrice: number;
};

export type OrderResponse = {
  id: string;
  orderNumber: string;
  waitingNumber: number;
  userId: string;
  companyId: string;
  sourceChannel: SourceChannel;
  status: string;
  totalPrice: number;
  pointEarned: number;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  pointAccrual: PointAccrualRequest;
  items: OrderItemResponse[];
  createdAt: string;
};

export type CreateOrderDraftArgs = {
  companyId: string;
  userId: string;
  items: OrderItemRequest[];
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  pointAccrual: PointAccrualRequest;
};

export type CreateOrderDraftItem = {
  menuId: string;
  menuName: string;
  quantity: number;
  selectedOptions: Array<{
    groupId: string;
    groupTitle: string;
    choices: MenuOptionChoice[];
  }>;
  unitPrice: number;
  itemPrice: number;
};

export type CreateOrderDraftReadyResult = {
  draftId: string;
  companyId: string;
  companyName: string;
  items: CreateOrderDraftItem[];
  totalPrice: number;
  warnings: string[];
  requiredUserAction: true;
  recommendedCardType: "order_draft";
};

export type CreateOrderDraftMissingOptionResult = {
  recommendedCardType: "missing_option";
  menuId: string;
  menuName: string;
  optionGroupId: string;
  optionGroupTitle: string;
  choices: MenuOptionChoice[];
  draftArguments: CreateOrderDraftArgs;
  requiredUserAction: true;
};

export type CreateOrderDraftResult =
  | CreateOrderDraftReadyResult
  | CreateOrderDraftMissingOptionResult;

export type ConfirmOrderArgs = {
  draftId: string;
  confirmedByUser: boolean;
  order: Omit<OrderCreateRequest, "sourceChannel"> & {
    sourceChannel?: SourceChannel;
  };
};

export type ConfirmOrderResult = {
  orderNumber: string;
  waitingNumber: number;
  status: string;
  totalPrice: number;
  recommendedCardType: "order_confirmed";
};
