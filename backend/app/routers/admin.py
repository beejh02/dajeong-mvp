from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin_user
from models import User
from schemas import AdminOrderStatusUpdateRequest, OrderResponse
from services.order_service import get_order_response, list_admin_orders, update_order_status


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/orders", response_model=list[OrderResponse])
def read_admin_orders(
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> list[OrderResponse]:
    return list_admin_orders(db)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def read_admin_order_detail(
    order_id: str,
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    return get_order_response(db, order_id)


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def patch_admin_order_status(
    order_id: str,
    payload: AdminOrderStatusUpdateRequest,
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    return update_order_status(db, order_id, payload.order_status)
