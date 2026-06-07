from typing import Annotated, Literal

from pydantic import BaseModel, Field


class Company(BaseModel):
    id: str
    name: str
    displayName: str
    uiType: str
    description: str


class CompanyListResponse(BaseModel):
    companies: list[Company]


class MenuOptionChoice(BaseModel):
    id: str
    name: str
    priceDelta: int


class MenuOptionGroup(BaseModel):
    id: str
    title: str
    selectionMode: Literal["single", "multiple"]
    required: bool
    minSelect: int
    maxSelect: int
    choices: list[MenuOptionChoice]


class MenuItem(BaseModel):
    id: str
    companyId: str
    name: str
    category: str
    price: int
    description: str
    imageUrl: str
    isAvailable: bool
    optionGroups: list[MenuOptionGroup]


class MenuListResponse(BaseModel):
    company: Company
    menus: list[MenuItem]


class User(BaseModel):
    id: str
    name: str
    phone: str
    pointBalance: int
    defaultPaymentMethod: str


SourceChannel = Literal["kiosk_a", "kiosk_b", "dajeong_ai"]


class SelectedOptionGroup(BaseModel):
    groupId: str
    choiceIds: list[str]


class PointAccrualRequest(BaseModel):
    enabled: bool
    phone: str | None = None


class OrderItemRequest(BaseModel):
    menuId: str
    quantity: Annotated[int, Field(ge=1)]
    selectedOptionGroups: list[SelectedOptionGroup] = Field(default_factory=list)


class OrderCreateRequest(BaseModel):
    companyId: str
    userId: str
    sourceChannel: SourceChannel | None = None
    items: Annotated[list[OrderItemRequest], Field(min_length=1)]
    fulfillmentType: Literal["dine_in", "pickup"]
    paymentMethod: Literal["credit_card", "coupon", "cash"]
    pointAccrual: PointAccrualRequest


class SelectedOptionGroupResponse(BaseModel):
    groupId: str
    groupTitle: str
    choices: list[MenuOptionChoice]


class OrderItemResponse(BaseModel):
    id: str
    orderId: str
    menuId: str
    menuName: str
    quantity: int
    selectedOptionGroups: list[SelectedOptionGroupResponse]
    unitPrice: int
    itemPrice: int


class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    waitingNumber: int
    userId: str
    companyId: str
    sourceChannel: SourceChannel
    status: str
    totalPrice: int
    pointEarned: int
    fulfillmentType: Literal["dine_in", "pickup"]
    paymentMethod: Literal["credit_card", "coupon", "cash"]
    pointAccrual: PointAccrualRequest
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
