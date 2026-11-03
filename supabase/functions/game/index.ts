import { createClient } from "npm:@supabase/supabase-js@2";
import {
  CASES,
  type CaseDrop,
  FREE_CASE,
  FREE_CASE_DEF,
  GUARANTEE_LENGTH,
  GUARANTEE_RARITY,
  GUARANTEE_RESET_RARITIES,
  findCase,
  rollCaseDrop,
} from "./catalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const START_GOLD = 500;
const TARGET_TIERS = [100, 200, 350, 500, 800, 1000, 2000, 3000];
const MAX_CHANCE = 80;
const MAX_EXTRA_ITEMS = 5;
const MIN_WITHDRAW = 25;
const MIN_WITHDRAW_ITEM_VALUE = 25;
const MIN_DEPOSIT_GOLD = 25;
const MIN_DEPOSIT_RUB = 10;
const MAX_CASES_PER_OPEN = 10;
const AUTO_SOLD_BERRY_KEY = "pumpkin-farm-berry";
const PROMO_REWARD = 10000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PLAYER_COLUMNS = "id, token, nickname, gold, searches, last_free_case_at, xp, is_banned";
const NICKNAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;
const NICKNAME_MAX_LENGTH = 24;
const LOOT_COLUMNS = "id, name, value, image_key, rarity, level, found_at";

class BadRequest extends Error {}

