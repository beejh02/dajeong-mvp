# Backend App

FastAPI 기반 Dajeong backend입니다. 현재 Phase 3 범위로 SQLite seed, 인증, 사용자 조회, A기업 메뉴 조회, 주문 생성, Mock 결제, 포인트, 영수증, 관리자 주문 API를 제공합니다.

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

## Phase 2-3 API

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
```

주문 금액은 client payload의 금액 값을 사용하지 않고 backend menu seed와 선택 option 기준으로 재계산합니다. Mock 결제 승인 후 주문 상태는 `accepted`, 결제 상태는 `paid`가 되고 포인트와 영수증이 생성됩니다.

## Test

```powershell
python -m pytest backend\tests
```
