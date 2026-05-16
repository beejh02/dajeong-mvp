import { useState } from "react";

type TokenResponse = {
  access_token: string;
};

type MenuSummary = {
  menu_item_id: string;
  name: string;
  category: string;
  price: number;
  description: string;
};

type MenuIngredient = {
  ingredient_id: string;
  name: string;
  removable: boolean;
};

type MenuOptionChoice = {
  choice_id: string;
  name: string;
  price_delta: number;
};

type MenuOptionGroup = {
  option_group_id: string;
  name: string;
  required: boolean;
  choices: MenuOptionChoice[];
};

type MenuDetail = MenuSummary & {
  ingredients: MenuIngredient[];
  options: MenuOptionGroup[];
};

type SelectedOption = {
  option_group_id: string;
  choice_id: string;
};

type OrderRequestItem = {
  menu_item_id: string;
  quantity: number;
  removed_ingredient_ids: string[];
  selected_options: SelectedOption[];
};

type OrderItem = {
  menu_item_id: string;
  menu_name: string;
  quantity: number;
  line_total: number;
  removed_ingredient_ids: string[];
};

type OrderResponse = {
  order_id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_price: number;
  items: OrderItem[];
};

type PaymentResponse = {
  payment_status: string;
  order_status: string;
  approved_amount: number;
  points_earned: number;
};

type ChatCandidateItem = {
  menu_item_id: string;
  menu_name: string;
  quantity: number;
  line_total: number;
  removed_ingredient_ids: string[];
};

type ChatCandidate = {
  candidate_id: string;
  source: string;
  total_price: number;
  applied_preferences: string[];
  items: ChatCandidateItem[];
  order_request_items: OrderRequestItem[];
};

type ChatResponse = {
  reply: string;
  candidate: ChatCandidate;
};

const chatExample = "늘 먹던 햄버거 하나 주문해줘. 오이는 빼줘.";

async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload && typeof payload.detail === "string" ? payload.detail : response.statusText;
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function buildDefaultOptions(detail: MenuDetail): Record<string, string> {
  return Object.fromEntries(
    detail.options
      .filter((group) => group.required && group.choices.length > 0)
      .map((group) => [group.option_group_id, group.choices[0].choice_id]),
  );
}

function selectedOptionList(selectedOptions: Record<string, string>): SelectedOption[] {
  return Object.entries(selectedOptions).map(([option_group_id, choice_id]) => ({
    option_group_id,
    choice_id,
  }));
}

