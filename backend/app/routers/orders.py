from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import OrderCreateRequest, OrderResponse, ReceiptResponse
from services.order_service import create_order, get_receipt_response


router = APIRouter(tags=["orders"])


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    payload: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    return create_order(db, current_user, payload)


@router.get("/orders/{order_id}/receipt", response_model=ReceiptResponse)
def read_order_receipt(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceiptResponse:
    return get_receipt_response(db, order_id, current_user)
