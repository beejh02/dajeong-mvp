import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "src/lib/api/client.ts",
  "src/lib/api/types.ts",
  "src/lib/api/companies.ts",
  "src/lib/api/menus.ts",
  "src/lib/api/orders.ts",
  "src/lib/api/admin.ts",
  "src/lib/adapters/menuAdapter.ts",
  "src/lib/adapters/adminAdapter.ts",
  "../../docs/mcp-tool-plan.md",
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
  requireIncludes("src/lib/api/client.ts", "NEXT_PUBLIC_BACKEND_API_URL");
  requireIncludes("src/lib/api/menus.ts", "getCompanyMenus");
  requireIncludes("src/lib/api/orders.ts", "createOrder");
  requireIncludes("src/lib/api/admin.ts", "getAdminSummary");
  requireIncludes("src/lib/api/admin.ts", "getAdminOrders");
  requireIncludes("src/lib/api/types.ts", "optionGroups");
  requireIncludes("src/lib/api/types.ts", "selectedOptionGroups");
  requireIncludes("src/lib/api/types.ts", "fulfillmentType");
  requireIncludes("src/lib/api/types.ts", "paymentMethod");
  requireIncludes("src/lib/api/types.ts", "pointAccrual");

  requireIncludes("src/views/KioskAPage/index.tsx", "getCompanyMenus");
  requireIncludes("src/views/KioskAPage/index.tsx", "createOrder");
  requireIncludes("src/views/KioskAPage/index.tsx", "adaptMenusToCategories");
  requireIncludes("src/views/KioskAPage/index.tsx", "company-a");
  requireIncludes("src/views/KioskAPage/index.tsx", "orderResult");
  requireIncludes("src/views/KioskAPage/index.tsx", "selectedOptionGroups");
  requireIncludes("src/views/KioskAPage/index.tsx", "toggleOptionChoice");
  requireIncludes("src/views/KioskAPage/index.tsx", "KioskCheckoutPanel");
  requireIncludes("src/views/KioskAPage/index.tsx", "fulfillmentType");
  requireIncludes("src/views/KioskAPage/index.tsx", "paymentMethod");
  requireIncludes("src/views/KioskAPage/index.tsx", "pointAccrual");
  requireExcludes("src/views/KioskAPage/index.tsx", "selectedOptionIds");
  requireExcludes("src/views/KioskAPage/index.tsx", "buildSelectedOptionGroups");
  requireExcludes("src/views/KioskAPage/index.tsx", "menuData");

  requireIncludes("src/views/KioskBPage/index.tsx", "getCompanyMenus");
  requireIncludes("src/views/KioskBPage/index.tsx", "createOrder");
  requireIncludes("src/views/KioskBPage/index.tsx", "adaptMenusToCategories");
  requireIncludes("src/views/KioskBPage/index.tsx", "company-b");
  requireIncludes("src/views/KioskBPage/index.tsx", "orderResult");
  requireIncludes("src/views/KioskBPage/index.tsx", "selectedOptionGroups");
  requireIncludes("src/views/KioskBPage/index.tsx", "toggleOptionChoice");
  requireIncludes("src/views/KioskBPage/index.tsx", "KioskCheckoutPanel");
  requireIncludes("src/views/KioskBPage/index.tsx", "fulfillmentType");
  requireIncludes("src/views/KioskBPage/index.tsx", "paymentMethod");
  requireIncludes("src/views/KioskBPage/index.tsx", "pointAccrual");
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
  requireExcludes("src/views/AdminPage/index.tsx", "from \"./constants\"");
  requireIncludes("src/lib/adapters/adminAdapter.ts", "selectedOptionGroups");

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
