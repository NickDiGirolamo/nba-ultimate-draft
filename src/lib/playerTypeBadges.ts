import { Player, PlayerTier } from "../types";
import { getPlayerTier } from "./playerTier";

export type PlayerTypeBadge =
  | "slasher"
  | "sniper"
  | "playmaker"
  | "board-man"
  | "lockdown";

export interface PlayerTypeBadgeDefinition {
  type: PlayerTypeBadge;
  label: string;
  description: string;
}

export interface PlayerTypeBalanceSnapshot {
  representedTypes: PlayerTypeBadge[];
  representedCount: number;
  uniquePrimaryCount: number;
  duplicatePrimaryCount: number;
}

interface PlayerTypeBadgeScore extends PlayerTypeBadgeDefinition {
  score: number;
}

const badgeDefinitions: Record<PlayerTypeBadge, PlayerTypeBadgeDefinition> = {
  slasher: {
    type: "slasher",
    label: "Slasher",
    description: "Explosive downhill scorer built on athletic pressure and rim attacks.",
  },
  sniper: {
    type: "sniper",
    label: "Sniper",
    description: "High-end shotmaking and spacing threat who bends defenses with shooting.",
  },
  playmaker: {
    type: "playmaker",
    label: "Playmaker",
    description: "Primary creator whose passing and offensive orchestration drive possessions.",
  },
  "board-man": {
    type: "board-man",
    label: "Board Man",
    description: "Strong glass-controller who wins possessions with rebounding.",
  },
  lockdown: {
    type: "lockdown",
    label: "Lockdown",
    description: "Defensive stopper with standout disruption on the perimeter or in the paint.",
  },
};

const badgeCountByTier: Record<PlayerTier, number> = {
  D: 1,
  C: 1,
  B: 2,
  A: 3,
  S: 4,
};

const getPlayerTypeBadgeScores = (player: Player): PlayerTypeBadgeScore[] => {
  const slasherScore =
    player.athleticism * 0.44 +
    player.offense * 0.22 +
    player.ballDominance * 0.2 +
    player.intangibles * 0.08 +
    player.rebounding * 0.06;

  const sniperScore =
    player.shooting * 0.68 +
    player.offense * 0.16 +
    player.intangibles * 0.1 +
    player.ballDominance * 0.06;

  const playmakerScore =
    player.playmaking * 0.62 +
    player.ballDominance * 0.24 +
    player.offense * 0.08 +
    player.intangibles * 0.06;

  const boardManScore =
    player.rebounding * 0.58 +
    player.interiorDefense * 0.16 +
    player.defense * 0.12 +
    player.athleticism * 0.08 +
    player.intangibles * 0.06;

  const lockdownScore =
    player.defense * 0.34 +
    player.perimeterDefense * 0.24 +
    player.interiorDefense * 0.2 +
    player.athleticism * 0.12 +
    player.intangibles * 0.1;

  return [
    { ...badgeDefinitions.slasher, score: slasherScore },
    { ...badgeDefinitions.sniper, score: sniperScore },
    { ...badgeDefinitions.playmaker, score: playmakerScore },
    { ...badgeDefinitions["board-man"], score: boardManScore },
    { ...badgeDefinitions.lockdown, score: lockdownScore },
  ];
};

const getSortedPlayerTypeBadgeScores = (player: Player) =>
  getPlayerTypeBadgeScores(player).sort((left, right) => right.score - left.score);

export const getPlayerTypeBadgeCount = (player: Player) =>
  badgeCountByTier[getPlayerTier(player)];

export const getPrimaryPlayerTypeBadge = (player: Player): PlayerTypeBadgeDefinition | null =>
  getSortedPlayerTypeBadgeScores(player)[0] ?? null;

export const getPlayerTypeBadges = (player: Player): PlayerTypeBadgeDefinition[] =>
  getSortedPlayerTypeBadgeScores(player)
    .slice(0, getPlayerTypeBadgeCount(player))
    .map(({ type, label, description }) => ({ type, label, description }));

export const getPlayerTypeBalanceSnapshot = (players: Player[]): PlayerTypeBalanceSnapshot => {
  const represented = new Set<PlayerTypeBadge>();
  const primaryCounts = new Map<PlayerTypeBadge, number>();

  players.forEach((player) => {
    getPlayerTypeBadges(player).forEach((badge) => represented.add(badge.type));

    const primaryBadge = getPrimaryPlayerTypeBadge(player);
    if (!primaryBadge) return;

    primaryCounts.set(primaryBadge.type, (primaryCounts.get(primaryBadge.type) ?? 0) + 1);
  });

  const duplicatePrimaryCount = Math.max(
    0,
    Array.from(primaryCounts.values()).reduce((sum, count) => sum + Math.max(0, count - 1), 0),
  );

  return {
    representedTypes: Array.from(represented),
    representedCount: represented.size,
    uniquePrimaryCount: primaryCounts.size,
    duplicatePrimaryCount,
  };
};
