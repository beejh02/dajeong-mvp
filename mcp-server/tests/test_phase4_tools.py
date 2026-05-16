from __future__ import annotations

import importlib.util
from pathlib import Path

from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[2]
MCP_MAIN = ROOT / "mcp-server" / "app" / "main.py"


def load_mcp_app():
    spec = importlib.util.spec_from_file_location("dajeong_mcp_server_main", MCP_MAIN)
    assert spec is not None
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module.app


def test_mcp_server_exposes_burger_tool_contract() -> None:
    client = TestClient(load_mcp_app())

    response = client.get("/tools")

    assert response.status_code == 200
    tools = response.json()["tools"]
    assert {tool["name"] for tool in tools} >= {
        "get_menus",
        "get_menu_detail",
        "get_recent_orders",
        "create_order_draft",
        "place_order",
        "request_payment",
    }


def test_mcp_server_executes_fake_burger_tool() -> None:
    client = TestClient(load_mcp_app())

    response = client.post(
        "/tools/get_menus",
        json={"brand_id": "brand_burger_a"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["tool_name"] == "get_menus"
    assert payload["status"] == "success"
    assert payload["result"]["menus"]