export default function App() {
  const [token, setToken] = useState<string>("");
  const [menus, setMenus] = useState<MenuSummary[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuDetail | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [removedIngredientIds, setRemovedIngredientIds] = useState<string[]>([]);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [chatMessage, setChatMessage] = useState(chatExample);
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null);
  const [chatOrder, setChatOrder] = useState<OrderResponse | null>(null);
  const [statusText, setStatusText] = useState("데모 사용자 로그인이 필요합니다.");
  const [errorText, setErrorText] = useState("");

  async function runAction(action: () => Promise<void>): Promise<void> {
    setErrorText("");
    try {
      await action();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.");
    }
  }

  async function loginDemoUser(): Promise<void> {
    await runAction(async () => {
      const tokenResponse = await fetchJson<TokenResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: "user1", password: "user1234" }),
      });
      setToken(tokenResponse.access_token);
      setStatusText("데모 사용자로 연결되었습니다.");

      const menuResponse = await fetchJson<MenuSummary[]>("/api/menu", {}, tokenResponse.access_token);
      setMenus(menuResponse);
      if (menuResponse[0]) {
        await loadMenuDetail(menuResponse[0].menu_item_id, tokenResponse.access_token);
      }
    });
  }

  async function loadMenuDetail(menuItemId: string, authToken = token): Promise<void> {
    const detail = await fetchJson<MenuDetail>(`/api/menu/${menuItemId}`, {}, authToken);
    setSelectedMenu(detail);
    setSelectedOptions(buildDefaultOptions(detail));
    setRemovedIngredientIds([]);
    setOrder(null);
    setPayment(null);
  }

  function toggleIngredient(ingredientId: string): void {
    setRemovedIngredientIds((current) =>
      current.includes(ingredientId)
        ? current.filter((id) => id !== ingredientId)
        : [...current, ingredientId],
    );
  }

  function currentOrderItem(): OrderRequestItem | null {
    if (!selectedMenu) {
      return null;
    }
    return {
      menu_item_id: selectedMenu.menu_item_id,
      quantity: 1,
      removed_ingredient_ids: removedIngredientIds,
      selected_options: selectedOptionList(selectedOptions),
    };
  }

  async function createKioskOrder(): Promise<void> {
    await runAction(async () => {
      const item = currentOrderItem();
      if (!token || !item) {
        throw new Error("로그인과 메뉴 선택이 필요합니다.");
      }
      const createdOrder = await fetchJson<OrderResponse>(
        "/api/orders",
        {
          method: "POST",
          body: JSON.stringify({ items: [item], client_total_price: 0 }),
        },
        token,
      );
      setOrder(createdOrder);
      setPayment(null);
      setStatusText(`${createdOrder.order_number} 주문이 생성되었습니다.`);
    });
  }

  async function approvePayment(): Promise<void> {
    await runAction(async () => {
      if (!token || !order) {
        throw new Error("결제할 주문이 없습니다.");
      }
      const approvedPayment = await fetchJson<PaymentResponse>(
        "/api/payments/dummy/approve",
        {
          method: "POST",
          body: JSON.stringify({
            order_id: order.order_id,
            idempotency_key: `kiosk-${order.order_id}`,
          }),
        },
        token,
      );
      setPayment(approvedPayment);
      setStatusText("Mock 결제가 승인되었습니다.");
    });
  }

  async function createChatCandidate(): Promise<void> {
    await runAction(async () => {
      if (!token) {
        throw new Error("데모 사용자 로그인이 필요합니다.");
      }
      const result = await fetchJson<ChatResponse>(
        "/api/dajeong/chat",
        {
          method: "POST",
          body: JSON.stringify({ message: chatMessage }),
        },
        token,
      );
      setChatResult(result);
      setChatOrder(null);
      setStatusText("Dajeong Chat 주문 후보가 생성되었습니다.");
    });
  }

  async function approveChatCandidate(): Promise<void> {
    await runAction(async () => {
      if (!token || !chatResult) {
        throw new Error("승인할 주문 후보가 없습니다.");
      }
      const response = await fetchJson<{ order: OrderResponse }>(
        "/api/dajeong/final-approval",
        {
          method: "POST",
          body: JSON.stringify({
            candidate_id: chatResult.candidate.candidate_id,
            approved: true,
            items: chatResult.candidate.order_request_items,
          }),
        },
        token,
      );
      setChatOrder(response.order);
      setOrder(response.order);
      setPayment(null);
      setStatusText("Dajeong Chat 후보가 실제 주문으로 생성되었습니다.");
    });
  }

  const removableIngredients = selectedMenu?.ingredients.filter((ingredient) => ingredient.removable) ?? [];

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Dajeong Phase 6 Kiosk</p>
          <h1>A/B/C 키오스크와 Dajeong Chat</h1>
        </div>
        <button className="primary-action" type="button" onClick={() => void loginDemoUser()}>
          데모 로그인
        </button>
      </header>

      <section className="status-line" aria-live="polite">
        <span>{statusText}</span>
        {errorText ? <strong>{errorText}</strong> : null}
      </section>

      <section className="workspace-grid">
        <section className="surface order-surface">
          <div className="section-heading">
            <p className="eyebrow">A기업 실제 주문</p>
            <h2>메뉴 선택과 Mock 결제</h2>
          </div>
          <div className="menu-grid">
            {menus.map((menu) => (
              <button
                className={selectedMenu?.menu_item_id === menu.menu_item_id ? "menu-card active" : "menu-card"}
                key={menu.menu_item_id}
                type="button"
                onClick={() => void runAction(() => loadMenuDetail(menu.menu_item_id))}
              >
                <span>{menu.name}</span>
                <strong>{formatWon(menu.price)}</strong>
                <small>{menu.description}</small>
              </button>
            ))}
          </div>

          {selectedMenu ? (
            <div className="order-builder">
              <div>
                <h3>{selectedMenu.name}</h3>
                <p>{selectedMenu.description}</p>
              </div>
              {selectedMenu.options.map((group) => (
                <fieldset className="option-group" key={group.option_group_id}>
                  <legend>{group.name}</legend>
                  <div className="segmented-control">
                    {group.choices.map((choice) => (
                      <button
                        className={
                          selectedOptions[group.option_group_id] === choice.choice_id ? "segment active" : "segment"
                        }
                        key={choice.choice_id}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((current) => ({
                            ...current,
                            [group.option_group_id]: choice.choice_id,
                          }))
                        }
                      >
                        {choice.name}
                        {choice.price_delta ? ` +${formatWon(choice.price_delta)}` : ""}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}

              <fieldset className="option-group">
                <legend>제외할 재료</legend>
                <div className="ingredient-list">
                  {removableIngredients.map((ingredient) => (
                    <label className="check-row" key={ingredient.ingredient_id}>
                      <input
                        checked={removedIngredientIds.includes(ingredient.ingredient_id)}
                        type="checkbox"
                        onChange={() => toggleIngredient(ingredient.ingredient_id)}
                      />
                      <span>{ingredient.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="action-row">
                <button type="button" onClick={() => void createKioskOrder()}>
                  주문 생성
                </button>
                <button disabled={!order} type="button" onClick={() => void approvePayment()}>
                  Mock 결제 승인
                </button>
              </div>
            </div>
          ) : (
            <p className="empty-state">데모 로그인 후 A기업 메뉴를 불러옵니다.</p>
          )}
        </section>

        <section className="surface chat-surface">
          <div className="section-heading">
            <p className="eyebrow">Dajeong Chat 화면</p>
            <h2>자연어 주문 후보</h2>
          </div>
          <textarea value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} />
          <div className="action-row">
            <button type="button" onClick={() => void createChatCandidate()}>
              후보 생성
            </button>
            <button disabled={!chatResult} type="button" onClick={() => void approveChatCandidate()}>
              최종 승인
            </button>
          </div>
          {chatResult ? (
            <div className="candidate-box">
              <p>{chatResult.reply}</p>
              <strong>{formatWon(chatResult.candidate.total_price)}</strong>
              <ul>
                {chatResult.candidate.items.map((item) => (
                  <li key={`${item.menu_item_id}-${item.quantity}`}>
                    {item.menu_name} {item.quantity}개
                    {item.removed_ingredient_ids.length ? " / 비선호 재료 제외" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="surface mock-surface">
          <div className="section-heading">
            <p className="eyebrow">B/C기업 Mock</p>
            <h2>서로 다른 키오스크 구조</h2>
          </div>
          <div className="mock-layouts">
            <div className="vertical-kiosk">
              <span>B기업</span>
              <button type="button">세로 메뉴</button>
              <button type="button">옵션 단계</button>
              <button type="button">결제 이동</button>
            </div>
            <div className="popup-kiosk">
              <span>C기업</span>
              <div className="popup-window">팝업 옵션 선택</div>
              <div className="horizontal-actions">
                <button type="button">이전</button>
                <button type="button">다음</button>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="result-band">
        <div>
          <p>최근 주문</p>
          <strong>{order ? `${order.order_number} / ${formatWon(order.total_price)}` : "아직 생성된 주문이 없습니다."}</strong>
        </div>
        <div>
          <p>결제 상태</p>
          <strong>{payment ? `${payment.payment_status} / ${payment.points_earned}P 적립` : order?.payment_status ?? "-"}</strong>
        </div>
        <div>
          <p>Chat 승인 주문</p>
          <strong>{chatOrder ? chatOrder.order_number : "대기 중"}</strong>
        </div>
      </section>
    </main>
  );
}
