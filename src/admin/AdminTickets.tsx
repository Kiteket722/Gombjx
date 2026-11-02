import { useCallback, useEffect, useState } from "react";
import { AdminAuthError, banPlayer, cancelTicket, completeTicket, fetchAllTickets } from "../lib/adminApi";
import { KIND_LABELS, STATUS_LABELS, formatTicketDetails } from "../lib/dealLabels";
import type { DealTicket } from "../lib/gameApi";
import { TicketAmount } from "../components/TicketAmount";

const POLL_INTERVAL_MS = 4000;

type AdminTicketsProps = {
  accessToken: string;
  onAuthLost: () => void;
};

export function AdminTickets({ accessToken, onAuthLost }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<DealTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setTickets(await fetchAllTickets(accessToken));
      setError(null);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        onAuthLost();
        return;
      }
      setError(err instanceof Error ? err.message : "Не удалось загрузить тикеты.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, onAuthLost]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const runAction = async (ticket: DealTicket, action: (token: string, id: string) => Promise<void>, question: string) => {
    if (!window.confirm(question)) return;
    setBusyId(ticket.id);
    setError(null);
    try {
      await action(accessToken, ticket.id);
      await refresh();
    } catch (err) {
      if (err instanceof AdminAuthError) {
        onAuthLost();
        return;
      }
      setError(err instanceof Error ? err.message : "Не удалось выполнить действие.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-tickets">
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="loading-text">Загрузка тикетов...</p>}
      {!loading && tickets.length === 0 && <p className="empty-state">Тикетов пока нет.</p>}

      <ul className="list">
        {tickets.map((ticket) => {
          const status = STATUS_LABELS[ticket.status];
          const isOpen = ticket.status === "in_progress";
          const isBusy = busyId === ticket.id;
          return (
            <li key={ticket.id} className="list-row admin-ticket">
              <div>
                <p className="list-title">
                  Тикет №{ticket.number} · {KIND_LABELS[ticket.kind]} · <TicketAmount ticket={ticket} />
                  {ticket.is_premium && <span className="badge badge-premium">Премиум</span>}
                </p>
                <p className="hint">{formatTicketDetails(ticket)}</p>
              </div>
              <div className="admin-ticket-actions">
                <span className={`badge ${status.className}`}>{status.text}</span>
                {isOpen && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isBusy}
                      onClick={() => runAction(ticket, completeTicket, `Завершить тикет №${ticket.number}?`)}
                    >
                      Завершить
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={isBusy}
                      onClick={() => runAction(ticket, cancelTicket, `Отменить тикет №${ticket.number}?`)}
                    >
                      Отменить
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={isBusy}
                  onClick={() => runAction(ticket, banPlayer, `Заблокировать игрока из тикета №${ticket.number}?`)}
                >
                  Бан
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
