from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from models import MenuItem, Preference, User
from schemas import (
    DajeongCandidateItemResponse,
    DajeongChatRequest,
    DajeongChatResponse,
    DajeongFinalApprovalRequest,
    DajeongFinalApprovalResponse,
    DajeongOrderCandidateResponse,
    OrderCreateRequest,
    OrderItemCreateRequest,
    SelectedOptionRequest,
)
from services.mcp_client import call_burger_tool
from services.order_service import calculate_order_item, create_order


A_COMPANY_BRAND_ID = "brand_burger_a"
ROOT = Path(__file__).resolve().parents[3]
ORDER_HISTORY_PATH = ROOT / "shared" / "dummy-data" / "order_history.json"
REMOVAL_KEYWORDS = {
    "ingredient_pickle_cucumber": ("오이", "피클", "cucumber", "pickle"),
    "ingredient_onion": ("양파", "onion"),
    "ingredient_tomato": ("토마토", "tomato"),
    "ingredient_lettuce": ("양상추", "lettuce"),
}
QUANTITY_KEYWORDS = {
    "하나": 1,
    "한 개": 1,
    "1개": 1,
    "1": 1,
    "두": 2,
    "두 개": 2,
    "2개": 2,
    "2": 2,
}


def create_chat_candidate(
    db: Session,
    user: User,
    payload: DajeongChatRequest,
) -> DajeongChatResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required",
        )

    order_items, source, recent_order_id = analyze_order_request(db, user, message)
    candidate = build_candidate(db, user, message, order_items, source, recent_order_id)
    call_burger_tool(
        db,
        "create_order_draft",
        {
            "user_id": user.user_id,
            "candidate_id": candidate.candidate_id,
            "source": source,
            "recent_order_id": recent_order_id,
            "total_price": candidate.total_price,
            "items": [item.model_dump() for item in candidate.order_request_items],
        },
    )
    reply = "최근 주문을 기준으로 주문 후보를 만들었어요." if source == "recent_order" else "요청하신 메뉴로 주문 후보를 만들었어요."
    return DajeongChatResponse(reply=reply, candidate=candidate)


def approve_chat_candidate(
    db: Session,
    user: User,
    payload: DajeongFinalApprovalRequest,
) -> DajeongFinalApprovalResponse:
    if not payload.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Final approval is required",
        )

    order = create_order(db, user, OrderCreateRequest(items=payload.items))
    call_burger_tool(
        db,
        "place_order",
        {
            "user_id": user.user_id,
            "candidate_id": payload.candidate_id,
            "order_id": order.order_id,
            "total_price": order.total_price,
        },
    )
    return DajeongFinalApprovalResponse(approved=True, order=order)


def analyze_order_request(
    db: Session,
    user: User,
    message: str,
) -> tuple[list[OrderItemCreateRequest], str, str | None]:
    quantity = parse_quantity(message)
    if wants_recent_order(message):
        recent_order = find_recent_order(user.user_id)
        if recent_order is not None:
            return (
                [
                    build_order_item_request(
                        db=db,
                        user=user,
                        menu_item_id=item["menu_item_id"],
                        quantity=quantity or int(item.get("quantity", 1)),
                        message=message,
                        base_removed_ingredient_ids=item.get("removed_ingredient_ids", []),
                        base_selected_options=item.get("selected_options", []),
                    )
                    for item in recent_order.get("items", [])
                ],
                "recent_order",
                recent_order["order_id"],
            )

    menu_item_id = choose_menu_item_id(message)
    return (
        [
            build_order_item_request(
                db=db,
                user=user,
                menu_item_id=menu_item_id,
                quantity=quantity or 1,
                message=message,
                base_removed_ingredient_ids=[],
                base_selected_options=None,
            )
        ],
        "menu_keyword",
        None,
    )


def build_order_item_request(
    db: Session,
    user: User,
    menu_item_id: str,
    quantity: int,
    message: str,
    base_removed_ingredient_ids: list[str],
    base_selected_options: list[dict[str, str]] | None,
) -> OrderItemCreateRequest:
    menu = load_menu(db, menu_item_id)
    removed_ids, _ = collect_removed_ingredient_ids(
        db=db,
        user=user,
        menu=menu,
        message=message,
        base_removed_ingredient_ids=base_removed_ingredient_ids,
    )
    selected_options = base_selected_options
    if selected_options is None:
        selected_options = default_required_options(menu)

    return OrderItemCreateRequest(
        menu_item_id=menu.menu_item_id,
        quantity=quantity,
        removed_ingredient_ids=removed_ids,
        selected_options=[SelectedOptionRequest(**option) for option in selected_options],
    )


