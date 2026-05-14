from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "shared" / "dummy-data"

REQUIRED_FILES = [
    "README.md",
    "users.json",
    "brands.json",
    "stores.json",
    "menus.json",
    "preferences.json",
    "order_history.json",
    "payment_profiles.json",
    "point_memberships.json",
]

SENSITIVE_KEYS = {
    "card_number",
    "cardNo",
    "card_no",
    "cvc",
    "cvv",
    "resident_registration_number",
    "ssn",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def load_json(file_name: str) -> Any:
    path = DATA_DIR / file_name
    require(path.is_file(), f"Missing dummy-data file: {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def require_unique(items: list[dict[str, Any]], key: str, label: str) -> set[str]:
    values = [item[key] for item in items]
    require(len(values) == len(set(values)), f"Duplicate {label} values for {key}")
    return set(values)


def walk_for_sensitive_keys(value: Any, path: str = "$") -> None:
    if isinstance(value, dict):
        for key, nested_value in value.items():
            require(key not in SENSITIVE_KEYS, f"Sensitive key not allowed at {path}.{key}")
            walk_for_sensitive_keys(nested_value, f"{path}.{key}")
    elif isinstance(value, list):
        for index, nested_value in enumerate(value):
            walk_for_sensitive_keys(nested_value, f"{path}[{index}]")


def check_required_files() -> None:
    missing = [file_name for file_name in REQUIRED_FILES if not (DATA_DIR / file_name).is_file()]
    require(not missing, "Missing dummy-data files: " + ", ".join(missing))


def main() -> None:
    check_required_files()

    users = load_json("users.json")
    brands = load_json("brands.json")
    stores = load_json("stores.json")
    menus = load_json("menus.json")
    preferences = load_json("preferences.json")
    orders = load_json("order_history.json")
    payments = load_json("payment_profiles.json")
    points = load_json("point_memberships.json")

    for file_name, data in [
        ("users.json", users),
        ("brands.json", brands),
        ("stores.json", stores),
        ("menus.json", menus),
        ("preferences.json", preferences),
        ("order_history.json", orders),
        ("payment_profiles.json", payments),
        ("point_memberships.json", points),
    ]:
        require(isinstance(data, list) and data, f"{file_name} must be a non-empty list")
        walk_for_sensitive_keys(data, file_name)

    user_ids = require_unique(users, "user_id", "user")
    usernames = require_unique(users, "username", "username")
    brand_ids = require_unique(brands, "brand_id", "brand")
    store_ids = require_unique(stores, "store_id", "store")
    menu_ids = require_unique(menus, "menu_item_id", "menu")
    require_unique(preferences, "preference_id", "preference")
    require_unique(orders, "order_id", "order")
    require_unique(payments, "payment_profile_id", "payment profile")
    require_unique(points, "membership_id", "point membership")

    require("user1" in usernames, "Demo user username user1 is required")
    require("admin" in usernames, "Demo admin username admin is required")
    require(any(user["role"] == "admin" for user in users), "At least one admin user is required")

    for store in stores:
        require(store["brand_id"] in brand_ids, f"Unknown brand_id in stores: {store['brand_id']}")

    for menu in menus:
        require(menu["brand_id"] in brand_ids, f"Unknown brand_id in menus: {menu['brand_id']}")
        require(menu["store_id"] in store_ids, f"Unknown store_id in menus: {menu['store_id']}")
        require(menu["price"] > 0, f"Menu price must be positive: {menu['menu_item_id']}")

    for preference in preferences:
        require(preference["user_id"] in user_ids, f"Unknown user_id in preferences: {preference['user_id']}")

    for payment in payments:
        require(payment["user_id"] in user_ids, f"Unknown user_id in payment_profiles: {payment['user_id']}")
        require(payment["provider"] == "mock", "Only mock payment profiles are allowed")
        require("token" in payment and payment["token"].startswith("mock_"), "Payment token must be fake")

    for membership in points:
        require(membership["user_id"] in user_ids, f"Unknown user_id in point_memberships: {membership['user_id']}")
        require(membership["brand_id"] in brand_ids, f"Unknown brand_id in point_memberships: {membership['brand_id']}")

    for order in orders:
        require(order["user_id"] in user_ids, f"Unknown user_id in order_history: {order['user_id']}")
        require(order["brand_id"] in brand_ids, f"Unknown brand_id in order_history: {order['brand_id']}")
        require(order["store_id"] in store_ids, f"Unknown store_id in order_history: {order['store_id']}")
        for item in order["items"]:
            require(item["menu_item_id"] in menu_ids, f"Unknown menu_item_id in order item: {item['menu_item_id']}")

    demo_menu = next(
        (
            menu
            for menu in menus
            if any(
                ingredient["ingredient_id"] == "ingredient_pickle_cucumber" and ingredient["removable"]
                for ingredient in menu["ingredients"]
            )
        ),
        None,
    )
    require(demo_menu is not None, "A demo menu with removable cucumber pickle is required")
    require(
        any(
            order["user_id"] == "user_demo_001"
            and any(item["menu_item_id"] == demo_menu["menu_item_id"] for item in order["items"])
            for order in orders
        ),
        "user_demo_001 must have recent order history for the cucumber-removal menu",
    )

    todo = (ROOT / "todo.md").read_text(encoding="utf-8")
    require(
        "- [x] `shared/dummy-data` seed JSON 작성" in todo,
        "todo.md must mark shared dummy-data complete",
    )

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    require("shared/dummy-data" in readme, "README must mention shared/dummy-data")

    print("Shared dummy-data verification passed.")


if __name__ == "__main__":
    main()
