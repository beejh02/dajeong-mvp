COMPANIES = [
    {
        "company_id": "company-a",
        "name": "A기업",
        "ui_layout": "vertical",
        "description": "Vertical UI 키오스크 데모 기업",
    },
    {
        "company_id": "company-b",
        "name": "B기업",
        "ui_layout": "horizontal",
        "description": "Horizontal UI 키오스크 데모 기업",
    },
]


USERS = [
    {
        "user_id": "user-demo-001",
        "name": "다정 데모 사용자",
        "phone": "010-0000-0001",
        "preferred_language": "ko",
    },
    {
        "user_id": "user-demo-002",
        "name": "키오스크 연습 사용자",
        "phone": "010-0000-0002",
        "preferred_language": "ko",
    },
]


MENUS = [
    {
        "menu_id": "a-classic-burger",
        "company_id": "company-a",
        "name": "A 클래식 버거",
        "category": "burger",
        "description": "A기업 Vertical UI의 기본 버거 메뉴",
        "price": 7200,
        "image_key": "a-classic-burger",
        "is_available": True,
        "options": [
            {"option_id": "a-extra-cheese", "name": "치즈 추가", "price_delta": 600},
            {"option_id": "a-remove-pickle", "name": "피클 제외", "price_delta": 0},
        ],
    },
    {
        "menu_id": "a-bulgogi-burger",
        "company_id": "company-a",
        "name": "A 불고기 버거",
        "category": "burger",
        "description": "달콤한 불고기 소스를 더한 A기업 메뉴",
        "price": 7600,
        "image_key": "a-bulgogi-burger",
        "is_available": True,
        "options": [
            {"option_id": "a-extra-patty", "name": "패티 추가", "price_delta": 1800},
            {"option_id": "a-less-sauce", "name": "소스 적게", "price_delta": 0},
        ],
    },
    {
        "menu_id": "a-shrimp-burger",
        "company_id": "company-a",
        "name": "A 새우 버거",
        "category": "burger",
        "description": "바삭한 새우 패티를 사용한 A기업 메뉴",
        "price": 7900,
        "image_key": "a-shrimp-burger",
        "is_available": True,
        "options": [
            {"option_id": "a-tartar-plus", "name": "타르타르 소스 추가", "price_delta": 400},
            {"option_id": "a-remove-onion", "name": "양파 제외", "price_delta": 0},
        ],
    },
    {
        "menu_id": "b-classic-wrap",
        "company_id": "company-b",
        "name": "B 클래식 랩",
        "category": "wrap",
        "description": "B기업 Horizontal UI의 기본 랩 메뉴",
        "price": 6800,
        "image_key": "b-classic-wrap",
        "is_available": True,
        "options": [
            {"option_id": "b-extra-egg", "name": "계란 추가", "price_delta": 700},
            {"option_id": "b-remove-tomato", "name": "토마토 제외", "price_delta": 0},
        ],
    },
    {
        "menu_id": "b-chicken-salad",
        "company_id": "company-b",
        "name": "B 치킨 샐러드",
        "category": "salad",
        "description": "담백한 닭가슴살과 채소를 담은 B기업 메뉴",
        "price": 8200,
        "image_key": "b-chicken-salad",
        "is_available": True,
        "options": [
            {"option_id": "b-avocado", "name": "아보카도 추가", "price_delta": 1200},
            {"option_id": "b-dressing-side", "name": "드레싱 따로", "price_delta": 0},
        ],
    },
    {
        "menu_id": "b-potato-set",
        "company_id": "company-b",
        "name": "B 포테이토 세트",
        "category": "side",
        "description": "감자튀김과 음료를 함께 제공하는 B기업 세트",
        "price": 5400,
        "image_key": "b-potato-set",
        "is_available": True,
        "options": [
            {"option_id": "b-large-drink", "name": "음료 라지 변경", "price_delta": 500},
            {"option_id": "b-salt-less", "name": "소금 적게", "price_delta": 0},
        ],
    },
]
