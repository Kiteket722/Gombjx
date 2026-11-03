import { supabase } from "./supabaseClient";
import { RARITY_INFO, Rarity } from "./rarity";

export type PlayerStats = {
  best_drop_name: string | null;
  best_drop_rarity: Rarity | null;
  best_drop_image_key: string | null;
  best_drop_value: number | null;
  total_deposited: number;
};

const UNEXPECTED_RESPONSE = "Не удалось загрузить профиль игрока.";

function isRarity(value: unknown): value is Rarity {
  return typeof value === "string" && value in RARITY_INFO;
}

export async function fetchPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("best_drop_name, best_drop_rarity, best_drop_image_key, best_drop_value, total_deposited")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) throw new Error(UNEXPECTED_RESPONSE);
  if (data === null) return null;

  const row = data as Record<string, unknown>;
  const valid =
    (row.best_drop_name === null || typeof row.best_drop_name === "string") &&
    (row.best_drop_rarity === null || isRarity(row.best_drop_rarity)) &&
    (row.best_drop_image_key === null || typeof row.best_drop_image_key === "string") &&
    (row.best_drop_value === null || typeof row.best_drop_value === "number") &&
    typeof row.total_deposited === "number";
  if (!valid) throw new Error(UNEXPECTED_RESPONSE);

  return {
    best_drop_name: row.best_drop_name as string | null,
    best_drop_rarity: row.best_drop_rarity as Rarity | null,
    best_drop_image_key: row.best_drop_image_key as string | null,
    best_drop_value: row.best_drop_value as number | null,
    total_deposited: row.total_deposited as number,
  };
}
