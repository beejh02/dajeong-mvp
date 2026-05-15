from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from schemas import McpToolCallResponse
from services.mcp_client import call_burger_tool


router = APIRouter(prefix="/mcp/burger", tags=["mcp"])


@router.post("/tools/{tool_name}", response_model=McpToolCallResponse)
def call_burger_mcp_tool(
    tool_name: str,
    payload: dict[str, Any],
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> McpToolCallResponse:
    return call_burger_tool(db, tool_name, payload)
