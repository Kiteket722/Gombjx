export const RARITIES = ["common", "rare", "epic", "mythic", "legendary", "unique"] as const;
export type Rarity = (typeof RARITIES)[number];

export const MAX_LEVEL = 5;
const LEVEL_MULTIPLIERS = [1, 1.5, 2, 3, 4.5];
const UPGRADE_CHANCE_MIN = 0.1;
const UPGRADE_CHANCE_MAX = 0.5;
const REFERENCE_PRICE = 1000;

type FixedPriceItem = { key: string; name: string; rarity: Rarity; basePrice: number };
type RandomPriceItem = { key: string; name: string; rarity: Rarity; priceRange: { min: number; max: number } };
type ItemDef = FixedPriceItem | RandomPriceItem;

const ITEMS: ItemDef[] = [
  { key: "farm-berry", name: "Ягода", rarity: "common", priceRange: { min: 0.1, max: 0.8 } },
  { key: "pumpkin-farm-berry", name: "Ягода", rarity: "common", priceRange: { min: 0.3, max: 1.2 } },
  { key: "berries", name: "Красные ягоды", rarity: "common", basePrice: 4 },
  { key: "rock", name: "Ткань", rarity: "common", basePrice: 5 },
  { key: "bat", name: "Бита", rarity: "common", basePrice: 7 },
  { key: "medkit", name: "Аптечка", rarity: "rare", basePrice: 22 },
  { key: "pickaxe", name: "Ремки", rarity: "rare", basePrice: 28 },
  { key: "leather-helmet", name: "Кожанный шлем", rarity: "rare", basePrice: 32 },
  { key: "glock", name: "Глок", rarity: "epic", basePrice: 45 },
  { key: "rifle", name: "Снайперская винтовка", rarity: "epic", basePrice: 60 },
  { key: "pistol", name: "Ор иник", rarity: "mythic", basePrice: 120 },
  { key: "ak47", name: "АК-47", rarity: "mythic", basePrice: 160 },
  { key: "pumpkin", name: "Легендарная тыква", rarity: "legendary", basePrice: 550 },
  { key: "gold-helmet", name: "Голд шлем", rarity: "legendary", basePrice: 900 },
  { key: "badge", name: "Пасс", rarity: "unique", basePrice: 3000 },
  { key: "rpg", name: "РПГ", rarity: "rare", basePrice: 45 },
  { key: "cosmo", name: "Космо", rarity: "epic", basePrice: 90 },
  { key: "pp", name: "ПП", rarity: "rare", basePrice: 38 },
  { key: "minigun", name: "Миниган", rarity: "legendary", basePrice: 240 },
  { key: "freeze", name: "Заморозка", rarity: "legendary", basePrice: 220 },
  { key: "boots", name: "6 ботинки", rarity: "rare", basePrice: 35 },
  { key: "acid", name: "Кислотка", rarity: "mythic", basePrice: 150 },
  { key: "pumpkin-unique", name: "Тыква", rarity: "unique", basePrice: 750 },
  { key: "emotion", name: "Эмоция", rarity: "unique", basePrice: 850 },
  { key: "titan", name: "Тит", rarity: "unique", basePrice: 2400 },
  { key: "spike", name: "Шип", rarity: "unique", basePrice: 1800 },
  { key: "shotgun", name: "Дробовик", rarity: "epic", basePrice: 110 },
  { key: "avia", name: "Авиа", rarity: "mythic", basePrice: 220 },
  { key: "moto-helmet", name: "Мото шлем", rarity: "rare", basePrice: 60 },
];

