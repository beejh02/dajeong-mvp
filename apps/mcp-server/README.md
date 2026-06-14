# Dajeong MCP Server

TypeScript package for the Dajeong MCP tool boundary.

This package now contains both:

- the direct registry used by frontend server mode through monorepo import
- the standalone MCP stdio transport scaffold for future MCP clients

This package owns the backend-facing tool boundary for:

- `get_companies`
- `get_company_menus`
- `search_menu`
- `create_order_draft`
- `confirm_order`

The frontend MCP Client Adapter can run in two modes:

- `DAJEONG_MCP_RUNTIME_MODE=local`: default local fallback `toolHandlers`
- `DAJEONG_MCP_RUNTIME_MODE=server`: direct registry import from this package

Frontend server mode does not use MCP stdio transport yet. Frontend MCP transport client wiring remains optional and pending for a later phase.

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
pnpm start
```

`pnpm start` runs the built stdio entrypoint with `node dist/stdio.js`.

## Runtime entrypoints

`src/index.ts` exports the direct registry APIs, including `callDajeongMcpServerTool`, and does not start transport. This keeps the frontend server-mode import path side-effect free.

`src/stdio.ts` is the standalone MCP stdio runtime entrypoint. It creates the MCP server, connects `StdioServerTransport`, and is intended to run after `pnpm build` through `pnpm start`.

`src/mcpServer.ts` registers the MCP server handlers and forwards tool calls to the direct registry. `src/toolSchemas.ts` defines the five advertised MCP tools.
