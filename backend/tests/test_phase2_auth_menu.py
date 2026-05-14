from __future__ import annotations

import importlib
import sqlite3
import sys
from pathlib import Path
from typing import Iterator

import pytest
from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[2]
APP_DIR = ROOT / "backend" / "app"

if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))


def reload_backend_app():
    for module_name in [
        "main",
        "database",
        "dependencies",
        "models",
        "schemas",
        "security",
        "seed",
        "routers",
        "routers.auth",
        "routers.menu",
    ]:
        sys.modules.pop(module_name, None)

    main = importlib.import_module("main")
    return main.app


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    db_path = tmp_path / "phase2.sqlite3"
    monkeypatch.setenv("DAJEONG_DATABASE_URL", f"sqlite:///{db_path}")
    app = reload_backend_app()

    with TestClient(app) as test_client:
        test_client.db_path = db_path  # type: ignore[attr-defined]
        yield test_client


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_seed_user_can_login_and_read_me(client: TestClient) -> None:
    response = client.post(
        "/auth/login",
        json={"username": "user1", "password": "user1234"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]

    me_response = client.get("/auth/me", headers=auth_header(payload["access_token"]))

    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload["username"] == "user1"
    assert me_payload["role"] == "user"
    assert me_payload["profile"]["easy_mode_enabled"] is True


def test_login_rejects_invalid_password(client: TestClient) -> None:
    response = client.post(
        "/auth/login",
        json={"username": "user1", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_register_creates_loginable_user(client: TestClient) -> None:
    register_response = client.post(
        "/auth/register",
        json={
            "username": "new_user",
            "password": "new-user-password",
            "display_name": "신규 사용자",
        },
    )

    assert register_response.status_code == 201
    created_user = register_response.json()
    assert created_user["username"] == "new_user"
    assert "password" not in created_user
    assert "password_hash" not in created_user

    login_response = client.post(
        "/auth/login",
        json={"username": "new_user", "password": "new-user-password"},
    )

    assert login_response.status_code == 200


def test_seed_passwords_are_hashed(client: TestClient) -> None:
    db_path = client.db_path  # type: ignore[attr-defined]

    with sqlite3.connect(db_path) as connection:
        row = connection.execute(
            "SELECT password_hash FROM users WHERE username = ?",
            ("user1",),
        ).fetchone()

    assert row is not None
    assert row[0] != "user1234"
    assert row[0].startswith("pbkdf2_sha256$")


def test_menu_list_returns_only_a_company_available_menus(client: TestClient) -> None:
    response = client.get("/menu")

    assert response.status_code == 200
    menus = response.json()
    assert menus
    assert {menu["brand_id"] for menu in menus} == {"brand_burger_a"}
    assert {menu["menu_item_id"] for menu in menus} >= {
        "menu_dajeong_classic_set",
        "menu_dajeong_teriyaki_set",
    }
    assert all("ingredients" not in menu for menu in menus)


def test_menu_detail_returns_ingredients_and_options(client: TestClient) -> None:
    response = client.get("/menu/menu_dajeong_classic_set")

    assert response.status_code == 200
    menu = response.json()
    assert menu["menu_item_id"] == "menu_dajeong_classic_set"
    assert menu["price"] == 7900
    assert any(
        ingredient["ingredient_id"] == "ingredient_pickle_cucumber"
        and ingredient["removable"] is True
        for ingredient in menu["ingredients"]
    )
    assert any(option_group["option_group_id"] == "drink_choice" for option_group in menu["options"])
