from datetime import datetime, timedelta, timezone
from itertools import count
import re

from fastapi import HTTPException

from app.data import COMPANIES, MENUS, USERS
from app.schemas import (
    AdminSummaryResponse,
    Company,
    MenuItem,
    MenuListResponse,
    MenuOptionChoice,
    OrderCreateRequest,
    OrderItemRequest,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
    SelectedOptionGroup,
    SelectedOptionGroupResponse,
    User,
)


KST = timezone(timedelta(hours=9))
PHONE_ALLOWED_PATTERN = re.compile(r"^[\d\s-]+$")


class InMemoryStore:
    def __init__(self) -> None:
        self.companies = {company["id"]: Company(**company) for company in COMPANIES}
        self.users = {user["id"]: User(**user) for user in USERS}
        self.menus = {menu["id"]: MenuItem(**menu) for menu in MENUS}
        self.reset_orders()

    def reset_orders(self) -> None:
        self.orders: dict[str, OrderResponse] = {}
        self.order_sequence = count(1)
        self.waiting_sequence = count(101)

    def list_companies(self) -> list[Company]:
        return list(self.companies.values())

    def get_company(self, company_id: str) -> Company:
        if company_id not in self.companies:
            raise HTTPException(status_code=404, detail="Company not found")
        return self.companies[company_id]

    def list_company_menus(self, company_id: str) -> MenuListResponse:
        company = self.get_company(company_id)
        menus = [menu for menu in self.menus.values() if menu.companyId == company_id]
        return MenuListResponse(company=company, menus=menus)

    def create_order(self, order_request: OrderCreateRequest) -> OrderResponse:
        self.get_company(order_request.companyId)
        self._get_user(order_request.userId)
        self._validate_point_accrual(order_request)

        order_index = next(self.order_sequence)
        order_id = f"order-{order_index:04d}"
        order_items = [
            self._build_order_item(order_id, order_index, line_index, order_request.companyId, item)
            for line_index, item in enumerate(order_request.items, start=1)
        ]
        total_price = sum(item.itemPrice for item in order_items)

        order = OrderResponse(
            id=order_id,
            orderNumber=f"ORD-{datetime.now(KST).strftime('%Y%m%d')}-{order_index:04d}",
            waitingNumber=next(self.waiting_sequence),
            userId=order_request.userId,
            companyId=order_request.companyId,
            sourceChannel=order_request.sourceChannel,
            status="waiting",
            totalPrice=total_price,
            pointEarned=total_price // 100,
            fulfillmentType=order_request.fulfillmentType,
            paymentMethod=order_request.paymentMethod,
            pointAccrual=order_request.pointAccrual,
            items=order_items,
            createdAt=datetime.now(KST).isoformat(),
        )
        self.orders[order.id] = order
        return order

    def list_orders(self) -> OrderListResponse:
        return OrderListResponse(orders=list(self.orders.values()))

    def get_order(self, order_id: str) -> OrderResponse:
        if order_id not in self.orders:
            raise HTTPException(status_code=404, detail="Order not found")
        return self.orders[order_id]

    def get_summary(self) -> AdminSummaryResponse:
        orders = list(self.orders.values())
        return AdminSummaryResponse(
            totalOrders=len(orders),
            totalSales=sum(order.totalPrice for order in orders),
            waitingOrders=sum(order.status == "waiting" for order in orders),
            companyCount=len(self.companies),
            menuCount=len(self.menus),
        )

    def _get_user(self, user_id: str) -> User:
        if user_id not in self.users:
            raise HTTPException(status_code=404, detail="User not found")
        return self.users[user_id]

    def _build_order_item(
        self,
        order_id: str,
        order_index: int,
        line_index: int,
        company_id: str,
        item_request: OrderItemRequest,
    ) -> OrderItemResponse:
        if item_request.menuId not in self.menus:
            raise HTTPException(status_code=404, detail="Menu not found")

        menu = self.menus[item_request.menuId]
        if menu.companyId != company_id:
            raise HTTPException(status_code=400, detail="Menu does not belong to company")
        if not menu.isAvailable:
            raise HTTPException(status_code=400, detail="Menu is not available")

        selected_option_groups = self._resolve_option_groups(
            menu,
            item_request.selectedOptionGroups,
        )
        unit_price = menu.price + sum(
            choice.priceDelta
            for group in selected_option_groups
            for choice in group.choices
        )

        return OrderItemResponse(
            id=f"order-item-{order_index:04d}-{line_index:02d}",
            orderId=order_id,
            menuId=menu.id,
            menuName=menu.name,
            quantity=item_request.quantity,
            selectedOptionGroups=selected_option_groups,
            unitPrice=unit_price,
            itemPrice=unit_price * item_request.quantity,
        )

    def _validate_point_accrual(self, order_request: OrderCreateRequest) -> None:
        phone = order_request.pointAccrual.phone

        if not order_request.pointAccrual.enabled:
            return

        normalized_phone = phone.strip() if phone else ""

        if not normalized_phone:
            raise HTTPException(status_code=400, detail="Point phone is required")
        if not PHONE_ALLOWED_PATTERN.fullmatch(normalized_phone):
            raise HTTPException(status_code=400, detail="Point phone format is invalid")

        digit_count = len(re.sub(r"\D", "", normalized_phone))
        if digit_count < 8 or digit_count > 15:
            raise HTTPException(status_code=400, detail="Point phone format is invalid")

        order_request.pointAccrual.phone = normalized_phone

    def _resolve_option_groups(
        self,
        menu: MenuItem,
        selected_groups: list[SelectedOptionGroup],
    ) -> list[SelectedOptionGroupResponse]:
        group_by_id = {group.id: group for group in menu.optionGroups}
        selected_by_group: dict[str, SelectedOptionGroup] = {}

        for selected_group in selected_groups:
            if selected_group.groupId not in group_by_id:
                raise HTTPException(status_code=400, detail="Menu option group not found")
            if selected_group.groupId in selected_by_group:
                raise HTTPException(status_code=400, detail="Duplicate option group selected")
            selected_by_group[selected_group.groupId] = selected_group

        selected_option_groups: list[SelectedOptionGroupResponse] = []

        for group in menu.optionGroups:
            selected_group = selected_by_group.get(group.id)
            choice_ids = selected_group.choiceIds if selected_group else []

            choices = self._resolve_group_choices(group.choices, choice_ids)
            choice_count = len(choices)

            if group.required and choice_count == 0:
                raise HTTPException(status_code=400, detail="Required option group is missing")
            if group.selectionMode == "single" and choice_count > 1:
                raise HTTPException(
                    status_code=400,
                    detail="Single option group cannot have multiple choices",
                )
            if choice_count < group.minSelect:
                raise HTTPException(status_code=400, detail="Too few option choices selected")
            if choice_count > group.maxSelect:
                raise HTTPException(status_code=400, detail="Too many option choices selected")

            if choices:
                selected_option_groups.append(
                    SelectedOptionGroupResponse(
                        groupId=group.id,
                        groupTitle=group.title,
                        choices=choices,
                    )
                )

        return selected_option_groups

    def _resolve_group_choices(
        self,
        choices: list[MenuOptionChoice],
        choice_ids: list[str],
    ) -> list[MenuOptionChoice]:
        choice_by_id = {choice.id: choice for choice in choices}
        seen_choice_ids: set[str] = set()
        selected_choices: list[MenuOptionChoice] = []

        for choice_id in choice_ids:
            if choice_id in seen_choice_ids:
                raise HTTPException(status_code=400, detail="Duplicate option choice selected")
            if choice_id not in choice_by_id:
                raise HTTPException(status_code=400, detail="Menu option choice not found")

            seen_choice_ids.add(choice_id)
            selected_choices.append(choice_by_id[choice_id])

        return selected_choices


store = InMemoryStore()
