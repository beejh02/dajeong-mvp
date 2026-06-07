import type { ChannelStat, Order, SummaryCard } from "./types";

export const summaryCards: SummaryCard[] = [
  { label: "오늘 주문", value: "0건" },
  { label: "오늘 더미 매출", value: "₩0" },
  { label: "전체 주문", value: "16건" },
  { label: "전체 더미 매출", value: "₩110,600" },
  { label: "결제 대기", value: "2건" },
  { label: "결제 완료", value: "14건" },
  { label: "영수증 발급", value: "14건" },
  { label: "포인트 적립", value: "1,106 P" },
];

export const channelStats: ChannelStat[] = [
  { name: "A기업 Kiosk", orders: 0, paidOrders: 0, revenue: 0 },
  { name: "B기업 Kiosk", orders: 8, paidOrders: 6, revenue: 47400 },
  { name: "AI Agent with MCP", orders: 5, paidOrders: 5, revenue: 39500 },
];

export const orders: Order[] = [
  {
    id: "#16",
    number: 16,
    customer: "통합 검증 사용자",
    email: "phase10.1777825879-76c1c0e2@example.test",
    source: "MCP",
    targetCompany: "A기업",
    status: "결제 완료",
    payment: "승인",
    point: "79 P",
    pointBalance: "237 P",
    receipt: "발급",
    receiptNumber: "R-00000016",
    amount: "₩7,900",
    createdAt: "26. 5. 3. 오후 4:31",
    approvedCode: "DUMMY-APPROVED-00000016",
    productName: "데리버거 세트",
    productOptions: ["음료 선택: 콜라", "사이드 선택: 감자튀김"],
  },
  {
    id: "#15",
    number: 15,
    customer: "통합 검증 사용자",
    email: "phase10.1777825879-76c1c0e2@example.test",
    source: "AI Agent",
    targetCompany: "A기업",
    status: "결제 완료",
    payment: "승인",
    point: "79 P",
    pointBalance: "158 P",
    receipt: "발급",
    receiptNumber: "R-00000015",
    amount: "₩7,900",
    createdAt: "26. 5. 3. 오후 4:31",
    approvedCode: "DUMMY-APPROVED-00000015",
    productName: "데리버거 세트",
    productOptions: ["음료 선택: 콜라", "사이드 선택: 감자튀김"],
  },
  {
    id: "#14",
    number: 14,
    customer: "통합 검증 사용자",
    email: "phase10.1777825879-76c1c0e2@example.test",
    source: "다정 프리미엄",
    targetCompany: "B기업",
    status: "결제 완료",
    payment: "승인",
    point: "79 P",
    pointBalance: "79 P",
    receipt: "발급",
    receiptNumber: "R-00000014",
    amount: "₩7,900",
    createdAt: "26. 5. 3. 오후 4:31",
    approvedCode: "DUMMY-APPROVED-00000014",
    productName: "데리버거 세트",
    productOptions: ["음료 선택: 콜라", "사이드 선택: 감자튀김"],
  },
];

export const maxRevenue = Math.max(...channelStats.map((item) => item.revenue), 1);

export function formatCurrency(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}
