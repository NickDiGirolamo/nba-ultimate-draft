import { allPlayers } from "../data/players";
import { assignPlayerToRoster, rosterTemplate } from "./draft";
import { isDynamicDuoActiveForPlayer } from "./dynamicDuos";
import { mulberry32 } from "./random";
import { evaluateDraftChemistry } from "./simulate";
import { Player, PlayerTier, Position, RosterSlot, RosterSlotType } from "../types";

export type RoguelikeStarterPackageId =
  | "balanced-foundation"
  | "defense-lab"
  | "creator-camp";

export type RoguelikeBundleId =
  | "balanced-floor"
  | "synergy-hunters"
  | "frontcourt-pressure"
  | "elite-closers"
  | "jumbo-wings"
  | "spacing-punch";

export type RoguelikeNodeType = "draft" | "challenge" | "boss" | "training" | "trade";
export type RoguelikeMetric = "overall" | "offense" | "defense" | "chemistry";
export type RoguelikeBattleMode = "starting-five-faceoff";

export interface RoguelikeStarterPackage {
  id: RoguelikeStarterPackageId;
  title: string;
  subtitle: string;
  description: string;
  focus: string;
}

export interface RoguelikeBundle {
  id: RoguelikeBundleId;
  title: string;
  description: string;
}

export interface RoguelikeNode {
  id: string;
  floor: number;
  act: number;
  type: RoguelikeNodeType;
  title: string;
  description: string;
  rewardBundleId: RoguelikeBundleId;
  rewardChoices: number;
  livesPenalty?: number;
  targetLabel?: string;
  battleMode?: RoguelikeBattleMode;
  eliminationOnLoss?: boolean;
  checks?: Array<{
    metric: RoguelikeMetric;
    target: number;
  }>;
  opponentTeamName?: string;
  opponentPlayerIds?: string[];
}

export interface RoguelikeRosterMetrics {
  overall: number;
  offense: number;
  defense: number;
  chemistry: number;
}

export interface RoguelikeFaceoffMatchup {
  slot: RosterSlotType;
  userPlayer: Player | null;
  opponentPlayer: Player | null;
  userRating: number;
  opponentRating: number;
  ratingDelta: number;
  userWinProbability: number;
  opponentWinProbability: number;
}

export interface RoguelikeFaceoffResult {
  userLineup: RosterSlot[];
  opponentLineup: RosterSlot[];
  matchups: RoguelikeFaceoffMatchup[];
  userTeamWinProbability: number;
  opponentTeamWinProbability: number;
}

const VERSION_SUFFIX_PATTERN = /\s\([^)]*\)$/;
const STARTING_FIVE_POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];
const ACT_ONE_FACEOFF_TARGET_TOTAL = 420;

export const roguelikeStarterPackages: RoguelikeStarterPackage[] = [
  {
    id: "balanced-foundation",
    title: "Balanced Foundation",
    subtitle: "Safest opener",
    description:
      "Start with a stable all-around pool of non-S-tier stars and high-end supporting pieces.",
    focus: "Great if you want the cleanest first run and the most forgiving early chemistry checks.",
  },
  {
    id: "defense-lab",
    title: "Defense Lab",
    subtitle: "Stops first",
    description:
      "Lean into stoppers, rim deterrence, and stronger defensive floors right from the opening board.",
    focus: "Best for surviving early checks, but you may have to work harder later for offense and creation.",
  },
  {
    id: "creator-camp",
    title: "Creator Camp",
    subtitle: "Playmaking pressure",
    description:
      "Open with initiators, lead guards, and shot-creators who can snowball your run quickly.",
    focus: "High-ceiling if you connect the right synergies, but it can get fragile if your lineup shape falls apart.",
  },
];

export const roguelikeBundles: RoguelikeBundle[] = [
  {
    id: "balanced-floor",
    title: "Balanced Floor",
    description: "Adds more clean all-around rotation pieces into your run pool.",
  },
  {
    id: "synergy-hunters",
    title: "Synergy Hunters",
    description: "Adds more combo-heavy players who can help you light up Duo, Big 3, Centerpiece, and Role Player paths.",
  },
  {
    id: "frontcourt-pressure",
    title: "Frontcourt Pressure",
    description: "Adds bigger interior scorers, glass-eaters, and size-first options.",
  },
  {
    id: "elite-closers",
    title: "Elite Closers",
    description: "Opens the door to stronger late-run stars and more ceiling-raising cards.",
  },
  {
    id: "jumbo-wings",
    title: "Jumbo Wings",
    description: "Adds longer, more versatile wings who can protect both defense and chemistry.",
  },
  {
    id: "spacing-punch",
    title: "Spacing Punch",
    description: "Adds more shooting, cleaner offensive fit, and higher-pressure scorers.",
  },
];

