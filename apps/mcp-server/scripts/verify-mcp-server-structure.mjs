import { readdirSync, readFileSync, statSync } from "node:fs";
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
  "src/mcpServer.ts",
  "src/stdio.ts",
  "src/toolSchemas.ts",
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

function readRepoFile(filePath) {
  return readFileSync(join(repoRoot, filePath), "utf8");
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

function listSourceFiles(rootDir) {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

for (const filePath of requiredFiles) {
  assertFileExists(filePath);
}

const packageJson = JSON.parse(readAppFile("package.json"));
const dependencies = packageJson.dependencies ?? {};
const devDependencies = packageJson.devDependencies ?? {};
const scripts = packageJson.scripts ?? {};

assert(
  dependencies["@modelcontextprotocol/sdk"],
  "package.json must depend on @modelcontextprotocol/sdk",
);
assert(scripts.build === "tsc -p tsconfig.json", "build script must remain");
assert(
  scripts.typecheck === "tsc -p tsconfig.json --noEmit",
  "typecheck script must remain",
);
assert(
  scripts.verify === "node scripts/verify-mcp-server-structure.mjs",
  "verify script must remain",
);
assert(
  scripts.start === "node dist/stdio.js",
  "start script must run the built stdio transport entrypoint",
);
assert(
  !devDependencies.tsx,
  "tsx should not be added when the built start script is used",
);

const registry = readAppFile("src/toolRegistry.ts");
const index = readAppFile("src/index.ts");
const mcpServer = readAppFile("src/mcpServer.ts");
const stdio = readAppFile("src/stdio.ts");
const toolSchemas = readAppFile("src/toolSchemas.ts");

assert(
  index.includes("callDajeongMcpServerTool"),
  "src/index.ts must export callDajeongMcpServerTool",
);
assert(
  index.includes("dajeongMcpToolRegistry"),
  "src/index.ts must export dajeongMcpToolRegistry",
);
assert(
  !index.includes("@modelcontextprotocol/sdk") &&
    !index.includes("StdioServerTransport") &&
    !index.includes(".connect("),
  "src/index.ts must stay export-only and not start MCP transport",
);

assert(
  mcpServer.includes("@modelcontextprotocol/sdk"),
  "src/mcpServer.ts must import MCP SDK server APIs",
);
assert(
  mcpServer.includes("callDajeongMcpServerTool"),
  "src/mcpServer.ts must route MCP calls through callDajeongMcpServerTool",
);
assert(
  stdio.includes("StdioServerTransport"),
  "src/stdio.ts must create a stdio transport",
);
assert(
  stdio.includes(".connect("),
  "src/stdio.ts must connect the MCP server to stdio transport",
);

for (const toolName of expectedToolNames) {
  assert(
    registry.includes(toolName),
    `src/toolRegistry.ts must include ${toolName}`,
  );
  assert(
    mcpServer.includes(toolName),
    `src/mcpServer.ts must register ${toolName}`,
  );
  assert(
    toolSchemas.includes(toolName),
    `src/toolSchemas.ts must expose ${toolName}`,
  );
}
assert(
  registry.includes("(args: unknown)"),
  "src/toolRegistry.ts must use unknown-accepting tool handlers",
);
assert(
  !registry.includes("(args: never)"),
  "src/toolRegistry.ts must not use never tool handler args",
);
assert(
  !registry.includes("args as never"),
  "src/toolRegistry.ts must not cast args as never",
);

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
  assert(
    !source.includes("StreamableHTTPServerTransport"),
    `${filePath} must not add MCP HTTP transport yet`,
  );
  assert(
    !source.includes("createServer("),
    `${filePath} must not start an HTTP server yet`,
  );
}

const frontendPackageJson = JSON.parse(readRepoFile("apps/frontend/package.json"));
const frontendDependencies = {
  ...(frontendPackageJson.dependencies ?? {}),
  ...(frontendPackageJson.devDependencies ?? {}),
};

assert(
  !frontendDependencies["@modelcontextprotocol/sdk"],
  "frontend package.json must not depend on MCP SDK in Phase 5D",
);

for (const fullPath of listSourceFiles(join(repoRoot, "apps/frontend/src"))) {
  const source = readFileSync(fullPath, "utf8");

  assert(
    !source.includes("@modelcontextprotocol/sdk"),
    `${relative(repoRoot, fullPath)} must not import MCP SDK in Phase 5D`,
  );
}

console.log(
  `Verified ${relative(repoRoot, appRoot)} MCP server scaffold structure.`,
);
