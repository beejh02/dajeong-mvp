# TODO

## MCP-first fallback status

- [x] Gemini gateway refactor
- [x] /api/chat runner connection
- [x] ChatResponse card building
- [x] ChatPage /api/chat migration
- [x] order_draft confirmationPayload
- [x] trusted confirm-order route
- [x] real apps/mcp-server scaffold
- [ ] moving local toolHandlers into MCP server tools
- [ ] frontend adapter switch from local fallback to actual MCP server
- [ ] stronger persistence/idempotency for draft confirmation
- [ ] production auth/session handling

## Phase 0. 문서 정리

- [ ] README.md 작성
- [ ] project-spec.md 작성
- [ ] docs/00-project-intent.md 작성
- [ ] docs/01-mvp-scope.md 작성
- [ ] docs/02-user-scenario.md 작성
- [ ] docs/03-kiosk-demo.md 작성
- [ ] docs/04-ai-chat-card-ui.md 작성
- [ ] docs/05-data-flow.md 작성
- [ ] docs/06-phase-plan.md 작성

## Phase 1. 기준 데이터 설계

- [ ] 기업 데이터 정의
- [ ] 메뉴 데이터 정의
- [ ] 사용자 더미 데이터 정의
- [ ] 주문 데이터 정의
- [ ] 관리자 페이지에서 필요한 데이터 정의

## Phase 2. Backend 기본 API

- [ ] 메뉴 조회 API
- [ ] 주문 생성 API
- [ ] 주문 목록 조회 API
- [ ] 관리자 주문 조회 API

## Phase 3. Frontend 화면

- [ ] A기업 Vertical Kiosk
- [ ] B기업 Horizontal Kiosk
- [ ] Admin Page
- [ ] Dajeong Chat UI
- [ ] Card UI Components

## Phase 4. AI / MCP 연결

- [ ] Gemini Flash 연결
- [ ] Vercel AI SDK 연결
- [ ] MCP Server 기본 tool 작성
- [ ] AI 응답을 카드 데이터로 변환
