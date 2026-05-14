from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import PaymentApproveRequest, PaymentApproveResponse
from services.order_service import approve_dummy_payment


router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/dummy/approve", response_model=PaymentApproveResponse)
def approve_payment(
    payload: PaymentApproveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentApproveResponse:
    return approve_dummy_payment(db, current_user, payload.order_id, payload.idempotency_key)
