# MVP Demo Flow QA

This document verifies the Phase 5F MVP demo path:

```text
natural language input
-> /api/chat
-> Gemini intent inference
-> call_dajeong_mcp_tool
-> Dajeong MCP client adapter
-> local fallback or server direct registry mode
-> order_draft card
-> user confirm or reject
-> /api/chat/confirm-order
-> trustedConfirmDajeongOrder
-> confirmedByUser=true added server-side
-> confirm_order
-> Backend POST /orders
-> order_confirmed card
```

Phase 5D added a standalone MCP stdio transport scaffold in `apps/mcp-server`, but the frontend does not use an MCP transport client yet. Frontend server mode still uses the monorepo direct registry import from `apps/frontend/src/lib/gemini/mcpClientAdapter.ts` to `apps/mcp-server/src/index.ts`.

## Setup

Install dependencies in the packages you will run:

```powershell
cd apps/backend
python -m pip install -r requirements.txt

cd ../frontend
pnpm install

cd ../mcp-server
pnpm install
pnpm build
```

For the natural language `/api/chat` demo, configure Gemini in `apps/frontend/.env.local` or the shell environment:

```powershell
$env:GEMINI_API_KEY="your-gemini-api-key"
```

Without `GEMINI_API_KEY`, `/api/chat` returns the configured error card instead of running Gemini tool inference.

## Backend

Run the Backend API:

```powershell
cd apps/backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## Frontend Local Fallback Mode

Run the frontend with the local fallback MCP adapter mode:

```powershell
cd apps/frontend
$env:DAJEONG_MCP_RUNTIME_MODE="local"
$env:NEXT_PUBLIC_BACKEND_API_URL="http://127.0.0.1:8000"
$env:BACKEND_API_URL="http://localhost:8000"
pnpm dev
```

Smoke steps:

1. Open `http://localhost:3000/chat`.
2. Send a natural language order prompt.
3. Verify `/api/chat` returns an `order_draft` card.
4. Verify the `order_draft` card includes `confirmationPayload`.
5. Click the confirm action.
6. Verify the browser calls `/api/chat/confirm-order`, not Backend API directly.
7. Verify the response renders an `order_confirmed` card.

## Frontend Server Direct Registry Mode

Run the frontend with direct registry mode:

```powershell
cd apps/frontend
$env:DAJEONG_MCP_RUNTIME_MODE="server"
$env:NEXT_PUBLIC_BACKEND_API_URL="http://127.0.0.1:8000"
$env:BACKEND_API_URL="http://localhost:8000"
pnpm dev
```

Smoke steps are the same as local fallback mode. In this mode, `/api/chat` and `/api/chat/confirm-order` still run inside the Next.js server, but MCP tool execution routes through the direct registry import in `apps/mcp-server`. This is not MCP stdio transport.

## Standalone MCP Stdio Scaffold

The MCP stdio transport scaffold can be run independently:

```powershell
cd apps/mcp-server
pnpm build
pnpm start
```

`pnpm start` runs `node dist/stdio.js`. This standalone runtime is for future MCP clients and is not used by the frontend MVP demo flow.

## Demo Prompts

Use these prompts for manual smoke testing:

- `A기업에서 클래식 버거 1개 주문하고 포인트 적립은 안 할게`
- `B기업에서 아이스 아메리카노 하나 포장 주문해줘`
- `A기업 메뉴 보여줘`

Expected cards:

- A complete order prompt should produce an `order_draft` card with confirm, edit, and reject actions.
- The `order_draft` card should include `confirmationPayload`.
- Confirming the draft should produce an `order_confirmed` card.
- A menu browsing prompt should produce a `menu_candidates` card or a message card with menu guidance, depending on Gemini tool selection and available menu data.

## Safety Checks

- Gemini must use `call_dajeong_mcp_tool` only.
- `confirm_order` remains blocked through the Gemini gateway.
- `confirmedByUser=true` is added only by the trusted server-side confirmation flow.
- ChatPage must not call Backend API directly.
- ChatPage must only call `/api/chat` and `/api/chat/confirm-order`.
- `order_draft` is not a backend order and must not call `POST /orders`.
- Backend `POST /orders` is reached only after the trusted confirmation route calls `confirm_order`.

## Known MVP Exclusions

- No frontend MCP transport client.
- No change to `apps/mcp-server` transport architecture.
- No local fallback removal.
- No production auth/session handling.
- No strong draft persistence or idempotency.
- No payment or external service integrations.
- No guarantee that a draft ID survives process restarts; current draft IDs are MVP-scoped.

## Verification Commands

Run the contract checks before a demo:

```powershell
cd apps/frontend
pnpm verify:chat-order-flow
pnpm verify:api-integration

cd ../mcp-server
pnpm verify
pnpm typecheck
pnpm build
```
