# Presentation Outline

## 1. One-Sentence Positioning

Dajeong is an accessibility-first AI transaction infrastructure MVP that helps digitally vulnerable users complete service transactions through natural language, structured approval cards, and a trusted confirmation path.

## 2. Problem Definition

Many digital services require users to learn a different interface for each company. Kiosks make this problem visible: the user must understand menus, options, ordering steps, payment choices, and confirmation screens under time pressure.

For digitally vulnerable users, these interface differences are not just inconvenience. They can become barriers to access, independence, and fair participation in everyday transactions.

## 3. Target Users

Primary target users:

- older adults who struggle with kiosk or app navigation
- users with low digital literacy
- users who can explain intent in natural language but have difficulty completing multi-step UI flows
- users who need a clear final confirmation step before a transaction is created

Secondary stakeholders:

- companies that want a common AI transaction access layer
- service operators who need safer AI-mediated transaction flows
- product teams validating accessibility-first transaction UX

## 4. Why This Is Infrastructure, Not Just Chat

Dajeong is not just a chatbot because the chat response does not directly execute high-risk actions. The core product is an approval infrastructure:

- natural language captures intent
- MCP-style tools query and prepare transaction data
- card UI turns inferred intent into reviewable structure
- trusted server-side confirmation gates the final transaction
- backend order creation happens only after user approval

The chat interface is the entrypoint. The transaction approval flow is the product proof.

## 5. Core User Scenario

1. The user says: `A기업에서 클래식 버거 1개 주문하고 포인트 적립은 안 할게`.
2. Dajeong sends the message to `/api/chat`.
3. Gemini infers the transaction intent and calls `call_dajeong_mcp_tool`.
4. The MCP client adapter uses local fallback mode or server mode direct registry import.
5. Dajeong returns an `order_draft` card.
6. The user reviews the items, options, fulfillment, payment, and point accrual.
7. The user confirms or rejects the card.
8. Confirmation calls `/api/chat/confirm-order`.
9. The trusted server-side route adds `confirmedByUser=true`.
10. `confirm_order` creates the backend order.
11. The UI shows an `order_confirmed` card.

## 6. MVP Architecture

MVP components:

- Next.js frontend: kiosk demos, chat page, admin page
- Next.js API routes: `/api/chat`, `/api/chat/confirm-order`, `/api/order-intent`
- Gemini Flash: intent inference and gateway function calling
- MCP client adapter: gateway-to-tool translation
- local fallback `toolHandlers`: default MVP execution path
- `apps/mcp-server`: direct registry and standalone MCP stdio scaffold
- FastAPI backend: companies, menus, orders, admin summary

The MVP supports two frontend runtime modes:

- local fallback mode: default and stable
- server mode direct registry import: uses `apps/mcp-server` directly inside the monorepo

The MCP stdio transport scaffold exists as a standalone future-facing entrypoint, but frontend MCP transport client wiring is not implemented yet.

## 7. Approval Flow

The approval flow is the main demo:

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

## 8. Safety Boundaries

- Gemini cannot directly execute `confirm_order`.
- `confirm_order` is blocked through the Gemini gateway.
- `confirmedByUser=true` is not client-authored by ChatPage or Gemini.
- `confirmedByUser=true` is added only in the trusted server-side confirmation flow.
- ChatPage does not call Backend API directly.
- ChatPage uses `/api/chat` and `/api/chat/confirm-order` for the AI transaction path.
- `order_draft` is not a backend order.
- Backend `POST /orders` happens only after the trusted confirmation route.

## 9. Demo Script

Setup:

```powershell
cd apps/backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
cd apps/frontend
$env:GEMINI_API_KEY="your-gemini-api-key"
$env:NEXT_PUBLIC_BACKEND_API_URL="http://127.0.0.1:8000"
$env:BACKEND_API_URL="http://localhost:8000"
$env:DAJEONG_MCP_RUNTIME_MODE="local"
pnpm dev
```

Demo sequence:

1. Open `http://localhost:3000/chat`.
2. Send `A기업에서 클래식 버거 1개 주문하고 포인트 적립은 안 할게`.
3. Show the `order_draft` card.
4. Point out the confirm, edit, and reject choices.
5. Confirm the draft.
6. Show the `order_confirmed` card.
7. Repeat in server mode direct registry import:

```powershell
$env:DAJEONG_MCP_RUNTIME_MODE="server"
$env:BACKEND_API_URL="http://localhost:8000"
pnpm dev
```

Speaker note: server mode direct registry import is not MCP transport. It is an MVP-safe intermediate step before any frontend MCP transport client.

## 10. Intentionally Excluded From MVP

- production authentication and user sessions
- strong draft persistence and idempotency
- payment processing
- real external service integrations
- frontend MCP transport client
- local fallback removal
- production-grade permission management, audit logging, and deployment hardening

## 11. Future Roadmap

Near-term technical roadmap:

- wire a frontend MCP transport client to the standalone MCP stdio or later HTTP transport
- migrate remaining local fallback logic behind MCP server tools
- add draft persistence and idempotency for safer repeated confirmations
- add auth/session boundaries for real user identity
- add audit logs for transaction approvals
- integrate real payment or partner APIs only after the approval safety model is stable

Product roadmap:

- expand beyond food-ordering demos
- test with digitally vulnerable users
- improve accessibility of card review and confirmation
- support voice input and assisted correction flows
- standardize transaction cards across service categories
