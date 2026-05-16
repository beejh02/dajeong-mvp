# Architecture

## 서비스 경계

```text
frontend/kiosk
  -> A기업 실제 주문 UI
  -> B/C기업 Mock 키오스크 UI

frontend/admin
  -> 주문 목록/상세
  -> 주문 상태 변경
  -> MCP 호출 로그 확인

backend/app
  -> 인증과 사용자 세션
  -> 메뉴, 주문, 결제 Mock, 포인트
  -> Dajeong Chat orchestration
  -> MCP Client service
  -> 향후 PaymentProvider 경계에서 Dummy/Toss test adapter 분리 후보

mcp-server/app
  -> Burger MCP tool adapter
  -> 향후 Toss/Korail adapter 확장 후보

ai-agent/app
  -> Streamlit 또는 demo agent UI

shared/dummy-data
  -> 사용자, 메뉴, 선호/비선호, 최근 주문 seed
```

## 주문 데이터 흐름

```text
Dajeong Chat
-> backend/app intent analyzer
-> backend/app order candidate service
-> backend/app MCP client
-> mcp-server/app Burger tool
-> backend/app A기업 주문 service 또는 local adapter
-> SQLite order/payment/mcp log 저장
-> frontend/admin에서 검증
```

## 설계 원칙

- Backend가 기업 DB를 직접 수정하는 것처럼 보이지 않게 MCP service 경계를 유지합니다.
- 실제 MCP SDK 적용이 늦어져도 `mcp-server/app`과 `backend/app/services/mcp_client` 경계는 유지합니다.
- MVP 기본 intent 처리는 규칙 기반 또는 mock LLM으로 안정성을 확보합니다.
- 실제 LLM은 `LLMProvider` 인터페이스 뒤에 둡니다.
- 주문 금액은 client payload를 신뢰하지 않고 backend에서 seed/menu 기준으로 재계산합니다.
- 결제는 Mock 또는 테스트 결제만 다루고 실결제 정보는 저장하지 않습니다.
- Toss 테스트 결제를 붙일 경우 secret key와 결제 confirm은 backend에만 두고 frontend는 client key와 redirect 처리만 담당합니다.

## 주요 상태

주문 상태:

```text
pending_payment
accepted
cooking
completed
canceled
```

결제 상태:

```text
ready
paid
failed
canceled
```

MCP 호출 상태:

```text
success
failed
manual_review
```