export const roguelikeNodes: RoguelikeNode[] = [
  {
    id: "starter-cache",
    floor: 1,
    act: 1,
    type: "draft",
    title: "Starter Cache",
    description: "Add two more B-tier or C-tier players to complete your opening five before the first challenge.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 0,
  },
  {
    id: "act-one-faceoff",
    floor: 2,
    act: 1,
    type: "boss",
    title: "Act I Faceoff",
    description: "Your first real test is a fixed five-man opponent built to punish sloppy openings and reward coherent early builds.",
    rewardBundleId: "synergy-hunters",
    rewardChoices: 5,
    targetLabel: "Beat the Midrange Machine starting five",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    livesPenalty: 1,
    opponentTeamName: "Midrange Machine",
    opponentPlayerIds: [
      "chauncey-billups",
      "eddie-jones",
      "shawn-marion",
      "al-horford",
      "joakim-noah",
    ],
  },
  {
    id: "frontcourt-wave",
    floor: 3,
    act: 1,
    type: "challenge",
    title: "Challenge 1: Offense is the Best Defense",
    description: "You have six players now. Arrange your best offensive starting five and prove this run can generate enough scoring pressure to keep climbing.",
    rewardBundleId: "frontcourt-pressure",
    rewardChoices: 5,
    targetLabel: "Reach 86 Offense with your starting five",
    livesPenalty: 1,
    checks: [{ metric: "offense", target: 86 }],
  },
  {
    id: "training-day",
    floor: 4,
    act: 1,
    type: "training",
    title: "Training Day",
    description: "Pick one player from your run roster and send them to training. That player gains +1 Overall for the rest of the run.",
    rewardBundleId: "elite-closers",
    rewardChoices: 0,
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  },
  {
    id: "trade-deadline-1",
    floor: 5,
    act: 1,
    type: "trade",
    title: "Trade Deadline 1",
    description: "It's Trade Deadline day. Decide whether to move one player from your run roster for a shot at a new 1-of-5 draft board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 replacement from 5 options",
  },
  {
    id: "act-one-boss",
    floor: 6,
    act: 1,
    type: "boss",
    title: "Act I Boss: Core Audit",
    description: "Your run survives if the top of the roster is both strong and structurally coherent.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
    targetLabel: "Reach 89 OVR and 15 Chemistry",
    livesPenalty: 2,
    checks: [
      { metric: "overall", target: 89 },
      { metric: "chemistry", target: 15 },
    ],
  },
  {
    id: "jumbo-wing-lab",
    floor: 7,
    act: 2,
    type: "draft",
    title: "Jumbo Wing Lab",
    description: "Longer wings and flexible forwards arrive. This is where balanced runs often separate.",
    rewardBundleId: "jumbo-wings",
    rewardChoices: 3,
  },
  {
    id: "spacing-test",
    floor: 8,
    act: 2,
    type: "challenge",
    title: "Spacing Test",
    description: "Can the offense breathe, or have you drafted yourself into a traffic jam?",
    rewardBundleId: "spacing-punch",
    rewardChoices: 3,
    targetLabel: "Reach 89 Offense",
    livesPenalty: 1,
    checks: [{ metric: "offense", target: 89 }],
  },
  {
    id: "closer-cache",
    floor: 9,
    act: 2,
    type: "draft",
    title: "Closer Cache",
    description: "One last push before the final gate. Take ceiling if you can still hold the structure together.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
  },
  {
    id: "final-boss",
    floor: 10,
    act: 2,
    type: "boss",
    title: "Final Boss: Championship Gate",
    description: "This run only ends in victory if the roster looks like something that could really survive the whole gauntlet.",
    rewardBundleId: "elite-closers",
    rewardChoices: 0,
    targetLabel: "Reach 91 OVR, 87 Defense, and 18 Chemistry",
    livesPenalty: 3,
    checks: [
      { metric: "overall", target: 91 },
      { metric: "defense", target: 87 },
      { metric: "chemistry", target: 18 },
    ],
  },
];

const getPlayerIdentityKey = (player: Player) =>
  player.name.replace(VERSION_SUFFIX_PATTERN, "").trim().toLowerCase();

