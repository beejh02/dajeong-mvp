// src/pages/AdminPage/types.ts

export type AdminTab = "overview" | "orders" | "detail";

export type SummaryCard = {
  label: string;
  value: string;
};

export type ChannelStat = {
  name: string;
  orders: number;
  paidOrders: number;
  revenue: number;
};

export type Order = {
  id: string;
  number: number;
  customer: string;
  email: string;
  source: string;
  targetCompany: string;
  status: string;
  payment: string;
  point: string;
  pointBalance: string;
  receipt: string;
  receiptNumber: string;
  amount: string;
  createdAt: string;
  approvedCode: string;
  productName: string;
  productOptions: string[];
};
