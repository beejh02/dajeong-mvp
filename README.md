# Dajeong MVP

다정은 사용자의 자연어 요청을 기반으로 여러 기업 서비스의 주문 흐름을 통합하는 AI 서비스 연결 플랫폼 MVP이다. 현재 MVP는 A/B 기업 키오스크, 다정 AI 주문 화면, 관리자 페이지, Backend API를 구현하며, MCP Server runtime은 향후 확장 항목으로 단계적으로 준비한다.

다정은 MCP tool 확장을 고려한 AI 서비스 연결 플랫폼 MVP로 설계되었지만, 현재 레포지토리는 MCP Server runtime이 frontend traffic을 처리하는 완성 서비스가 아니다.

## 현재 구현 범위

- A기업 Vertical UI 키오스크
- B기업 Horizontal UI 키오스크
- 다정 AI 주문 화면
- 관리자 페이지
- Backend API

현재 다정 AI 주문 화면은 Gemini Flash 기반 intent extraction을 우선 사용하고, `GEMINI_API_KEY`가 없거나 Gemini 호출에 실패하면 기존 rule-based intent parser로 fallback한다. rule-based parser는 백업 경로로 유지한다.

`apps/mcp-server`에는 향후 MCP tool 서버를 위한 TypeScript scaffold가 있다. 현재 frontend MCP Client Adapter는 local fallback `toolHandlers`를 기본값으로 유지하며, `DAJEONG_MCP_RUNTIME_MODE=server`에서는 `apps/mcp-server` direct registry import로 라우팅한다. server mode is direct registry import, not MCP transport. MCP stdio transport is available as a standalone `apps/mcp-server` entrypoint, but frontend server mode does not use it yet. MCP 관련 계획 문서는 `docs/mcp-tool-plan.md`를 기준으로 참고한다.

## 문서

프로젝트 의도와 범위는 `project-spec.md`와 `docs/` 문서를 참고한다.

현재 Frontend는 Backend API를 데이터 source of truth로 사용하도록 연결되어 있다. Frontend API client와 adapter 구조, 향후 MCP tool 계획은 `docs/mcp-tool-plan.md`에 정리되어 있다.

## 주문 채널 계약

주문 API에서 `companyId`는 실제 메뉴와 주문 대상 기업을 의미한다. `sourceChannel`은 주문이 유입된 채널을 의미하며 `kiosk_a`, `kiosk_b`, `dajeong_ai` 중 하나가 될 수 있다.

예를 들어 다정 AI가 A기업 메뉴를 대신 주문하면 `companyId`는 `company-a`, `sourceChannel`은 `dajeong_ai`로 보낸다.

## 환경 변수

Backend 예시는 `apps/backend/.env.example`, Frontend 예시는 `apps/frontend/.env.example`을 참고한다.

관리자 데모 토큰은 MVP 데모용 보호 장치이며 실제 인증, 권한 관리, 감사 로그를 대체하지 않는다. `NEXT_PUBLIC_DAJEONG_ADMIN_TOKEN`은 브라우저에 노출되는 값이므로 데모용으로만 사용한다.

관리자 데모 토큰 설정 예시:

```powershell
# Backend
$env:DAJEONG_ADMIN_TOKEN="demo-admin-token"

# Frontend
$env:NEXT_PUBLIC_DAJEONG_ADMIN_TOKEN="demo-admin-token"
```

Gemini Flash intent extraction을 사용하려면 `apps/frontend/.env.local`에 `GEMINI_API_KEY`를 설정한다. `GEMINI_API_KEY`는 서버 사이드 API route에서만 사용할 값이며, 절대 `NEXT_PUBLIC_` prefix를 붙이지 않는다. 브라우저 React 코드에서 `GEMINI_API_KEY`를 직접 참조하면 안 된다. `GEMINI_API_KEY`가 없거나 Gemini extraction이 실패해도 기존 rule-based parser fallback으로 다정 AI 주문 데모는 동작한다.

## Backend 실행

PowerShell에서 Backend API 서버를 실행한다.

```powershell
cd apps/backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend 상태 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

API 문서는 서버 실행 후 `http://127.0.0.1:8000/docs`에서 확인할 수 있다.

## Frontend 실행

PowerShell에서 Frontend 개발 서버를 실행한다.

```powershell
cd apps/frontend
pnpm install
pnpm dev
```

Frontend는 기본적으로 `NEXT_PUBLIC_BACKEND_API_URL` 환경변수를 통해 Backend API 주소를 참조한다. 로컬 개발 기본값은 `http://127.0.0.1:8000`이다.

### MCP runtime mode smoke commands

Local fallback smoke: `DAJEONG_MCP_RUNTIME_MODE=local pnpm dev`

```powershell
cd apps/frontend
$env:DAJEONG_MCP_RUNTIME_MODE="local"
pnpm dev
```

Server mode direct registry smoke: `DAJEONG_MCP_RUNTIME_MODE=server BACKEND_API_URL=http://localhost:8000 pnpm dev`

```powershell
cd apps/frontend
$env:DAJEONG_MCP_RUNTIME_MODE="server"
$env:BACKEND_API_URL="http://localhost:8000"
pnpm dev
```

Server mode remains a monorepo direct import from `apps/frontend` to `apps/mcp-server`; it is not an MCP transport client. MCP stdio transport is available as a standalone `apps/mcp-server` entrypoint, while HTTP transport and frontend MCP transport client wiring remain pending.

## MCP Server scaffold 확인

PowerShell에서 MCP server scaffold 구조와 TypeScript 빌드 준비 상태를 확인한다.

```powershell
cd apps/mcp-server
pnpm install
pnpm verify
pnpm typecheck
pnpm build
pnpm start
```

`pnpm start` runs the built MCP stdio server with `node dist/stdio.js`. `BACKEND_API_URL`을 설정하지 않으면 MCP server scaffold는 `http://localhost:8000`을 기본 Backend API 주소로 사용한다. 이 stdio transport scaffold는 아직 frontend adapter에 연결하지 않는다.
