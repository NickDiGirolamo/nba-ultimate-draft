import { allPlayers } from "../data/players";
import { Player } from "../types";
import { getPlayerTier } from "./playerTier";

export interface TokenStoreUtilityItem {
  id:
    | "training-camp-ticket"
    | "trade-phone"
    | "silver-starter-pack"
    | "gold-starter-pack"
    | "platinum-starter-pack";
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
    price: 10_000,
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
      "Use this before a Rogue run to upgrade your 3-card starter pack to an average of 84 OVR instead of 80.",
    price: 35_000,
  },
  {
    id: "gold-starter-pack",
    title: "Gold Starter Pack",
    description:
      "Use this before a Rogue run to upgrade your 3-card starter pack to an average of 85 OVR instead of 80.",
    price: 70_000,
  },
  {
    id: "platinum-starter-pack",
    title: "Platinum Starter Pack",
    description:
      "Use this before a Rogue run to upgrade your 3-card starter pack to an average of 86 OVR instead of 80.",
    price: 100_000,
  },
];

const roundToNearestThousand = (value: number) => Math.round(value / 1_000) * 1_000;

export const getTokenStoreSPlayers = () =>
  allPlayers
    .filter((player) => getPlayerTier(player) === "S")
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
      priceMap.set(player.id, 1_000_000);
      return;
    }

    const nonJordanIndex = nonJordanPlayers.findIndex((candidate) => candidate.id === player.id);
    const normalized = 1 - nonJordanIndex / lastIndex;
    const computedPrice = 100_000 + normalized * 850_000;
    priceMap.set(player.id, roundToNearestThousand(computedPrice));
  });

  const cheapestPlayer = nonJordanPlayers[nonJordanPlayers.length - 1];
  if (cheapestPlayer) {
    priceMap.set(cheapestPlayer.id, 100_000);
  }

  return priceMap;
};

export const getTokenStorePlayerPrice = (player: Player, priceMap = getTokenStorePlayerPriceMap()) =>
  priceMap.get(player.id) ?? 100_000;
