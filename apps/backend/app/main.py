from datetime import datetime, timedelta, timezone
from itertools import count
from typing import Annotated

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.data import COMPANIES, MENUS, USERS


app = FastAPI(title="Dajeong Backend")


class Company(BaseModel):
    company_id: str
    name: str
    ui_layout: str
    description: str


class CompanyListResponse(BaseModel):
    companies: list[Company]


class MenuOption(BaseModel):
    option_id: str
    name: str
    price_delta: int


class MenuItem(BaseModel):
    menu_id: str
    company_id: str
    name: str
    category: str
    description: str
    price: int
    image_key: str
    is_available: bool
    options: list[MenuOption]


class MenuListResponse(BaseModel):
    company: Company
    menus: list[MenuItem]


class User(BaseModel):
    user_id: str
    name: str
    phone: str
    preferred_language: str


class OrderItemRequest(BaseModel):
    menu_id: str
    quantity: Annotated[int, Field(ge=1)]
    option_ids: list[str] = Field(default_factory=list)


class OrderCreateRequest(BaseModel):
    company_id: str
    user_id: str
    items: Annotated[list[OrderItemRequest], Field(min_length=1)]


class OrderItemResponse(BaseModel):
    menu_id: str
    menu_name: str
    quantity: int
    unit_price: int
    selected_options: list[MenuOption]
    line_total: int


class OrderResponse(BaseModel):
    order_id: str
    company_id: str
    company_name: str
    user: User
    items: list[OrderItemResponse]
    total_price: int
    status: str
    payment_status: str
    created_at: str


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]


COMPANY_BY_ID = {company["company_id"]: Company(**company) for company in COMPANIES}
USER_BY_ID = {user["user_id"]: User(**user) for user in USERS}
MENU_BY_ID = {menu["menu_id"]: MenuItem(**menu) for menu in MENUS}
ORDERS: dict[str, OrderResponse] = {}
ORDER_SEQUENCE = count(1)


@app.get("/health")
def get_health() -> dict[str, str]:
    return {"status": "ok", "service": "dajeong-backend"}


@app.get("/companies", response_model=CompanyListResponse)
def list_companies() -> CompanyListResponse:
    return CompanyListResponse(companies=list(COMPANY_BY_ID.values()))


@app.get("/companies/{company_id}/menus", response_model=MenuListResponse)
def list_company_menus(company_id: str) -> MenuListResponse:
    company = _get_company(company_id)
    menus = [menu for menu in MENU_BY_ID.values() if menu.company_id == company_id]
    return MenuListResponse(company=company, menus=menus)


@app.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(order_request: OrderCreateRequest) -> OrderResponse:
    company = _get_company(order_request.company_id)
    user = _get_user(order_request.user_id)

    order_items = [_build_order_item(order_request.company_id, item) for item in order_request.items]
    total_price = sum(item.line_total for item in order_items)
    order_id = f"order-{next(ORDER_SEQUENCE):04d}"

    order = OrderResponse(
        order_id=order_id,
        company_id=company.company_id,
        company_name=company.name,
        user=user,
        items=order_items,
        total_price=total_price,
        status="received",
        payment_status="not_requested",
        created_at=datetime.now(timezone(timedelta(hours=9))).isoformat(),
    )
    ORDERS[order.order_id] = order
    return order


@app.get("/admin/orders", response_model=OrderListResponse)
def list_admin_orders() -> OrderListResponse:
    return OrderListResponse(orders=list(ORDERS.values()))


@app.get("/admin/orders/{order_id}", response_model=OrderResponse)
def get_admin_order(order_id: str) -> OrderResponse:
    if order_id not in ORDERS:
        raise HTTPException(status_code=404, detail="Order not found")
    return ORDERS[order_id]


def _get_company(company_id: str) -> Company:
    if company_id not in COMPANY_BY_ID:
        raise HTTPException(status_code=404, detail="Company not found")
    return COMPANY_BY_ID[company_id]


def _get_user(user_id: str) -> User:
    if user_id not in USER_BY_ID:
        raise HTTPException(status_code=404, detail="User not found")
    return USER_BY_ID[user_id]


def _build_order_item(company_id: str, item_request: OrderItemRequest) -> OrderItemResponse:
    if item_request.menu_id not in MENU_BY_ID:
        raise HTTPException(status_code=404, detail="Menu not found")

    menu = MENU_BY_ID[item_request.menu_id]
    if menu.company_id != company_id:
        raise HTTPException(status_code=400, detail="Menu does not belong to company")
    if not menu.is_available:
        raise HTTPException(status_code=400, detail="Menu is not available")

    selected_options = _resolve_options(menu, item_request.option_ids)
    option_total = sum(option.price_delta for option in selected_options)
    unit_price = menu.price + option_total

    return OrderItemResponse(
        menu_id=menu.menu_id,
        menu_name=menu.name,
        quantity=item_request.quantity,
        unit_price=unit_price,
        selected_options=selected_options,
        line_total=unit_price * item_request.quantity,
    )


def _resolve_options(menu: MenuItem, option_ids: list[str]) -> list[MenuOption]:
    option_by_id = {option.option_id: option for option in menu.options}
    selected_options: list[MenuOption] = []

    for option_id in option_ids:
        if option_id not in option_by_id:
            raise HTTPException(status_code=400, detail="Menu option not found")
        selected_options.append(option_by_id[option_id])

    return selected_options
