import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const dependencies = packageJson.dependencies ?? {};

const requiredFiles = [
  "src/lib/api/client.ts",
  "src/lib/api/types.ts",
  "src/lib/api/companies.ts",
  "src/lib/api/menus.ts",
  "src/lib/api/orders.ts",
  "src/lib/api/admin.ts",
  "src/lib/adapters/menuAdapter.ts",
  "src/lib/adapters/adminAdapter.ts",
  "src/lib/privacy.ts",
  "src/app/chat/page.tsx",
  "src/app/api/chat/route.ts",
  "src/app/api/chat/confirm-order/route.ts",
  "src/app/api/order-intent/route.ts",
  "src/lib/gemini/mcpClientAdapter.ts",
  "src/views/ChatPage/index.tsx",
  "src/views/ChatPage/components/ChatCardRenderer.tsx",
  "src/views/ChatPage/components/ChatMessageList.tsx",
  "src/views/ChatPage/lib/extractOrderIntent.ts",
  "src/views/ChatPage/lib/parseOrderText.ts",
  "src/views/ChatPage/lib/buildOrderDraft.ts",
  "src/views/ChatPage/lib/validateOrderDraft.ts",
  "src/views/hooks/useKioskMenu.ts",
  "src/views/hooks/useKioskOrderFlow.ts",
  "../../docs/gemini-tool-contract.md",
  "../../docs/mcp-tool-plan.md",
  "../../todo.md",
];

function source(file) {
  return readFileSync(path.join(root, file), "utf8");
}

function requireFile(file) {
  if (!existsSync(path.join(root, file))) {
    failures.push(`missing required file: ${file}`);
  }
}

function requireIncludes(file, pattern) {
  if (!source(file).includes(pattern)) {
    failures.push(`missing pattern ${pattern}: ${file}`);
  }
}

function requireExcludes(file, pattern) {
  if (source(file).includes(pattern)) {
    failures.push(`forbidden pattern ${pattern}: ${file}`);
  }
}

for (const file of requiredFiles) {
  requireFile(file);
}

