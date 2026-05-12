import { allPlayers } from "../data/players";
import type { Player, PlayerTier } from "../types";
import { getPlayerTier } from "./playerTier";

export interface TokenStoreUtilityItem {
  id:
    | "training-camp-ticket"
    | "trade-phone"
    | "silver-starter-pack"
    | "gold-starter-pack"
    | "platinum-starter-pack"
    | "coach-recruitment"
    | "opening-locker-cash-1"
    | "opening-locker-cash-2"
    | "opening-locker-cash-3"
    | "extra-draft-shuffle"
    | "starter-pack-choice-plus";
  title: string;
  description: string;
  price: number;
}

export const tokenStoreUtilityItems: TokenStoreUtilityItem[] = [
  {
    id: "training-camp-ticket",
    title: "Training Camp Ticket",
    description:
      "Send one player from your Rogue run team to training camp for a +1 OVR boost for the rest of the run.",
    price: 7_500,
  },
  {
    id: "trade-phone",
    title: "Trade Phone",
    description:
      "Give up one player from your Rogue run team for a fresh 1-of-5 player choice.",
    price: 5_000,
  },
  {
    id: "silver-starter-pack",
    title: "Silver Starter Pack",
    description:
      "Permanently unlocks the option to upgrade your 3-card Rogue starter pack to an average of 81 OVR instead of 80.",
    price: 20_000,
  },
  {
    id: "gold-starter-pack",
    title: "Gold Starter Pack",
    description:
      "Permanently unlocks the option to upgrade your 3-card Rogue starter pack to an average of 82 OVR instead of 80.",
    price: 50_000,
  },
  {
    id: "platinum-starter-pack",
    title: "Platinum Starter Pack",
    description:
      "Permanently unlocks the option to upgrade your 3-card Rogue starter pack to an average of 83 OVR instead of 80.",
    price: 80_000,
  },
  {
    id: "coach-recruitment",
    title: "Coach Recruitment",
    description:
      "Permanently adds a Coach Recruitment floor after your opening five, giving you a 1-of-5 board from your coach's NBA team.",
    price: 35_000,
  },
  {
    id: "opening-locker-cash-1",
    title: "Opening Locker Cash I",
    description:
      "Permanently start every Rogue run with 3 Locker Cash already banked.",
    price: 25_000,
  },
  {
    id: "opening-locker-cash-2",
    title: "Opening Locker Cash II",
    description:
      "Permanently start every Rogue run with 6 Locker Cash already banked.",
    price: 55_000,
  },
  {
    id: "opening-locker-cash-3",
    title: "Opening Locker Cash III",
    description:
      "Permanently start every Rogue run with 10 Locker Cash already banked.",
    price: 90_000,
  },
  {
    id: "extra-draft-shuffle",
    title: "Extra Draft Shuffle",
    description:
      "Permanently start every Rogue run with 1 Draft Shuffle ready to rescue a bad board.",
    price: 35_000,
  },
  {
    id: "starter-pack-choice-plus",
    title: "Starter Pack Choice+",
    description:
      "Permanently reveal 4 starter cards at the beginning of each Rogue run and keep your favorite 3.",
    price: 120_000,
  },
];

const roundToNearestThousand = (value: number) => Math.round(value / 1_000) * 1_000;
export type StarterVaultTier = Exclude<PlayerTier, "Galaxy">;
export type RoguePackTier = PlayerTier;

export interface RogueTokenStorePack {
  id: string;
  name: string;
  tier: RoguePackTier;
  price: number;
  wrapperImage: string;
  playerImage: string;
  cardCount: string;
  description: string;
  tintClass: string;
  playerClass: string;
  shadowClass: string;
}

export interface StarterVaultPlayerEntry {
  player: Player;
  tier: StarterVaultTier;
  price: number;
}

export const STARTER_VAULT_TIERS: StarterVaultTier[] = [
  "Emerald",
  "Sapphire",
  "Ruby",
  "Amethyst",
];

