export const GOLD_PER_RUB = 2.5;
export const MIN_DEPOSIT_GOLD = 25;
export const MIN_DEPOSIT_RUB = 10;

export function goldToRub(gold: number): number {
  return Math.round(gold / GOLD_PER_RUB);
}

export function rubToGold(rub: number): number {
  return Math.round(rub * GOLD_PER_RUB);
}

export function formatRub(rub: number): string {
  return `${Math.round(rub).toLocaleString("ru-RU")} ₽`;
}
