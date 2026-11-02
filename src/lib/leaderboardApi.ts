import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export const LEADERBOARD_SIZE = 20;

export type SpendingEntry = {
  player_id: string;
  display_name: string;
  total_spent: number;
  xp: number;
};

const UNEXPECTED_RESPONSE = "Не удалось загрузить таблицу лидеров.";

function isSpendingEntry(value: unknown): value is SpendingEntry {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.player_id === "string" &&
    typeof row.display_name === "string" &&
    typeof row.total_spent === "number" &&
    typeof row.xp === "number"
  );
}

export async function fetchTopSpenders(): Promise<SpendingEntry[]> {
  const { data, error } = await supabase
    .from("player_spending")
    .select("player_id, display_name, total_spent, players!inner(xp,is_banned)")
    .not("players.is_banned", "is", true)
    .order("total_spent", { ascending: false })
    .limit(LEADERBOARD_SIZE);
  if (error) throw new Error(UNEXPECTED_RESPONSE);
  if (!Array.isArray(data)) throw new Error(UNEXPECTED_RESPONSE);
  const entries = data.map((row) => {
    const playerData = row.players as unknown;
    const xp = typeof playerData === "object" && playerData !== null && "xp" in playerData
      ? (playerData as { xp: number }).xp
      : 0;
    return {
      player_id: row.player_id,
      display_name: row.display_name,
      total_spent: row.total_spent,
      xp,
    } satisfies SpendingEntry;
  });
  if (!entries.every(isSpendingEntry)) throw new Error(UNEXPECTED_RESPONSE);
  return entries;
}

export function subscribeToSpending(onChange: () => void): RealtimeChannel {
  return supabase
    .channel("player-spending")
    .on("postgres_changes", { event: "*", schema: "public", table: "player_spending" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "players" }, onChange)
    .subscribe();
}