export const ROGUE_TOKEN_STORE_PACKS: RogueTokenStorePack[] = [
  {
    id: "emerald-pack",
    name: "Emerald Pack",
    tier: "Emerald",
    price: 30_000,
    wrapperImage: "/pack-art/emerald-pack-vivid-v1.png",
    playerImage: "/ai-card-art/players/al-horford-cutout.png",
    cardCount: "1",
    description: "Opens immediately for one random Emerald player card.",
    tintClass: "from-emerald-300/26 via-transparent to-emerald-950/42",
    playerClass: "left-1/2 top-[92px] h-[490px] -translate-x-1/2",
    shadowClass: "shadow-[0_28px_80px_rgba(16,185,129,0.32)]",
  },
  {
    id: "sapphire-pack",
    name: "Sapphire Pack",
    tier: "Sapphire",
    price: 50_000,
    wrapperImage: "/pack-art/sapphire-pack-vivid-v1.png",
    playerImage: "/pack-art/players/josh-hart-cutout.png",
    cardCount: "1",
    description: "Opens immediately for one random Sapphire player card.",
    tintClass: "from-sky-300/28 via-transparent to-blue-950/44",
    playerClass: "left-1/2 top-[88px] h-[482px] -translate-x-1/2",
    shadowClass: "shadow-[0_28px_80px_rgba(37,99,235,0.34)]",
  },
  {
    id: "ruby-pack",
    name: "Ruby Pack",
    tier: "Ruby",
    price: 90_000,
    wrapperImage: "/pack-art/ruby-pack-vivid-v1.png",
    playerImage: "/pack-art/players/stephon-castle-cutout.png",
    cardCount: "1",
    description: "Opens immediately for one random Ruby player card.",
    tintClass: "from-rose-300/28 via-transparent to-red-950/46",
    playerClass: "left-1/2 top-[94px] h-[482px] -translate-x-1/2",
    shadowClass: "shadow-[0_28px_80px_rgba(185,28,28,0.34)]",
  },
  {
    id: "amethyst-pack",
    name: "Amethyst Pack",
    tier: "Amethyst",
    price: 150_000,
    wrapperImage: "/pack-art/amethyst-pack-vivid-v1.png",
    playerImage: "/pack-art/players/victor-wembanyama-cutout.png",
    cardCount: "1",
    description: "Opens immediately for one random Amethyst player card.",
    tintClass: "from-violet-300/30 via-transparent to-purple-950/48",
    playerClass: "left-1/2 top-[36px] h-[552px] -translate-x-1/2",
    shadowClass: "shadow-[0_30px_88px_rgba(126,34,206,0.34)]",
  },
  {
    id: "galaxy-pack",
    name: "Galaxy Pack",
    tier: "Galaxy",
    price: 250_000,
    wrapperImage: "/pack-art/galaxy-pack-vivid-v1.png",
    playerImage: "/pack-art/players/kobe-bryant-cutout.png",
    cardCount: "1",
    description: "Opens immediately for one random Galaxy player card.",
    tintClass: "from-yellow-200/18 via-indigo-400/16 to-slate-950/54",
    playerClass: "left-1/2 top-[82px] h-[490px] -translate-x-1/2",
    shadowClass: "shadow-[0_30px_90px_rgba(148,163,184,0.34)]",
  },
];

export const STARTER_VAULT_REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

const STARTER_VAULT_EPOCH_UTC_MS = Date.UTC(2026, 0, 5, 8);
const STARTER_VAULT_TIER_MIN_OVERALL: Record<StarterVaultTier, number> = {
  Emerald: 70,
  Sapphire: 80,
  Ruby: 86,
  Amethyst: 91,
};
const STARTER_VAULT_TIER_BASE_PRICE: Record<StarterVaultTier, number> = {
  Emerald: 10_000,
  Sapphire: 28_000,
  Ruby: 80_000,
  Amethyst: 175_000,
};
const STARTER_VAULT_TIER_OVR_PRICE_STEP: Record<StarterVaultTier, number> = {
  Emerald: 1_500,
  Sapphire: 3_000,
  Ruby: 8_000,
  Amethyst: 18_000,
};

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const getVaultIdentityKey = (player: Player) =>
  player.name.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();

