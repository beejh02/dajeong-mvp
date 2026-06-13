// Gemini에는 MCP gateway function만 노출한다.
// 실제 MCP tool 실행은 mcpClientAdapter.ts에서 처리한다.

export const dajeongMcpToolNames = [
  "get_companies",
  "get_company_menus",
  "search_menu",
  "create_order_draft",
  "confirm_order",
] as const;

export type DajeongMcpToolName = (typeof dajeongMcpToolNames)[number];

export type DajeongMcpGatewayToolName = Exclude<
  DajeongMcpToolName,
  "confirm_order"
>;

export type DajeongMcpGatewayInput = {
  toolName: string;
  arguments: Record<string, unknown>;
};

export const DAJEONG_MCP_GATEWAY_TOOL_NAME = "call_dajeong_mcp_tool" as const;

export const geminiGatewayAllowedToolNames = [
  "get_companies",
  "get_company_menus",
  "search_menu",
  "create_order_draft",
] as const satisfies readonly DajeongMcpGatewayToolName[];

export const callDajeongMcpToolDeclaration = {
  name: DAJEONG_MCP_GATEWAY_TOOL_NAME,
  description:
    "Dajeong MCP gateway. Use this single function to request allowed external company, menu, search, and order draft tools. Do not call confirm_order through this gateway.",
  parameters: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description:
          "Allowed MCP tool name: get_companies, get_company_menus, search_menu, or create_order_draft.",
        enum: geminiGatewayAllowedToolNames,
      },
      arguments: {
        type: "object",
        description: "Arguments object for the selected MCP tool.",
      },
    },
    required: ["toolName", "arguments"],
  },
} as const;

export const dajeongFunctionDeclarations = [callDajeongMcpToolDeclaration] as const;
