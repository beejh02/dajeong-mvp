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

  requireIncludes("src/views/KioskAPage/index.tsx", "getCompanyMenus");
  requireIncludes("src/views/KioskAPage/index.tsx", "createOrder");
  requireIncludes("src/views/KioskAPage/index.tsx", "adaptMenusToCategories");
  requireIncludes("src/views/KioskAPage/index.tsx", "company-a");
  requireIncludes("src/views/KioskAPage/index.tsx", "orderResult");
  requireExcludes("src/views/KioskAPage/index.tsx", "menuData");

  requireIncludes("src/views/KioskBPage/index.tsx", "getCompanyMenus");
  requireIncludes("src/views/KioskBPage/index.tsx", "createOrder");
  requireIncludes("src/views/KioskBPage/index.tsx", "adaptMenusToCategories");
  requireIncludes("src/views/KioskBPage/index.tsx", "company-b");
  requireIncludes("src/views/KioskBPage/index.tsx", "orderResult");
  requireExcludes("src/views/KioskBPage/index.tsx", "menuData");

  requireIncludes("src/views/AdminPage/index.tsx", "getAdminSummary");
  requireIncludes("src/views/AdminPage/index.tsx", "getAdminOrders");
  requireIncludes("src/views/AdminPage/index.tsx", "adaptAdminSummary");
  requireIncludes("src/views/AdminPage/index.tsx", "adaptOrderToAdminOrder");
  requireExcludes("src/views/AdminPage/index.tsx", "from \"./constants\"");

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
}

if (failures.length > 0) {
  console.error("API integration verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("API integration verification passed.");