const getStarterVaultSortScore = (player: Player, tier: StarterVaultTier, rotationIndex: number) =>
  hashString(`${tier}:${rotationIndex}:${player.id}:${player.name}`);

const getStarterVaultPrice = (player: Player, tier: StarterVaultTier) =>
  roundToNearestThousand(
    STARTER_VAULT_TIER_BASE_PRICE[tier] +
      Math.max(0, player.overall - STARTER_VAULT_TIER_MIN_OVERALL[tier]) *
        STARTER_VAULT_TIER_OVR_PRICE_STEP[tier],
  );

export const getStarterVaultRotation = (nowMs = Date.now()) => {
  const elapsedMs = Math.max(0, nowMs - STARTER_VAULT_EPOCH_UTC_MS);
  const rotationIndex = Math.floor(elapsedMs / STARTER_VAULT_REFRESH_INTERVAL_MS);
  const startsAt = STARTER_VAULT_EPOCH_UTC_MS + rotationIndex * STARTER_VAULT_REFRESH_INTERVAL_MS;

  return {
    rotationIndex,
    startsAt,
    endsAt: startsAt + STARTER_VAULT_REFRESH_INTERVAL_MS,
  };
};

export const getWeeklyStarterVaultCards = (nowMs = Date.now()) => {
  const { rotationIndex } = getStarterVaultRotation(nowMs);

  return STARTER_VAULT_TIERS.reduce<Record<StarterVaultTier, StarterVaultPlayerEntry[]>>(
    (vaultCards, tier) => {
      const seenIdentityKeys = new Set<string>();
      const tierPlayers = allPlayers
        .filter((player) => getPlayerTier(player) === tier)
        .sort((a, b) => {
          const scoreDelta =
            getStarterVaultSortScore(a, tier, rotationIndex) -
            getStarterVaultSortScore(b, tier, rotationIndex);
          if (scoreDelta !== 0) return scoreDelta;
          return a.name.localeCompare(b.name);
        });

      vaultCards[tier] = tierPlayers
        .filter((player) => {
          const identityKey = getVaultIdentityKey(player);
          if (seenIdentityKeys.has(identityKey)) return false;
          seenIdentityKeys.add(identityKey);
          return true;
        })
        .slice(0, 5)
        .map((player) => ({
          player,
          tier,
          price: getStarterVaultPrice(player, tier),
        }));

      return vaultCards;
    },
    {
      Emerald: [],
      Sapphire: [],
      Ruby: [],
      Amethyst: [],
    },
  );
};

export const getRoguePackPlayerPool = (tier: RoguePackTier, ownedPlayerIds: string[] = []) => {
  const ownedIds = new Set(ownedPlayerIds);
  const seenIdentityKeys = new Set<string>();

  return allPlayers
    .filter((player) => getPlayerTier(player) === tier)
    .filter((player) => {
      const identityKey = getVaultIdentityKey(player);
      if (seenIdentityKeys.has(identityKey)) return false;
      seenIdentityKeys.add(identityKey);
      return !ownedIds.has(player.id);
    })
    .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
};

const TOKEN_STORE_GALAXY_PRICE_FLOOR = 600_000;
const TOKEN_STORE_GALAXY_PRICE_CEILING = 950_000;
const TOKEN_STORE_MICHAEL_JORDAN_PRICE = 1_000_000;

