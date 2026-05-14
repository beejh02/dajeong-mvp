# Phase 계획

## Phase 0. 문서와 범위 고정

작업:

- `README.md` 정리
- `todo.md` 작성
- `docs/mvp_process.md` 작성
- MVP 필수, 선택, 제외 범위 구분
- 발표 시연 흐름 고정

완료 기준:

- Codex가 다음 Phase를 실행할 수 있는 문서가 존재합니다.
- 구현하지 않을 기능이 명확합니다.
- Phase별 완료 기준이 문서화되어 있습니다.

## Phase 1. 프로젝트 골격과 더미 데이터

작업:

- `frontend/kiosk` Vite React 앱 생성
- `frontend/admin` Vite React 앱 생성
- `backend/app` FastAPI 앱 생성
- `mcp-server/app` FastAPI 또는 local adapter 앱 생성
- `ai-agent/app` Streamlit placeholder 생성
- `shared/dummy-data`에 users, menus, preferences, order history 작성

완료 기준:

- 각 앱이 최소 실행 또는 health check를 통과합니다.
- 더미 데이터가 JSON parse 검증을 통과합니다.
- 비즈니스 로직은 아직 넣지 않습니다.

## Phase 2. Backend 인증, 사용자, 메뉴 기반

작업:

- SQLite 연결
- users, profiles, preferences, menus seed
- 로그인, 회원가입, 내 정보 조회
- 메뉴 목록과 메뉴 상세 조회

주요 API:

```text
POST /auth/login
POST /auth/register
GET /auth/me
GET /menu
GET /menu/{menu_item_id}
```

완료 기준:

- `user1/user1234`, `admin/dajeong` 로그인이 됩니다.
- 메뉴 조회 API가 seed 데이터를 반환합니다.
- 비밀번호는 해시 저장합니다.

## Phase 3. A기업 주문, 결제 Mock, 관리자 조회 API

작업:

- 주문 생성
- 서버 기준 금액 재계산
- Mock 결제 승인
- 포인트 적립 기록
- 영수증 또는 주문 완료 응답
- 관리자 주문 목록/상세 API

주요 API:

```text
POST /orders
POST /payments/dummy/approve
GET /points/me
GET /orders/{order_id}/receipt
GET /admin/orders
GET /admin/orders/{order_id}
PATCH /admin/orders/{order_id}/status
```

완료 기준:

- A기업 주문이 DB에 저장됩니다.
- 결제 상태와 주문 상태가 분리됩니다.
- 관리자 API에서 주문을 확인할 수 있습니다.

## Phase 4. Burger MCP Adapter/Server와 호출 로그

작업:

- Burger MCP Tool 경계 정의
- Backend MCP Client service 작성
- MCP 요청/응답 로그 저장
- 관리자 MCP 로그 API 작성

Tool 후보:

```text
get_menus
get_menu_detail
get_recent_orders
create_order_draft
place_order
request_payment
```

완료 기준:

- 다정 Backend는 MCP service를 통해 주문 생성을 요청합니다.
- MCP 호출 로그가 DB에 저장됩니다.
- 관리자 API에서 MCP 로그를 확인할 수 있습니다.

## Phase 5. Dajeong Text Chat 주문 후보와 승인

작업:

- 자연어 입력 API
- 규칙 기반 Intent Analyzer
- 최근 주문과 선호/비선호 재료 반영
- 주문 후보 생성
- 사용자 승인 후 주문 확정

주요 API:

```text
POST /dajeong/chat
POST /dajeong/final-approval
```

완료 기준:

- `늘 먹던 햄버거 하나 주문해줘. 오이는 빼줘.` 입력을 처리합니다.
- 주문 후보를 사용자에게 보여줄 수 있습니다.
- 승인 후 A기업 주문 생성 흐름으로 이어집니다.

## Phase 6. A/B/C 키오스크와 관리자 화면

작업:

- A기업 실제 주문 키오스크
- B기업 vertical mock kiosk
- C기업 popup 또는 horizontal mock kiosk
- Dajeong Chat 화면
- 관리자 주문/로그 화면

완료 기준:

- A기업 화면에서 실제 주문이 생성됩니다.
- B/C기업 화면은 UI 차이를 분명하게 보여줍니다.
- 관리자 화면에서 주문과 MCP 로그를 확인합니다.

## Phase 7 이후. 확장

작업 후보:

- Toss 테스트 결제
- Korail 시간표 조회
- 실제 LLM Provider
- Voice 선택 UI

완료 기준:

- 핵심 햄버거 주문 demo를 깨지 않고 독립적으로 추가됩니다.