const rankPlayers = (scorer: (player: Player) => number, limit: number) =>
  allPlayers
    .map((player) => ({ player, score: scorer(player) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.player)
    .slice(0, limit);

const uniqueByIdentity = (players: Player[]) => {
  const identities = new Set<string>();
  return players.filter((player) => {
    const identity = getPlayerIdentityKey(player);
    if (identities.has(identity)) return false;
    identities.add(identity);
    return true;
  });
};

const starterPackageCandidates: Record<RoguelikeStarterPackageId, Player[]> = {
  "balanced-foundation": uniqueByIdentity(
    rankPlayers((player) => {
      if (player.hallOfFameTier === "S") return -1;
      return player.overall * 0.75 + player.offense * 0.12 + player.defense * 0.13;
    }, 30),
  ),
  "defense-lab": uniqueByIdentity(
    rankPlayers((player) => {
      if (player.hallOfFameTier === "S") return -1;
      if (player.defense < 82) return -1;
      return player.defense * 1.45 + player.rebounding * 0.3 + player.overall * 0.45;
    }, 30),
  ),
  "creator-camp": uniqueByIdentity(
    rankPlayers((player) => {
      if (player.hallOfFameTier === "S") return -1;
      if (player.playmaking < 80) return -1;
      return player.playmaking * 1.45 + player.offense * 0.5 + player.shooting * 0.25;
    }, 30),
  ),
};

const bundleCandidates: Record<RoguelikeBundleId, Player[]> = {
  "balanced-floor": uniqueByIdentity(
    rankPlayers((player) => {
      if (player.hallOfFameTier === "S") return -1;
      return player.overall * 0.8 + player.defense * 0.15 + player.offense * 0.15;
    }, 24),
  ),
  "synergy-hunters": uniqueByIdentity(
    rankPlayers((player) => {
      const badgeScore = player.badges.length;
      if (badgeScore === 0) return -1;
      return badgeScore * 18 + player.overall * 0.45 + player.intangibles * 0.3;
    }, 22),
  ),
  "frontcourt-pressure": uniqueByIdentity(
    rankPlayers((player) => {
      if (!["PF", "C"].includes(player.primaryPosition)) return -1;
      return player.rebounding * 0.7 + player.offense * 0.5 + player.overall * 0.4;
    }, 22),
  ),
  "elite-closers": uniqueByIdentity(
    rankPlayers((player) => player.overall >= 92 ? player.overall * 1.2 + player.offense * 0.3 : -1, 20),
  ),
  "jumbo-wings": uniqueByIdentity(
    rankPlayers((player) => {
      if (!["SF", "PF"].includes(player.primaryPosition)) return -1;
      return player.defense * 0.6 + player.rebounding * 0.35 + player.overall * 0.45;
    }, 22),
  ),
  "spacing-punch": uniqueByIdentity(
    rankPlayers((player) => (player.shooting >= 84 ? player.shooting * 0.8 + player.offense * 0.4 : -1), 22),
  ),
};

export const buildStarterPool = (packageId: RoguelikeStarterPackageId) =>
  [...starterPackageCandidates[packageId]];

export const buildOpeningDraftPool = () =>
  uniqueByIdentity(
    allPlayers.filter((player) => player.hallOfFameTier === "B" || player.hallOfFameTier === "C"),
  );

const starterRevealSlots = [
  ["PG", "SG"],
  ["SG", "SF", "PF"],
  ["PF", "C"],
] as const;
const STARTER_REVEAL_TARGET_TOTAL = 249;

const scoreStarterRevealPlayer = (
  player: Player,
  packageId: RoguelikeStarterPackageId,
) => {
  const base = player.overall * 0.45;

  if (packageId === "balanced-foundation") {
    return base + player.offense * 0.18 + player.defense * 0.18 + player.playmaking * 0.08;
  }

  if (packageId === "defense-lab") {
    return base + player.defense * 0.34 + player.rebounding * 0.12 + player.offense * 0.06;
  }

  return base + player.playmaking * 0.32 + player.offense * 0.16 + player.shooting * 0.08;
};

const canFillStarterRevealSlot = (player: Player, slotPositions: readonly string[]) => {
  const positions = [player.primaryPosition, ...player.secondaryPositions];
  return positions.some((position) => slotPositions.includes(position));
};

export const drawRoguelikeStarterRevealPlayers = (
  packageId: RoguelikeStarterPackageId,
  seed: number,
) => {
  const rng = mulberry32(seed);
  const eligible = uniqueByIdentity(
    allPlayers.filter((player) => player.hallOfFameTier === "B" || player.hallOfFameTier === "C"),
  );
  const selectedIds = new Set<string>();
  const slotCandidatePools = starterRevealSlots.map((slotPositions) =>
    eligible
      .filter((player) => canFillStarterRevealSlot(player, slotPositions))
      .filter((player) => player.overall >= 82 && player.overall <= 84)
      .sort((a, b) => scoreStarterRevealPlayer(b, packageId) - scoreStarterRevealPlayer(a, packageId))
      .slice(0, 18),
  );
  const validSelections: Player[][] = [];
  const currentSelection: Player[] = [];

  const search = (slotIndex: number, totalOverall: number) => {
    if (slotIndex === slotCandidatePools.length) {
      if (totalOverall === STARTER_REVEAL_TARGET_TOTAL) {
        validSelections.push([...currentSelection]);
      }
      return;
    }

    const remainingSlots = slotCandidatePools.length - slotIndex - 1;
    const candidates = slotCandidatePools[slotIndex] ?? [];

    for (const candidate of candidates) {
      if (selectedIds.has(candidate.id)) continue;

      const nextTotal = totalOverall + candidate.overall;
      const minPossible = nextTotal + remainingSlots * 82;
      const maxPossible = nextTotal + remainingSlots * 84;
      if (minPossible > STARTER_REVEAL_TARGET_TOTAL || maxPossible < STARTER_REVEAL_TARGET_TOTAL) {
        continue;
      }

      currentSelection.push(candidate);
      selectedIds.add(candidate.id);
      search(slotIndex + 1, nextTotal);
      currentSelection.pop();
      selectedIds.delete(candidate.id);
    }
  };

  search(0, 0);

  if (validSelections.length > 0) {
    const selectedIndex = Math.floor(rng() * validSelections.length);
    return validSelections[selectedIndex] ?? validSelections[0];
  }

  const selected: Player[] = [];
  selectedIds.clear();
  slotCandidatePools.forEach((candidates) => {
    const fallback = candidates.find((player) => !selectedIds.has(player.id));
    if (!fallback) return;
    selected.push(fallback);
    selectedIds.add(fallback.id);
  });

  return selected;
};

export const getBundle = (bundleId: RoguelikeBundleId) =>
  roguelikeBundles.find((bundle) => bundle.id === bundleId) ?? roguelikeBundles[0];

export const unlockBundlePlayers = (
  currentPool: Player[],
  currentRoster: Player[],
  bundleId: RoguelikeBundleId,
) => {
  const seenIds = new Set(currentPool.map((player) => player.id));
  const blockedIdentities = new Set(currentRoster.map(getPlayerIdentityKey));

  const additions = bundleCandidates[bundleId].filter((player) => {
    if (seenIds.has(player.id)) return false;
    return !blockedIdentities.has(getPlayerIdentityKey(player));
  });

  return [...currentPool, ...additions];
};

export const drawRoguelikeChoices = (
  pool: Player[],
  roster: Player[],
  count: number,
  seed: number,
  allowedTiers?: PlayerTier[],
  blockedPlayerIds: string[] = [],
) => {
  const rng = mulberry32(seed);
  const rosterIdentities = new Set(roster.map(getPlayerIdentityKey));
  const blockedIds = new Set(blockedPlayerIds);
  const seenIds = new Set<string>();
  const collectCandidates = (source: Player[], enforceTiers: boolean) =>
    source.filter((player) => {
      const identity = getPlayerIdentityKey(player);
      if (rosterIdentities.has(identity)) return false;
      if (blockedIds.has(player.id)) return false;
      if (seenIds.has(player.id)) return false;
      if (enforceTiers && allowedTiers && !allowedTiers.includes(player.hallOfFameTier)) return false;
      seenIds.add(player.id);
      return true;
    });

  const candidates = collectCandidates(pool, true);

  if (candidates.length < count && allowedTiers) {
    candidates.push(...collectCandidates(allPlayers, true));
  }

  if (candidates.length < count && !allowedTiers) {
    candidates.push(...collectCandidates(pool, false));
    candidates.push(...collectCandidates(allPlayers, false));
  }

  const shuffled = [...candidates];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  const primaryPositionCounts = new Map<Position, number>();
  const diverseChoices: Player[] = [];
  const perPositionCap = Math.max(1, Math.ceil(count / 3));

  for (const candidate of shuffled) {
    const currentCount = primaryPositionCounts.get(candidate.primaryPosition) ?? 0;
    if (currentCount >= perPositionCap) continue;

    diverseChoices.push(candidate);
    primaryPositionCounts.set(candidate.primaryPosition, currentCount + 1);

    if (diverseChoices.length === count) {
      return diverseChoices;
    }
  }

  for (const candidate of shuffled) {
    if (diverseChoices.some((player) => player.id === candidate.id)) continue;
    diverseChoices.push(candidate);
    if (diverseChoices.length === count) {
      break;
    }
  }

  return diverseChoices;
};

export const buildPreviewRoster = (players: Player[]) => {
  const roster = rosterTemplate();
  return players.reduce((currentRoster, player) => assignPlayerToRoster(currentRoster, player).roster, roster);
};

const scorePlayerForStarterSlot = (player: Player, slot: RosterSlot) => {
  if (slot.allowedPositions.includes(player.primaryPosition)) {
    return 200 + player.overall;
  }

  if (player.secondaryPositions.some((position) => slot.allowedPositions.includes(position))) {
    return 140 + player.overall;
  }

  return player.overall;
};

const POSITION_INDEX: Record<Position, number> = {
  PG: 0,
  SG: 1,
  SF: 2,
  PF: 3,
  C: 4,
};

const getRoguelikeSlotMismatchSeverity = (player: Player | null, slot: RosterSlot) => {
  if (!player) return 0;
  if (slot.allowedPositions.includes(player.primaryPosition)) return 0;
  if (player.secondaryPositions.some((position) => slot.allowedPositions.includes(position))) return 0;

  const playerPositions = [player.primaryPosition, ...player.secondaryPositions];
  let closestDistance = Infinity;

  for (const playerPosition of playerPositions) {
    for (const allowedPosition of slot.allowedPositions) {
      const distance = Math.abs(POSITION_INDEX[playerPosition] - POSITION_INDEX[allowedPosition]);
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    }
  }

  return Number.isFinite(closestDistance) ? closestDistance : 1;
};

const ROGUELIKE_DUO_BOOST = {
  overall: 2,
  offense: 2,
  defense: 2,
  playmaking: 2,
  shooting: 2,
  rebounding: 2,
  athleticism: 2,
  intangibles: 2,
  ballDominance: 2,
  interiorDefense: 2,
  perimeterDefense: 2,
} as const;

const ROGUELIKE_TRAINING_BOOST = {
  overall: 1,
  offense: 1,
  defense: 1,
  playmaking: 1,
  shooting: 1,
  rebounding: 1,
  athleticism: 1,
  intangibles: 1,
  ballDominance: 1,
  interiorDefense: 1,
  perimeterDefense: 1,
} as const;

const getRoguelikeDynamicDuoBoost = (
  player: Player | null,
  playerIds: string[] = [],
  stat: keyof typeof ROGUELIKE_DUO_BOOST = "overall",
) => {
  if (!player || playerIds.length === 0) return 0;
  return isDynamicDuoActiveForPlayer(player.id, playerIds) ? ROGUELIKE_DUO_BOOST[stat] : 0;
};

const getRoguelikeTrainingBoost = (
  player: Player | null,
  trainedPlayerIds: string[] = [],
  stat: keyof typeof ROGUELIKE_TRAINING_BOOST = "overall",
) => {
  if (!player || trainedPlayerIds.length === 0) return 0;
  return trainedPlayerIds.includes(player.id) ? ROGUELIKE_TRAINING_BOOST[stat] : 0;
};

const getRoguelikeAdjustedRatingForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] | undefined,
  trainedPlayerIds: string[] | undefined,
  selector: (target: Player) => number,
  boostStat: keyof typeof ROGUELIKE_DUO_BOOST,
  baseWeight: number,
  severityWeight: number,
) => {
  if (!player) return 0;

  const baseValue =
    selector(player) +
    getRoguelikeDynamicDuoBoost(player, playerIds, boostStat) +
    getRoguelikeTrainingBoost(player, trainedPlayerIds, boostStat);
  const slotPenalty = getRoguelikeSlotPenalty(player, slot);
  const mismatchSeverity = getRoguelikeSlotMismatchSeverity(player, slot);

  if (slotPenalty === 0 || mismatchSeverity === 0) {
    return baseValue;
  }

  const penalty = Math.round(slotPenalty * baseWeight + mismatchSeverity * severityWeight);
  return Math.max(0, baseValue - penalty);
};

