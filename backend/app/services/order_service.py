from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from models import MenuItem, Order, OrderItem, Payment, PointLedger, Receipt, User
from schemas import (
    OrderCreateRequest,
    OrderItemCreateRequest,
    OrderResponse,
    PaymentApproveResponse,
    ReceiptResponse,
    SelectedOptionRequest,
)


A_COMPANY_BRAND_ID = "brand_burger_a"
VALID_ORDER_STATUSES = {"pending_payment", "accepted", "cooking", "completed", "canceled"}


def now_text() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def short_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def create_order(db: Session, user: User, payload: OrderCreateRequest) -> OrderResponse:
    calculated_items: list[dict[str, Any]] = []
    total_price = 0
    order_brand_id: str | None = None
    order_store_id: str | None = None

    for item_request in payload.items:
        item = calculate_order_item(db, item_request)
        calculated_items.append(item)
        total_price += item["line_total"]
        order_brand_id = item["brand_id"]
        order_store_id = item["store_id"]

    order = Order(
        order_id=short_id("order"),
        order_number=next_order_number(db),
        user_id=user.user_id,
        brand_id=order_brand_id or A_COMPANY_BRAND_ID,
        store_id=order_store_id or "",
        order_status="pending_payment",
        total_price=total_price,
        created_at=now_text(),
    )
    db.add(order)

    for item in calculated_items:
        db.add(
            OrderItem(
                order_id=order.order_id,
                menu_item_id=item["menu_item_id"],
                menu_name=item["menu_name"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                line_total=item["line_total"],
                removed_ingredient_ids_json=json.dumps(item["removed_ingredient_ids"]),
                selected_options_json=json.dumps(item["selected_options"], ensure_ascii=False),
            )
        )

    db.add(
        Payment(
            payment_id=short_id("payment"),
            order_id=order.order_id,
            user_id=user.user_id,
            provider="mock",
            payment_status="ready",
            approved_amount=0,
        )
    )
    db.commit()

    return get_order_response(db, order.order_id, user=user)


def calculate_order_item(db: Session, item_request: OrderItemCreateRequest) -> dict[str, Any]:
    menu = db.scalar(
        select(MenuItem)
        .options(selectinload(MenuItem.ingredients))
        .where(MenuItem.menu_item_id == item_request.menu_item_id)
        .where(MenuItem.brand_id == A_COMPANY_BRAND_ID)
        .where(MenuItem.is_available.is_(True))
    )
    if menu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    removable_ids = {
        ingredient.ingredient_id
        for ingredient in menu.ingredients
        if ingredient.removable
    }
    ingredient_ids = {ingredient.ingredient_id for ingredient in menu.ingredients}
    for ingredient_id in item_request.removed_ingredient_ids:
        if ingredient_id not in ingredient_ids or ingredient_id not in removable_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requested ingredient cannot be removed",
            )

    option_delta = calculate_option_delta(menu, item_request.selected_options)
    unit_price = menu.price + option_delta
    return {
        "brand_id": menu.brand_id,
        "store_id": menu.store_id,
        "menu_item_id": menu.menu_item_id,
        "menu_name": menu.name,
        "quantity": item_request.quantity,
        "unit_price": unit_price,
        "line_total": unit_price * item_request.quantity,
        "removed_ingredient_ids": item_request.removed_ingredient_ids,
        "selected_options": [option.model_dump() for option in item_request.selected_options],
    }


def calculate_option_delta(menu: MenuItem, selected_options: list[SelectedOptionRequest]) -> int:
    groups = json.loads(menu.options_json)
    selected_by_group = {option.option_group_id: option.choice_id for option in selected_options}
    total_delta = 0

    for group in groups:
        group_id = group["option_group_id"]
        choice_id = selected_by_group.get(group_id)
        if group.get("required") and not choice_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Required option is missing",
            )
        if not choice_id:
            continue

        matching_choice = next(
            (choice for choice in group.get("choices", []) if choice["choice_id"] == choice_id),
            None,
        )
        if matching_choice is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid menu option selected",
            )
        total_delta += int(matching_choice.get("price_delta", 0))

    known_group_ids = {group["option_group_id"] for group in groups}
    if any(option.option_group_id not in known_group_ids for option in selected_options):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid menu option selected",
        )
    return total_delta


