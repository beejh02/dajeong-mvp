import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const tempDir = mkdtempSync(path.join(tmpdir(), "dajeong-chat-tests-"));

async function importTypeScriptModule(relativePath) {
  const sourcePath = path.join(root, relativePath);
  const source = readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
    fileName: sourcePath,
  }).outputText;
  const outputPath = path.join(
    tempDir,
    relativePath.replaceAll(/[\\/]/g, "__").replace(/\.ts$/, ".mjs"),
  );

  writeFileSync(outputPath, output, "utf8");
  return import(pathToFileURL(outputPath));
}

const { mergeParsedOrderIntent, parseOrderText } = await importTypeScriptModule(
  "src/views/ChatPage/lib/parseOrderText.ts",
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

assert.deepEqual(buildOrderCreateRequest(readyDraft.draft, "user-demo-1"), {
  companyId: "company-a",
  userId: "user-demo-1",
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
