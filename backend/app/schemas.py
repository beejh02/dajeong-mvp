from __future__ import annotations

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    age_group: str | None
    communication_mode: str
    easy_mode_enabled: bool
    demo_contact_label: str | None


class UserResponse(BaseModel):
    user_id: str
    username: str
    role: str
    display_name: str
    profile: ProfileResponse


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=120)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MenuIngredientResponse(BaseModel):
    ingredient_id: str
    name: str
    removable: bool


class MenuOptionChoiceResponse(BaseModel):
    choice_id: str
    name: str
    price_delta: int


class MenuOptionGroupResponse(BaseModel):
    option_group_id: str
    name: str
    required: bool
    min_select: int
    max_select: int
    choices: list[MenuOptionChoiceResponse]


class MenuSummaryResponse(BaseModel):
    menu_item_id: str
    brand_id: str
    store_id: str
    name: str
    category: str
    price: int
    description: str
    is_available: bool


class MenuDetailResponse(MenuSummaryResponse):
    ingredients: list[MenuIngredientResponse]
    options: list[MenuOptionGroupResponse]


class SelectedOptionRequest(BaseModel):
    option_group_id: str
    choice_id: str


class OrderItemCreateRequest(BaseModel):
    menu_item_id: str
    quantity: int = Field(ge=1, le=20)
    removed_ingredient_ids: list[str] = Field(default_factory=list)
    selected_options: list[SelectedOptionRequest] = Field(default_factory=list)


class OrderCreateRequest(BaseModel):
    items: list[OrderItemCreateRequest] = Field(min_length=1)
    client_total_price: int | None = None


class OrderItemResponse(BaseModel):
    menu_item_id: str
    menu_name: str
    quantity: int
    unit_price: int
    line_total: int
    removed_ingredient_ids: list[str]
    selected_options: list[SelectedOptionRequest]


class OrderResponse(BaseModel):
    order_id: str
    order_number: str
    user_id: str
    brand_id: str
    store_id: str
    order_status: str
    payment_status: str
    total_price: int
    items: list[OrderItemResponse]
    created_at: str


class PaymentApproveRequest(BaseModel):
    order_id: str
    idempotency_key: str | None = None


class PaymentApproveResponse(BaseModel):
    payment_id: str
    order_id: str
    payment_status: str
    order_status: str
    approved_amount: int
    points_earned: int


class PointBalanceResponse(BaseModel):
    user_id: str
    balance: int


class ReceiptResponse(BaseModel):
    receipt_id: str
    receipt_number: str
    order_id: str
    order_number: str
    total_price: int
    payment_status: str
    issued_at: str


class DajeongChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class DajeongCandidateItemResponse(BaseModel):
    menu_item_id: str
    menu_name: str
    quantity: int
    unit_price: int
    line_total: int
    removed_ingredient_ids: list[str]
    selected_options: list[SelectedOptionRequest]


class DajeongOrderCandidateResponse(BaseModel):
    candidate_id: str
    intent: str
    confidence: float
    source: str
    recent_order_id: str | None
    total_price: int
    applied_preferences: list[str]
    items: list[DajeongCandidateItemResponse]
    order_request_items: list[OrderItemCreateRequest]


class DajeongChatResponse(BaseModel):
    reply: str
    candidate: DajeongOrderCandidateResponse


class DajeongFinalApprovalRequest(BaseModel):
    candidate_id: str = Field(min_length=1, max_length=120)
    approved: bool
    items: list[OrderItemCreateRequest] = Field(min_length=1)


class DajeongFinalApprovalResponse(BaseModel):
    approved: bool
    order: OrderResponse


class AdminOrderStatusUpdateRequest(BaseModel):
    order_status: str


class McpToolCallResponse(BaseModel):
    log_id: str
    tool_name: str
    status: str
    result: dict


class McpCallLogSummaryResponse(BaseModel):
    log_id: str
    tool_name: str
    status: str
    created_at: str


class McpCallLogDetailResponse(McpCallLogSummaryResponse):
    request_payload: dict
    response_payload: dict
    error_message: str | None
