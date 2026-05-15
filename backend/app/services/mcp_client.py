from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import McpCallLog, MenuItem
from schemas import McpCallLogDetailResponse, McpCallLogSummaryResponse, McpToolCallResponse


SUCCESS = "success"
FAILED = "failed"
SUPPORTED_TOOLS = {
    "get_menus",
    "get_menu_detail",
    "get_recent_orders",
    "create_order_draft",
    "place_order",
    "request_payment",
}


def now_text() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def call_burger_tool(db: Session, tool_name: str, payload: dict[str, Any]) -> McpToolCallResponse:
    try:
        result = execute_fake_burger_tool(db, tool_name, payload)
    except HTTPException as exc:
        log = create_mcp_log(
            db=db,
            tool_name=tool_name,
            status_value=FAILED,
            request_payload=payload,
            response_payload={"error": exc.detail},
            error_message=str(exc.detail),
        )
        db.commit()
        raise exc

    log = create_mcp_log(
        db=db,
        tool_name=tool_name,
        status_value=SUCCESS,
        request_payload=payload,
        response_payload=result,
        error_message=None,
    )
    db.commit()
    return McpToolCallResponse(
        log_id=log.log_id,
        tool_name=tool_name,
        status=SUCCESS,
        result=result,
    )


def execute_fake_burger_tool(
    db: Session,
    tool_name: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    if tool_name not in SUPPORTED_TOOLS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported MCP tool",
        )

    if tool_name == "get_menus":
        brand_id = payload.get("brand_id", "brand_burger_a")
        menus = db.scalars(
            select(MenuItem)
            .where(MenuItem.brand_id == brand_id)
            .where(MenuItem.is_available.is_(True))
            .order_by(MenuItem.name)
        ).all()
        return {
            "menus": [
                {
                    "menu_item_id": menu.menu_item_id,
                    "name": menu.name,
                    "price": menu.price,
                    "category": menu.category,
                }
                for menu in menus
            ]
        }

    if tool_name == "get_menu_detail":
        menu_id = payload.get("menu_item_id")
        menu = db.get(MenuItem, menu_id)
        if menu is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Menu item not found",
            )
        return {
            "menu_item_id": menu.menu_item_id,
            "name": menu.name,
            "price": menu.price,
            "options": json.loads(menu.options_json),
        }

    return {
        "accepted": True,
        "tool_name": tool_name,
        "mode": "fake_mcp_http_adapter",
        "payload": payload,
    }


def create_mcp_log(
    db: Session,
    tool_name: str,
    status_value: str,
    request_payload: dict[str, Any],
    response_payload: dict[str, Any],
    error_message: str | None,
) -> McpCallLog:
    log = McpCallLog(
        log_id=f"mcp_log_{uuid.uuid4().hex[:12]}",
        tool_name=tool_name,
        status=status_value,
        request_payload_json=json.dumps(request_payload, ensure_ascii=False),
        response_payload_json=json.dumps(response_payload, ensure_ascii=False),
        error_message=error_message,
        created_at=now_text(),
    )
    db.add(log)
    return log


def list_mcp_logs(db: Session) -> list[McpCallLogSummaryResponse]:
    logs = db.scalars(select(McpCallLog).order_by(McpCallLog.created_at.desc())).all()
    return [
        McpCallLogSummaryResponse(
            log_id=log.log_id,
            tool_name=log.tool_name,
            status=log.status,
            created_at=log.created_at,
        )
        for log in logs
    ]


def get_mcp_log_detail(db: Session, log_id: str) -> McpCallLogDetailResponse:
    log = db.get(McpCallLog, log_id)
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MCP log not found",
        )
    return McpCallLogDetailResponse(
        log_id=log.log_id,
        tool_name=log.tool_name,
        status=log.status,
        created_at=log.created_at,
        request_payload=json.loads(log.request_payload_json),
        response_payload=json.loads(log.response_payload_json),
        error_message=log.error_message,
    )
