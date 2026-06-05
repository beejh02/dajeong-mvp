COMPANIES = [
    {
        "id": "company-a",
        "name": "A기업",
        "displayName": "A기업 Vertical Kiosk",
        "uiType": "vertical",
        "description": "Vertical UI 키오스크 데모 기업",
    },
    {
        "id": "company-b",
        "name": "B기업",
        "displayName": "B기업 Horizontal Kiosk",
        "uiType": "horizontal",
        "description": "Horizontal UI 키오스크 데모 기업",
    },
]


USERS = [
    {
        "id": "user-demo-1",
        "name": "다정 데모 사용자",
        "phone": "010-0000-0001",
        "pointBalance": 12500,
        "defaultPaymentMethod": "demo-card",
    },
    {
        "id": "user-demo-2",
        "name": "키오스크 연습 사용자",
        "phone": "010-0000-0002",
        "pointBalance": 4300,
        "defaultPaymentMethod": "demo-pay",
    },
]


BURGER_OPTION_GROUPS = [
    {
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
    },
    {
        "id": "side",
        "title": "사이드 메뉴",
        "selectionMode": "single",
        "required": False,
        "minSelect": 0,
        "maxSelect": 1,
        "choices": [
            {"id": "side-fries-l", "name": "감자튀김(L)", "priceDelta": 1000},
            {"id": "side-fries-r", "name": "감자튀김(R)", "priceDelta": 0},
            {"id": "side-nugget", "name": "치킨 너겟", "priceDelta": 1200},
            {"id": "side-cheese-stick", "name": "치즈스틱", "priceDelta": 1500},
            {"id": "side-onion-ring", "name": "어니언링", "priceDelta": 1300},
        ],
    },
    {
        "id": "drink",
        "title": "음료",
        "selectionMode": "single",
        "required": False,
        "minSelect": 0,
        "maxSelect": 1,
        "choices": [
            {"id": "drink-coke-l", "name": "콜라(L)", "priceDelta": 700},
            {"id": "drink-coke-r", "name": "콜라(R)", "priceDelta": 0},
            {"id": "drink-zero-coke", "name": "제로콜라", "priceDelta": 0},
            {"id": "drink-cider", "name": "사이다", "priceDelta": 0},
            {"id": "drink-matcha-latte", "name": "말차라떼", "priceDelta": 1500},
        ],
    },
    {
        "id": "addon",
        "title": "추가",
        "selectionMode": "multiple",
        "required": False,
        "minSelect": 0,
        "maxSelect": 2,
        "choices": [
            {"id": "addon-soft-icecream", "name": "소프트아이스크림", "priceDelta": 1200},
            {"id": "addon-strawberry-icecream", "name": "딸기아이스크림", "priceDelta": 1500},
        ],
    },
]


MENUS = [
    {
        "id": "menu-a-001",
        "companyId": "company-a",
        "name": "A 클래식 버거",
        "category": "burger",
        "price": 7200,
        "description": "A기업 Vertical UI의 기본 버거 메뉴",
        "imageUrl": "/images/company-a/classic-burger.png",
        "isAvailable": True,
        "optionGroups": BURGER_OPTION_GROUPS,
    },
    {
        "id": "menu-a-002",
        "companyId": "company-a",
        "name": "A 불고기 버거",
        "category": "burger",
        "price": 7600,
        "description": "달콤한 불고기 소스를 더한 A기업 메뉴",
        "imageUrl": "/images/company-a/bulgogi-burger.png",
        "isAvailable": True,
        "optionGroups": BURGER_OPTION_GROUPS,
    },
    {
        "id": "menu-a-003",
        "companyId": "company-a",
        "name": "A 새우 버거",
        "category": "burger",
        "price": 7900,
        "description": "바삭한 새우 패티를 사용한 A기업 메뉴",
        "imageUrl": "/images/company-a/shrimp-burger.png",
        "isAvailable": True,
        "optionGroups": BURGER_OPTION_GROUPS,
    },
    {
        "id": "menu-b-001",
        "companyId": "company-b",
        "name": "B 클래식 랩",
        "category": "wrap",
        "price": 9700,
        "description": "B기업 Horizontal UI의 기본 랩 메뉴",
        "imageUrl": "/images/company-b/classic-wrap.png",
        "isAvailable": True,
        "optionGroups": BURGER_OPTION_GROUPS,
    },
    {
        "id": "menu-b-002",
        "companyId": "company-b",
        "name": "B 치킨 샐러드",
        "category": "salad",
        "price": 8200,
        "description": "담백한 닭가슴살과 채소를 담은 B기업 메뉴",
        "imageUrl": "/images/company-b/chicken-salad.png",
        "isAvailable": True,
        "optionGroups": BURGER_OPTION_GROUPS,
    },
    {
        "id": "menu-b-003",
        "companyId": "company-b",
        "name": "B 포테이토 세트",
        "category": "side",
        "price": 5400,
        "description": "감자튀김과 음료를 함께 제공하는 B기업 세트",
        "imageUrl": "/images/company-b/potato-set.png",
        "isAvailable": True,
        "optionGroups": BURGER_OPTION_GROUPS,
    },
]
