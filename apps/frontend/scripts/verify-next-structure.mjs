import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJsonPath = path.join(root, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const dependencies = packageJson.dependencies ?? {};
const devDependencies = packageJson.devDependencies ?? {};
const scripts = packageJson.scripts ?? {};

const requiredFiles = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/chat/page.tsx",
  "src/app/kiosk-a/page.tsx",
  "src/app/kiosk-b/page.tsx",
  "src/views/AdminPage/index.tsx",
  "src/views/ChatPage/index.tsx",
  "src/views/ChatPage/components/ChatCardRenderer.tsx",
  "src/views/ChatPage/components/ChatMessageList.tsx",
  "src/views/KioskAPage/index.tsx",
  "src/views/KioskBPage/index.tsx",
  "next.config.ts",
  "next-env.d.ts",
];

const forbiddenFiles = [
  "app",
  "index.html",
  "src/pages",
  "vite.config.ts",
  "src/main.tsx",
  "src/router.tsx",
];
const failures = [];

const interactiveClientFiles = [
  "src/views/ChatPage/index.tsx",
  "src/views/ChatPage/components/ChatInput.tsx",
  "src/views/ChatPage/components/OrderDraftCard.tsx",
  "src/views/KioskAPage/components/CartFooter.tsx",
  "src/views/KioskAPage/components/CartPanel.tsx",
  "src/views/KioskAPage/components/CategorySidebar.tsx",
  "src/views/KioskAPage/components/KioskAHeader.tsx",
  "src/views/KioskAPage/components/MenuSections.tsx",
  "src/views/KioskBPage/components/CartSection.tsx",
  "src/views/KioskBPage/components/CategoryTabs.tsx",
  "src/views/KioskBPage/components/KioskBFooter.tsx",
  "src/views/KioskBPage/components/KioskBHeader.tsx",
  "src/views/KioskBPage/components/MenuCarousel.tsx",
];

const hasUseClientDirective = (file) => {
  const source = readFileSync(path.join(root, file), "utf8").trimStart();
  return source.startsWith('"use client";') || source.startsWith("'use client';");
};

const sourceIncludes = (file, pattern) => {
  const source = readFileSync(path.join(root, file), "utf8");
  return source.includes(pattern);
};

if (!dependencies.next) {
  failures.push("package.json must depend on next");
}

if (dependencies["react-router-dom"]) {
  failures.push("react-router-dom must be removed after moving routes to Next");
}

if (devDependencies.vite || devDependencies["@vitejs/plugin-react"]) {
  failures.push("Vite dependencies must be removed");
}

if (scripts.dev !== "next dev") {
  failures.push('dev script must be "next dev"');
}

if (scripts.build !== "next build") {
  failures.push('build script must be "next build"');
}

if (scripts.start !== "next start") {
  failures.push('start script must be "next start"');
}

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file))) {
    failures.push(`missing required Next file: ${file}`);
  }
}

for (const file of forbiddenFiles) {
  if (existsSync(path.join(root, file))) {
    failures.push(`remove legacy entry/config path: ${file}`);
  }
}

for (const file of interactiveClientFiles) {
  const filePath = path.join(root, file);

  if (!existsSync(filePath)) {
    failures.push(`missing interactive client file: ${file}`);
  } else if (!hasUseClientDirective(file)) {
    failures.push(`interactive component must declare "use client": ${file}`);
  }
}

const interactionChecks = [
  {
    file: "src/views/KioskAPage/index.tsx",
    patterns: [
      "data-kiosk-page=\"a\"",
      "onSelect={scrollToCategory}",
      "onAddToCart={handleMenuSelect}",
      "scrollIntoView",
    ],
  },
  {
    file: "src/views/KioskBPage/index.tsx",
    patterns: [
      "data-kiosk-page=\"b\"",
      "onAddToCart={handleMenuSelect}",
    ],
  },
  {
    file: "src/views/KioskAPage/components/MenuSections.tsx",
    patterns: ["data-cart-item-id={item.id}", "onClick={() => onAddToCart(item)}"],
  },
  {
    file: "src/views/KioskAPage/components/CategorySidebar.tsx",
    patterns: [
      "data-category-id={category.id}",
      "onClick={() => onSelect(category.id)}",
    ],
  },
  {
    file: "src/views/KioskBPage/components/MenuCarousel.tsx",
    patterns: ["data-cart-item-id={item.id}", "onClick={() => onAddToCart(item)}"],
  },
  {
    file: "src/app/chat/page.tsx",
    patterns: ["<ChatPage />"],
  },
  {
    file: "src/views/ChatPage/index.tsx",
    patterns: [
      "/api/chat",
      "chatResponse.cards",
      "conversationId",
      "onCardAction={handleCardAction}",
    ],
  },
  {
    file: "src/views/ChatPage/components/ChatMessageList.tsx",
    patterns: ["ChatCardRenderer", "message.cards"],
  },
  {
    file: "src/views/ChatPage/components/ChatCardRenderer.tsx",
    patterns: [
      'case "menu_candidates"',
      'case "order_draft"',
      'case "error"',
    ],
  },
];

for (const check of interactionChecks) {
  for (const pattern of check.patterns) {
    if (!sourceIncludes(check.file, pattern)) {
      failures.push(`missing interaction marker ${pattern}: ${check.file}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Next structure verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Next structure verification passed.");
