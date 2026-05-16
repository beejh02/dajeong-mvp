from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, status


app = FastAPI(title="Dajeong MCP Adapter", version="0.1.0")

TOOLS = [
    {
        "name": "get_menus",
        "description": "A기업 메뉴 목록을 조회합니다.",
    },
    {
        "name": "get_menu_detail",
        "description": "A기업 메뉴 상세와 선택지를 조회합니다.",
    },
    {
        "name": "get_recent_orders",
        "description": "사용자의 최근 주문 후보를 조회합니다.",
    },
    {
        "name": "create_order_draft",
        "description": "자연어 주문 후보를 생성합니다.",
    },
    {
        "name": "place_order",
        "description": "A기업 주문 생성을 요청합니다.",
    },
    {
        "name": "request_payment",
        "description": "Mock 결제 요청을 생성합니다.",
    },
]


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "mcp-server"}


@app.get("/tools")
def list_tools() -> dict[str, list[dict[str, str]]]:
    return {"tools": TOOLS}


@app.post("/tools/{tool_name}")
def call_tool(tool_name: str, payload: dict[str, Any]) -> dict[str, Any]:
    if tool_name not in {tool["name"] for tool in TOOLS}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported MCP tool",
        )

    if tool_name == "get_menus":
        return {
            "tool_name": tool_name,
            "status": "success",
            "result": {
                "menus": [
                    {
                        "menu_item_id": "menu_dajeong_classic_set",
                        "name": "다정 클래식 버거 세트",
                        "price": 7900,
                    },
                    {
                        "menu_item_id": "menu_dajeong_teriyaki_set",
                        "name": "다정 데리야키 버거 세트",
                        "price": 8500,
                    },
                ]
            },
        }

    return {
        "tool_name": tool_name,
        "status": "success",
        "result": {
            "accepted": True,
            "mode": "fake_mcp_http_adapter",
            "payload": payload,
        },
    }
