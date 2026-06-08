import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const tempDir = mkdtempSync(path.join(tmpdir(), "dajeong-adapter-tests-"));

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

const { adaptMenusToCategories } = await importTypeScriptModule(
  "src/lib/adapters/menuAdapter.ts",
);
const {
  buildCartId,
  createCartItem,
  toggleOptionChoice,
  upsertCartItem,
} = await importTypeScriptModule("src/views/kioskCart.ts");
const {
  adaptAdminSummary,
  adaptOrderToAdminOrder,
  adaptOrdersToChannelStats,
} = await importTypeScriptModule("src/lib/adapters/adminAdapter.ts");
const { maskPhoneNumber } = await importTypeScriptModule("src/lib/privacy.ts");

const optionGroups = [
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
    id: "side",
    title: "사이드 메뉴",
    selectionMode: "single",
    required: false,
    minSelect: 0,
    maxSelect: 1,
    choices: [{ id: "side-fries-l", name: "감자튀김(L)", priceDelta: 1000 }],
  },
];

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
    optionGroups,
  },
  {
    id: "menu-a-002",
    companyId: "company-a",
    name: "A 판매 중지 버거",
    category: "burger",
    price: 7600,
    description: "판매 중지 메뉴",
    imageUrl: "/images/company-a/sold-out.png",
    isAvailable: false,
    optionGroups,
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
    optionGroups: [],
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
  optionGroups,
});
assert.equal("options" in categories[0].items[0], false);
assert.equal(categories[1].id, "category-side");
assert.equal(categories[1].items[0].img, "");
assert.deepEqual(categories[1].items[0].optionGroups, []);
assert.equal("options" in categories[1].items[0], false);

const baseMenuItem = categories[0].items[0];
const toastedWithSideCartItem = createCartItem(baseMenuItem, [
  { groupId: "side", choiceIds: ["side-fries-l"] },
  { groupId: "bun", choiceIds: ["bun-toasted"] },
]);
const sameOptionsCartItem = createCartItem(baseMenuItem, [
  { groupId: "bun", choiceIds: ["bun-toasted"] },
  { groupId: "side", choiceIds: ["side-fries-l"] },
]);
const toastedOnlyCartItem = createCartItem(baseMenuItem, [
  { groupId: "bun", choiceIds: ["bun-toasted"] },
]);

assert.equal(
  toastedWithSideCartItem.cartId,
  "menu-a-001__bun:bun-toasted__side:side-fries-l",
);
assert.deepEqual(toastedWithSideCartItem.selectedOptionGroups, [
  { groupId: "bun", choiceIds: ["bun-toasted"] },
  { groupId: "side", choiceIds: ["side-fries-l"] },
]);
assert.deepEqual(toastedWithSideCartItem.selectedOptionChoices, [
  {
    groupId: "bun",
    groupTitle: "번 선택",
    choiceId: "bun-toasted",
    choiceName: "번 굽기",
    priceDelta: 500,
  },
  {
    groupId: "side",
    groupTitle: "사이드 메뉴",
    choiceId: "side-fries-l",
    choiceName: "감자튀김(L)",
    priceDelta: 1000,
  },
]);
assert.equal(toastedWithSideCartItem.unitPrice, 8700);
assert.notEqual(toastedWithSideCartItem.cartId, toastedOnlyCartItem.cartId);
assert.deepEqual(createCartItem(baseMenuItem, []).selectedOptionGroups, []);
assert.equal(
  buildCartId("menu-a-001", [
    { groupId: "extra", choiceIds: ["extra-icecream", "extra-sauce"] },
    { groupId: "bun", choiceIds: ["bun-toasted"] },
  ]),
  "menu-a-001__bun:bun-toasted__extra:extra-icecream,extra-sauce",
);

const singleSelection = toggleOptionChoice(
  [{ groupId: "bun", choiceIds: ["bun-normal"] }],
  optionGroups,
  "bun",
  "bun-toasted",
);
assert.deepEqual(singleSelection, [
  { groupId: "bun", choiceIds: ["bun-toasted"] },
]);
assert.deepEqual(
  toggleOptionChoice(singleSelection, optionGroups, "bun", "bun-toasted"),
  [{ groupId: "bun", choiceIds: ["bun-toasted"] }],
);
assert.deepEqual(
  toggleOptionChoice([], optionGroups, "side", "side-fries-l"),
  [{ groupId: "side", choiceIds: ["side-fries-l"] }],
);
assert.deepEqual(
  toggleOptionChoice(
    [{ groupId: "side", choiceIds: ["side-fries-l"] }],
    optionGroups,
    "side",
    "side-fries-l",
  ),
  [],
);

const mergedCartItems = upsertCartItem(
  [toastedWithSideCartItem],
  sameOptionsCartItem,
);

