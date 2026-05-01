import { allPlayers } from "../data/players";
import { Player } from "../types";
import { getPlayerTier } from "./playerTier";

export interface TokenStoreUtilityItem {
  id:
    | "training-camp-ticket"
    | "trade-phone"
    | "silver-starter-pack"
    | "gold-starter-pack"
    | "platinum-starter-pack"
    | "coach-recruitment";
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
      "Permanently adds a Coach Recruitment node after your opening five, giving you a 1-of-5 board from your coach's NBA team.",
    price: 35_000,
  },
];

const roundToNearestThousand = (value: number) => Math.round(value / 1_000) * 1_000;
const TOKEN_STORE_GALAXY_PRICE_FLOOR = 600_000;
const TOKEN_STORE_GALAXY_PRICE_CEILING = 950_000;
const TOKEN_STORE_MICHAEL_JORDAN_PRICE = 1_000_000;
const TOKEN_STORE_GALAXY_PRICE_SWAPS: [string, string][] = [
  ["Steph Curry", "Hakeem Olajuwon"],
  ["Kareem Abdul-Jabbar (Lakers)", "Kobe Bryant (#24)"],
  ["Kobe Bryant (#8)", "Kevin Durant (Warriors)"],
];

export const getTokenStoreSPlayers = () =>
  allPlayers
    .filter((player) => getPlayerTier(player) === "Galaxy")
    .sort((a, b) => {
      if (a.name === "Michael Jordan") return -1;
      if (b.name === "Michael Jordan") return 1;
      return b.overall - a.overall || a.name.localeCompare(b.name);
    });

export const getTokenStorePlayerPriceMap = () => {
  const sTierPlayers = getTokenStoreSPlayers();
  const nonJordanPlayers = sTierPlayers.filter((player) => player.name !== "Michael Jordan");
  const lastIndex = Math.max(1, nonJordanPlayers.length - 1);
  const priceMap = new Map<string, number>();

  sTierPlayers.forEach((player, index) => {
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

  TOKEN_STORE_GALAXY_PRICE_SWAPS.forEach(([firstName, secondName]) => {
    const firstPlayer = sTierPlayers.find((player) => player.name === firstName);
    const secondPlayer = sTierPlayers.find((player) => player.name === secondName);
    if (!firstPlayer || !secondPlayer) return;

    const firstPrice = priceMap.get(firstPlayer.id);
    const secondPrice = priceMap.get(secondPlayer.id);
    if (firstPrice === undefined || secondPrice === undefined) return;

    priceMap.set(firstPlayer.id, secondPrice);
    priceMap.set(secondPlayer.id, firstPrice);
  });

  return priceMap;
};

export const getTokenStorePlayerPrice = (player: Player, priceMap = getTokenStorePlayerPriceMap()) =>
  priceMap.get(player.id) ?? TOKEN_STORE_GALAXY_PRICE_FLOOR;
