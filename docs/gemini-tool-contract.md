# Gemini Tool Contract

## 1. 목적 아키텍처

이 문서는 Gemini Flash function calling에서 Dajeong MCP Server를 호출하기 위한 gateway 계약을 정의한다. Gemini function calling은 실제 외부 데이터 조회나 외부 서비스 호출을 직접 구현하는 계층이 아니라, Next.js `/api/chat`의 MCP Client Adapter로 요청을 전달하는 gateway 역할을 한다.

목표 아키텍처는 다음과 같다.

```text
User
  -> Dajeong Frontend
  -> Next.js /api/chat
  -> Gemini Flash
  -> Gemini Function Calling
  -> MCP Client Adapter
  -> Dajeong MCP Server
  -> Dajeong Backend API
  -> Dajeong Card UI
```

핵심 원칙은 다음과 같다.

- Backend API는 기업, 메뉴, 주문 데이터의 source of truth다.
- Gemini는 backend API를 직접 호출하지 않는다.
- Gemini는 외부 데이터를 직접 조회하거나 처리하지 않는다.
- 외부 데이터 조회와 외부 서비스 호출은 Dajeong MCP Server가 담당한다.
- Next.js `/api/chat`은 Gemini와 MCP Server 사이의 orchestration layer다.
- MCP Client Adapter는 Gemini function call을 MCP tool call로 변환한다.
- 실제 tool 구현은 Dajeong MCP Server에 둔다.
- 현재 frontend local `toolHandlers`는 임시 구현 또는 MCP Server로 이전할 후보 코드로 간주한다.
- Frontend는 Gemini function이나 MCP tool을 직접 호출하지 않고 `/api/chat`을 통해 `ChatResponse`를 받는다.

## 2. Gemini Gateway Functions

Gemini에 직접 노출되는 function은 최소화한다. Gemini function calling은 MCP Server tool을 직접 구현하는 계층이 아니라, MCP Client Adapter로 요청을 전달하는 gateway다.

### call_dajeong_mcp_tool

`call_dajeong_mcp_tool`은 Gemini가 필요한 외부 기능을 요청하면 Next.js `/api/chat`의 MCP Client Adapter가 해당 요청을 Dajeong MCP Server tool call로 변환하기 위한 gateway function이다.

Input 예시:

```json
{
  "toolName": "search_menu",
  "arguments": {
    "companyId": "company-a",
    "query": "불고기"
  }
}
```

Output은 MCP Server tool result를 그대로 반환할 수 있다. 또는 `/api/chat` orchestration layer에서 MCP Server tool result를 `ChatResponse` 카드 구조로 변환할 수 있다.

MVP 편의상 `get_companies` 같은 read-only function을 Gemini gateway function으로 노출할 수는 있다. 다만 원칙적으로 외부 데이터 접근은 MCP Server를 통해 처리한다.

## 3. Dajeong MCP Server Tools

실제 외부 데이터와 외부 서비스 접근은 Dajeong MCP Server tool이 담당한다.

| Tool | 목적 | Risk | 사용자 확인 필요 여부 | Backend endpoint |
| --- | --- | --- | --- | --- |
| get_companies | 연결 가능한 데모 기업 목록 조회 | low | 필요 없음 | `GET /companies` |
| get_company_menus | 특정 기업의 메뉴 목록 조회 | low | 필요 없음 | `GET /companies/{companyId}/menus` |
| search_menu | 특정 기업 메뉴에서 자연어 keyword로 메뉴 후보 검색 | low | 필요 없음 | `GET /companies/{companyId}/menus` 호출 후 MCP Server 내부 filtering |
| create_order_draft | 실제 주문을 생성하지 않고 사용자 확인용 주문 초안 생성 | medium | 초안 확인 필요 | `POST /orders` 호출 금지 |
| confirm_order | 사용자가 UI에서 확인한 주문 초안을 실제 주문으로 생성 | high | 반드시 필요 | `POST /orders` |

## 4. MCP Server Tool 상세 계약

### get_companies

