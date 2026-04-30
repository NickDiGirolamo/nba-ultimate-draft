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

export const playerTypeBadgeDefinitions = badgeDefinitions;

const badgeCountByTier: Record<PlayerTier, number> = {
  Emerald: 1,
  Sapphire: 2,
  Ruby: 3,
  Amethyst: 4,
  Galaxy: 5,
};

const manualBadgeOrderOverrides: Partial<Record<string, PlayerTypeBadge[]>> = {
  "santi-aldama-2025-26": ["slasher", "sniper"],
  "isaiah-hartenstein-2025-26": ["board-man", "playmaker"],
  "andre-iguodala": ["slasher", "lockdown"],
  "ben-wallace": ["lockdown", "board-man"],
  "chris-bosh-heat": ["sniper", "board-man"],
  "collin-gillespie-2025-26": ["sniper", "playmaker"],
  "reed-sheppard-2025-26": ["sniper", "playmaker"],
  "ryan-rollins-2025-26": ["sniper", "playmaker"],
  "isaiah-thomas": ["sniper", "playmaker"],
  "danny-granger": ["sniper", "slasher"],
  "josh-hart-2025-26": ["board-man", "playmaker"],
  "nikola-jovic-2025-26": ["playmaker", "board-man"],
  "obi-toppin-2025-26": ["slasher", "board-man"],
  "david-lee": ["board-man", "playmaker"],
  "julius-randle-2025-26": ["slasher", "board-man", "sniper"],
  "lance-stephenson": ["lockdown", "playmaker"],
  "steph-curry": ["sniper", "playmaker", "slasher"],
  "dikembe-mutombo": ["lockdown", "board-man", "slasher"],
  "deni-avdija-2025-26": ["playmaker", "slasher", "sniper"],
  "trae-young-2025-26": ["playmaker", "sniper", "slasher"],
  "miles-bridges-2025-26": ["slasher", "sniper"],
  "brandon-miller-2025-26": ["sniper", "slasher"],
  "tobias-harris-2025-26": ["sniper", "slasher"],
};

const applyBadgeMultiplier = (
  scores: Record<PlayerTypeBadge, number>,
  multipliers: Partial<Record<PlayerTypeBadge, number>>,
) => {
  Object.entries(multipliers).forEach(([type, multiplier]) => {
    if (!multiplier) return;
    scores[type as PlayerTypeBadge] *= multiplier;
  });
};

const getPositionBadgeMultipliers = (player: Player): Partial<Record<PlayerTypeBadge, number>> => {
  switch (player.primaryPosition) {
    case "PG":
      return {
        playmaker: 1.18,
        slasher: 1.08,
        sniper: 1.02,
        lockdown: 1.04,
        "board-man": 0.82,
      };
    case "SG":
      return {
        sniper: 1.1,
        slasher: 1.08,
        playmaker: 1.04,
        lockdown: 1.06,
        "board-man": 0.8,
      };
    case "SF":
      return {
        lockdown: 1.12,
        slasher: 1.06,
        sniper: 1.02,
        "board-man": 0.92,
      };
    case "PF":
      return {
        lockdown: 1.1,
        "board-man": 1.05,
        playmaker: 1.02,
        slasher: 0.96,
        sniper: 0.96,
      };
    case "C":
      return {
        "board-man": 1.12,
        lockdown: 1.1,
        playmaker: 0.86,
        sniper: 0.8,
        slasher: 0.84,
      };
    default:
      return {};
  }
};

const getArchetypeBadgeMultipliers = (player: Player): Partial<Record<PlayerTypeBadge, number>> => {
  const archetype = `${player.archetype} ${player.badges.join(" ")}`.toLowerCase();
  const multipliers: Partial<Record<PlayerTypeBadge, number>> = {};

  const applyIfMatch = (
    pattern: RegExp,
    updates: Partial<Record<PlayerTypeBadge, number>>,
  ) => {
    if (!pattern.test(archetype)) return;
    Object.entries(updates).forEach(([type, multiplier]) => {
      const typedKey = type as PlayerTypeBadge;
      multipliers[typedKey] = (multipliers[typedKey] ?? 1) * multiplier;
    });
  };

  applyIfMatch(
    /sniper|shooter|shooting|floor spacer|shotmaking|shot creator|deep range|off-ball gravity|midrange/,
    { sniper: 1.14 },
  );
  applyIfMatch(
    /shot creator|scoring|scorer|combo guard|wing scorer|slashing|explosive|athletic|transition|downhill|paint pressure|vertical|rim|jet|speed|force/,
    { slasher: 1.12 },
  );
  applyIfMatch(
    /playmaking|floor general|engine|creator|connector|point forward|table setter|tempo/,
    { playmaker: 1.14 },
  );
  applyIfMatch(
    /glass|rebound|board|interior|paint|anchor|post|rim protector|vertical|big|center/,
    { "board-man": 1.1 },
  );
  applyIfMatch(
    /defensive|stopper|point-of-attack|switchable|rim protector|enforcer|two-way|lockdown/,
    { lockdown: 1.14 },
  );
  return multipliers;
};

