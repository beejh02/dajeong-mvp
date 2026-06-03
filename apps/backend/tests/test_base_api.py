import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import store


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_orders():
    store.reset_orders()


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "dajeong-mvp-backend"}


def test_local_frontend_cors_preflight_is_allowed():
    response = client.options(
        "/companies",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_companies_include_a_and_b_kiosk_layouts():
    response = client.get("/companies")

    assert response.status_code == 200
    companies = response.json()["companies"]
    assert {
        "id": "company-a",
        "name": "A기업",
        "displayName": "A기업 Vertical Kiosk",
        "uiType": "vertical",
        "description": "Vertical UI 키오스크 데모 기업",
    } in companies
    assert {
        "id": "company-b",
        "name": "B기업",
        "displayName": "B기업 Horizontal Kiosk",
        "uiType": "horizontal",
        "description": "Horizontal UI 키오스크 데모 기업",
    } in companies


def test_get_company_detail_by_id():
    response = client.get("/companies/company-a")

    assert response.status_code == 200
    assert response.json() == {
        "id": "company-a",
        "name": "A기업",
        "displayName": "A기업 Vertical Kiosk",
        "uiType": "vertical",
        "description": "Vertical UI 키오스크 데모 기업",
    }


def test_company_menus_are_scoped_by_company():
    company_a_response = client.get("/companies/company-a/menus")
    company_b_response = client.get("/companies/company-b/menus")

    assert company_a_response.status_code == 200
    assert company_b_response.status_code == 200

    company_a_menus = company_a_response.json()["menus"]
    company_b_menus = company_b_response.json()["menus"]

    assert len(company_a_menus) >= 3
    assert len(company_b_menus) >= 3
    assert {menu["companyId"] for menu in company_a_menus} == {"company-a"}
    assert {menu["companyId"] for menu in company_b_menus} == {"company-b"}
    assert company_a_menus[0]["imageUrl"].startswith("/images/")
    assert company_a_menus[0]["isAvailable"] is True
    assert company_a_menus[0]["options"][0]["id"]
    assert company_a_menus[0]["options"][0]["priceDelta"] >= 0


def test_create_order_and_read_admin_order_views():
    order_payload = {
        "companyId": "company-a",
        "userId": "user-demo-1",
        "items": [
            {
                "menuId": "menu-a-001",
                "quantity": 1,
                "selectedOptionIds": ["option-a-set"],
            }
        ],
    }

    create_response = client.post("/orders", json=order_payload)

    assert create_response.status_code == 201
    created_order = create_response.json()
    assert created_order["id"] == "order-0001"
    assert created_order["orderNumber"].startswith("ORD-")
    assert created_order["orderNumber"].endswith("-0001")
    assert created_order["waitingNumber"] == 101
    assert created_order["companyId"] == "company-a"
    assert created_order["userId"] == "user-demo-1"
    assert created_order["status"] == "waiting"
    assert created_order["totalPrice"] == 9900
    assert created_order["pointEarned"] == 99
    assert created_order["items"][0]["id"] == "order-item-0001-01"
    assert created_order["items"][0]["orderId"] == "order-0001"
    assert created_order["items"][0]["menuId"] == "menu-a-001"
    assert created_order["items"][0]["quantity"] == 1
    assert created_order["items"][0]["unitPrice"] == 9900
    assert created_order["items"][0]["itemPrice"] == 9900
    assert created_order["items"][0]["selectedOptions"] == [
        {"id": "option-a-set", "name": "세트 변경", "priceDelta": 2700}
    ]

    list_response = client.get("/admin/orders")

    assert list_response.status_code == 200
    admin_orders = list_response.json()["orders"]
    assert admin_orders == [created_order]

    detail_response = client.get(f"/admin/orders/{created_order['id']}")

    assert detail_response.status_code == 200
    assert detail_response.json() == created_order


def test_admin_summary_counts_orders_and_revenue():
    client.post(
        "/orders",
        json={
            "companyId": "company-a",
            "userId": "user-demo-1",
            "items": [{"menuId": "menu-a-001", "quantity": 1, "selectedOptionIds": []}],
        },
    )
    client.post(
        "/orders",
        json={
            "companyId": "company-b",
            "userId": "user-demo-2",
            "items": [{"menuId": "menu-b-001", "quantity": 1, "selectedOptionIds": ["option-b-set"]}],
        },
    )

    response = client.get("/admin/summary")

    assert response.status_code == 200
    assert response.json() == {
        "totalOrders": 2,
        "totalSales": 19600,
        "waitingOrders": 2,
        "companyCount": 2,
        "menuCount": 6,
    }