assert.equal(mergedCartItems.length, 1);
assert.equal(mergedCartItems[0].quantity, 2);

const summaryCards = adaptAdminSummary({
  totalOrders: 2,
  totalSales: 19600,
  totalPointEarned: 97,
  waitingOrders: 2,
  companyCount: 2,
  menuCount: 6,
});

assert.deepEqual(summaryCards, [
  { label: "전체 주문", value: "2건" },
  { label: "전체 데모 매출", value: "₩ 19,600" },
  { label: "대기 주문", value: "2건" },
  { label: "연결 기업", value: "2개" },
  { label: "등록 메뉴", value: "6개" },
  { label: "결제 방식", value: "데모 승인" },
  { label: "영수증", value: "데모 발급" },
  { label: "포인트 적립", value: "97 P" },
]);

const backendOrder = {
  id: "order-0001",
  orderNumber: "ORD-20260603-0001",
  waitingNumber: 101,
  userId: "user-demo-1",
  companyId: "company-a",
  sourceChannel: "dajeong_ai",
  status: "waiting",
  totalPrice: 16400,
  pointEarned: 0,
  fulfillmentType: "dine_in",
  paymentMethod: "credit_card",
  pointAccrual: { enabled: false, phone: null },
  createdAt: "2026-06-03T10:20:30+09:00",
  items: [
    {
      id: "order-item-0001-01",
      orderId: "order-0001",
      menuId: "menu-a-001",
      menuName: "A 클래식 버거",
      quantity: 2,
      selectedOptionGroups: [
        {
          groupId: "bun",
          groupTitle: "번 선택",
          choices: [{ id: "bun-normal", name: "일반", priceDelta: 0 }],
        },
        {
          groupId: "side",
          groupTitle: "사이드 메뉴",
          choices: [{ id: "side-fries-l", name: "감자튀김(L)", priceDelta: 1000 }],
        },
      ],
      unitPrice: 8200,
      itemPrice: 16400,
    },
  ],
};

const adminOrder = adaptOrderToAdminOrder(backendOrder);

assert.equal(adminOrder.id, "ORD-20260603-0001");
assert.equal(adminOrder.number, 101);
assert.equal(adminOrder.customer, "다정 데모 사용자");
assert.equal(adminOrder.source, "Dajeong AI");
assert.equal(adminOrder.targetCompany, "A기업");
assert.equal(adminOrder.fulfillment, "매장식사");
assert.equal(adminOrder.status, "대기");
assert.equal(adminOrder.payment, "신용카드");
assert.equal(adminOrder.point, "0 P");
assert.equal(adminOrder.pointBalance, "0 P");
assert.equal(adminOrder.pointAccrualStatus, "적립 안 함");
assert.equal(adminOrder.pointPhone, "-");
assert.equal(adminOrder.receipt, "데모 발급");
assert.equal(adminOrder.receiptNumber, "R-order-0001");
assert.equal(adminOrder.amount, "₩ 16,400");
assert.equal(adminOrder.approvedCode, "DUMMY-order-0001");
assert.equal(adminOrder.productName, "A 클래식 버거");
assert.deepEqual(adminOrder.productOptions, [
  "번 선택: 일반",
  "사이드 메뉴: 감자튀김(L)",
]);

const kioskOrder = {
  ...backendOrder,
  id: "order-0002",
  orderNumber: "ORD-20260603-0002",
  waitingNumber: 102,
  sourceChannel: "kiosk_a",
  pointEarned: 164,
  fulfillmentType: "pickup",
  pointAccrual: { enabled: true, phone: "010-1234-5678" },
};

const kioskAdminOrder = adaptOrderToAdminOrder(kioskOrder);

assert.equal(kioskAdminOrder.fulfillment, "포장");
assert.equal(kioskAdminOrder.point, "164 P");
assert.equal(kioskAdminOrder.pointBalance, "164 P");
assert.equal(kioskAdminOrder.pointAccrualStatus, "적립함");
assert.equal(kioskAdminOrder.pointPhone, "010-****-5678");

const channelStats = adaptOrdersToChannelStats([backendOrder, kioskOrder]);

assert.deepEqual(channelStats, [
  { name: "Dajeong AI", orders: 1, paidOrders: 1, revenue: 16400 },
  { name: "A기업 Kiosk", orders: 1, paidOrders: 1, revenue: 16400 },
]);

assert.equal(maskPhoneNumber("010-1234-5678"), "010-****-5678");
assert.equal(maskPhoneNumber("01012345678"), "010-****-5678");
assert.equal(maskPhoneNumber("1234567"), "****-4567");
assert.equal(maskPhoneNumber(null), "");

console.log("API adapter verification passed.");