const getLowTierDistributionMultipliers = (
  player: Player,
): Partial<Record<PlayerTypeBadge, number>> => {
  const tier = getPlayerTier(player);
  if (tier !== "Emerald" && tier !== "Sapphire") return {};

  return {
    slasher: 1.08,
    playmaker: 1.08,
    lockdown: 1.06,
    sniper: 0.96,
    "board-man": 0.96,
  };
};

const applyRelativeStrengthAdjustment = (
  player: Player,
  scores: Record<PlayerTypeBadge, number>,
) => {
  const tier = getPlayerTier(player);
  const anchorScores: Record<PlayerTypeBadge, number> = {
    slasher:
      player.athleticism * 0.48 +
      player.offense * 0.28 +
      player.ballDominance * 0.18 +
      player.intangibles * 0.06,
    sniper:
      player.shooting * 0.74 +
      player.offense * 0.14 +
      player.intangibles * 0.12,
    playmaker:
      player.playmaking * 0.72 +
      player.ballDominance * 0.22 +
      player.intangibles * 0.06,
    "board-man":
      player.rebounding * 0.72 +
      player.interiorDefense * 0.16 +
      player.athleticism * 0.12,
    lockdown:
      player.defense * 0.42 +
      player.perimeterDefense * 0.24 +
      player.interiorDefense * 0.2 +
      player.athleticism * 0.08 +
      player.intangibles * 0.06,
  };

  const anchorValues = Object.values(anchorScores);
  const anchorAverage =
    anchorValues.reduce((sum, value) => sum + value, 0) / anchorValues.length;
  const adjustmentStrength = tier === "Emerald" || tier === "Sapphire" ? 0.45 : 0.25;

  (Object.keys(anchorScores) as PlayerTypeBadge[]).forEach((badgeType) => {
    const relativeEdge = anchorScores[badgeType] - anchorAverage;
    scores[badgeType] += relativeEdge * adjustmentStrength;
  });
};

const getPlayerTypeBadgeScores = (player: Player): PlayerTypeBadgeScore[] => {
  const scores: Record<PlayerTypeBadge, number> = {
    slasher:
      player.athleticism * 0.44 +
      player.offense * 0.22 +
      player.ballDominance * 0.2 +
      player.intangibles * 0.08 +
      player.rebounding * 0.06,
    sniper:
      player.shooting * 0.68 +
      player.offense * 0.16 +
      player.intangibles * 0.1 +
      player.ballDominance * 0.06,
    playmaker:
      player.playmaking * 0.62 +
      player.ballDominance * 0.24 +
      player.offense * 0.08 +
      player.intangibles * 0.06,
    "board-man":
      player.rebounding * 0.58 +
      player.interiorDefense * 0.16 +
      player.defense * 0.12 +
      player.athleticism * 0.08 +
      player.intangibles * 0.06,
    lockdown:
      player.defense * 0.34 +
      player.perimeterDefense * 0.24 +
      player.interiorDefense * 0.2 +
      player.athleticism * 0.12 +
      player.intangibles * 0.1,
  };

  applyBadgeMultiplier(scores, getPositionBadgeMultipliers(player));
  applyBadgeMultiplier(scores, getArchetypeBadgeMultipliers(player));
  applyBadgeMultiplier(scores, getLowTierDistributionMultipliers(player));
  applyRelativeStrengthAdjustment(player, scores);

  return [
    { ...badgeDefinitions.slasher, score: scores.slasher },
    { ...badgeDefinitions.sniper, score: scores.sniper },
    { ...badgeDefinitions.playmaker, score: scores.playmaker },
    { ...badgeDefinitions["board-man"], score: scores["board-man"] },
    { ...badgeDefinitions.lockdown, score: scores.lockdown },
  ];
};

const getSortedPlayerTypeBadgeScores = (player: Player) =>
  getPlayerTypeBadgeScores(player).sort((left, right) => right.score - left.score);

const getOrderedPlayerTypeBadgeScores = (player: Player) => {
  const sortedScores = getSortedPlayerTypeBadgeScores(player);
  const manualOrderOverride = manualBadgeOrderOverrides[player.id];

  if (manualOrderOverride?.length) {
    const promotedScores = manualOrderOverride
      .map((type) => sortedScores.find((score) => score.type === type))
      .filter(Boolean) as PlayerTypeBadgeScore[];

    return [
      ...promotedScores,
      ...sortedScores.filter(
        (score) => !manualOrderOverride.includes(score.type),
      ),
    ];
  }

  return sortedScores;
};

export const getPlayerTypeBadgeCount = (player: Player) =>
  badgeCountByTier[getPlayerTier(player)];

export const getPlayerTypeBadges = (player: Player): PlayerTypeBadgeDefinition[] =>
  getOrderedPlayerTypeBadgeScores(player)
    .slice(0, getPlayerTypeBadgeCount(player))
    .map(({ type, label, description }) => ({ type, label, description }));

export const getPlayerTypeBalanceSnapshot = (players: Player[]): PlayerTypeBalanceSnapshot => {
  const represented = new Set<PlayerTypeBadge>();

  players.forEach((player) => {
    getPlayerTypeBadges(player).forEach((badge) => represented.add(badge.type));
  });

  return {
    representedTypes: Array.from(represented),
    representedCount: represented.size,
  };
};
