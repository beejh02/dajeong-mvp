export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  img: string;
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
  quantity: number;
};
