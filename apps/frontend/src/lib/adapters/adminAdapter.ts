import type {
  AdminSummaryResponse,
  OrderResponse,
  SourceChannel,
} from "../api/types";
import type { ChannelStat, Order, SummaryCard } from "../../views/AdminPage/types";

const SOURCE_CHANNEL_LABELS: Record<SourceChannel, string> = {
  kiosk_a: "A기업 Kiosk",
  kiosk_b: "B기업 Kiosk",
  dajeong_ai: "Dajeong AI",
};

const COMPANY_DEFAULT_SOURCE_CHANNELS: Record<string, SourceChannel> = {
  "company-a": "kiosk_a",
  "company-b": "kiosk_b",
};

const COMPANY_LABELS: Record<string, string> = {
  "company-a": "A기업",
  "company-b": "B기업",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  waiting: "대기",
  completed: "완료",
  canceled: "취소",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: "신용카드",
  coupon: "쿠폰",
  cash: "현금",
};

export function formatCurrency(value: number) {
  return `₩ ${value.toLocaleString("ko-KR")}`;
}

export function adaptAdminSummary(
  summary: AdminSummaryResponse,
): SummaryCard[] {
  return [
    { label: "전체 주문", value: `${summary.totalOrders}건` },
    { label: "전체 데모 매출", value: formatCurrency(summary.totalSales) },
    { label: "대기 주문", value: `${summary.waitingOrders}건` },
    { label: "연결 기업", value: `${summary.companyCount}개` },
    { label: "등록 메뉴", value: `${summary.menuCount}개` },
    { label: "결제 방식", value: "데모 승인" },
    { label: "영수증", value: "데모 발급" },
    { label: "포인트 적립", value: `${Math.floor(summary.totalSales / 100)} P` },
  ];
}

export function adaptOrderToAdminOrder(order: OrderResponse): Order {
  const firstItem = order.items[0];
  const extraItemCount = Math.max(order.items.length - 1, 0);
  const productName = firstItem
    ? `${firstItem.menuName}${extraItemCount > 0 ? ` 외 ${extraItemCount}개` : ""}`
    : "주문 상품 없음";
  const productOptions = order.items.flatMap((item) =>
    item.selectedOptionGroups.flatMap((group) =>
      group.choices.map((choice) => `${group.groupTitle}: ${choice.name}`),
    ),
  );

  const sourceChannel =
    order.sourceChannel ?? COMPANY_DEFAULT_SOURCE_CHANNELS[order.companyId];

  return {
    id: order.orderNumber,
    number: order.waitingNumber,
    customer: "다정 데모 사용자",
    email: `${order.userId}@dajeong.demo`,
    source: sourceChannel
      ? SOURCE_CHANNEL_LABELS[sourceChannel]
      : order.companyId,
    targetCompany: COMPANY_LABELS[order.companyId] ?? order.companyId,
    status: ORDER_STATUS_LABELS[order.status] ?? order.status,
    payment: PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
    point: `${order.pointEarned} P`,
    pointBalance: `${order.pointEarned} P`,
    receipt: "데모 발급",
    receiptNumber: `R-${order.id}`,
    amount: formatCurrency(order.totalPrice),
    createdAt: formatCreatedAt(order.createdAt),
    approvedCode: `DUMMY-${order.id}`,
    productName,
    productOptions: productOptions.length > 0 ? productOptions : ["옵션 없음"],
  };
}

export function adaptOrdersToChannelStats(orders: OrderResponse[]): ChannelStat[] {
  const stats = new Map<string, ChannelStat>();

  for (const order of orders) {
    const sourceChannel =
      order.sourceChannel ?? COMPANY_DEFAULT_SOURCE_CHANNELS[order.companyId];
    const name = sourceChannel
      ? SOURCE_CHANNEL_LABELS[sourceChannel]
      : order.companyId;
    const stat = stats.get(name) ?? {
      name,
      orders: 0,
      paidOrders: 0,
      revenue: 0,
    };

    stat.orders += 1;
    stat.paidOrders += 1;
    stat.revenue += order.totalPrice;
    stats.set(name, stat);
  }

  return Array.from(stats.values());
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
