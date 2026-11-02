export type Rarity = "common" | "rare" | "epic" | "mythic" | "legendary" | "unique";

export const RARITY_INFO: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Обычный", color: "#9ca3af" },
  rare: { label: "Редкий", color: "#4ade80" },
  epic: { label: "Эпический", color: "#60a5fa" },
  mythic: { label: "Мифический", color: "#a855f7" },
  legendary: { label: "Легендарный", color: "#fb923c" },
  unique: { label: "Уникальный", color: "#f87171" },
};
