from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from models import MenuIngredient, MenuItem, Preference, User, UserProfile
from security import hash_password


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "shared" / "dummy-data"


def load_dummy_json(file_name: str) -> list[dict[str, Any]]:
    with (DATA_DIR / file_name).open(encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, list):
        raise ValueError(f"{file_name} must contain a list")
    return data


def seed_database(db: Session) -> None:
    seed_users(db, load_dummy_json("users.json"))
    seed_preferences(db, load_dummy_json("preferences.json"))
    seed_menus(db, load_dummy_json("menus.json"))
    db.commit()


def seed_users(db: Session, users: list[dict[str, Any]]) -> None:
    for record in users:
        user = db.get(User, record["user_id"])
        if user is None:
            user = User(user_id=record["user_id"])
            db.add(user)

        user.username = record["username"]
        user.password_hash = hash_password(record["demo_password"])
        user.role = record["role"]
        user.display_name = record["display_name"]

        profile_record = record.get("profile") or {}
        profile = db.get(UserProfile, record["user_id"])
        if profile is None:
            profile = UserProfile(user_id=record["user_id"])
            db.add(profile)

        profile.age_group = profile_record.get("age_group")
        profile.communication_mode = profile_record.get("communication_mode", "text")
        profile.easy_mode_enabled = bool(profile_record.get("easy_mode_enabled", False))
        profile.demo_contact_label = profile_record.get("demo_contact_label")


def seed_preferences(db: Session, preferences: list[dict[str, Any]]) -> None:
    for record in preferences:
        preference = db.get(Preference, record["preference_id"])
        if preference is None:
            preference = Preference(preference_id=record["preference_id"])
            db.add(preference)

        preference.user_id = record["user_id"]
        preference.preference_type = record["preference_type"]
        preference.ingredient_id = record.get("ingredient_id")
        preference.display_name = record["display_name"]
        preference.description = record["description"]


def seed_menus(db: Session, menus: list[dict[str, Any]]) -> None:
    for record in menus:
        menu = db.get(MenuItem, record["menu_item_id"])
        if menu is None:
            menu = MenuItem(menu_item_id=record["menu_item_id"])
            db.add(menu)

        menu.brand_id = record["brand_id"]
        menu.store_id = record["store_id"]
        menu.name = record["name"]
        menu.category = record["category"]
        menu.price = int(record["price"])
        menu.description = record["description"]
        menu.is_available = bool(record["is_available"])
        menu.options_json = json.dumps(record.get("options", []), ensure_ascii=False)

        db.query(MenuIngredient).filter(
            MenuIngredient.menu_item_id == record["menu_item_id"]
        ).delete(synchronize_session=False)

        for ingredient in record.get("ingredients", []):
            db.add(
                MenuIngredient(
                    menu_item_id=record["menu_item_id"],
                    ingredient_id=ingredient["ingredient_id"],
                    name=ingredient["name"],
                    removable=bool(ingredient["removable"]),
                )
            )
