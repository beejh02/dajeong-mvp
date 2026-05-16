from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import PointBalanceResponse
from services.order_service import get_point_balance


router = APIRouter(prefix="/points", tags=["points"])


@router.get("/me", response_model=PointBalanceResponse)
def read_my_points(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PointBalanceResponse:
    return PointBalanceResponse(
        user_id=current_user.user_id,
        balance=get_point_balance(db, current_user),
    )
