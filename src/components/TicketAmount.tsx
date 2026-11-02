import type { DealTicket } from "../lib/gameApi";
import { formatRub } from "../lib/currency";
import { GoldAmount } from "./GoldAmount";

export function TicketAmount({ ticket }: { ticket: DealTicket }) {
  if (ticket.currency === "rub" && ticket.rub_amount !== null) {
    return (
      <span className="ticket-rub-amount">
        <strong>{formatRub(ticket.rub_amount)}</strong>
        <span className="hint"> · {ticket.amount} голды</span>
      </span>
    );
  }
  return <GoldAmount amount={ticket.amount} />;
}
