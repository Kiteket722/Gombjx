import { FormEvent, useEffect, useState } from "react";
import { createDealTicket, DealCurrency, GameState } from "../lib/gameApi";
import { MIN_DEPOSIT_GOLD, MIN_DEPOSIT_RUB, rubToGold } from "../lib/currency";
import { GoldAmount } from "./GoldAmount";

type DealTicketModalProps = {
  currency: DealCurrency;
  onClose: () => void;
  onUpdate: (state: GameState) => void;
};

const isValidMoney = (value: number) => value > 0 && Number(value.toFixed(2)) === value;

export function DealTicketModal({ currency, onClose, onUpdate }: DealTicketModalProps) {
  const isRub = currency === "rub";
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [telegram, setTelegram] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = Number(amount);
  const goldPreview = isRub && isValidMoney(parsedAmount) ? rubToGold(parsedAmount) : null;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, submitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isRub) {
      if (!telegram.trim()) {
        setError("Заполните все поля.");
        return;
      }
      if (!isValidMoney(parsedAmount)) {
        setError("Сумма должна быть больше нуля и содержать не больше двух знаков после запятой.");
        return;
      }
      if (parsedAmount < MIN_DEPOSIT_RUB) {
        setError(`Минимальная сумма пополнения — ${MIN_DEPOSIT_RUB} ₽.`);
        return;
      }
    } else {
      if (!nickname.trim() || !location.trim() || !telegram.trim()) {
        setError("Заполните все поля.");
        return;
      }
      if (!isValidMoney(parsedAmount)) {
        setError("Сумма должна быть больше нуля и содержать не больше двух знаков после запятой.");
        return;
      }
      if (parsedAmount < MIN_DEPOSIT_GOLD) {
        setError(`Минимальная сумма пополнения — ${MIN_DEPOSIT_GOLD} голды.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const state = isRub
        ? await createDealTicket({ kind: "deposit", currency: "rub", telegram, rubAmount: parsedAmount })
        : await createDealTicket({ kind: "deposit", currency: "gold", nickname, location, telegram, amount: parsedAmount });
      onUpdate(state);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать тикет.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && onClose()}>
      <div
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deal-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="deal-modal-title" className="section-title">
          {isRub ? "Пополнение рублями" : "Пополнение голды"}
        </h2>
        <form className="modal-form" onSubmit={handleSubmit}>
          {!isRub && (
            <>
              <label className="field">
                <span>Ник в игре</span>
                <input value={nickname} maxLength={32} onChange={(event) => setNickname(event.target.value)} />
              </label>
              <label className="field">
                <span>Локация</span>
                <input value={location} maxLength={64} onChange={(event) => setLocation(event.target.value)} />
              </label>
            </>
          )}
          <label className="field">
            <span>Юз в телеграм</span>
            <input value={telegram} maxLength={64} onChange={(event) => setTelegram(event.target.value)} />
          </label>
          <label className="field">
            <span>{isRub ? "Сумма в рублях" : "Сумма"}</span>
            <input
              type="number"
              inputMode={isRub ? "decimal" : "numeric"}
              min={isRub ? MIN_DEPOSIT_RUB : MIN_DEPOSIT_GOLD}
              step={0.01}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          {goldPreview !== null && (
            <p className="hint deal-conversion">
              Вы получите: <GoldAmount amount={goldPreview} />
            </p>
          )}

          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Создаем..." : "Создать тикет"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
