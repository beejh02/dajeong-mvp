"use client";

import type {
  KioskOptionGroup,
  SelectedOptionGroup,
} from "../kioskCart";

type KioskOptionDialogProps = {
  item: {
    name: string;
    description: string;
    price: number;
    optionGroups: KioskOptionGroup[];
  };
  selectedOptionGroups: SelectedOptionGroup[];
  unitPrice: number;
  validationMessage: string | null;
  formatPrice: (price: number) => string;
  onCancel: () => void;
  onConfirm: () => void;
  onToggleChoice: (groupId: string, choiceId: string) => void;
};

function getSelectedChoiceIds(
  selectedOptionGroups: SelectedOptionGroup[],
  groupId: string,
) {
  return (
    selectedOptionGroups.find((group) => group.groupId === groupId)?.choiceIds ??
    []
  );
}

export default function KioskOptionDialog({
  item,
  selectedOptionGroups,
  unitPrice,
  validationMessage,
  formatPrice,
  onCancel,
  onConfirm,
  onToggleChoice,
}: KioskOptionDialogProps) {
  const optionPrice = unitPrice - item.price;

  return (
    <section
      className="kiosk-option-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kiosk-option-title"
    >
      <div className="kiosk-option-dialog">
        <div className="kiosk-option-header">
          <div>
            <p className="kiosk-option-kicker">MENU OPTION</p>
            <h2 id="kiosk-option-title">{item.name}</h2>
          </div>
          <strong>₩ {formatPrice(unitPrice)}</strong>
        </div>

        <p className="kiosk-option-description">{item.description}</p>

        <div className="kiosk-option-list">
          {item.optionGroups.map((group) => {
            const selectedChoiceIds = getSelectedChoiceIds(
              selectedOptionGroups,
              group.id,
            );

            return (
              <section key={group.id} className="kiosk-option-group">
                <div className="kiosk-option-group-header">
                  <h3>{group.title}</h3>
                  {group.required && (
                    <span className="kiosk-option-required">필수</span>
                  )}
                </div>

                <div className="kiosk-option-group-choices">
                  {group.choices.map((choice) => {
                    const isSelected = selectedChoiceIds.includes(choice.id);

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        className={`kiosk-option-row ${
                          isSelected ? "active" : ""
                        }`}
                        aria-pressed={isSelected}
                        onClick={() => onToggleChoice(group.id, choice.id)}
                      >
                        <span>{choice.name}</span>
                        {choice.priceDelta > 0 && (
                          <strong>+₩ {formatPrice(choice.priceDelta)}</strong>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="kiosk-option-price-preview">
          <span>상품 금액 ₩ {formatPrice(item.price)}</span>
          <span>옵션 추가 ₩ {formatPrice(optionPrice)}</span>
          <strong>총 상품 금액 ₩ {formatPrice(unitPrice)}</strong>
        </div>

        {validationMessage && (
          <p className="kiosk-option-validation" role="alert">
            {validationMessage}
          </p>
        )}

        <div className="kiosk-option-actions">
          <button type="button" className="kiosk-secondary-btn" onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            className="kiosk-primary-btn"
            onClick={onConfirm}
            disabled={Boolean(validationMessage)}
          >
            담기
          </button>
        </div>
      </div>
    </section>
  );
}
