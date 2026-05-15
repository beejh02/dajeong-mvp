# MCP Server App

FastAPI 기반 Dajeong MCP adapter입니다. 현재 Phase 4에서는 Burger MCP tool 경계를 fake HTTP endpoint로 제공합니다.

## Run

```powershell
cd mcp-server/app
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8100
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8100/health
```

## Tools

```text
GET /tools
POST /tools/get_menus
POST /tools/get_menu_detail
POST /tools/get_recent_orders
POST /tools/create_order_draft
POST /tools/place_order
POST /tools/request_payment
```

현재 구현은 공식 MCP SDK가 아니라 MVP 검증용 fake HTTP adapter입니다. backend는 같은 tool 이름과 payload 경계를 기준으로 호출 로그를 저장합니다.
