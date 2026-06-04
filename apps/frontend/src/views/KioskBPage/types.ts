export type MenuOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  img: string;
  options: MenuOption[];
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
  selectedOptions: MenuOption[];
  unitPrice: number;
};