def approve_dummy_payment(
    db: Session,
    user: User,
    order_id: str,
    idempotency_key: str | None,
) -> PaymentApproveResponse:
    order = load_order(db, order_id, user=user)
    payment = order.payment
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    if payment.payment_status == "paid":
        return payment_response(order, payment, points_earned=points_for_order(order))

    if idempotency_key:
        existing = db.scalar(select(Payment).where(Payment.idempotency_key == idempotency_key))
        if existing is not None:
            existing_order = load_order(db, existing.order_id, user=user)
            return payment_response(
                existing_order,
                existing,
                points_earned=points_for_order(existing_order),
            )

    payment.payment_status = "paid"
    payment.approved_amount = order.total_price
    payment.idempotency_key = idempotency_key
    payment.approved_at = now_text()
    order.order_status = "accepted"

    points = points_for_order(order)
    if not db.scalar(select(PointLedger).where(PointLedger.order_id == order.order_id)):
        db.add(
            PointLedger(
                point_id=short_id("point"),
                user_id=order.user_id,
                order_id=order.order_id,
                points=points,
                reason="mock_payment_approved",
                created_at=now_text(),
            )
        )

    if order.receipt is None:
        db.add(
            Receipt(
                receipt_id=short_id("receipt"),
                order_id=order.order_id,
                receipt_number=next_receipt_number(db),
                total_price=order.total_price,
                payment_status="paid",
                issued_at=now_text(),
            )
        )

    db.commit()
    return payment_response(order, payment, points_earned=points)


def points_for_order(order: Order) -> int:
    return order.total_price // 100


def payment_response(order: Order, payment: Payment, points_earned: int) -> PaymentApproveResponse:
    return PaymentApproveResponse(
        payment_id=payment.payment_id,
        order_id=order.order_id,
        payment_status=payment.payment_status,
        order_status=order.order_status,
        approved_amount=payment.approved_amount,
        points_earned=points_earned,
    )


def get_point_balance(db: Session, user: User) -> int:
    return int(
        db.scalar(select(func.coalesce(func.sum(PointLedger.points), 0)).where(PointLedger.user_id == user.user_id))
        or 0
    )


def get_receipt_response(db: Session, order_id: str, user: User) -> ReceiptResponse:
    order = load_order(db, order_id, user=user)
    if order.receipt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found",
        )
    return to_receipt_response(order, order.receipt)


def list_admin_orders(db: Session) -> list[OrderResponse]:
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.payment))
        .order_by(Order.created_at.desc())
    ).all()
    return [to_order_response(order) for order in orders]


def get_order_response(db: Session, order_id: str, user: User | None = None) -> OrderResponse:
    order = load_order(db, order_id, user=user)
    return to_order_response(order)


def update_order_status(db: Session, order_id: str, order_status: str) -> OrderResponse:
    if order_status not in VALID_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status",
        )

    order = load_order(db, order_id)
    order.order_status = order_status
    db.commit()
    return get_order_response(db, order_id)


def load_order(db: Session, order_id: str, user: User | None = None) -> Order:
    statement = (
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.payment), selectinload(Order.receipt))
        .where(Order.order_id == order_id)
    )
    if user is not None:
        statement = statement.where(Order.user_id == user.user_id)

    order = db.scalar(statement)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return order


def to_order_response(order: Order) -> OrderResponse:
    return OrderResponse(
        order_id=order.order_id,
        order_number=order.order_number,
        user_id=order.user_id,
        brand_id=order.brand_id,
        store_id=order.store_id,
        order_status=order.order_status,
        payment_status=order.payment.payment_status if order.payment else "ready",
        total_price=order.total_price,
        items=[
            {
                "menu_item_id": item.menu_item_id,
                "menu_name": item.menu_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
                "removed_ingredient_ids": json.loads(item.removed_ingredient_ids_json),
                "selected_options": json.loads(item.selected_options_json),
            }
            for item in order.items
        ],
        created_at=order.created_at,
    )


def to_receipt_response(order: Order, receipt: Receipt) -> ReceiptResponse:
    return ReceiptResponse(
        receipt_id=receipt.receipt_id,
        receipt_number=receipt.receipt_number,
        order_id=order.order_id,
        order_number=order.order_number,
        total_price=receipt.total_price,
        payment_status=receipt.payment_status,
        issued_at=receipt.issued_at,
    )


def next_order_number(db: Session) -> str:
    count = db.scalar(select(func.count()).select_from(Order)) or 0
    return f"A-{int(count) + 1:04d}"


def next_receipt_number(db: Session) -> str:
    count = db.scalar(select(func.count()).select_from(Receipt)) or 0
    return f"R-{int(count) + 1:04d}"
