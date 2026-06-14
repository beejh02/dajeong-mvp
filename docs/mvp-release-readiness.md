# MVP Release Readiness

Status date: 2026-06-14

Final status: MVP ready for documented demo.

This release-readiness check covers the current MVP approval flow:

```text
natural language
-> /api/chat
-> Gemini intent inference
-> call_dajeong_mcp_tool
-> MCP client adapter
-> local fallback or server mode direct registry import
-> order_draft card
-> trusted confirmation
-> confirmedByUser=true added server-side
-> confirm_order
-> Backend POST /orders
-> order_confirmed card
```

No new runtime behavior was added in this phase.

## Verification Results

All documented release-readiness commands passed.

| Area | Command | Result |
| --- | --- | --- |
| Frontend chat flow | `cd apps/frontend && pnpm verify:chat-order-flow` | PASS: Chat order flow verification passed. |
| Frontend API integration | `cd apps/frontend && pnpm verify:api-integration` | PASS: API integration verification passed. |
| Frontend Next structure | `cd apps/frontend && pnpm verify:next` | PASS: Next structure verification passed. |
| Frontend API adapters | `cd apps/frontend && pnpm verify:api-adapters` | PASS: API adapter verification passed. |
| MCP server structure | `cd apps/mcp-server && pnpm verify` | PASS: MCP server scaffold structure verified. |
| MCP server TypeScript | `cd apps/mcp-server && pnpm typecheck` | PASS: TypeScript check completed with exit code 0. |
| MCP server build | `cd apps/mcp-server && pnpm build` | PASS: TypeScript build completed with exit code 0. |

## Manual Demo Checklist

Backend:

- [ ] Start Backend API with `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`.
- [ ] Confirm `Invoke-RestMethod http://127.0.0.1:8000/health` returns a healthy response.

Frontend local fallback mode:

- [ ] Start frontend with `DAJEONG_MCP_RUNTIME_MODE=local`.
- [ ] Open `http://localhost:3000/chat`.
- [ ] Send one complete order prompt.
- [ ] Verify an `order_draft` card appears.
- [ ] Verify the draft card includes confirm, edit, and reject actions.
- [ ] Confirm the draft.
- [ ] Verify the UI calls `/api/chat/confirm-order`, not Backend API directly.
- [ ] Verify an `order_confirmed` card appears.

Frontend server direct registry mode:

- [ ] Restart frontend with `DAJEONG_MCP_RUNTIME_MODE=server`.
- [ ] Keep `BACKEND_API_URL=http://localhost:8000` for server-side tool calls.
- [ ] Repeat the same order prompt.
- [ ] Verify the same `order_draft` to `order_confirmed` sequence.
- [ ] Confirm this is server mode direct registry import, not MCP transport.

Menu browsing:

- [ ] Send a menu prompt.
- [ ] Verify a `menu_candidates` card or menu guidance message appears.

## Expected Demo Prompts

- `A기업에서 클래식 버거 1개 주문하고 포인트 적립은 안 할게`
- `B기업에서 아이스 아메리카노 하나 포장 주문해줘`
- `A기업 메뉴 보여줘`

## Expected Card Sequence

Complete order prompt:

```text
message input
-> order_draft card with confirmationPayload
-> user confirm action
-> order_confirmed card
```

Menu browsing prompt:

```text
message input
-> menu_candidates card or menu guidance message
```

Safety expectations:

- `order_draft` is not a backend order.
- `confirmationPayload` does not include `confirmedByUser`.
- `confirmedByUser=true` is added only inside the trusted server-side confirmation flow.
- Gemini cannot directly call `confirm_order` through `call_dajeong_mcp_tool`.
- ChatPage uses `/api/chat` and `/api/chat/confirm-order` for the AI transaction path.

## Known MVP Exclusions

- No frontend MCP transport client.
- No local fallback removal.
- No production auth/session.
- No strong draft persistence or idempotency.
- No payment processing.
- No external service integrations.
- No production-grade audit logging, permission model, or deployment hardening.

## Known Risks And Limitations

- The natural-language demo requires `GEMINI_API_KEY`; without it, `/api/chat` returns the configured error card instead of running Gemini tool inference.
- Backend data is MVP demo data and process-lifetime behavior may reset between restarts.
- Draft IDs are MVP-scoped and are not durable transaction records.
- Repeated confirm clicks are not protected by strong idempotency in this phase.
- Admin demo token handling is not production authentication.
- Server mode direct registry import is not MCP transport; it is an MVP-stable bridge before future frontend MCP transport client work.
- The MCP stdio transport scaffold is standalone and future-facing; frontend does not use it yet.

## Final Status

MVP ready for documented demo.

Reasoning:

- All required automated verification commands passed.
- The documented AI transaction approval path is covered by `verify:chat-order-flow`.
- Frontend API integration and adapter structure checks passed.
- MCP server structure, typecheck, and build checks passed.
- Known exclusions are documented and remain intentionally out of scope.
