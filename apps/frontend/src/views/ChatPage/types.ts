import type {
  FulfillmentType,
  MenuItem,
  MenuListResponse,
  PaymentMethod,
  PointAccrualRequest,
} from "../../lib/api/types";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export type ParsedOrderIntent = {
  companyId: string | null;
  menuKeyword: string | null;
  optionKeywords: string[];
  quantity: number;
  quantityMentioned: boolean;
  fulfillmentType: FulfillmentType;
  fulfillmentTypeMentioned: boolean;
  paymentMethod: PaymentMethod;
  paymentMethodMentioned: boolean;
  pointAccrual: PointAccrualRequest;
};

export type OrderDraftSelectedOptionGroup = {
  groupId: string;
  groupTitle: string;
  choiceIds: string[];
  choiceNames: string[];
};

export type OrderDraft = {
  companyId: string;
  companyName: string;
  menuId: string;
  menuName: string;
  quantity: number;
  selectedOptionGroups: OrderDraftSelectedOptionGroup[];
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  pointAccrual: PointAccrualRequest;
  totalPrice: number;
};

export type BuildOrderDraftResult =
  | {
      status: "missing_company";
      message: string;
    }
  | {
      status: "missing_menu";
      message: string;
    }
  | {
      status: "ambiguous_menu";
      message: string;
      candidates: MenuItem[];
    }
  | {
      status: "missing_required_options";
      message: string;
      menu: MenuItem;
    }
  | {
      status: "ready";
      message: string;
      draft: OrderDraft;
    };

export type ChatMenuCache = Record<string, MenuListResponse>;