type Player = { id: string; token: string; nickname: string | null; gold: number; searches: number; last_free_case_at: string | null; xp: number; is_banned: boolean };
type LootRow = {
  id: string;
  name: string;
  value: number;
  image_key: string | null;
  rarity: string;
  level: number;
  found_at: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomInt(max: number) {
  return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function roundGold(amount: number) {
  return Math.round(amount * 100) / 100;
}

function sumValues(items: { value: number }[]) {
  return roundGold(items.reduce((total, item) => total + item.value, 0));
}

async function loadPlayerById(playerId: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select(PLAYER_COLUMNS)
    .eq("id", playerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadPlayerByToken(token: unknown): Promise<Player | null> {
  if (!isUuid(token)) return null;
  const { data, error } = await supabase
    .from("players")
    .select(PLAYER_COLUMNS)
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

class BannedError extends Error {}

async function requirePlayer(token: unknown) {
  const player = await loadPlayerByToken(token);
  if (!player) throw new BadRequest("Игрок не найден. Обновите страницу.");
  if (player.is_banned) throw new BannedError("Вы заблокированы администратором.");
  if (!player.nickname) throw new BadRequest("Сначала укажите ник.");
  return player;
}

const RANKS = [
  "BRONZE I", "BRONZE II", "BRONZE III",
  "SILVER I", "SILVER II", "SILVER III",
  "GOLD I", "GOLD II", "GOLD III",
  "ELITEGOLD I", "ELITEGOLD II", "ELITEGOLD III",
  "DIAMOND I", "DIAMOND II", "DIAMOND III",
  "PLATINUM I", "PLATINUM II", "PLATINUM III",
  "TITAN I", "TITAN II", "TITAN III",
  "MASTER", "ELITE", "ABSOLUTE",
] as const;

// XP thresholds for each rank. Index 0 = BRONZE I requires 0 XP.
// Each rank requires progressively more XP than the last.
const RANK_THRESHOLDS = [
  0,       // BRONZE I
  45,      // BRONZE II
  135,     // BRONZE III
  270,     // SILVER I
  450,     // SILVER II
  720,     // SILVER III
  1080,    // GOLD I
  1530,    // GOLD II
  2070,    // GOLD III
  2700,    // ELITEGOLD I
  3600,    // ELITEGOLD II
  4680,    // ELITEGOLD III
  6120,    // DIAMOND I
  7740,    // DIAMOND II
  9720,    // DIAMOND III
  12150,   // PLATINUM I
  14850,   // PLATINUM II
  18000,   // PLATINUM III
  22500,   // TITAN I
  27000,   // TITAN II
  32400,   // TITAN III
  38700,   // MASTER
  46800,   // ELITE
  58500,   // ABSOLUTE
];

// Gold reward awarded once when a player reaches each rank.
const RANK_REWARDS = [
  0,    // BRONZE I
  17,   // BRONZE II
  85,   // BRONZE III
  170,  // SILVER I
  255,  // SILVER II
  340,  // SILVER III
  425,  // GOLD I
  595,  // GOLD II
  765,  // GOLD III
  1020, // ELITEGOLD I
  1275, // ELITEGOLD II
  1530, // ELITEGOLD III
  1700, // DIAMOND I
  2040, // DIAMOND II
  2380, // DIAMOND III
  2720, // PLATINUM I
  3060, // PLATINUM II
  3400, // PLATINUM III
  3910, // TITAN I
  4420, // TITAN II
  5100, // TITAN III
  5950, // MASTER
  6800, // ELITE
  8500, // ABSOLUTE
];

function computeRank(xp: number) {
  let rankIndex = 0;
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i]) {
      rankIndex = i;
      break;
    }
  }
  const currentRank = RANKS[rankIndex];
  const isMaxRank = rankIndex === RANKS.length - 1;
  const currentThreshold = RANK_THRESHOLDS[rankIndex];
  const nextThreshold = isMaxRank ? RANK_THRESHOLDS[rankIndex] : RANK_THRESHOLDS[rankIndex + 1];
  const progressInRank = xp - currentThreshold;
  const rankSpan = nextThreshold - currentThreshold;
  const progressPct = isMaxRank ? 100 : Math.min(100, Math.round((progressInRank / rankSpan) * 100));
  return {
    name: currentRank,
    index: rankIndex,
    xp,
    currentThreshold,
    nextThreshold,
    progressInRank,
    rankSpan,
    progressPct,
    isMaxRank,
  };
}

// XP awarded per case open = round(casePrice / 2)
function caseXpReward(casePrice: number): number {
  return Math.round(casePrice / 2);
}

function isMoneyAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number(value.toFixed(2)) === value;
}

async function recordSpending(playerId: string, amount: number) {
  const wholeGold = Math.round(amount);
  if (wholeGold <= 0) return;
  const { error } = await supabase.rpc("add_player_spending", { p_player_id: playerId, p_amount: wholeGold });
  if (error) throw error;
}

async function recordBestDrop(playerId: string, drops: { name: string; value: number; imageKey: string; rarity: string }[]) {
  if (drops.length === 0) return;
  const best = drops.reduce((top, drop) => (drop.value > top.value ? drop : top));
  const { error } = await supabase.rpc("record_player_drop", {
    p_player_id: playerId,
    p_name: best.name,
    p_rarity: best.rarity,
    p_image_key: best.imageKey,
    p_value: best.value,
  });
  if (error) throw error;
}

async function loadGuaranteeMisses(playerId: string, caseKey: string): Promise<number> {
  const { data, error } = await supabase
    .from("player_case_guarantees")
    .select("misses")
    .eq("player_id", playerId)
    .eq("case_key", caseKey)
    .maybeSingle();
  if (error) throw error;
  return data?.misses ?? 0;
}

async function saveGuaranteeMisses(playerId: string, caseKey: string, misses: number) {
  const { error } = await supabase
    .from("player_case_guarantees")
    .upsert(
      { player_id: playerId, case_key: caseKey, misses, updated_at: new Date().toISOString() },
      { onConflict: "player_id,case_key" },
    );
  if (error) throw error;
}

async function loadGuarantees(playerId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("player_case_guarantees")
    .select("case_key, misses")
    .eq("player_id", playerId);
  if (error) throw error;
  const missesByCase = new Map((data ?? []).map((row) => [row.case_key, row.misses]));
  return Object.fromEntries(
    CASES.filter((caseView) => caseView.guaranteed).map((caseView) => [
      caseView.key,
      GUARANTEE_LENGTH - (missesByCase.get(caseView.key) ?? 0),
    ]),
  );
}

async function loadLoot(playerId: string) {
  const { data, error } = await supabase
    .from("loot_items")
    .select(LOOT_COLUMNS)
    .eq("player_id", playerId)
    .order("found_at", { ascending: false });
  if (error) throw error;
  return data as LootRow[];
}

async function buildState(player: Player) {
  const [loot, guarantees, ticketsRes] = await Promise.all([
    loadLoot(player.id),
    loadGuarantees(player.id),
    supabase
      .from("deal_tickets")
      .select("id, number, kind, currency, nickname, location, telegram, phone, bank, deal_time, amount, rub_amount, status, is_premium, created_at")
      .eq("player_id", player.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (ticketsRes.error) throw ticketsRes.error;

  return {
    token: player.token,
    nickname: player.nickname,
    gold: player.gold,
    searches: player.searches,
    lastFreeCaseAt: player.last_free_case_at,
    serverTime: new Date().toISOString(),
    xp: player.xp,
    rank: computeRank(player.xp),
    guarantees,
    loot,
    tickets: ticketsRes.data,
    cases: CASES,
    freeCase: FREE_CASE,
  };
}

async function handleState(body: { token?: unknown }) {
  let player = await loadPlayerByToken(body.token);
  if (!player) {
    const { data, error } = await supabase
      .from("players")
      .insert({ gold: START_GOLD })
      .select(PLAYER_COLUMNS)
      .single();
    if (error) throw error;
    player = data;
  }
  if (player.is_banned) throw new BannedError("Вы заблокированы администратором.");
  return json(await buildState(player));
}

function parseNickname(value: unknown): string {
  if (typeof value !== "string") throw new BadRequest("Укажите ник (от 1 до 24 символов).");
  const nickname = value.trim();
  if (nickname.length === 0 || nickname.length > NICKNAME_MAX_LENGTH) {
    throw new BadRequest("Укажите ник (от 1 до 24 символов).");
  }
  if (!NICKNAME_PATTERN.test(nickname)) {
    throw new BadRequest("Ник может содержать только буквы, цифры, пробелы, _ и -.");
  }
  return nickname;
}

async function handleSetNickname(body: { token?: unknown; nickname?: unknown }) {
  const nickname = parseNickname(body.nickname);
  const player = await loadPlayerByToken(body.token);
  if (!player) throw new BadRequest("Игрок не найден. Обновите страницу.");
  if (player.nickname) throw new BadRequest("Ник уже выбран и не может быть изменен.");

  const { data: claimed, error: claimError } = await supabase
    .from("players")
    .update({ nickname })
    .eq("id", player.id)
    .is("nickname", null)
    .select("id")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) throw new BadRequest("Ник уже выбран и не может быть изменен.");

  const { error: spendingError } = await supabase
    .from("player_spending")
    .insert({ player_id: player.id, display_name: nickname, total_spent: 0 });
  if (spendingError) throw spendingError;

  return json(await buildState({ ...player, nickname }));
}

function parseCaseCount(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_CASES_PER_OPEN) {
    throw new BadRequest(`Можно открыть от 1 до ${MAX_CASES_PER_OPEN} кейсов за раз.`);
  }
  return value;
}

async function handleOpenCase(body: { token?: unknown; caseKey?: unknown; count?: unknown }) {
  const player = await requirePlayer(body.token);
  const caseView = findCase(body.caseKey);
  if (!caseView) throw new BadRequest("Кейс не найден.");
  if (!caseView.available) throw new BadRequest("Этот кейс пока недоступен.");
  const count = parseCaseCount(body.count);
  const totalPrice = roundGold(caseView.price * count);
  if (player.gold < totalPrice) throw new BadRequest("Недостаточно голды для открытия кейсов.");

  const guaranteed = caseView.guaranteed;
  let misses = guaranteed ? await loadGuaranteeMisses(player.id, caseView.key) : 0;
  const drops: CaseDrop[] = [];
  for (let opened = 0; opened < count; opened++) {
    const forced = guaranteed && misses >= GUARANTEE_LENGTH - 1;
    const drop = rollCaseDrop(caseView.key, randomInt, forced ? GUARANTEE_RARITY : undefined);
    drops.push(drop);
    if (guaranteed) misses = GUARANTEE_RESET_RARITIES.includes(drop.rarity) ? 0 : misses + 1;
  }
  const isAutoSold = (drop: { imageKey: string }) => drop.imageKey === AUTO_SOLD_BERRY_KEY;
  const autoSoldGold = roundGold(sumValues(drops.filter(isAutoSold)));
  let keptRows: Record<string, unknown>[] = [];
  const keptDrops = drops.filter((drop) => !isAutoSold(drop));
  if (keptDrops.length > 0) {
    const { data, error: insertError } = await supabase
      .from("loot_items")
      .insert(
        keptDrops.map((drop) => ({
          player_id: player.id,
          name: drop.name,
          value: drop.value,
          image_key: drop.imageKey,
          rarity: drop.rarity,
          level: drop.level,
        })),
      )
      .select(LOOT_COLUMNS);
    if (insertError) throw insertError;
    keptRows = data ?? [];
  }
  let keptIndex = 0;
  const finds = drops.map((drop) =>
    isAutoSold(drop)
      ? { id: null, name: drop.name, value: drop.value, image_key: drop.imageKey, rarity: drop.rarity, level: drop.level, found_at: null, autoSold: true }
      : { ...keptRows[keptIndex++], autoSold: false },
  );

  const xpReward = caseXpReward(caseView.price) * count;
  const oldRankIndex = computeRank(player.xp).index;
  const newXp = player.xp + xpReward;
  const newRankIndex = computeRank(newXp).index;
  const rankUp = newRankIndex > oldRankIndex;
  const rankUpGold = rankUp ? RANK_REWARDS[newRankIndex] : 0;

  const { error: updateError } = await supabase
    .from("players")
    .update({
      gold: roundGold(player.gold - totalPrice + rankUpGold + autoSoldGold),
      searches: player.searches + count,
      xp: newXp,
    })
    .eq("id", player.id);
  if (updateError) throw updateError;

  if (guaranteed) await saveGuaranteeMisses(player.id, caseView.key, misses);
  await recordSpending(player.id, totalPrice);
  await recordBestDrop(player.id, drops);

  const refreshed = await loadPlayerById(player.id);
  if (!refreshed) throw new Error("Player disappeared during case opening");
  const result: Record<string, unknown> = { ...(await buildState(refreshed)), finds };
  if (rankUp) {
    result.rankUp = { fromIndex: oldRankIndex, toIndex: newRankIndex, reward: rankUpGold };
  }
  return json(result);
}

const FREE_CASE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

async function handleOpenFreeCase(body: { token?: unknown }) {
  const player = await requirePlayer(body.token);

  // Server-side cooldown check using the server's clock, not the client's.
  // This prevents time manipulation on the client from bypassing the 24h limit.
  const now = Date.now();
  if (player.last_free_case_at) {
    const elapsed = now - new Date(player.last_free_case_at).getTime();
    if (elapsed < FREE_CASE_COOLDOWN_MS) {
      const remaining = Math.ceil((FREE_CASE_COOLDOWN_MS - elapsed) / 1000);
      throw new BadRequest(`Бесплатный кейс можно открыть раз в 24 часа. Осталось: ${remaining} сек.`);
    }
  }

  const drop = rollCaseDrop(FREE_CASE_DEF.key, randomInt);
  await recordBestDrop(player.id, [drop]);
  const { data: found, error: insertError } = await supabase
    .from("loot_items")
    .insert({
      player_id: player.id,
      name: drop.name,
      value: drop.value,
      image_key: drop.imageKey,
      rarity: drop.rarity,
      level: drop.level,
    })
    .select(LOOT_COLUMNS);
  if (insertError) throw insertError;

  const xpReward = caseXpReward(FREE_CASE_DEF.price);
  const oldRankIndex = computeRank(player.xp).index;
  const newXp = player.xp + xpReward;
  const newRankIndex = computeRank(newXp).index;
  const rankUp = newRankIndex > oldRankIndex;
  const rankUpGold = rankUp ? RANK_REWARDS[newRankIndex] : 0;

  const { error: updateError } = await supabase
    .from("players")
    .update({
      last_free_case_at: new Date().toISOString(),
      searches: player.searches + 1,
      xp: newXp,
      gold: roundGold(player.gold + rankUpGold),
    })
    .eq("id", player.id);
  if (updateError) throw updateError;

  const refreshed = await loadPlayerById(player.id);
  if (!refreshed) throw new Error("Player disappeared during free case opening");
  const result: Record<string, unknown> = { ...(await buildState(refreshed)), finds: found };
  if (rankUp) {
    result.rankUp = { fromIndex: oldRankIndex, toIndex: newRankIndex, reward: rankUpGold };
  }
  return json(result);
}

async function handleSellAll(body: { token?: unknown }) {
  const player = await requirePlayer(body.token);

  const { data: sold, error: deleteError } = await supabase
    .from("loot_items")
    .delete()
    .eq("player_id", player.id)
    .select("value");
  if (deleteError) throw deleteError;
  if (!sold || sold.length === 0) throw new BadRequest("В инвентаре нет предметов для продажи.");

  const newGold = roundGold(player.gold + sumValues(sold));
  const { error: goldError } = await supabase.from("players").update({ gold: newGold }).eq("id", player.id);
  if (goldError) throw goldError;

  return json(await buildState({ ...player, gold: newGold }));
}

async function handleSell(body: { token?: unknown; itemId?: unknown }) {
  const player = await requirePlayer(body.token);
  if (!isUuid(body.itemId)) throw new BadRequest("Некорректный предмет.");

  const { data: sold, error: deleteError } = await supabase
    .from("loot_items")
    .delete()
    .eq("id", body.itemId)
    .eq("player_id", player.id)
    .select("value")
    .maybeSingle();
  if (deleteError) throw deleteError;
  if (!sold) throw new BadRequest("Предмет не найден в вашем инвентаре.");

  const { error: goldError } = await supabase
    .from("players")
    .update({ gold: roundGold(player.gold + sold.value) })
    .eq("id", player.id);
  if (goldError) throw goldError;

  return json(await buildState({ ...player, gold: roundGold(player.gold + sold.value) }));
}

type ContractInput = {
  itemId: string;
  extraItemIds: string[];
  goldAmount: number;
  targetValue: number;
};

function parseContractInput(body: Record<string, unknown>): ContractInput {
  const { itemId, extraItemIds, goldAmount, targetValue } = body;
  if (!isUuid(itemId)) throw new BadRequest("Выберите предмет для контракта.");
  if (!Array.isArray(extraItemIds) || !extraItemIds.every(isUuid)) {
    throw new BadRequest("Некорректный список предметов.");
  }
  const unique = new Set(extraItemIds);
  if (unique.size !== extraItemIds.length || unique.has(itemId)) {
    throw new BadRequest("Один и тот же предмет нельзя добавить дважды.");
  }
  if (unique.size > MAX_EXTRA_ITEMS) {
    throw new BadRequest(`Можно добавить не больше ${MAX_EXTRA_ITEMS} предметов.`);
  }
  if (!isMoneyAmount(goldAmount) || goldAmount < 0) {
    throw new BadRequest("Некорректное количество голды.");
  }
  if (typeof targetValue !== "number" || !TARGET_TIERS.includes(targetValue)) {
    throw new BadRequest("Выберите стоимость улучшения.");
  }
  return { itemId, extraItemIds, goldAmount, targetValue };
}

async function loadOwnedItems(playerId: string, ids: string[]) {
  const { data, error } = await supabase
    .from("loot_items")
    .select(LOOT_COLUMNS)
    .eq("player_id", playerId)
    .in("id", ids);
  if (error) throw error;
  if (data.length !== ids.length) throw new BadRequest("Предмет не найден в вашем инвентаре.");
  return data as LootRow[];
}

async function validateContract(player: Player, input: ContractInput) {
  if (input.goldAmount > player.gold) throw new BadRequest("Недостаточно голды на балансе.");

  const items = await loadOwnedItems(player.id, [input.itemId, ...input.extraItemIds]);
  const item = items.find((owned) => owned.id === input.itemId)!;
  const extras = items.filter((owned) => owned.id !== input.itemId);

  const inputTotal = item.value + sumValues(extras) + input.goldAmount;
  if (input.targetValue <= inputTotal) {
    throw new BadRequest(`Стоимость контракта должна быть выше ${inputTotal}. Выберите более высокое улучшение.`);
  }

  const chance = Math.min(MAX_CHANCE, Math.max(1, Math.round((inputTotal / input.targetValue) * 100)));
  return { item, extras, chance };
}

async function handleContractPreview(body: Record<string, unknown>) {
  const player = await requirePlayer(body.token);
  const input = parseContractInput(body);
  const { chance } = await validateContract(player, input);
  return json({ chance });
}

async function handleContract(body: Record<string, unknown>) {
  const player = await requirePlayer(body.token);
  const input = parseContractInput(body);
  const { item, extras, chance } = await validateContract(player, input);

  const won = randomInt(100) < chance;
  const extraIds = extras.map((extra) => extra.id);

  if (won) {
    const { error } = await supabase
      .from("loot_items")
      .update({ value: input.targetValue })
      .eq("id", item.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("loot_items").delete().eq("id", item.id);
    if (error) throw error;
  }

  if (extraIds.length > 0) {
    const { error } = await supabase.from("loot_items").delete().in("id", extraIds);
    if (error) throw error;
  }

  const { error: goldError } = await supabase
    .from("players")
    .update({ gold: roundGold(player.gold - input.goldAmount) })
    .eq("id", player.id);
  if (goldError) throw goldError;

  await recordSpending(player.id, input.goldAmount);

  const { error: historyError } = await supabase.from("contract_tickets").insert({
    player_id: player.id,
    item_name: item.name,
    item_value: item.value,
    target_value: input.targetValue,
    chance,
    result: won ? "won" : "lost",
  });
  if (historyError) throw historyError;

  const refreshed = await loadPlayerById(player.id);
  if (!refreshed) throw new Error("Player disappeared during contract");
  return json({
    ...(await buildState(refreshed)),
    contract: { won, chance, target: input.targetValue },
  });
}

const GOLD_PER_RUB = 2.5;

type TicketFields = {
  nickname?: string;
  location?: string;
  telegram?: string;
  phone?: string;
  bank?: string;
  amount: number;
  rub_amount: number | null;
};

function parseRequiredText(value: unknown, maxLength: number, message: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new BadRequest(message);
  }
  return value.trim();
}

function parseGoldDetails(body: Record<string, unknown>) {
  return {
    nickname: parseRequiredText(body.nickname, 32, "Укажите ник (от 1 до 32 символов)."),
    location: parseRequiredText(body.location, 64, "Укажите локацию (от 1 до 64 символов)."),
    telegram: parseRequiredText(body.telegram, 64, "Укажите юз телеграм (от 1 до 64 символов)."),
  };
}

function parseRubTelegram(body: Record<string, unknown>) {
  return parseRequiredText(body.telegram, 64, "Укажите юз телеграм (от 1 до 64 символов).");
}

function parseRubWithdrawDetails(body: Record<string, unknown>) {
  const phone = parseRequiredText(body.phone, 20, "Укажите номер телефона.");
  if (!/^\+?[0-9 ()-]{5,20}$/.test(phone)) throw new BadRequest("Укажите номер телефона.");
  return {
    phone,
    bank: parseRequiredText(body.bank, 64, "Укажите банк (от 1 до 64 символов)."),
  };
}

function parseRubAmount(body: Record<string, unknown>): number {
  const { rubAmount } = body;
  if (!isMoneyAmount(rubAmount) || rubAmount <= 0) {
    throw new BadRequest("Укажите сумму в рублях.");
  }
  if (rubAmount < MIN_DEPOSIT_RUB) {
    throw new BadRequest(`Минимальная сумма пополнения — ${MIN_DEPOSIT_RUB} ₽.`);
  }
  return rubAmount;
}

function goldToRub(gold: number) {
  return roundGold(gold / GOLD_PER_RUB);
}

function rubToGold(rub: number) {
  return roundGold(rub * GOLD_PER_RUB);
}

function parseDepositAmount(body: Record<string, unknown>): number {
  const { amount } = body;
  if (!isMoneyAmount(amount) || amount <= 0) {
    throw new BadRequest("Укажите сумму голды.");
  }
  if (amount < MIN_DEPOSIT_GOLD) {
    throw new BadRequest(`Минимальная сумма пополнения — ${MIN_DEPOSIT_GOLD} голды.`);
  }
  return amount;
}

function parseItemIds(body: Record<string, unknown>): string[] {
  const { itemIds } = body;
  if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every(isUuid)) {
    throw new BadRequest("Выберите предметы для вывода.");
  }
  if (new Set(itemIds).size !== itemIds.length) {
    throw new BadRequest("Один и тот же предмет нельзя выбрать дважды.");
  }
  return itemIds;
}

type TicketNotice = {
  number: number;
  kind: "withdraw" | "deposit";
  currency: "gold" | "rub";
  nickname: string | null;
  location: string | null;
  telegram: string | null;
  phone: string | null;
  bank: string | null;
  amount: number;
  rub_amount: number | null;
  is_premium: boolean;
};

const TICKET_NOTICE_COLUMNS = "number, kind, currency, nickname, location, telegram, phone, bank, amount, rub_amount, is_premium";

async function notifyAdminTicket(ticket: TicketNotice, itemNames: string[]) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!botToken || !chatId) return;

  const isRub = ticket.currency === "rub";
  const lines = [
    `Новый тикет №${ticket.number}: ${ticket.kind === "withdraw" ? "вывод" : "пополнение"} ${isRub ? "за рубли" : "голды"}${ticket.is_premium ? " [ПРЕМИУМ]" : ""}`,
    isRub ? `Сумма: ${ticket.rub_amount} ₽ (${ticket.amount} голды)` : `Сумма: ${ticket.amount} голды`,
  ];
  if (isRub && ticket.kind === "withdraw") {
    lines.push(`Телефон: ${ticket.phone}`, `Банк: ${ticket.bank}`);
  } else {
    if (ticket.nickname) lines.push(`Ник: ${ticket.nickname}`);
    if (ticket.location) lines.push(`Локация: ${ticket.location}`);
  }
  if (ticket.telegram) lines.push(`Юз телеграм: ${ticket.telegram}`);
  if (itemNames.length > 0) lines.push(`Предметы: ${itemNames.join(", ")}`);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") }),
    });
    if (!response.ok) console.error("Telegram notification failed", response.status);
  } catch (err) {
    console.error("Telegram notification failed", err);
  }
}