// Weights are percentages of a case opening and sum to 100 per case.
// In every case the priciest item drops less often than the mid-priced items in that case.
const CASE_DEFS: { key: string; name: string; price: number; category: "main" | "named"; available?: boolean; weights: Record<string, number> }[] = [
  {
    key: "farm-tykvy",
    name: "Фарм тыквы",
    price: 1,
    category: "main",
    weights: { "pumpkin-farm-berry": 99, pumpkin: 1 },
  },
  {
    key: "bomzh",
    name: "Бомж",
    price: 10,
    category: "main",
    weights: { berries: 40, rock: 35, bat: 25 },
  },
  {
    key: "novichok",
    name: "Новичок",
    price: 25,
    category: "main",
    weights: { berries: 28, rock: 20, bat: 20, medkit: 12, pickaxe: 11, "leather-helmet": 9 },
  },
  {
    key: "reider",
    name: "Рейдер",
    price: 50,
    category: "main",
    weights: { berries: 10, rock: 10, bat: 10, medkit: 14, pickaxe: 14, "leather-helmet": 14, glock: 20, rifle: 8 },
  },
  {
    key: "farmer",
    name: "Фармер",
    price: 100,
    category: "main",
    weights: { berries: 5, rock: 5, bat: 5, medkit: 10, pickaxe: 10, "leather-helmet": 10, glock: 17, rifle: 15, pistol: 13, ak47: 10 },
  },
  {
    key: "pervyi-general",
    name: "Первый генерал",
    price: 250,
    category: "main",
    weights: {
      berries: 2, rock: 3, bat: 3, medkit: 6, pickaxe: 7, "leather-helmet": 7,
      glock: 12, rifle: 13, pistol: 17, ak47: 18, pumpkin: 6, "gold-helmet": 6,
    },
  },
  {
    key: "31-general",
    name: "31 Генерал",
    price: 380,
    category: "main",
    weights: {
      berries: 8, rock: 4, bat: 4, medkit: 6, pickaxe: 6, "leather-helmet": 7,
      glock: 8, rifle: 10, pistol: 12, ak47: 12, pumpkin: 8, "gold-helmet": 7, badge: 3,
      rpg: 8, cosmo: 5, pp: 7, minigun: 3, freeze: 3, boots: 4, acid: 3, "pumpkin-unique": 1, emotion: 1,
    },
  },
  {
    key: "syn-kuroko",
    name: "Сын куроко",
    price: 600,
    category: "main",
    weights: {
      berries: 1, rock: 1, bat: 1, medkit: 3, pickaxe: 3, "leather-helmet": 4,
      glock: 4, rifle: 6, pistol: 6, ak47: 8, pumpkin: 6, "gold-helmet": 8, badge: 3,
      rpg: 8, cosmo: 6, pp: 7, minigun: 3, freeze: 3, boots: 4, acid: 3, "pumpkin-unique": 2, emotion: 2,
      shotgun: 3, avia: 2, "moto-helmet": 3,
    },
  },
  {
    key: "velikiy",
    name: "Великий",
    price: 1000,
    category: "main",
    weights: {
      medkit: 1, pickaxe: 2, "leather-helmet": 3, glock: 3, rifle: 5,
      pistol: 6, ak47: 8, pumpkin: 7, "gold-helmet": 8, badge: 4,
      rpg: 7, cosmo: 7, pp: 6, minigun: 5, freeze: 5, boots: 4, acid: 3, "pumpkin-unique": 2, emotion: 1,
      titan: 1, spike: 2, shotgun: 4, avia: 3, "moto-helmet": 3,
    },
  },
  {
    key: "wizardy",
    name: "Визарды",
    price: 150,
    category: "named",
    available: false,
    weights: {},
  },
];

// Free case: available once every 24 hours, costs no gold.
// Drops are capped at ~100 gold value. The best item (medkit at max level = 99)
// has an extremely low drop chance. Most rolls yield common items worth < 10 gold.
export const FREE_CASE_DEF = {
  key: "free",
  name: "Бесплатный кейс",
  price: 0,
  category: "free",
  weights: {
    "farm-berry": 70,
    berries: 15,
    rock: 9,
    bat: 5,
    medkit: 1,
  },
};

export type LevelInfo = { level: number; value: number; chance: number };

export type CaseItem = {
  name: string;
  rarity: Rarity;
  imageKey: string;
  chance: number;
  levels: LevelInfo[];
  priceRange: { min: number; max: number } | null;
};

export type CaseView = {
  key: string;
  name: string;
  price: number;
  category: "free" | "main" | "named";
  available: boolean;
  items: CaseItem[];
};

