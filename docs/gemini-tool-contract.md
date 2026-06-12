# Gemini Tool Contract

## 1. 목표 아키텍처

현재 MVP는 remote MCP server를 바로 구현하지 않고, Gemini Flash function calling을 통해 Next.js 서버의 local tool handler가 Dajeong Backend API를 호출하는 구조로 간다.

```text
User
  -> Dajeong Frontend
  -> Next.js /api/chat
  -> Gemini Flash
  -> Gemini Function Calling
  -> Local Tool Handlers
  -> Dajeong Backend API
```

핵심 원칙은 다음과 같다.

- Backend API는 source of truth다.
- Gemini는 backend API를 직접 호출하지 않는다.
- Next.js 서버의 local tool handler가 backend API를 호출한다.
- Frontend는 Gemini function을 직접 호출하지 않는다.
- Frontend는 `/api/chat`을 통해 AI 응답을 받는다.
- 실제 MCP server는 이번 MVP 범위에서 제외한다.
- tool 계약은 향후 MCP server로 이전하기 쉽도록 설계한다.

## 2. MVP Tool 목록

| Tool | 목적 | Risk | 사용자 확인 필요 여부 | Backend endpoint |
| --- | --- | --- | --- | --- |
| get_companies | 연결 가능한 데모 기업 목록 조회 | low | 필요 없음 | `GET /companies` |
| get_company_menus | 특정 기업의 메뉴 목록 조회 | low | 필요 없음 | `GET /companies/{companyId}/menus` |
| search_menu | 특정 기업 메뉴에서 자연어 keyword로 메뉴 후보 검색 | low | 필요 없음 | `GET /companies/{companyId}/menus` 호출 후 local tool handler 내부에서 filtering |
| create_order_draft | 실제 주문을 생성하지 않고 사용자 확인용 주문 초안 생성 | medium | 초안 확인 필요 | `POST /orders` 호출 금지 |
| confirm_order | 사용자가 UI에서 확인한 주문 초안을 실제 주문으로 생성 | high | 반드시 필요 | `POST /orders` |

## 3. Tool 상세 계약

### get_companies

- 목적: 연결 가능한 데모 기업 목록 조회
- Risk: low
- 사용자 확인: 필요 없음
- Backend endpoint: `GET /companies`
- Input schema:

```json
{}
```

- Output schema 예시:

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

- 목적: 특정 기업의 메뉴 목록 조회
- Risk: low
- 사용자 확인: 필요 없음
- Backend endpoint: `GET /companies/{companyId}/menus`
- Input schema:

```json
{
  "companyId": "company-a"
}
```

- Output schema 예시:

메뉴 배열에는 다음 필드가 포함된다.

```json
{
  "company": {
    "id": "company-a",
    "name": "A기업",
    "displayName": "A기업 Vertical Kiosk",
    "uiType": "vertical",
    "description": "Vertical UI 키오스크 데모 기업"
  },
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
      "optionGroups": []
    }
  ]
}
```

### search_menu

- 목적: 특정 기업 메뉴에서 자연어 keyword로 메뉴 후보 검색
- Risk: low
- 사용자 확인: 필요 없음
- Backend endpoint: `GET /companies/{companyId}/menus` 호출 후 local tool handler 내부에서 filtering
- Input schema:

```json
{
  "companyId": "company-a",
  "query": "불고기"
}
```

- Output schema 예시:

```json
{
  "menus": [
    {
      "id": "menu-a-002",
      "companyId": "company-a",
      "name": "A 불고기 버거",
      "category": "burger",
      "price": 7600,
      "description": "달콤한 불고기 소스를 더한 A기업 메뉴",
      "isAvailable": true
    }
  ]
}
```

### create_order_draft

- 목적: 실제 주문을 생성하지 않고 사용자 확인용 주문 초안을 만든다.
- Risk: medium
- 사용자 확인: 초안 확인 필요
- Backend endpoint: `POST /orders` 호출 금지
- 설명:
  - 이 tool은 실제 주문을 생성하지 않는다.
  - 메뉴 조회와 옵션 검증만 수행한다.
  - 사용자가 확인하기 전까지 주문은 생성되지 않는다.
  - 결과는 order_draft 카드로 렌더링될 수 있어야 한다.

- Input schema:

```json
{
  "companyId": "company-a",
  "userId": "user-demo-1",
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

- Output schema 예시:

```json
{
  "draftId": "draft-demo-id",
  "companyId": "company-a",
  "companyName": "A기업",
  "items": [
    {
      "menuId": "menu-a-001",
      "menuName": "A 클래식 버거",
      "quantity": 1,
      "selectedOptions": [
        {
          "groupId": "bun",
          "groupTitle": "번 선택",
          "choices": [
            {
              "id": "bun-normal",
              "name": "일반",
              "priceDelta": 0
            }
          ]
        }
      ],
      "unitPrice": 7200,
      "itemPrice": 7200
    }
  ],
  "totalPrice": 7200,
  "warnings": [],
  "requiredUserAction": true,
  "recommendedCardType": "order_draft"
}
```

### confirm_order

- 목적: 사용자가 UI에서 확인한 주문 초안을 실제 주문으로 생성한다.
- Risk: high
- 사용자 확인: 반드시 필요
- Backend endpoint: `POST /orders`
- 중요 제약:
  - Gemini가 사용자 확인 없이 이 tool을 호출해서는 안 된다.
  - Dajeong UI의 [확인] 버튼 이후에만 실행되어야 한다.
  - `confirmedByUser`가 `true`가 아니면 local handler가 거부해야 한다.
  - `sourceChannel`은 `dajeong_ai`를 사용한다.

- Input schema:

```json
{
  "draftId": "draft-demo-id",
  "confirmedByUser": true,
  "order": {
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
}
```

- Output schema 예시:

```json
{
  "orderNumber": "ORD-20260613-0001",
  "waitingNumber": 101,
  "status": "waiting",
  "totalPrice": 7200,
  "recommendedCardType": "order_confirmed"
}
```

## 4. Tool Safety Policy

| Tool | Risk | Can Gemini call automatically? | Dajeong UI confirmation |
| --- | --- | --- | --- |
| get_companies | low | yes | no |
| get_company_menus | low | yes | no |
| search_menu | low | yes | no |
| create_order_draft | medium | yes | yes, to continue |
| confirm_order | high | no, only after `confirmedByUser=true` | yes, required |

## 5. Gemini Function Calling Pseudo-code

아래는 문서용 pseudo-code이며 실제 실행 코드가 아니다.

```ts
const response = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  contents: userMessage,
  config: {
    tools: [
      {
        functionDeclarations: [
          getCompaniesDeclaration,
          getCompanyMenusDeclaration,
          searchMenuDeclaration,
          createOrderDraftDeclaration,
          confirmOrderDeclaration
        ]
      }
    ]
  }
});
```

## 6. 다음 구현 단계

1. `apps/frontend/src/app/api/chat/route.ts` 생성
2. `apps/frontend/src/lib/gemini/client.ts` 생성
3. `apps/frontend/src/lib/gemini/tools.ts` 생성
4. `apps/frontend/src/lib/gemini/toolHandlers.ts` 생성
5. `apps/frontend/src/lib/gemini/cardSchema.ts` 생성
6. local tool handlers가 Dajeong Backend API를 호출하도록 구현
7. Gemini function call loop 구현
8. ChatPage를 card response 렌더링 중심으로 수정
9. confirm_order는 UI 확인 이후에만 호출되도록 구현
10. 기존 `/api/order-intent`는 legacy fallback으로 유지하거나 제거 검토
