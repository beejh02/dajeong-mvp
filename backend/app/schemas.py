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
