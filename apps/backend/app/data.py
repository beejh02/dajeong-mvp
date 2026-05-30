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
        "options": [
            {"id": "option-a-set", "name": "세트 변경", "priceDelta": 2700},
            {"id": "option-a-extra-cheese", "name": "치즈 추가", "priceDelta": 600},
            {"id": "a-remove-pickle", "name": "피클 제외", "priceDelta": 0},
        ],
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
        "options": [
            {"id": "a-extra-patty", "name": "패티 추가", "priceDelta": 1800},
            {"id": "a-less-sauce", "name": "소스 적게", "priceDelta": 0},
        ],
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
        "options": [
            {"id": "a-tartar-plus", "name": "타르타르 소스 추가", "priceDelta": 400},
            {"id": "a-remove-onion", "name": "양파 제외", "priceDelta": 0},
        ],
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
        "options": [
            {"id": "option-b-set", "name": "세트 변경", "priceDelta": 2700},
            {"id": "b-extra-egg", "name": "계란 추가", "priceDelta": 700},
            {"id": "b-remove-tomato", "name": "토마토 제외", "priceDelta": 0},
        ],
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
        "options": [
            {"id": "b-avocado", "name": "아보카도 추가", "priceDelta": 1200},
            {"id": "b-dressing-side", "name": "드레싱 따로", "priceDelta": 0},
        ],
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
        "options": [
            {"id": "b-large-drink", "name": "음료 라지 변경", "priceDelta": 500},
            {"id": "b-salt-less", "name": "소금 적게", "priceDelta": 0},
        ],
    },
]
