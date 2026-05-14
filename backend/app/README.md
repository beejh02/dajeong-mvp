# Backend App

FastAPI 기반 Dajeong backend입니다. 현재 Phase 2 범위로 SQLite seed, 인증, 사용자 조회, A기업 메뉴 조회 API를 제공합니다.

## Run

```powershell
cd backend/app
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## Demo Accounts

- 사용자: `user1 / user1234`
- 관리자: `admin / dajeong`

seed 비밀번호는 SQLite 저장 시 `pbkdf2_sha256` 해시로 저장합니다.

## Phase 2 API

```text
POST /auth/register
POST /auth/login
GET /auth/me
GET /menu
GET /menu/{menu_item_id}
```

## Test

```powershell
python -m pytest backend\tests
```
