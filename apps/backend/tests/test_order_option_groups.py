import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.store import store


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_orders():
    store.reset_orders()


def base_order_payload():
    return {
        "companyId": "company-a",
        "userId": "user-demo-1",
        "items": [
            {
                "menuId": "menu-a-001",
                "quantity": 1,
                "selectedOptionGroups": [
                    {"groupId": "bun", "choiceIds": ["bun-normal"]},
                    {"groupId": "side", "choiceIds": ["side-fries-l"]},
                ],
            }
        ],
        "fulfillmentType": "dine_in",
        "paymentMethod": "credit_card",
        "pointAccrual": {"enabled": False, "phone": None},
    }


def test_company_menus_return_option_groups():
    response = client.get("/companies/company-a/menus")

    assert response.status_code == 200
    first_menu = response.json()["menus"][0]
    assert "options" not in first_menu
    assert first_menu["optionGroups"][0] == {
        "id": "bun",
        "title": "번 선택",
        "selectionMode": "single",
        "required": True,
        "minSelect": 1,
        "maxSelect": 1,
        "choices": [
            {"id": "bun-normal", "name": "일반", "priceDelta": 0},
            {"id": "bun-toasted", "name": "번 굽기", "priceDelta": 500},
        ],
    }


def test_create_order_accepts_selected_option_groups_and_checkout_fields():
    response = client.post("/orders", json=base_order_payload())

    assert response.status_code == 201
    created_order = response.json()
    assert created_order["fulfillmentType"] == "dine_in"
    assert created_order["paymentMethod"] == "credit_card"
    assert created_order["pointAccrual"] == {"enabled": False, "phone": None}
    assert created_order["items"][0]["selectedOptionGroups"] == [
        {
            "groupId": "bun",
            "groupTitle": "번 선택",
            "choices": [{"id": "bun-normal", "name": "일반", "priceDelta": 0}],
        },
        {
            "groupId": "side",
            "groupTitle": "사이드 메뉴",
            "choices": [{"id": "side-fries-l", "name": "감자튀김(L)", "priceDelta": 1000}],
        },
    ]
    assert created_order["items"][0]["unitPrice"] == 8200
    assert created_order["totalPrice"] == 8200


def test_required_option_group_is_missing_returns_400():
    payload = base_order_payload()
    payload["items"][0]["selectedOptionGroups"] = [
        {"groupId": "side", "choiceIds": ["side-fries-l"]}
    ]

    response = client.post("/orders", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Required option group is missing"


def test_unknown_option_group_returns_400():
    payload = base_order_payload()
    payload["items"][0]["selectedOptionGroups"].append(
        {"groupId": "unknown", "choiceIds": ["bun-normal"]}
    )

    response = client.post("/orders", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Menu option group not found"


def test_unknown_option_choice_returns_400():
    payload = base_order_payload()
    payload["items"][0]["selectedOptionGroups"][0] = {
        "groupId": "bun",
        "choiceIds": ["unknown"],
    }

    response = client.post("/orders", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Menu option choice not found"


def test_single_option_group_rejects_multiple_choices():
    payload = base_order_payload()
    payload["items"][0]["selectedOptionGroups"][0] = {
        "groupId": "bun",
        "choiceIds": ["bun-normal", "bun-toasted"],
    }

    response = client.post("/orders", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Single option group cannot have multiple choices"


def test_duplicate_option_choice_returns_400():
    payload = base_order_payload()
    payload["items"][0]["selectedOptionGroups"][1] = {
        "groupId": "side",
        "choiceIds": ["side-fries-l", "side-fries-l"],
    }

    response = client.post("/orders", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Duplicate option choice selected"


def test_point_accrual_requires_phone_when_enabled():
    payload = base_order_payload()
    payload["pointAccrual"] = {"enabled": True, "phone": " "}

    response = client.post("/orders", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Point phone is required"
