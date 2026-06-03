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

export type MenuOption = {
  id: string;
  name: string;
  priceDelta: number;
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
  options: MenuOption[];
  badge?: string;
};

export type MenuListResponse = {
  company: Company;
  menus: MenuItem[];
};

export type OrderItemRequest = {
  menuId: string;
  quantity: number;
  selectedOptionIds: string[];
};

export type OrderCreateRequest = {
  companyId: string;
  userId: string;
  items: OrderItemRequest[];
};

export type OrderItemResponse = {
  id: string;
  orderId: string;
  menuId: string;
  menuName: string;
  quantity: number;
  selectedOptions: MenuOption[];
  unitPrice: number;
  itemPrice: number;
};

export type OrderResponse = {
  id: string;
  orderNumber: string;
  waitingNumber: number;
  userId: string;
  companyId: string;
  status: string;
  totalPrice: number;
  pointEarned: number;
  items: OrderItemResponse[];
  createdAt: string;
};

export type OrderListResponse = {
  orders: OrderResponse[];
};

export type AdminSummaryResponse = {
  totalOrders: number;
  totalSales: number;
  waitingOrders: number;
  companyCount: number;
  menuCount: number;
};
