import { FormEvent, useState } from "react";
import { Star } from "lucide-react";
import { DealTicket, GameState, redeemPromoCode } from "../lib/gameApi";
import { formatTicketDetails, KIND_LABELS, STATUS_LABELS } from "../lib/dealLabels";
import { AdminTickets } from "../admin/AdminTickets";
import { DealTicketModal } from "../components/DealTicketModal";
import { GoldAmount } from "../components/GoldAmount";
import { PlusModal } from "../components/PlusModal";
import { TicketAmount } from "../components/TicketAmount";
import { DealFlow, TicketTypeModal } from "../components/TicketTypeModal";
import { WithdrawModal } from "../components/WithdrawModal";
import { RANK_META } from "../lib/ranks";
import { RankRewardsModal } from "../components/RankRewardsModal";

type ProfileScreenProps = {
  state: GameState;
  onUpdate: (state: GameState) => void;
  adminToken: string | null;
  onAdminAuthLost: () => void;
};

function TicketRow({ ticket }: { ticket: DealTicket }) {
  const status = STATUS_LABELS[ticket.status];
  return (
    <li className="list-row">
      <div>
        <p className="list-title">
          Тикет №{ticket.number} · {KIND_LABELS[ticket.kind]}
          {ticket.is_premium && <span className="badge badge-premium">Премиум</span>}
        </p>
        <p className="hint">{formatTicketDetails(ticket)}</p>
        <TicketAmount ticket={ticket} />
      </div>
      <span className={`badge ${status.className}`}>{status.text}</span>
    </li>
  );
}

export function ProfileScreen({ state, onUpdate, adminToken, onAdminAuthLost }: ProfileScreenProps) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [dealFlow, setDealFlow] = useState<DealFlow | null>(null);
  const [showRanks, setShowRanks] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  const handlePromoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = promoCode.trim();
    if (!code || promoSubmitting) return;

    setPromoSubmitting(true);
    setPromoError(null);
    setPromoSuccess(false);
    try {
      const nextState = await redeemPromoCode(code);
      onUpdate(nextState);
      setPromoCode("");
      setPromoSuccess(true);
    } catch (error) {
      setPromoError(error instanceof Error ? error.message : "Не удалось активировать промокод.");
    } finally {
      setPromoSubmitting(false);
    }
  };

  return (
    <section className="profile-screen">
      <div className="profile-head-row">
        <div>
          <h1 className="page-title">Профиль</h1>
          <p className="page-subtitle">Баланс, статистика и история сделок</p>
          {adminToken && (
            <div className="admin-banner">
              <span className="badge badge-success">Администратор</span>
              <button type="button" className="btn btn-secondary" onClick={onAdminAuthLost}>
                Выйти из админки
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="plus-star-btn"
          aria-label="GGZOMBIX PLUS"
          title="GGZOMBIX PLUS"
          onClick={() => setShowPlus(true)}
        >
          <Star size={24} fill="currentColor" />
        </button>
      </div>

      <div className="panel rank-panel">
        <div className="rank-header">
          <div className="rank-info">
            <span className="rank-nickname">{state.nickname ?? "Игрок"}</span>
            <button
              type="button"
              className="rank-badge rank-badge-clickable"
              style={{
                color: RANK_META[state.rank.index].color,
                borderColor: RANK_META[state.rank.index].color,
              }}
              onClick={() => setShowRanks(true)}
            >
              {state.rank.name}
            </button>
          </div>
          <span className="rank-xp-text">
            {state.rank.isMaxRank
              ? `${state.xp} XP`
              : `${state.xp} / ${state.rank.nextThreshold} XP`}
          </span>
        </div>
        <div className="rank-progress-bar">
          <div
            className="rank-progress-fill"
            style={{
              width: `${state.rank.progressPct}%`,
              background: RANK_META[state.rank.index].gradient,
            }}
          />
        </div>
        {!state.rank.isMaxRank && (
          <p className="hint rank-next-hint">
            До ранга {RANK_META[state.rank.index + 1].name}: {state.rank.nextThreshold - state.xp} XP
          </p>
        )}
      </div>

      <div className="stat-grid">
        <div className="panel stat-card">
          <span className="stat-label">Баланс</span>
          <strong className="stat-value">
            <GoldAmount amount={state.gold} />
          </strong>
          <div className="deal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setChooserOpen(true)}>
              Создать тикет
            </button>
          </div>
        </div>
        <div className="panel stat-card">
          <span className="stat-label">Открыто кейсов</span>
          <strong className="stat-value">{state.searches}</strong>
        </div>
        <div className="panel stat-card">
          <span className="stat-label">Предметов в инвентаре</span>
          <strong className="stat-value">{state.loot.length}</strong>
        </div>
      </div>

      <section className="panel promo-panel">
        <div className="section-head">
          <div>
            <h2 className="section-title">Промокоды</h2>
            <p className="hint">Введите код, чтобы получить бонус на баланс</p>
          </div>
        </div>
        <form className="promo-form" onSubmit={handlePromoSubmit}>
          <input
            type="text"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value)}
            placeholder="Введите промокод"
            autoComplete="off"
            maxLength={40}
            aria-label="Промокод"
          />
          <button type="submit" className="btn btn-primary" disabled={!promoCode.trim() || promoSubmitting}>
            {promoSubmitting ? "Проверяем..." : "Активировать"}
          </button>
        </form>
        {promoError && <p className="error-text" role="alert">{promoError}</p>}
        {promoSuccess && <p className="promo-success" role="status">Промокод активирован. На баланс начислено 10 000 голды.</p>}
      </section>

      <div className="panel">
        <h2 className="section-title">{adminToken ? "Тикеты игроков" : "Мои тикеты"}</h2>
        {adminToken ? (
          <AdminTickets accessToken={adminToken} onAuthLost={onAdminAuthLost} />
        ) : state.tickets.length === 0 ? (
          <p className="hint">Здесь появятся ваши тикеты на вывод и пополнение.</p>
        ) : (
          <ul className="list">
            {state.tickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        )}
      </div>

      {chooserOpen && (
        <TicketTypeModal
          onClose={() => setChooserOpen(false)}
          onPick={(flow) => {
            setChooserOpen(false);
            setDealFlow(flow);
          }}
        />
      )}
      {dealFlow?.kind === "deposit" && (
        <DealTicketModal currency={dealFlow.currency} onClose={() => setDealFlow(null)} onUpdate={onUpdate} />
      )}
      {dealFlow?.kind === "withdraw" && (
        <WithdrawModal
          items={state.loot}
          currency={dealFlow.currency}
          onClose={() => setDealFlow(null)}
          onUpdate={onUpdate}
        />
      )}
      {showRanks && (
        <RankRewardsModal currentIndex={state.rank.index} onClose={() => setShowRanks(false)} />
      )}
      {showPlus && (
        <PlusModal gold={state.gold} onClose={() => setShowPlus(false)} onUpdate={onUpdate} />
      )}
    </section>
  );
}
