import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAIL = "leftyk200@gmail.com";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TICKET_LIST_LIMIT = 200;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

class BadRequest extends Error {}

type TicketRow = {
  id: string;
  player_id: string;
  kind: "withdraw" | "deposit";
  amount: number;
  status: string;
  held_items: Record<string, unknown>[];
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request) {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || ADMIN_EMAIL.length === 0) return false;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return false;
  return data.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

async function handleList() {
  const { data, error } = await supabase
    .from("deal_tickets")
    .select("id, number, kind, currency, nickname, location, telegram, phone, bank, deal_time, amount, rub_amount, status, is_premium, created_at")
    .order("created_at", { ascending: false })
    .limit(TICKET_LIST_LIMIT);
  if (error) throw error;
  return json({ tickets: data });
}

async function claimTicket(ticketId: string, nextStatus: "completed" | "rejected") {
  const { data, error } = await supabase
    .from("deal_tickets")
    .update({ status: nextStatus })
    .eq("id", ticketId)
    .eq("status", "in_progress")
    .select("id, player_id, kind, amount, status, held_items")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new BadRequest("Тикет уже закрыт или не найден.");
  return data as TicketRow;
}

async function creditDeposit(ticket: TicketRow) {
  const { data: player, error: loadError } = await supabase
    .from("players")
    .select("gold")
    .eq("id", ticket.player_id)
    .single();
  if (loadError) throw loadError;

  const { error } = await supabase
    .from("players")
    .update({ gold: Math.round((player.gold + ticket.amount) * 100) / 100 })
    .eq("id", ticket.player_id);
  if (error) throw error;

  const { error: statsError } = await supabase.rpc("add_player_deposit", {
    p_player_id: ticket.player_id,
    p_amount: ticket.amount,
  });
  if (statsError) throw statsError;
}

async function restoreHeldItems(ticket: TicketRow) {
  if (ticket.held_items.length === 0) return;
  const { error } = await supabase
    .from("loot_items")
    .upsert(ticket.held_items, { onConflict: "id" });
  if (error) throw error;
}

async function handleComplete(ticketId: string) {
  const ticket = await claimTicket(ticketId, "completed");
  if (ticket.kind === "deposit") await creditDeposit(ticket);
  return json({ ok: true });
}

async function handleBan(ticketId: string) {
  const { data: ticket, error: lookupError } = await supabase
    .from("deal_tickets")
    .select("id, player_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!ticket) throw new BadRequest("Тикет не найден.");

  const { error: banError } = await supabase
    .from("players")
    .update({ is_banned: true })
    .eq("id", ticket.player_id);
  if (banError) throw banError;

  return json({ ok: true });
}

async function handleCancel(ticketId: string) {
  const ticket = await claimTicket(ticketId, "rejected");
  if (ticket.kind === "withdraw") await restoreHeldItems(ticket);
  return json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!(await requireAdmin(req))) {
      return json({ error: "Доступ запрещен." }, 403);
    }

    const body = (await req.json()) as { action?: unknown; ticketId?: unknown };
    if (body.action === "list") return await handleList();

    if (typeof body.ticketId !== "string" || !UUID_PATTERN.test(body.ticketId)) {
      throw new BadRequest("Некорректный тикет.");
    }
    if (body.action === "complete") return await handleComplete(body.ticketId);
    if (body.action === "cancel") return await handleCancel(body.ticketId);
    if (body.action === "ban") return await handleBan(body.ticketId);
    return json({ error: "Неизвестное действие." }, 400);
  } catch (err) {
    if (err instanceof BadRequest) {
      return json({ error: err.message }, 400);
    }
    console.error(err);
    return json({ error: "Что-то пошло не так. Попробуйте еще раз." }, 500);
  }
});