async function handleRedeemPromoCode(body: { token?: unknown; code?: unknown }) {
  const player = await requirePlayer(body.token);
  if (typeof body.code !== "string" || body.code.trim().length === 0 || body.code.trim().length > 40) {
    throw new BadRequest("Введите промокод.");
  }

  const { error } = await supabase.rpc("redeem_promo_code", {
    p_player_id: player.id,
    p_code: body.code,
  });
  if (error) {
    throw new BadRequest("Промокод недействителен или уже использован.");
  }

  const refreshed = await loadPlayerById(player.id);
  if (!refreshed) throw new Error("Player disappeared during promo redemption");
  return json({ ...(await buildState(refreshed)), promoReward: PROMO_REWARD });
}

async function handleCreateTicket(body: Record<string, unknown>) {
  const player = await requirePlayer(body.token);
  const { kind, currency } = body;
  if (kind !== "withdraw" && kind !== "deposit") throw new BadRequest("Выберите тип тикета.");
  if (currency !== "gold" && currency !== "rub") throw new BadRequest("Выберите валюту.");
  const isRub = currency === "rub";

  let fields: TicketFields;
  let items: LootRow[] = [];

  if (kind === "deposit") {
    if (isRub) {
      const rubAmount = parseRubAmount(body);
      fields = { telegram: parseRubTelegram(body), amount: rubToGold(rubAmount), rub_amount: rubAmount };
    } else {
      fields = { ...parseGoldDetails(body), amount: parseDepositAmount(body), rub_amount: null };
    }
  } else {
    const details = isRub ? parseRubWithdrawDetails(body) : parseGoldDetails(body);
    items = await loadOwnedItems(player.id, parseItemIds(body));
    if (items.some((row) => row.value < MIN_WITHDRAW_ITEM_VALUE)) {
      throw new BadRequest(`Предметы дешевле ${MIN_WITHDRAW_ITEM_VALUE} голды нельзя вывести.`);
    }
    const goldTotal = sumValues(items);
    if (goldTotal < MIN_WITHDRAW) {
      throw new BadRequest(`Минимальная сумма вывода — ${MIN_WITHDRAW} голды.`);
    }
    fields = { ...details, amount: goldTotal, rub_amount: isRub ? goldToRub(goldTotal) : null };
  }

  const { data: ticket, error } = await supabase
    .from("deal_tickets")
    .insert({
      player_id: player.id,
      kind,
      currency,
      nickname: fields.nickname ?? null,
      location: fields.location ?? null,
      telegram: fields.telegram ?? null,
      phone: fields.phone ?? null,
      bank: fields.bank ?? null,
      amount: fields.amount,
      rub_amount: fields.rub_amount,
      held_items: items.map((row) => ({ ...row, player_id: player.id })),
    })
    .select(TICKET_NOTICE_COLUMNS)
    .single();
  if (error) throw error;
  await notifyAdminTicket(
    ticket as TicketNotice,
    items.map((row) => `${row.name} (ур. ${row.level})`),
  );

  if (kind === "withdraw") {
    const { error: deleteError } = await supabase
      .from("loot_items")
      .delete()
      .in("id", items.map((row) => row.id));
    if (deleteError) throw deleteError;
  }

  return json(await buildState(player));
}

