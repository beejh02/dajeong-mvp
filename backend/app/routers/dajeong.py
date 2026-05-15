from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import (
    DajeongChatRequest,
    DajeongChatResponse,
    DajeongFinalApprovalRequest,
    DajeongFinalApprovalResponse,
)
from services.dajeong_chat_service import approve_chat_candidate, create_chat_candidate


router = APIRouter(prefix="/dajeong", tags=["dajeong"])


@router.post("/chat", response_model=DajeongChatResponse)
def create_dajeong_chat_candidate(
    payload: DajeongChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DajeongChatResponse:
    return create_chat_candidate(db, current_user, payload)


@router.post(
    "/final-approval",
    response_model=DajeongFinalApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
def approve_dajeong_chat_candidate(
    payload: DajeongFinalApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DajeongFinalApprovalResponse:
    return approve_chat_candidate(db, current_user, payload)
