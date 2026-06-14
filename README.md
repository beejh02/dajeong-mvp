# Dajeong MVP

Dajeong is an accessibility-first AI transaction infrastructure MVP for digitally vulnerable users. It explores how a user can request a transaction in natural language, review a structured approval card, and confirm the transaction through a trusted UI flow without learning every company's separate digital interface.

This repository is not a production ordering, payment, authentication, or MCP transport product. The MVP proves the AI-based transaction approval flow:

```text
natural language
-> /api/chat
-> Gemini intent inference
-> call_dajeong_mcp_tool
-> MCP client adapter
-> local fallback or server mode direct registry import
-> order_draft card
-> user confirm or reject
-> /api/chat/confirm-order
-> trustedConfirmDajeongOrder
-> confirmedByUser=true added server-side
-> confirm_order
-> Backend POST /orders
-> order_confirmed card
```

## Project Positioning

Dajeong is not just a chatbot and not just a kiosk UI. The chatbot is the natural-language entrypoint; the important product idea is a transaction approval layer that can sit between users and many service providers.

The MVP uses food ordering as the demo domain because it is easy to verify end to end. The same approval pattern can later apply to other high-friction digital tasks where users need clearer guidance, structured choices, and a safe final confirmation step.

## MVP Success Criteria

The MVP is successful when it can demonstrate:

- A user enters a natural-language order request in the Dajeong AI chat page.
- `/api/chat` asks Gemini to infer intent and use the `call_dajeong_mcp_tool` gateway.
- The tool path creates an `order_draft` card, not a backend order.
- The draft card includes a `confirmationPayload` for the trusted confirmation route.
- ChatPage confirms through `/api/chat/confirm-order`, not through Backend API directly.
- The server-side trusted route adds `confirmedByUser=true`.
- `confirm_order` creates the backend order only after that trusted confirmation.
- The UI renders an `order_confirmed` card with order number, waiting number, status, and total.
- Gemini cannot directly execute `confirm_order` through the gateway.

## Current Architecture

Current implemented surfaces:

- A-company vertical kiosk demo
- B-company horizontal kiosk demo
- Dajeong AI chat page
- Card-based AI response UI
- Admin page
- FastAPI Backend API
- Frontend Gemini gateway and MCP client adapter
- `apps/mcp-server` direct registry and standalone MCP stdio transport scaffold

Key docs:

- [MVP architecture](docs/mvp-architecture.md)
- [Presentation outline](docs/presentation-outline.md)
- [MVP demo flow QA](docs/mvp-demo-flow-qa.md)
- [Gemini tool contract](docs/gemini-tool-contract.md)
- [MCP tool plan](docs/mcp-tool-plan.md)

## Runtime Modes

### Local Fallback Mode

`DAJEONG_MCP_RUNTIME_MODE=local` is the default. In this mode, the frontend MCP client adapter uses local fallback `toolHandlers`.

Smoke command marker: `DAJEONG_MCP_RUNTIME_MODE=local pnpm dev`

```powershell
cd apps/frontend
$env:DAJEONG_MCP_RUNTIME_MODE="local"
$env:NEXT_PUBLIC_BACKEND_API_URL="http://127.0.0.1:8000"
$env:BACKEND_API_URL="http://localhost:8000"
pnpm dev
```

### Server Direct Registry Mode

`DAJEONG_MCP_RUNTIME_MODE=server` routes the frontend adapter to `apps/mcp-server` by monorepo direct registry import. This is intentional for MVP stability.

Server mode direct registry smoke: `DAJEONG_MCP_RUNTIME_MODE=server BACKEND_API_URL=http://localhost:8000 pnpm dev`

```powershell
cd apps/frontend
$env:DAJEONG_MCP_RUNTIME_MODE="server"
$env:NEXT_PUBLIC_BACKEND_API_URL="http://127.0.0.1:8000"
$env:BACKEND_API_URL="http://localhost:8000"
pnpm dev
```

Important terminology: server mode is direct registry import, not MCP transport. The frontend MCP transport client is not implemented yet.

### MCP Stdio Scaffold

`apps/mcp-server` includes a standalone MCP stdio transport scaffold. It can be built and run independently, but the frontend does not use it yet.

```powershell
cd apps/mcp-server
pnpm install
pnpm verify
pnpm typecheck
pnpm build
pnpm start
```

`pnpm start` runs the built MCP stdio server with `node dist/stdio.js`.

## Demo Setup

### Backend

```powershell
cd apps/backend
python -m pip install -r requirements.txt
$env:DAJEONG_ADMIN_TOKEN="demo-admin-token"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Backend API docs are available at `http://127.0.0.1:8000/docs` while the server is running.

### Frontend

```powershell
cd apps/frontend
pnpm install
$env:NEXT_PUBLIC_BACKEND_API_URL="http://127.0.0.1:8000"
$env:BACKEND_API_URL="http://localhost:8000"
$env:NEXT_PUBLIC_DAJEONG_ADMIN_TOKEN="demo-admin-token"
$env:GEMINI_API_KEY="your-gemini-api-key"
pnpm dev
```

`GEMINI_API_KEY` is server-side only. Do not add a `NEXT_PUBLIC_` prefix. If `GEMINI_API_KEY` is missing, `/api/chat` returns the configured error card instead of running Gemini tool inference.

Open:

- `http://localhost:3000/chat` for the AI transaction demo
- `http://localhost:3000/kiosk-a` for A-company kiosk
- `http://localhost:3000/kiosk-b` for B-company kiosk
- `http://localhost:3000/admin` for the admin demo

Suggested chat prompts:

- `A기업에서 클래식 버거 1개 주문하고 포인트 적립은 안 할게`
- `B기업에서 아이스 아메리카노 하나 포장 주문해줘`
- `A기업 메뉴 보여줘`

## Safety Boundaries

- Gemini uses `call_dajeong_mcp_tool` as a gateway and cannot directly execute `confirm_order`.
- `confirmedByUser=true` is added only by the trusted server-side confirmation flow.
- ChatPage calls only `/api/chat` and `/api/chat/confirm-order` for the AI transaction path.
- ChatPage does not call Backend API directly.
- `create_order_draft` validates and formats a draft, but it must not call `POST /orders`.
- Backend `POST /orders` is reached only after `/api/chat/confirm-order` calls `trustedConfirmDajeongOrder`.
- Local fallback remains available and functional.

## Order Identity Contract

`companyId` is the target company whose menu and order are being handled. `sourceChannel` is the channel where the order entered the system.

For example, when Dajeong AI helps order from A-company, the order keeps `companyId=company-a` and uses `sourceChannel=dajeong_ai`. These values must not be collapsed into one field because admin views need to distinguish target company from inbound channel.

## MVP Exclusions

The MVP intentionally excludes:

- frontend MCP transport client
- removal of local fallback
- production auth/session
- strong draft persistence or idempotency
- payment processing
- external service integrations
- production-grade audit logs, permissions, and deployment hardening

These exclusions keep the demo focused on the transaction approval pattern rather than production infrastructure.

## Verification

Run the core contract checks:

```powershell
cd apps/frontend
pnpm verify:chat-order-flow
pnpm verify:api-integration

cd ../mcp-server
pnpm verify
pnpm typecheck
pnpm build
```

Optional frontend checks:

```powershell
cd apps/frontend
pnpm verify:next
pnpm verify:api-adapters
pnpm lint
pnpm build
```
