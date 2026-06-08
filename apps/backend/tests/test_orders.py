import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import store


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_orders():
    store.reset_orders()


def order_payload(
    *,
    fulfillment_type: str = "dine_in",
    point_enabled: bool = False,
    point_phone: str | None = None,
    quantity: int = 1,
):
    return {
        "companyId": "company-a",
        "userId": "user-demo-1",
        "items": [
            {
                "menuId": "menu-a-001",
                "quantity": quantity,
                "selectedOptionGroups": [
                    {"groupId": "bun", "choiceIds": ["bun-normal"]},
                ],
            }
        ],
        "fulfillmentType": fulfillment_type,
        "paymentMethod": "credit_card",
        "pointAccrual": {
            "enabled": point_enabled,
            "phone": point_phone,
        },
    }


def test_order_without_point_accrual_earns_zero_points():
    response = client.post(
        "/orders",
        json=order_payload(
            fulfillment_type="pickup",
            point_enabled=False,
            point_phone=None,
        ),
    )

    assert response.status_code == 201
    created_order = response.json()
    assert created_order["pointEarned"] == 0
    assert created_order["pointAccrual"]["enabled"] is False
    assert created_order["pointAccrual"]["phone"] is None
    assert created_order["fulfillmentType"] == "pickup"


def test_order_with_point_accrual_earns_points_and_preserves_phone():
    response = client.post(
        "/orders",
        json=order_payload(
            fulfillment_type="dine_in",
            point_enabled=True,
            point_phone="010-1234-5678",
        ),
    )

    assert response.status_code == 201
    created_order = response.json()
    assert created_order["pointEarned"] == created_order["totalPrice"] // 100
    assert created_order["pointAccrual"]["enabled"] is True
    assert created_order["pointAccrual"]["phone"] == "010-1234-5678"
    assert created_order["fulfillmentType"] == "dine_in"


def test_point_accrual_requires_phone_when_enabled():
    response = client.post(
        "/orders",
        json=order_payload(point_enabled=True, point_phone=None),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Point phone is required"


def test_admin_summary_total_point_earned_uses_actual_earned_points():
    no_point_response = client.post(
        "/orders",
        json=order_payload(point_enabled=False, point_phone=None, quantity=2),
    )
    point_response = client.post(
        "/orders",
        json=order_payload(point_enabled=True, point_phone="010-1234-5678"),
    )

    assert no_point_response.status_code == 201
    assert point_response.status_code == 201
    no_point_order = no_point_response.json()
    point_order = point_response.json()

    summary_response = client.get("/admin/summary")

    assert summary_response.status_code == 200
    summary = summary_response.json()
    assert no_point_order["pointEarned"] == 0
    assert summary["totalOrders"] == 2
    assert summary["totalPointEarned"] == point_order["pointEarned"]
    assert summary["totalPointEarned"] != summary["totalSales"] // 100


@pytest.mark.parametrize("fulfillment_type", ["dine_in", "pickup"])
def test_order_response_preserves_fulfillment_type(fulfillment_type: str):
    response = client.post(
        "/orders",
        json=order_payload(fulfillment_type=fulfillment_type),
    )

    assert response.status_code == 201
    assert response.json()["fulfillmentType"] == fulfillment_type
