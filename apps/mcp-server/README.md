# Dajeong MCP Server

Standalone TypeScript scaffold for the future Dajeong MCP tool server.

This package owns the backend-facing tool boundary for:

- `get_companies`
- `get_company_menus`
- `search_menu`
- `create_order_draft`
- `confirm_order`

The frontend is not wired to this package yet. The current frontend MCP Client Adapter still uses local fallback `toolHandlers`; switching that adapter to this server is planned for Phase 5C.

## Environment

Copy `.env.example` to the local runtime environment and set:

```powershell
$env:BACKEND_API_URL="http://localhost:8000"
```

If unset, `BACKEND_API_URL` defaults to `http://localhost:8000`.

## Scripts

```powershell
pnpm install
pnpm verify
pnpm typecheck
pnpm build
```

`src/index.ts` currently exports `callDajeongMcpServerTool`. MCP stdio transport registration is intentionally left as Phase 5C work so this scaffold does not change frontend traffic.
