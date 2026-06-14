import { confirmOrderTool } from "./tools/confirmOrder.js";
import { createOrderDraftTool } from "./tools/createOrderDraft.js";
import { getCompaniesTool } from "./tools/getCompanies.js";
import { getCompanyMenusTool } from "./tools/getCompanyMenus.js";
import { searchMenuTool } from "./tools/searchMenu.js";
import type {
  CompanyListResponse,
  ConfirmOrderArgs,
  ConfirmOrderResult,
  CreateOrderDraftArgs,
  CreateOrderDraftResult,
  MenuItem,
  MenuListResponse,
} from "./types.js";

export type DajeongMcpToolName =
  | "get_companies"
  | "get_company_menus"
  | "search_menu"
  | "create_order_draft"
  | "confirm_order";

export type DajeongMcpToolArgs =
  | Record<string, never>
  | { companyId: string }
  | { companyId: string; query: string }
  | CreateOrderDraftArgs
  | ConfirmOrderArgs;

export type DajeongMcpToolResult =
  | CompanyListResponse
  | MenuListResponse
  | { menus: MenuItem[] }
  | CreateOrderDraftResult
  | ConfirmOrderResult;

type ToolHandler = (args: never) => Promise<DajeongMcpToolResult>;

export const dajeongMcpToolRegistry = {
  get_companies: getCompaniesTool,
  get_company_menus: getCompanyMenusTool,
  search_menu: searchMenuTool,
  create_order_draft: createOrderDraftTool,
  confirm_order: confirmOrderTool,
} satisfies Record<DajeongMcpToolName, ToolHandler>;

export async function callDajeongMcpServerTool(
  toolName: DajeongMcpToolName,
  args: unknown,
): Promise<DajeongMcpToolResult> {
  const handler = dajeongMcpToolRegistry[toolName];

  if (!handler) {
    throw new Error(`Unknown Dajeong MCP tool: ${String(toolName)}`);
  }

  return handler(args as never);
}
