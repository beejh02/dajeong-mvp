import type {
  CardAction,
  CardActionType,
  DajeongCard,
} from "../../../lib/gemini/cardSchema";

type ChatCardRendererProps = {
  card: DajeongCard;
  onAction: (
    actionType: CardActionType,
    value?: string,
    label?: string,
  ) => void;
};

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function renderActionButtons(
  actions: CardAction[] | undefined,
  onAction: ChatCardRendererProps["onAction"],
) {
  if (!actions?.length) return null;

  return (
    <div className="chat-card-actions">
      {actions.map((action, index) => (
        <button
          key={`${action.type}-${action.value ?? action.label}-${index}`}
          onClick={() => onAction(action.type, action.value, action.label)}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export function ChatCardRenderer({
  card,
  onAction,
}: ChatCardRendererProps) {
  switch (card.type) {
    case "message":
      return (
        <section className="chat-card chat-card-message">
          <h3>{card.title}</h3>
          <p>{card.message}</p>
        </section>
      );

    case "menu_candidates":
      return (
        <section className="chat-card chat-card-menu">
          <h3>{card.title}</h3>
          <p>{card.message}</p>
          <ul className="chat-card-menu-list">
            {card.candidates.map((candidate, index) => {
              const action =
                card.actions.find(
                  (candidateAction) => candidateAction.value === candidate.menuId,
                ) ?? card.actions[index];

              return (
                <li key={candidate.menuId}>
                  <div>
                    <strong>{candidate.name}</strong>
                    <span>{formatPrice(candidate.price)}</span>
                  </div>
                  <p>{candidate.description}</p>
                  {action ? (
                    <button
                      onClick={() =>
                        onAction(action.type, action.value, action.label)
                      }
                      type="button"
                    >
                      {action.label}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      );

    case "missing_option":
      return (
        <section className="chat-card chat-card-options">
          <h3>{card.title}</h3>
          <p>{card.question}</p>
          <div className="chat-card-actions">
            {card.options.map((option, index) => {
              const action = card.actions[index];

              return (
                <button
                  key={option.value}
                  onClick={() =>
                    onAction(
                      action?.type ?? "select_option",
                      action?.value ?? option.value,
                      action?.label ?? option.label,
                    )
                  }
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>
      );

    case "order_draft":
      return (
        <section className="chat-card chat-card-draft">
          <h3>{card.title}</h3>
          <dl className="chat-card-details">
            <div>
              <dt>기업</dt>
              <dd>{card.companyName}</dd>
            </div>
            {card.items.map((item, index) => (
              <div key={`${item.menuName}-${index}`}>
                <dt>{item.menuName}</dt>
                <dd>
                  <span>{item.quantity}개</span>
                  {item.options.length ? (
                    <span>{item.options.join(" / ")}</span>
                  ) : null}
                  <strong>{formatPrice(item.price)}</strong>
                </dd>
              </div>
            ))}
            <div>
              <dt>총액</dt>
              <dd>
                <strong>{formatPrice(card.totalPrice)}</strong>
              </dd>
            </div>
          </dl>
          {renderActionButtons(card.actions, onAction)}
        </section>
      );

    case "order_confirmed":
      return (
        <section className="chat-card chat-card-confirmed">
          <h3>{card.title}</h3>
          <p>{card.message}</p>
          <dl className="chat-card-details">
            <div>
              <dt>주문번호</dt>
              <dd>{card.orderNumber}</dd>
            </div>
            <div>
              <dt>대기번호</dt>
              <dd>{card.waitingNumber}</dd>
            </div>
            <div>
              <dt>총액</dt>
              <dd>{formatPrice(card.totalPrice)}</dd>
            </div>
          </dl>
        </section>
      );

    case "error":
      return (
        <section className="chat-card chat-card-error">
          <h3>{card.title}</h3>
          <p>{card.message}</p>
          {renderActionButtons(card.actions, onAction)}
        </section>
      );

    default:
      return (
        <section className="chat-card chat-card-error">
          <h3>지원하지 않는 카드</h3>
          <p>이 응답 카드는 현재 화면에서 표시할 수 없습니다.</p>
        </section>
      );
  }
}
