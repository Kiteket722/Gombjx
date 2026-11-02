import { useEffect } from "react";
import type { DealCurrency, DealKind } from "../lib/gameApi";

export type DealFlow = { kind: DealKind; currency: DealCurrency };

type TicketTypeModalProps = {
  onPick: (flow: DealFlow) => void;
  onClose: () => void;
};

const OPTIONS: { flow: DealFlow; title: string; description: string }[] = [
  {
    flow: { kind: "withdraw", currency: "gold" },
    title: "Вывод за голду",
    description: "Выведите предметы из инвентаря в голде",
  },
  {
    flow: { kind: "withdraw", currency: "rub" },
    title: "Вывод за рубли",
    description: "Предметы на сумму в рублях. Курс: 2.5 голды = 1 ₽",
  },
  {
    flow: { kind: "deposit", currency: "gold" },
    title: "Пополнение голдой",
    description: "Укажите сумму, которую пополняете в голде",
  },
  {
    flow: { kind: "deposit", currency: "rub" },
    title: "Пополнение рублями",
    description: "Пополните в рублях, голда начислится. Курс: 1 ₽ = 2.5 голды",
  },
];

export function TicketTypeModal({ onPick, onClose }: TicketTypeModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-wide panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-type-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="ticket-type-title" className="section-title">Создать тикет</h2>
        <p className="hint">Выберите тип сделки</p>
        <div className="ticket-type-grid">
          {OPTIONS.map((option) => (
            <button
              key={`${option.flow.kind}-${option.flow.currency}`}
              type="button"
              className="ticket-type-card"
              onClick={() => onPick(option.flow)}
            >
              <span className="ticket-type-title">{option.title}</span>
              <span className="hint">{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
