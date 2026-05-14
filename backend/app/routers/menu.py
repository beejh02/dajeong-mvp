from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import MenuItem
from schemas import MenuDetailResponse, MenuSummaryResponse


router = APIRouter(tags=["menu"])
A_COMPANY_BRAND_ID = "brand_burger_a"


def to_menu_summary(menu: MenuItem) -> MenuSummaryResponse:
    return MenuSummaryResponse(
        menu_item_id=menu.menu_item_id,
        brand_id=menu.brand_id,
        store_id=menu.store_id,
        name=menu.name,
        category=menu.category,
        price=menu.price,
        description=menu.description,
        is_available=menu.is_available,
    )


def load_options(menu: MenuItem) -> list[dict[str, Any]]:
    value = json.loads(menu.options_json)
    if not isinstance(value, list):
        return []
    return value


@router.get("/menu", response_model=list[MenuSummaryResponse])
def list_menus(db: Session = Depends(get_db)) -> list[MenuSummaryResponse]:
    menus = db.scalars(
        select(MenuItem)
        .where(MenuItem.brand_id == A_COMPANY_BRAND_ID)
        .where(MenuItem.is_available.is_(True))
        .order_by(MenuItem.name)
    ).all()
    return [to_menu_summary(menu) for menu in menus]


@router.get("/menu/{menu_item_id}", response_model=MenuDetailResponse)
def read_menu_detail(menu_item_id: str, db: Session = Depends(get_db)) -> MenuDetailResponse:
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

    summary = to_menu_summary(menu)
    return MenuDetailResponse(
        **summary.model_dump(),
        ingredients=[
            {
                "ingredient_id": ingredient.ingredient_id,
                "name": ingredient.name,
                "removable": ingredient.removable,
            }
            for ingredient in menu.ingredients
        ],
        options=load_options(menu),
    )
