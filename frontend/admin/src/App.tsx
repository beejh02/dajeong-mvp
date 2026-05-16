import { useState } from "react";

type TokenResponse = {
  access_token: string;
};

type OrderItem = {
  menu_name: string;
  quantity: number;
  line_total: number;
};

type OrderResponse = {
  order_id: string;
  order_number: string;
  user_id: string;
  order_status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  items: OrderItem[];
};

type McpLogSummary = {
  log_id: string;
  tool_name: string;
  status: string;
  created_at: string;
};

type McpLogDetail = McpLogSummary & {
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  error_message: string | null;
};

const statusOptions = ["accepted", "cooking", "completed", "canceled"];

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

function formatJson(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

export default function App() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [logs, setLogs] = useState<McpLogSummary[]>([]);
  const [selectedLog, setSelectedLog] = useState<McpLogDetail | null>(null);
  const [statusText, setStatusText] = useState("관리자 로그인이 필요합니다.");
  const [errorText, setErrorText] = useState("");

  async function runAction(action: () => Promise<void>): Promise<void> {
    setErrorText("");
    try {
      await action();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.");
    }
  }

  async function loginAdmin(): Promise<void> {
    await runAction(async () => {
      const tokenResponse = await fetchJson<TokenResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: "admin", password: "dajeong" }),
      });
      setToken(tokenResponse.access_token);
      await loadDashboard(tokenResponse.access_token);
      setStatusText("관리자 계정으로 연결되었습니다.");
    });
  }

  async function loadDashboard(authToken = token): Promise<void> {
    if (!authToken) {
      throw new Error("관리자 로그인이 필요합니다.");
    }
    const [orderList, logList] = await Promise.all([
      fetchJson<OrderResponse[]>("/api/admin/orders", {}, authToken),
      fetchJson<McpLogSummary[]>("/api/admin/mcp-logs", {}, authToken),
    ]);
    setOrders(orderList);
    setLogs(logList);
    setSelectedOrder(orderList[0] ?? null);
    if (logList[0]) {
      await loadLogDetail(logList[0].log_id, authToken);
    } else {
      setSelectedLog(null);
    }
  }

  async function loadOrderDetail(orderId: string): Promise<void> {
    await runAction(async () => {
      const detail = await fetchJson<OrderResponse>(`/api/admin/orders/${orderId}`, {}, token);
      setSelectedOrder(detail);
    });
  }

  async function loadLogDetail(logId: string, authToken = token): Promise<void> {
    const detail = await fetchJson<McpLogDetail>(`/api/admin/mcp-logs/${logId}`, {}, authToken);
    setSelectedLog(detail);
  }

  async function patchOrderStatus(orderStatus: string): Promise<void> {
    await runAction(async () => {
      if (!selectedOrder) {
        throw new Error("상태를 변경할 주문을 선택하세요.");
      }
      const updated = await fetchJson<OrderResponse>(
        `/api/admin/orders/${selectedOrder.order_id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ order_status: orderStatus }),
        },
        token,
      );
      setSelectedOrder(updated);
      await loadDashboard(token);
      setStatusText(`${updated.order_number} 상태가 ${orderStatus}(으)로 변경되었습니다.`);
    });
  }

  return (
    <main className="admin-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Dajeong Phase 6 Admin</p>
          <h1>관리자 주문과 MCP 호출 로그</h1>
        </div>
        <div className="toolbar">
          <button type="button" onClick={() => void loginAdmin()}>
            관리자 로그인
          </button>
          <button disabled={!token} type="button" onClick={() => void runAction(() => loadDashboard())}>
            새로고침
          </button>
        </div>
      </header>

      <section className="status-line" aria-live="polite">
        <span>{statusText}</span>
        {errorText ? <strong>{errorText}</strong> : null}
      </section>

      <section className="dashboard-grid">
        <section className="surface">
          <div className="section-heading">
            <p className="eyebrow">관리자 주문</p>
            <h2>주문 목록/상세</h2>
          </div>
          <div className="list-panel">
            {orders.length ? (
              orders.map((order) => (
                <button
                  className={selectedOrder?.order_id === order.order_id ? "row-button active" : "row-button"}
                  key={order.order_id}
                  type="button"
                  onClick={() => void loadOrderDetail(order.order_id)}
                >
                  <span>{order.order_number}</span>
                  <strong>{formatWon(order.total_price)}</strong>
                  <small>
                    {order.order_status} / {order.payment_status}
                  </small>
                </button>
              ))
            ) : (
              <p className="empty-state">표시할 주문이 없습니다. kiosk에서 주문을 생성하면 여기에 표시됩니다.</p>
            )}
          </div>
        </section>

        <section className="surface">
          <div className="section-heading">
            <p className="eyebrow">주문 상세</p>
            <h2>상태 변경</h2>
          </div>
          {selectedOrder ? (
            <div className="detail-panel">
              <dl>
                <div>
                  <dt>주문번호</dt>
                  <dd>{selectedOrder.order_number}</dd>
                </div>
                <div>
                  <dt>총액</dt>
                  <dd>{formatWon(selectedOrder.total_price)}</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>{selectedOrder.order_status}</dd>
                </div>
              </dl>
              <ul className="item-list">
                {selectedOrder.items.map((item) => (
                  <li key={`${item.menu_name}-${item.quantity}`}>
                    {item.menu_name} {item.quantity}개 / {formatWon(item.line_total)}
                  </li>
                ))}
              </ul>
              <div className="segmented-control">
                {statusOptions.map((status) => (
                  <button key={status} type="button" onClick={() => void patchOrderStatus(status)}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-state">주문을 선택하세요.</p>
          )}
        </section>

        <section className="surface">
          <div className="section-heading">
            <p className="eyebrow">MCP 호출 로그</p>
            <h2>tool 실행 기록</h2>
          </div>
          <div className="list-panel">
            {logs.length ? (
              logs.map((log) => (
                <button
                  className={selectedLog?.log_id === log.log_id ? "row-button active" : "row-button"}
                  key={log.log_id}
                  type="button"
                  onClick={() => void runAction(() => loadLogDetail(log.log_id))}
                >
                  <span>{log.tool_name}</span>
                  <strong>{log.status}</strong>
                  <small>{log.created_at}</small>
                </button>
              ))
            ) : (
              <p className="empty-state">MCP 호출 로그가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="surface log-detail">
          <div className="section-heading">
            <p className="eyebrow">로그 상세</p>
            <h2>요청/응답 payload</h2>
          </div>
          {selectedLog ? (
            <div className="log-grid">
              <div>
                <h3>Request</h3>
                <pre>{formatJson(selectedLog.request_payload)}</pre>
              </div>
              <div>
                <h3>Response</h3>
                <pre>{formatJson(selectedLog.response_payload)}</pre>
              </div>
            </div>
          ) : (
            <p className="empty-state">로그를 선택하세요.</p>
          )}
        </section>
      </section>
    </main>
  );
}
