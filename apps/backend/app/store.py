from datetime import datetime, timedelta, timezone
from itertools import count

from fastapi import HTTPException

from app.data import COMPANIES, MENUS, USERS
from app.schemas import (
    AdminSummaryResponse,
    Company,
    MenuItem,
    MenuListResponse,
    MenuOption,
    OrderCreateRequest,
    OrderItemRequest,
    OrderItemResponse,
    OrderListResponse,
    OrderResponse,
    User,
)


KST = timezone(timedelta(hours=9))


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
            status="waiting",
            totalPrice=total_price,
            pointEarned=total_price // 100,
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

        selected_options = self._resolve_options(menu, item_request.selectedOptionIds)
        unit_price = menu.price + sum(option.priceDelta for option in selected_options)

        return OrderItemResponse(
            id=f"order-item-{order_index:04d}-{line_index:02d}",
            orderId=order_id,
            menuId=menu.id,
            menuName=menu.name,
            quantity=item_request.quantity,
            selectedOptions=selected_options,
            unitPrice=unit_price,
            itemPrice=unit_price * item_request.quantity,
        )

    def _resolve_options(self, menu: MenuItem, option_ids: list[str]) -> list[MenuOption]:
        option_by_id = {option.id: option for option in menu.options}
        selected_options: list[MenuOption] = []

        for option_id in option_ids:
            if option_id not in option_by_id:
                raise HTTPException(status_code=400, detail="Menu option not found")
            selected_options.append(option_by_id[option_id])

        return selected_options


store = InMemoryStore()
