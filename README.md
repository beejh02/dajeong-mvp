# Dajeong MVP

다정은 사용자의 자연어 요청을 이해하고 여러 기업 서비스와 연결해주는 MCP 기반 AI 플랫폼 MVP이다.

이번 MVP에서는 키오스크 주문 상황을 데모 유스케이스로 사용한다.

## 핵심 데모

- A기업 Vertical UI 키오스크
- B기업 Horizontal UI 키오스크
- 다정 AI 채팅
- 카드형 AI 응답
- 관리자 페이지
- Backend API
- MCP Server

## 문서

자세한 프로젝트 의도와 범위는 `project-spec.md`와 `docs/` 문서를 참고한다.

현재 Frontend는 Backend API를 데이터 source of truth로 사용하도록 연결한다. Frontend API client와 adapter 구조, 향후 MCP tool 계획은 `docs/mcp-tool-plan.md`에 정리한다.

## Backend 실행

PowerShell에서 Backend API 서버를 실행한다.

```powershell
cd apps/backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

상태 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

API 문서는 서버 실행 후 `http://127.0.0.1:8000/docs`에서 확인할 수 있다.

관리자 API를 데모 수준으로 보호하려면 Backend 실행 전에 선택적으로
`DAJEONG_ADMIN_TOKEN`을 설정한다.

```powershell
$env:DAJEONG_ADMIN_TOKEN="demo-admin-token"
```

Frontend 관리자 화면에서 같은 token을 전달하려면 Frontend 실행 전에 선택적으로
`NEXT_PUBLIC_DAJEONG_ADMIN_TOKEN`을 설정한다.

```powershell
cd apps/frontend
$env:NEXT_PUBLIC_DAJEONG_ADMIN_TOKEN="demo-admin-token"
pnpm.cmd dev
```

이 token 방식은 MVP 데모 편의를 위한 단순 보호 장치이다. 브라우저에 노출되는
`NEXT_PUBLIC_` 값이므로 실제 서비스 인증, 권한 관리, 감사 로그를 대체하지 않는다.

MCP Server runtime 구현은 아직 future work이며, 현재 계획은 `docs/mcp-tool-plan.md`를
기준으로 유지한다.
