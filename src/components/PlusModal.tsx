import { FormEvent, useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { createPremiumTicket, GameState, redeemPromoCode } from "../lib/gameApi";
import { GoldAmount } from "./GoldAmount";

type PlusModalProps = {
  gold: number;
  onClose: () => void;
  onUpdate: (state: GameState) => void;
};

export function PlusModal({ gold, onClose, onUpdate }: PlusModalProps) {
  const [showPurchase, setShowPurchase] = useState(false);
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [telegram, setTelegram] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting && !promoSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, submitting, promoSubmitting]);

  const handlePurchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!nickname.trim() || !location.trim() || !telegram.trim()) {
      setError("Заполните все поля.");
      return;
    }
    setSubmitting(true);
    try {
      const state = await createPremiumTicket({ nickname, location, telegram });
      onUpdate(state);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать тикет.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = promoCode.trim();
    if (!code || promoSubmitting) return;
    setPromoSubmitting(true);
    setPromoError(null);
    setPromoSuccess(false);
    try {
      const state = await redeemPromoCode(code);
      onUpdate(state);
      setPromoCode("");
      setPromoSuccess(true);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Не удалось активировать промокод.");
    } finally {
      setPromoSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !submitting && !promoSubmitting && onClose()}>
      <div
        className="modal plus-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plus-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="plus-close-btn"
          aria-label="Закрыть"
          onClick={() => !submitting && !promoSubmitting && onClose()}
        >
          <X size={20} />
        </button>

        <div className="plus-header">
          <div className="plus-star-circle">
            <Star size={32} fill="currentColor" />
          </div>
          <h2 id="plus-modal-title" className="plus-title">GGZOMBIX PLUS</h2>
        </div>

        <div className="plus-benefits">
          <p className="plus-benefits-label">Привилегии:</p>
          <ul className="plus-benefits-list">
            <li>2 Кейса каждый день</li>
            <li>5% бонус к выводу</li>
            <li>Вип кейс</li>
            <li>Уникальный статус (PLUS)</li>
            <li>Кешбек 5% с каждого открытого кейса (раз в неделю)</li>
          </ul>
        </div>

        {showPurchase ? (
          <form className="modal-form" onSubmit={handlePurchase}>
            <p className="plus-price-text">
              Стоимость: <GoldAmount amount={500} />
            </p>
            <label className="field">
              <span>Ник</span>
              <input value={nickname} maxLength={32} onChange={(event) => setNickname(event.target.value)} />
            </label>
            <label className="field">
              <span>Локация</span>
              <input value={location} maxLength={64} onChange={(event) => setLocation(event.target.value)} />
            </label>
            <label className="field">
              <span>Юз телеграм</span>
              <input value={telegram} maxLength={64} onChange={(event) => setTelegram(event.target.value)} />
            </label>

            {error && <p className="error-text" role="alert">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPurchase(false)} disabled={submitting}>
                Назад
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || gold < 500}>
                {submitting ? "Создаем..." : "Купить за 500 голды"}
              </button>
            </div>
            {gold < 500 && <p className="hint plus-gold-warn">Недостаточно голды на балансе.</p>}
          </form>
        ) : (
          <button type="button" className="btn btn-primary btn-block plus-buy-btn" onClick={() => setShowPurchase(true)}>
            <GoldAmount amount={500} />
          </button>
        )}

        <div className="plus-promo-divider" />

        <form className="promo-form" onSubmit={handlePromoSubmit}>
          <input
            type="text"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="Промокод для премиума"
            autoComplete="off"
            maxLength={40}
            aria-label="Промокод для премиума"
          />
          <button type="submit" className="btn btn-secondary" disabled={!promoCode.trim() || promoSubmitting}>
            {promoSubmitting ? "Проверяем..." : "Активировать"}
          </button>
        </form>
        {promoError && <p className="error-text" role="alert">{promoError}</p>}
        {promoSuccess && <p className="promo-success" role="status">Промокод активирован!</p>}
      </div>
    </div>
  );
}
