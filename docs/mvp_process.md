# Dajeong MVP 실행 흐름

> 기준 자료: `C:\Users\joon0\Downloads\mvp_process.md`
> 이 문서는 원본 계획을 현재 저장소의 초기 상태에 맞게 축약, 재정렬한 실행 기준입니다.

## 1. 프로젝트 정의

다정(Dajeong)은 기업마다 다른 키오스크, 결제, 예약 UI를 사용자가 직접 학습하지 않아도 하나의 자연어 인터페이스로 주문, 결제, 예약 후보 생성을 진행하게 돕는 접근성 중심 AI 플랫폼입니다.

이번 MVP는 전체 플랫폼을 완성하는 것이 아니라, 발표에서 다음 흐름을 안정적으로 보여주는 데 집중합니다.

```text
사용자 자연어 입력
-> Dajeong Text Chat
-> 주문 의도 분석
-> Burger MCP Adapter/Server 호출
-> A기업 주문 API 또는 DB에 주문 생성
-> 관리자 페이지에서 주문과 MCP 호출 로그 확인
```

## 2. 발표에서 반드시 보여줄 것

1. 기업마다 다른 키오스크 화면 구조 때문에 사용자가 혼란을 겪는 문제
2. 다정이 하나의 대화형 UI로 기업별 차이를 흡수하는 방식
3. MCP 호출 로그와 관리자 페이지를 통해 실제 처리 구조가 보이는 점

## 3. 현재 MVP 범위 판단

원본 계획에는 Toss, Korail, Voice, RAG, 생체인식까지 포함되어 있지만 초기 발표 MVP에서는 범위를 줄입니다.

### 필수 범위

- A기업 햄버거 주문 API와 실제 주문 생성
- B/C기업 Mock 키오스크 UI
- Dajeong Text Chat 자연어 주문 후보 생성
- Burger MCP Adapter/Server 호출 경계
- 관리자 주문 목록, 주문 상세, MCP 로그 확인
- 사용자/관리자 로그인과 시연용 seed 데이터
- Mock 결제 상태 저장

### 선택 범위

- Toss 테스트 결제창 또는 테스트 결제 adapter
- Korail 시간표 조회 adapter 또는 mock 후보 생성
- 실제 LLM Provider 연결

### 제외 범위

- 실제 Toss 실결제
- 실제 카드번호 또는 민감 결제정보 저장
- 실제 코레일 좌석 예약/발권
- 비공식 자동화 또는 스크래핑 기반 예약
- 실제 Voice, STT, TTS
- Vector DB/RAG
- 실제 생체인식

## 4. 권장 저장소 구조

초기 구현은 아래 구조를 기준으로 진행합니다. 구현 전에는 문서만 존재할 수 있습니다.

```text
dajeong-mvp/
├── docs/
│   ├── mvp_process.md
│   ├── 00_Project_Summary.md
│   ├── 01_MVP_Scope.md
│   ├── 02_Phase_Plan.md
│   ├── 03_Demo_Flow.md
│   ├── 04_Architecture.md
│   ├── 05_API_Draft.md
│   └── 06_Codex_Work_Rules.md
├── frontend/
│   ├── kiosk/
│   └── admin/
├── backend/
│   └── app/
├── mcp-server/
│   └── app/
├── ai-agent/
│   └── app/
├── shared/
│   ├── dummy-data/
│   └── docs/
├── README.md
└── todo.md
```

## 5. Phase 순서

### Phase 0. 문서와 범위 고정

목표: 구현 전에 MVP 범위, 제외 범위, 시연 흐름, Phase 순서를 고정합니다.

완료 기준:

- 핵심 문서가 repo 안에 존재합니다.
- 필수, 선택, 제외 범위가 분리되어 있습니다.
- 다음 Phase에서 구현할 파일 경계가 보입니다.

### Phase 1. 프로젝트 골격과 더미 데이터

목표: 프론트엔드, 백엔드, MCP, AI Agent, shared data의 최소 실행 골격을 만듭니다.

완료 기준:

- 각 앱이 최소 health 또는 placeholder 화면으로 실행됩니다.
- 시연 계정, 메뉴, 주문 이력, 선호/비선호 재료 더미 데이터가 준비됩니다.
- 아직 실제 주문 비즈니스 로직은 구현하지 않습니다.

### Phase 2. Backend 인증, 사용자, 메뉴 기반

목표: FastAPI, SQLite, seed, 로그인, 사용자 프로필, 메뉴 조회 API를 구축합니다.

완료 기준:

- `user1/user1234`, `admin/dajeong`으로 로그인할 수 있습니다.
- 사용자 프로필과 메뉴 정보를 조회할 수 있습니다.
- 비밀번호는 평문 저장하지 않습니다.

### Phase 3. A기업 주문, 결제 Mock, 관리자 조회 API

목표: A기업 햄버거 주문 흐름과 관리자 확인용 API를 구축합니다.

완료 기준:

- A기업 메뉴로 주문을 생성할 수 있습니다.
- 주문번호, 대기번호, 결제 상태, 포인트 적립 여부가 저장됩니다.
- 관리자 API에서 주문 목록과 상세를 조회할 수 있습니다.

### Phase 4. Burger MCP Adapter/Server와 호출 로그

목표: 다정 Backend가 기업 DB를 직접 수정하는 구조가 아니라 MCP 경계를 통해 주문을 처리하는 구조를 만듭니다.

완료 기준:

- Burger MCP Tool을 호출하는 service 경계가 있습니다.
- MCP 요청/응답 payload와 성공/실패 상태가 저장됩니다.
- 관리자 API에서 MCP 로그를 조회할 수 있습니다.

### Phase 5. Dajeong Text Chat 주문 후보와 승인

목표: 자연어 입력으로 주문 후보를 만들고 사용자 승인 후 주문을 확정하는 흐름을 만듭니다.

완료 기준:

- 기준 입력 `늘 먹던 햄버거 하나 주문해줘. 오이는 빼줘.`를 처리할 수 있습니다.
- 최근 주문, 선호/비선호 재료, 메뉴 정보를 반영한 주문 후보를 생성합니다.
- 사용자가 주문 후보를 확인하고 간편 비밀번호 또는 demo approval로 승인할 수 있습니다.

### Phase 6. A/B/C 키오스크와 관리자 화면

목표: 사용자 혼란 문제와 다정의 해결 방식을 화면으로 보여줍니다.

완료 기준:

- A기업 키오스크는 실제 주문 API와 연결됩니다.
- B/C기업 키오스크는 서로 다른 UI 구조를 보여주는 Mock입니다.
- 관리자 페이지에서 주문과 MCP 로그를 확인할 수 있습니다.

### Phase 7 이후. 확장 기능

목표: 발표 완성도를 높이는 기능을 별도 범위로 추가합니다.

후보:

- Toss 테스트 결제 adapter
- Korail 시간표 조회 adapter
- 실제 LLM Provider
- Voice 선택 UI

## 6. Codex 작업 원칙

- 한 번에 전체 프로젝트를 구현하지 않습니다.
- 매번 `README.md`, `todo.md`, `docs/02_Phase_Plan.md`를 먼저 확인합니다.
- 이번 Phase에 필요한 파일만 생성하거나 수정합니다.
- B/C기업 Mock 키오스크를 실제 주문 DB와 연결하지 않습니다.
- 실제 결제, 실제 예약, 민감정보 저장은 구현하지 않습니다.
- 작업 후 변경 파일, 검증 명령, 다음 Phase를 보고합니다.
