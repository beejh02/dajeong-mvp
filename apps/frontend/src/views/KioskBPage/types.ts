import type { MenuOptionGroup } from "../../lib/api/types";
import type { KioskCartItem } from "../kioskCart";

export type {
  FulfillmentType,
  MenuOptionChoice,
  MenuOptionGroup,
  PaymentMethod,
  PointAccrualRequest,
  SelectedOptionGroup,
} from "../../lib/api/types";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  img: string;
  optionGroups: MenuOptionGroup[];
  badge?: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  icon: string;
  label: string;
  items: MenuItem[];
};

export type CartItem = KioskCartItem<MenuItem>;