- 목적: 연결 가능한 데모 기업 목록 조회
- Risk: low
- 사용자 확인: 필요 없음
- 담당 계층: Dajeong MCP Server
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
- 담당 계층: Dajeong MCP Server
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
- 담당 계층: Dajeong MCP Server
- Backend endpoint: `GET /companies/{companyId}/menus` 호출 후 MCP Server 내부에서 filtering
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
- 담당 계층: Dajeong MCP Server
- Backend endpoint: `POST /orders` 호출 금지
- 설명:
  - 이 tool은 실제 주문을 생성하지 않는다.
  - MCP Server가 메뉴 조회와 옵션 검증만 수행한다.
  - 사용자가 확인하기 전까지 주문은 생성되지 않는다.
  - 결과는 `order_draft` 카드로 렌더링될 수 있어야 한다.

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
              "name": "일반 번",
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
- 담당 계층: Dajeong MCP Server
- Backend endpoint: `POST /orders`
- 중요 제약:
  - Gemini가 `confirm_order`를 임의로 실행하면 안 된다.
  - `confirm_order`는 `order_draft` 카드의 `confirm` action 이후에만 실행된다.
  - `confirmedByUser=true`는 Gemini가 직접 만들면 안 된다.
  - `confirmedByUser=true`는 Dajeong UI가 `confirm` action을 받은 뒤 서버가 부여해야 한다.
  - MCP Server도 `confirmedByUser`를 다시 검증해야 한다.
  - Backend API도 최종 주문 검증을 수행해야 한다.
  - `sourceChannel`은 `dajeong_ai`로 고정한다.

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

## 5. Tool Safety Policy

| Tool | Risk | Gemini direct execution | MCP Server responsibility | Dajeong UI confirmation |
| --- | --- | --- | --- | --- |
| get_companies | low | through gateway only | query backend companies | no |
| get_company_menus | low | through gateway only | query backend menus | no |
| search_menu | low | through gateway only | filter backend menus | no |
| create_order_draft | medium | through gateway only | validate draft, no `POST /orders` | yes, to continue |
| confirm_order | high | not directly by Gemini | validate `confirmedByUser` and call `POST /orders` | yes, required |

`confirm_order`는 Gemini가 직접 실행하는 일반 tool로 취급하지 않는다. 사용자 UI confirm 이후 서버/MCP 계층에서만 허용한다. MCP Server와 Backend API가 모두 안전 검증을 수행해야 한다.

## 6. Gemini Function Calling Pseudo-code

아래 pseudo-code는 문서용 예시이며 실제 실행 코드가 아니다. MCP-first 방향에서는 Gemini에 개별 backend tool 5개를 직접 노출하기보다 MCP gateway function을 노출한다.

```ts
const response = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  contents: userMessage,
  config: {
    tools: [
      {
        functionDeclarations: [
          callDajeongMcpToolDeclaration
        ]
      }
    ]
  }
});
```

`call_dajeong_mcp_tool` 개념:

- `toolName`: MCP Server tool name
- `arguments`: MCP Server tool arguments

`confirm_order`는 이 gateway를 통해 Gemini가 임의로 호출하지 못하도록 별도 안전 정책을 둔다. Dajeong UI의 `order_draft` confirm action 이후 `/api/chat` 또는 MCP Client Adapter가 서버/MCP 계층에 확인 사실을 전달해야 하며, MCP Server는 이를 다시 검증해야 한다.

## 7. 다음 구현 단계

1. `apps/mcp-server` scaffold 생성
2. MCP server `backendClient` 작성
3. MCP server tool schemas 작성
4. MCP server tools 구현
5. 기존 frontend local `toolHandlers` 로직을 MCP server tools로 이전 또는 참조
6. Gemini function declaration을 MCP gateway 중심으로 축소
7. MCP Client Adapter 작성
8. `/api/chat`에서 Gemini function call을 MCP Client Adapter로 연결
9. Card UI 렌더링 구현
10. `confirm_order`는 UI confirm 이후에만 MCP Server로 요청

## Current implementation status

- Gemini gateway function `call_dajeong_mcp_tool` is implemented.
- MCP Client Adapter exists at `apps/frontend/src/lib/gemini/mcpClientAdapter.ts`.
- MCP Client Adapter currently uses local fallback toolHandlers instead of a real MCP server.
- `trustedConfirmDajeongOrder` is implemented for the UI confirm path only.
- `/api/chat/confirm-order` exists and adds `confirmedByUser=true` server-side.
- confirm_order is blocked through the Gemini gateway and allowed only through the trusted UI confirmation route.
- Real apps/mcp-server is still pending.

현재 레포지토리에는 Gemini local `toolHandlers`와 `chatRunner`가 존재할 수 있다. 이는 초기 prototype 또는 MCP Server tool 구현으로 이전할 후보 코드다. 최종 목표는 외부 데이터와 외부 서비스 접근을 Dajeong MCP Server로 이동하는 것이다.
