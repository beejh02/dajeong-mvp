# MCP Tool Plan

이 문서는 다정 MVP의 향후 MCP Server tool 설계 초안이다. 현재 작업 범위에서는 MCP를 실제 구현하지 않고, Kiosk A/B, Admin Page, 향후 AI 응답 계층이 같은 Backend API 계약을 사용하도록 준비한다.

## 현재 통합 원칙

- Backend API가 기업, 메뉴, 주문, 관리자 요약 데이터의 source of truth이다.
- Frontend는 `apps/frontend/src/lib/api/`의 작은 API client로 FastAPI를 호출한다.
- Frontend 화면은 backend 응답을 직접 소비하지 않고 `apps/frontend/src/lib/adapters/`에서 기존 UI view model로 변환한다.
- 향후 MCP tool도 frontend와 같은 backend endpoint를 호출해야 하며, frontend UI 컴포넌트에 직접 연결하지 않는다.

## Planned Tools

### get_companies

- Purpose: 다정에 연결된 데모 기업 목록을 조회한다.
- Input schema:

```json
{}
```

- Backend API endpoint: `GET /companies`
- Output shape:

```json
{
  "companies": [
    {
      "id": "company-a",
      "name": "A기업",
      "displayName": "A기업 Vertical Kiosk",
      "uiType": "vertical",
      "description": "Vertical UI 키오스크 데모 기업"
    }
  ]
}
```

- Example use case: 사용자가 "어떤 매장에서 주문할 수 있어?"라고 묻는 경우 연결 가능한 기업을 안내한다.

### get_company_menus

- Purpose: 특정 기업의 판매 가능 메뉴 후보를 조회한다.
- Input schema:

```json
{
  "companyId": "company-a"
}
```

- Backend API endpoint: `GET /companies/{companyId}/menus`
- Output shape:

```json
{
  "company": { "id": "company-a", "name": "A기업" },
  "menus": [
    {
      "id": "menu-a-001",
      "companyId": "company-a",
      "name": "A 클래식 버거",
      "category": "burger",
      "price": 7200,
      "description": "A기업 Vertical UI의 기본 버거 메뉴",
      "imageUrl": "/images/company-a/classic-burger.png",
      "isAvailable": true,
      "options": []
    }
  ]
}
```

- Example use case: 사용자가 "A기업에서 버거 메뉴 보여줘"라고 요청할 때 메뉴 카드 후보를 만든다.

### search_menu

- Purpose: 기업 메뉴에서 이름, 카테고리, 설명 기준으로 메뉴를 검색한다.
- Input schema:

```json
{
  "companyId": "company-a",
  "query": "버거"
}
```

- Backend API endpoint: `GET /companies/{companyId}/menus` 호출 후 MCP tool 내부에서 MVP 수준 필터링
- Output shape:

```json
{
  "menus": [
    {
      "id": "menu-a-001",
      "name": "A 클래식 버거",
      "category": "burger",
      "price": 7200
    }
  ]
}
```

- Example use case: 사용자가 "새우 들어간 메뉴 있어?"라고 묻는 경우 관련 메뉴를 찾아준다.

### recommend_menu

- Purpose: 사용자의 자연어 선호를 바탕으로 주문 후보 메뉴를 추천한다.
- Input schema:

```json
{
  "companyId": "company-a",
  "preference": "맵지 않고 기본적인 버거"
}
```

- Backend API endpoint: `GET /companies/{companyId}/menus` 호출 후 AI 또는 rule 기반 추천
- Output shape:

```json
{
  "recommendations": [
    {
      "menuId": "menu-a-001",
      "name": "A 클래식 버거",
      "reason": "기본 버거 메뉴이며 맵지 않은 선택지입니다."
    }
  ]
}
```

- Example use case: 사용자가 "제일 무난한 걸로 추천해줘"라고 말하면 메뉴 추천 카드로 응답한다.

### create_order

- Purpose: 선택된 메뉴와 수량으로 backend 주문을 생성한다.
- Input schema:

```json
{
  "companyId": "company-a",
  "userId": "user-demo-1",
  "items": [
    {
      "menuId": "menu-a-001",
      "quantity": 1,
      "selectedOptionIds": []
    }
  ]
}
```

- Backend API endpoint: `POST /orders`
- Output shape:

```json
{
  "id": "order-0001",
  "orderNumber": "ORD-20260603-0001",
  "waitingNumber": 101,
  "status": "waiting",
  "totalPrice": 7200,
  "pointEarned": 72,
  "items": []
}
```

- Example use case: 사용자가 "그걸로 하나 주문해줘"라고 확정하면 주문 접수 카드로 응답한다.

### get_user_points

- Purpose: 사용자의 데모 포인트 잔액과 적립 가능 정보를 조회한다.
- Input schema:

```json
{
  "userId": "user-demo-1"
}
```

- Backend API endpoint: 향후 `GET /users/{userId}/points` 추가 예정
- Output shape:

```json
{
  "userId": "user-demo-1",
  "pointBalance": 12500
}
```

- Example use case: 사용자가 "포인트 얼마나 있어?"라고 묻는 경우 잔액 카드로 응답한다.

### get_recent_order

- Purpose: 사용자의 최근 주문 또는 현재 대기 주문을 조회한다.
- Input schema:

```json
{
  "userId": "user-demo-1"
}
```

- Backend API endpoint: MVP 현재는 `GET /admin/orders`에서 필터링, 향후 `GET /users/{userId}/orders/recent` 추가 예정
- Output shape:

```json
{
  "order": {
    "orderNumber": "ORD-20260603-0001",
    "waitingNumber": 101,
    "status": "waiting",
    "totalPrice": 7200
  }
}
```

- Example use case: 사용자가 "내 주문 대기번호 뭐야?"라고 묻는 경우 최근 주문 상태를 알려준다.

### get_admin_summary

- Purpose: 관리자 또는 운영자에게 현재 주문/매출 요약을 제공한다.
- Input schema:

```json
{}
```

- Backend API endpoint: `GET /admin/summary`
- Output shape:

```json
{
  "totalOrders": 2,
  "totalSales": 19600,
  "waitingOrders": 2,
  "companyCount": 2,
  "menuCount": 6
}
```

- Example use case: 관리자가 "오늘 주문 현황 요약해줘"라고 요청하면 운영 요약 카드로 응답한다.

## Not Implemented Yet

- 실제 MCP server runtime
- 실제 Gemini 또는 Vercel AI SDK 연결
- 실제 사용자 인증, 결제, 포인트 API
- 실제 기업 외부 API 연동
