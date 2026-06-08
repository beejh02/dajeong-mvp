import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const tempDir = mkdtempSync(path.join(tmpdir(), "dajeong-chat-tests-"));
const rootNodeModulesPath = path.join(root, "node_modules");
const tempNodeModulesPath = path.join(tempDir, "node_modules");

if (existsSync(rootNodeModulesPath) && !existsSync(tempNodeModulesPath)) {
  symlinkSync(rootNodeModulesPath, tempNodeModulesPath, "junction");
}

async function importTypeScriptModule(relativePath) {
  const outputPath = copyTypeScriptModule(relativePath);
  return import(pathToFileURL(outputPath));
}

function copyTypeScriptModule(relativePath) {
  const normalizedRelativePath = relativePath.replaceAll("\\", "/");
  const outputPath = path.join(tempDir, normalizedRelativePath);

  if (existsSync(outputPath)) {
    return outputPath;
  }

  const sourcePath = path.join(root, normalizedRelativePath);
  let output = readFileSync(sourcePath, "utf8");

  output = output.replace(
    /(from\s+["'])(\.{1,2}\/[^"']+)(["'])/g,
    (match, prefix, importPath, suffix) => {
      const dependencyRelativePath = resolveTypeScriptDependency(
        normalizedRelativePath,
        importPath,
      );

      if (!dependencyRelativePath) {
        return match;
      }

      const dependencyOutputPath = copyTypeScriptModule(dependencyRelativePath);
      let rewrittenImportPath = path
        .relative(path.dirname(outputPath), dependencyOutputPath)
        .replaceAll("\\", "/");

      if (!rewrittenImportPath.startsWith(".")) {
        rewrittenImportPath = `./${rewrittenImportPath}`;
      }

      return `${prefix}${rewrittenImportPath}${suffix}`;
    },
  );

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output, "utf8");
  return outputPath;
}

function resolveTypeScriptDependency(relativePath, importPath) {
  const dependencyBasePath = path
    .join(path.dirname(relativePath), importPath)
    .replaceAll("\\", "/");
  const candidates = [
    dependencyBasePath,
    `${dependencyBasePath}.ts`,
    `${dependencyBasePath}.tsx`,
    path.join(dependencyBasePath, "index.ts").replaceAll("\\", "/"),
    path.join(dependencyBasePath, "index.tsx").replaceAll("\\", "/"),
  ];

  return candidates.find((candidate) => existsSync(path.join(root, candidate)));
}

const { mergeParsedOrderIntent, parseOrderText } = await importTypeScriptModule(
  "src/views/ChatPage/lib/parseOrderText.ts",
);
const { extractOrderIntent } = await importTypeScriptModule(
  "src/views/ChatPage/lib/extractOrderIntent.ts",
);
const { POST } = await importTypeScriptModule(
  "src/app/api/order-intent/route.ts",
);
const { buildOrderDraft } = await importTypeScriptModule(
  "src/views/ChatPage/lib/buildOrderDraft.ts",
);
const { buildOrderCreateRequest } = await importTypeScriptModule(
  "src/views/ChatPage/lib/validateOrderDraft.ts",
);

const companyAResponse = {
  company: {
    id: "company-a",
    name: "A기업",
    displayName: "A기업 Vertical Kiosk",
    uiType: "vertical",
    description: "Vertical UI 키오스크 데모 기업",
  },
  menus: [
    {
      id: "menu-a-002",
      companyId: "company-a",
      name: "A 불고기 버거",
      category: "burger",
      price: 7600,
      description: "달콤한 불고기 소스를 더한 A기업 메뉴",
      imageUrl: "/images/company-a/bulgogi-burger.png",
      isAvailable: true,
      optionGroups: [
        {
          id: "bun",
          title: "번 선택",
          selectionMode: "single",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          choices: [
            { id: "bun-normal", name: "일반", priceDelta: 0 },
            { id: "bun-toasted", name: "번 굽기", priceDelta: 500 },
          ],
        },
        {
          id: "drink",
          title: "음료",
          selectionMode: "single",
          required: false,
          minSelect: 0,
          maxSelect: 1,
          choices: [
            { id: "drink-coke-r", name: "콜라(R)", priceDelta: 0 },
            { id: "drink-zero-coke", name: "제로콜라", priceDelta: 0 },
          ],
        },
      ],
    },
  ],
};

