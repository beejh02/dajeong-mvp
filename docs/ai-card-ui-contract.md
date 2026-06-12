# AI Card UI Contract

## 1. 목적

- AI 응답을 단순 텍스트가 아니라 구조화된 카드 UI로 제공한다.
- 사용자는 확인, 수정, 거절 버튼으로 결정을 내린다.
- Gemini는 주문을 바로 확정하지 않는다.
- 실제 주문 확정은 사용자가 `order_draft_card`에서 확인 버튼을 누른 이후에만 진행된다.
- 카드 UI는 접근성이 낮은 사용자도 결정을 쉽게 내리도록 핵심 정보와 선택지를 명확히 보여준다.

## 2. 공통 ChatResponse Schema

```json
{
  "message": "string",
  "cards": [],
  "requiredUserAction": true,
  "conversationId": "optional string"
}
```

각 필드 설명:

- `message`: 사용자에게 보여줄 짧은 자연어 안내문
- `cards`: 화면에 렌더링할 카드 목록
- `requiredUserAction`: 사용자의 선택 또는 확인이 필요한지 여부
- `conversationId`: 향후 대화 상태 저장을 위한 선택 필드

## 3. 카드 타입 목록

| Card Type | 목적 | 사용자 액션 필요 여부 |
| --- | --- | --- |
| `message_card` | 단순 안내 메시지를 카드로 보여준다. | 필요 없음 |
| `menu_candidates_card` | 메뉴 검색 결과가 여러 개일 때 후보를 보여준다. | 필요 |
| `missing_option_card` | 필수 옵션이 누락되었을 때 선택지를 보여준다. | 필요 |
| `order_draft_card` | 실제 주문 전 사용자 확인용 주문 초안을 보여준다. | 필요 |
| `order_confirmed_card` | 실제 주문 생성 이후 주문번호와 대기번호를 보여준다. | 필요 없음 |
| `error_card` | backend API 실패, Gemini 응답 실패, 주문 검증 실패 등을 보여준다. | 상황에 따라 필요 |

## 4. message_card

목적:

- 단순 안내 메시지를 카드로 보여준다.
- 사용자의 액션이 반드시 필요하지 않은 상황에 사용한다.

예시:

```json
{
  "type": "message_card",
  "title": "안내",
  "message": "A기업과 B기업 중 어디에서 주문할까요?"
}
```

## 5. menu_candidates_card

목적:

- 메뉴 검색 결과가 여러 개일 때 후보를 보여준다.
- 사용자는 후보 중 하나를 선택한다.

예시:

```json
{
  "type": "menu_candidates",
  "title": "메뉴 후보",
  "message": "주문할 메뉴를 하나 선택해 주세요.",
  "candidates": [
    {
      "menuId": "menu-a-001",
      "name": "A 클래식 버거",
      "price": 7200,
      "description": "A기업 Vertical UI의 기본 버거 메뉴"
    },
    {
      "menuId": "menu-a-002",
      "name": "A 불고기 버거",
      "price": 7600,
      "description": "달콤한 불고기 소스를 더한 A기업 메뉴"
    }
  ],
  "actions": [
    {
      "type": "select_menu",
      "label": "선택"
    }
  ]
}
```

## 6. missing_option_card

목적:

- 필수 옵션이 누락되었을 때 선택지를 보여준다.
- 사용자는 옵션 중 하나를 선택한다.

예시:

```json
{
  "type": "missing_option",
  "title": "옵션 선택 필요",
  "question": "번 선택이 필요합니다.",
  "groupId": "bun",
  "options": [
    {
      "label": "일반 번",
      "value": "bun-normal"
    },
    {
      "label": "번 굽기",
      "value": "bun-toasted"
    }
  ],
  "actions": [
    {
      "type": "select_option",
      "label": "선택"
    }
  ]
}
```

## 7. order_draft_card

목적:

- 실제 주문 전 사용자 확인용 주문 초안을 보여준다.
- 이 카드는 실제 주문이 아니다.
- 사용자가 확인 버튼을 누르기 전까지 `confirm_order`를 실행하면 안 된다.

예시:

```json
{
  "type": "order_draft",
  "title": "주문 초안",
  "draftId": "draft-demo-id",
  "companyName": "A기업",
  "items": [
    {
      "menuName": "A 클래식 버거",
      "quantity": 1,
      "options": ["일반 번", "제로콜라"],
      "price": 7200
    }
  ],
  "totalPrice": 7200,
  "actions": [
    {
      "type": "confirm",
      "label": "확인"
    },
    {
      "type": "edit",
      "label": "수정"
    },
    {
      "type": "reject",
      "label": "거절"
    }
  ]
}
```

## 8. order_confirmed_card

목적:

- 실제 주문 생성 이후 주문번호와 대기번호를 보여준다.

예시:

```json
{
  "type": "order_confirmed",
  "title": "주문 접수 완료",
  "orderNumber": "ORD-20260613-0001",
  "waitingNumber": 101,
  "status": "waiting",
  "totalPrice": 7200,
  "message": "주문이 접수되었습니다."
}
```

## 9. error_card

목적:

- backend API 실패, Gemini 응답 실패, 주문 검증 실패 등을 보여준다.

예시:

```json
{
  "type": "error",
  "title": "처리 실패",
  "message": "주문을 처리하지 못했습니다. 다시 시도해 주세요.",
  "recoverable": true,
  "actions": [
    {
      "type": "retry",
      "label": "다시 시도"
    }
  ]
}
```

## 10. UI Action Semantics

| Action | 의미 | 후속 처리 |
| --- | --- | --- |
| `confirm` | 사용자가 현재 주문 초안을 승인한다. | `order_draft_card`의 초안 데이터를 기반으로 `confirm_order` 요청을 보낸다. |
| `edit` | 사용자가 주문 내용을 수정한다. | 주문 초안을 수정 가능한 상태로 되돌리고 사용자의 추가 입력을 받는다. |
| `reject` | 사용자가 초안을 폐기한다. | 현재 초안과 관련 선택 상태를 폐기한다. |
| `select_option` | 사용자가 부족한 옵션을 선택한다. | 선택한 옵션을 현재 주문 의도 또는 초안 생성 상태에 반영한다. |
| `select_menu` | 사용자가 메뉴 후보 중 하나를 선택한다. | 선택한 메뉴를 현재 주문 의도 또는 초안 생성 상태에 반영한다. |
| `retry` | 실패한 요청을 다시 시도한다. | 실패했던 요청을 같은 대화 맥락에서 다시 실행한다. |

## 11. Safety Rules

- `order_draft_card`는 실제 주문이 아니다.
- `confirm_order`는 `order_draft_card`의 `confirm` 액션 이후에만 실행된다.
- Gemini가 텍스트 응답만으로 주문을 확정했다고 말하면 안 된다.
- 사용자의 확인 없이 결제, 주문 생성, 포인트 적립을 확정하면 안 된다.
- `error_card`는 사용자가 다음 행동을 이해할 수 있도록 복구 가능 여부를 표시해야 한다.

## 12. 다음 구현 단계

1. `apps/frontend/src/lib/gemini/cardSchema.ts` 생성
2. `ChatResponse` TypeScript type 정의
3. `DajeongCard` union type 정의
4. ChatPage에서 card 배열을 렌더링할 CardRenderer 컴포넌트 추가
5. `order_draft_card`의 confirm 버튼에서만 `confirm_order` 요청을 보내도록 연결
6. `missing_option_card`와 `menu_candidates_card`의 선택 액션을 ChatPage 상태에 반영
7. `error_card` 재시도 액션 처리
