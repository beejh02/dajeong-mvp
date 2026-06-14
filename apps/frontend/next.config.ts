import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["@ai-sdk/google", "ai"],
  experimental: {
    externalDir: true,
  },
  // Direct server-mode imports from apps/mcp-server use these monorepo aliases.
  turbopack: {
    resolveAlias: {
      "../backendClient.js": "../mcp-server/src/backendClient.ts",
      "../types.js": "../mcp-server/src/types.ts",
      "./config.js": "../mcp-server/src/config.ts",
      "./toolRegistry.js": "../mcp-server/src/toolRegistry.ts",
      "./tools/confirmOrder.js": "../mcp-server/src/tools/confirmOrder.ts",
      "./tools/createOrderDraft.js":
        "../mcp-server/src/tools/createOrderDraft.ts",
      "./tools/getCompanies.js": "../mcp-server/src/tools/getCompanies.ts",
      "./tools/getCompanyMenus.js": "../mcp-server/src/tools/getCompanyMenus.ts",
      "./tools/searchMenu.js": "../mcp-server/src/tools/searchMenu.ts",
      "./types.js": "../mcp-server/src/types.ts",
    },
    root: repoRoot,
  },
};

export default nextConfig;
