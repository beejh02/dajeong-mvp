import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createDajeongMcpStdioServer } from "./mcpServer.js";

declare const process: {
  exit(code: number): never;
};

async function main(): Promise<void> {
  const server = createDajeongMcpStdioServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Dajeong MCP stdio server failed: ${message}`);
  process.exit(1);
});
