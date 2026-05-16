from __future__ import annotations

import importlib
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
        "services",
        "services.order_service",
        "routers",
        "routers.admin",
        "routers.auth",
        "routers.menu",
        "routers.orders",
        "routers.payments",
        "routers.points",
    ]:
        sys.modules.pop(module_name, None)

    main = importlib.import_module("main")
    return main.app


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    db_path = tmp_path / "phase3.sqlite3"
    monkeypatch.setenv("DAJEONG_DATABASE_URL", f"sqlite:///{db_path}")
    app = reload_backend_app()

    with TestClient(app) as test_client:
        yield test_client


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login(client: TestClient, username: str, password: str) -> str:
    response = client.post(
        "/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def create_demo_order(client: TestClient, token: str) -> dict:
    response = client.post(
        "/orders",
        headers=auth_header(token),
        json={
            "items": [
                {
                    "menu_item_id": "menu_dajeong_classic_set",
                    "quantity": 2,
                    "removed_ingredient_ids": ["ingredient_pickle_cucumber"],
                    "selected_options": [
                        {"option_group_id": "drink_choice", "choice_id": "drink_cola"},
                        {"option_group_id": "side_choice", "choice_id": "side_cheese_sticks"},
                    ],
                }
            ],
            "client_total_price": 1,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_order_creation_recalculates_total_and_starts_pending_payment(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")

    order = create_demo_order(client, user_token)

    assert order["order_status"] == "pending_payment"
    assert order["payment_status"] == "ready"
    assert order["total_price"] == 17400
    assert order["items"][0]["unit_price"] == 8700
    assert order["items"][0]["line_total"] == 17400
    assert order["items"][0]["removed_ingredient_ids"] == ["ingredient_pickle_cucumber"]


def test_order_creation_rejects_non_removable_ingredient(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")

    response = client.post(
        "/orders",
        headers=auth_header(user_token),
        json={
            "items": [
                {
                    "menu_item_id": "menu_dajeong_classic_set",
                    "quantity": 1,
                    "removed_ingredient_ids": ["ingredient_beef_patty"],
                    "selected_options": [],
                }
            ]
        },
    )

    assert response.status_code == 400


def test_payment_approval_creates_points_and_receipt(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")
    order = create_demo_order(client, user_token)

    payment_response = client.post(
        "/payments/dummy/approve",
        headers=auth_header(user_token),
        json={"order_id": order["order_id"], "idempotency_key": "demo-payment-001"},
    )

    assert payment_response.status_code == 200
    payment = payment_response.json()
    assert payment["payment_status"] == "paid"
    assert payment["order_status"] == "accepted"
    assert payment["approved_amount"] == 17400
    assert payment["points_earned"] == 174

    points_response = client.get("/points/me", headers=auth_header(user_token))
    assert points_response.status_code == 200
    assert points_response.json()["balance"] == 174

    receipt_response = client.get(
        f"/orders/{order['order_id']}/receipt",
        headers=auth_header(user_token),
    )
    assert receipt_response.status_code == 200
    receipt = receipt_response.json()
    assert receipt["order_id"] == order["order_id"]
    assert receipt["total_price"] == 17400
    assert receipt["payment_status"] == "paid"


def test_admin_can_list_detail_and_update_order_status(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")
    admin_token = login(client, "admin", "dajeong")
    order = create_demo_order(client, user_token)

    list_response = client.get("/admin/orders", headers=auth_header(admin_token))
    assert list_response.status_code == 200
    assert any(item["order_id"] == order["order_id"] for item in list_response.json())

    detail_response = client.get(
        f"/admin/orders/{order['order_id']}",
        headers=auth_header(admin_token),
    )
    assert detail_response.status_code == 200
    assert detail_response.json()["order_id"] == order["order_id"]

    patch_response = client.patch(
        f"/admin/orders/{order['order_id']}/status",
        headers=auth_header(admin_token),
        json={"order_status": "cooking"},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["order_status"] == "cooking"


def test_non_admin_cannot_use_admin_orders(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")

    response = client.get("/admin/orders", headers=auth_header(user_token))

    assert response.status_code == 403

