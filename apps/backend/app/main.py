from datetime import datetime, timedelta, timezone
from itertools import count
from typing import Annotated

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.data import COMPANIES, MENUS, USERS


app = FastAPI(title="Dajeong Backend")
KST = timezone(timedelta(hours=9))


class Company(BaseModel):
    id: str
    name: str
    displayName: str
    uiType: str
    description: str


class CompanyListResponse(BaseModel):
    companies: list[Company]


class MenuOption(BaseModel):
    id: str
    name: str
    priceDelta: int


class MenuItem(BaseModel):
    id: str
    companyId: str
    name: str
    category: str
    price: int
    description: str
    imageUrl: str
    isAvailable: bool
    options: list[MenuOption]


class MenuListResponse(BaseModel):
    company: Company
    menus: list[MenuItem]


class User(BaseModel):
    id: str
    name: str
    phone: str
    pointBalance: int
    defaultPaymentMethod: str


class OrderItemRequest(BaseModel):
    menuId: str
    quantity: Annotated[int, Field(ge=1)]
    selectedOptionIds: list[str] = Field(default_factory=list)


class OrderCreateRequest(BaseModel):
    companyId: str
    userId: str
    items: Annotated[list[OrderItemRequest], Field(min_length=1)]


class OrderItemResponse(BaseModel):
    id: str
    orderId: str
    menuId: str
    menuName: str
    quantity: int
    selectedOptions: list[MenuOption]
    unitPrice: int
    itemPrice: int


class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    waitingNumber: int
    userId: str
    companyId: str
    status: str
    totalPrice: int
    pointEarned: int
    items: list[OrderItemResponse]
    createdAt: str


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]


class AdminSummaryResponse(BaseModel):
    totalOrders: int
    receivedOrders: int
    completedOrders: int
    totalRevenue: int
    totalPointEarned: int


COMPANY_BY_ID = {company["id"]: Company(**company) for company in COMPANIES}
USER_BY_ID = {user["id"]: User(**user) for user in USERS}
MENU_BY_ID = {menu["id"]: MenuItem(**menu) for menu in MENUS}
ORDERS: dict[str, OrderResponse] = {}
ORDER_SEQUENCE = count(1)
WAITING_SEQUENCE = count(101)


@app.get("/health")
def get_health() -> dict[str, str]:
    return {"status": "ok", "service": "dajeong-backend"}


@app.get("/companies", response_model=CompanyListResponse)
def list_companies() -> CompanyListResponse:
    return CompanyListResponse(companies=list(COMPANY_BY_ID.values()))


@app.get("/companies/{companyId}", response_model=Company)
def get_company(companyId: str) -> Company:
    return _get_company(companyId)


@app.get("/companies/{companyId}/menus", response_model=MenuListResponse)
def list_company_menus(companyId: str) -> MenuListResponse:
    company = _get_company(companyId)
    menus = [menu for menu in MENU_BY_ID.values() if menu.companyId == companyId]
    return MenuListResponse(company=company, menus=menus)


@app.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(order_request: OrderCreateRequest) -> OrderResponse:
    _get_company(order_request.companyId)
    _get_user(order_request.userId)

    order_index = next(ORDER_SEQUENCE)
    order_id = f"order-{order_index:04d}"
    order_items = [
        _build_order_item(order_id, order_index, line_index, order_request.companyId, item)
        for line_index, item in enumerate(order_request.items, start=1)
    ]
    total_price = sum(item.itemPrice for item in order_items)
    point_earned = total_price // 100

    order = OrderResponse(
        id=order_id,
        orderNumber=f"ORD-{datetime.now(KST).strftime('%Y%m%d')}-{order_index:04d}",
        waitingNumber=next(WAITING_SEQUENCE),
        userId=order_request.userId,
        companyId=order_request.companyId,
        status="received",
        totalPrice=total_price,
        pointEarned=point_earned,
        items=order_items,
        createdAt=datetime.now(KST).isoformat(),
    )
    ORDERS[order.id] = order
    return order


@app.get("/admin/orders", response_model=OrderListResponse)
def list_admin_orders() -> OrderListResponse:
    return OrderListResponse(orders=list(ORDERS.values()))


@app.get("/admin/orders/{orderId}", response_model=OrderResponse)
def get_admin_order(orderId: str) -> OrderResponse:
    if orderId not in ORDERS:
        raise HTTPException(status_code=404, detail="Order not found")
    return ORDERS[orderId]


@app.get("/admin/summary", response_model=AdminSummaryResponse)
def get_admin_summary() -> AdminSummaryResponse:
    orders = list(ORDERS.values())
    return AdminSummaryResponse(
        totalOrders=len(orders),
        receivedOrders=sum(order.status == "received" for order in orders),
        completedOrders=sum(order.status == "completed" for order in orders),
        totalRevenue=sum(order.totalPrice for order in orders),
        totalPointEarned=sum(order.pointEarned for order in orders),
    )


def _get_company(company_id: str) -> Company:
    if company_id not in COMPANY_BY_ID:
        raise HTTPException(status_code=404, detail="Company not found")
    return COMPANY_BY_ID[company_id]


def _get_user(user_id: str) -> User:
    if user_id not in USER_BY_ID:
        raise HTTPException(status_code=404, detail="User not found")
    return USER_BY_ID[user_id]


def _build_order_item(
    order_id: str,
    order_index: int,
    line_index: int,
    company_id: str,
    item_request: OrderItemRequest,
) -> OrderItemResponse:
    if item_request.menuId not in MENU_BY_ID:
        raise HTTPException(status_code=404, detail="Menu not found")

    menu = MENU_BY_ID[item_request.menuId]
    if menu.companyId != company_id:
        raise HTTPException(status_code=400, detail="Menu does not belong to company")
    if not menu.isAvailable:
        raise HTTPException(status_code=400, detail="Menu is not available")

    selected_options = _resolve_options(menu, item_request.selectedOptionIds)
    option_total = sum(option.priceDelta for option in selected_options)
    unit_price = menu.price + option_total
    item_price = unit_price * item_request.quantity

    return OrderItemResponse(
        id=f"order-item-{order_index:04d}-{line_index:02d}",
        orderId=order_id,
        menuId=menu.id,
        menuName=menu.name,
        quantity=item_request.quantity,
        selectedOptions=selected_options,
        unitPrice=unit_price,
        itemPrice=item_price,
    )


def _resolve_options(menu: MenuItem, option_ids: list[str]) -> list[MenuOption]:
    option_by_id = {option.id: option for option in menu.options}
    selected_options: list[MenuOption] = []

    for option_id in option_ids:
        if option_id not in option_by_id:
            raise HTTPException(status_code=400, detail="Menu option not found")
        selected_options.append(option_by_id[option_id])

    return selected_options
