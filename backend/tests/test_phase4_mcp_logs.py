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
        "services.mcp_client",
        "services.order_service",
        "routers",
        "routers.admin",
        "routers.auth",
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
    db_path = tmp_path / "phase4.sqlite3"
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


def test_backend_mcp_tool_call_is_logged_and_visible_to_admin(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")
    admin_token = login(client, "admin", "dajeong")

    call_response = client.post(
        "/mcp/burger/tools/get_menus",
        headers=auth_header(user_token),
        json={"brand_id": "brand_burger_a"},
    )

    assert call_response.status_code == 200
    call_payload = call_response.json()
    assert call_payload["tool_name"] == "get_menus"
    assert call_payload["status"] == "success"
    assert call_payload["result"]["menus"]

    logs_response = client.get("/admin/mcp-logs", headers=auth_header(admin_token))
    assert logs_response.status_code == 200
    logs = logs_response.json()
    assert len(logs) == 1
    assert logs[0]["tool_name"] == "get_menus"
    assert logs[0]["status"] == "success"

    detail_response = client.get(
        f"/admin/mcp-logs/{logs[0]['log_id']}",
        headers=auth_header(admin_token),
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["request_payload"] == {"brand_id": "brand_burger_a"}
    assert detail["response_payload"]["menus"]


def test_backend_mcp_failed_tool_call_is_logged(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")
    admin_token = login(client, "admin", "dajeong")

    call_response = client.post(
        "/mcp/burger/tools/unknown_tool",
        headers=auth_header(user_token),
        json={"demo": True},
    )

    assert call_response.status_code == 400

    logs_response = client.get("/admin/mcp-logs", headers=auth_header(admin_token))
    assert logs_response.status_code == 200
    failed_log = logs_response.json()[0]
    assert failed_log["tool_name"] == "unknown_tool"
    assert failed_log["status"] == "failed"


def test_non_admin_cannot_read_mcp_logs(client: TestClient) -> None:
    user_token = login(client, "user1", "user1234")

    response = client.get("/admin/mcp-logs", headers=auth_header(user_token))

    assert response.status_code == 403