if (failures.length === 0) {
  for (const dependencyName of ["ai", "@ai-sdk/google", "zod"]) {
    if (!dependencies[dependencyName]) {
      failures.push(`missing frontend dependency: ${dependencyName}`);
    }
  }

  requireIncludes("src/lib/api/client.ts", "NEXT_PUBLIC_BACKEND_API_URL");
  requireIncludes("src/lib/api/menus.ts", "getCompanyMenus");
  requireIncludes("src/lib/api/orders.ts", "createOrder");
  requireIncludes("src/lib/api/admin.ts", "getAdminSummary");
  requireIncludes("src/lib/api/admin.ts", "getAdminOrders");
  requireIncludes("src/lib/api/admin.ts", "NEXT_PUBLIC_DAJEONG_ADMIN_TOKEN");
  requireIncludes("src/lib/api/admin.ts", "X-Dajeong-Admin-Token");
  requireIncludes("src/lib/privacy.ts", "maskPhoneNumber");
  requireIncludes("src/app/chat/page.tsx", "ChatPage");
  requireIncludes("src/app/api/chat/route.ts", "runDajeongGeminiChat");
  requireIncludes("src/views/ChatPage/index.tsx", "/api/chat");
  requireIncludes("src/views/ChatPage/index.tsx", "/api/chat/confirm-order");
  requireIncludes("src/views/ChatPage/index.tsx", "chatResponse.cards");
  requireIncludes("src/views/ChatPage/index.tsx", "conversationId");
  requireIncludes("src/views/ChatPage/index.tsx", "confirmationPayload");
  requireIncludes("src/app/api/chat/confirm-order/route.ts", "trustedConfirmDajeongOrder");
  requireIncludes("src/lib/gemini/mcpClientAdapter.ts", "trustedConfirmDajeongOrder");
  requireIncludes("src/lib/gemini/mcpClientAdapter.ts", "confirmedByUser: true");
  requireIncludes("src/lib/gemini/mcpClientAdapter.ts", "DAJEONG_MCP_RUNTIME_MODE");
  requireIncludes("src/lib/gemini/mcpClientAdapter.ts", "getDajeongMcpRuntimeMode");
  requireIncludes("src/lib/gemini/mcpClientAdapter.ts", 'value === "server" ? "server" : "local"');
  requireIncludes(
    "src/lib/gemini/mcpClientAdapter.ts",
    "DAJEONG_MCP_RUNTIME_MODE=server is not wired yet. Use local mode until Phase 5C-2.",
  );
  requireIncludes(
    "src/lib/gemini/mcpClientAdapter.ts",
    "Confirm orders only through the trusted UI confirmation route.",
  );
  requireExcludes("src/lib/gemini/mcpClientAdapter.ts", "callDajeongMcpServerTool");
  requireExcludes("src/lib/gemini/mcpClientAdapter.ts", "Phase 1");
  requireIncludes("src/views/ChatPage/index.tsx", "parseChatResponseBody");
  requireIncludes(
    "src/views/ChatPage/index.tsx",
    'return parseChatResponseBody(response, "Invalid confirm-order response")',
  );
  for (const guardName of [
    "isCardAction",
    "isMessageCard",
    "isMenuCandidatesCard",
    "isMissingOptionCard",
    "isOrderDraftCard",
    "isOrderConfirmedCard",
    "isErrorCard",
  ]) {
    requireIncludes("src/views/ChatPage/index.tsx", `function ${guardName}`);
  }
  requireIncludes(
    "src/views/ChatPage/components/ChatMessageList.tsx",
    "ChatCardRenderer",
  );
  requireIncludes(
    "src/views/ChatPage/components/ChatCardRenderer.tsx",
    'case "menu_candidates"',
  );
  requireIncludes(
    "src/views/ChatPage/components/ChatCardRenderer.tsx",
    'case "order_draft"',
  );
  requireIncludes(
    "src/views/ChatPage/components/ChatCardRenderer.tsx",
    'case "error"',
  );
  requireExcludes("src/views/ChatPage/index.tsx", "getCompanyMenus");
  requireExcludes("src/views/ChatPage/index.tsx", "createOrder");
  requireExcludes("src/views/ChatPage/index.tsx", "extractOrderIntent");
  requireExcludes("src/views/ChatPage/index.tsx", "buildOrderCreateRequest");
  requireExcludes("src/views/ChatPage/index.tsx", "user-demo-1");
  requireExcludes("src/views/ChatPage/index.tsx", "confirmedByUser");
  requireExcludes("src/views/ChatPage/index.tsx", "parseOrderText(trimmedInput)");
  requireIncludes("src/views/ChatPage/lib/extractOrderIntent.ts", "/api/order-intent");
  requireIncludes("src/views/ChatPage/lib/extractOrderIntent.ts", "parseOrderText(text)");
  requireIncludes("src/views/ChatPage/lib/extractOrderIntent.ts", "isParsedOrderIntent");
  requireIncludes("src/views/ChatPage/lib/extractOrderIntent.ts", "isCompanyId");
  requireIncludes("src/views/ChatPage/lib/extractOrderIntent.ts", "Number.isInteger");
  requireIncludes("src/views/ChatPage/lib/extractOrderIntent.ts", "value === \"company-a\"");
  requireIncludes("src/app/api/order-intent/route.ts", "request.json()");
  requireIncludes("src/app/api/order-intent/route.ts", "process.env.GEMINI_API_KEY");
  requireIncludes(
    "src/app/api/order-intent/route.ts",
    "console.error(\"Gemini intent extraction failed\", error)",
  );
  requireIncludes("src/app/api/order-intent/route.ts", "generateObject");
  requireIncludes("src/app/api/order-intent/route.ts", "createGoogleGenerativeAI");
  requireIncludes("src/app/api/order-intent/route.ts", "z.object");
  requireIncludes("src/app/api/order-intent/route.ts", "orderIntentSchema");
  requireIncludes("src/app/api/order-intent/route.ts", "gemini-2.5-flash");
  requireIncludes(
    "src/app/api/order-intent/route.ts",
    "Gemini intent extraction is not configured yet",
  );
  requireIncludes("src/app/api/order-intent/route.ts", "status: 503");
  requireExcludes("src/app/api/order-intent/route.ts", "NEXT_PUBLIC_GEMINI_API_KEY");
  requireExcludes("src/views/ChatPage/index.tsx", "GEMINI_API_KEY");
  requireExcludes("src/views/ChatPage/lib/extractOrderIntent.ts", "GEMINI_API_KEY");
  requireIncludes("src/views/ChatPage/lib/parseOrderText.ts", "company-a");
  requireIncludes("src/views/ChatPage/lib/parseOrderText.ts", "company-b");
  requireIncludes("src/views/ChatPage/lib/buildOrderDraft.ts", "choice.id === aliasedChoiceId");
  requireIncludes("src/views/ChatPage/lib/buildOrderDraft.ts", "missing_required_options");
  requireIncludes("src/views/ChatPage/lib/validateOrderDraft.ts", "selectedOptionGroups");
  requireIncludes("src/lib/api/types.ts", "optionGroups");
  requireIncludes("src/lib/api/types.ts", "selectedOptionGroups");
  requireIncludes("src/lib/api/types.ts", "SourceChannel");
  requireIncludes("src/lib/api/types.ts", "sourceChannel");
  requireIncludes("src/lib/api/types.ts", "fulfillmentType");
  requireIncludes("src/lib/api/types.ts", "paymentMethod");
  requireIncludes("src/lib/api/types.ts", "pointAccrual");
  requireIncludes("src/lib/api/types.ts", "totalPointEarned");
  requireIncludes("src/views/hooks/useKioskMenu.ts", "getCompanyMenus");
  requireIncludes("src/views/hooks/useKioskMenu.ts", "adaptMenusToCategories");
  requireIncludes("src/views/hooks/useKioskMenu.ts", "isMountedRef");
  requireIncludes("src/views/hooks/useKioskOrderFlow.ts", "createOrder");
  requireIncludes("src/views/hooks/useKioskOrderFlow.ts", "sourceChannel");
  requireIncludes("src/views/hooks/useKioskOrderFlow.ts", "toggleOptionChoice");
  requireIncludes("src/views/hooks/useKioskOrderFlow.ts", "user-demo-1");
  requireIncludes("src/views/hooks/useKioskOrderFlow.ts", "selectedOptionGroups");

  requireIncludes("src/views/KioskAPage/index.tsx", "useKioskMenu");
  requireIncludes("src/views/KioskAPage/index.tsx", "useKioskOrderFlow");
  requireIncludes("src/views/KioskAPage/index.tsx", "company-a");
  requireIncludes("src/views/KioskAPage/index.tsx", "kiosk_a");
  requireIncludes("src/views/KioskAPage/index.tsx", "orderResult");
  requireIncludes("src/views/KioskAPage/index.tsx", "selectedOptionGroups");
  requireIncludes("src/views/KioskAPage/index.tsx", "toggleOptionSelection");
  requireIncludes("src/views/KioskAPage/index.tsx", "KioskCheckoutPanel");
  requireIncludes("src/views/KioskAPage/index.tsx", "fulfillmentType");
  requireIncludes("src/views/KioskAPage/index.tsx", "paymentMethod");
  requireIncludes("src/views/KioskAPage/index.tsx", "pointAccrual");
  requireIncludes("src/views/KioskAPage/index.tsx", "maskPhoneNumber");
  requireExcludes("src/views/KioskAPage/index.tsx", "getCompanyMenus");
  requireExcludes("src/views/KioskAPage/index.tsx", "createOrder");
  requireExcludes("src/views/KioskAPage/index.tsx", "adaptMenusToCategories");
  requireExcludes("src/views/KioskAPage/index.tsx", "selectedOptionIds");
  requireExcludes("src/views/KioskAPage/index.tsx", "buildSelectedOptionGroups");
  requireExcludes("src/views/KioskAPage/index.tsx", "menuData");

  requireIncludes("src/views/KioskBPage/index.tsx", "useKioskMenu");
  requireIncludes("src/views/KioskBPage/index.tsx", "useKioskOrderFlow");
  requireIncludes("src/views/KioskBPage/index.tsx", "company-b");
  requireIncludes("src/views/KioskBPage/index.tsx", "kiosk_b");
  requireIncludes("src/views/KioskBPage/index.tsx", "orderResult");
  requireIncludes("src/views/KioskBPage/index.tsx", "selectedOptionGroups");
  requireIncludes("src/views/KioskBPage/index.tsx", "toggleOptionSelection");
  requireIncludes("src/views/KioskBPage/index.tsx", "KioskCheckoutPanel");
  requireIncludes("src/views/KioskBPage/index.tsx", "fulfillmentType");
  requireIncludes("src/views/KioskBPage/index.tsx", "paymentMethod");
  requireIncludes("src/views/KioskBPage/index.tsx", "pointAccrual");
  requireIncludes("src/views/KioskBPage/index.tsx", "maskPhoneNumber");
  requireExcludes("src/views/KioskBPage/index.tsx", "getCompanyMenus");
  requireExcludes("src/views/KioskBPage/index.tsx", "createOrder");
  requireExcludes("src/views/KioskBPage/index.tsx", "adaptMenusToCategories");
  requireExcludes("src/views/KioskBPage/index.tsx", "selectedOptionIds");
  requireExcludes("src/views/KioskBPage/index.tsx", "buildSelectedOptionGroups");
  requireExcludes("src/views/KioskBPage/index.tsx", "menuData");
  requireIncludes("src/views/components/KioskOptionDialog.tsx", "optionGroups");
  requireIncludes("src/views/components/KioskOptionDialog.tsx", "selectedOptionGroups");
  requireIncludes("src/views/components/KioskOptionDialog.tsx", "validationMessage");
  requireIncludes("src/views/components/KioskCheckoutPanel.tsx", "onSubmit");
  requireIncludes("src/views/components/KioskCheckoutPanel.tsx", "fulfillmentType");
  requireIncludes("src/views/components/KioskCheckoutPanel.tsx", "paymentMethod");
  requireIncludes("src/views/components/KioskCheckoutPanel.tsx", "pointAccrual");
  requireExcludes("src/views/components/KioskOptionDialog.tsx", "selectedOptionIds");
  requireExcludes("src/views/components/KioskCheckoutPanel.tsx", "onSubmitWithPoints");
  requireExcludes("src/views/components/KioskCheckoutPanel.tsx", "onSubmitWithoutPoints");

  requireIncludes("src/views/AdminPage/index.tsx", "getAdminSummary");
  requireIncludes("src/views/AdminPage/index.tsx", "getAdminOrders");
  requireIncludes("src/views/AdminPage/index.tsx", "adaptAdminSummary");
  requireIncludes("src/views/AdminPage/index.tsx", "adaptOrderToAdminOrder");
  requireIncludes("src/views/AdminPage/index.tsx", "void loadAdminData()");
  requireExcludes("src/views/AdminPage/index.tsx", "from \"./constants\"");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "selectedOptionGroups");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "SOURCE_CHANNEL_LABELS");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "FULFILLMENT_TYPE_LABELS");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "targetCompany");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "totalPointEarned");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "pointAccrualStatus");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "pointPhone");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "maskPhoneNumber");
  requireIncludes("src/views/AdminPage/types.ts", "fulfillment");
  requireIncludes("src/views/AdminPage/types.ts", "pointAccrualStatus");
  requireIncludes("src/views/AdminPage/types.ts", "pointPhone");
  requireIncludes("src/views/AdminPage/components/OrdersSection.tsx", "order.fulfillment");
  requireIncludes("src/views/AdminPage/components/OrderDetailSection.tsx", "이용 방식");
  requireIncludes("src/views/AdminPage/components/OrderDetailSection.tsx", "order.pointAccrualStatus");
  requireIncludes("src/views/AdminPage/components/OrderDetailSection.tsx", "order.pointPhone");

  for (const toolName of [
    "get_companies",
    "get_company_menus",
    "search_menu",
    "recommend_menu",
    "create_order",
    "get_user_points",
    "get_recent_order",
    "get_admin_summary",
  ]) {
    requireIncludes("../../docs/mcp-tool-plan.md", toolName);
  }

  requireIncludes("../../docs/mcp-tool-plan.md", "optionGroups");
  requireIncludes("../../docs/mcp-tool-plan.md", "selectedOptionGroups");
  requireIncludes("../../docs/mcp-tool-plan.md", "fulfillmentType");
  requireIncludes("../../docs/mcp-tool-plan.md", "paymentMethod");
  requireIncludes("../../docs/mcp-tool-plan.md", "pointAccrual");
  requireIncludes(
    "../../docs/gemini-tool-contract.md",
    "MCP Client Adapter currently uses local fallback toolHandlers",
  );
  requireIncludes(
    "../../docs/gemini-tool-contract.md",
    "Trusted confirmation route still uses local fallback until server wiring",
  );
  requireIncludes(
    "../../docs/gemini-tool-contract.md",
    "apps/mcp-server scaffold exists but is not wired yet",
  );
  requireIncludes(
    "../../docs/mcp-tool-plan.md",
    "Frontend MCP adapter now has a runtime mode switch, but server mode is intentionally not wired yet",
  );
  requireIncludes(
    "../../docs/mcp-tool-plan.md",
    "DAJEONG_MCP_RUNTIME_MODE=local",
  );
  requireIncludes(
    "../../docs/mcp-tool-plan.md",
    "DAJEONG_MCP_RUNTIME_MODE=server",
  );
  requireIncludes(
    "../../docs/mcp-tool-plan.md",
    "confirm_order is blocked through the Gemini gateway",
  );
  requireIncludes("../../todo.md", "trusted confirm-order route");
  requireIncludes("../../todo.md", "frontend MCP adapter runtime switch preparation");

  requireExcludes("src/lib/adapters/menuAdapter.ts", "options: menu.optionGroups.flatMap");
  requireExcludes("src/views/kioskCart.ts", "selectedOptionIds");
  requireExcludes("src/views/kioskCart.ts", "selectedOptions");
}

if (failures.length > 0) {
  console.error("API integration verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("API integration verification passed.");
