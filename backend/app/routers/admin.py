from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin_user
from models import User
from schemas import AdminOrderStatusUpdateRequest, McpCallLogDetailResponse, McpCallLogSummaryResponse, OrderResponse
from services.mcp_client import get_mcp_log_detail, list_mcp_logs
from services.order_service import get_order_response, list_admin_orders, update_order_status


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/orders", response_model=list[OrderResponse])
def read_admin_orders(
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> list[OrderResponse]:
    return list_admin_orders(db)


@router.get("/orders/{order_id}", response_model=OrderResponse)
def read_admin_order_detail(
    order_id: str,
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    return get_order_response(db, order_id)


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def patch_admin_order_status(
    order_id: str,
    payload: AdminOrderStatusUpdateRequest,
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    return update_order_status(db, order_id, payload.order_status)


@router.get("/mcp-logs", response_model=list[McpCallLogSummaryResponse])
def read_admin_mcp_logs(
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> list[McpCallLogSummaryResponse]:
    return list_mcp_logs(db)


@router.get("/mcp-logs/{log_id}", response_model=McpCallLogDetailResponse)
def read_admin_mcp_log_detail(
    log_id: str,
    _: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
) -> McpCallLogDetailResponse:
    return get_mcp_log_detail(db, log_id)