export type CaseDrop = { name: string; rarity: Rarity; imageKey: string; level: number; value: number };

function upgradeChance(basePrice: number) {
  const raw = 0.5 * (1 - basePrice / REFERENCE_PRICE);
  return Math.min(UPGRADE_CHANCE_MAX, Math.max(UPGRADE_CHANCE_MIN, raw));
}

// Each level above the first is reached with the same chance, so a pricier item rolls high levels less often.
function levelChances(basePrice: number): number[] {
  const q = upgradeChance(basePrice);
  const chances = Array.from({ length: MAX_LEVEL - 1 }, (_, index) => (1 - q) * q ** index);
  chances.push(q ** (MAX_LEVEL - 1));
  return chances;
}

function levelValue(basePrice: number, level: number) {
  return Math.max(1, Math.round(basePrice * LEVEL_MULTIPLIERS[level - 1]));
}

function buildLevels(item: FixedPriceItem): LevelInfo[] {
  return levelChances(item.basePrice).map((probability, index) => ({
    level: index + 1,
    value: levelValue(item.basePrice, index + 1),
    chance: Math.round(probability * 1000) / 10,
  }));
}

const ITEM_BY_KEY = new Map(ITEMS.map((item) => [item.key, item]));

type CaseDef = { key: string; name: string; price: number; category: "free" | "main" | "named"; available?: boolean; weights: Record<string, number> };

function buildCase(def: CaseDef): CaseView {
  const items: CaseItem[] = Object.entries(def.weights).map(([key, weight]) => {
    const item = ITEM_BY_KEY.get(key)!;
    if ("priceRange" in item) {
      return { name: item.name, rarity: item.rarity, imageKey: item.key, chance: weight, levels: [], priceRange: item.priceRange };
    }
    return {
      name: item.name,
      rarity: item.rarity,
      imageKey: item.key,
      chance: weight,
      levels: buildLevels(item),
      priceRange: null,
    };
  });
  return {
    key: def.key,
    name: def.name,
    price: def.price,
    category: def.category,
    available: def.available ?? true,
    items,
  };
}

export const CASES: CaseView[] = CASE_DEFS.map(buildCase);

export const FREE_CASE: CaseView = buildCase(FREE_CASE_DEF);

export function findCase(key: unknown): CaseView | undefined {
  return CASES.find((caseView) => caseView.key === key);
}

function rollRandomPrice(range: { min: number; max: number }, randomInt: (max: number) => number) {
  const minCents = Math.round(range.min * 100);
  const spanCents = Math.round(range.max * 100) - minCents + 1;
  return (minCents + randomInt(spanCents)) / 100;
}

export function rollCaseDrop(caseKey: string, randomInt: (max: number) => number): CaseDrop {
  const def = CASE_DEFS.find((candidate) => candidate.key === caseKey) ??
    (caseKey === FREE_CASE_DEF.key ? FREE_CASE_DEF : undefined);
  if (!def) throw new Error(`Case not found: ${caseKey}`);
  const itemRoll = randomInt(100);
  let cumulative = 0;
  let selectedKey = Object.keys(def.weights)[0];
  for (const [key, weight] of Object.entries(def.weights)) {
    cumulative += weight;
    if (itemRoll < cumulative) {
      selectedKey = key;
      break;
    }
  }
  const item = ITEM_BY_KEY.get(selectedKey)!;

  if ("priceRange" in item) {
    return {
      name: item.name,
      rarity: item.rarity,
      imageKey: item.key,
      level: 1,
      value: rollRandomPrice(item.priceRange, randomInt),
    };
  }

  const levelRoll = randomInt(1_000_000) / 1_000_000;
  let level = MAX_LEVEL;
  let levelCumulative = 0;
  const chances = levelChances(item.basePrice);
  for (let index = 0; index < chances.length; index++) {
    levelCumulative += chances[index];
    if (levelRoll < levelCumulative) {
      level = index + 1;
      break;
    }
  }

  return {
    name: item.name,
    rarity: item.rarity,
    imageKey: item.key,
    level,
    value: levelValue(item.basePrice, level),
  };
}
