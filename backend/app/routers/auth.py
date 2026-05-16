from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User, UserProfile
from schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from security import create_access_token, hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["auth"])


def to_user_response(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        username=user.username,
        role=user.role,
        display_name=user.display_name,
        profile={
            "age_group": user.profile.age_group,
            "communication_mode": user.profile.communication_mode,
            "easy_mode_enabled": user.profile.easy_mode_enabled,
            "demo_contact_label": user.profile.demo_contact_label,
        },
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserResponse:
    existing = db.scalar(select(User).where(User.username == payload.username))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    user = User(
        user_id=f"user_{uuid.uuid4().hex[:12]}",
        username=payload.username,
        password_hash=hash_password(payload.password),
        role="user",
        display_name=payload.display_name,
    )
    user.profile = UserProfile(
        age_group=None,
        communication_mode="text",
        easy_mode_enabled=False,
        demo_contact_label=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return to_user_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.username == payload.username))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(access_token=create_access_token(user.user_id, user.role))


@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return to_user_response(current_user)