const firstIntent = parseOrderText("A기업 불고기버거 하나 제로콜라로 주문해줘");

assert.deepEqual(firstIntent.companyId, "company-a");
assert.deepEqual(firstIntent.menuKeyword, "불고기");
assert.deepEqual(firstIntent.optionKeywords, ["제로콜라"]);
assert.equal(firstIntent.quantity, 1);
assert.equal(firstIntent.fulfillmentType, "dine_in");
assert.equal(firstIntent.paymentMethod, "credit_card");

const remoteIntent = {
  companyId: "company-b",
  menuKeyword: "새우",
  optionKeywords: ["콜라"],
  quantity: 2,
  quantityMentioned: true,
  fulfillmentType: "pickup",
  fulfillmentTypeMentioned: true,
  paymentMethod: "cash",
  paymentMethodMentioned: true,
  pointAccrual: { enabled: false, phone: null },
};

const originalFetch = globalThis.fetch;
const originalGeminiApiKey = process.env.GEMINI_API_KEY;

try {
  delete process.env.GEMINI_API_KEY;

  const invalidRouteResponse = await POST(
    new Request("http://localhost/api/order-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    }),
  );

  assert.equal(invalidRouteResponse.status, 400);

  const noKeyRouteResponse = await POST(
    new Request("http://localhost/api/order-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "A기업 불고기버거 하나" }),
    }),
  );

  assert.equal(noKeyRouteResponse.status, 503);
} finally {
  if (originalGeminiApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiApiKey;
  }
}

try {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => remoteIntent,
  });

  assert.deepEqual(
    await extractOrderIntent("B기업 새우버거 두개 포장 현금"),
    remoteIntent,
  );

  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };

  assert.deepEqual(
    await extractOrderIntent("A기업 불고기버거 하나 제로콜라로 주문해줘"),
    firstIntent,
  );

  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({ error: "Gemini intent extraction is not configured yet" }),
  });

  assert.deepEqual(
    await extractOrderIntent("A기업 불고기버거 하나 제로콜라로 주문해줘"),
    firstIntent,
  );

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ menuKeyword: "불고기" }),
  });

  assert.deepEqual(
    await extractOrderIntent("A기업 불고기버거 하나 제로콜라로 주문해줘"),
    firstIntent,
  );
} finally {
  globalThis.fetch = originalFetch;
}

const missingBun = buildOrderDraft(firstIntent, companyAResponse);

assert.equal(missingBun.status, "missing_required_options");
assert.equal(missingBun.message, "번 선택이 필요합니다. 일반 번으로 할까요, 번 굽기로 할까요?");

const completedIntent = mergeParsedOrderIntent(
  firstIntent,
  parseOrderText("일반"),
);
const readyDraft = buildOrderDraft(completedIntent, companyAResponse);

assert.equal(readyDraft.status, "ready");
assert.equal(readyDraft.draft.menuId, "menu-a-002");
assert.equal(readyDraft.draft.quantity, 1);
assert.equal(readyDraft.draft.totalPrice, 7600);
assert.deepEqual(readyDraft.draft.selectedOptionGroups, [
  {
    groupId: "bun",
    groupTitle: "번 선택",
    choiceIds: ["bun-normal"],
    choiceNames: ["일반"],
  },
  {
    groupId: "drink",
    groupTitle: "음료",
    choiceIds: ["drink-zero-coke"],
    choiceNames: ["제로콜라"],
  },
]);

assert.deepEqual(buildOrderCreateRequest(readyDraft.draft, "user-demo-1", "dajeong_ai"), {
  companyId: "company-a",
  userId: "user-demo-1",
  sourceChannel: "dajeong_ai",
  items: [
    {
      menuId: "menu-a-002",
      quantity: 1,
      selectedOptionGroups: [
        { groupId: "bun", choiceIds: ["bun-normal"] },
        { groupId: "drink", choiceIds: ["drink-zero-coke"] },
      ],
    },
  ],
  fulfillmentType: "dine_in",
  paymentMethod: "credit_card",
  pointAccrual: { enabled: false, phone: null },
});

assert.equal(
  buildOrderDraft(parseOrderText("불고기버거 하나"), companyAResponse).status,
  "missing_company",
);

console.log("Chat order flow verification passed.");
