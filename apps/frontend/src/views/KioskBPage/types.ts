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
  name: string;
  description: string;
  price: number;
  img: string;
  optionGroups: MenuOptionGroup[];
  options: MenuOptionChoice[];
  badge?: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  icon: string;
  label: string;
  items: MenuItem[];
};

export type CartItem = MenuItem & {
  cartId: string;
  quantity: number;
  selectedOptionIds: string[];
  selectedOptions: MenuOptionChoice[];
  unitPrice: number;
};
