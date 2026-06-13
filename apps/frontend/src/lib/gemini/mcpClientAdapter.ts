import { handleGeminiToolCall } from "./toolHandlers";
import type { GeminiToolResult } from "./toolHandlers";
import type { DajeongMcpGatewayInput, DajeongMcpToolName } from "./tools";

const DAJEONG_MCP_TOOL_NAMES = [
  "get_companies",
  "get_company_menus",
  "search_menu",
  "create_order_draft",
  "confirm_order",
] as const satisfies readonly DajeongMcpToolName[];

type NormalizedDajeongMcpGatewayInput = DajeongMcpGatewayInput & {
  toolName: DajeongMcpToolName;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDajeongMcpToolName(value: string): value is DajeongMcpToolName {
  return DAJEONG_MCP_TOOL_NAMES.some((toolName) => toolName === value);
}

function normalizeGatewayInput(
  input: unknown,
): NormalizedDajeongMcpGatewayInput {
  if (!isRecord(input)) {
    throw new Error("MCP gateway input must be an object.");
  }

  if (typeof input.toolName !== "string" || input.toolName.trim() === "") {
    throw new Error("toolName is required.");
  }

  const toolName = input.toolName.trim();

  if (!isDajeongMcpToolName(toolName)) {
    throw new Error(`Unknown Dajeong MCP tool: ${toolName}`);
  }

  if (!isRecord(input.arguments)) {
    throw new Error("arguments must be an object.");
  }

  return {
    toolName,
    arguments: input.arguments,
  };
}

export async function callDajeongMcpTool(
  input: unknown,
): Promise<GeminiToolResult> {
  const normalizedInput = normalizeGatewayInput(input);

  if (normalizedInput.toolName === "confirm_order") {
    throw new Error(
      "confirm_order is not callable through the Gemini MCP gateway in Phase 1. Confirm orders only after the trusted UI order_draft confirm action.",
    );
  }

  // Temporary local fallback until apps/mcp-server is implemented.
  // The adapter boundary keeps Gemini on the MCP-first contract while reusing
  // the existing local handlers behind it for Phase 1.
  return handleGeminiToolCall(
    normalizedInput.toolName,
    normalizedInput.arguments,
  );
}