export const buildRoguelikeStarterLineup = (players: Player[]) => {
  const lineup = rosterTemplate();
  const starterSlots = lineup.slice(0, 5);
  const starterPlayers = players.slice(0, 5);
  const assignedPlayers = new Set<string>();
  const selectedBySlot = new Array<Player | null>(starterSlots.length).fill(null);
  let bestScore = -Infinity;

  const search = (slotIndex: number, totalScore: number) => {
    if (slotIndex === starterSlots.length) {
      if (assignedPlayers.size === starterPlayers.length && totalScore > bestScore) {
        bestScore = totalScore;
        starterSlots.forEach((_, index) => {
          lineup[index] = {
            ...lineup[index],
            player: selectedBySlot[index],
          };
        });
      }
      return;
    }

    const slot = starterSlots[slotIndex];
    const remainingSlots = starterSlots.length - slotIndex - 1;
    const remainingPlayers = starterPlayers.length - assignedPlayers.size;

    if (remainingPlayers <= remainingSlots) {
      selectedBySlot[slotIndex] = null;
      search(slotIndex + 1, totalScore);
      selectedBySlot[slotIndex] = null;
    }

    for (const player of starterPlayers) {
      if (assignedPlayers.has(player.id)) continue;

      assignedPlayers.add(player.id);
      selectedBySlot[slotIndex] = player;
      search(slotIndex + 1, totalScore + scorePlayerForStarterSlot(player, slot));
      selectedBySlot[slotIndex] = null;
      assignedPlayers.delete(player.id);
    }
  };

  search(0, 0);
  return lineup;
};