const PREMIUM_PRICE = 500;

async function handleCreatePremiumTicket(body: Record<string, unknown>) {
  const player = await requirePlayer(body.token);
  if (player.gold < PREMIUM_PRICE) throw new BadRequest("Недостаточно голды для покупки PLUS.");
  const details = parseGoldDetails(body);

  const { data: ticket, error } = await supabase
    .from("deal_tickets")
    .insert({
      player_id: player.id,
      kind: "deposit",
      nickname: details.nickname,
      location: details.location,
      telegram: details.telegram,
      amount: PREMIUM_PRICE,
      is_premium: true,
    })
    .select(TICKET_NOTICE_COLUMNS)
    .single();
  if (error) throw error;
  await notifyAdminTicket(ticket as TicketNotice, []);

  return json(await buildState(player));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (body.action !== "state") {
      const player = await loadPlayerByToken(body.token);
      if (player?.is_banned) {
        return json({ error: "Вы заблокированы администратором.", banned: true }, 403);
      }
    }

    switch (body.action) {
      case "state":
        return await handleState(body);
      case "set-nickname":
        return await handleSetNickname(body);
      case "open-case":
        return await handleOpenCase(body);
      case "sell":
        return await handleSell(body);
      case "sell-all":
        return await handleSellAll(body);
      case "contract-preview":
        return await handleContractPreview(body);
      case "contract":
        return await handleContract(body);
      case "open-free-case":
        return await handleOpenFreeCase(body);
      case "create-ticket":
        return await handleCreateTicket(body);
      case "create-premium-ticket":
        return await handleCreatePremiumTicket(body);
      case "redeem-promo-code":
        return await handleRedeemPromoCode(body);
      default:
        return json({ error: "Неизвестное действие." }, 400);
    }
  } catch (err) {
    if (err instanceof BannedError) {
      return json({ error: err.message, banned: true }, 403);
    }
    if (err instanceof BadRequest) {
      return json({ error: err.message }, 400);
    }
    console.error(err);
    return json({ error: "Что-то пошло не так. Попробуйте еще раз." }, 500);
  }
});
