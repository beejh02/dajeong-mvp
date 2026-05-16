# Dajeong MVP

다정(Dajeong)은 기업마다 다른 키오스크, 결제, 예약 화면을 사용자가 매번 새로 학습하지 않아도 자연어 대화로 필요한 작업을 진행하게 돕는 접근성 중심 AI 플랫폼 MVP입니다.

현재 저장소는 Phase 6 A/B/C 키오스크와 관리자 화면 구현 단계입니다. FastAPI backend에서 SQLite seed, 인증, A기업 메뉴 조회, 주문 생성, Mock 결제, 포인트, 영수증, 관리자 주문 API, Burger MCP tool 호출 로그, 규칙 기반 자연어 주문 후보/승인 API를 제공하고, React kiosk/admin 화면에서 주요 demo 흐름을 확인할 수 있습니다.

## MVP 핵심 흐름

```text
사용자 자연어 입력
-> Dajeong Text Chat
-> Intent 분석 및 주문 후보 생성
-> Burger MCP Adapter/Server 호출
-> A기업 주문 API 또는 DB에 주문 생성
-> 관리자 페이지에서 주문과 MCP 호출 로그 확인
```

MVP는 많은 기능보다 아래 세 가지를 안정적으로 보여주는 데 집중합니다.

- 기업별 키오스크 UI/UX 차이가 사용자에게 혼란을 만든다는 문제
- 다정이 하나의 대화형 UI로 기업별 차이를 흡수한다는 해결 방식
- 관리자 페이지와 MCP 로그로 실제 시스템 구조와 처리 결과를 확인할 수 있다는 점

## 현재 문서 구조

- `docs/mvp_process.md`: 전체 실행 흐름과 Phase 기준
- `docs/00_Project_Summary.md`: 프로젝트 한 줄 정의와 발표 메시지
- `docs/01_MVP_Scope.md`: 필수, 선택, 제외 범위
- `docs/02_Phase_Plan.md`: Phase별 작업 순서와 완료 기준
- `docs/03_Demo_Flow.md`: 발표 시연 흐름
- `docs/04_Architecture.md`: 서비스 경계와 데이터 흐름
- `docs/05_API_Draft.md`: 초기 API 초안
- `docs/06_Codex_Work_Rules.md`: Codex 작업 원칙
- `todo.md`: 현재 진행 체크리스트

## 구현 우선순위

1. Phase 0: 문서와 범위 고정
2. Phase 1: 프로젝트 골격과 더미 데이터
3. Phase 2: FastAPI 기반 인증, 사용자, 메뉴 조회
4. Phase 3: A기업 주문, 결제 Mock, 관리자 조회 API
5. Phase 4: Burger MCP Adapter/Server와 MCP 로그
6. Phase 5: 다정 Text Chat 주문 후보/승인 흐름
7. Phase 6: A/B/C 키오스크와 관리자 화면
8. Phase 7 이후: Toss 테스트 결제, Korail 시간표 조회, 실제 LLM Provider

## 범위 원칙

- A기업 햄버거 주문만 실제 주문 생성 대상으로 둡니다.
- B/C기업 키오스크는 UI 차이 설명용 Mock으로 둡니다.
- 결제는 Mock 또는 테스트 결제까지만 사용합니다.
- 실제 카드번호, 실제 코레일 예약/발권, 비공식 예약 자동화는 구현하지 않습니다.
- Voice, STT/TTS, Vector DB/RAG, 실제 LLM Provider는 MVP 필수 범위 밖입니다.

## 더미 데이터

`shared/dummy-data`에는 backend seed 변환에 사용하는 fake demo 데이터가 들어 있습니다. 현재 포함된 데이터는 사용자, 브랜드, 매장, 메뉴, 선호/비선호 재료, 최근 주문, mock 결제 profile, mock 포인트 membership입니다.

대표 demo 계정은 `user1 / user1234`, 관리자 계정은 `admin / dajeong`입니다. 비밀번호 값은 demo seed 변환용이며 backend SQLite 저장 시에는 `pbkdf2_sha256` 해시로 저장합니다.

## 로컬 실행

### Kiosk Frontend

```powershell
pnpm.cmd --dir frontend/kiosk install
pnpm.cmd --dir frontend/kiosk dev
```

기본 주소: `http://127.0.0.1:5173`

### Admin Frontend

```powershell
pnpm.cmd --dir frontend/admin install
pnpm.cmd --dir frontend/admin dev
```

기본 주소: `http://127.0.0.1:5174`

### Backend API

```powershell
cd backend/app
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Health check: `http://127.0.0.1:8000/health`

Phase 2-5 API:

```text
POST /auth/register
POST /auth/login
GET /auth/me
GET /menu
GET /menu/{menu_item_id}
POST /orders
POST /payments/dummy/approve
GET /points/me
GET /orders/{order_id}/receipt
GET /admin/orders
GET /admin/orders/{order_id}
PATCH /admin/orders/{order_id}/status
POST /mcp/burger/tools/{tool_name}
GET /admin/mcp-logs
GET /admin/mcp-logs/{log_id}
POST /dajeong/chat
POST /dajeong/final-approval
```

Backend test:

```powershell
python -m pytest backend\tests
```

### MCP Server

```powershell
cd mcp-server/app
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8100
```

Health check: `http://127.0.0.1:8100/health`

MCP tools:

```text
GET /tools
POST /tools/{tool_name}
```

### AI Agent

```powershell
cd ai-agent/app
python -m pip install -r requirements.txt
streamlit run app.py
```

현재 frontend 화면들은 Vite dev server의 `/api` proxy를 통해 backend demo API와 연결됩니다. Kiosk 화면은 A기업 실제 주문, B/C기업 Mock 구조, Dajeong Chat 후보/승인을 보여주고, Admin 화면은 주문 목록/상세와 MCP 호출 로그를 확인합니다.