export const getRoguelikeSlotPenalty = (player: Player | null, slot: RosterSlot) => {
  if (!player) return 0;
  if (slot.allowedPositions.includes(player.primaryPosition)) return 0;
  if (player.secondaryPositions.some((position) => slot.allowedPositions.includes(position))) return 0;
  return 5;
};

export const getRoguelikeAdjustedOverallForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) => {
  if (!player) return 0;
  return Math.max(
    0,
    player.overall +
      getRoguelikeDynamicDuoBoost(player, playerIds, "overall") +
      getRoguelikeTrainingBoost(player, trainedPlayerIds, "overall") -
      getRoguelikeSlotPenalty(player, slot),
  );
};

export const getRoguelikeAdjustedOffenseForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) => getRoguelikeAdjustedRatingForSlot(player, slot, playerIds, trainedPlayerIds, (target) => target.offense, "offense", 0.72, 1.7);

export const getRoguelikeAdjustedDefenseForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) => getRoguelikeAdjustedRatingForSlot(player, slot, playerIds, trainedPlayerIds, (target) => target.defense, "defense", 0.68, 1.6);

export const getRoguelikeAdjustedPlaymakingForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) =>
  getRoguelikeAdjustedRatingForSlot(player, slot, playerIds, trainedPlayerIds, (target) => target.playmaking, "playmaking", 0.68, 1.55);

export const getRoguelikeAdjustedShootingForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) =>
  getRoguelikeAdjustedRatingForSlot(player, slot, playerIds, trainedPlayerIds, (target) => target.shooting, "shooting", 0.62, 1.45);

export const getRoguelikeAdjustedReboundingForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) =>
  getRoguelikeAdjustedRatingForSlot(player, slot, playerIds, trainedPlayerIds, (target) => target.rebounding, "rebounding", 0.6, 1.35);

export const getRoguelikeAdjustedAthleticismForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) =>
  getRoguelikeAdjustedRatingForSlot(player, slot, playerIds, trainedPlayerIds, (target) => target.athleticism, "athleticism", 0.58, 1.3);

export const getRoguelikeAdjustedIntangiblesForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) =>
  getRoguelikeAdjustedRatingForSlot(player, slot, playerIds, trainedPlayerIds, (target) => target.intangibles, "intangibles", 0.54, 1.25);

export const buildRoguelikeOpponentLineup = (node: RoguelikeNode) => {
  const lineup = rosterTemplate();
  const players =
    node.opponentPlayerIds
      ?.map((playerId) => allPlayers.find((player) => player.id === playerId))
      .filter((player): player is Player => Boolean(player)) ?? [];
  const starterIndexByPosition: Record<Position, number> = {
    PG: 0,
    SG: 1,
    SF: 2,
    PF: 3,
    C: 4,
  };

  players.forEach((player) => {
    const starterIndex = starterIndexByPosition[player.primaryPosition];
    if (lineup[starterIndex] && !lineup[starterIndex].player) {
      lineup[starterIndex] = {
        ...lineup[starterIndex],
        player,
      };
      return;
    }

    const assigned = assignPlayerToRoster(lineup, player);
    assigned.roster.forEach((slot, index) => {
      lineup[index] = slot;
    });
  });

  return lineup;
};

