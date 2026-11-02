export const ITEM_IMAGES: Record<string, string> = {
  berries: "/rewards/inventory/IMG_5178.webp",
  "farm-berry": "/rewards/inventory/IMG_5178.webp",
  "pumpkin-farm-berry": "/rewards/inventory/IMG_5178.webp",
  rock: "/rewards/inventory/IMG_5176.jpeg",
  pickaxe: "/rewards/inventory/IMG_5175.jpeg",
  medkit: "/rewards/inventory/IMG_5177.webp",
  "leather-helmet": "/rewards/inventory/IMG_5212.jpeg",
  "gold-helmet": "/rewards/inventory/IMG_5213.jpeg",
  bat: "/rewards/inventory/IMG_5211.jpeg",
  glock: "/rewards/inventory/IMG_5215.jpeg",
  ak47: "/rewards/inventory/IMG_5214.jpeg",
  rifle: "/rewards/inventory/IMG_5208.jpeg",
  pistol: "/rewards/inventory/IMG_5209.jpeg",
  pumpkin: "/rewards/inventory/pumpkin.png",
  titan: "/rewards/inventory/IMG_5256.jpeg",
  shotgun: "/rewards/inventory/IMG_5257.jpeg",
  spike: "/rewards/inventory/IMG_5258.jpeg",
  avia: "/rewards/inventory/IMG_5259.jpeg",
  "moto-helmet": "/rewards/inventory/IMG_5260.jpeg",
  badge: "/rewards/inventory/IMG_5210.jpeg",
  rpg: "/rewards/inventory/IMG_5248.jpeg",
  cosmo: "/rewards/inventory/IMG_5247.jpeg",
  pp: "/rewards/inventory/IMG_5246.jpeg",
  minigun: "/rewards/inventory/IMG_5245.jpeg",
  freeze: "/rewards/inventory/IMG_5245.jpeg",
  boots: "/rewards/inventory/IMG_5245.jpeg",
  acid: "/rewards/inventory/IMG_5245.jpeg",
  "pumpkin-unique": "/rewards/inventory/IMG_5244.jpeg",
  emotion: "/rewards/inventory/IMG_5244.jpeg",
};

export const CASE_COVER = "/rewards/inventory/IMG_5210.jpeg";

const CASE_COVERS: Record<string, string> = {
  bomzh: "/rewards/inventory/IMG_5262.jpeg",
  novichok: "/rewards/inventory/IMG_5263.jpeg",
  reider: "/rewards/inventory/IMG_5264.jpeg",
  farmer: "/rewards/inventory/IMG_5265.jpeg",
  "pervyi-general": "/rewards/inventory/IMG_5270.jpeg",
  "31-general": "/case 31 генерал/IMG_5272.jpeg",
  "syn-kuroko": "/сын куроко/IMG_5273.jpeg",
  velikiy: "/великий/IMG_5274.jpeg",
  "farm-tykvy": "/rewards/inventory/IMG_5262.jpeg",
  wizardy: "/rewards/inventory/IMG_5251.jpeg",
};

const CASE_COVER_OVERLAYS: Record<string, string> = {
  "farm-tykvy": ITEM_IMAGES.pumpkin,
};

export function getCaseCover(caseKey: string) {
  return CASE_COVERS[caseKey] ?? CASE_COVER;
}

export function getCaseCoverOverlay(caseKey: string) {
  return CASE_COVER_OVERLAYS[caseKey] ?? null;
}

export const GOLD_ICON = "/rewards/inventory/IMG_5337.jpeg";

export const TARGET_TIERS = [100, 200, 350, 500, 800, 1000, 2000, 3000];

export const MIN_WITHDRAW = 25;
export const MIN_WITHDRAW_ITEM_VALUE = 25;

export function formatChance(chance: number) {
  return `${Number.isInteger(chance) ? chance : chance.toFixed(1)}%`;
}