const TOKEN_STORE_CUSTOM_GALAXY_PRICING: Array<{ name: string; price: number }> = [
  { name: "Michael Jordan", price: 1_000_000 },
  { name: "Kobe Bryant (#24)", price: 950_000 },
  { name: "LeBron James ('14 - '18)", price: 925_000 },
  { name: "Steph Curry", price: 900_000 },
  { name: "Shaquille O'Neal (Lakers)", price: 900_000 },
  { name: "Kareem Abdul-Jabbar (Bucks)", price: 875_000 },
  { name: "Kobe Bryant (#8)", price: 875_000 },
  { name: "Kevin Durant (Warriors)", price: 850_000 },
  { name: "Magic Johnson", price: 825_000 },
  { name: "Larry Bird", price: 825_000 },
  { name: "Tim Duncan", price: 825_000 },
  { name: "Wilt Chamberlain", price: 825_000 },
  { name: "Bill Russell", price: 825_000 },
  { name: "Hakeem Olajuwon", price: 800_000 },
  { name: "Nikola Jokic (2023)", price: 800_000 },
  { name: "LeBron James (Heat)", price: 800_000 },
  { name: "Kareem Abdul-Jabbar (Lakers)", price: 775_000 },
];

const TOKEN_STORE_CUSTOM_GALAXY_PRICE_MAP = new Map(
  TOKEN_STORE_CUSTOM_GALAXY_PRICING.map((entry) => [entry.name, entry.price]),
);

const TOKEN_STORE_CUSTOM_GALAXY_ORDER_MAP = new Map(
  TOKEN_STORE_CUSTOM_GALAXY_PRICING.map((entry, index) => [entry.name, index]),
);

export const getTokenStoreSPlayers = () =>
  allPlayers
    .filter((player) => getPlayerTier(player) === "Galaxy")
    .sort((a, b) => {
      const aCustomOrder = TOKEN_STORE_CUSTOM_GALAXY_ORDER_MAP.get(a.name);
      const bCustomOrder = TOKEN_STORE_CUSTOM_GALAXY_ORDER_MAP.get(b.name);
      if (aCustomOrder !== undefined && bCustomOrder !== undefined) {
        return aCustomOrder - bCustomOrder;
      }
      if (aCustomOrder !== undefined) return -1;
      if (bCustomOrder !== undefined) return 1;
      return b.overall - a.overall || a.name.localeCompare(b.name);
    });

export const getTokenStorePlayerPriceMap = () => {
  const sTierPlayers = getTokenStoreSPlayers();
  const nonJordanPlayers = sTierPlayers.filter((player) => player.name !== "Michael Jordan");
  const lastIndex = Math.max(1, nonJordanPlayers.length - 1);
  const priceMap = new Map<string, number>();

  sTierPlayers.forEach((player, index) => {
    const customPrice = TOKEN_STORE_CUSTOM_GALAXY_PRICE_MAP.get(player.name);
    if (customPrice !== undefined) {
      priceMap.set(player.id, customPrice);
      return;
    }

    if (player.name === "Michael Jordan") {
      priceMap.set(player.id, TOKEN_STORE_MICHAEL_JORDAN_PRICE);
      return;
    }

    const nonJordanIndex = nonJordanPlayers.findIndex((candidate) => candidate.id === player.id);
    const normalized = 1 - nonJordanIndex / lastIndex;
    const computedPrice =
      TOKEN_STORE_GALAXY_PRICE_FLOOR +
      normalized * (TOKEN_STORE_GALAXY_PRICE_CEILING - TOKEN_STORE_GALAXY_PRICE_FLOOR);
    priceMap.set(player.id, roundToNearestThousand(computedPrice));
  });

  const cheapestPlayer = nonJordanPlayers[nonJordanPlayers.length - 1];
  if (cheapestPlayer) {
    priceMap.set(cheapestPlayer.id, TOKEN_STORE_GALAXY_PRICE_FLOOR);
  }

  return priceMap;
};

export const getTokenStorePlayerPrice = (player: Player, priceMap = getTokenStorePlayerPriceMap()) =>
  priceMap.get(player.id) ?? TOKEN_STORE_GALAXY_PRICE_FLOOR;

export const getTokenStorePlayerOrder = (player: Player) =>
  TOKEN_STORE_CUSTOM_GALAXY_ORDER_MAP.get(player.name) ?? Number.MAX_SAFE_INTEGER;
