from typing import Annotated

from pydantic import BaseModel, Field


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
    totalSales: int
    waitingOrders: int
    companyCount: int
    menuCount: int
