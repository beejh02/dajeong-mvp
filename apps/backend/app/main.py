from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    AdminSummaryResponse,
    Company,
    CompanyListResponse,
    MenuListResponse,
    OrderCreateRequest,
    OrderListResponse,
    OrderResponse,
)
from app.store import store


app = FastAPI(title="Dajeong Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def get_health() -> dict[str, str]:
    return {"status": "ok", "service": "dajeong-mvp-backend"}


@app.get("/companies", response_model=CompanyListResponse)
def list_companies() -> CompanyListResponse:
    return CompanyListResponse(companies=store.list_companies())


@app.get("/companies/{companyId}", response_model=Company)
def get_company(companyId: str) -> Company:
    return store.get_company(companyId)


@app.get("/companies/{companyId}/menus", response_model=MenuListResponse)
def list_company_menus(companyId: str) -> MenuListResponse:
    return store.list_company_menus(companyId)


@app.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(order_request: OrderCreateRequest) -> OrderResponse:
    return store.create_order(order_request)


@app.get("/admin/orders", response_model=OrderListResponse)
def list_admin_orders() -> OrderListResponse:
    return store.list_orders()


@app.get("/admin/orders/{orderId}", response_model=OrderResponse)
def get_admin_order(orderId: str) -> OrderResponse:
    return store.get_order(orderId)


@app.get("/admin/summary", response_model=AdminSummaryResponse)
def get_admin_summary() -> AdminSummaryResponse:
    return store.get_summary()
