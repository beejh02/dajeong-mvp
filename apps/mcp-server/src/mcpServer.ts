import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

import {
  callDajeongMcpServerTool,
  type DajeongMcpToolName,
} from "./toolRegistry.js";
import { dajeongMcpServerTools } from "./toolSchemas.js";

const toolNames = new Set<DajeongMcpToolName>([
  "get_companies",
  "get_company_menus",
  "search_menu",
  "create_order_draft",
  "confirm_order",
]);

function isDajeongMcpToolName(value: string): value is DajeongMcpToolName {
  return toolNames.has(value as DajeongMcpToolName);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function makeSuccessResult(
  toolName: DajeongMcpToolName,
  result: unknown,
): CallToolResult {
  const structuredContent = isRecord(result) ? result : { result };

  return {
    structuredContent,
    content: [
      {
        type: "text",
        text: JSON.stringify({ toolName, result }, null, 2),
      },
    ],
  };
}

function makeToolErrorResult(message: string): CallToolResult {
  return {
    isError: true,
    structuredContent: { error: message },
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createDajeongMcpStdioServer(): Server {
  const server = new Server(
    {
      name: "dajeong-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      instructions:
        "Dajeong MCP stdio server. Order confirmation requires trusted UI confirmation.",
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: dajeongMcpServerTools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;

    if (!isDajeongMcpToolName(toolName)) {
      return makeToolErrorResult(`Unknown Dajeong MCP tool: ${toolName}`);
    }

    try {
      const result = await callDajeongMcpServerTool(
        toolName,
        request.params.arguments ?? {},
      );

      return makeSuccessResult(toolName, result);
    } catch (error) {
      return makeToolErrorResult(getErrorMessage(error));
    }
  });

  return server;
}
