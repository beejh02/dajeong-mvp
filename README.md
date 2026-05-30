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

## Backend 실행

PowerShell에서 Backend API 서버를 실행한다.

```powershell
cd C:\Users\joon0\Desktop\dajeong-mvp\apps\backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

상태 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

API 문서는 서버 실행 후 `http://127.0.0.1:8000/docs`에서 확인할 수 있다.
