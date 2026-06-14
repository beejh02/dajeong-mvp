import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));

const requiredFiles = [
  "package.json",
  "tsconfig.json",
  ".env.example",
  "README.md",
  "src/index.ts",
  "src/config.ts",
  "src/backendClient.ts",
  "src/types.ts",
  "src/toolRegistry.ts",
  "src/tools/getCompanies.ts",
  "src/tools/getCompanyMenus.ts",
  "src/tools/searchMenu.ts",
  "src/tools/createOrderDraft.ts",
  "src/tools/confirmOrder.ts",
  "scripts/verify-mcp-server-structure.mjs",
];

const sourceFiles = requiredFiles.filter((filePath) => filePath.endsWith(".ts"));
const expectedToolNames = [
  "get_companies",
  "get_company_menus",
  "search_menu",
  "create_order_draft",
  "confirm_order",
];

function readAppFile(filePath) {
  return readFileSync(join(appRoot, filePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFileExists(filePath) {
  const fullPath = join(appRoot, filePath);
  assert(statSync(fullPath).isFile(), `Missing file: ${filePath}`);
}

for (const filePath of requiredFiles) {
  assertFileExists(filePath);
}

const registry = readAppFile("src/toolRegistry.ts");
for (const toolName of expectedToolNames) {
  assert(
    registry.includes(toolName),
    `src/toolRegistry.ts must include ${toolName}`,
  );
}

const createOrderDraft = readAppFile("src/tools/createOrderDraft.ts");
assert(
  !createOrderDraft.includes("createOrder("),
  "createOrderDraft.ts must not call createOrder",
);
assert(
  !createOrderDraft.includes("POST /orders"),
  "createOrderDraft.ts must not reference POST /orders",
);

const confirmOrder = readAppFile("src/tools/confirmOrder.ts");
assert(
  confirmOrder.includes("confirmedByUser"),
  "confirmOrder.ts must require confirmedByUser",
);
assert(
  confirmOrder.includes('sourceChannel: "dajeong_ai"'),
  'confirmOrder.ts must force sourceChannel to "dajeong_ai"',
);

const backendClient = readAppFile("src/backendClient.ts");
assert(
  backendClient.includes("BACKEND_API_URL"),
  "backendClient.ts must include BACKEND_API_URL",
);

for (const filePath of sourceFiles) {
  const source = readAppFile(filePath);
  assert(
    !source.includes("apps/frontend") && !source.includes("apps/backend"),
    `${filePath} must not import from apps/frontend or apps/backend`,
  );
  assert(
    !source.match(/from\s+["'][.][.][\/\\][.][.][\/\\](frontend|backend)/),
    `${filePath} must stay independent from sibling apps`,
  );
}

console.log(
  `Verified ${relative(repoRoot, appRoot)} MCP server scaffold structure.`,
);