def build_candidate(
    db: Session,
    user: User,
    message: str,
    order_items: list[OrderItemCreateRequest],
    source: str,
    recent_order_id: str | None,
) -> DajeongOrderCandidateResponse:
    calculated_items = [calculate_order_item(db, item) for item in order_items]
    total_price = sum(int(item["line_total"]) for item in calculated_items)
    applied_preferences = sorted(
        {
            ingredient_id
            for item in order_items
            for ingredient_id in collect_applied_preference_ids(db, user, item.menu_item_id, item.removed_ingredient_ids)
        }
    )
    candidate_id = create_candidate_id(user.user_id, message, order_items)

    return DajeongOrderCandidateResponse(
        candidate_id=candidate_id,
        intent="order_burger",
        confidence=0.82 if source == "recent_order" else 0.72,
        source=source,
        recent_order_id=recent_order_id,
        total_price=total_price,
        applied_preferences=applied_preferences,
        items=[
            DajeongCandidateItemResponse(
                menu_item_id=item["menu_item_id"],
                menu_name=item["menu_name"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                line_total=item["line_total"],
                removed_ingredient_ids=item["removed_ingredient_ids"],
                selected_options=[SelectedOptionRequest(**option) for option in item["selected_options"]],
            )
            for item in calculated_items
        ],
        order_request_items=order_items,
    )


def collect_removed_ingredient_ids(
    db: Session,
    user: User,
    menu: MenuItem,
    message: str,
    base_removed_ingredient_ids: list[str],
) -> tuple[list[str], list[str]]:
    removable_ids = {
        ingredient.ingredient_id
        for ingredient in menu.ingredients
        if ingredient.removable
    }
    removed_ids = set(base_removed_ingredient_ids)
    preference_ids = {
        preference.ingredient_id
        for preference in db.scalars(
            select(Preference)
            .where(Preference.user_id == user.user_id)
            .where(Preference.preference_type == "disliked_ingredient")
        ).all()
        if preference.ingredient_id
    }

    for ingredient_id, keywords in REMOVAL_KEYWORDS.items():
        if any(keyword in message for keyword in keywords):
            removed_ids.add(ingredient_id)

    removed_ids.update(preference_ids)
    allowed_removed_ids = sorted(ingredient_id for ingredient_id in removed_ids if ingredient_id in removable_ids)
    applied_preferences = sorted(ingredient_id for ingredient_id in preference_ids if ingredient_id in allowed_removed_ids)
    return allowed_removed_ids, applied_preferences


def collect_applied_preference_ids(
    db: Session,
    user: User,
    menu_item_id: str,
    removed_ingredient_ids: list[str],
) -> list[str]:
    menu = load_menu(db, menu_item_id)
    _, applied_preferences = collect_removed_ingredient_ids(
        db=db,
        user=user,
        menu=menu,
        message="",
        base_removed_ingredient_ids=removed_ingredient_ids,
    )
    return applied_preferences


def parse_quantity(message: str) -> int | None:
    for keyword, quantity in QUANTITY_KEYWORDS.items():
        if keyword in message:
            return quantity
    return None


def wants_recent_order(message: str) -> bool:
    return any(keyword in message for keyword in ("늘 먹던", "최근", "지난번", "전에 먹던", "먹던"))


def choose_menu_item_id(message: str) -> str:
    if any(keyword in message for keyword in ("데리야키", "teriyaki")):
        return "menu_dajeong_teriyaki_set"
    if any(keyword in message for keyword in ("새우", "쉬림프", "shrimp")):
        return "menu_dajeong_shrimp_single"
    if any(keyword in message for keyword in ("버거", "햄버거", "classic", "클래식", "주문")):
        return "menu_dajeong_classic_set"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Order intent could not be analyzed",
    )


def find_recent_order(user_id: str) -> dict[str, Any] | None:
    orders = load_order_history()
    matching_orders = [
        order
        for order in orders
        if order.get("user_id") == user_id
        and order.get("brand_id") == A_COMPANY_BRAND_ID
        and order.get("status") == "completed"
    ]
    if not matching_orders:
        return None
    return sorted(matching_orders, key=lambda order: order.get("ordered_at", ""), reverse=True)[0]


def load_order_history() -> list[dict[str, Any]]:
    with ORDER_HISTORY_PATH.open(encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        return []
    return data


def load_menu(db: Session, menu_item_id: str) -> MenuItem:
    menu = db.scalar(
        select(MenuItem)
        .options(selectinload(MenuItem.ingredients))
        .where(MenuItem.menu_item_id == menu_item_id)
        .where(MenuItem.brand_id == A_COMPANY_BRAND_ID)
        .where(MenuItem.is_available.is_(True))
    )
    if menu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )
    return menu


def default_required_options(menu: MenuItem) -> list[dict[str, str]]:
    options = json.loads(menu.options_json)
    selected_options: list[dict[str, str]] = []
    for group in options:
        choices = group.get("choices", [])
        if group.get("required") and choices:
            selected_options.append(
                {
                    "option_group_id": group["option_group_id"],
                    "choice_id": choices[0]["choice_id"],
                }
            )
    return selected_options


def create_candidate_id(
    user_id: str,
    message: str,
    order_items: list[OrderItemCreateRequest],
) -> str:
    raw_value = json.dumps(
        {
            "user_id": user_id,
            "message": message,
            "items": [item.model_dump() for item in order_items],
        },
        ensure_ascii=False,
        sort_keys=True,
    )
    digest = hashlib.sha256(raw_value.encode("utf-8")).hexdigest()[:12]
    return f"candidate_{digest}"
