# Dajeong MVP TODO

## Phase 0. 문서와 범위 고정

- [x] `README.md`에 MVP 정의와 우선순위 작성
- [x] `docs/mvp_process.md`에 실행 흐름 정리
- [x] `docs/00_Project_Summary.md` 작성
- [x] `docs/01_MVP_Scope.md` 작성
- [x] `docs/02_Phase_Plan.md` 작성
- [x] `docs/03_Demo_Flow.md` 작성
- [x] `docs/04_Architecture.md` 작성
- [x] `docs/05_API_Draft.md` 작성
- [x] `docs/06_Codex_Work_Rules.md` 작성

## Phase 1. 프로젝트 골격과 더미 데이터

- [x] `frontend/kiosk` Vite React 앱 생성
- [x] `frontend/admin` Vite React 앱 생성
- [x] `backend/app` FastAPI 앱 생성
- [x] `mcp-server/app` FastAPI 또는 local adapter 앱 생성
- [x] `ai-agent/app` Streamlit placeholder 생성
- [x] `shared/dummy-data` seed JSON 작성
- [x] 최소 실행/health check 검증

## Phase 2. Backend 인증, 사용자, 메뉴 기반

- [x] SQLite 연결
- [x] 사용자, 프로필, 선호/비선호, 메뉴 seed
- [x] `POST /auth/register`
- [x] `POST /auth/login`
- [x] `GET /auth/me`
- [x] `GET /menu`
- [x] `GET /menu/{menu_item_id}`

## Phase 3. A기업 주문, 결제 Mock, 관리자 조회 API

- [x] 주문 생성 API
- [x] 서버 기준 금액 재계산
- [x] Mock 결제 승인
- [x] 포인트 적립 기록
- [x] 주문 영수증 조회
- [x] 관리자 주문 목록/상세 API
- [x] 관리자 주문 상태 변경 API

## Phase 4. Burger MCP Adapter/Server와 호출 로그

- [x] Burger MCP Tool 경계 정의
- [x] Backend MCP Client service 작성
- [x] MCP 요청/응답 로그 저장
- [x] 관리자 MCP 로그 목록/상세 API

## Phase 5. Dajeong Text Chat 주문 후보와 승인

- [x] 자연어 입력 API
- [x] 규칙 기반 Intent Analyzer
- [x] 최근 주문 조회 반영
- [x] 선호/비선호 재료 반영
- [x] 주문 후보 생성
- [x] 사용자 최종 승인
- [x] 승인 후 A기업 주문 생성 흐름 연결

## Phase 6. A/B/C 키오스크와 관리자 화면

- [ ] A기업 실제 주문 키오스크
- [ ] B기업 vertical mock kiosk
- [ ] C기업 popup 또는 horizontal mock kiosk
- [ ] Dajeong Chat 화면
- [ ] 관리자 주문 목록/상세 화면
- [ ] 관리자 MCP 로그 화면

## Phase 7 이후. 확장

- [ ] Toss 테스트 결제 adapter 검토
- [ ] Korail 시간표 조회 adapter 검토
- [ ] 실제 LLM Provider 검토
- [ ] Voice 선택 UI 검토
