# MCP Tool Plan

이 문서는 다정 MVP의 향후 MCP Server tool 설계 초안이다. 현재 작업 범위에서는 MCP runtime을 구현하지 않고, Kiosk A/B, Admin Page, 향후 AI 응답 계층이 같은 Backend API 계약을 사용하도록 준비한다.

## 현재 통합 원칙

- Backend API가 기업, 메뉴, 주문, 관리자 요약 데이터의 source of truth다.
- Frontend는 `apps/frontend/src/lib/api/`의 공통 API client로 FastAPI를 호출한다.
- Frontend 화면은 backend 응답을 직접 소비하지 않고 `apps/frontend/src/lib/adapters/`에서 현재 UI view model로 변환한다.
- 향후 MCP tool도 frontend와 같은 backend endpoint를 호출해야 하며, frontend UI 컴포넌트에 직접 연결하지 않는다.
- 주문의 `companyId`는 실제 주문 대상 기업이며, `sourceChannel`은 주문 유입 채널이다. Dajeong AI 주문은 `companyId`를 실제 기업 id로 유지하고 `sourceChannel`을 `dajeong_ai`로 보낸다.

## Current implementation status

- Gemini gateway function `call_dajeong_mcp_tool` is implemented.
- MCP Client Adapter exists at `apps/frontend/src/lib/gemini/mcpClientAdapter.ts`.
- MCP Client Adapter currently uses local fallback toolHandlers instead of a real MCP server.
- `trustedConfirmDajeongOrder` is implemented for the UI confirm path only.
- `/api/chat/confirm-order` exists and adds `confirmedByUser=true` server-side.
- confirm_order is blocked through the Gemini gateway and allowed only through the trusted UI confirmation route.
- Real apps/mcp-server is still pending.

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
      "optionGroups": [
        {
          "id": "bun",
          "title": "번 선택",
          "selectionMode": "single",
          "required": true,
          "minSelect": 1,
          "maxSelect": 1,
          "choices": [
            { "id": "bun-normal", "name": "일반", "priceDelta": 0 },
            { "id": "bun-toasted", "name": "번 굽기", "priceDelta": 500 }
          ]
        }
      ]
    }
  ]
}
```

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

### create_order

- Purpose: 선택된 메뉴와 수량, 옵션 그룹, checkout 정보로 backend 주문을 생성한다.
- Input schema:

```json
{
  "companyId": "company-a",
  "userId": "user-demo-1",
  "sourceChannel": "dajeong_ai",
  "items": [
    {
      "menuId": "menu-a-001",
      "quantity": 1,
      "selectedOptionGroups": [
        {
          "groupId": "bun",
          "choiceIds": ["bun-normal"]
        }
      ]
    }
  ],
  "fulfillmentType": "dine_in",
  "paymentMethod": "credit_card",
  "pointAccrual": {
    "enabled": false,
    "phone": null
  }
}
```

- Backend API endpoint: `POST /orders`
- Output shape:

```json
{
  "id": "order-0001",
  "orderNumber": "ORD-20260603-0001",
  "waitingNumber": 101,
  "companyId": "company-a",
  "sourceChannel": "dajeong_ai",
  "status": "waiting",
  "totalPrice": 7200,
  "pointEarned": 72,
  "fulfillmentType": "dine_in",
  "paymentMethod": "credit_card",
  "pointAccrual": {
    "enabled": false,
    "phone": null
  },
  "items": [
    {
      "menuId": "menu-a-001",
      "selectedOptionGroups": [
        {
          "groupId": "bun",
          "groupTitle": "번 선택",
          "choices": [{ "id": "bun-normal", "name": "일반", "priceDelta": 0 }]
        }
      ]
    }
  ]
}
```

### get_user_points

- Purpose: 사용자의 데모 포인트 잔액과 적립 가능 정보를 조회한다.
- Input schema:

```json
{
  "userId": "user-demo-1"
}
```

- Backend API endpoint: 향후 `GET /users/{userId}/points` 추가 예정

### get_recent_order

- Purpose: 사용자의 최근 주문 정보를 조회한다.
- Input schema:

```json
{
  "userId": "user-demo-1"
}
```

- Backend API endpoint: 향후 `GET /users/{userId}/orders/recent` 추가 예정

### get_admin_summary

- Purpose: 관리자 대시보드용 주문/매출 요약을 조회한다.
- Input schema:

```json
{}
```

- Backend API endpoint: `GET /admin/summary`
