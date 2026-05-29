from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "dajeong-backend"}


def test_companies_include_a_and_b_kiosk_layouts():
    response = client.get("/companies")

    assert response.status_code == 200
    companies = response.json()["companies"]
    assert {
        "company_id": "company-a",
        "name": "A기업",
        "ui_layout": "vertical",
        "description": "Vertical UI 키오스크 데모 기업",
    } in companies
    assert {
        "company_id": "company-b",
        "name": "B기업",
        "ui_layout": "horizontal",
        "description": "Horizontal UI 키오스크 데모 기업",
    } in companies


def test_company_menus_are_scoped_by_company():
    company_a_response = client.get("/companies/company-a/menus")
    company_b_response = client.get("/companies/company-b/menus")

    assert company_a_response.status_code == 200
    assert company_b_response.status_code == 200

    company_a_menus = company_a_response.json()["menus"]
    company_b_menus = company_b_response.json()["menus"]

    assert len(company_a_menus) >= 3
    assert len(company_b_menus) >= 3
    assert {menu["company_id"] for menu in company_a_menus} == {"company-a"}
    assert {menu["company_id"] for menu in company_b_menus} == {"company-b"}
    assert company_a_menus[0]["options"][0]["option_id"]
    assert company_b_menus[0]["options"][0]["option_id"]


def test_create_order_and_read_admin_order_views():
    order_payload = {
        "company_id": "company-a",
        "user_id": "user-demo-001",
        "items": [
            {
                "menu_id": "a-classic-burger",
                "quantity": 2,
                "option_ids": ["a-extra-cheese"],
            }
        ],
    }

    create_response = client.post("/orders", json=order_payload)

    assert create_response.status_code == 201
    created_order = create_response.json()
    assert created_order["order_id"].startswith("order-")
    assert created_order["company_id"] == "company-a"
    assert created_order["user"]["user_id"] == "user-demo-001"
    assert created_order["status"] == "received"
    assert created_order["payment_status"] == "not_requested"
    assert created_order["total_price"] == 15600
    assert created_order["items"][0]["menu_id"] == "a-classic-burger"
    assert created_order["items"][0]["quantity"] == 2

    list_response = client.get("/admin/orders")

    assert list_response.status_code == 200
    admin_orders = list_response.json()["orders"]
    assert any(order["order_id"] == created_order["order_id"] for order in admin_orders)

    detail_response = client.get(f"/admin/orders/{created_order['order_id']}")

    assert detail_response.status_code == 200
    assert detail_response.json() == created_order
