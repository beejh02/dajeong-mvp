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
        "services.dajeong_chat_service",
        "services.mcp_client",
        "services.order_service",
        "routers",
        "routers.admin",
        "routers.auth",
        "routers.dajeong",
        "routers.mcp",
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
    db_path = tmp_path / "phase5.sqlite3"
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


def test_chat_generates_recent_order_candidate_with_preferences(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")

    response = client.post(
        "/dajeong/chat",
        headers=auth_header(user_token),
        json={"message": "늘 먹던 햄버거 하나 주문해줘. 오이는 빼줘."},
    )

    assert response.status_code == 200
    payload = response.json()
    candidate = payload["candidate"]
    item = candidate["items"][0]

    assert payload["reply"] == "최근 주문을 기준으로 주문 후보를 만들었어요."
    assert candidate["intent"] == "order_burger"
    assert candidate["source"] == "recent_order"
    assert candidate["recent_order_id"] == "order_demo_20260510_001"
    assert candidate["total_price"] == 7900
    assert item["menu_item_id"] == "menu_dajeong_classic_set"
    assert item["quantity"] == 1
    assert item["removed_ingredient_ids"] == ["ingredient_pickle_cucumber"]
    assert candidate["applied_preferences"] == ["ingredient_pickle_cucumber"]
    assert candidate["order_request_items"][0]["selected_options"] == [
        {"option_group_id": "drink_choice", "choice_id": "drink_zero_cola"},
        {"option_group_id": "side_choice", "choice_id": "side_fries"},
    ]


def test_chat_uses_menu_keyword_when_recent_order_is_not_requested(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")

    response = client.post(
        "/dajeong/chat",
        headers=auth_header(user_token),
        json={"message": "데리야키 버거 하나 주문해줘"},
    )

    assert response.status_code == 200
    candidate = response.json()["candidate"]

    assert candidate["source"] == "menu_keyword"
    assert candidate["recent_order_id"] is None
    assert candidate["total_price"] == 8500
    assert candidate["items"][0]["menu_item_id"] == "menu_dajeong_teriyaki_set"
    assert candidate["order_request_items"][0]["selected_options"] == [
        {"option_group_id": "drink_choice", "choice_id": "drink_cola"},
    ]


def test_final_approval_creates_pending_payment_order_from_candidate(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")
    chat_response = client.post(
        "/dajeong/chat",
        headers=auth_header(user_token),
        json={"message": "늘 먹던 햄버거 하나 주문해줘. 오이는 빼줘."},
    )
    assert chat_response.status_code == 200
    candidate = chat_response.json()["candidate"]

    approval_response = client.post(
        "/dajeong/final-approval",
        headers=auth_header(user_token),
        json={
            "candidate_id": candidate["candidate_id"],
            "approved": True,
            "items": candidate["order_request_items"],
        },
    )

    assert approval_response.status_code == 201
    payload = approval_response.json()
    order = payload["order"]

    assert payload["approved"] is True
    assert order["order_status"] == "pending_payment"
    assert order["payment_status"] == "ready"
    assert order["total_price"] == 7900
    assert order["items"][0]["menu_item_id"] == "menu_dajeong_classic_set"
    assert order["items"][0]["removed_ingredient_ids"] == ["ingredient_pickle_cucumber"]


def test_chat_and_final_approval_record_mcp_log_entries(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")
    admin_token = login(client, "admin", "dajeong")

    chat_response = client.post(
        "/dajeong/chat",
        headers=auth_header(user_token),
        json={"message": "늘 먹던 햄버거 하나 주문해줘. 오이는 빼줘."},
    )
    assert chat_response.status_code == 200
    candidate = chat_response.json()["candidate"]

    approval_response = client.post(
        "/dajeong/final-approval",
        headers=auth_header(user_token),
        json={
            "candidate_id": candidate["candidate_id"],
            "approved": True,
            "items": candidate["order_request_items"],
        },
    )
    assert approval_response.status_code == 201

    logs_response = client.get("/admin/mcp-logs", headers=auth_header(admin_token))
    assert logs_response.status_code == 200
    tool_names = [log["tool_name"] for log in logs_response.json()]

    assert "create_order_draft" in tool_names
    assert "place_order" in tool_names


def test_final_approval_requires_user_approval(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")

    response = client.post(
        "/dajeong/final-approval",
        headers=auth_header(user_token),
        json={
            "candidate_id": "candidate_demo",
            "approved": False,
            "items": [
                {
                    "menu_item_id": "menu_dajeong_classic_set",
                    "quantity": 1,
                    "removed_ingredient_ids": [],
                    "selected_options": [
                        {"option_group_id": "drink_choice", "choice_id": "drink_cola"},
                        {"option_group_id": "side_choice", "choice_id": "side_fries"},
                    ],
                }
            ],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Final approval is required"
