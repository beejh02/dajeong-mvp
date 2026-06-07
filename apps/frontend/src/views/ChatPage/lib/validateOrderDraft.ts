import type { OrderCreateRequest, SourceChannel } from "../../../lib/api/types";
import type { OrderDraft } from "../types";

export function validateOrderDraft(draft: OrderDraft) {
  if (!draft.companyId || !draft.menuId) {
    return "주문할 기업과 메뉴를 확인해 주세요.";
  }

  if (draft.quantity < 1) {
    return "수량은 1개 이상이어야 합니다.";
  }

  return null;
}

export function buildOrderCreateRequest(
  draft: OrderDraft,
  userId: string,
  sourceChannel: SourceChannel,
): OrderCreateRequest {
  return {
    companyId: draft.companyId,
    userId,
    sourceChannel,
    items: [
      {
        menuId: draft.menuId,
        quantity: draft.quantity,
        selectedOptionGroups: draft.selectedOptionGroups.map((group) => ({
          groupId: group.groupId,
          choiceIds: group.choiceIds,
        })),
      },
    ],
    fulfillmentType: draft.fulfillmentType,
    paymentMethod: draft.paymentMethod,
    pointAccrual: draft.pointAccrual,
  };
}
