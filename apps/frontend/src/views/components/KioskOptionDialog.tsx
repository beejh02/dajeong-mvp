"use client";

import type { KioskOption } from "../kioskCart";

type KioskOptionDialogProps = {
  item: {
    name: string;
    description: string;
    price: number;
    options: KioskOption[];
  };
  selectedOptionIds: string[];
  unitPrice: number;
  formatPrice: (price: number) => string;
  onCancel: () => void;
  onConfirm: () => void;
  onToggleOption: (optionId: string) => void;
};

export default function KioskOptionDialog({
  item,
  selectedOptionIds,
  unitPrice,
  formatPrice,
  onCancel,
  onConfirm,
  onToggleOption,
}: KioskOptionDialogProps) {
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
          {item.options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);

            return (
              <label key={option.id} className="kiosk-option-row">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleOption(option.id)}
                />
                <span>{option.name}</span>
                {option.priceDelta > 0 && (
                  <strong>+₩ {formatPrice(option.priceDelta)}</strong>
                )}
              </label>
            );
          })}
        </div>

        <div className="kiosk-option-actions">
          <button type="button" className="kiosk-secondary-btn" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="kiosk-primary-btn" onClick={onConfirm}>
            담기
          </button>
        </div>
      </div>
    </section>
  );
}