const shufflePlayers = (players: Player[], rng: () => number) => {
  const shuffled = [...players];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const buildExactPositionCandidateMap = (
  blockedIdentities: Set<string>,
  rng: () => number,
) =>
  STARTING_FIVE_POSITIONS.reduce((accumulator, position) => {
    const allExactPositionPlayers = uniqueByIdentity(
      allPlayers.filter((player) => {
        if (player.primaryPosition !== position) return false;
        return !blockedIdentities.has(getPlayerIdentityKey(player));
      }),
    ).sort((a, b) => Math.abs(a.overall - 84) - Math.abs(b.overall - 84) || b.overall - a.overall);

    const boundedPlayers = allExactPositionPlayers.filter((player) => player.overall >= 82 && player.overall <= 88);
    const positionPlayers = boundedPlayers.length > 0 ? boundedPlayers : allExactPositionPlayers;

    accumulator[position] = shufflePlayers(positionPlayers, rng);
    return accumulator;
  }, {} as Record<Position, Player[]>);

export const generateActOneFaceoffOpponentPlayerIds = (
  roster: Player[],
  seed: number,
) => {
  const rng = mulberry32(seed);
  const blockedIdentities = new Set(roster.map(getPlayerIdentityKey));
  const candidatesByPosition = buildExactPositionCandidateMap(blockedIdentities, rng);
  const selected: Player[] = [];
  const usedIdentities = new Set<string>();

  const search = (positionIndex: number, totalOverall: number): boolean => {
    if (positionIndex === STARTING_FIVE_POSITIONS.length) {
      return totalOverall === ACT_ONE_FACEOFF_TARGET_TOTAL;
    }

    const position = STARTING_FIVE_POSITIONS[positionIndex];
    const candidates = candidatesByPosition[position] ?? [];
    const remainingSlots = STARTING_FIVE_POSITIONS.length - positionIndex - 1;

    for (const candidate of candidates) {
      const identity = getPlayerIdentityKey(candidate);
      if (usedIdentities.has(identity)) continue;

      const nextTotal = totalOverall + candidate.overall;
      const minimumPossible = nextTotal + remainingSlots * 82;
      const maximumPossible = nextTotal + remainingSlots * 88;
      if (minimumPossible > ACT_ONE_FACEOFF_TARGET_TOTAL || maximumPossible < ACT_ONE_FACEOFF_TARGET_TOTAL) {
        continue;
      }

      usedIdentities.add(identity);
      selected.push(candidate);
      if (search(positionIndex + 1, nextTotal)) return true;
      selected.pop();
      usedIdentities.delete(identity);
    }

    return false;
  };

  if (search(0, 0)) {
    return selected.map((player) => player.id);
  }

  const fallbackSelected: string[] = [];
  const fallbackUsedIdentities = new Set<string>();

  STARTING_FIVE_POSITIONS.forEach((position) => {
    const candidate = (candidatesByPosition[position] ?? []).find((player) => {
      const identity = getPlayerIdentityKey(player);
      return !fallbackUsedIdentities.has(identity);
    });

    if (candidate) {
      fallbackSelected.push(candidate.id);
      fallbackUsedIdentities.add(getPlayerIdentityKey(candidate));
    }
  });

  return fallbackSelected;
};

export const evaluateRoguelikeRoster = (players: Player[], trainedPlayerIds: string[] = []): RoguelikeRosterMetrics => {
  if (players.length === 0) {
    return {
      overall: 0,
      offense: 0,
      defense: 0,
      chemistry: 0,
    };
  }

  const average = (selector: (player: Player) => number) =>
    Math.round((players.reduce((sum, player) => sum + selector(player), 0) / players.length) * 10) / 10;

  const chemistry = evaluateDraftChemistry(buildPreviewRoster(players)).score;

  return {
    overall: average((player) => player.overall + getRoguelikeTrainingBoost(player, trainedPlayerIds, "overall")),
    offense: average((player) => player.offense + getRoguelikeTrainingBoost(player, trainedPlayerIds, "offense")),
    defense: average((player) => player.defense + getRoguelikeTrainingBoost(player, trainedPlayerIds, "defense")),
    chemistry: Math.round(chemistry * 10) / 10,
  };
};

export const evaluateRoguelikeLineup = (
  lineup: RosterSlot[],
  ownedPlayerIds: string[] = [],
  trainedPlayerIds: string[] = [],
): RoguelikeRosterMetrics => {
  const players = lineup.map((slot) => slot.player).filter((player): player is Player => Boolean(player));
  const playerIds =
    ownedPlayerIds.length > 0 ? Array.from(new Set([...ownedPlayerIds, ...players.map((player) => player.id)])) : players.map((player) => player.id);

  if (players.length === 0) {
    return {
      overall: 0,
      offense: 0,
      defense: 0,
      chemistry: 0,
    };
  }

  const filledSlots = lineup.filter((slot) => Boolean(slot.player));
  const average = (selector: (slot: RosterSlot) => number) =>
    Math.round((filledSlots.reduce((sum, slot) => sum + selector(slot), 0) / filledSlots.length) * 10) / 10;

  const chemistry = evaluateDraftChemistry(lineup).score;

  return {
    overall: average((slot) => getRoguelikeAdjustedOverallForSlot(slot.player, slot, playerIds, trainedPlayerIds)),
    offense: average((slot) => {
      const adjustedOffense = getRoguelikeAdjustedOffenseForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      const adjustedPlaymaking = getRoguelikeAdjustedPlaymakingForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      const adjustedShooting = getRoguelikeAdjustedShootingForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      const adjustedAthleticism = getRoguelikeAdjustedAthleticismForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      const adjustedIntangibles = getRoguelikeAdjustedIntangiblesForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      return (
        Math.round(
          (
            adjustedOffense * 0.46 +
            adjustedPlaymaking * 0.18 +
            adjustedShooting * 0.18 +
            adjustedAthleticism * 0.1 +
            adjustedIntangibles * 0.08
          ) * 10,
        ) / 10
      );
    }),
    defense: average((slot) => {
      const adjustedDefense = getRoguelikeAdjustedDefenseForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      const adjustedRebounding = getRoguelikeAdjustedReboundingForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      const adjustedAthleticism = getRoguelikeAdjustedAthleticismForSlot(slot.player, slot, playerIds, trainedPlayerIds);
      return Math.round((adjustedDefense * 0.64 + adjustedRebounding * 0.22 + adjustedAthleticism * 0.14) * 10) / 10;
    }),
    chemistry: Math.round(chemistry * 10) / 10,
  };
};

const getFaceoffPlayerRating = (
  player: Player | null,
  slot: RosterSlot,
  ownedPlayerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) => {
  return getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
};

const getHeadToHeadWinProbability = (ratingDelta: number) => {
  const rawProbability = 1 / (1 + Math.exp(-0.255 * ratingDelta));
  return Math.max(0.01, Math.min(0.99, rawProbability));
};

export const resolveRoguelikeFaceoff = (
  node: RoguelikeNode,
  lineup: RosterSlot[],
  ownedPlayerIds: string[] = [],
  opponentOwnedPlayerIds: string[] = [],
  trainedPlayerIds: string[] = [],
  opponentTrainedPlayerIds: string[] = [],
): RoguelikeFaceoffResult => {
  const userLineup = lineup.map((slot) => ({ ...slot })).slice(0, 5);
  const opponentLineup = buildRoguelikeOpponentLineup(node).slice(0, 5);
  const resolvedUserPlayerIds =
    ownedPlayerIds.length > 0
      ? Array.from(new Set([...ownedPlayerIds, ...userLineup.map((slot) => slot.player?.id).filter((id): id is string => Boolean(id))]))
      : userLineup.map((slot) => slot.player?.id).filter((id): id is string => Boolean(id));
  const resolvedOpponentPlayerIds =
    opponentOwnedPlayerIds.length > 0
      ? Array.from(
          new Set([...opponentOwnedPlayerIds, ...opponentLineup.map((slot) => slot.player?.id).filter((id): id is string => Boolean(id))]),
        )
      : opponentLineup.map((slot) => slot.player?.id).filter((id): id is string => Boolean(id));

  const matchups = userLineup.map((userSlot, index) => {
    const opponentSlot = opponentLineup[index] ?? userSlot;
    const userPlayer = userSlot.player;
    const opponentPlayer = opponentSlot?.player ?? null;
    const userRating = getFaceoffPlayerRating(userPlayer, userSlot, resolvedUserPlayerIds, trainedPlayerIds);
    const opponentRating = getFaceoffPlayerRating(
      opponentPlayer,
      opponentSlot ?? userSlot,
      resolvedOpponentPlayerIds,
      opponentTrainedPlayerIds,
    );
    const ratingDelta = userRating - opponentRating;
    const userWinProbability = getHeadToHeadWinProbability(ratingDelta);
    const opponentWinProbability = 1 - userWinProbability;

    return {
      slot: userSlot.slot,
      userPlayer,
      opponentPlayer,
      userRating,
      opponentRating,
      ratingDelta,
      userWinProbability: Math.round(userWinProbability * 1000) / 10,
      opponentWinProbability: Math.round(opponentWinProbability * 1000) / 10,
    } satisfies RoguelikeFaceoffMatchup;
  });

  const userTeamWinProbability = Math.round(
    matchups.reduce((sum, matchup) => sum + matchup.userWinProbability, 0) * 10,
  ) / 10;
  const opponentTeamWinProbability = Math.round(
    matchups.reduce((sum, matchup) => sum + matchup.opponentWinProbability, 0) * 10,
  ) / 10;

  return {
    userLineup,
    opponentLineup,
    matchups,
    userTeamWinProbability,
    opponentTeamWinProbability,
  };
};

export const resolveRoguelikeNode = (
  node: RoguelikeNode,
  players: Player[],
  lineup?: RosterSlot[],
  trainedPlayerIds: string[] = [],
) => {
  const playerIds = players.map((player) => player.id);
  const metrics = lineup ? evaluateRoguelikeLineup(lineup, playerIds, trainedPlayerIds) : evaluateRoguelikeRoster(players, trainedPlayerIds);
  const opponentPlayers =
    node.opponentPlayerIds?.map((playerId) => allPlayers.find((player) => player.id === playerId)).filter(
      (player): player is Player => Boolean(player),
    ) ?? [];
  const opponentMetrics =
    opponentPlayers.length > 0 ? evaluateRoguelikeLineup(buildPreviewRoster(opponentPlayers), opponentPlayers.map((player) => player.id)) : null;
  const faceoffResult =
      node.battleMode === "starting-five-faceoff" && lineup
        ? resolveRoguelikeFaceoff(node, lineup, playerIds, opponentPlayers.map((player) => player.id), trainedPlayerIds)
        : null;
  const checks = node.checks ?? [];
  const weightedUserScore =
    metrics.overall * 0.34 + metrics.offense * 0.23 + metrics.defense * 0.23 + metrics.chemistry * 0.2;
  const weightedOpponentScore = opponentMetrics
    ? opponentMetrics.overall * 0.34 +
      opponentMetrics.offense * 0.23 +
      opponentMetrics.defense * 0.23 +
      opponentMetrics.chemistry * 0.2
    : null;
  const passed =
    faceoffResult
      ? faceoffResult.userTeamWinProbability > faceoffResult.opponentTeamWinProbability
      : opponentMetrics && weightedOpponentScore !== null
      ? weightedUserScore >= weightedOpponentScore
      : checks.every((check) => metrics[check.metric] >= check.target);

  return {
    passed,
    metrics,
    opponentPlayers,
    opponentMetrics,
    faceoffResult,
    weightedUserScore,
    weightedOpponentScore,
    failedChecks: checks.filter((check) => metrics[check.metric] < check.target),
  };
};
