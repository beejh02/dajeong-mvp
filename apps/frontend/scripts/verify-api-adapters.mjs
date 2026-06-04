import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const tempDir = mkdtempSync(path.join(tmpdir(), "dajeong-adapter-tests-"));

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

const { adaptMenusToCategories } = await importTypeScriptModule(
  "src/lib/adapters/menuAdapter.ts",
);
const { createCartItem, upsertCartItem } = await importTypeScriptModule(
  "src/views/kioskCart.ts",
);
const {
  adaptAdminSummary,
  adaptOrderToAdminOrder,
  adaptOrdersToChannelStats,
} = await importTypeScriptModule("src/lib/adapters/adminAdapter.ts");

const categories = adaptMenusToCategories([
  {
    id: "menu-a-001",
    companyId: "company-a",
    name: "A 클래식 버거",
    category: "burger",
    price: 7200,
    description: "기본 버거",
    imageUrl: "/images/company-a/classic-burger.png",
    isAvailable: true,
    badge: "BEST",
    options: [
      { id: "option-no-pickle", name: "피클 제거", priceDelta: 0 },
      { id: "option-toast-bun", name: "번 토스팅", priceDelta: 500 },
    ],
  },
  {
    id: "menu-a-002",
    companyId: "company-a",
    name: "A 품절 버거",
    category: "burger",
    price: 7600,
    description: "품절 메뉴",
    imageUrl: "/images/company-a/sold-out.png",
    isAvailable: false,
    options: [],
  },
  {
    id: "menu-a-003",
    companyId: "company-a",
    name: "A 감자",
    category: "side",
    price: 2500,
    description: "사이드 메뉴",
    imageUrl: "",
    isAvailable: true,
    options: [],
  },
]);

assert.equal(categories.length, 2);
assert.equal(categories[0].id, "category-burger");
assert.equal(categories[0].title, "버거 메뉴");
assert.equal(categories[0].label, "버거");
assert.equal(categories[0].items.length, 1);
assert.deepEqual(categories[0].items[0], {
  id: "menu-a-001",
  name: "A 클래식 버거",
  description: "기본 버거",
  price: 7200,
  img: "/images/company-a/classic-burger.png",
  badge: "BEST",
  options: [
    { id: "option-no-pickle", name: "피클 제거", priceDelta: 0 },
    { id: "option-toast-bun", name: "번 토스팅", priceDelta: 500 },
  ],
});
assert.equal(categories[1].id, "category-side");
assert.equal(categories[1].items[0].img, "");
assert.deepEqual(categories[1].items[0].options, []);

const baseMenuItem = categories[0].items[0];
const toastedNoPickleCartItem = createCartItem(baseMenuItem, [
  "option-toast-bun",
  "option-no-pickle",
]);
const sameOptionsCartItem = createCartItem(baseMenuItem, [
  "option-no-pickle",
  "option-toast-bun",
]);
const noPickleCartItem = createCartItem(baseMenuItem, ["option-no-pickle"]);

assert.equal(
  toastedNoPickleCartItem.cartId,
  "menu-a-001__option-no-pickle__option-toast-bun",
);
assert.deepEqual(toastedNoPickleCartItem.selectedOptionIds, [
  "option-no-pickle",
  "option-toast-bun",
]);
assert.equal(toastedNoPickleCartItem.unitPrice, 7700);
assert.notEqual(toastedNoPickleCartItem.cartId, noPickleCartItem.cartId);

const mergedCartItems = upsertCartItem(
  [toastedNoPickleCartItem],
  sameOptionsCartItem,
);

assert.equal(mergedCartItems.length, 1);
assert.equal(mergedCartItems[0].quantity, 2);

const summaryCards = adaptAdminSummary({
  totalOrders: 2,
  totalSales: 19600,
  waitingOrders: 2,
  companyCount: 2,
  menuCount: 6,
});

assert.deepEqual(summaryCards, [
  { label: "전체 주문", value: "2건" },
  { label: "전체 더미 매출", value: "₩19,600" },
  { label: "대기 주문", value: "2건" },
  { label: "연결 기업", value: "2개" },
  { label: "등록 메뉴", value: "6개" },
  { label: "결제 방식", value: "데모 승인" },
  { label: "영수증", value: "데모 발급" },
  { label: "포인트 적립", value: "196 P" },
]);

const backendOrder = {
  id: "order-0001",
  orderNumber: "ORD-20260603-0001",
  waitingNumber: 101,
  userId: "user-demo-1",
  companyId: "company-a",
  status: "waiting",
  totalPrice: 15600,
  pointEarned: 156,
  createdAt: "2026-06-03T10:20:30+09:00",
  items: [
    {
      id: "order-item-0001-01",
      orderId: "order-0001",
      menuId: "menu-a-001",
      menuName: "A 클래식 버거",
      quantity: 2,
      selectedOptions: [{ id: "option-a-set", name: "세트 변경", priceDelta: 2700 }],
      unitPrice: 7800,
      itemPrice: 15600,
    },
  ],
};

const adminOrder = adaptOrderToAdminOrder(backendOrder);

assert.equal(adminOrder.id, "ORD-20260603-0001");
assert.equal(adminOrder.number, 101);
assert.equal(adminOrder.customer, "다정 데모 사용자");
assert.equal(adminOrder.source, "A기업 Kiosk");
assert.equal(adminOrder.status, "대기");
assert.equal(adminOrder.payment, "데모 승인");
assert.equal(adminOrder.receipt, "데모 발급");
assert.equal(adminOrder.receiptNumber, "R-order-0001");
assert.equal(adminOrder.amount, "₩15,600");
assert.equal(adminOrder.approvedCode, "DUMMY-order-0001");
assert.equal(adminOrder.productName, "A 클래식 버거");
assert.deepEqual(adminOrder.productOptions, ["세트 변경"]);

const channelStats = adaptOrdersToChannelStats([backendOrder]);

assert.deepEqual(channelStats, [
  { name: "A기업 Kiosk", orders: 1, paidOrders: 1, revenue: 15600 },
]);

console.log("API adapter verification passed.");
