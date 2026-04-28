import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Coins,
  Crown,
  GripHorizontal,
  Package2,
  RefreshCcw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { DraftPlayerCard } from "./DraftPlayerCard";
import { DynamicDuoBadge } from "./DynamicDuoBadge";
import { PlayerTypeBadges, playerTypeBadgeStyleClass, renderPlayerTypeBadgeIcon } from "./PlayerTypeBadges";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { RunRosterPlayerCard } from "./RunRosterPlayerCard";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { allPlayers } from "../data/players";
import { assignPlayerToRoster } from "../lib/draft";
import { getPlayerDisplayLines } from "../lib/playerDisplay";
import { getPlayerTier, getPlayerTierLabel } from "../lib/playerTier";
import { mulberry32 } from "../lib/random";
import { getSameTeamChemistryBonusForPlayer } from "../lib/teamChemistry";
import {
  buildRoguelikeOpponentLineup,
  buildOpeningDraftPool,
  doesRoguelikeNodeAwardClearRewards,
  getRoguelikeClearRewards,
  getRoguelikeFailureRewards,
  buildRoguelikeStarterLineup,
  DEFAULT_ROGUELIKE_RUN_SETTINGS,
  drawRoguelikeStarterRevealPlayers,
  drawRoguelikeChoices,
  getRoguelikeNodesForSettings,
  getRoguelikePlayerUniverse,
  getRoguelikeAdjustedDefenseForSlot,
  getRoguelikeEvolutionOptions,
  getRoguelikeEvolutionRewardPool,
  getRoguelikeLockerRoomCashReward,
  getRoguelikeAdjustedOffenseForSlot,
  getRoguelikeAdjustedReboundingForSlot,
  evaluateRoguelikeLineup,
  evaluateRoguelikeRoster,
  normalizeRoguelikeRunSettings,
  buildPreviewRoster,
  getRoguelikeAdjustedOverallForSlot,
  getRoguelikeSlotPenalty,
  generateFaceoffOpponentPlayerIds,
  getRoguelikePlayerTypeBadges,
  RoguelikeClearRewards,
  RoguelikeBonusBadgeAssignment,
  RoguelikeDifficulty,
  RoguelikeFaceoffMatchup,
  RoguelikeFaceoffResult,
  RoguelikeFailureRewards,
  RoguelikeNode,
  RoguelikeRunSettings,
  RoguelikeStarterPackageId,
  roguelikeStarterPackages,
  resolveRoguelikeNode,
} from "../lib/roguelike";
import { Player, PlayerTier, Position, RosterSlot } from "../types";
import type { PlayerTypeBadge } from "../lib/playerTypeBadges";
import type { RoguePersonalBests } from "../types";

type RoguelikeStage =
  | "package-select"
  | "starter-reveal"
  | "ladder-overview"
  | "initial-draft"
  | "choice-select"
  | "challenge-setup"
  | "add-position-select"
  | "all-star-select"
  | "roster-cut-select"
  | "training-select"
  | "trade-offer"
  | "trade-select"
  | "reward-replace-select"
  | "evolution-select"
  | "faceoff-setup"
  | "faceoff-game"
  | "node-preview"
  | "locker-room"
  | "reward-draft"
  | "node-result"
  | "run-over"
  | "run-cleared";

type LockerRoomItemId =
  | "advanced-scouting"
  | "draft-shuffle-ticket"
  | "training-camp-ticket"
  | "practice-shooting"
  | "practice-rebounding"
  | "practice-defense"
  | "practice-playmaking"
  | "practice-offense"
  | "new-position-training";

interface RoguelikeRun {
  ladderVersion?: number;
  seed: number;
  packageId: RoguelikeStarterPackageId;
  settings: RoguelikeRunSettings;
  starterRevealTargetAverage?: number;
  roster: Player[];
  lineup: RosterSlot[];
  availablePool: Player[];
  seenChoicePlayerIds: string[];
  choices: Player[];
  starterRevealPlayers: Player[];
  revealedStarterIds: string[];
  pendingRewardPlayer?: Player | null;
  pendingTradeState?: {
    outgoingPlayerId: string;
    outgoingPlayerOverall: number;
    originalRoster: Player[];
    originalLineup: RosterSlot[];
  } | null;
  lives: number;
  floorIndex: number;
  initialPicks: number;
  draftShuffleTickets: number;
  lockerRoomCash: number;
  unlockedBundleIds: string[];
  scoutedBossNodeIds: string[];
  trainedPlayerIds: string[];
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[];
  pendingChoiceSelection?: "training" | "trade" | null;
  selectedCutPlayerIds: string[];
  selectedNaturalPositionPlayerId: string | null;
  selectedNaturalPosition: Position | null;
  allStarAssignments: {
    dunkContest: string | null;
    threePointContest: string | null;
    skillsChallenge: string | null;
  };
  utilityReturnState?: {
    stage: RoguelikeStage;
    activeNode: RoguelikeNode | null;
    activeOpponentPlayerIds: string[] | null;
    nodeResult: RoguelikeRun["nodeResult"] | null;
  } | null;
  failureReviewStage?: RoguelikeStage | null;
  stage: RoguelikeStage;
  activeNode: RoguelikeNode | null;
  activeOpponentPlayerIds: string[] | null;
  lockerRoomNotice?: {
    title: string;
    detail: string;
  } | null;
  nodeResult: {
    title: string;
    detail: string;
    passed?: boolean;
    challengeResult?: {
      metric: "overall" | "offense" | "defense" | "chemistry" | "rebounding";
      metricLabel: string;
      target: number;
      score: number;
      passed: boolean;
    } | null;
    faceoffResult?: RoguelikeFaceoffResult | null;
    failureRewards?: RoguelikeFailureRewards | null;
  } | null;
}

interface RoguelikeModeProps {
  activeRogueStarId: string | null;
  ownedTrainingCampTickets: number;
  ownedTradePhones: number;
  ownedSilverStarterPacks: number;
  ownedGoldStarterPacks: number;
  ownedPlatinumStarterPacks: number;
  onLeaveRun: () => void;
  onBackToHome: () => void;
  onAwardFailureRewards: (prestigeXpAward: number) => void;
  onUpdatePersonalBests: (nextValues: Partial<RoguePersonalBests>) => void;
  onUseTrainingCampTicket: () => boolean;
  onUseTradePhone: () => boolean;
  onUseSilverStarterPack: () => boolean;
  onUseGoldStarterPack: () => boolean;
  onUsePlatinumStarterPack: () => boolean;
}

const ROGUELIKE_STORAGE_KEY = "legends-draft-roguelike-run-v1";
const ROGUELIKE_PARKED_STORAGE_KEY = "legends-draft-roguelike-parked-v1";
const CURRENT_ROGUELIKE_LADDER_VERSION = 2;

const createSeed = () => Math.floor(Date.now() % 1_000_000) + Math.floor(Math.random() * 1000);

const nextChoiceSeed = (seed: number, step: number) => seed + step * 97 + 13;

const STORE_TRAINING_NODE: RoguelikeNode = {
  id: "store-training-camp",
  floor: 0,
  act: 0,
  type: "training",
  title: "Training Camp Ticket",
  description: "Send one player from your Rogue roster to training camp for a +1 OVR boost for the rest of the run.",
  rewardBundleId: "elite-closers",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
};

const STORE_TRADE_NODE: RoguelikeNode = {
  id: "store-trade-phone",
  floor: 0,
  act: 0,
  type: "trade",
  title: "Trade Phone",
  description: "Trade away one player from your Rogue roster and choose 1 similar-caliber replacement from a fresh 1-of-5 board.",
  rewardBundleId: "elite-closers",
  rewardChoices: 5,
  targetLabel: "Trade 1 player, then draft 1 similar-caliber replacement from 5 options",
};

const LOCKER_ROOM_TRAINING_NODE: RoguelikeNode = {
  id: "locker-room-training-camp-ticket",
  floor: 0,
  act: 0,
  type: "training",
  title: "Training Camp Tickets",
  description: "Choose 1 player to gain +1 OVR for the rest of this run.",
  rewardBundleId: "elite-closers",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
};

const LOCKER_ROOM_PRACTICE_SHOOTING_NODE: RoguelikeNode = {
  id: "locker-room-practice-shooting",
  floor: 0,
  act: 0,
  type: "training",
  title: "Player Type Badge: Sniper",
  description: "Choose 1 player to gain a Sniper badge for the rest of this run.",
  rewardBundleId: "spacing-punch",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain a Sniper badge",
};

const LOCKER_ROOM_PRACTICE_REBOUNDING_NODE: RoguelikeNode = {
  id: "locker-room-practice-rebounding",
  floor: 0,
  act: 0,
  type: "training",
  title: "Player Type Badge: Board Man",
  description: "Choose 1 player to gain a Board Man badge for the rest of this run.",
  rewardBundleId: "frontcourt-pressure",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain a Board Man badge",
};

const LOCKER_ROOM_PRACTICE_DEFENSE_NODE: RoguelikeNode = {
  id: "locker-room-practice-defense",
  floor: 0,
  act: 0,
  type: "training",
  title: "Player Type Badge: Lockdown",
  description: "Choose 1 player to gain a Lockdown badge for the rest of this run.",
  rewardBundleId: "jumbo-wings",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain a Lockdown badge",
};

const LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE: RoguelikeNode = {
  id: "locker-room-practice-playmaking",
  floor: 0,
  act: 0,
  type: "training",
  title: "Player Type Badge: Playmaker",
  description: "Choose 1 player to gain a Playmaker badge for the rest of this run.",
  rewardBundleId: "balanced-floor",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain a Playmaker badge",
};

const LOCKER_ROOM_PRACTICE_OFFENSE_NODE: RoguelikeNode = {
  id: "locker-room-practice-offense",
  floor: 0,
  act: 0,
  type: "training",
  title: "Player Type Badge: Slasher",
  description: "Choose 1 player to gain a Slasher badge for the rest of this run.",
  rewardBundleId: "elite-closers",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain a Slasher badge",
};

const LOCKER_ROOM_NEW_POSITION_NODE: RoguelikeNode = {
  id: "locker-room-new-position-training",
  floor: 0,
  act: 0,
  type: "add-position",
  title: "New Position Training",
  description: "Choose 1 player and add a new natural position for the rest of the run.",
  rewardBundleId: "balanced-floor",
  rewardChoices: 0,
  targetLabel: "Choose 1 player and add 1 new natural position",
};

const LOCKER_ROOM_ITEM_PRICES: Record<LockerRoomItemId, number> = {
  "advanced-scouting": 24,
  "draft-shuffle-ticket": 30,
  "training-camp-ticket": 42,
  "practice-shooting": 22,
  "practice-rebounding": 22,
  "practice-defense": 22,
  "practice-playmaking": 22,
  "practice-offense": 22,
  "new-position-training": 34,
};

const ROGUE_CONFERENCE_FILTER_OPTIONS: Array<{
  value: RoguelikeRunSettings["conferenceFilter"];
  label: string;
}> = [
  { value: "both", label: "Both" },
  { value: "east", label: "East Only" },
  { value: "west", label: "West Only" },
];

const ROGUE_DIFFICULTY_OPTIONS: Array<{
  value: RoguelikeDifficulty;
  label: string;
  detail: string;
}> = [
  { value: "normal", label: "Normal", detail: "Default boss scaling" },
  { value: "all-star", label: "All-Star", detail: "+1 boss average OVR" },
  { value: "superstar", label: "Superstar", detail: "+2 boss average OVR" },
  { value: "all-time", label: "All-Time", detail: "+3 boss average OVR" },
  { value: "goat", label: "GOAT", detail: "+4 boss average OVR" },
];

const LOCKER_ROOM_SELECTION_NODE_IDS = new Set<string>([
  LOCKER_ROOM_TRAINING_NODE.id,
  LOCKER_ROOM_PRACTICE_SHOOTING_NODE.id,
  LOCKER_ROOM_PRACTICE_REBOUNDING_NODE.id,
  LOCKER_ROOM_PRACTICE_DEFENSE_NODE.id,
  LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE.id,
  LOCKER_ROOM_PRACTICE_OFFENSE_NODE.id,
  LOCKER_ROOM_NEW_POSITION_NODE.id,
]);

const getPlayerById = (playerId: string | null) =>
  (playerId ? allPlayers.find((player) => player.id === playerId) ?? null : null);

const injectActiveRogueStarIntoReveal = (starterRevealPlayers: Player[], activeRogueStar: Player | null) => {
  if (!activeRogueStar) return starterRevealPlayers;
  if (starterRevealPlayers.some((player) => player.id === activeRogueStar.id)) {
    return starterRevealPlayers;
  }

  const nextRevealPlayers = [...starterRevealPlayers];
  const replaceIndex = nextRevealPlayers.reduce(
    (lowestIndex, player, index, players) =>
      player.overall < players[lowestIndex].overall ? index : lowestIndex,
    0,
  );
  nextRevealPlayers[replaceIndex] = activeRogueStar;
  return nextRevealPlayers;
};

const getStarterPackAverageForUpgrade = (upgrade: "standard" | "silver" | "gold" | "platinum") => {
  if (upgrade === "silver") return 81;
  if (upgrade === "gold") return 82;
  if (upgrade === "platinum") return 83;
  return 80;
};

const buildStarterRevealRunRepair = (
  run: Pick<RoguelikeRun, "packageId" | "settings" | "seed" | "starterRevealPlayers" | "starterRevealTargetAverage">,
  activeRogueStarId: string | null,
) => {
  const activeRogueStar = getPlayerById(activeRogueStarId);
  const runPlayerUniverse = getRoguelikePlayerUniverse(run.settings);
  const starterRevealSource = runPlayerUniverse.filter((player) => player.id !== activeRogueStar?.id);
  const starterRevealPlayers = ensureVisibleStarterRevealPlayers(
    run.packageId,
    run.seed,
    run.starterRevealTargetAverage ?? 80,
    activeRogueStar,
    starterRevealSource,
  );

  return starterRevealPlayers.length >= 3
    ? starterRevealPlayers
    : fillStarterRevealFallbackPlayers(starterRevealPlayers, starterRevealSource);
};

const getLegacyRoguelikeNodesForSettings = (settings: RoguelikeRunSettings) =>
  getRoguelikeNodesForSettings(settings)
    .filter((node) => node.type !== "locker-room")
    .map((node, index) => ({
      ...node,
      floor: index + 1,
    }));

const mapStoredNodeToCurrentLadder = (
  storedNode: RoguelikeNode | null | undefined,
  currentNodes: RoguelikeNode[],
) => {
  if (!storedNode) return null;
  return currentNodes.find((node) => node.id === storedNode.id) ?? storedNode;
};

const migrateLegacyFloorIndex = (
  floorIndex: number | undefined,
  settings: RoguelikeRunSettings,
) => {
  const currentNodes = getRoguelikeNodesForSettings(settings);
  const legacyNodes = getLegacyRoguelikeNodesForSettings(settings);
  const safeLegacyFloorIndex = Math.max(0, floorIndex ?? 0);

  if (safeLegacyFloorIndex >= legacyNodes.length) {
    return currentNodes.length;
  }

  const targetLegacyNode = legacyNodes[safeLegacyFloorIndex] ?? null;
  if (!targetLegacyNode) return Math.min(safeLegacyFloorIndex, currentNodes.length);

  const currentIndex = currentNodes.findIndex((node) => node.id === targetLegacyNode.id);
  return currentIndex >= 0 ? currentIndex : Math.min(safeLegacyFloorIndex, currentNodes.length);
};

const normalizeStoredRun = (parsed: Partial<RoguelikeRun>, activeRogueStarId: string | null): RoguelikeRun | null => {
  if (!parsed.packageId || typeof parsed.seed !== "number") {
    return null;
  }

  const settings = normalizeRoguelikeRunSettings(parsed.settings);
  const ladderVersion = parsed.ladderVersion ?? 1;
  const currentRunNodes = getRoguelikeNodesForSettings(settings);
  const runPlayerUniverse = getRoguelikePlayerUniverse(settings);
  const migratedFloorIndex =
    ladderVersion >= CURRENT_ROGUELIKE_LADDER_VERSION
      ? parsed.floorIndex ?? 0
      : migrateLegacyFloorIndex(parsed.floorIndex, settings);
  const starterRevealTargetAverage = parsed.starterRevealTargetAverage ?? 80;
  const starterRevealPlayers =
    parsed.stage === "starter-reveal"
      ? buildStarterRevealRunRepair(
          {
            packageId: parsed.packageId,
            settings,
            seed: parsed.seed,
            starterRevealPlayers: parsed.starterRevealPlayers ?? [],
            starterRevealTargetAverage,
          },
          activeRogueStarId,
        )
      : parsed.starterRevealPlayers ?? [];

  return {
    ladderVersion: CURRENT_ROGUELIKE_LADDER_VERSION,
    seed: parsed.seed,
    packageId: parsed.packageId,
    settings,
    starterRevealTargetAverage,
    roster: parsed.roster ?? [],
    lineup: parsed.lineup ?? buildRoguelikeStarterLineup([]),
    availablePool: runPlayerUniverse,
    seenChoicePlayerIds: parsed.seenChoicePlayerIds ?? [],
    choices: parsed.choices ?? [],
    starterRevealPlayers,
    revealedStarterIds: parsed.revealedStarterIds ?? [],
    pendingRewardPlayer: parsed.pendingRewardPlayer ?? null,
    pendingTradeState: parsed.pendingTradeState ?? null,
    lives: parsed.lives ?? 3,
    floorIndex: migratedFloorIndex,
    initialPicks: parsed.initialPicks ?? 0,
    draftShuffleTickets: parsed.draftShuffleTickets ?? 0,
    lockerRoomCash: parsed.lockerRoomCash ?? 0,
    unlockedBundleIds: parsed.unlockedBundleIds ?? [],
    scoutedBossNodeIds: parsed.scoutedBossNodeIds ?? [],
    trainedPlayerIds: parsed.trainedPlayerIds ?? [],
    allStarBonusBadges: parsed.allStarBonusBadges ?? [],
    pendingChoiceSelection: parsed.pendingChoiceSelection ?? null,
    selectedCutPlayerIds: parsed.selectedCutPlayerIds ?? [],
    selectedNaturalPositionPlayerId: parsed.selectedNaturalPositionPlayerId ?? null,
    selectedNaturalPosition: parsed.selectedNaturalPosition ?? null,
    allStarAssignments: parsed.allStarAssignments ?? {
      dunkContest: null,
      threePointContest: null,
      skillsChallenge: null,
    },
    utilityReturnState: parsed.utilityReturnState
      ? {
          ...parsed.utilityReturnState,
          activeNode: mapStoredNodeToCurrentLadder(parsed.utilityReturnState.activeNode, currentRunNodes),
        }
      : null,
    failureReviewStage: parsed.failureReviewStage ?? null,
    stage: parsed.stage ?? "package-select",
    activeNode: mapStoredNodeToCurrentLadder(parsed.activeNode, currentRunNodes),
    activeOpponentPlayerIds: parsed.activeOpponentPlayerIds ?? null,
    lockerRoomNotice: parsed.lockerRoomNotice ?? null,
    nodeResult: parsed.nodeResult
      ? {
          ...parsed.nodeResult,
          failureRewards: parsed.nodeResult.failureRewards ?? null,
        }
      : null,
  };
};

const getRevealedStarterPlayers = (run: RoguelikeRun) => {
  const revealedPlayers = run.starterRevealPlayers.filter((player) =>
    run.revealedStarterIds.includes(player.id),
  );
  return revealedPlayers.length > 0 ? revealedPlayers : run.starterRevealPlayers;
};

const fillStarterRevealFallbackPlayers = (players: Player[], fallbackPool: Player[]) => {
  const seenIds = new Set(players.map((player) => player.id));
  const fallbackCandidates = fallbackPool.filter((player) => {
    if (seenIds.has(player.id)) return false;
    const tier = getPlayerTier(player);
    return tier === "Sapphire" || tier === "Emerald";
  });

  return [...players, ...fallbackCandidates.slice(0, Math.max(0, 3 - players.length))].slice(0, 3);
};

const ensureVisibleStarterRevealPlayers = (
  packageId: RoguelikeStarterPackageId,
  seed: number,
  targetAverageOverall: number,
  activeRogueStar: Player | null,
  candidatePool: Player[],
) => {
  const candidatePoolResult = injectActiveRogueStarIntoReveal(
    drawRoguelikeStarterRevealPlayers(
      packageId,
      nextChoiceSeed(seed, 1),
      targetAverageOverall,
      candidatePool.filter((player) => player.id !== activeRogueStar?.id),
    ),
    activeRogueStar,
  );

  if (candidatePoolResult.length === 3) return candidatePoolResult;

  const broaderFallback = injectActiveRogueStarIntoReveal(
    drawRoguelikeStarterRevealPlayers(
      packageId,
      nextChoiceSeed(seed, 11),
      targetAverageOverall,
      candidatePool.filter((player) => player.id !== activeRogueStar?.id),
    ),
    activeRogueStar,
  );

  if (broaderFallback.length === 3) return broaderFallback;

  const bestEffortResult =
    candidatePoolResult.length >= broaderFallback.length ? candidatePoolResult : broaderFallback;

  return fillStarterRevealFallbackPlayers(bestEffortResult, candidatePool);
};

const buildRevealedStarterRosterState = (run: RoguelikeRun, revealedStarterIds: string[]) => {
  const revealedPlayers = run.starterRevealPlayers.filter((player) => revealedStarterIds.includes(player.id));
  return {
    roster: revealedPlayers,
    lineup: buildRoguelikeStarterLineup(revealedPlayers),
  };
};

const getRunOwnedPlayers = (run: RoguelikeRun) => {
  const ownedPlayers = [...run.roster, ...run.lineup.map((slot) => slot.player).filter((player): player is Player => Boolean(player))];
  const seen = new Set<string>();

  return ownedPlayers.filter((player) => {
    if (seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
};

const getTrainingCountForPlayer = (playerId: string, trainedPlayerIds: string[] = []) =>
  trainedPlayerIds.filter((trainedPlayerId) => trainedPlayerId === playerId).length;

const getTradePreviewOverall = (player: Player, nextOwnedPlayerIds: string[] = []) => {
  const previewOwnedPlayerIds = nextOwnedPlayerIds.includes(player.id)
    ? nextOwnedPlayerIds
    : [...nextOwnedPlayerIds, player.id];
  const sameTeamChemistryBonus = getSameTeamChemistryBonusForPlayer(
    player,
    previewOwnedPlayerIds,
  );

  return player.overall + sameTeamChemistryBonus;
};

const getRunPlayerTypeBadgeOverrides = (
  player: Player | null,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => (player ? getRoguelikePlayerTypeBadges(player, allStarBonusBadges) : []);

const getRunDisplayPlayer = (
  player: Player,
  ownedPlayerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) => {
  const trainingCount = getTrainingCountForPlayer(player.id, trainedPlayerIds);
  const sameTeamChemistryBonus = getSameTeamChemistryBonusForPlayer(player, ownedPlayerIds);
  if (trainingCount === 0 && sameTeamChemistryBonus === 0) return player;

  return {
    ...player,
    overall: player.overall + trainingCount + sameTeamChemistryBonus,
    offense: player.offense + trainingCount,
    defense: player.defense + trainingCount,
    playmaking: player.playmaking + trainingCount,
    shooting: player.shooting + trainingCount,
    rebounding: player.rebounding + trainingCount,
    athleticism: player.athleticism + trainingCount,
    intangibles: player.intangibles + trainingCount,
    ballDominance: player.ballDominance + trainingCount,
    interiorDefense: player.interiorDefense + trainingCount,
    perimeterDefense: player.perimeterDefense + trainingCount,
  };
};

const sortDisplayPlayersByOverallAsc = (players: Player[]) =>
  [...players].sort(
    (left, right) => left.overall - right.overall || left.name.localeCompare(right.name),
  );

const getSingleRowDraftCardScale = (count: number) =>
  count >= 10 ? 0.39 : count >= 8 ? 0.42 : count >= 6 ? 0.46 : 0.52;

const getEarlyRunRosterState = (run: RoguelikeRun) => {
  const starterPlayers = getRevealedStarterPlayers(run);
  const draftedPlayers = run.roster.filter(
    (player) => !starterPlayers.some((starter) => starter.id === player.id),
  );
  const ownedPlayers = [...starterPlayers, ...draftedPlayers];

  return {
    ownedPlayers,
    lineup: buildRoguelikeStarterLineup(ownedPlayers),
  };
};

const hasBenchUnlocked = (run: RoguelikeRun, nodes: RoguelikeNode[]) => {
  const unlockNodeIndex = nodes.findIndex((node) => node.unlocksBench);
  if (unlockNodeIndex < 0) return true;
  if (run.floorIndex > unlockNodeIndex) return true;
  return run.floorIndex === unlockNodeIndex && run.stage === "reward-draft";
};

const compactBenchSlots = (lineup: RosterSlot[]) => {
  if (lineup.length <= 5) return lineup;

  const starters: RosterSlot[] = lineup.slice(0, 5).map((slot) => ({ ...slot }));
  const benchTemplate: RosterSlot[] = lineup.slice(5).map((slot) => ({ ...slot, player: null }));
  const benchPlayers = lineup.slice(5)
    .map((slot) => slot.player)
    .filter((player): player is Player => Boolean(player));

  benchPlayers.forEach((player, index) => {
    if (benchTemplate[index]) {
      benchTemplate[index] = { ...benchTemplate[index], player };
    }
  });

  return [...starters, ...benchTemplate];
};

const getNaturalPositionsForPlayer = (player: Player) => [
  player.primaryPosition,
  ...player.secondaryPositions,
];

const isNaturalFitForSlot = (player: Player, slot: RosterSlot) =>
  getNaturalPositionsForPlayer(player).some((position) => slot.allowedPositions.includes(position));

const autoPromoteAddedPlayerIntoStartingLineup = (lineup: RosterSlot[], addedPlayer: Player) => {
  const nextLineup = lineup.map((slot) => ({ ...slot }));
  const benchIndex = nextLineup.findIndex((slot, index) => index >= 5 && slot.player?.id === addedPlayer.id);

  if (benchIndex === -1) {
    return compactBenchSlots(nextLineup);
  }

  const eligibleStarterIndex = nextLineup
    .slice(0, 5)
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => isNaturalFitForSlot(addedPlayer, slot))
    .filter(({ slot }) => {
      const starter = slot.player;
      return !starter || starter.overall < addedPlayer.overall;
    })
    .sort((a, b) => {
      const aStarterOverall = a.slot.player?.overall ?? -Infinity;
      const bStarterOverall = b.slot.player?.overall ?? -Infinity;
      if (aStarterOverall !== bStarterOverall) {
        return aStarterOverall - bStarterOverall;
      }

      const aPrimaryFit = a.slot.allowedPositions.includes(addedPlayer.primaryPosition) ? 1 : 0;
      const bPrimaryFit = b.slot.allowedPositions.includes(addedPlayer.primaryPosition) ? 1 : 0;
      if (aPrimaryFit !== bPrimaryFit) {
        return bPrimaryFit - aPrimaryFit;
      }

      return a.index - b.index;
    })[0]?.index;

  if (eligibleStarterIndex === undefined) {
    return compactBenchSlots(nextLineup);
  }

  const displacedStarter = nextLineup[eligibleStarterIndex].player ?? null;
  nextLineup[eligibleStarterIndex] = {
    ...nextLineup[eligibleStarterIndex],
    player: addedPlayer,
  };
  nextLineup[benchIndex] = {
    ...nextLineup[benchIndex],
    player: displacedStarter,
  };

  return compactBenchSlots(nextLineup);
};

const promoteBenchPlayersIntoOpenStarterSlots = (lineup: RosterSlot[]) => {
  if (lineup.length <= 5) return lineup;

  const nextLineup = lineup.map((slot) => ({ ...slot }));

  for (let starterIndex = 0; starterIndex < 5; starterIndex += 1) {
    if (nextLineup[starterIndex]?.player) continue;

    const benchIndex = nextLineup.findIndex((slot, index) => index >= 5 && Boolean(slot.player));
    if (benchIndex === -1) break;

    nextLineup[starterIndex] = {
      ...nextLineup[starterIndex],
      player: nextLineup[benchIndex].player,
    };
    nextLineup[benchIndex] = {
      ...nextLineup[benchIndex],
      player: null,
    };
  }

  return compactBenchSlots(nextLineup);
};

const hydrateRunLineup = (run: RoguelikeRun, ownedPlayers: Player[]) => {
  const playerById = new Map(ownedPlayers.map((player) => [player.id, player]));
  const hasPlacedPlayers = run.lineup.some((slot) => Boolean(slot.player));

  if (!hasPlacedPlayers) {
    const hydratedLineup = ownedPlayers.length <= 5
      ? buildRoguelikeStarterLineup(ownedPlayers)
      : ownedPlayers.reduce(
          (currentLineup, player) => assignPlayerToRoster(currentLineup, player).roster,
          buildRoguelikeStarterLineup(ownedPlayers),
        );
    return compactBenchSlots(hydratedLineup);
  }

  const placedPlayerIds = new Set<string>();
  const syncedLineup = run.lineup.map((slot) => {
    const hydratedPlayer = slot.player ? playerById.get(slot.player.id) ?? null : null;
    if (hydratedPlayer) {
      placedPlayerIds.add(hydratedPlayer.id);
    }

    return {
      ...slot,
      player: hydratedPlayer,
    };
  });

  const unplacedPlayers = ownedPlayers.filter((player) => !placedPlayerIds.has(player.id));
  const hydratedLineup = unplacedPlayers.reduce(
    (currentLineup, player) => assignPlayerToRoster(currentLineup, player).roster,
    syncedLineup,
  );
  return promoteBenchPlayersIntoOpenStarterSlots(hydratedLineup);
};

const getHydratedRun = (run: RoguelikeRun, nodes: RoguelikeNode[]) => {
  const normalizedRun =
    run.stage === "node-preview"
      ? {
          ...run,
          stage: "ladder-overview" as RoguelikeStage,
          activeNode: null,
          activeOpponentPlayerIds: null,
        }
      : run;
  const shouldHydrateEarlyRunDisplay =
    !hasBenchUnlocked(normalizedRun, nodes) &&
    ["ladder-overview", "initial-draft", "faceoff-setup", "faceoff-game"].includes(normalizedRun.stage);

  const hydratedOwnedPlayers = shouldHydrateEarlyRunDisplay
    ? normalizedRun.roster.length > 0
      ? normalizedRun.roster
      : getEarlyRunRosterState(normalizedRun).ownedPlayers
    : normalizedRun.roster;

  if (hydratedOwnedPlayers.length === 0) {
    return normalizedRun;
  }

  return {
    ...normalizedRun,
    roster: hydratedOwnedPlayers,
    lineup: hydrateRunLineup(normalizedRun, hydratedOwnedPlayers),
  };
};

const restoreUtilityReturnState = (run: RoguelikeRun, fallbackStage: RoguelikeStage = "ladder-overview") => {
  if (!run.utilityReturnState) {
    return {
      ...run,
      stage: fallbackStage,
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
      utilityReturnState: null,
    };
  }

  return {
    ...run,
    stage: run.utilityReturnState.stage,
    activeNode: run.utilityReturnState.activeNode,
    activeOpponentPlayerIds: run.utilityReturnState.activeOpponentPlayerIds,
    nodeResult: run.utilityReturnState.nodeResult,
    utilityReturnState: null,
  };
};

const getLockerRoomItemPrice = (itemId: LockerRoomItemId) => LOCKER_ROOM_ITEM_PRICES[itemId];

const isLockerRoomSelectionNode = (node: RoguelikeNode | null) =>
  Boolean(node && LOCKER_ROOM_SELECTION_NODE_IDS.has(node.id));

const getNextBossNode = (nodes: RoguelikeNode[], floorIndex: number) =>
  nodes.slice(floorIndex).find((node) => node.type === "boss") ?? null;

const getUpcomingBossNodeForLockerRoom = (run: RoguelikeRun, nodes: RoguelikeNode[]) => {
  if (run.activeNode?.type === "boss") {
    if (run.stage === "faceoff-setup" || run.stage === "faceoff-game") {
      return run.activeNode;
    }

    if (run.stage === "reward-draft") {
      return getNextBossNode(nodes, run.floorIndex + 1);
    }
  }

  const currentNode = nodes[run.floorIndex] ?? null;
  if (run.stage === "ladder-overview" && currentNode?.type === "boss") {
    return currentNode;
  }

  return getNextBossNode(nodes, run.floorIndex);
};

const getScoutedBossLineup = (
  run: RoguelikeRun,
  bossNode: RoguelikeNode | null,
  candidatePool: Player[],
) => {
  if (!bossNode) return [];

  return buildRoguelikeOpponentLineup({
    ...bossNode,
    opponentPlayerIds:
      bossNode.opponentStarterPlayerIds ??
      bossNode.opponentPlayerIds ??
      generateFaceoffOpponentPlayerIds(
        getRunOwnedPlayers(run),
        nextChoiceSeed(run.seed, 200 + (bossNode.floor - 1) * 17),
        bossNode.opponentAverageOverall,
        candidatePool,
      ),
  }).slice(0, 5);
};

const getLockerRoomBadgeType = (
  nodeId: string,
): RoguelikeBonusBadgeAssignment["badgeType"] | null =>
  nodeId === LOCKER_ROOM_PRACTICE_SHOOTING_NODE.id
    ? "sniper"
    : nodeId === LOCKER_ROOM_PRACTICE_REBOUNDING_NODE.id
      ? "board-man"
      : nodeId === LOCKER_ROOM_PRACTICE_DEFENSE_NODE.id
        ? "lockdown"
        : nodeId === LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE.id
          ? "playmaker"
          : nodeId === LOCKER_ROOM_PRACTICE_OFFENSE_NODE.id
            ? "slasher"
            : null;

const getNodeChoiceTiers = (node: RoguelikeNode) => {
  return node.allowedRewardTiers;
};

const getNodePlayerPool = (node: RoguelikeNode | null, pool: Player[], fallbackPool: Player[]) => {
  const applyNodeFilters = (source: Player[]) =>
    source
      .filter((player) =>
        node?.allowedRewardTiers?.length ? node.allowedRewardTiers.includes(getPlayerTier(player)) : true,
      );

  const filteredPool = applyNodeFilters(pool);
  if (!node) return filteredPool;

  const filteredFallbackPool = applyNodeFilters(fallbackPool);
  const seenIds = new Set<string>();

  return [...filteredPool, ...filteredFallbackPool].filter((player) => {
    if (seenIds.has(player.id)) return false;
    seenIds.add(player.id);
    return true;
  });
};

const getSimilarCaliberTradePool = (
  node: RoguelikeNode | null,
  pool: Player[],
  fallbackPool: Player[],
  tradedOverall: number,
  nextRoster: Player[],
  outgoingPlayerId?: string | null,
) => {
  const minimumOverall = tradedOverall - 1;
  const maximumOverall = tradedOverall + 1;
  const nextOwnedPlayerIds = nextRoster.map((player) => player.id);
  const eligiblePool = getNodePlayerPool(node, pool, fallbackPool).filter(
    (candidate) => candidate.id !== outgoingPlayerId,
  );
  const seenIds = new Set<string>();
  return [...eligiblePool, ...pool, ...fallbackPool].filter((candidate) => {
    if (candidate.id === outgoingPlayerId) return false;
    const candidatePreviewOverall = getTradePreviewOverall(candidate, nextOwnedPlayerIds);
    if (candidatePreviewOverall < minimumOverall || candidatePreviewOverall > maximumOverall) {
      return false;
    }
    if (seenIds.has(candidate.id)) return false;
    seenIds.add(candidate.id);
    return true;
  });
};

const drawTradeReplacementChoices = (
  tradeReplacementPool: Player[],
  nextRoster: Player[],
  count: number,
  seed: number,
  tradedOverall: number,
) => {
  const nextOwnedPlayerIds = nextRoster.map((player) => player.id);
  const initialChoices = drawRoguelikeChoices(
    tradeReplacementPool,
    nextRoster,
    count,
    seed,
    undefined,
    [],
    tradeReplacementPool,
  );

  if (initialChoices.length === 0) {
    return initialChoices;
  }

  const rng = mulberry32(seed + 17);
  const shuffledPool = [...tradeReplacementPool];
  for (let index = shuffledPool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffledPool[index], shuffledPool[swapIndex]] = [shuffledPool[swapIndex], shuffledPool[index]];
  }

  const choiceIds = new Set(initialChoices.map((choice) => choice.id));
  const adjustedChoices = [...initialChoices];
  const desiredOveralls = [tradedOverall + 1, tradedOverall, tradedOverall - 1];

  desiredOveralls.forEach((desiredOverall) => {
    const hasDesiredOverall = adjustedChoices.some(
      (choice) => getTradePreviewOverall(choice, nextOwnedPlayerIds) === desiredOverall,
    );
    if (hasDesiredOverall) return;

    const replacement = shuffledPool.find(
      (candidate) =>
        getTradePreviewOverall(candidate, nextOwnedPlayerIds) === desiredOverall &&
        !choiceIds.has(candidate.id),
    );
    if (!replacement) return;

    const replacementIndex = adjustedChoices.findIndex(
      (choice) =>
        getTradePreviewOverall(choice, nextOwnedPlayerIds) !== desiredOverall &&
        !desiredOveralls.some(
          (overall) =>
            overall !== desiredOverall &&
            getTradePreviewOverall(choice, nextOwnedPlayerIds) === overall,
        ),
    );

    const fallbackIndex =
      replacementIndex >= 0
        ? replacementIndex
        : adjustedChoices.findIndex(
            (choice) => getTradePreviewOverall(choice, nextOwnedPlayerIds) !== desiredOverall,
          );

    if (fallbackIndex < 0) return;

    choiceIds.delete(adjustedChoices[fallbackIndex].id);
    adjustedChoices[fallbackIndex] = replacement;
    choiceIds.add(replacement.id);
  });

  return adjustedChoices;
};

const getTradeReplacementChoiceCount = (
  node: RoguelikeNode | null,
  pendingChoiceSelection?: "training" | "trade" | null,
) =>
  node?.type === "choice" && pendingChoiceSelection === "trade"
    ? 5
    : Math.max(0, node?.rewardChoices ?? 0);

const shouldStrictlyUseNodePool = (_node: RoguelikeNode | null) => false;

const getActHeading = (act: number) => {
  if (act === 1) return "Year 1 Climb";
  if (act === 2) return "Year 2 Push";
  if (act === 3) return "Year 3 Pressure";
  return "Year 4 Finals";
};

const getActDescription = (act: number) => {
  if (act === 1) {
    return "Build the first real version of your team, survive the early checks, and reach the opening playoff gate.";
  }
  if (act === 2) {
    return "The roster starts widening here. Rebounding, training, and cleaner rotation decisions begin to matter more.";
  }
  if (act === 3) {
    return "This is the tightening phase. Defensive structure, evolution upgrades, and sharper lineup choices decide whether the run can contend.";
  }
  return "Only the strongest builds survive the finals stretch. Every node now needs to feel worthy of a championship run.";
};

const getActLadderTheme = (act: number) => {
  if (act === 1) {
    return {
      accent: "bg-fuchsia-300",
      shell: "border-fuchsia-200/14 bg-[linear-gradient(135deg,rgba(58,29,77,0.26),rgba(24,20,35,0.94),rgba(10,10,16,0.98))]",
      current: "border-fuchsia-200/26 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(58,29,77,0.94),rgba(14,10,22,0.98))] shadow-[0_18px_40px_rgba(192,132,252,0.12)]",
      eyebrow: "text-fuchsia-100/82",
      target: "border-fuchsia-200/22 bg-[linear-gradient(135deg,rgba(192,132,252,0.16),rgba(15,23,42,0.84),rgba(88,28,135,0.14))] text-fuchsia-50",
      reward: "border-fuchsia-200/14 bg-fuchsia-300/8 text-fuchsia-50/92",
    };
  }
  if (act === 2) {
    return {
      accent: "bg-sky-300",
      shell: "border-sky-200/14 bg-[linear-gradient(135deg,rgba(16,55,90,0.26),rgba(20,24,35,0.94),rgba(10,10,16,0.98))]",
      current: "border-sky-200/26 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(16,55,90,0.94),rgba(10,16,26,0.98))] shadow-[0_18px_40px_rgba(56,189,248,0.12)]",
      eyebrow: "text-sky-100/82",
      target: "border-sky-200/22 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.84),rgba(14,116,144,0.14))] text-sky-50",
      reward: "border-sky-200/14 bg-sky-300/8 text-sky-50/92",
    };
  }
  if (act === 3) {
    return {
      accent: "bg-amber-300",
      shell: "border-amber-200/14 bg-[linear-gradient(135deg,rgba(97,54,14,0.24),rgba(24,22,19,0.94),rgba(10,10,16,0.98))]",
      current: "border-amber-200/26 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(97,54,14,0.92),rgba(20,14,10,0.98))] shadow-[0_18px_40px_rgba(245,158,11,0.12)]",
      eyebrow: "text-amber-100/82",
      target: "border-amber-200/22 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(15,23,42,0.84),rgba(146,64,14,0.14))] text-amber-50",
      reward: "border-amber-200/14 bg-amber-300/8 text-amber-50/92",
    };
  }
  return {
    accent: "bg-emerald-300",
    shell: "border-emerald-200/14 bg-[linear-gradient(135deg,rgba(10,84,68,0.24),rgba(18,24,24,0.94),rgba(10,10,16,0.98))]",
    current: "border-emerald-200/26 bg-[linear-gradient(135deg,rgba(52,211,153,0.18),rgba(10,84,68,0.92),rgba(10,18,16,0.98))] shadow-[0_18px_40px_rgba(16,185,129,0.12)]",
    eyebrow: "text-emerald-100/82",
    target: "border-emerald-200/22 bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(15,23,42,0.84),rgba(6,78,59,0.14))] text-emerald-50",
    reward: "border-emerald-200/14 bg-emerald-300/8 text-emerald-50/92",
  };
};

const getRoguelikeNodeTypeTheme = (type: RoguelikeNode["type"]) => {
  const typeThemes: Record<
    RoguelikeNode["type"],
    {
      label: string;
      Icon: LucideIcon;
      chip: string;
      iconWrap: string;
      iconColor: string;
      accentLine: string;
      summary: string;
    }
  > = {
    draft: {
      label: "Draft",
      Icon: Package2,
      chip: "border-indigo-200/18 bg-indigo-300/10 text-indigo-100",
      iconWrap: "border-indigo-200/22 bg-indigo-300/12",
      iconColor: "text-indigo-100",
      accentLine: "from-indigo-300/90 via-indigo-300/30 to-transparent",
      summary:
        "border-indigo-200/22 bg-[linear-gradient(135deg,rgba(129,140,248,0.16),rgba(15,23,42,0.86),rgba(49,46,129,0.16))] text-indigo-50",
    },
    "locker-room": {
      label: "Locker Room Visit",
      Icon: Coins,
      chip: "border-emerald-200/18 bg-emerald-300/10 text-emerald-100",
      iconWrap: "border-emerald-200/22 bg-emerald-300/12",
      iconColor: "text-emerald-100",
      accentLine: "from-emerald-300/90 via-emerald-300/30 to-transparent",
      summary:
        "border-emerald-200/22 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.86),rgba(6,78,59,0.16))] text-emerald-50",
    },
    training: {
      label: "Training Camp",
      Icon: Zap,
      chip: "border-emerald-200/18 bg-emerald-300/10 text-emerald-100",
      iconWrap: "border-emerald-200/22 bg-emerald-300/12",
      iconColor: "text-emerald-100",
      accentLine: "from-emerald-300/90 via-emerald-300/30 to-transparent",
      summary:
        "border-emerald-200/22 bg-[linear-gradient(135deg,rgba(52,211,153,0.18),rgba(15,23,42,0.86),rgba(6,78,59,0.16))] text-emerald-50",
    },
    challenge: {
      label: "Challenge",
      Icon: Target,
      chip: "border-sky-200/18 bg-sky-300/10 text-sky-100",
      iconWrap: "border-sky-200/22 bg-sky-300/12",
      iconColor: "text-sky-100",
      accentLine: "from-sky-300/90 via-sky-300/30 to-transparent",
      summary:
        "border-sky-200/22 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(15,23,42,0.86),rgba(12,74,110,0.16))] text-sky-50",
    },
    boss: {
      label: "Boss Battle",
      Icon: Trophy,
      chip: "border-rose-200/18 bg-rose-300/10 text-rose-100",
      iconWrap: "border-rose-200/22 bg-rose-300/12",
      iconColor: "text-rose-100",
      accentLine: "from-rose-300/90 via-orange-300/35 to-transparent",
      summary:
        "border-rose-200/22 bg-[linear-gradient(135deg,rgba(251,113,133,0.18),rgba(15,23,42,0.86),rgba(154,52,18,0.16))] text-rose-50",
    },
    trade: {
      label: "Trade",
      Icon: RefreshCcw,
      chip: "border-amber-200/18 bg-amber-300/10 text-amber-100",
      iconWrap: "border-amber-200/22 bg-amber-300/12",
      iconColor: "text-amber-100",
      accentLine: "from-amber-300/90 via-amber-300/30 to-transparent",
      summary:
        "border-amber-200/22 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(15,23,42,0.86),rgba(146,64,14,0.16))] text-amber-50",
    },
    evolution: {
      label: "Evolution",
      Icon: Sparkles,
      chip: "border-fuchsia-200/18 bg-fuchsia-300/10 text-fuchsia-100",
      iconWrap: "border-fuchsia-200/22 bg-fuchsia-300/12",
      iconColor: "text-fuchsia-100",
      accentLine: "from-fuchsia-300/90 via-fuchsia-300/30 to-transparent",
      summary:
        "border-fuchsia-200/22 bg-[linear-gradient(135deg,rgba(232,121,249,0.18),rgba(15,23,42,0.86),rgba(112,26,117,0.16))] text-fuchsia-50",
    },
    choice: {
      label: "Choice Node",
      Icon: ArrowRight,
      chip: "border-cyan-200/18 bg-cyan-300/10 text-cyan-100",
      iconWrap: "border-cyan-200/22 bg-cyan-300/12",
      iconColor: "text-cyan-100",
      accentLine: "from-cyan-300/90 via-cyan-300/30 to-transparent",
      summary:
        "border-cyan-200/22 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(15,23,42,0.86),rgba(8,145,178,0.16))] text-cyan-50",
    },
    "roster-cut": {
      label: "Roster Cut",
      Icon: Shield,
      chip: "border-slate-200/18 bg-slate-300/10 text-slate-100",
      iconWrap: "border-slate-200/22 bg-slate-300/10",
      iconColor: "text-slate-100",
      accentLine: "from-slate-300/80 via-slate-300/26 to-transparent",
      summary:
        "border-slate-200/22 bg-[linear-gradient(135deg,rgba(148,163,184,0.18),rgba(15,23,42,0.86),rgba(51,65,85,0.16))] text-slate-50",
    },
    "add-position": {
      label: "Position Training",
      Icon: ArrowUpRight,
      chip: "border-cyan-200/18 bg-cyan-300/10 text-cyan-100",
      iconWrap: "border-cyan-200/22 bg-cyan-300/12",
      iconColor: "text-cyan-100",
      accentLine: "from-cyan-300/90 via-cyan-300/30 to-transparent",
      summary:
        "border-cyan-200/22 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(15,23,42,0.86),rgba(8,145,178,0.16))] text-cyan-50",
    },
    "all-star": {
      label: "All-Star Saturday",
      Icon: Crown,
      chip: "border-violet-200/18 bg-violet-300/10 text-violet-100",
      iconWrap: "border-violet-200/22 bg-violet-300/12",
      iconColor: "text-violet-100",
      accentLine: "from-violet-300/90 via-violet-300/30 to-transparent",
      summary:
        "border-violet-200/22 bg-[linear-gradient(135deg,rgba(167,139,250,0.18),rgba(15,23,42,0.86),rgba(91,33,182,0.16))] text-violet-50",
    },
  };

  return typeThemes[type];
};

const drawRunChoices = (
  run: RoguelikeRun,
  pool: Player[],
  roster: Player[],
  count: number,
  seed: number,
  allowedTiers?: PlayerTier[],
  strictPool = false,
) => {
  const seenChoicePlayerIds = run.seenChoicePlayerIds ?? [];
  let choices = drawRoguelikeChoices(
    pool,
    roster,
    count,
    seed,
    allowedTiers,
    seenChoicePlayerIds,
    strictPool ? pool : undefined,
  );

  // Never strand a run on an empty reward board. Prefer the intended tier band first,
  // then relax repeat restrictions before finally broadening the tier filter.
  if (choices.length < count && allowedTiers) {
    choices = drawRoguelikeChoices(
      pool,
      roster,
      count,
      seed + 1,
      allowedTiers,
      [],
      strictPool ? pool : undefined,
    );
  }

  if (choices.length < count) {
    choices = drawRoguelikeChoices(
      pool,
      roster,
      count,
      seed + 2,
      undefined,
      seenChoicePlayerIds,
      strictPool ? pool : undefined,
    );
  }

  if (choices.length < count) {
    choices = drawRoguelikeChoices(
      pool,
      roster,
      count,
      seed + 3,
      undefined,
      [],
      strictPool ? pool : undefined,
    );
  }

  return {
    choices,
    seenChoicePlayerIds: Array.from(new Set([...seenChoicePlayerIds, ...choices.map((player) => player.id)])),
  };
};

const getRewardDraftPool = (
  run: RoguelikeRun,
  node: RoguelikeNode,
  pool: Player[],
  fallbackPool: Player[],
) => {
  if (node.id === "act-one-boss" || node.id === "act-one-boss-current") {
    return getRoguelikeEvolutionRewardPool()
      .filter((player) => fallbackPool.some((candidate) => candidate.id === player.id))
      .filter((player) => getPlayerTier(player) === "Ruby");
  }

  return getNodePlayerPool(node, pool, fallbackPool);
};

const getRewardDraftTitle = (node: RoguelikeNode) => {
  if (node.id === "act-one-boss" || node.id === "act-one-boss-current") {
    return "Version player reward";
  }

  if (node.rewardChoices > 0) {
    return "Reward draft";
  }

  return "Node reward";
};

const getRewardDraftDescription = (node: RoguelikeNode) => {
  const nodeChoiceTiers = getNodeChoiceTiers(node);
  const tierLabel =
    nodeChoiceTiers?.length === 2
      ? `${nodeChoiceTiers[0]} or ${nodeChoiceTiers[1]} tier`
      : nodeChoiceTiers?.length === 1
        ? nodeChoiceTiers[0]
        : "eligible";

  if (node.id === "act-one-faceoff" || node.id === "act-one-faceoff-current") {
    return "Open the Bench 1 slot and choose 1 of 5 Ruby players for your run roster.";
  }

  if (node.id === "act-one-boss" || node.id === "act-one-boss-current") {
    return "Choose 1 of 3 Ruby version players, each being the lower version of a player that can evolve into a stronger version later in the run.";
  }

  if (node.rewardChoices > 0) {
    return `Choose 1 of ${node.rewardChoices} ${tierLabel} players for your run roster.`;
  }

  return "Take the next run reward tied to this node.";
};

const getNodeCompletionRewardCopy = (node: RoguelikeNode) => {
  if (node.type === "choice") {
    return {
      title: "Branch decision",
      description: "Choose between Training Camp and Trade, then complete the path that best fits your roster.",
    };
  }

  if (node.type === "locker-room") {
    return {
      title: "Locker Room visit",
      description: "Enter the Locker Room store, check your cash, and spend on any run upgrades you want before the climb continues.",
    };
  }

  if (node.type === "training") {
    return {
      title: "Training boost",
      description: "Choose 1 player from your run roster to gain +1 OVR for the rest of the run.",
    };
  }

  if (node.type === "trade") {
    return {
      title: "Trade opportunity",
      description: "You may trade away 1 player and then choose 1 replacement from a fresh 5-player board limited to similar-caliber options.",
    };
  }

  if (node.type === "evolution") {
    return {
      title: "Evolution upgrade",
      description:
        "Upgrade 1 eligible version player on your roster into their next stronger version. If none are eligible, this converts into 1 Draft Shuffle ticket.",
    };
  }

  if ((node.draftShuffleReward ?? 0) > 0 && node.rewardChoices === 0) {
    return {
      title: "Draft Shuffle ticket",
      description: `Earn ${node.draftShuffleReward} Draft Shuffle ticket${(node.draftShuffleReward ?? 0) > 1 ? "s" : ""} to reroll a live 5-player draft board later in this run.`,
    };
  }

  if (node.id === "act-one-faceoff" || node.id === "act-one-faceoff-current") {
    return {
      title: "Bench unlock + reward draft",
      description: "Open the Bench 1 slot and choose 1 of 5 Ruby players for your run roster.",
    };
  }

  if (node.id === "act-one-boss" || node.id === "act-one-boss-current") {
    return {
      title: "Version player reward",
      description:
        "Choose 1 of 3 Ruby version players, each being the lower version of a player that can evolve into a stronger version later in the run.",
    };
  }

  if (node.rewardChoices > 0) {
    return {
      title: "Reward draft",
      description: getRewardDraftDescription(node),
    };
  }

  return {
    title: getRewardDraftTitle(node),
    description: getRewardDraftDescription(node),
  };
};

const BackToRunLadderButton = ({
  onClick,
  className = "mt-6",
  label = "Back to Run Ladder",
}: {
  onClick: () => void;
  className?: string;
  label?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      className,
      "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10",
    )}
  >
    {label}
  </button>
);

const getRogueSlotLabel = (slot: RosterSlot, index: number) => {
  if (slot.slot === "UTIL") return index === 8 ? "Util 1" : "Util 2";
  if (index === 5) return "Bench 1";
  if (index === 6) return "Backup G/F";
  if (index === 7) return "Backup F/C";
  return slot.slot;
};

const getChallengeMetricLabel = (metric: "overall" | "offense" | "defense" | "chemistry" | "rebounding") => {
  if (metric === "overall") return "OVR";
  if (metric === "offense") return "OFF";
  if (metric === "defense") return "DEF";
  if (metric === "rebounding") return "REB";
  return "CHEM";
};

const getChallengeMetricValueForSlot = (
  slot: RosterSlot,
  metric: "overall" | "offense" | "defense" | "chemistry" | "rebounding",
  ownedPlayerIds: string[],
  trainedPlayerIds: string[],
) => {
  if (!slot.player) return 0;

  if (metric === "overall") {
    return Math.round(getRoguelikeAdjustedOverallForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10;
  }

  if (metric === "offense") {
    return Math.round(getRoguelikeAdjustedOffenseForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10;
  }

  if (metric === "defense") {
    return Math.round(getRoguelikeAdjustedDefenseForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10;
  }

  if (metric === "rebounding") {
    return Math.round(getRoguelikeAdjustedReboundingForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10;
  }

  return slot.player.intangibles;
};

const getAverageAdjustedOffense = (
  lineup: RosterSlot[],
  ownedPlayerIds: string[],
  trainedPlayerIds: string[],
) => {
  const filledSlots = lineup.filter((slot) => Boolean(slot.player));
  if (filledSlots.length === 0) return 0;

  return (
    Math.round(
      (filledSlots.reduce(
        (sum, slot) => sum + getRoguelikeAdjustedOffenseForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds),
        0,
      ) /
        filledSlots.length) *
        10,
    ) / 10
  );
};

const getAverageAdjustedRebounding = (
  lineup: RosterSlot[],
  ownedPlayerIds: string[],
  trainedPlayerIds: string[],
) => {
  const filledSlots = lineup.filter((slot) => Boolean(slot.player));
  if (filledSlots.length === 0) return 0;

  return (
    Math.round(
      (filledSlots.reduce(
        (sum, slot) => sum + getRoguelikeAdjustedReboundingForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds),
        0,
      ) /
        filledSlots.length) *
        10,
    ) / 10
  );
};

const getFaceoffFinalScore = (faceoffResult: RoguelikeFaceoffResult) => {
  const averageEdge =
    Math.abs(faceoffResult.userTeamWinProbability - faceoffResult.opponentTeamWinProbability) / 5;
  const scoreMargin = Math.max(3, Math.min(22, Math.round(averageEdge / 3) + 3));
  const paceScore = Math.max(
    92,
    Math.min(
      118,
      Math.round(
        101 +
          (faceoffResult.userTeamWinProbability + faceoffResult.opponentTeamWinProbability - 500) /
            18,
      ),
    ),
  );

  if (faceoffResult.userTeamWinProbability >= faceoffResult.opponentTeamWinProbability) {
    return {
      userScore: Math.min(132, paceScore + Math.ceil(scoreMargin / 2)),
      opponentScore: Math.max(78, paceScore - Math.floor(scoreMargin / 2)),
    };
  }

  return {
    userScore: Math.max(78, paceScore - Math.floor(scoreMargin / 2)),
    opponentScore: Math.min(132, paceScore + Math.ceil(scoreMargin / 2)),
  };
};

interface RogueFailureAutopsyCard {
  title: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
}

const getRogueBestFloorSnapshot = (run: RoguelikeRun, runNodes: RoguelikeNode[]) => {
  if (!runNodes.length) return 0;

  if (
    run.stage === "package-select" ||
    run.stage === "starter-reveal" ||
    (run.floorIndex === 0 && !run.activeNode && run.roster.length === 0)
  ) {
    return 0;
  }

  if (run.stage === "run-cleared") {
    return runNodes[runNodes.length - 1]?.floor ?? 0;
  }

  if (run.activeNode?.floor) {
    return run.activeNode.floor;
  }

  const indexedNode = runNodes[Math.min(run.floorIndex, runNodes.length - 1)] ?? null;
  return indexedNode?.floor ?? 0;
};

const hasEarnedNodeReward = (
  run: RoguelikeRun,
  nodeIndex: number,
  nodeResult?: RoguelikeRun["nodeResult"] | null,
) => {
  if (run.stage === "run-cleared") return true;
  if (nodeIndex < run.floorIndex) return true;

  return (
    nodeIndex === run.floorIndex &&
    (run.stage === "reward-draft" || run.stage === "node-result") &&
    nodeResult?.passed !== false
  );
};

const RogueNodeRewardsRail = ({
  rewards,
  lockerRoomCash,
  earned,
}: {
  rewards: RoguelikeClearRewards;
  lockerRoomCash: number;
  earned: boolean;
}) => {
  const hasRewards = rewards.tokenReward > 0 || rewards.prestigeXpAward > 0 || lockerRoomCash > 0;

  return (
    <div
      className={clsx(
        "rounded-[22px] border px-4 py-4 transition",
        earned && hasRewards
          ? "border-emerald-300/34 bg-[linear-gradient(180deg,rgba(6,78,59,0.34),rgba(16,185,129,0.14),rgba(5,46,22,0.34))] shadow-[0_0_0_1px_rgba(52,211,153,0.14),0_0_26px_rgba(16,185,129,0.14)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={clsx(
          "text-[10px] uppercase tracking-[0.22em]",
          earned && hasRewards ? "text-emerald-100/86" : "text-slate-400",
        )}>
          Rewards
        </div>
        {earned && hasRewards ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/28 bg-emerald-300/14 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-50">
            <CheckCircle2 size={11} />
            Earned
          </span>
        ) : null}
      </div>
      {hasRewards ? (
        <div className="mt-3 space-y-2.5">
          {lockerRoomCash > 0 ? (
            <div
              className={clsx(
                "flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2.5",
                earned ? "border-emerald-200/18 bg-emerald-300/10" : "border-white/8 bg-black/14",
              )}
            >
              <span className="inline-flex items-center gap-2 text-xs font-medium text-white/84">
                <Coins size={14} className={earned ? "text-emerald-200" : "text-slate-400"} />
                Locker Room Cash
              </span>
              <span className="text-sm font-semibold text-white">+{lockerRoomCash}</span>
            </div>
          ) : null}
          <div
            className={clsx(
              "flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2.5",
              earned ? "border-amber-200/18 bg-amber-300/10" : "border-white/8 bg-black/14",
            )}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-white/84">
              <Coins size={14} className={earned ? "text-amber-200" : "text-slate-400"} />
              Tokens
            </span>
            <span className="text-sm font-semibold text-white">+{rewards.tokenReward}</span>
          </div>
          <div
            className={clsx(
              "flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2.5",
              earned ? "border-sky-200/18 bg-sky-300/10" : "border-white/8 bg-black/14",
            )}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-white/84">
              <Sparkles size={14} className={earned ? "text-sky-200" : "text-slate-400"} />
              Prestige XP
            </span>
            <span className="text-sm font-semibold text-white">+{rewards.prestigeXpAward}</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-[16px] border border-white/8 bg-black/14 px-3 py-4 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
          No completion rewards
        </div>
      )}
    </div>
  );
};

const RogueRosterSlotCard = ({
  slot,
  index,
  ownedPlayerIds,
  trainedPlayerIds,
  allStarBonusBadges,
  focusMetrics = [],
  dragged,
}: {
  slot: RosterSlot;
  index: number;
  ownedPlayerIds: string[];
  trainedPlayerIds: string[];
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[];
  focusMetrics?: Array<"overall" | "offense" | "defense" | "chemistry" | "rebounding">;
  dragged: boolean;
}) => {
  const player = slot.player;
  const displayPlayer = player ? getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds) : null;
  const naturalPositions = displayPlayer
    ? [displayPlayer.primaryPosition, ...displayPlayer.secondaryPositions].join(" / ")
    : "Open";
  const slotPenalty = player ? getRoguelikeSlotPenalty(player, slot) : 0;
  const adjustedOverall = player ? getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) : 0;
  const outOfPosition = slotPenalty > 0;
  const overallDelta = displayPlayer ? adjustedOverall - displayPlayer.overall : 0;
  const boosted = overallDelta > 0;
  const playerNameLength = displayPlayer?.name.length ?? 0;
  const badgeOverrides = player
    ? getRunPlayerTypeBadgeOverrides(displayPlayer ?? player, allStarBonusBadges)
    : [];
  const metricChips = player
    ? focusMetrics
        .filter((metric) => metric !== "overall" && metric !== "chemistry")
        .map((metric) => {
          const value =
            metric === "offense"
              ? Math.round(getRoguelikeAdjustedOffenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10
              : metric === "defense"
                ? Math.round(getRoguelikeAdjustedDefenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10
                : Math.round(getRoguelikeAdjustedReboundingForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10;

          return {
            metric,
            label: getChallengeMetricLabel(metric),
            value,
          };
        })
    : [];

  return (
    <div className={clsx("transition", dragged && "scale-[0.98] opacity-55")}>
      <RunRosterPlayerCard
        player={player}
        displayPlayer={displayPlayer}
        draftedPlayerIds={ownedPlayerIds}
        overallOverride={adjustedOverall || undefined}
        eyebrow={getRogueSlotLabel(slot, index)}
        eyebrowToneClassName={outOfPosition ? "text-rose-300" : undefined}
        badgesOverride={badgeOverrides}
        metricChips={metricChips.map((chip) => ({
          label: chip.label,
          value: chip.value,
          toneClassName: "border-sky-200/14 bg-sky-300/10 text-sky-100",
        }))}
        showHandle
        scale={0.8}
        enableTeamChemistry
      />
    </div>
  );
};

const FaceoffStarterCard = ({
  player,
  slot,
  slotLabel,
  ownedPlayerIds = [],
  trainedPlayerIds = [],
  allStarBonusBadges = [],
  align = "left",
}: {
  player: Player | null;
  slot: RosterSlot;
  slotLabel: string;
  ownedPlayerIds?: string[];
  trainedPlayerIds?: string[];
  allStarBonusBadges?: RoguelikeBonusBadgeAssignment[];
  align?: "left" | "right";
}) => {
  const displayPlayer = player ? getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds) : null;
  const badgeOverrides = player
    ? getRunPlayerTypeBadgeOverrides(displayPlayer ?? player, allStarBonusBadges)
    : [];
  const imageUrl = player ? usePlayerImage(player) : null;
  const { firstNameLine, lastNameLine, versionLine } = displayPlayer
    ? getPlayerDisplayLines(displayPlayer)
    : { firstNameLine: "", lastNameLine: "", versionLine: "" };
  const slotPenalty = player ? getRoguelikeSlotPenalty(player, slot) : 0;
  const adjustedOverall = player
    ? getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds)
    : 0;
  const outOfPosition = slotPenalty > 0;
  const displayName = displayPlayer ? displayPlayer.name.replace(/\s*\([^)]*\)\s*$/, "").trim() : "Open Slot";

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
      <div className={clsx("text-[10px] uppercase tracking-[0.18em] text-slate-400", align === "right" && "text-right")}>
        {slotLabel}
      </div>
      <div
        className={clsx(
          "mt-2 grid items-center gap-3",
          player ? "grid-cols-[56px_minmax(0,1fr)_92px]" : "grid-cols-[56px_minmax(0,1fr)]",
        )}
      >
        <div className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[15px] border border-white/10 bg-black/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={player?.name ?? slotLabel}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-white/60">
              {player?.name.charAt(0) ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold leading-[1.02] text-white">
            {displayPlayer ? (
              <>
                <div className="truncate text-[1.02rem]">{displayName}</div>
                {versionLine ? (
                  <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-300/88">
                    {versionLine}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="text-[0.98rem]">Open Slot</div>
            )}
          </div>
          <div className="mt-1.5 truncate text-[11px] uppercase tracking-[0.16em] text-slate-400">
            {displayPlayer
              ? [displayPlayer.primaryPosition, ...displayPlayer.secondaryPositions].join(" / ")
              : "Missing starter"}
          </div>
        </div>
        {player ? (
          <div className={clsx("flex min-w-0 flex-col gap-1.5 self-stretch justify-center", align === "right" ? "items-start" : "items-end")}>
            <PlayerTypeBadges
              player={displayPlayer ?? player}
              badgesOverride={badgeOverrides}
              compact
              iconOnly
              align="start"
              className={clsx("gap-1", align === "right" ? "justify-start self-start" : "justify-end self-end")}
            />
            <div className={clsx("text-xs font-semibold whitespace-nowrap", outOfPosition ? "text-rose-300" : "text-amber-100")}>
              {outOfPosition ? <ChevronDown size={12} className="mr-1 inline-block align-[-1px]" /> : null}
              {adjustedOverall} OVR
            </div>
          </div>
        ) : (
          <div className={clsx("text-[11px] uppercase tracking-[0.16em] text-slate-500", align === "right" ? "text-left" : "text-right")}>
            Missing starter
          </div>
        )}
      </div>
      {!player ? (
        <div className="mt-1 pl-[68px] text-[11px] uppercase tracking-[0.16em] text-slate-500">
          Set a player in this slot
        </div>
      ) : null}
    </div>
  );
};

const FaceoffMatchupRow = ({
  matchup,
  trainedPlayerIds = [],
  allStarBonusBadges = [],
}: {
  matchup: RoguelikeFaceoffMatchup;
  trainedPlayerIds?: string[];
  allStarBonusBadges?: RoguelikeBonusBadgeAssignment[];
}) => {
  const formatBreakdownValue = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded >= 0 ? "+" : ""}${rounded}`;
  };
  const bossSupport =
    matchup.opponentBreakdown.chemistrySupport +
    matchup.opponentBreakdown.teamProfileSupport +
    matchup.opponentBreakdown.lineupBalanceBonus;
  const userSupport =
    matchup.userBreakdown.chemistrySupport +
    matchup.userBreakdown.teamProfileSupport +
    matchup.userBreakdown.lineupBalanceBonus;

  return (
    <div className="rounded-[26px] border border-white/10 bg-black/18 p-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
        <FaceoffStarterCard
          player={matchup.opponentPlayer}
          slot={{
            slot: matchup.slot,
            label: matchup.slot,
            allowedPositions: [matchup.slot as Player["primaryPosition"]],
            player: matchup.opponentPlayer,
          }}
          slotLabel={`Boss ${matchup.slot}`}
          align="right"
        />
        <div className="rounded-[22px] border border-fuchsia-200/16 bg-fuchsia-300/8 px-4 py-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-100/80">
            {matchup.slot} Matchup
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {matchup.userWinProbability}%
          </div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
            Your win chance
          </div>
          <div className="mt-3 flex items-center justify-center gap-3 text-xs">
            <span className="rounded-full border border-rose-200/18 bg-rose-300/10 px-3 py-1 text-rose-100">
              Boss {matchup.opponentRating}
            </span>
            <span className="text-slate-500">vs</span>
            <span className="rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-1 text-emerald-100">
              You {matchup.userRating}
            </span>
          </div>
          <div
            className={clsx(
              "mt-3 text-sm",
              matchup.ratingDelta >= 0 ? "text-emerald-100" : "text-rose-100",
            )}
          >
            {matchup.ratingDelta >= 0 ? "+" : ""}
            {matchup.ratingDelta} matchup edge
          </div>
          <div className="mt-4 grid gap-2 rounded-[18px] border border-white/8 bg-black/16 px-3 py-3 text-left text-[11px] text-slate-200">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="uppercase tracking-[0.16em] text-slate-400">Core</span>
              <span className="h-px bg-white/8" />
              <span>{matchup.opponentBreakdown.baseScore} vs {matchup.userBreakdown.baseScore}</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="uppercase tracking-[0.16em] text-slate-400">Lineup</span>
              <span className="h-px bg-white/8" />
              <span>{formatBreakdownValue(bossSupport)} vs {formatBreakdownValue(userSupport)}</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="uppercase tracking-[0.16em] text-slate-400">Badges</span>
              <span className="h-px bg-white/8" />
              <span>{matchup.opponentBreakdown.badgeMatchupBonus >= 0 ? "+" : ""}{matchup.opponentBreakdown.badgeMatchupBonus} vs {matchup.userBreakdown.badgeMatchupBonus >= 0 ? "+" : ""}{matchup.userBreakdown.badgeMatchupBonus}</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="uppercase tracking-[0.16em] text-slate-400">Head To Head</span>
              <span className="h-px bg-white/8" />
              <span>{matchup.opponentBreakdown.headToHeadBonus >= 0 ? "+" : ""}{matchup.opponentBreakdown.headToHeadBonus} vs {matchup.userBreakdown.headToHeadBonus >= 0 ? "+" : ""}{matchup.userBreakdown.headToHeadBonus}</span>
            </div>
          </div>
        </div>
        <FaceoffStarterCard
          player={matchup.userPlayer}
          slot={{
            slot: matchup.slot,
            label: matchup.slot,
            allowedPositions: [matchup.slot as Player["primaryPosition"]],
            player: matchup.userPlayer,
          }}
          slotLabel={`Your ${matchup.slot}`}
          trainedPlayerIds={trainedPlayerIds}
          allStarBonusBadges={allStarBonusBadges}
        />
      </div>
    </div>
  );
};

const StarterRevealCard = ({
  player,
  index,
  revealed,
  onReveal,
}: {
  player: Player;
  index: number;
  revealed: boolean;
  onReveal: () => void;
}) => {
  const starterRevealBackLogo = "/nba-ultimate-draft-badge.png";
  const starterRevealCardScale = 0.49;
  const starterRevealCardWidth = 186;
  const starterRevealCardHeight = 451;

  return (
    <div
      className="group shrink-0 [perspective:1600px]"
      style={{ width: `${starterRevealCardWidth}px` }}
    >
      <div
        className="relative transition-transform duration-500 [transform-style:preserve-3d]"
        style={{
          height: `${starterRevealCardHeight}px`,
          transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <button
            type="button"
            onClick={onReveal}
            disabled={revealed}
            className={clsx(
              "relative h-full w-full overflow-hidden rounded-[28px] border text-left transition duration-300",
              "border-white/12 bg-[linear-gradient(180deg,rgba(54,34,20,0.96),rgba(33,20,12,0.98))]",
              !revealed && "hover:-translate-y-1 hover:border-amber-200/24",
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.09),transparent_35%)]" />
            <div className="relative flex h-full flex-col justify-between p-6">
              <div className="h-[16px]" />
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full rounded-[26px] border border-amber-100/12 bg-[linear-gradient(145deg,rgba(74,46,22,0.96),rgba(34,20,12,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(160deg,rgba(95,58,28,0.82),rgba(63,36,17,0.92),rgba(30,18,10,0.98))] px-6 py-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_32%,rgba(0,0,0,0.28))]" />
                    <div className="absolute inset-[14px] rounded-[18px] border border-white/8" />
                    <div className="relative flex items-center justify-center rounded-[28px] border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.06),rgba(255,255,255,0.01)_58%,transparent_78%)] px-8 py-8 shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
                      <img
                        src={starterRevealBackLogo}
                        alt="NBA Ultimate Draft"
                        className="h-auto w-full max-w-[240px] object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.35)]"
                        loading="eager"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[24px]" />
            </div>
          </button>
        </div>

        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="pointer-events-none">
            <DraftPlayerCard
              player={player}
              compact
              compactScale={starterRevealCardScale}
              actionLabel="Starter revealed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const AllStarPlayerOptionCard = ({
  player,
  selected,
  disabled,
  onSelect,
}: {
  player: Player;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) => {
  const imageUrl = usePlayerImage(player);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={clsx(
        "w-full rounded-[20px] border px-4 py-3 text-left transition",
        selected
          ? "border-amber-300/40 bg-amber-300/12"
          : disabled
            ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-500"
            : "border-white/10 bg-white/6 hover:bg-white/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] border border-white/10 bg-black/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={player.name}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-lg font-semibold text-white/70">
              {player.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold leading-6 text-white">{player.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-200/20 bg-amber-300/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100">
              {player.overall} OVR
            </span>
            <span className="text-xs text-slate-300">
              {[player.primaryPosition, ...player.secondaryPositions].join(" / ")}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

const RogueSelectionPlayerCard = ({
  player,
  selected,
  selectedLabel,
  idleLabel,
  selectedTone,
  idleTone,
  onSelect,
  className,
}: {
  player: Player;
  selected: boolean;
  selectedLabel: string;
  idleLabel: string;
  selectedTone: string;
  idleTone: string;
  onSelect: () => void;
  className?: string;
}) => {
  const imageUrl = usePlayerImage(player);
  const { firstNameLine, lastNameLine } = getPlayerDisplayLines(player);
  const displayName = [firstNameLine, lastNameLine].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "rounded-[22px] border px-4 py-3 text-left transition",
        selected ? selectedTone : idleTone,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] border border-white/10 bg-black/20">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={player.name}
                  className="h-full w-full object-cover object-top"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-900 text-lg font-semibold text-white/70">
                  {player.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                {player.primaryPosition}
              </div>
              <div className="mt-1 text-lg font-semibold leading-6 text-white">{displayName}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-200/20 bg-amber-300/12 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
                  {player.overall} OVR
                </span>
                <span className="text-sm text-slate-300">
                  {[player.primaryPosition, ...player.secondaryPositions].join(" / ")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          className={clsx(
            "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]",
            selected
              ? "border-rose-200/30 bg-rose-300/16 text-rose-50"
              : "border-white/10 bg-white/6 text-slate-300",
          )}
        >
          {selected ? selectedLabel : idleLabel}
        </div>
      </div>
    </button>
  );
};

const FinalVictoryStatCard = ({
  label,
  value,
  accentClassName,
  sublabel,
}: {
  label: string;
  value: string;
  accentClassName: string;
  sublabel?: string;
}) => (
  <div className={clsx("rounded-[18px] border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]", accentClassName)}>
    <div className="text-[10px] uppercase tracking-[0.24em] text-white/70">{label}</div>
    <div className="mt-2 text-[clamp(1.45rem,2.2vw,2rem)] font-semibold leading-none text-white">{value}</div>
    {sublabel ? <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/56">{sublabel}</div> : null}
  </div>
);

const FinalVictoryStarterCard = ({
  slot,
  player,
  ownedPlayerIds,
  trainedPlayerIds,
  allStarBonusBadges = [],
}: {
  slot: RosterSlot;
  player: Player;
  ownedPlayerIds: string[];
  trainedPlayerIds: string[];
  allStarBonusBadges?: RoguelikeBonusBadgeAssignment[];
}) => {
  const imageUrl = usePlayerImage(player);
  const displayPlayer = getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds);
  const badgeOverrides = getRunPlayerTypeBadgeOverrides(displayPlayer, allStarBonusBadges);
  const adjustedOverall = Math.round(
    getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10,
  ) / 10;

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(6,10,19,0.88),rgba(15,20,34,0.96))] shadow-[0_18px_44px_rgba(0,0,0,0.24)]">
      <div className="relative h-24 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_48%),linear-gradient(180deg,rgba(18,25,40,0.96),rgba(5,8,16,0.98))]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_42%)]" />
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayPlayer.name}
            className="h-full w-full object-cover object-top"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-white/70">
            {displayPlayer.name.charAt(0)}
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full border border-white/16 bg-black/38 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/80">
          {slot.slot}
        </div>
        <div className="absolute right-3 top-3 rounded-full border border-amber-200/24 bg-amber-300/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-50">
          {adjustedOverall} OVR
        </div>
      </div>
      <div className="space-y-2 p-2.5">
        <div>
          <div className="text-[0.88rem] font-semibold leading-4 text-white">{displayPlayer.name}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-slate-300">
            {[displayPlayer.primaryPosition, ...displayPlayer.secondaryPositions].join(" / ")}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-0.5">
          <PlayerTypeBadges player={displayPlayer} badgesOverride={badgeOverrides} compact iconOnly />
        </div>
      </div>
    </div>
  );
};

export const RoguelikeMode = ({
  activeRogueStarId,
  ownedTrainingCampTickets,
  ownedTradePhones,
  ownedSilverStarterPacks,
  ownedGoldStarterPacks,
  ownedPlatinumStarterPacks,
  onLeaveRun,
  onBackToHome,
  onAwardFailureRewards,
  onUpdatePersonalBests,
  onUseTrainingCampTicket,
  onUseTradePhone,
  onUseSilverStarterPack,
  onUseGoldStarterPack,
  onUsePlatinumStarterPack,
}: RoguelikeModeProps) => {
  const [run, setRun] = useState<RoguelikeRun | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(ROGUELIKE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<RoguelikeRun>;
      return normalizeStoredRun(parsed, activeRogueStarId);
    } catch {
      return null;
    }
  });
  const [showPackSelectionHub, setShowPackSelectionHub] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(ROGUELIKE_PARKED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [showOutcomeOverlay, setShowOutcomeOverlay] = useState(false);
  const [showChallengeBreakdown, setShowChallengeBreakdown] = useState(false);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [selectedStarterPackUpgrade, setSelectedStarterPackUpgrade] = useState<"standard" | "silver" | "gold" | "platinum">("standard");
  const [selectedRunSettings, setSelectedRunSettings] = useState<RoguelikeRunSettings>(
    DEFAULT_ROGUELIKE_RUN_SETTINGS,
  );
  const [showRunSettingsScreen, setShowRunSettingsScreen] = useState(() => !run || showPackSelectionHub);
  const currentLadderNodeRef = useRef<HTMLDivElement | null>(null);
  const [dragPointer, setDragPointer] = useState<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const metrics = useMemo(() => {
    if (!run) return evaluateRoguelikeRoster([]);
    const ownedPlayerIds = getRunOwnedPlayers(run).map((player) => player.id);
    if (run.stage !== "starter-reveal") {
      return evaluateRoguelikeLineup(run.lineup, ownedPlayerIds, run.trainedPlayerIds ?? []);
    }

    const revealedStarterPlayers = run.starterRevealPlayers.filter((player) =>
      run.revealedStarterIds.includes(player.id),
    );
    return evaluateRoguelikeLineup(
      buildRoguelikeStarterLineup(revealedStarterPlayers),
      revealedStarterPlayers.map((player) => player.id),
      run.trainedPlayerIds ?? [],
    );
  }, [run]);

  const activeRunSettings = run?.settings ?? selectedRunSettings;
  const runNodes = useMemo(
    () => getRoguelikeNodesForSettings(activeRunSettings),
    [activeRunSettings],
  );
  const runPlayerUniverse = useMemo(
    () => getRoguelikePlayerUniverse(activeRunSettings),
    [activeRunSettings],
  );

  useEffect(() => {
    if (!run?.settings) return;
    setSelectedRunSettings(run.settings);
  }, [run?.settings]);

  useEffect(() => {
    if (!run || run.stage !== "starter-reveal") return;
    if (run.starterRevealPlayers.length >= 3) return;

    const repairedStarterRevealPlayers = buildStarterRevealRunRepair(run, activeRogueStarId);
    if (repairedStarterRevealPlayers.length === 0) return;

    setRun({
      ...run,
      starterRevealPlayers: repairedStarterRevealPlayers,
    });
  }, [activeRogueStarId, run]);

  useEffect(() => {
    if (!run || showPackSelectionHub) return;
    if (run.activeNode || run.roster.length > 0 || run.floorIndex > 0) return;
    if (run.stage === "starter-reveal" && run.starterRevealPlayers.length >= 3) return;

    const repairedStarterRevealPlayers =
      run.starterRevealPlayers.length >= 3
        ? run.starterRevealPlayers
        : buildStarterRevealRunRepair(run, activeRogueStarId);

    if (repairedStarterRevealPlayers.length < 3) return;

    setRun({
      ...run,
      stage: "starter-reveal",
      starterRevealPlayers: repairedStarterRevealPlayers,
      revealedStarterIds: run.revealedStarterIds.filter((playerId) =>
        repairedStarterRevealPlayers.some((player) => player.id === playerId),
      ),
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
    });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [activeRogueStarId, run, showPackSelectionHub]);

  useEffect(() => {
    if (!run) return;

    const furthestFloor = getRogueBestFloorSnapshot(run, runNodes);

    onUpdatePersonalBests({
      furthestFloor,
      overall: metrics.overall,
      offense: metrics.offense,
      defense: metrics.defense,
      chemistry: metrics.chemistry,
    });
  }, [
    run,
    runNodes.length,
    metrics.overall,
    metrics.offense,
    metrics.defense,
    metrics.chemistry,
    onUpdatePersonalBests,
  ]);

  const setParkedRunState = (parked: boolean) => {
    if (typeof window === "undefined") return;

    if (parked) {
      window.localStorage.setItem(ROGUELIKE_PARKED_STORAGE_KEY, "true");
      return;
    }

    window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
  };

  const startRun = (
    packageId: RoguelikeStarterPackageId,
    settingsOverride?: RoguelikeRunSettings,
  ) => {
    const usingSilverStarterPack = selectedStarterPackUpgrade === "silver";
    const usingGoldStarterPack = selectedStarterPackUpgrade === "gold";
    const usingPlatinumStarterPack = selectedStarterPackUpgrade === "platinum";
    if (usingSilverStarterPack && !onUseSilverStarterPack()) return;
    if (usingGoldStarterPack && !onUseGoldStarterPack()) return;
    if (usingPlatinumStarterPack && !onUsePlatinumStarterPack()) return;

    const seed = createSeed();
    const runSettings = settingsOverride ?? selectedRunSettings;
    const activeRogueStar = getPlayerById(activeRogueStarId);
    const playerUniverse = getRoguelikePlayerUniverse(runSettings);
    const starterRevealSource = playerUniverse.filter((player) => player.id !== activeRogueStar?.id);
    const starterRevealPlayers = ensureVisibleStarterRevealPlayers(
      packageId,
      seed,
      getStarterPackAverageForUpgrade(selectedStarterPackUpgrade),
      activeRogueStar,
      starterRevealSource,
    );
    const lineup = buildRoguelikeStarterLineup([]);
    setSelectedStarterPackUpgrade("standard");
    setShowPackSelectionHub(false);
    setShowRunSettingsScreen(false);
    setShowOutcomeOverlay(false);
    setShowChallengeBreakdown(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setParkedRunState(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    setRun({
      ladderVersion: CURRENT_ROGUELIKE_LADDER_VERSION,
      seed,
      packageId: packageId,
      settings: runSettings,
      roster: [],
      lineup,
      availablePool: playerUniverse,
      seenChoicePlayerIds: [],
      choices: [],
      starterRevealPlayers,
      revealedStarterIds: [],
      lives: 3,
      floorIndex: 0,
        initialPicks: 0,
        draftShuffleTickets: 0,
        lockerRoomCash: 0,
        unlockedBundleIds: [],
      scoutedBossNodeIds: [],
      selectedCutPlayerIds: [],
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      allStarAssignments: {
        dunkContest: null,
        threePointContest: null,
        skillsChallenge: null,
      },
      trainedPlayerIds: [],
      allStarBonusBadges: [],
      pendingChoiceSelection: null,
      pendingTradeState: null,
      utilityReturnState: null,
      failureReviewStage: null,
      lockerRoomNotice: null,
      stage: "starter-reveal",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
    });
  };

  const buildFailureRewards = (floorIndex: number) => {
    const rewards = getRoguelikeFailureRewards(floorIndex);
    onAwardFailureRewards(rewards.prestigeXpAward);
    return rewards;
  };

  const buildClearRewards = (node: RoguelikeNode) => {
    const rewards = getRoguelikeClearRewards(node, run?.settings ?? activeRunSettings);
    if (rewards.prestigeXpAward > 0) {
      onAwardFailureRewards(rewards.prestigeXpAward);
    }
    return rewards;
  };

  const awardLockerRoomCash = (sourceRun: RoguelikeRun, node: RoguelikeNode) => ({
    ...sourceRun,
    lockerRoomCash: sourceRun.lockerRoomCash + getRoguelikeLockerRoomCashReward(node),
  });

  const previewFailureRewards = (floorIndex: number) => getRoguelikeFailureRewards(floorIndex);

  const leaveLockerRoom = () => {
    if (!run || run.stage !== "locker-room") return;

    const lockerRoomHostNode =
      run.activeNode?.type === "locker-room"
        ? run.activeNode
        : run.utilityReturnState?.stage === "locker-room" && run.utilityReturnState.activeNode?.type === "locker-room"
          ? run.utilityReturnState.activeNode
          : null;

    if (lockerRoomHostNode) {
      const nextFloorIndex = run.floorIndex + 1;
      const nextNode = runNodes[nextFloorIndex] ?? null;

      setRun({
        ...run,
        floorIndex: nextFloorIndex,
        stage: nextNode ? "ladder-overview" : "run-over",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: null,
        lockerRoomNotice: null,
        utilityReturnState: null,
      });
      return;
    }

    setRun(
      restoreUtilityReturnState({
        ...run,
        lockerRoomNotice: null,
      }),
    );
  };

  const backToLockerRoom = () => {
    if (!run || !run.utilityReturnState) return;

    if (run.utilityReturnState.stage === "locker-room") {
      setRun({
        ...run,
        stage: "locker-room",
        activeNode: run.utilityReturnState.activeNode,
        activeOpponentPlayerIds: null,
        nodeResult: null,
        selectedCutPlayerIds: [],
        selectedNaturalPositionPlayerId: null,
        selectedNaturalPosition: null,
        allStarAssignments: {
          dunkContest: null,
          threePointContest: null,
          skillsChallenge: null,
        },
        utilityReturnState: null,
      });
      return;
    }

    setRun({
      ...run,
      stage: "locker-room",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
      selectedCutPlayerIds: [],
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      allStarAssignments: {
        dunkContest: null,
        threePointContest: null,
        skillsChallenge: null,
      },
    });
  };

  const revealStarterCard = (playerId: string) => {
    if (!run || run.stage !== "starter-reveal" || run.revealedStarterIds.includes(playerId)) return;

    const nextRevealedStarterIds = [...run.revealedStarterIds, playerId];
    const revealedStarterRosterState = buildRevealedStarterRosterState(run, nextRevealedStarterIds);
    setRun({
      ...run,
      ...revealedStarterRosterState,
      revealedStarterIds: nextRevealedStarterIds,
    });
  };

  const proceedToRunLadder = () => {
    if (!run || run.stage !== "starter-reveal") return;
    const { ownedPlayers, lineup } = getEarlyRunRosterState(run);
    setShowPackSelectionHub(false);
    setParkedRunState(false);

    setRun({
      ...run,
      roster: ownedPlayers,
      lineup,
      stage: "ladder-overview",
      activeNode: null,
      activeOpponentPlayerIds: null,
    });
  };

  const completeRewardDraftSelection = (
    sourceRun: RoguelikeRun,
    nextRoster: Player[],
    nextLineup: RosterSlot[],
  ) => {
    if (sourceRun.activeNode?.id === STORE_TRADE_NODE.id) {
      setRun(
        restoreUtilityReturnState({
          ...sourceRun,
          roster: nextRoster,
          lineup: nextLineup,
          choices: [],
          nodeResult: null,
          pendingRewardPlayer: null,
          pendingTradeState: null,
          pendingChoiceSelection: null,
        }),
      );
      return;
    }

    if (sourceRun.activeNode) {
      buildClearRewards(sourceRun.activeNode);
    }

    const nextFloorIndex = sourceRun.activeNode ? sourceRun.floorIndex + 1 : sourceRun.floorIndex;

    setRun({
      ...sourceRun,
      roster: nextRoster,
      lineup: nextLineup,
      choices: [],
      floorIndex: nextFloorIndex,
      stage: runNodes[nextFloorIndex] ? "ladder-overview" : "run-cleared",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
      pendingRewardPlayer: null,
      pendingTradeState: null,
      pendingChoiceSelection: null,
    });
  };

  const startOpeningDraft = () => {
    if (!run || run.stage !== "ladder-overview") return;
    const currentNode = runNodes[run.floorIndex] ?? null;
    if (!currentNode) return;

    if (run.activeNode?.id === currentNode.id) {
      if (run.pendingRewardPlayer) {
        setRun({
          ...run,
          stage: "reward-replace-select",
        });
        return;
      }

      if (run.choices.length > 0) {
        setRun({
          ...run,
          stage: run.initialPicks === 0 ? "initial-draft" : "reward-draft",
        });
        return;
      }

      if (currentNode.type === "training") {
        setRun({ ...run, stage: "training-select" });
        return;
      }

      if (currentNode.type === "choice") {
        setRun({ ...run, stage: "choice-select" });
        return;
      }

      if (currentNode.type === "locker-room") {
        setRun({
          ...run,
          stage: "locker-room",
          lockerRoomNotice: null,
          nodeResult: null,
        });
        return;
      }

      if (currentNode.type === "add-position") {
        setRun({ ...run, stage: "add-position-select" });
        return;
      }

      if (currentNode.type === "all-star") {
        setRun({ ...run, stage: "all-star-select" });
        return;
      }

      if (currentNode.type === "roster-cut") {
        setRun({ ...run, stage: "roster-cut-select" });
        return;
      }

      if (currentNode.type === "trade") {
        setRun({ ...run, stage: "trade-offer" });
        return;
      }

      if (currentNode.type === "evolution") {
        setRun({ ...run, stage: "evolution-select" });
        return;
      }

      if (currentNode.type === "challenge") {
        setRun({ ...run, stage: "challenge-setup" });
        return;
      }

      if (currentNode.battleMode === "starting-five-faceoff") {
        const hydratedRun = getHydratedRun(run, runNodes);
        setRun({
          ...run,
          roster: hydratedRun.roster,
          lineup: hydratedRun.lineup,
          stage: "faceoff-setup",
        });
        return;
      }
    }

    if (currentNode.type === "draft") {
      const nextRun =
        run.initialPicks === 0
          ? {
              ...run,
              ...getEarlyRunRosterState(run),
            }
          : run;
      const openingDraftPool = getNodePlayerPool(
        currentNode,
        run.initialPicks === 0 ? buildOpeningDraftPool(runPlayerUniverse) : nextRun.availablePool,
        runPlayerUniverse,
      );
      const draftedPlayers = getRunOwnedPlayers(nextRun);
      const nextChoicesState = drawRunChoices(
        nextRun,
        openingDraftPool,
        draftedPlayers,
        5,
        nextChoiceSeed(run.seed, 11 + run.floorIndex * 19),
        getNodeChoiceTiers(currentNode) ? [...getNodeChoiceTiers(currentNode)!] : undefined,
        shouldStrictlyUseNodePool(currentNode),
      );
      setRun({
        ...nextRun,
        activeNode: currentNode,
        stage: run.initialPicks === 0 ? "initial-draft" : "reward-draft",
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        nodeResult: {
          title: getRewardDraftTitle(currentNode),
          detail:
            currentNode.floor === 1
              ? "Starter Cache is open. Choose 1 of 5 Emerald players to add to your run roster."
                : getRewardDraftDescription(currentNode),
            passed: true,
          },
      });
      return;
    }

    if (currentNode.type === "training") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "training-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "choice") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        pendingChoiceSelection: null,
        stage: "choice-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "locker-room") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "locker-room",
        nodeResult: null,
        lockerRoomNotice: null,
      });
      return;
    }

    if (currentNode.type === "add-position") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        selectedNaturalPositionPlayerId: null,
        selectedNaturalPosition: null,
        stage: "add-position-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "all-star") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        allStarAssignments: {
          dunkContest: null,
          threePointContest: null,
          skillsChallenge: null,
        },
        stage: "all-star-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "roster-cut") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        selectedCutPlayerIds: [],
        stage: "roster-cut-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "trade") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "trade-offer",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "evolution") {
      const evolutionOptions = getRoguelikeEvolutionOptions(getRunOwnedPlayers(run));

      if (evolutionOptions.length === 0) {
        const nextFloorIndex = run.floorIndex + 1;
        buildClearRewards(currentNode);
        setRun({
          ...run,
          draftShuffleTickets: run.draftShuffleTickets + 1,
          floorIndex: nextFloorIndex,
          stage: "node-result",
          activeNode: null,
          activeOpponentPlayerIds: null,
          nodeResult: {
            title: `${currentNode.title} complete`,
            detail: "No eligible version player was on your roster, so this node converted into 1 Draft Shuffle ticket instead. You can use it later to reroll a live five-player board.",
            passed: true,
          },
        });
        return;
      }

      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "evolution-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.battleMode === "starting-five-faceoff") {
      const hydratedRun = getHydratedRun(run, runNodes);
      setRun({
        ...run,
        roster: hydratedRun.roster,
        lineup: hydratedRun.lineup,
        activeNode: currentNode,
        activeOpponentPlayerIds:
          currentNode.opponentStarterPlayerIds ??
          currentNode.opponentPlayerIds ??
          generateFaceoffOpponentPlayerIds(
            getRunOwnedPlayers(run),
            nextChoiceSeed(run.seed, 200 + run.floorIndex * 17),
            currentNode.opponentAverageOverall,
            undefined,
          ),
        stage: "faceoff-setup",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "challenge") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "challenge-setup",
        nodeResult: null,
      });
    }
  };

  const draftChoice = (player: Player) => {
    if (!run) return;

    if (
      run.stage === "reward-draft" &&
      run.activeNode?.id !== STORE_TRADE_NODE.id &&
      run.roster.length >= 10
    ) {
      setRun({
        ...run,
        stage: "reward-replace-select",
        pendingRewardPlayer: player,
        nodeResult: {
          title: "Choose 1 player to replace",
          detail: `${player.name} is ready to join your run, but your roster is already full. Select 1 current player to swap out, or skip this pick and keep your team intact.`,
          passed: true,
        },
      });
      return;
    }

    const nextRoster = [...run.roster, player];
    const nextLineup =
      run.stage === "initial-draft"
        ? buildRoguelikeStarterLineup(nextRoster)
        : autoPromoteAddedPlayerIntoStartingLineup(assignPlayerToRoster(run.lineup, player).roster, player);
    const nextInitialPicks = run.initialPicks + 1;

    if (run.stage === "initial-draft") {
      if (nextInitialPicks < 2) {
        const initialDraftNode = run.activeNode;
        if (!initialDraftNode) return;
        const openingDraftPool = getNodePlayerPool(
          initialDraftNode,
          buildOpeningDraftPool(runPlayerUniverse),
          runPlayerUniverse,
        );
        const initialDraftChoiceTiers = getNodeChoiceTiers(initialDraftNode);
        const nextChoicesState = drawRunChoices(
          run,
          openingDraftPool,
          nextLineup
            .map((slot) => slot.player)
            .filter((owned): owned is Player => Boolean(owned)),
          5,
          nextChoiceSeed(run.seed, nextInitialPicks + 1),
          initialDraftChoiceTiers ? [...initialDraftChoiceTiers] : undefined,
          shouldStrictlyUseNodePool(initialDraftNode),
        );
        setRun({
          ...run,
          roster: nextRoster,
          lineup: nextLineup,
          initialPicks: nextInitialPicks,
          seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
          choices: nextChoicesState.choices,
        });
        return;
      }

      if (run.activeNode) {
        buildClearRewards(run.activeNode);
      }

      setRun({
        ...run,
        roster: nextRoster,
        lineup: nextLineup,
        initialPicks: nextInitialPicks,
        seenChoicePlayerIds: run.seenChoicePlayerIds ?? [],
        choices: [],
        stage: "ladder-overview",
        activeNode: null,
        activeOpponentPlayerIds: null,
        floorIndex: 1,
      });
      return;
    }

    if (run.stage === "reward-draft") {
      completeRewardDraftSelection(run, nextRoster, nextLineup);
    }
  };

  const skipRewardDraft = () => {
    if (!run || run.stage !== "reward-draft") return;

    if (
      (run.activeNode?.type === "trade" ||
        (run.activeNode?.type === "choice" && run.pendingChoiceSelection === "trade")) &&
      run.pendingTradeState
    ) {
      completeRewardDraftSelection(run, run.pendingTradeState.originalRoster, run.pendingTradeState.originalLineup);
      return;
    }

    completeRewardDraftSelection(run, run.roster, run.lineup);
  };

  const toggleRosterCutPlayer = (player: Player) => {
    if (!run || run.stage !== "roster-cut-select") return;

    const alreadySelected = run.selectedCutPlayerIds.includes(player.id);
    const nextSelectedCutPlayerIds = alreadySelected
      ? run.selectedCutPlayerIds.filter((playerId) => playerId !== player.id)
      : run.selectedCutPlayerIds.length < 2
        ? [...run.selectedCutPlayerIds, player.id]
        : run.selectedCutPlayerIds;

    setRun({
      ...run,
      selectedCutPlayerIds: nextSelectedCutPlayerIds,
    });
  };

  const confirmRosterCut = () => {
    if (!run || run.stage !== "roster-cut-select" || !run.activeNode) return;
    if (run.selectedCutPlayerIds.length !== 2) return;

    const cutPlayerIds = new Set(run.selectedCutPlayerIds);
    const nextRoster = getRunOwnedPlayers(run).filter((player) => !cutPlayerIds.has(player.id));
    const nextFloorIndex = run.floorIndex + 1;
    const nextLineup = hydrateRunLineup(run, nextRoster);
    const rewardedRun = awardLockerRoomCash(run, run.activeNode);

    setRun({
      ...rewardedRun,
      roster: nextRoster,
      lineup: nextLineup,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      selectedCutPlayerIds: [],
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: "You finalized your cuts and tightened the rotation for the next stop on the ladder.",
        passed: true,
      },
    });
  };

  const selectNaturalPositionPlayer = (player: Player) => {
    if (!run || run.stage !== "add-position-select") return;

    setRun({
      ...run,
      selectedNaturalPositionPlayerId: player.id,
      selectedNaturalPosition: null,
    });
  };

  const selectNaturalPosition = (position: Position) => {
    if (!run || run.stage !== "add-position-select") return;

    setRun({
      ...run,
      selectedNaturalPosition: position,
    });
  };

  const confirmNaturalPositionAdd = () => {
    if (!run || run.stage !== "add-position-select" || !run.activeNode) return;
    if (!run.selectedNaturalPositionPlayerId || !run.selectedNaturalPosition) return;
    const naturalPositionToAdd = run.selectedNaturalPosition;

    const nextRoster = run.roster.map((player) => {
      if (player.id !== run.selectedNaturalPositionPlayerId) return player;
      if (
        player.primaryPosition === naturalPositionToAdd ||
        player.secondaryPositions.includes(naturalPositionToAdd)
      ) {
        return player;
      }

      return {
        ...player,
        secondaryPositions: [...player.secondaryPositions, naturalPositionToAdd],
      };
      });
    const upgradedPlayer = nextRoster.find((player) => player.id === run.selectedNaturalPositionPlayerId);

    if (run.activeNode.id === LOCKER_ROOM_NEW_POSITION_NODE.id) {
      const price = getLockerRoomItemPrice("new-position-training");
      if (run.lockerRoomCash < price) return;

      setRun({
        ...run,
        roster: nextRoster,
        lineup: hydrateRunLineup(run, nextRoster),
        lockerRoomCash: run.lockerRoomCash - price,
        stage: "locker-room",
        activeNode: null,
        activeOpponentPlayerIds: null,
        selectedNaturalPositionPlayerId: null,
        selectedNaturalPosition: null,
        nodeResult: null,
        lockerRoomNotice: {
          title: "New Position Training Complete",
          detail: upgradedPlayer
            ? `${upgradedPlayer.name} can now naturally play ${naturalPositionToAdd} for the rest of this run.`
            : "A new natural position was added for the rest of this run.",
        },
      });
      return;
    }

    const nextFloorIndex = run.floorIndex + 1;

    setRun({
      ...run,
      roster: nextRoster,
      lineup: hydrateRunLineup(run, nextRoster),
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: upgradedPlayer
          ? `${upgradedPlayer.name} can now naturally play ${naturalPositionToAdd} for the rest of this run.`
          : "A new natural position was added for the rest of this run.",
        passed: true,
      },
    });
  };

  const assignAllStarPlayer = (
    slot: "dunkContest" | "threePointContest" | "skillsChallenge",
    player: Player,
  ) => {
    if (!run || run.stage !== "all-star-select") return;

    const nextAssignments = {
      ...run.allStarAssignments,
      [slot]: player.id,
    };

    const selectedIds = new Set(Object.values(nextAssignments).filter((value): value is string => Boolean(value)));
    if (selectedIds.size < Object.values(nextAssignments).filter(Boolean).length) {
      return;
    }

    setRun({
      ...run,
      allStarAssignments: nextAssignments,
    });
  };

  const runAllStarSaturday = () => {
    if (!run || run.stage !== "all-star-select" || !run.activeNode) return;
    const { dunkContest, threePointContest, skillsChallenge } = run.allStarAssignments;
    if (!dunkContest || !threePointContest || !skillsChallenge) return;
    const nextBonusBadges = [...(run.allStarBonusBadges ?? [])];
    const addBonusBadge = (
      playerId: string,
      badgeType: RoguelikeBonusBadgeAssignment["badgeType"],
    ) => {
      if (
        nextBonusBadges.some(
          (assignment) =>
            assignment.playerId === playerId && assignment.badgeType === badgeType,
        )
      ) {
        return;
      }

      nextBonusBadges.push({ playerId, badgeType });
    };

    addBonusBadge(dunkContest, "slasher");
    addBonusBadge(threePointContest, "sniper");
    addBonusBadge(skillsChallenge, "playmaker");
    const nextFloorIndex = run.floorIndex + 1;
    const dunkPlayer = run.roster.find((player) => player.id === dunkContest);
    const threePointPlayer = run.roster.find((player) => player.id === threePointContest);
    const skillsPlayer = run.roster.find((player) => player.id === skillsChallenge);

    setRun({
      ...run,
      allStarBonusBadges: nextBonusBadges,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      allStarAssignments: {
        dunkContest: null,
        threePointContest: null,
        skillsChallenge: null,
      },
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: `${dunkPlayer?.name ?? "Your dunk contestant"} earned a Slasher badge, ${threePointPlayer?.name ?? "your 3PT contestant"} earned a Sniper badge, and ${skillsPlayer?.name ?? "your skills contestant"} earned a Playmaker badge for the rest of this run.`,
        passed: true,
      },
    });
  };

  const openNode = () => {
    if (!run?.activeNode) return;

    const node = run.activeNode;

    if (node.type === "draft") {
      const nodeChoiceTiers = getNodeChoiceTiers(node);
      const nextChoicesState = drawRunChoices(
        run,
        getNodePlayerPool(node, run.availablePool, runPlayerUniverse),
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        nodeChoiceTiers ? [...nodeChoiceTiers] : undefined,
        shouldStrictlyUseNodePool(node),
      );
      setRun({
        ...run,
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        stage: "reward-draft",
        nodeResult: {
          title: getRewardDraftTitle(node),
          detail: getRewardDraftDescription(node),
          passed: true,
        },
      });
      return;
    }

    if (node.type === "training") {
      setRun({
        ...run,
        stage: "training-select",
        nodeResult: null,
      });
      return;
    }

    if (node.type === "choice") {
      setRun({
        ...run,
        pendingChoiceSelection: null,
        stage: "choice-select",
        nodeResult: null,
      });
      return;
    }

    if (node.type === "locker-room") {
      setRun({
        ...run,
        stage: "locker-room",
        nodeResult: null,
        lockerRoomNotice: null,
      });
      return;
    }

    if (node.type === "add-position") {
      setRun({
        ...run,
        stage: "add-position-select",
        selectedNaturalPositionPlayerId: null,
        selectedNaturalPosition: null,
        nodeResult: null,
      });
      return;
    }

    if (node.type === "all-star") {
      setRun({
        ...run,
        stage: "all-star-select",
        allStarAssignments: {
          dunkContest: null,
          threePointContest: null,
          skillsChallenge: null,
        },
        nodeResult: null,
      });
      return;
    }

    if (node.type === "roster-cut") {
      setRun({
        ...run,
        stage: "roster-cut-select",
        selectedCutPlayerIds: [],
        nodeResult: null,
      });
      return;
    }

    if (node.type === "trade") {
      setRun({
        ...run,
        stage: "trade-offer",
        nodeResult: null,
      });
      return;
    }

    if (node.type === "evolution") {
      const evolutionOptions = getRoguelikeEvolutionOptions(getRunOwnedPlayers(run));

      if (evolutionOptions.length === 0) {
        const nextFloorIndex = run.floorIndex + 1;
        buildClearRewards(node);
        setRun({
          ...run,
          draftShuffleTickets: run.draftShuffleTickets + 1,
          floorIndex: nextFloorIndex,
          stage: "node-result",
          activeNode: null,
          activeOpponentPlayerIds: null,
          nodeResult: {
            title: `${node.title} complete`,
            detail: "No eligible version player was on your roster, so this node converted into 1 Draft Shuffle ticket instead. You can use it later to reroll a live five-player board.",
            passed: true,
          },
        });
        return;
      }

      setRun({
        ...run,
        stage: "evolution-select",
        nodeResult: null,
      });
      return;
    }

    if (node.battleMode === "starting-five-faceoff") {
      const hydratedRun = getHydratedRun(run, runNodes);
      setRun({
        ...run,
        roster: hydratedRun.roster,
        lineup: hydratedRun.lineup,
        stage: "faceoff-setup",
        nodeResult: null,
      });
      return;
    }

    if (node.type === "challenge") {
      setRun({
        ...run,
        stage: "challenge-setup",
        nodeResult: null,
      });
      return;
    }

    const resolution = resolveRoguelikeNode(
      {
        ...node,
        opponentPlayerIds: run.activeOpponentPlayerIds ?? node.opponentPlayerIds,
      },
      getRunOwnedPlayers(run),
      run.lineup,
      run.trainedPlayerIds ?? [],
      run.allStarBonusBadges ?? [],
    );
    const remainingLives = resolution.passed
      ? run.lives
      : Math.max(0, run.lives - (node.livesPenalty ?? 1));

    if (!resolution.passed && remainingLives === 0) {
      const failureRewards = buildFailureRewards(run.floorIndex);
      setRun({
        ...run,
        lives: 0,
        stage: "run-over",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail:
            resolution.failedChecks.length > 0
              ? `You missed ${resolution.failedChecks.map((check) => `${check.metric} ${check.target}`).join(", ")} and the run collapsed.`
              : "The run ended here.",
          passed: false,
          failureRewards,
        },
      });
      return;
    }

    if (resolution.passed && node.type === "boss" && run.floorIndex === runNodes.length - 1) {
      buildClearRewards(node);
      setRun({
        ...run,
        stage: "run-cleared",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: "Run cleared",
          detail: "You beat The G.O.A.T.s and completed the full three-year Rogue run.",
          passed: true,
        },
      });
      return;
    }

    if (resolution.passed) {
      buildClearRewards(node);
      const rewardDraftPool = getRewardDraftPool(run, node, run.availablePool, runPlayerUniverse);
      const nextChoicesState = drawRunChoices(
        run,
        rewardDraftPool,
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        getNodeChoiceTiers(node) ? [...getNodeChoiceTiers(node)!] : undefined,
        shouldStrictlyUseNodePool(node),
      );
      setRun({
        ...run,
        lives: remainingLives,
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        stage: "reward-draft",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail:
            node.id === "act-one-faceoff" || node.id === "act-one-faceoff-current"
              ? `You beat ${node.opponentTeamName ?? "the challenge team"}. Bench 1 is now open, and you can choose 1 of 5 Ruby players for your run roster.`
              : node.id === "act-one-boss" || node.id === "act-one-boss-current"
                ? `You beat ${node.opponentTeamName ?? "the challenge team"}. Choose 1 of 3 Ruby version players now, each being the lowest version of a player who has a stronger version available later in the run.`
                : node.id === "frontcourt-wave" || node.id === "frontcourt-wave-current"
                  ? `Your selected starting five reached ${resolution.metrics.offense} Offense, and you can choose 1 of 5 Ruby players for your run roster.`
                : resolution.opponentPlayers.length > 0
                  ? `You beat ${node.opponentTeamName ?? "the challenge team"}. ${getRewardDraftDescription(node)}`
                  : resolution.failedChecks.length === 0
                  ? getRewardDraftDescription(node)
                  : getRewardDraftDescription(node),
          passed: true,
        },
      });
      return;
    }

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = runNodes[nextFloorIndex] ?? null;
    const failureRewards = nextNode ? null : buildFailureRewards(nextFloorIndex);
    setRun({
      ...run,
      lives: remainingLives,
      floorIndex: nextFloorIndex,
      stage: nextNode ? "ladder-overview" : "run-over",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${node.title} failed`,
        detail: resolution.opponentPlayers.length > 0
          ? `You lost to ${node.opponentTeamName ?? "the challenge team"} and dropped ${node.livesPenalty ?? 1} life${(node.livesPenalty ?? 1) > 1 ? "s" : ""}.`
          : resolution.failedChecks.length > 0
            ? `You lost ${node.livesPenalty ?? 1} life${(node.livesPenalty ?? 1) > 1 ? "s" : ""}. Missed checks: ${resolution.failedChecks
                .map((check) => `${check.metric} ${check.target}`)
                .join(", ")}.`
            : `You lost ${node.livesPenalty ?? 1} life.`,
        passed: false,
        failureRewards,
      },
    });
  };

  const startLineupChallenge = () => {
    if (!run?.activeNode) return;

    const node = run.activeNode;
    const challengeLineup = run.lineup.slice(0, 5).map((slot) => ({ ...slot }));
    const resolution = resolveRoguelikeNode(
      node,
      getRunOwnedPlayers(run),
      challengeLineup,
      run.trainedPlayerIds ?? [],
      run.allStarBonusBadges ?? [],
    );
    const ownedPlayerIds = getRunOwnedPlayers(run).map((player) => player.id);
    const challengeMetric = node.checks?.[0]?.metric ?? "offense";
    const challengeMetricLabel = getChallengeMetricLabel(challengeMetric);
    const challengeScore =
      challengeMetric === "offense"
        ? getAverageAdjustedOffense(challengeLineup, ownedPlayerIds, run.trainedPlayerIds ?? [])
        : challengeMetric === "rebounding"
          ? getAverageAdjustedRebounding(challengeLineup, ownedPlayerIds, run.trainedPlayerIds ?? [])
          : resolution.metrics[challengeMetric];
    const passed = challengeScore >= (node.checks?.[0]?.target ?? 0);

    if (!passed) {
      const failureRewards = buildFailureRewards(run.floorIndex);
      setRun({
        ...run,
        lives: 0,
        stage: "run-over",
        activeNode: node,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail: `Your starting five posted ${challengeScore} ${challengeMetricLabel}, short of the ${node.checks?.[0]?.target ?? 0} target. The run ends here.`,
          passed: false,
          challengeResult: {
            metric: challengeMetric,
            metricLabel: challengeMetricLabel,
            target: node.checks?.[0]?.target ?? 0,
            score: challengeScore,
            passed: false,
          },
          failureRewards,
        },
        failureReviewStage: "challenge-setup",
      });
      return;
    }

    if ((node.draftShuffleReward ?? 0) > 0) {
      const nextFloorIndex = run.floorIndex + 1;
      const rewardAmount = node.draftShuffleReward ?? 0;
      buildClearRewards(node);
      const rewardedRun = awardLockerRoomCash(run, node);
      setRun({
        ...rewardedRun,
        draftShuffleTickets: run.draftShuffleTickets + rewardAmount,
        floorIndex: nextFloorIndex,
        stage: "node-result",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail: `Your starting five reached ${challengeScore} ${challengeMetricLabel}. You earned ${rewardAmount} Draft Shuffle ticket${rewardAmount > 1 ? "s" : ""}, which let${rewardAmount > 1 ? "" : "s"} you reroll any visible five-player draft board later in this run.`,
          passed: true,
          challengeResult: {
            metric: challengeMetric,
            metricLabel: challengeMetricLabel,
            target: node.checks?.[0]?.target ?? 0,
            score: challengeScore,
            passed: true,
          },
        },
        failureReviewStage: null,
      });
      return;
    }

    if (passed) {
      buildClearRewards(node);
      const rewardedRun = awardLockerRoomCash(run, node);
      const rewardDraftPool = getRewardDraftPool(run, node, rewardedRun.availablePool, runPlayerUniverse);
      const nodeChoiceTiers = getNodeChoiceTiers(node);
      const nextChoicesState = drawRunChoices(
        rewardedRun,
        rewardDraftPool,
        getRunOwnedPlayers(rewardedRun),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        nodeChoiceTiers ? [...nodeChoiceTiers] : undefined,
        shouldStrictlyUseNodePool(node),
      );
      const rewardTierLabel =
        nodeChoiceTiers?.length === 2
          ? `${nodeChoiceTiers[0]} or ${nodeChoiceTiers[1]} tier`
          : nodeChoiceTiers?.length === 1
            ? `${nodeChoiceTiers[0]}-tier`
            : "reward";
      setRun({
        ...rewardedRun,
        lives: rewardedRun.lives,
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        stage: "reward-draft",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail: `Your selected starting five reached ${challengeScore} ${challengeMetricLabel}. Choose 1 of ${node.rewardChoices} ${rewardTierLabel} players for your run roster.`,
          passed: true,
          challengeResult: {
            metric: challengeMetric,
            metricLabel: challengeMetricLabel,
            target: node.checks?.[0]?.target ?? 0,
            score: challengeScore,
            passed: true,
          },
        },
        failureReviewStage: null,
      });
      return;
    }
  };

  const startFaceoffGame = () => {
    if (!run?.activeNode) return;

    const node = {
      ...run.activeNode,
      opponentPlayerIds: run.activeOpponentPlayerIds ?? run.activeNode.opponentPlayerIds,
    };
    const resolution = resolveRoguelikeNode(
      node,
      getRunOwnedPlayers(run),
      run.lineup,
      run.trainedPlayerIds ?? [],
      run.allStarBonusBadges ?? [],
    );
    const faceoffResult = resolution.faceoffResult;
    if (!faceoffResult) return;

    const edge =
      Math.round((faceoffResult.userTeamWinProbability - faceoffResult.opponentTeamWinProbability) * 10) / 10;

    setRun({
      ...run,
      stage: "faceoff-game",
      nodeResult: {
        title: resolution.passed ? `${node.title} cleared` : `${node.title} failed`,
        detail: resolution.passed
          ? `Your starters posted a ${faceoffResult.userTeamWinProbability}% team edge against ${node.opponentTeamName ?? "the boss team"} and won the faceoff.`
          : `Your starters finished at ${faceoffResult.userTeamWinProbability}% against ${faceoffResult.opponentTeamWinProbability}% for ${node.opponentTeamName ?? "the boss team"}. ${edge < 0 ? "The boss lineup won the faceoff." : "The matchup was too close to swing your way."}`,
        passed: resolution.passed,
        faceoffResult,
        failureRewards:
          !resolution.passed && node.eliminationOnLoss
            ? previewFailureRewards(run.floorIndex)
            : null,
      },
    });
  };

  const continueAfterFaceoff = () => {
    if (!run?.activeNode || run.stage !== "faceoff-game" || !run.nodeResult) return;

    const node = run.activeNode;
    const passed = Boolean(run.nodeResult.passed);

    if (!passed) {
      if (node.eliminationOnLoss) {
        const failureRewards = run.nodeResult.failureRewards ?? buildFailureRewards(run.floorIndex);
        if (run.nodeResult.failureRewards) {
          onAwardFailureRewards(run.nodeResult.failureRewards.prestigeXpAward);
        }
        setRun({
          ...run,
          stage: "run-over",
          activeNode: null,
          activeOpponentPlayerIds: null,
          nodeResult: {
            title: `${node.title} failed`,
            detail: `You lost the faceoff to ${node.opponentTeamName ?? "the boss team"}, so the run ends here.`,
            passed: false,
            faceoffResult: run.nodeResult.faceoffResult ?? null,
            failureRewards,
          },
        });
        return;
      }

      const remainingLives = Math.max(0, run.lives - (node.livesPenalty ?? 1));
      const nextFloorIndex = run.floorIndex + 1;
      const nextNode = runNodes[nextFloorIndex] ?? null;
      const failureRewards = nextNode ? null : buildFailureRewards(nextFloorIndex);
      setRun({
        ...run,
        lives: remainingLives,
        floorIndex: nextFloorIndex,
        stage: nextNode ? "ladder-overview" : "run-over",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail: `You lost ${node.livesPenalty ?? 1} life${(node.livesPenalty ?? 1) > 1 ? "s" : ""} in the faceoff.`,
          passed: false,
          failureRewards,
        },
      });
      return;
    }

    if (node.id === "hall-of-fame-finals" || run.floorIndex === runNodes.length - 1) {
      buildClearRewards(node);
      const rewardedRun = awardLockerRoomCash(run, node);
      setRun({
        ...rewardedRun,
        stage: "run-cleared",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: "Run cleared",
          detail: "You beat The G.O.A.T.s and completed the full three-year Rogue run.",
          passed: true,
          faceoffResult: run.nodeResult.faceoffResult ?? null,
        },
      });
      return;
    }

    if ((node.draftShuffleReward ?? 0) > 0 && node.rewardChoices === 0) {
      buildClearRewards(node);
      const rewardAmount = node.draftShuffleReward ?? 0;
      const nextFloorIndex = run.floorIndex + 1;
      const rewardedRun = awardLockerRoomCash(run, node);
      setRun({
        ...rewardedRun,
        draftShuffleTickets: run.draftShuffleTickets + rewardAmount,
        floorIndex: nextFloorIndex,
        stage: "node-result",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail: `You beat ${node.opponentTeamName ?? "the boss team"} and earned ${rewardAmount} Draft Shuffle ticket${rewardAmount > 1 ? "s" : ""}. Your next node is ready.`,
          passed: true,
          faceoffResult: run.nodeResult.faceoffResult ?? null,
        },
      });
      return;
    }

    const rewardDraftPool = getRewardDraftPool(run, node, run.availablePool, runPlayerUniverse);
    buildClearRewards(node);
    const rewardedRun = awardLockerRoomCash(run, node);
    const nextChoicesState = drawRunChoices(
      rewardedRun,
      rewardDraftPool,
      getRunOwnedPlayers(rewardedRun),
      node.rewardChoices,
      nextChoiceSeed(run.seed, run.floorIndex + 30),
      getNodeChoiceTiers(node) ? [...getNodeChoiceTiers(node)!] : undefined,
      shouldStrictlyUseNodePool(node),
    );
    setRun({
      ...rewardedRun,
      seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
      choices: nextChoicesState.choices,
      stage: "reward-draft",
      activeNode: node,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${node.title} cleared`,
        detail:
          node.id === "act-one-faceoff" || node.id === "act-one-faceoff-current"
              ? `You beat ${node.opponentTeamName ?? "the boss team"}. Bench 1 is now open, and you can choose 1 of 5 Ruby players for your run roster.`
              : node.id === "act-one-boss" || node.id === "act-one-boss-current"
                ? `You beat ${node.opponentTeamName ?? "the boss team"}. Choose 1 of 3 Ruby version players now, then look for a future evolution node to upgrade that player into a higher-rated version.`
              : `You beat ${node.opponentTeamName ?? "the boss team"}. ${getRewardDraftDescription(node)}`,
          passed: true,
        },
    });
  };

  const continueAfterResult = () => {
    if (!run) return;
    const nextNode = runNodes[run.floorIndex] ?? null;

    setRun({
      ...run,
      stage: nextNode ? "ladder-overview" : "run-over",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
    });
  };

  const openStoreTrainingCamp = () => {
    if (!run || ownedTrainingCampTickets <= 0) return;

    const hydratedRun = getHydratedRun(run, runNodes);
    setRun({
      ...hydratedRun,
      stage: "training-select",
      activeNode: STORE_TRAINING_NODE,
      nodeResult: null,
      utilityReturnState: {
        stage: hydratedRun.stage,
        activeNode: hydratedRun.activeNode,
        activeOpponentPlayerIds: hydratedRun.activeOpponentPlayerIds,
        nodeResult: hydratedRun.nodeResult,
      },
    });
  };

  const openStoreTradePhone = () => {
    if (!run || ownedTradePhones <= 0) return;

    const hydratedRun = getHydratedRun(run, runNodes);
    setRun({
      ...hydratedRun,
      stage: "trade-offer",
      activeNode: STORE_TRADE_NODE,
      nodeResult: null,
      utilityReturnState: {
        stage: hydratedRun.stage,
        activeNode: hydratedRun.activeNode,
        activeOpponentPlayerIds: hydratedRun.activeOpponentPlayerIds,
        nodeResult: hydratedRun.nodeResult,
      },
    });
  };

  const openLockerRoomSelection = (node: RoguelikeNode) => {
    if (!run || run.stage !== "locker-room") return;
    const price = getLockerRoomItemPrice(
      node.id === LOCKER_ROOM_TRAINING_NODE.id
        ? "training-camp-ticket"
        : node.id === LOCKER_ROOM_PRACTICE_SHOOTING_NODE.id
          ? "practice-shooting"
          : node.id === LOCKER_ROOM_PRACTICE_REBOUNDING_NODE.id
            ? "practice-rebounding"
            : node.id === LOCKER_ROOM_PRACTICE_DEFENSE_NODE.id
              ? "practice-defense"
              : node.id === LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE.id
                ? "practice-playmaking"
                : node.id === LOCKER_ROOM_PRACTICE_OFFENSE_NODE.id
                  ? "practice-offense"
                  : "new-position-training",
    );
    if (run.lockerRoomCash < price) return;

    setRun({
      ...run,
      stage: node.type === "add-position" ? "add-position-select" : "training-select",
      activeNode: node,
      activeOpponentPlayerIds: null,
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      nodeResult: null,
      lockerRoomNotice: null,
      utilityReturnState:
        !run.utilityReturnState && run.activeNode?.type === "locker-room"
          ? {
              stage: "locker-room",
              activeNode: run.activeNode,
              activeOpponentPlayerIds: null,
              nodeResult: null,
            }
          : run.utilityReturnState,
    });
  };

  const buyLockerRoomAdvancedScouting = () => {
    if (!run || run.stage !== "locker-room") return;
    const nextBossNode = getUpcomingBossNodeForLockerRoom(run, runNodes);
    if (!nextBossNode) return;
    const price = getLockerRoomItemPrice("advanced-scouting");
    if (run.lockerRoomCash < price || run.scoutedBossNodeIds.includes(nextBossNode.id)) return;

    setRun({
      ...run,
      lockerRoomCash: run.lockerRoomCash - price,
      scoutedBossNodeIds: [...run.scoutedBossNodeIds, nextBossNode.id],
      lockerRoomNotice: {
        title: "Scouting Report Ready",
        detail: `You can now preview ${nextBossNode.title} before you step into that boss fight.`,
      },
    });
  };

  const buyLockerRoomDraftShuffleTicket = () => {
    if (!run || run.stage !== "locker-room") return;
    const price = getLockerRoomItemPrice("draft-shuffle-ticket");
    if (run.lockerRoomCash < price) return;

    setRun({
      ...run,
      lockerRoomCash: run.lockerRoomCash - price,
      draftShuffleTickets: run.draftShuffleTickets + 1,
      lockerRoomNotice: {
        title: "Draft Shuffle Ticket Added",
        detail: "You banked 1 extra Draft Shuffle ticket for this run. Use it on any live five-player board when the timing is right.",
      },
    });
  };

  const sendPlayerToTraining = (player: Player) => {
    if (!run?.activeNode || run.stage !== "training-select") return;

    if (run.activeNode.id === STORE_TRAINING_NODE.id) {
      if (!onUseTrainingCampTicket()) return;

      const trainedPlayerIds = [...run.trainedPlayerIds, player.id];

      setRun(
        restoreUtilityReturnState({
          ...run,
          trainedPlayerIds,
        }),
      );
      return;
    }

    if (run.activeNode.id === LOCKER_ROOM_TRAINING_NODE.id) {
      const price = getLockerRoomItemPrice("training-camp-ticket");
      if (run.lockerRoomCash < price) return;

      const trainedPlayerIds = [...run.trainedPlayerIds, player.id];
      const trainingCount = trainedPlayerIds.filter((trainedPlayerId) => trainedPlayerId === player.id).length;

      setRun({
        ...run,
        trainedPlayerIds,
        lockerRoomCash: run.lockerRoomCash - price,
        stage: "locker-room",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: null,
        lockerRoomNotice: {
          title: "Private Training Complete",
          detail: `${player.name} gained +1 OVR and now has +${trainingCount} total training applied for the rest of this run.`,
        },
      });
      return;
    }

    if (
      run.activeNode.id === LOCKER_ROOM_PRACTICE_SHOOTING_NODE.id ||
      run.activeNode.id === LOCKER_ROOM_PRACTICE_REBOUNDING_NODE.id ||
      run.activeNode.id === LOCKER_ROOM_PRACTICE_DEFENSE_NODE.id ||
      run.activeNode.id === LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE.id ||
      run.activeNode.id === LOCKER_ROOM_PRACTICE_OFFENSE_NODE.id
    ) {
      const itemId =
        run.activeNode.id === LOCKER_ROOM_PRACTICE_SHOOTING_NODE.id
          ? "practice-shooting"
          : run.activeNode.id === LOCKER_ROOM_PRACTICE_REBOUNDING_NODE.id
            ? "practice-rebounding"
            : run.activeNode.id === LOCKER_ROOM_PRACTICE_DEFENSE_NODE.id
              ? "practice-defense"
              : run.activeNode.id === LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE.id
                ? "practice-playmaking"
                : "practice-offense";
      const price = getLockerRoomItemPrice(itemId);
      if (run.lockerRoomCash < price) return;
      const badgeType = getLockerRoomBadgeType(run.activeNode.id);
      if (!badgeType) return;

      const existingBadges = getRoguelikePlayerTypeBadges(player, run.allStarBonusBadges ?? []);
      if (existingBadges.some((badge) => badge.type === badgeType)) {
        const duplicateBadgeLabel = existingBadges.find((badge) => badge.type === badgeType)?.label ?? "That badge";
        setRun({
          ...run,
          stage: "locker-room",
          activeNode: null,
          activeOpponentPlayerIds: null,
          nodeResult: null,
          lockerRoomNotice: {
            title: "Badge Already Active",
            detail: `${player.name} already has the ${duplicateBadgeLabel} badge in this run, so no cash was spent.`,
          },
        });
        return;
      }

      const nextBonusBadges = [
        ...(run.allStarBonusBadges ?? []),
        {
          playerId: player.id,
          badgeType,
        },
      ];
      const badgeLabel =
        getRoguelikePlayerTypeBadges(player, nextBonusBadges).find((badge) => badge.type === badgeType)?.label ??
        "bonus";

      setRun({
        ...run,
        allStarBonusBadges: nextBonusBadges,
        lockerRoomCash: run.lockerRoomCash - price,
        stage: "locker-room",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: null,
        lockerRoomNotice: {
          title: `${badgeLabel} Badge Added`,
          detail: `${player.name} gained the ${badgeLabel} badge for the rest of this run.`,
        },
      });
      return;
    }

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = runNodes[nextFloorIndex] ?? null;
    const trainedPlayerIds = [...run.trainedPlayerIds, player.id];
    const trainingCount = trainedPlayerIds.filter((trainedPlayerId) => trainedPlayerId === player.id).length;
    buildClearRewards(run.activeNode);

    setRun({
      ...run,
      trainedPlayerIds,
      pendingChoiceSelection: null,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: "Training Day complete",
        detail: `${player.name} went to training and now has +${trainingCount} total training OVR applied for the rest of this run. ${nextNode ? "Your next node is ready." : ""}`,
        passed: true,
      },
    });
  };

  const evolveRunPlayer = (player: Player) => {
    if (!run?.activeNode || run.stage !== "evolution-select") return;

    const evolution = getRoguelikeEvolutionOptions(getRunOwnedPlayers(run)).find(
      (option) => option.currentPlayer.id === player.id,
    );
    if (!evolution) return;

    const nextRoster = run.roster.map((owned) =>
      owned.id === evolution.currentPlayer.id ? evolution.nextPlayer : owned,
    );
    const nextLineup = run.lineup.map((slot) =>
      slot.player?.id === evolution.currentPlayer.id
        ? { ...slot, player: evolution.nextPlayer }
        : { ...slot },
    );
    const nextFloorIndex = run.floorIndex + 1;
    buildClearRewards(run.activeNode);

    setRun({
      ...run,
      roster: nextRoster,
      lineup: nextLineup,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: `${evolution.currentPlayer.name} evolved into ${evolution.nextPlayer.name}. The upgraded version is now locked into your run for the rest of the climb.`,
        passed: true,
      },
    });
  };

  const declineTradeDeadline = () => {
    if (!run?.activeNode || run.stage !== "trade-offer") return;

    if (run.activeNode.id === STORE_TRADE_NODE.id) {
      setRun(restoreUtilityReturnState(run));
      return;
    }

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = runNodes[nextFloorIndex] ?? null;
    buildClearRewards(run.activeNode);

    setRun({
      ...run,
      pendingChoiceSelection: null,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: `You stood pat at the deadline and kept your roster intact. ${nextNode ? "The next node is ready." : ""}`,
        passed: true,
      },
    });
  };

  const chooseRoguelikePath = (selection: "training" | "trade") => {
    if (!run?.activeNode || run.stage !== "choice-select") return;

    setRun({
      ...run,
      pendingChoiceSelection: selection,
      stage: selection === "training" ? "training-select" : "trade-offer",
      nodeResult: null,
    });
  };

  const openTradeSelection = () => {
    if (!run?.activeNode || run.stage !== "trade-offer") return;

    setRun({
      ...run,
      stage: "trade-select",
      nodeResult: null,
    });
  };

  const useDraftShuffleTicket = () => {
    if (!run || run.draftShuffleTickets <= 0) return;
    if (run.stage !== "initial-draft" && run.stage !== "reward-draft") return;
    if (run.choices.length === 0) return;

    const sourceNode = run.activeNode ?? runNodes[run.floorIndex] ?? null;
    const rerollPool =
      run.stage === "initial-draft"
        ? getNodePlayerPool(sourceNode, buildOpeningDraftPool(runPlayerUniverse), runPlayerUniverse)
        : sourceNode
          ? getRewardDraftPool(run, sourceNode, run.availablePool, runPlayerUniverse)
          : run.availablePool;
    const rerollRoster =
      run.stage === "initial-draft"
        ? run.lineup.map((slot) => slot.player).filter((player): player is Player => Boolean(player))
        : getRunOwnedPlayers(run);
    const allowedTiers =
      run.stage === "initial-draft"
        ? sourceNode && getNodeChoiceTiers(sourceNode)
          ? [...getNodeChoiceTiers(sourceNode)!]
          : undefined
        : sourceNode && getNodeChoiceTiers(sourceNode)
          ? [...getNodeChoiceTiers(sourceNode)!]
          : undefined;
    const nextChoicesState = drawRunChoices(
      run,
      rerollPool,
      rerollRoster,
      5,
      nextChoiceSeed(run.seed, 600 + run.floorIndex * 31 + run.draftShuffleTickets * 7),
      allowedTiers,
      shouldStrictlyUseNodePool(sourceNode),
    );

    setRun({
      ...run,
      draftShuffleTickets: Math.max(0, run.draftShuffleTickets - 1),
      seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
      choices: nextChoicesState.choices,
    });
  };

  const tradePlayerForReplacement = (player: Player) => {
    if (!run?.activeNode || run.stage !== "trade-select") return;

    if (run.activeNode.id === STORE_TRADE_NODE.id && !onUseTradePhone()) return;

    const hydratedRun = getHydratedRun(run, runNodes);
    const baseTradedPlayer =
      hydratedRun.roster.find((owned) => owned.id === player.id) ??
      hydratedRun.lineup
        .map((slot) => slot.player)
        .find((owned): owned is Player => owned?.id === player.id) ??
      player;
    const tradedDisplayPlayer = getRunDisplayPlayer(
      baseTradedPlayer,
      getRunOwnedPlayers(run).map((entry) => entry.id),
      run.trainedPlayerIds ?? [],
    );
    const tradedOverall = tradedDisplayPlayer.overall;
    const nextRoster = hydratedRun.roster.filter((owned) => owned.id !== player.id);
    const nextLineup = hydratedRun.lineup.map((slot) =>
      slot.player?.id === player.id
          ? { ...slot, player: null }
          : { ...slot },
    );
    const tradeReplacementPool = getSimilarCaliberTradePool(
      run.activeNode,
      run.availablePool,
      runPlayerUniverse,
      tradedOverall,
      nextRoster,
      player.id,
    );
    const replacementChoiceCount = getTradeReplacementChoiceCount(
      run.activeNode,
      run.pendingChoiceSelection,
    );
    let nextChoices = drawTradeReplacementChoices(
      tradeReplacementPool,
      nextRoster,
      replacementChoiceCount,
      nextChoiceSeed(run.seed, run.floorIndex + 30),
      tradedOverall,
    );

    if (nextChoices.length < replacementChoiceCount) {
      nextChoices = drawTradeReplacementChoices(
        tradeReplacementPool,
        nextRoster,
        replacementChoiceCount,
        nextChoiceSeed(run.seed, run.floorIndex + 31),
        tradedOverall,
      );
    }

    const nextChoiceIds = new Set([...(run.seenChoicePlayerIds ?? []), ...nextChoices.map((choice) => choice.id)]);
    const replacementFloor = tradedOverall - 1;
    const replacementCeiling = tradedOverall + 1;

    setRun({
      ...run,
      roster: nextRoster,
      lineup: nextLineup,
      seenChoicePlayerIds: Array.from(nextChoiceIds),
      choices: nextChoices,
        stage: "reward-draft",
        pendingTradeState: {
          outgoingPlayerId: player.id,
          outgoingPlayerOverall: tradedOverall,
          originalRoster: hydratedRun.roster.map((owned) => ({ ...owned })),
          originalLineup: hydratedRun.lineup.map((slot) => ({ ...slot })),
        },
        nodeResult: {
          title: run.activeNode.title,
          detail: `${player.name} is on the trade block. Choose 1 of 5 similar-caliber replacement players rated between ${replacementFloor} and ${replacementCeiling} OVR, or skip this board to keep ${player.name} on your team.`,
          passed: true,
        },
      });
  };

  const replaceRosterPlayerWithReward = (playerToReplace: Player) => {
    if (!run || run.stage !== "reward-replace-select" || !run.pendingRewardPlayer) return;

    const incomingPlayer = run.pendingRewardPlayer;
    const nextRoster = [...run.roster.filter((owned) => owned.id !== playerToReplace.id), incomingPlayer];
    const lineupWithoutOutgoing = run.lineup.map((slot) =>
      slot.player?.id === playerToReplace.id
        ? { ...slot, player: null }
        : { ...slot },
    );
    const outgoingSlotIndex = run.lineup.findIndex((slot) => slot.player?.id === playerToReplace.id);
    const nextLineup =
      outgoingSlotIndex >= 0
        ? lineupWithoutOutgoing.map((slot, index) =>
            index === outgoingSlotIndex ? { ...slot, player: incomingPlayer } : { ...slot },
          )
        : autoPromoteAddedPlayerIntoStartingLineup(
            assignPlayerToRoster(lineupWithoutOutgoing, incomingPlayer).roster,
            incomingPlayer,
          );

    completeRewardDraftSelection(run, nextRoster, nextLineup);
  };

  const skipRewardDraftReplacement = () => {
    if (!run || run.stage !== "reward-replace-select") return;
    completeRewardDraftSelection(run, run.roster, run.lineup);
  };

  const moveRunPlayer = (fromIndex: number, toIndex: number) => {
    setRun((currentRun) => {
      if (!currentRun || fromIndex === toIndex) return currentRun;

      const hydratedRun = getHydratedRun(currentRun, runNodes);
      const nextLineup = hydratedRun.lineup.map((slot) => ({ ...slot }));
      [nextLineup[fromIndex].player, nextLineup[toIndex].player] = [
        nextLineup[toIndex].player,
        nextLineup[fromIndex].player,
      ];

      return {
        ...hydratedRun,
        lineup: nextLineup,
      };
    });
  };

  const handleRosterPointerDown = (
    index: number,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!run) return;
    const interactiveRun = getHydratedRun(run, runNodes);
    if (!interactiveRun.lineup[index]?.player) return;
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    setDraggingIndex(index);
    setDropTargetIndex(null);
    setDragPointer({
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!run) {
      window.localStorage.removeItem(ROGUELIKE_STORAGE_KEY);
      window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ROGUELIKE_STORAGE_KEY, JSON.stringify(run));
  }, [run]);

  useEffect(() => {
    const shouldOpen =
      run?.stage === "faceoff-game" ||
      run?.stage === "node-result" ||
      (run?.stage === "reward-draft" && Boolean(run?.nodeResult?.challengeResult)) ||
      run?.stage === "run-over" ||
      run?.stage === "run-cleared";

    setShowOutcomeOverlay(Boolean(shouldOpen));
  }, [run?.stage, run?.nodeResult?.title, run?.nodeResult?.detail]);

  useEffect(() => {
    setShowChallengeBreakdown(false);
  }, [run?.stage, run?.floorIndex, run?.activeNode?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !run) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [run?.stage, run?.floorIndex, run?.activeNode?.id, run?.nodeResult?.title]);

  useEffect(() => {
    if (typeof window === "undefined" || run?.stage !== "ladder-overview") return;
    if (!currentLadderNodeRef.current) return;

    const rafId = window.requestAnimationFrame(() => {
      const targetTop = currentLadderNodeRef.current?.getBoundingClientRect().top;
      if (targetTop === undefined) return;

      window.scrollTo({
        top: Math.max(0, targetTop + window.scrollY - 110),
        left: 0,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [run?.stage, run?.floorIndex]);

  useEffect(() => {
    if (!run || run.stage !== "reward-draft") return;

    const sourceNode = run.activeNode ?? runNodes[run.floorIndex] ?? null;
    if (!sourceNode) return;

    if (!run.activeNode) {
      setRun({
        ...run,
        activeNode: sourceNode,
      });
      return;
    }

    if (run.choices.length > 0 || sourceNode.rewardChoices <= 0) return;

    const repairedPool =
      (sourceNode.type === "trade" ||
        (sourceNode.type === "choice" && run.pendingChoiceSelection === "trade")) &&
      run.pendingTradeState
        ? getSimilarCaliberTradePool(
            sourceNode,
            run.availablePool,
            runPlayerUniverse,
            run.pendingTradeState.outgoingPlayerOverall,
            getRunOwnedPlayers(run),
            run.pendingTradeState.outgoingPlayerId,
          )
        : getRewardDraftPool(run, sourceNode, run.availablePool, runPlayerUniverse);

    const repairedChoicesState =
      (sourceNode.type === "trade" ||
        (sourceNode.type === "choice" && run.pendingChoiceSelection === "trade")) &&
      run.pendingTradeState
        ? (() => {
            const repairedTradeChoices = drawTradeReplacementChoices(
              repairedPool,
              getRunOwnedPlayers(run),
              getTradeReplacementChoiceCount(sourceNode, run.pendingChoiceSelection),
              nextChoiceSeed(run.seed, 900 + run.floorIndex * 37),
              run.pendingTradeState.outgoingPlayerOverall,
            );

            return {
              choices: repairedTradeChoices,
              seenChoicePlayerIds: Array.from(
                new Set([
                  ...(run.seenChoicePlayerIds ?? []),
                  ...repairedTradeChoices.map((player) => player.id),
                ]),
              ),
            };
          })()
        : drawRunChoices(
            run,
            repairedPool,
            getRunOwnedPlayers(run),
            sourceNode.rewardChoices,
            nextChoiceSeed(run.seed, 900 + run.floorIndex * 37),
            getNodeChoiceTiers(sourceNode) ? [...getNodeChoiceTiers(sourceNode)!] : undefined,
            shouldStrictlyUseNodePool(sourceNode),
          );

    if (repairedChoicesState.choices.length === 0) return;

    setRun({
      ...run,
      activeNode: sourceNode,
      seenChoicePlayerIds: repairedChoicesState.seenChoicePlayerIds,
      choices: repairedChoicesState.choices,
    });
  }, [run]);

  useEffect(() => {
    if (!run && showPackSelectionHub) {
      setShowPackSelectionHub(false);
      setParkedRunState(false);
    }
  }, [run, showPackSelectionHub]);

  useEffect(() => {
    if (draggingIndex === null || dragPointer === null) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousWebkitUserSelect = document.body.style.webkitUserSelect;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      setDragPointer((current) =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
            }
          : current,
      );

      const hovered = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-rogue-slot-index]");
      const nextTarget = hovered?.getAttribute("data-rogue-slot-index");
      setDropTargetIndex(nextTarget ? Number(nextTarget) : null);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const hovered = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-rogue-slot-index]");
      const nextTarget = hovered?.getAttribute("data-rogue-slot-index");
      if (nextTarget) {
        const targetIndex = Number(nextTarget);
        if (targetIndex !== draggingIndex) {
          moveRunPlayer(draggingIndex, targetIndex);
        }
      }

      setDraggingIndex(null);
      setDropTargetIndex(null);
      setDragPointer(null);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.webkitUserSelect = previousWebkitUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragPointer, draggingIndex]);

  const handleBackToHome = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ROGUELIKE_STORAGE_KEY);
      window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
    }
    setRun(null);
    setShowRunSettingsScreen(true);
    setShowPackSelectionHub(false);
    onBackToHome();
  };

  const leaveRun = () => {
    if (!run) {
      onLeaveRun();
      return;
    }

    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setShowRunSettingsScreen(true);
    setShowPackSelectionHub(true);
    setParkedRunState(true);
    onLeaveRun();
  };

  const resumeRun = () => {
    if (!run) return;

    setShowRunSettingsScreen(false);
    setShowPackSelectionHub(false);
    setParkedRunState(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const abortRun = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ROGUELIKE_STORAGE_KEY);
      window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
    }
    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setShowRunSettingsScreen(true);
    setShowPackSelectionHub(false);
    setRun(null);
  };

  const backToRunLadder = () => {
    if (!run) return;

    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setRun({
      ...run,
      stage: "ladder-overview",
      selectedCutPlayerIds: [],
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      pendingChoiceSelection: null,
      allStarAssignments: {
        dunkContest: null,
        threePointContest: null,
        skillsChallenge: null,
      },
      utilityReturnState: null,
      failureReviewStage: null,
    });
  };

  const reviewFailedChallenge = () => {
    if (!run || run.stage !== "run-over" || run.failureReviewStage !== "challenge-setup") return;
    setShowOutcomeOverlay(false);
    setShowChallengeBreakdown(true);
  };
  const openChallengeResults = () => {
    setShowOutcomeOverlay(false);
    setShowChallengeBreakdown(true);
  };
  const updateRunSetting = <Key extends keyof RoguelikeRunSettings>(
    key: Key,
    value: RoguelikeRunSettings[Key],
  ) => {
    setSelectedRunSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  };
  const continueToStarterPacks = () => {
    setShowRunSettingsScreen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };
  const backToRunSettings = () => {
    setShowRunSettingsScreen(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };
  const activeRogueStar = getPlayerById(activeRogueStarId);

  if (showRunSettingsScreen) {
    return (
      <section className="space-y-4">
        <div className="glass-panel rounded-[34px] p-5 shadow-card lg:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <div>
              <div className="inline-flex rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-3 py-1 text-xs tracking-[0.18em] text-fuchsia-100">
                NBA Rogue Mode
              </div>
              <h1 className="mt-2.5 max-w-4xl font-display text-[3.1rem] leading-[0.95] text-white lg:text-[4rem]">
                Run Settings
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200/85">
                Set the rules for this climb before you open a starter pack. These choices shape the player pool, the ladder, and the overall pressure of the run.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-300/80">
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  {runPlayerUniverse.length} eligible players
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  {runNodes.length} nodes in ladder
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  Difficulty: {selectedRunSettings.difficulty}
                </span>
              </div>
            </div>

            {run ? (
              <div className="rounded-[24px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(10,49,41,0.96),rgba(14,80,65,0.9),rgba(10,25,44,0.94))] px-5 py-4 xl:self-start">
                <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/78">Saved Run</div>
                <div className="mt-1 text-[1.15rem] font-semibold text-white">Resume Rogue Run</div>
                <div className="mt-1.5 text-sm leading-6 text-emerald-50/82">
                  Your unfinished climb is still parked and ready.
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-emerald-100/78">
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                    Year {Math.min(run.activeNode?.act ?? runNodes[Math.min(run.floorIndex, runNodes.length - 1)]?.act ?? 1, 4)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                    Floor {Math.min(run.floorIndex + 1, runNodes.length)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                    {getRunOwnedPlayers(run).length} Players Owned
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resumeRun}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
                >
                  Resume Rogue Run
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : null}
          </div>

          {activeRogueStar ? (
            <div className="mt-4 inline-flex max-w-3xl flex-wrap items-center gap-3 rounded-[22px] border border-amber-200/18 bg-amber-300/10 px-4 py-2.5 text-sm text-amber-50">
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/78">Active Rogue Star</div>
              <div className="font-semibold text-white">{activeRogueStar.name}</div>
              <div className="text-amber-100/76">{activeRogueStar.overall} OVR will replace one starter-pack card in this run.</div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="glass-panel rounded-[30px] p-5 shadow-card lg:p-6">
            <div className="grid gap-5">
              <div className="rounded-[24px] border border-white/10 bg-black/18 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200/16 bg-sky-300/10 text-sky-100">
                    <Shield size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Conference Pool</div>
                    <div className="mt-1 text-lg font-semibold text-white">Which conference cards can appear?</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ROGUE_CONFERENCE_FILTER_OPTIONS.map((option) => {
                    const selected = selectedRunSettings.conferenceFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateRunSetting("conferenceFilter", option.value)}
                        className={clsx(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          selected
                            ? "border-sky-300/45 bg-sky-300/14 text-white"
                            : "border-white/10 bg-white/6 text-slate-200 hover:bg-white/10",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/18 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/16 bg-amber-300/10 text-amber-50">
                    <Crown size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Difficulty</div>
                    <div className="mt-1 text-lg font-semibold text-white">How strong should the boss teams be?</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {ROGUE_DIFFICULTY_OPTIONS.map((option) => {
                    const selected = selectedRunSettings.difficulty === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateRunSetting("difficulty", option.value)}
                        className={clsx(
                          "rounded-[18px] border px-4 py-3 text-left transition",
                          selected
                            ? "border-amber-200/34 bg-amber-300/12 text-white"
                            : "border-white/10 bg-white/6 text-slate-200 hover:bg-white/10",
                        )}
                      >
                        <div className="text-sm font-semibold">{option.label}</div>
                        <div className="mt-1 text-xs text-slate-300/78">{option.detail}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    key: "excludeGalaxyCards" as const,
                    title: "No Galaxy Cards",
                    detail: "Galaxy-tier cards will never appear in this run.",
                    icon: Sparkles,
                  },
                  {
                    key: "currentSeasonOnly" as const,
                    title: "Current Season Only",
                    detail: "Only 2025-26 current-season cards will appear.",
                    icon: Target,
                  },
                  {
                    key: "disableTrainingNodes" as const,
                    title: "No Training Camps",
                    detail: "Training camp nodes are removed from the ladder.",
                    icon: Zap,
                  },
                  {
                    key: "disableTradeNodes" as const,
                    title: "No Trades",
                    detail: "Trade nodes are removed from the ladder.",
                    icon: RefreshCcw,
                  },
                ].map((toggle) => {
                  const enabled = selectedRunSettings[toggle.key];
                  const Icon = toggle.icon;
                  return (
                    <button
                      key={toggle.key}
                      type="button"
                      onClick={() => updateRunSetting(toggle.key, !enabled)}
                      className={clsx(
                        "rounded-[24px] border p-4 text-left transition",
                        enabled
                          ? "border-emerald-300/28 bg-[linear-gradient(135deg,rgba(6,78,59,0.34),rgba(16,185,129,0.14),rgba(6,24,38,0.34))]"
                          : "border-white/10 bg-black/18 hover:bg-white/6",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={clsx(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                            enabled ? "border-emerald-200/24 bg-emerald-300/12 text-emerald-50" : "border-white/10 bg-white/6 text-slate-200",
                          )}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{toggle.title}</div>
                            <div className="mt-1 text-xs leading-5 text-slate-300/78">{toggle.detail}</div>
                          </div>
                        </div>
                        <div className={clsx(
                          "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]",
                          enabled ? "border-emerald-200/26 bg-emerald-300/12 text-emerald-50" : "border-white/10 bg-white/6 text-slate-300",
                        )}>
                          {enabled ? "On" : "Off"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[30px] p-5 shadow-card lg:p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Preview</div>
            <h2 className="mt-2 font-display text-3xl text-white">What this setup changes</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-200/82">
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3">
                Player pool: {selectedRunSettings.conferenceFilter === "both" ? "both conferences" : selectedRunSettings.conferenceFilter === "east" ? "Eastern Conference only" : "Western Conference only"}.
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3">
                Card line: {selectedRunSettings.currentSeasonOnly ? "current season only" : "all eras available"}.
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3">
                Top-end cards: {selectedRunSettings.excludeGalaxyCards ? "Galaxy cards removed" : "Galaxy cards allowed"}.
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3">
                Node path: {runNodes.length} total nodes with {runNodes.filter((node) => node.type === "boss").length} boss battles.
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={continueToStarterPacks}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
              >
                Continue to Starter Packs
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedRunSettings(DEFAULT_ROGUELIKE_RUN_SETTINGS)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={handleBackToHome}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-transparent px-6 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/6"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!run || showPackSelectionHub) {
    return (
      <section className="space-y-3">
        <div className="glass-panel rounded-[34px] p-4 shadow-card lg:p-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_500px] xl:items-start">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-3 py-1 text-xs tracking-[0.18em] text-fuchsia-100">
                NBA Rogue Mode
              </div>
              <h1 className="mt-2.5 max-w-4xl font-display text-[3.5rem] leading-[0.95] text-white lg:text-[4.35rem]">
                NBA Rogue Mode
              </h1>
              <p className="mt-2.5 max-w-4xl text-sm leading-6 text-slate-200/85">
                This new mode is run-based. You start with a small opening roster, draft just a few cards, then survive a ladder of draft nodes, chemistry checks, and boss gates while pulling from the full eligible player pool all run long.
              </p>
            </div>

            {run ? (
              <div className="rounded-[24px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(10,49,41,0.96),rgba(14,80,65,0.9),rgba(10,25,44,0.94))] px-5 py-4 xl:self-start">
                <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/78">Saved Run</div>
                <div className="mt-1 text-[1.15rem] font-semibold text-white">Resume Rogue Run</div>
                <div className="mt-1.5 text-sm leading-6 text-emerald-50/82">
                  Your unfinished climb is still parked and ready.
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-emerald-100/78">
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                    Year {Math.min(run.activeNode?.act ?? runNodes[Math.min(run.floorIndex, runNodes.length - 1)]?.act ?? 1, 4)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                    Floor {Math.min(run.floorIndex + 1, runNodes.length)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                    {getRunOwnedPlayers(run).length} Players Owned
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resumeRun}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
                >
                  Resume Rogue Run
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : null}
          </div>

          {activeRogueStar ? (
            <div className="mt-3 inline-flex max-w-3xl flex-wrap items-center gap-3 rounded-[22px] border border-amber-200/18 bg-amber-300/10 px-4 py-2.5 text-sm text-amber-50">
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/78">Active Rogue Star</div>
              <div className="font-semibold text-white">{activeRogueStar.name}</div>
              <div className="text-amber-100/76">{activeRogueStar.overall} OVR will replace one starter-pack card in this run.</div>
            </div>
          ) : null}

        </div>

        <div className="glass-panel rounded-[30px] p-4 shadow-card lg:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Starter Packs</div>
              <h2 className="mt-1 font-display text-[1.75rem] leading-tight text-white">Pick 1 of 3 opening packs</h2>
              {run ? (
                <p className="mt-1.5 max-w-4xl text-sm leading-6 text-amber-100/78">
                  Opening a new starter pack now will replace your parked Rogue run.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={backToRunSettings}
                className="rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Run Settings
              </button>
              <button
                type="button"
                onClick={handleBackToHome}
                className="rounded-full border border-white/12 bg-white/6 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to Home
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-4 xl:grid-cols-3">
            {roguelikeStarterPackages.map((item, index) => {
              const accentClasses = [
                "from-[#d9b84f]/70 via-[#9b7a22]/55 to-[#e8cf73]/75 border-amber-200/24 shadow-[0_22px_50px_rgba(251,191,36,0.16)]",
                "from-[#79c4ff]/65 via-[#2450a7]/58 to-[#a7d9ff]/72 border-sky-200/24 shadow-[0_22px_50px_rgba(56,189,248,0.16)]",
                "from-[#f0b74a]/60 via-[#4d2d8f]/62 to-[#f4d37a]/72 border-fuchsia-200/24 shadow-[0_22px_50px_rgba(217,70,239,0.16)]",
              ][index] ?? "from-white/8 via-white/4 to-white/10 border-white/10";
              const simplifiedTitle =
                item.id === "balanced-foundation"
                  ? "Balanced Pack"
                  : item.id === "defense-lab"
                    ? "Defense Pack"
                    : item.id === "creator-camp"
                      ? "Offense Pack"
                      : item.title;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => startRun(item.id)}
                  className={clsx(
                    "group relative overflow-hidden rounded-[28px] border bg-gradient-to-b p-3 text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01]",
                    accentClasses,
                  )}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_28%)]" />
                  <div className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.06))]" />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(0deg,rgba(255,255,255,0.28),rgba(255,255,255,0.04))]" />
                  <div className="absolute inset-x-0 top-4 h-4 bg-white/12 blur-[2px]" />
                  <div className="absolute inset-x-0 bottom-4 h-4 bg-black/10 blur-[2px]" />
                  <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.24)_0.8px,transparent_0.8px)] [background-position:0_0] [background-size:14px_14px]" />
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-[24px] border border-white/18 bg-[linear-gradient(180deg,rgba(43,83,198,0.9),rgba(26,48,118,0.92))] px-5 py-5 text-center shadow-[0_18px_40px_rgba(16,24,40,0.28),inset_0_1px_0_rgba(255,255,255,0.18)]">
                    <div className="text-[12px] uppercase tracking-[0.24em] text-white/82">Rogue Starter Pack</div>
                    <div className="mt-2.5 font-display text-[1.62rem] leading-tight text-white">
                      {simplifiedTitle}
                    </div>
                  </div>

                  <div className="relative flex h-full min-h-[330px] flex-col justify-end lg:min-h-[345px]">
                    <div className="flex justify-end rounded-[20px] border border-white/14 bg-black/24 px-3 py-2.5 backdrop-blur-[2px]">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition group-hover:bg-amber-100">
                        Open Pack
                        <ArrowRight size={15} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </section>
    );
  }

  if (run.stage === "starter-reveal") {
    const allStarterCardsRevealed = run.revealedStarterIds.length === run.starterRevealPlayers.length;

    return (
      <section className="space-y-5">
        <div className="rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(9,13,21,0.98),rgba(12,18,28,0.99))] p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-fuchsia-100/80">Roguelike Run</div>
              <h1 className="mt-2 font-display text-4xl text-white">Starter Reveal</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Open the three starter cards from your selected pack to reveal the foundation of this Rogue run.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackToHome}
              className="rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(10,14,20,0.98),rgba(16,22,32,0.99))] p-6 shadow-card">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Starter Reveal</div>
          <h2 className="mt-2 font-display text-3xl text-white">Open your first 3 cards</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Reveal all three to see which players are starting this run before you move on to the Run Ladder.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-8">
            {run.starterRevealPlayers.map((player, index) => {
              const revealed = run.revealedStarterIds.includes(player.id);

              return (
                <StarterRevealCard
                  key={player.id}
                  player={player}
                  index={index}
                  revealed={revealed}
                  onReveal={() => revealStarterCard(player.id)}
                />
              );
            })}
          </div>

          {allStarterCardsRevealed ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={proceedToRunLadder}
                className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
              >
                Proceed to Run Ladder
                <ArrowRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  const activeNode = run.activeNode;
  const displayedRun = getHydratedRun(run, runNodes);
  const runAllStarBonusBadges = run.allStarBonusBadges ?? [];
  const runOwnedPlayers = getRunOwnedPlayers(displayedRun);
  const runOwnedPlayerIds = runOwnedPlayers.map((player) => player.id);
  const runOwnedDisplayPlayers = runOwnedPlayers.map((player) =>
    getRunDisplayPlayer(player, runOwnedPlayerIds, run.trainedPlayerIds ?? []),
  );
  const runOwnedDisplayPlayerById = new Map(runOwnedDisplayPlayers.map((player) => [player.id, player]));
  const currentLadderNode = runNodes[Math.min(run.floorIndex, runNodes.length - 1)] ?? null;
  const nextBossNode = getUpcomingBossNodeForLockerRoom(run, runNodes);
  const nextBossScouted = Boolean(nextBossNode && run.scoutedBossNodeIds.includes(nextBossNode.id));
  const scoutedBossLineup = nextBossScouted ? getScoutedBossLineup(run, nextBossNode, runPlayerUniverse) : [];
  const currentAct = activeNode?.act ?? currentLadderNode?.act ?? 1;
  const headerNode =
    run.stage === "ladder-overview"
      ? currentLadderNode
      : activeNode ?? currentLadderNode;
  const headerTitle =
    headerNode && run.stage !== "ladder-overview"
      ? `Year ${headerNode.act} | Floor ${headerNode.floor} | ${headerNode.title}`
      : getActHeading(currentAct);
  const headerDescription =
    headerNode && run.stage !== "ladder-overview"
      ? headerNode.description
      : getActDescription(currentAct);
  const startingFive = displayedRun.lineup.slice(0, 5);
  const startingFiveReady = startingFive.every((slot) => Boolean(slot.player));
  const startingFiveMetrics = evaluateRoguelikeLineup(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const shotCreationScore = getAverageAdjustedOffense(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const reboundingChallengeScore = getAverageAdjustedRebounding(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const challengeMetric = activeNode?.checks?.[0]?.metric ?? "offense";
  const canUseDraftShuffle =
    run.draftShuffleTickets > 0 &&
    (run.stage === "initial-draft" || run.stage === "reward-draft") &&
    run.choices.length > 0;
  const faceoffOpponentLineup =
    activeNode?.battleMode === "starting-five-faceoff" && run.activeOpponentPlayerIds
      ? buildRoguelikeOpponentLineup({
          ...activeNode,
          opponentPlayerIds: run.activeOpponentPlayerIds,
        }).slice(0, 5)
      : [];
  const faceoffFinalScore =
    run.stage === "faceoff-game" && run.nodeResult?.faceoffResult
      ? getFaceoffFinalScore(run.nodeResult.faceoffResult)
      : null;
  const completedNode =
    run.stage === "node-result" && run.floorIndex > 0
      ? runNodes[run.floorIndex - 1] ?? null
      : null;
  const rewardDraftResultNode = run.stage === "reward-draft" ? runNodes[run.floorIndex] ?? null : null;
  const nodeResultDisplayNode = activeNode ?? rewardDraftResultNode ?? completedNode;
  const challengeScreenNode = activeNode ?? nodeResultDisplayNode;
  const nodeResultFinalScore =
    run.stage === "node-result" && run.nodeResult?.faceoffResult
      ? getFaceoffFinalScore(run.nodeResult.faceoffResult)
      : null;
  const activeNodeClearRewards = activeNode ? getRoguelikeClearRewards(activeNode, run.settings) : null;
  const activeNodeLockerRoomCash = activeNode ? getRoguelikeLockerRoomCashReward(activeNode) : 0;
  const activeNodeShowsClearRewards =
    Boolean(activeNodeClearRewards) &&
    ((activeNodeClearRewards?.tokenReward ?? 0) > 0 || (activeNodeClearRewards?.prestigeXpAward ?? 0) > 0);
  const nodeResultClearRewards = nodeResultDisplayNode ? getRoguelikeClearRewards(nodeResultDisplayNode, run.settings) : null;
  const nodeResultLockerRoomCash = nodeResultDisplayNode ? getRoguelikeLockerRoomCashReward(nodeResultDisplayNode) : 0;
  const nodeResultShowsClearRewards =
    Boolean(nodeResultClearRewards) &&
    ((nodeResultClearRewards?.tokenReward ?? 0) > 0 || (nodeResultClearRewards?.prestigeXpAward ?? 0) > 0);
  const nodeResultRewardCopy = nodeResultDisplayNode ? getNodeCompletionRewardCopy(nodeResultDisplayNode) : null;
  const nodeResultReferencesDraftShuffle = (run.nodeResult?.detail ?? "").includes("Draft Shuffle");
  const nodeResultHasRewardChoices = run.stage === "node-result" && run.choices.length > 0;
  const nodeResultShowsRewardSummary =
    nodeResultHasRewardChoices || nodeResultReferencesDraftShuffle || nodeResultShowsClearRewards || nodeResultLockerRoomCash > 0;
  const upcomingNodeAfterResult = run.stage === "node-result" ? runNodes[run.floorIndex] ?? null : null;
  const nodeResultNextStepDescription = nodeResultHasRewardChoices
    ? `Next up: choose 1 of ${run.choices.length} player${run.choices.length === 1 ? "" : "s"} to add to your run roster${upcomingNodeAfterResult ? ` before ${upcomingNodeAfterResult.title}.` : "."}`
    : upcomingNodeAfterResult
      ? `Next up: head back to the run ladder and get ready for ${upcomingNodeAfterResult.title}.`
      : "This node is complete. Continue when you're ready for the next step.";
  const isFailureOverlay =
    run.stage === "run-over" || (run.stage === "faceoff-game" && run.nodeResult?.passed === false);
  const formatRunMetric = (value: number) =>
    Number.isInteger(value) ? `${value}` : value.toFixed(1);
  const weakestStarterRows = startingFive
    .filter((slot): slot is RosterSlot & { player: Player } => Boolean(slot.player))
    .map((slot) => ({
      slot: slot.slot,
      player: getRunDisplayPlayer(slot.player, runOwnedPlayerIds, run.trainedPlayerIds ?? []),
    }))
    .sort(
      (left, right) =>
        left.player.overall - right.player.overall || left.slot.localeCompare(right.slot),
    )
    .slice(0, 3)
    .map(({ slot, player }) => ({
      label: slot,
      value: `${player.name} • ${player.overall} OVR`,
    }));
  const failedChallengeResult = run.nodeResult?.challengeResult && !run.nodeResult.challengeResult.passed
    ? run.nodeResult.challengeResult
    : null;
  const failedFaceoffResult =
    run.nodeResult?.faceoffResult &&
    run.nodeResult.faceoffResult.userTeamWinProbability < run.nodeResult.faceoffResult.opponentTeamWinProbability
      ? run.nodeResult.faceoffResult
      : null;
  const worstMatchupRows = failedFaceoffResult
    ? [...failedFaceoffResult.matchups]
        .filter((matchup) => matchup.ratingDelta < 0)
        .sort((left, right) => left.ratingDelta - right.ratingDelta)
        .slice(0, 2)
        .map((matchup) => ({
          label: matchup.slot,
          value: `${matchup.userPlayer?.name ?? "Open slot"} vs ${matchup.opponentPlayer?.name ?? "Boss"} (${matchup.ratingDelta.toFixed(1)})`,
        }))
    : [];
  const failureAutopsyCards: RogueFailureAutopsyCard[] = isFailureOverlay
    ? [
        {
          title: "Final Team Profile",
          rows: [
            {
              label: "OVR / CHEM",
              value: `${formatRunMetric(startingFiveMetrics.overall)} / ${formatRunMetric(startingFiveMetrics.chemistry)}`,
            },
            {
              label: "OFF / DEF",
              value: `${formatRunMetric(startingFiveMetrics.offense)} / ${formatRunMetric(startingFiveMetrics.defense)}`,
            },
            {
              label: "REB / TRAIN",
              value: `${formatRunMetric(reboundingChallengeScore)} / ${(run.trainedPlayerIds ?? []).length}`,
            },
          ],
        },
        {
          title: "Lowest Starter Slots",
          rows:
            weakestStarterRows.length > 0
              ? weakestStarterRows
              : [{ label: "Lineup", value: "Starting five was not fully set." }],
        },
        {
          title: "Loss Snapshot",
          rows: failedChallengeResult
            ? [
                {
                  label: failedChallengeResult.metricLabel,
                  value: `${failedChallengeResult.score} scored vs ${failedChallengeResult.target} target`,
                },
                {
                  label: "Gap",
                  value: `${(failedChallengeResult.target - failedChallengeResult.score).toFixed(1)} short`,
                },
                {
                  label: "Players Owned",
                  value: `${runOwnedPlayers.length} on roster`,
                },
              ]
            : failedFaceoffResult
              ? [
                  {
                    label: "Win Odds",
                    value: `${Math.round(failedFaceoffResult.userTeamWinProbability)}% you / ${Math.round(failedFaceoffResult.opponentTeamWinProbability)}% boss`,
                  },
                  ...(worstMatchupRows.length > 0
                    ? worstMatchupRows
                    : [{ label: "Matchups", value: "No losing slot breakdown was captured." }]),
                ]
              : [{ label: "Result", value: "No additional loss breakdown was captured." }],
        },
      ]
    : [];
  const furthestOccupiedSlotIndex = displayedRun.lineup.reduce(
    (furthestIndex, slot, index) => (slot.player ? index : furthestIndex),
    -1,
  );
  const visibleRosterSlotCount = Math.min(
    10,
    Math.max(5, runOwnedPlayers.length, furthestOccupiedSlotIndex + 1),
  );
  const visibleRunLineup = displayedRun.lineup.slice(0, visibleRosterSlotCount);
  const finalVictoryRewards = runNodes.reduce(
    (totals, node) => {
      const rewards = getRoguelikeClearRewards(node, run.settings);
      return {
        tokens: totals.tokens + (rewards?.tokenReward ?? 0),
        prestigeXp: totals.prestigeXp + (rewards?.prestigeXpAward ?? 0),
        lockerRoomCash: totals.lockerRoomCash + getRoguelikeLockerRoomCashReward(node),
      };
    },
    { tokens: 0, prestigeXp: 0, lockerRoomCash: 0 },
  );
  const finalStartingFivePlayers = startingFive
    .filter((slot): slot is RosterSlot & { player: Player } => Boolean(slot.player))
    .map((slot) => ({
      ...slot,
      player: slot.player as Player,
    }));
  const totalTrainingSessionsUsed = run.trainedPlayerIds.length;
  const finalVictoryFaceoffScore = run.nodeResult?.faceoffResult
    ? getFaceoffFinalScore(run.nodeResult.faceoffResult)
    : null;
  const formatVictoryMetric = (value: number) =>
    Number.isInteger(value) ? `${value}` : value.toFixed(1);
  const canUseStoreUtilities =
    !["initial-draft", "reward-draft", "training-select", "trade-offer", "trade-select", "evolution-select", "faceoff-game", "node-result", "run-over", "run-cleared"].includes(run.stage);
  const utilityBackLabel =
    activeNode && isLockerRoomSelectionNode(activeNode) && run.utilityReturnState
      ? "Back to Locker Room"
      : "Back to Run Ladder";
  const utilityBackAction =
    activeNode && isLockerRoomSelectionNode(activeNode) && run.utilityReturnState
      ? backToLockerRoom
      : backToRunLadder;
  const isForcedLockerRoomVisit =
    run.stage === "locker-room" &&
    (run.activeNode?.type === "locker-room" ||
      (run.utilityReturnState?.stage === "locker-room" && run.utilityReturnState.activeNode?.type === "locker-room"));
  const isChoiceTrainingPath =
    activeNode?.type === "choice" && run.pendingChoiceSelection === "training";
  const isChoiceTradePath =
    activeNode?.type === "choice" && run.pendingChoiceSelection === "trade";
  const trainingSelectionTitle = isChoiceTrainingPath ? "Training Camp" : activeNode?.title ?? "";
  const tradeSelectionTitle = isChoiceTradePath ? "Trade Deadline" : activeNode?.title ?? "";
  const lockerRoomTrainingSelectionCopy =
    activeNode?.id === LOCKER_ROOM_TRAINING_NODE.id
      ? {
          eyebrow: "Locker Room Upgrade",
          description: "Spend Locker Room Cash to send 1 player to a private training camp. That player gains +1 OVR for the rest of this run.",
          detail: "You are only charged when you confirm the player. Back out if you want to keep shopping first.",
          actionLabel: "Send to private training",
        }
      : activeNode?.id === LOCKER_ROOM_PRACTICE_SHOOTING_NODE.id
        ? {
            eyebrow: "Locker Room Badge",
            description: "Choose 1 player to gain a Sniper badge for the rest of this run.",
            detail: "Best for spacing, shotmaking, and offense-first lineups. You are only charged when you confirm the player.",
            actionLabel: "Assign Sniper badge",
          }
        : activeNode?.id === LOCKER_ROOM_PRACTICE_REBOUNDING_NODE.id
          ? {
              eyebrow: "Locker Room Badge",
              description: "Choose 1 player to gain a Board Man badge for the rest of this run.",
              detail: "Ideal for glass-control lineups and interior support. You are only charged when you confirm the player.",
              actionLabel: "Assign Board Man badge",
            }
          : activeNode?.id === LOCKER_ROOM_PRACTICE_DEFENSE_NODE.id
            ? {
                eyebrow: "Locker Room Badge",
                description: "Choose 1 player to gain a Lockdown badge for the rest of this run.",
                detail: "This is the cleanest way to add defensive badge pressure to one player. You are only charged when you confirm the player.",
                actionLabel: "Assign Lockdown badge",
              }
            : activeNode?.id === LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE.id
              ? {
                  eyebrow: "Locker Room Badge",
                  description: "Choose 1 player to gain a Playmaker badge for the rest of this run.",
                  detail: "Perfect when your roster needs another creation identity. You are only charged when you confirm the player.",
                  actionLabel: "Assign Playmaker badge",
                }
              : activeNode?.id === LOCKER_ROOM_PRACTICE_OFFENSE_NODE.id
                ? {
                    eyebrow: "Locker Room Badge",
                    description: "Choose 1 player to gain a Slasher badge for the rest of this run.",
                    detail: "Use this when a player needs more downhill scoring identity. You are only charged when you confirm the player.",
                    actionLabel: "Assign Slasher badge",
                  }
                : isChoiceTrainingPath
                  ? {
                      eyebrow: "Choice Node",
                      description: "You chose the Training Camp path. Select 1 player from your run roster to gain +1 OVR for the rest of this run.",
                      detail: "This is the steadier branch: one permanent training boost with no roster volatility.",
                      actionLabel: "Send to training",
                    }
                : {
                    eyebrow: "Training Node",
                    description: "Select 1 player from your run roster to send to training. This will increase that player's Overall Rating by +1 for the remainder of the run.",
                    detail: "The training boost is permanent for the rest of this Rogue run and carries through the underlying lineup calculations too.",
                    actionLabel: "Send to training",
                  };
  const showDraftRosterRail =
        run.stage === "choice-select" ||
        run.stage === "initial-draft" ||
        run.stage === "reward-draft" ||
        run.stage === "faceoff-setup" ||
        run.stage === "challenge-setup" ||
        run.stage === "add-position-select" ||
        run.stage === "all-star-select" ||
        run.stage === "roster-cut-select" ||
        run.stage === "training-select" ||
        run.stage === "trade-offer" ||
        run.stage === "trade-select" ||
        run.stage === "evolution-select" ||
        (run.stage === "run-over" && run.failureReviewStage === "challenge-setup" && !showOutcomeOverlay);
  const reviewingFailedChallenge =
    run.stage === "run-over" && run.failureReviewStage === "challenge-setup" && !showOutcomeOverlay;
  const reviewingChallengeResults =
    showChallengeBreakdown &&
    Boolean(run.nodeResult?.challengeResult) &&
    (run.stage === "run-over" || run.stage === "reward-draft" || run.stage === "node-result");
  const challengeReviewMetric = run.nodeResult?.challengeResult?.metric ?? activeNode?.checks?.[0]?.metric ?? "offense";
  const challengeReviewFocusMetrics =
    reviewingChallengeResults ? [challengeReviewMetric] : [];
  const useNarrowRightRail = run.stage === "all-star-select";
  const showCompactLadderRewards = false;
  const shouldRenderOutcomeOverlay =
    showOutcomeOverlay &&
    run.stage === "faceoff-game" ||
    showOutcomeOverlay && run.stage === "node-result" ||
    showOutcomeOverlay && run.stage === "reward-draft" && Boolean(run.nodeResult?.challengeResult) ||
    showOutcomeOverlay && run.stage === "run-over" ||
    showOutcomeOverlay && run.stage === "run-cleared";
  const hideRightRail =
    run.stage === "training-select" ||
    run.stage === "roster-cut-select" ||
    run.stage === "reward-replace-select";
  const outcomeTone =
    run.stage === "run-over" || (run.stage === "faceoff-game" && run.nodeResult?.passed === false)
      ? "failure"
      : "success";
  const rewardReplaceDisplayPlayers = sortDisplayPlayersByOverallAsc(runOwnedDisplayPlayers);
  const rewardReplaceCardScale = getSingleRowDraftCardScale(
    rewardReplaceDisplayPlayers.length,
  );
  const trainingSelectionDisplayPlayers = sortDisplayPlayersByOverallAsc(
    runOwnedDisplayPlayers,
  );
  const trainingSelectionCardScale = getSingleRowDraftCardScale(
    trainingSelectionDisplayPlayers.length,
  );
  const rosterCutDisplayPlayers = sortDisplayPlayersByOverallAsc(runOwnedDisplayPlayers);

  const runRosterPanel = (
    <div className="glass-panel rounded-[30px] p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Roster</div>
          {runOwnedPlayers.length > 5 ? (
            <div className="mt-2 text-sm leading-6 text-slate-300">
              Your run roster is expanding. Every new player added to the run opens the next roster slot, up to a full 10-player group.
            </div>
          ) : null}
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
          {Math.min(runOwnedPlayers.length, visibleRosterSlotCount)}/{visibleRosterSlotCount} Cards
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {visibleRunLineup.map((slot, index) => (
          <div key={`${slot.slot}-${index}`}>
            {index === 5 ? (
              <div className="mb-5 mt-7">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <div className="mt-2 text-center text-[10px] uppercase tracking-[0.24em] text-slate-500">
                  Bench Unit
                </div>
              </div>
            ) : null}
            <div
              data-rogue-slot-index={index}
              className={clsx(
                "rounded-[24px] border border-dashed p-1.5 transition",
                dropTargetIndex === index ? "border-amber-300/60 bg-amber-300/10" : "border-white/12 bg-black/12",
              )}
            >
              <div onPointerDown={(event) => handleRosterPointerDown(index, event)}>
                <RogueRosterSlotCard
                  slot={slot}
                  index={index}
                  ownedPlayerIds={runOwnedPlayerIds}
                  trainedPlayerIds={run.trainedPlayerIds ?? []}
                  allStarBonusBadges={runAllStarBonusBadges}
                  focusMetrics={challengeReviewFocusMetrics}
                  dragged={draggingIndex === index}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const headerPanel = (
    <div className="glass-panel rounded-[30px] p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-fuchsia-100/80">Roguelike Run</div>
          <h1 className="mt-2 font-display text-4xl text-white">{headerTitle}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {headerDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={leaveRun}
            className="rounded-[22px] border border-white/12 bg-white/6 px-5 py-3 text-left text-slate-100 transition hover:scale-[1.02] hover:border-white/20 hover:bg-white/10"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300/82">
              Leave Run
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">Save & Exit</div>
          </button>
          <button
            type="button"
            onClick={abortRun}
            className="rounded-[22px] border border-rose-200/22 bg-[linear-gradient(135deg,rgba(127,29,29,0.95),rgba(153,27,27,0.92),rgba(69,10,10,0.96))] px-5 py-3 text-left text-rose-50 shadow-[0_16px_36px_rgba(127,29,29,0.24)] transition hover:scale-[1.02] hover:border-rose-100/30 hover:bg-[linear-gradient(135deg,rgba(153,27,27,0.98),rgba(185,28,28,0.94),rgba(87,13,13,0.98))]"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-rose-100/82">
              Abort Run
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">End Now</div>
          </button>
          <button
            type="button"
            onClick={useDraftShuffleTicket}
            disabled={!canUseDraftShuffle}
            className={clsx(
              "rounded-[22px] border px-5 py-3 text-left transition",
              canUseDraftShuffle
                ? "border-indigo-200/22 bg-[linear-gradient(135deg,rgba(37,46,104,0.95),rgba(67,56,202,0.88),rgba(20,24,60,0.96))] text-indigo-50 shadow-[0_16px_36px_rgba(67,56,202,0.24)] hover:scale-[1.02] hover:border-indigo-100/30"
                : "cursor-not-allowed border-white/10 bg-white/5 text-slate-300 opacity-70",
            )}
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-current">
              <RefreshCcw size={12} />
              Draft Shuffle
            </div>
            <div className="mt-2 text-xl font-semibold text-white">{run.draftShuffleTickets}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-current">
              {canUseDraftShuffle ? "Reroll current board" : "No live board to reroll"}
            </div>
          </button>
          {canUseStoreUtilities && ownedTrainingCampTickets > 0 ? (
            <button
              type="button"
              onClick={openStoreTrainingCamp}
              className="rounded-[22px] border border-sky-200/18 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,52,96,0.9),rgba(9,19,34,0.96))] px-5 py-3 text-left text-sky-50 shadow-[0_16px_36px_rgba(14,116,144,0.2)] transition hover:scale-[1.02] hover:border-sky-100/30"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-sky-100/82">
                Training Camp Ticket
              </div>
              <div className="mt-2 text-xl font-semibold text-white">Use Ticket</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-sky-100/74">
                {ownedTrainingCampTickets} owned
              </div>
            </button>
          ) : null}
          {canUseStoreUtilities && ownedTradePhones > 0 ? (
            <button
              type="button"
              onClick={openStoreTradePhone}
              className="rounded-[22px] border border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(54,18,76,0.95),rgba(91,33,182,0.84),rgba(25,12,48,0.96))] px-5 py-3 text-left text-fuchsia-50 shadow-[0_16px_36px_rgba(126,34,206,0.22)] transition hover:scale-[1.02] hover:border-fuchsia-100/30"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-100/82">
                Trade Phone
              </div>
              <div className="mt-2 text-xl font-semibold text-white">Make A Trade</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-fuchsia-100/74">
                {ownedTradePhones} owned
              </div>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  const showInlineRosterHeaderLayout =
    showDraftRosterRail && !hideRightRail && run.stage !== "ladder-overview";

  return (
    <section className="space-y-6">
      {showInlineRosterHeaderLayout ? null : headerPanel}

      <div
        className={clsx(
          "grid gap-6",
          run.stage === "ladder-overview" || hideRightRail
            ? "grid-cols-1"
            : useNarrowRightRail
              ? "xl:grid-cols-[minmax(0,1.66fr)_minmax(500px,0.84fr)]"
              : "xl:grid-cols-[minmax(0,1.58fr)_minmax(540px,0.92fr)]",
        )}
      >
        <div className="space-y-6">
          {showInlineRosterHeaderLayout ? headerPanel : null}
          {run.stage === "ladder-overview" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Ladder</div>
              <h2 className="mt-2 font-display text-4xl text-white">Map the climb before it starts</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
                This is the full run path. You will move through draft nodes, chemistry checks, and boss gates until you either survive the gauntlet or the run collapses. Study the ladder first, then begin your opening draft.
              </p>

              <div className="mt-8 hidden grid-cols-[minmax(0,1fr)_220px] items-end gap-4 pl-7 pr-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 xl:grid">
                <div>Nodes</div>
                <div className="text-right">Rewards</div>
              </div>
              <div className="relative mt-3 space-y-4 pl-7 before:absolute before:bottom-4 before:left-3 before:top-4 before:w-px before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06),rgba(255,255,255,0))]">
                {runNodes.map((node, index) => {
                  const isCurrent = index === run.floorIndex;
                  const isCleared = index < run.floorIndex;
                  const isLocked = index > run.floorIndex;
              const rewards = getRoguelikeClearRewards(node, run.settings);
                  const lockerRoomCashReward = getRoguelikeLockerRoomCashReward(node);
                  const rewardsEarned =
                    (doesRoguelikeNodeAwardClearRewards(node) || lockerRoomCashReward > 0) &&
                    hasEarnedNodeReward(run, index, run.nodeResult);
                  const actTheme = getActLadderTheme(node.act);
                  const nodeTheme = getRoguelikeNodeTypeTheme(node.type);
                  const summary = node.targetLabel
                    ? { label: "Target", value: node.targetLabel }
                    : { label: "Reward", value: getRewardDraftTitle(node) };
                  const clearedRewardSummary = [
                    rewards.tokenReward > 0 ? `+${rewards.tokenReward} tokens` : null,
                    rewards.prestigeXpAward > 0 ? `+${rewards.prestigeXpAward} XP` : null,
                    lockerRoomCashReward > 0 ? `+${lockerRoomCashReward} cash` : null,
                  ]
                    .filter((value): value is string => Boolean(value))
                    .join(" • ");

                  return (
                    <div key={node.id} className="relative grid gap-4 pl-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-stretch">
                      <div
                        className={clsx(
                          "absolute left-[-1px] top-7 h-4 w-4 rounded-full border-4 border-[#090b12]",
                          isCleared ? "bg-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.45)]" : actTheme.accent,
                        )}
                      />
                      <div
                        ref={isCurrent ? currentLadderNodeRef : null}
                        className={clsx(
                          "relative overflow-hidden rounded-[24px] border px-5 py-5 transition",
                          isCurrent
                            ? actTheme.current
                            : isCleared
                              ? "border-emerald-300/45 bg-[linear-gradient(135deg,rgba(6,78,59,0.42),rgba(16,185,129,0.16),rgba(5,46,22,0.5))] shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_34px_rgba(16,185,129,0.2)]"
                              : actTheme.shell,
                        )}
                      >
                        {isCleared ? (
                          <div className="flex items-center justify-between gap-4 py-0.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/24 bg-emerald-300/12 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                <CheckCircle2 size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/90">
                                  Year {node.act} | Floor {node.floor}
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold text-white">
                                  {clearedRewardSummary || "Cleared"}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 rounded-full border border-emerald-200/30 bg-emerald-300/12 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-50">
                              Cleared
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={clsx("absolute inset-y-5 left-0 w-[3px] rounded-full bg-gradient-to-b", nodeTheme.accentLine)} />
                            <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full bg-white/[0.03] blur-2xl" />
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-start gap-4">
                                <div
                                  className={clsx(
                                    "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                                    nodeTheme.iconWrap,
                                  )}
                                >
                                  <nodeTheme.Icon size={18} className={nodeTheme.iconColor} />
                                </div>
                                <div>
                                  <div className={clsx("text-[10px] uppercase tracking-[0.2em]", actTheme.eyebrow)}>
                                    Year {node.act} | Floor {node.floor}
                                  </div>
                                  <div className="mt-2 font-semibold text-white">{node.title}</div>
                                  <div className="mt-3">
                                    <span className={clsx("rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]", nodeTheme.chip)}>
                                      {nodeTheme.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {isCurrent ? (
                                <button
                                  type="button"
                                  onClick={startOpeningDraft}
                                  className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:scale-[1.02]"
                                >
                                  {node.battleMode === "starting-five-faceoff" ? "Set Lineup" : "Go"}
                                </button>
                              ) : (
                                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                                  {isLocked ? "Locked" : nodeTheme.label}
                                </div>
                              )}
                            </div>
                            <div className="mt-3 text-sm leading-6 text-slate-300">{node.description}</div>
                            <div
                              className={clsx(
                                "mt-4 rounded-[18px] border px-4 py-3.5",
                                node.targetLabel ? nodeTheme.summary : actTheme.reward,
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={clsx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-white", nodeTheme.iconWrap)}>
                                  <nodeTheme.Icon size={14} className={nodeTheme.iconColor} />
                                </div>
                                <div>
                                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/62">
                                    {summary.label}
                                  </div>
                                  <div className="mt-1 text-sm font-semibold leading-6 text-current">
                                    {summary.value}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="xl:pt-1">
                        <RogueNodeRewardsRail rewards={rewards} lockerRoomCash={lockerRoomCashReward} earned={rewardsEarned} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {run.stage === "locker-room" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {isForcedLockerRoomVisit ? "Locker Room Visit" : "Mid-Run Store"}
                  </div>
                  <h2 className="mt-2 font-display text-3xl text-white">Locker Room</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                    {isForcedLockerRoomVisit
                      ? "This is your scheduled store stop. Check your Locker Room Cash, buy any upgrades you want, then continue the run when you are ready."
                      : "Spend Locker Room Cash on one-run upgrades, scouting intel, and targeted boosts that help you shape the rest of this climb."}
                  </p>
                </div>
                <div className="rounded-[24px] border border-emerald-200/18 bg-emerald-300/10 px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-100/76">
                    <Coins size={13} />
                    Locker Room Cash
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">{run.lockerRoomCash}</div>
                </div>
              </div>

              {run.lockerRoomNotice ? (
                <div className="mt-5 rounded-[24px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(10,72,48,0.32),rgba(16,94,65,0.18),rgba(6,24,18,0.38))] px-5 py-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/76">Latest Purchase</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{run.lockerRoomNotice.title}</div>
                  <div className="mt-2 text-sm leading-7 text-white/78">{run.lockerRoomNotice.detail}</div>
                </div>
              ) : null}

              <div className="mt-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  <Target size={14} className="text-sky-200" />
                  Intel
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[28px] border border-sky-200/18 bg-[linear-gradient(135deg,rgba(15,52,96,0.28),rgba(8,18,32,0.94))] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold text-white">Advanced Scouting</div>
                        <div className="mt-3 text-sm leading-7 text-slate-300">
                          Reveal the next boss team before you get there, including the starting five, ratings, and player type badges.
                        </div>
                      </div>
                      <div className="rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                        {getLockerRoomItemPrice("advanced-scouting")} Cash
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={buyLockerRoomAdvancedScouting}
                        disabled={!nextBossNode || nextBossScouted || run.lockerRoomCash < getLockerRoomItemPrice("advanced-scouting")}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
                      >
                        {nextBossScouted ? "Already Scouted" : "Buy Scouting Report"}
                      </button>
                      <div className="self-center text-xs uppercase tracking-[0.18em] text-slate-400">
                        {nextBossNode ? `Next boss: ${nextBossNode.title}` : "No upcoming boss to scout"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-indigo-200/18 bg-[linear-gradient(135deg,rgba(37,46,104,0.28),rgba(11,16,34,0.94))] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold text-white">Draft Shuffle Ticket</div>
                        <div className="mt-3 text-sm leading-7 text-slate-300">
                          Add 1 Draft Shuffle ticket to this run so you can reroll any live five-player board when the timing feels right.
                        </div>
                      </div>
                      <div className="rounded-full border border-indigo-200/20 bg-indigo-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">
                        {getLockerRoomItemPrice("draft-shuffle-ticket")} Cash
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Current tickets: {run.draftShuffleTickets}
                      </div>
                      <button
                        type="button"
                        onClick={buyLockerRoomDraftShuffleTicket}
                        disabled={run.lockerRoomCash < getLockerRoomItemPrice("draft-shuffle-ticket")}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
                      >
                        Buy Ticket
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  <Shield size={14} className="text-emerald-200" />
                  Staff Perks
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[28px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(12,74,50,0.28),rgba(7,24,18,0.94))] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold text-white">Training Camp Tickets</div>
                        <div className="mt-3 text-sm leading-7 text-slate-300">
                          Send 1 player to a private training camp for a permanent +1 OVR boost during this run.
                        </div>
                      </div>
                      <div className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                        {getLockerRoomItemPrice("training-camp-ticket")} Cash
                      </div>
                    </div>
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => openLockerRoomSelection(LOCKER_ROOM_TRAINING_NODE)}
                        disabled={run.lockerRoomCash < getLockerRoomItemPrice("training-camp-ticket")}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
                      >
                        Choose Player
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(64,23,107,0.28),rgba(16,10,32,0.94))] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl font-semibold text-white">New Position Training</div>
                        <div className="mt-3 text-sm leading-7 text-slate-300">
                          Teach 1 player a new natural position for the rest of this run so your lineup has more flexibility where it matters.
                        </div>
                      </div>
                      <div className="rounded-full border border-fuchsia-200/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100">
                        {getLockerRoomItemPrice("new-position-training")} Cash
                      </div>
                    </div>
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => openLockerRoomSelection(LOCKER_ROOM_NEW_POSITION_NODE)}
                        disabled={run.lockerRoomCash < getLockerRoomItemPrice("new-position-training")}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
                      >
                        Choose Player
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                  <Zap size={14} className="text-amber-200" />
                  Player Type Badges
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    {
                      id: "practice-shooting" as LockerRoomItemId,
                      title: "Player Type Badge: Sniper",
                      description: "Add a Sniper badge to 1 player on your current run roster.",
                      badgeType: "sniper" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_SHOOTING_NODE,
                      tone: "border-sky-200/18 bg-[linear-gradient(135deg,rgba(14,116,144,0.24),rgba(7,20,32,0.94))]",
                    },
                    {
                      id: "practice-rebounding" as LockerRoomItemId,
                      title: "Player Type Badge: Board Man",
                      description: "Add a Board Man badge to 1 player on your current run roster.",
                      badgeType: "board-man" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_REBOUNDING_NODE,
                      tone: "border-amber-200/18 bg-[linear-gradient(135deg,rgba(120,53,15,0.24),rgba(28,18,8,0.94))]",
                    },
                    {
                      id: "practice-defense" as LockerRoomItemId,
                      title: "Player Type Badge: Lockdown",
                      description: "Add a Lockdown badge to 1 player on your current run roster.",
                      badgeType: "lockdown" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_DEFENSE_NODE,
                      tone: "border-emerald-200/18 bg-[linear-gradient(135deg,rgba(12,74,50,0.24),rgba(8,22,18,0.94))]",
                    },
                    {
                      id: "practice-playmaking" as LockerRoomItemId,
                      title: "Player Type Badge: Playmaker",
                      description: "Add a Playmaker badge to 1 player on your current run roster.",
                      badgeType: "playmaker" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE,
                      tone: "border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(91,33,182,0.24),rgba(16,10,32,0.94))]",
                    },
                    {
                      id: "practice-offense" as LockerRoomItemId,
                      title: "Player Type Badge: Slasher",
                      description: "Add a Slasher badge to 1 player on your current run roster.",
                      badgeType: "slasher" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_OFFENSE_NODE,
                      tone: "border-rose-200/18 bg-[linear-gradient(135deg,rgba(136,19,55,0.24),rgba(28,12,16,0.94))]",
                    },
                  ].map((item) => (
                    <div key={item.id} className={`rounded-[28px] border p-5 ${item.tone}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div
                            className={clsx(
                              "flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] border backdrop-blur-sm shadow-[0_18px_34px_rgba(0,0,0,0.18)]",
                              playerTypeBadgeStyleClass[item.badgeType],
                            )}
                          >
                            <div className="scale-[1.9]">{renderPlayerTypeBadgeIcon(item.badgeType, false)}</div>
                          </div>
                          <div>
                          <div className="text-xl font-semibold text-white">{item.title}</div>
                          <div className="mt-3 text-sm leading-7 text-slate-300">{item.description}</div>
                          </div>
                        </div>
                        <div className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                          {getLockerRoomItemPrice(item.id)} Cash
                        </div>
                      </div>
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => openLockerRoomSelection(item.node)}
                          disabled={run.lockerRoomCash < getLockerRoomItemPrice(item.id)}
                          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
                        >
                          Choose Player
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {nextBossScouted && nextBossNode ? (
                <div className="mt-10">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                    <Target size={14} className="text-emerald-200" />
                    Scouting Report
                  </div>
                  <div className="mt-4 rounded-[28px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(11,48,37,0.34),rgba(5,18,16,0.96))] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/76">Next Boss</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{nextBossNode.title}</div>
                        <div className="mt-2 text-sm leading-7 text-white/76">
                          {nextBossNode.opponentTeamName ?? "Boss Team"} | Avg {nextBossNode.opponentAverageOverall ?? "--"} OVR
                        </div>
                      </div>
                      <div className="rounded-full border border-emerald-200/18 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                        Intel Unlocked
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 xl:grid-cols-5">
                      {scoutedBossLineup.map((slot, index) => (
                        <div key={`${slot.slot}-${index}`} className="rounded-[22px] border border-white/10 bg-black/18 p-4">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{slot.slot}</div>
                          <div className="mt-2 text-lg font-semibold text-white">{slot.player?.name ?? "Open Slot"}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                            {slot.player ? [slot.player.primaryPosition, ...slot.player.secondaryPositions].join(" / ") : "Missing"}
                          </div>
                          {slot.player ? (
                            <>
                              <div className="mt-3 text-sm font-semibold text-amber-100">{slot.player.overall} OVR</div>
                              <div className="mt-3 flex flex-wrap items-center gap-1">
                                <PlayerTypeBadges
                                  player={slot.player}
                                  compact
                                  iconOnly
                                  align="start"
                                  className="gap-1"
                                />
                              </div>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={leaveLockerRoom}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  {isForcedLockerRoomVisit ? "Continue Run" : "Back To Run"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {run.stage === "initial-draft" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Opening Draft</div>
              <h2 className="mt-2 font-display text-3xl text-white">Complete your starting five</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Starter Cache is open. Make two picks from Emerald boards to turn your three-card starter pack into a full opening lineup.
              </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 overflow-visible px-1 pt-2 pb-3">
                {run.choices.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={draftChoice}
                    compact
                    compactScale={0.46}
                    draftedPlayerIds={runOwnedPlayerIds}
                    enableTeamChemistryPreview
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "faceoff-setup" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Set Your Starting Five</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Drag your players into the exact PG, SG, SF, PF, and C starter slots you want before the faceoff. Each starter is matched directly with the boss player at the same position, and every matchup creates its own win probability.
              </p>
              <div className="mt-5 rounded-[22px] border border-fuchsia-200/14 bg-fuchsia-300/8 px-4 py-4 text-sm text-slate-100">
                Boss team: {activeNode.opponentTeamName ?? "Starting Five"}.
                The total of all five matchup win probabilities decides the winner.
              </div>
              <div className="mt-5 grid gap-3">
                {startingFive.map((slot, index) => (
                  <div key={`${slot.slot}-${index}`} className="rounded-[24px] border border-white/10 bg-black/18 p-3">
                    <div className="grid gap-3 xl:grid-cols-2">
                      <FaceoffStarterCard
                        player={faceoffOpponentLineup[index]?.player ?? null}
                        slot={faceoffOpponentLineup[index] ?? slot}
                        slotLabel={`Boss ${slot.slot}`}
                        ownedPlayerIds={faceoffOpponentLineup.map((entry) => entry.player?.id).filter((id): id is string => Boolean(id))}
                        align="right"
                      />
                      <FaceoffStarterCard
                        player={slot.player}
                        slot={slot}
                        slotLabel={`Your ${slot.slot}`}
                        ownedPlayerIds={runOwnedPlayerIds}
                        trainedPlayerIds={run.trainedPlayerIds ?? []}
                        allStarBonusBadges={runAllStarBonusBadges}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startFaceoffGame}
                  disabled={!startingFiveReady}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    startingFiveReady
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Start Faceoff Game
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

            {((run.stage === "challenge-setup" && activeNode) || (reviewingChallengeResults && challengeScreenNode)) && (
              <div className="glass-panel rounded-[30px] p-6 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Set Your Starting Five</div>
                <h2 className="mt-2 font-display text-3xl text-white">{challengeScreenNode?.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {reviewingChallengeResults
                    ? "Here is the full challenge breakdown. You can now see each starter's category value and how your starting five scored against the target."
                    : challengeMetric === "rebounding"
                      ? "Choose the five starters you believe give you the best chance to control the glass. You will only see the target, not the rebounding math behind the lineup."
                      : challengeMetric === "chemistry"
                        ? "Choose the five starters you believe give you the best chance to function as a connected unit. You will only see the target, not the chemistry math behind the lineup."
                        : challengeMetric === "defense"
                          ? "Choose the five starters you believe give you the best chance to lock teams down. You will only see the target, not the defensive math behind the lineup."
                          : "Choose the five starters you believe give you the best chance to score enough to clear the test. You will only see the target, not the offensive math behind the lineup."}
                </p>
              <div className="mt-6 rounded-[24px] border border-white/12 bg-black/14 p-5">
                {reviewingChallengeResults && run.nodeResult?.challengeResult ? (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Challenge Goal</div>
                      <div className="mt-2 text-lg font-semibold text-white">{challengeScreenNode?.targetLabel}</div>
                      <div className="mt-3 text-sm leading-6 text-slate-300">
                        Your lineup {run.nodeResult.challengeResult.passed ? "cleared" : "missed"} the challenge. The numbers below show exactly how close your starting five came.
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] border border-white/12 bg-white/5 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Starting 5 Score</div>
                        <div className="mt-2 text-3xl font-semibold text-white">{run.nodeResult.challengeResult.score}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {run.nodeResult.challengeResult.metricLabel}
                        </div>
                      </div>
                      <div className="rounded-[20px] border border-amber-200/18 bg-amber-300/8 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/80">Target</div>
                        <div className="mt-2 text-3xl font-semibold text-white">{run.nodeResult.challengeResult.target}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                          Threshold to beat
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Challenge Goal</div>
                    <div className="mt-2 text-lg font-semibold text-white">{challengeScreenNode?.targetLabel}</div>
                    <div className="mt-3 text-sm leading-6 text-slate-300">
                      Fill the five starter slots, trust your read on the roster, and run the challenge to find out whether your lineup clears the threshold.
                    </div>
                  </div>
                )}
              </div>
              {reviewingChallengeResults ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChallengeBreakdown(false);
                      if (run.stage === "run-over") setShowOutcomeOverlay(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                  >
                    {run.stage === "reward-draft" ? "Continue to Reward Draft" : "Back to Summary"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startLineupChallenge}
                    disabled={!startingFiveReady}
                    className={clsx(
                      "mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                      startingFiveReady
                        ? "bg-white text-slate-900 hover:scale-[1.02]"
                        : "cursor-not-allowed bg-white/10 text-slate-500",
                    )}
                  >
                    Run Challenge
                    <ArrowRight size={16} />
                  </button>
                  <BackToRunLadderButton onClick={backToRunLadder} />
                </>
              )}
            </div>
          )}

          {run.stage === "choice-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Choice Node</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Choose one path for this stop on the ladder. Training is the steadier floor-raising option, while Trade gives you a chance to reshape the roster.
              </p>
              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <button
                  type="button"
                  onClick={() => chooseRoguelikePath("training")}
                  className="rounded-[24px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(6,78,59,0.34),rgba(15,23,42,0.92),rgba(6,95,70,0.2))] p-5 text-left transition hover:-translate-y-1 hover:border-emerald-200/28"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
                    <Zap size={13} />
                    Training Camp
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-white">Train 1 player</div>
                  <div className="mt-2 text-sm leading-6 text-slate-200/90">
                    Give one player a permanent +1 OVR boost for the rest of this run.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => chooseRoguelikePath("trade")}
                  className="rounded-[24px] border border-amber-200/18 bg-[linear-gradient(135deg,rgba(120,53,15,0.32),rgba(15,23,42,0.92),rgba(146,64,14,0.2))] p-5 text-left transition hover:-translate-y-1 hover:border-amber-200/28"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/18 bg-amber-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-100">
                    <RefreshCcw size={13} />
                    Trade
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-white">Trade 1 player</div>
                  <div className="mt-2 text-sm leading-6 text-slate-200/90">
                    Swap out one player and choose a same-caliber replacement board that better fits your roster.
                  </div>
                </button>
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "training-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{lockerRoomTrainingSelectionCopy.eyebrow}</div>
              <h2 className="mt-2 font-display text-3xl text-white">{trainingSelectionTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {lockerRoomTrainingSelectionCopy.description}
              </p>
              <div className="mt-5 rounded-[22px] border border-emerald-200/14 bg-emerald-300/8 px-4 py-4 text-sm text-slate-100">
                {lockerRoomTrainingSelectionCopy.detail}
              </div>
              <div className="mt-5 flex flex-wrap items-start justify-center gap-2 overflow-hidden">
                {trainingSelectionDisplayPlayers.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={sendPlayerToTraining}
                    compact
                    compactScale={trainingSelectionCardScale}
                    draftedPlayerIds={runOwnedPlayerIds}
                    enableTeamChemistryPreview
                    actionLabel={lockerRoomTrainingSelectionCopy.actionLabel}
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={utilityBackAction} label={utilityBackLabel} />
            </div>
          )}

          {run.stage === "roster-cut-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Roster Cut</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Select exactly 2 players to cut from your run roster. Those players will be removed permanently, and the rest of your rotation will carry forward.
              </p>
              <div className="mt-5 rounded-[22px] border border-rose-200/14 bg-rose-300/8 px-4 py-4 text-sm text-slate-100">
                Cuts selected: {run.selectedCutPlayerIds.length}/2. Choose carefully. Once you confirm, those cards are gone for the rest of this Rogue run.
              </div>
              <div className="mt-5 flex flex-wrap items-start justify-center gap-2 overflow-hidden">
                {rosterCutDisplayPlayers.map((player) => {
                  const selected = run.selectedCutPlayerIds.includes(player.id);

                  return (
                    <DraftPlayerCard
                      key={player.id}
                      player={player}
                      onSelect={toggleRosterCutPlayer}
                      selected={selected}
                      compact
                      compactScale={trainingSelectionCardScale}
                      draftedPlayerIds={runOwnedPlayerIds}
                      enableTeamChemistryPreview
                      actionLabel={selected ? "Selected to cut" : "Select to cut"}
                    />
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmRosterCut}
                  disabled={run.selectedCutPlayerIds.length !== 2}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    run.selectedCutPlayerIds.length === 2
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Confirm Cuts
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "add-position-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {activeNode.id === LOCKER_ROOM_NEW_POSITION_NODE.id ? "Locker Room Upgrade" : "Add A Natural Position"}
              </div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {activeNode.id === LOCKER_ROOM_NEW_POSITION_NODE.id
                  ? "Choose 1 player from your run roster, then add 1 new natural position that player does not already have. This upgrade is purchased with Locker Room Cash and applies for the rest of the run."
                  : "Choose 1 player from your run roster, then add 1 new natural position that player does not already have."}
              </p>
              <div className="mt-5 rounded-[22px] border border-sky-200/14 bg-sky-300/8 px-4 py-4 text-sm text-slate-100">
                {activeNode.id === LOCKER_ROOM_NEW_POSITION_NODE.id
                  ? "You are only charged when you confirm the player and position. Back out if you want to save the cash for another upgrade."
                  : "This new natural position lasts for the rest of the Rogue run and improves lineup flexibility anywhere that position matters."}
              </div>

              <div className="mt-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Step 1</div>
                <div className="mt-2 text-sm font-semibold text-white">Select a player</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {runOwnedDisplayPlayers.map((player) => {
                    const selected = run.selectedNaturalPositionPlayerId === player.id;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => selectNaturalPositionPlayer(player)}
                        className={clsx(
                          "rounded-[24px] border px-5 py-4 text-left transition",
                          selected
                            ? "border-sky-300/50 bg-[linear-gradient(135deg,rgba(14,116,144,0.28),rgba(59,130,246,0.18),rgba(15,23,42,0.32))]"
                            : "border-white/10 bg-black/18 hover:border-white/18 hover:bg-white/6",
                        )}
                      >
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{player.primaryPosition}</div>
                        <div className="mt-2 text-xl font-semibold text-white">{player.name}</div>
                        <div className="mt-2 text-sm text-slate-300">
                          {[player.primaryPosition, ...player.secondaryPositions].join(" / ")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {run.selectedNaturalPositionPlayerId ? (
                <div className="mt-8">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Step 2</div>
                  <div className="mt-2 text-sm font-semibold text-white">Choose a new natural position</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(["PG", "SG", "SF", "PF", "C"] as Position[]).map((position) => {
                      const selectedPlayer = runOwnedDisplayPlayers.find(
                        (player) => player.id === run.selectedNaturalPositionPlayerId,
                      );
                      const alreadyNatural = selectedPlayer
                        ? selectedPlayer.primaryPosition === position ||
                          selectedPlayer.secondaryPositions.includes(position)
                        : false;

                      return (
                        <button
                          key={position}
                          type="button"
                          onClick={() => selectNaturalPosition(position)}
                          disabled={alreadyNatural}
                          className={clsx(
                            "rounded-full border px-5 py-3 text-sm font-semibold transition",
                            alreadyNatural
                              ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-500"
                              : run.selectedNaturalPosition === position
                                ? "border-sky-300/50 bg-sky-300/14 text-white"
                                : "border-white/12 bg-white/6 text-white hover:bg-white/10",
                          )}
                        >
                          {position}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmNaturalPositionAdd}
                  disabled={!run.selectedNaturalPositionPlayerId || !run.selectedNaturalPosition}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    run.selectedNaturalPositionPlayerId && run.selectedNaturalPosition
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  {activeNode.id === LOCKER_ROOM_NEW_POSITION_NODE.id ? "Confirm Position Training" : "Confirm New Position"}
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={utilityBackAction} label={utilityBackLabel} className="" />
              </div>
            </div>
          )}

          {run.stage === "all-star-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">All-Star Saturday</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Assign one player to each event. Dunk Contest adds a Slasher badge, 3PT Contest adds a Sniper badge, and Skills Challenge adds a Playmaker badge for the rest of the run.
              </p>
              <div className="mt-6 grid gap-5 xl:grid-cols-3">
                {[
                  { key: "dunkContest" as const, title: "Dunk Contest", stat: "Slasher badge" },
                  { key: "threePointContest" as const, title: "3PT Contest", stat: "Sniper badge" },
                  { key: "skillsChallenge" as const, title: "Skills Challenge", stat: "Playmaker badge" },
                ].map((eventCard) => (
                  <div key={eventCard.key} className="rounded-[24px] border border-white/10 bg-black/18 p-5">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{eventCard.title}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{eventCard.stat}</div>
                    <div className="mt-4 space-y-3">
                      {runOwnedDisplayPlayers.map((player) => {
                        const selected = run.allStarAssignments[eventCard.key] === player.id;
                        const alreadyUsedInAnotherEvent = Object.entries(run.allStarAssignments).some(
                          ([assignmentKey, playerId]) => assignmentKey !== eventCard.key && playerId === player.id,
                        );

                        return (
                          <AllStarPlayerOptionCard
                            key={`${eventCard.key}-${player.id}`}
                            player={player}
                            selected={selected}
                            disabled={alreadyUsedInAnotherEvent}
                            onSelect={() => assignAllStarPlayer(eventCard.key, player)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runAllStarSaturday}
                  disabled={
                    !run.allStarAssignments.dunkContest ||
                    !run.allStarAssignments.threePointContest ||
                    !run.allStarAssignments.skillsChallenge
                  }
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    run.allStarAssignments.dunkContest &&
                    run.allStarAssignments.threePointContest &&
                    run.allStarAssignments.skillsChallenge
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Run All-Star Saturday
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "reward-replace-select" && run.pendingRewardPlayer && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Full Roster</div>
              <h2 className="mt-2 font-display text-3xl text-white">Choose 1 player to replace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {run.pendingRewardPlayer.name} is ready to join your run, but your roster is already full. Select
                1 current player to swap out, or skip this reward and keep your team intact.
              </p>
              <div className="mt-4 rounded-[22px] border border-amber-200/14 bg-amber-300/8 px-4 py-3 text-sm text-slate-100">
                The incoming reward player replaces exactly 1 current player. Skipping this pick keeps your full roster unchanged and moves the run forward.
              </div>
              <div className="mt-4 rounded-[22px] border border-indigo-200/14 bg-indigo-300/8 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-100/80">Incoming Reward</div>
                <div className="mt-2 text-2xl font-semibold text-white">{run.pendingRewardPlayer.name}</div>
                <div className="mt-1 text-sm text-slate-200">
                  {run.pendingRewardPlayer.overall} OVR | {run.pendingRewardPlayer.primaryPosition}
                  {run.pendingRewardPlayer.secondaryPositions.length
                    ? ` / ${run.pendingRewardPlayer.secondaryPositions.join(" / ")}`
                    : ""}
                </div>
              </div>
              <div className="mt-5 flex flex-nowrap items-start justify-between gap-2 overflow-visible">
                {rewardReplaceDisplayPlayers.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={replaceRosterPlayerWithReward}
                    compact
                    compactScale={rewardReplaceCardScale}
                    draftedPlayerIds={runOwnedPlayerIds}
                    enableTeamChemistryPreview
                    actionLabel="Replace this player"
                  />
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={skipRewardDraftReplacement}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Skip This Pick
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "trade-offer" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{isChoiceTradePath ? "Choice Node" : "Trade Node"}</div>
              <h2 className="mt-2 font-display text-3xl text-white">{tradeSelectionTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {isChoiceTradePath
                  ? "You chose the Trade path. If you move 1 player, your 5 replacement choices will be limited to similar-caliber options so this stays a reshape, not a power spike."
                  : "It&apos;s Trade Deadline day. If you trade 1 player away, your 5 replacement choices will be limited to players of similar caliber."}
              </p>
              <div className="mt-5 rounded-[22px] border border-amber-200/14 bg-amber-300/8 px-4 py-4 text-sm text-slate-100">
                Trading is optional. If you go through with it, the replacement board will only include players within 1 OVR of the player you send away. If you pass, you keep your roster intact and continue deeper into the run.
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openTradeSelection}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  Explore Trades
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={declineTradeDeadline}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Keep My Team
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "trade-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{isChoiceTradePath ? "Choice Node" : "Trade Node"}</div>
              <h2 className="mt-2 font-display text-3xl text-white">{tradeSelectionTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Select 1 player from your run roster to trade away. After that, you&apos;ll get to draft 1 replacement from 5 players whose OVR is within 1 point of the player you moved.
              </p>
              <div className="mt-5 rounded-[22px] border border-rose-200/14 bg-rose-300/8 px-4 py-4 text-sm text-slate-100">
                The selected player leaves your run immediately, so this is a true swap instead of a free add. Think of it as a same-tier reshuffle, not a way to jump up in power.
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {runOwnedDisplayPlayers.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={tradePlayerForReplacement}
                    compact
                    compactScale={0.52}
                    draftedPlayerIds={runOwnedPlayerIds}
                    enableTeamChemistryPreview
                    actionLabel="Trade this player"
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "evolution-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Evolution Node</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Select 1 eligible version player from your run roster to evolve. The player will be replaced by their next stronger version for the rest of this run.
              </p>
              <div className="mt-5 rounded-[22px] border border-cyan-200/14 bg-cyan-300/8 px-4 py-4 text-sm text-slate-100">
                Evolution only works on players who already have a stronger version in the pool. If you found a lower version earlier, this is where it pays off.
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {getRoguelikeEvolutionOptions(runOwnedPlayers).map((option) => (
                  <DraftPlayerCard
                    key={option.currentPlayer.id}
                    player={runOwnedDisplayPlayerById.get(option.currentPlayer.id) ?? option.currentPlayer}
                    onSelect={evolveRunPlayer}
                    compact
                    compactScale={0.52}
                    draftedPlayerIds={runOwnedPlayerIds}
                    enableTeamChemistryPreview
                    actionLabel={`Evolve to ${option.nextPlayer.overall} OVR`}
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "faceoff-game" && activeNode && run.nodeResult?.faceoffResult && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Faceoff Result</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult.detail}</p>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-200/16 bg-emerald-300/8 p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/80">Your Team Total</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {run.nodeResult.faceoffResult.userTeamWinProbability}%
                  </div>
                </div>
                <div className="rounded-[24px] border border-rose-200/16 bg-rose-300/8 p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-rose-100/80">Boss Team Total</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {run.nodeResult.faceoffResult.opponentTeamWinProbability}%
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {run.nodeResult.faceoffResult.matchups.map((matchup) => (
                  <FaceoffMatchupRow
                    key={`${matchup.slot}-${matchup.userPlayer?.id ?? "empty"}-${matchup.opponentPlayer?.id ?? "boss"}`}
                    matchup={matchup}
                    trainedPlayerIds={run.trainedPlayerIds ?? []}
                    allStarBonusBadges={runAllStarBonusBadges}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={run.nodeResult?.passed ? continueAfterFaceoff : abortRun}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
              >
                {run.nodeResult?.passed ? "Continue" : "Try Again"}
                <ArrowRight size={16} />
              </button>
              {!run.nodeResult?.passed ? (
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white"
                >
                  Back to Home
                </button>
              ) : null}
            </div>
          )}

          {run.stage === "reward-draft" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Reward Draft</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult?.title ?? "Choose 1 reward"}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult?.detail}</p>
              <div
                className={clsx(
                  "mt-6 flex flex-wrap justify-center gap-3 overflow-visible px-1 pt-2 pb-3",
                  run.choices.length === 3
                    ? "mx-auto max-w-5xl"
                    : "",
                )}
              >
                {run.choices.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={draftChoice}
                    compact
                    compactScale={run.choices.length >= 5 ? 0.46 : 0.59}
                    draftedPlayerIds={runOwnedPlayerIds}
                    enableTeamChemistryPreview
                  />
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={skipRewardDraft}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Skip This Pick
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "node-result" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Update</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult?.title}</h2>
              {nodeResultReferencesDraftShuffle ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/18 bg-indigo-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-indigo-100">
                  <RefreshCcw size={14} />
                  Draft Shuffle Ticket
                </div>
              ) : null}
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult?.detail}</p>
              {run.nodeResult?.faceoffResult && nodeResultFinalScore ? (
                <>
                  <div className="mt-6 rounded-[26px] border border-emerald-100/16 bg-emerald-300/8 p-5">
                    <div className="text-center text-[10px] uppercase tracking-[0.24em] text-white/72">Final Score</div>
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                      <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                          {nodeResultDisplayNode?.opponentTeamName ?? "Boss Team"}
                        </div>
                        <div className="mt-3 text-4xl font-semibold leading-none text-white">
                          {nodeResultFinalScore.opponentScore}
                        </div>
                      </div>
                      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/46">
                        vs
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">Your Team</div>
                        <div className="mt-3 text-4xl font-semibold leading-none text-white">
                          {nodeResultFinalScore.userScore}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-sm text-white/74">
                      You won the faceoff against {nodeResultDisplayNode?.opponentTeamName ?? "the boss team"}.
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {run.nodeResult.faceoffResult.matchups.map((matchup) => (
                      <FaceoffMatchupRow
                        key={`${matchup.slot}-${matchup.userPlayer?.id ?? "empty"}-${matchup.opponentPlayer?.id ?? "boss"}`}
                        matchup={matchup}
                        trainedPlayerIds={run.trainedPlayerIds ?? []}
                        allStarBonusBadges={runAllStarBonusBadges}
                      />
                    ))}
                  </div>
                </>
              ) : null}
              <button
                type="button"
                onClick={continueAfterResult}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {(run.stage === "run-over" || run.stage === "run-cleared") && !reviewingFailedChallenge && (
            <div
              className={clsx(
                "rounded-[30px] border p-6 shadow-card",
                run.stage === "run-cleared"
                  ? "border-emerald-200/24 bg-[linear-gradient(135deg,rgba(6,41,31,0.98),rgba(11,63,48,0.96),rgba(6,28,51,0.95))]"
                  : "border-rose-200/24 bg-[linear-gradient(135deg,rgba(60,14,24,0.98),rgba(84,22,36,0.96),rgba(36,12,32,0.95))]",
              )}
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-300">
                {run.stage === "run-cleared" ? <Trophy size={15} /> : <Swords size={15} />}
                {run.stage === "run-cleared" ? "Run Cleared" : "Run Over"}
              </div>
              <h2 className="mt-3 font-display text-4xl text-white">
                {run.stage === "run-cleared" ? "You survived the gauntlet" : "The climb ended here"}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100/90">
                {run.nodeResult?.detail}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => startRun(run.packageId, run.settings)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
                >
                  Run It Back
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={clsx("space-y-6", (run.stage === "ladder-overview" || hideRightRail) && "hidden")}>
          {showDraftRosterRail ? (
            runRosterPanel
          ) : (
            <>
              <div className="glass-panel rounded-[30px] p-6 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Ladder</div>
                <div
                  className={clsx(
                    "mt-4 hidden items-end gap-3 pl-6 pr-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 xl:grid",
                    showCompactLadderRewards ? "grid-cols-[minmax(0,1fr)_200px]" : "grid-cols-1",
                  )}
                >
                  <div>Nodes</div>
                  {showCompactLadderRewards ? <div className="text-right">Rewards</div> : null}
                </div>
                <div className="relative mt-5 space-y-3 pl-6 before:absolute before:bottom-4 before:left-2.5 before:top-3 before:w-px before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06),rgba(255,255,255,0))]">
                  {runNodes.map((node, index) => {
                    const isCurrent = run.floorIndex === index && (
                      run.stage === "node-preview" ||
                      run.stage === "reward-draft" ||
                      run.stage === "node-result" ||
                      run.stage === "challenge-setup" ||
                      run.stage === "faceoff-setup" ||
                      run.stage === "faceoff-game"
                    );
                    const isCleared = run.floorIndex > index || run.stage === "run-cleared";
                          const rewards = getRoguelikeClearRewards(node, run.settings);
                    const lockerRoomCashReward = getRoguelikeLockerRoomCashReward(node);
                    const rewardsEarned =
                      (doesRoguelikeNodeAwardClearRewards(node) || lockerRoomCashReward > 0) &&
                      hasEarnedNodeReward(run, index, run.nodeResult);
                    const actTheme = getActLadderTheme(node.act);
                    const nodeTheme = getRoguelikeNodeTypeTheme(node.type);
                    const summary = node.targetLabel
                      ? { label: "Target", value: node.targetLabel }
                      : { label: "Reward", value: getRewardDraftTitle(node) };
                    return (
                      <div
                        key={node.id}
                        className={clsx(
                          "relative grid gap-3 pl-4",
                          showCompactLadderRewards ? "xl:grid-cols-[minmax(0,1fr)_200px] xl:items-stretch" : "grid-cols-1",
                        )}
                      >
                        <div
                          className={clsx(
                            "absolute left-[-1px] top-6 h-3.5 w-3.5 rounded-full border-4 border-[#090b12]",
                            isCleared ? "bg-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.4)]" : actTheme.accent,
                          )}
                        />
                        <div
                          className={clsx(
                            "relative overflow-hidden rounded-[22px] border px-4 py-4 transition",
                            isCurrent
                              ? actTheme.current
                              : isCleared
                                ? "border-emerald-300/45 bg-[linear-gradient(135deg,rgba(6,78,59,0.42),rgba(16,185,129,0.16),rgba(5,46,22,0.5))] shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_34px_rgba(16,185,129,0.2)]"
                                : actTheme.shell,
                          )}
                        >
                          {!isCleared ? (
                            <>
                              <div className={clsx("absolute inset-y-4 left-0 w-[3px] rounded-full bg-gradient-to-b", nodeTheme.accentLine)} />
                              <div className="pointer-events-none absolute right-4 top-4 h-14 w-14 rounded-full bg-white/[0.03] blur-2xl" />
                            </>
                          ) : null}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={clsx(
                                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                                  isCleared ? "border-emerald-200/24 bg-emerald-300/12 text-emerald-50" : nodeTheme.iconWrap,
                                )}
                              >
                                <nodeTheme.Icon size={16} className={clsx(isCleared ? "text-emerald-50" : nodeTheme.iconColor)} />
                              </div>
                              <div>
                                <div className={clsx(
                                  "text-[10px] uppercase tracking-[0.2em]",
                                  isCleared ? "text-emerald-100/90" : actTheme.eyebrow,
                                )}>
                                  Year {node.act} | Floor {node.floor}
                                </div>
                                <div className="mt-1 font-semibold text-white">{node.title}</div>
                                <div className="mt-2">
                                  <span className={clsx("rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]", isCleared ? "border-emerald-200/30 bg-emerald-300/12 text-emerald-50" : nodeTheme.chip)}>
                                    {nodeTheme.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              className={clsx(
                                "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]",
                                isCleared
                                  ? "border-emerald-200/35 bg-emerald-300/14 text-emerald-50"
                                  : "border-white/10 bg-black/20 text-slate-300",
                              )}
                            >
                              {isCleared ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <CheckCircle2 size={12} />
                                  Cleared
                                </span>
                              ) : (
                                nodeTheme.label
                              )}
                            </div>
                          </div>
                          <div
                            className={clsx(
                              "mt-3 rounded-[18px] border px-4 py-3",
                              isCleared ? "border-emerald-200/22 bg-emerald-300/10 text-emerald-50/94" : node.targetLabel ? nodeTheme.summary : actTheme.reward,
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={clsx("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-white", isCleared ? "border-emerald-200/18 bg-emerald-300/12" : nodeTheme.iconWrap)}>
                                <nodeTheme.Icon size={13} className={clsx(isCleared ? "text-emerald-50" : nodeTheme.iconColor)} />
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.22em] text-white/62">
                                  {summary.label}
                                </div>
                                <div className="mt-1 text-sm font-semibold leading-6 text-current">
                                  {summary.value}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {showCompactLadderRewards ? (
                          <RogueNodeRewardsRail rewards={rewards} lockerRoomCash={lockerRoomCashReward} earned={rewardsEarned} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {runRosterPanel}

              <div className="glass-panel rounded-[30px] p-6 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Player Pool</div>
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold text-white">Full pool is live from the start</div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">
                      Every eligible player for this run is already available from Floor 1. Later reward boards are controlled by node tier rules and your run settings.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {draggingIndex !== null && dragPointer ? (
        <div
          className="pointer-events-none fixed z-[120] w-[420px] max-w-[calc(100vw-32px)]"
          style={{
            left: dragPointer.x - dragPointer.offsetX,
            top: dragPointer.y - dragPointer.offsetY,
            transform: "rotate(-2deg) scale(1.01)",
            filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.45))",
          }}
        >
          <RogueRosterSlotCard
            slot={displayedRun.lineup[draggingIndex]}
            index={draggingIndex}
            ownedPlayerIds={runOwnedPlayerIds}
            trainedPlayerIds={run.trainedPlayerIds ?? []}
            allStarBonusBadges={runAllStarBonusBadges}
            dragged={false}
          />
        </div>
      ) : null}
      {shouldRenderOutcomeOverlay ? (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-[rgba(3,6,14,0.84)] px-4 py-3 backdrop-blur-md sm:px-5 sm:py-4">
          <div
            className={clsx(
              "relative mx-auto my-auto w-full overflow-y-auto rounded-[36px] border shadow-[0_28px_80px_rgba(0,0,0,0.46)]",
              "max-h-[calc(100vh-1.5rem)]",
              run.stage === "run-cleared"
                ? "max-w-[1560px] p-5 lg:p-6"
                : isFailureOverlay
                  ? "max-w-[1120px] p-4 sm:p-5 lg:p-6"
                  : "max-w-5xl p-5 sm:p-6 lg:p-8",
              outcomeTone === "failure"
                ? "border-rose-200/28 bg-[linear-gradient(135deg,rgba(95,14,30,0.99),rgba(150,24,41,0.97),rgba(63,8,24,0.99))]"
                : "border-emerald-200/24 bg-[linear-gradient(135deg,rgba(7,54,40,0.98),rgba(11,94,69,0.96),rgba(10,35,62,0.97))]",
            )}
          >
            <div
              className={clsx(
                "absolute inset-0",
                outcomeTone === "failure"
                  ? "bg-[radial-gradient(circle_at_top_right,rgba(254,202,202,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(248,113,113,0.18),transparent_35%)]"
                  : "bg-[radial-gradient(circle_at_top_right,rgba(187,247,208,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_38%)]",
              )}
            />
            <div className="relative">
              {run.stage === "run-cleared" ? (
                <>
                  <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-300/14 blur-3xl" />
                  <div className="absolute -left-8 bottom-10 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl" />
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/24 bg-amber-300/10 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.24em] text-amber-50/86">
                        <Crown size={15} />
                        Rogue Run Complete
                      </div>
                      <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,4rem)] leading-[0.94] text-white">
                        The G.O.A.T.s Are Down
                      </h2>
                      <p className="mt-2 max-w-3xl text-[13px] leading-6 text-white/82 lg:text-sm">
                        Year 3 Floor 61 is down. Your championship run is complete.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="rounded-full border border-white/14 bg-white/8 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/78">
                          Year 3 | Floor 61
                        </div>
                        <div className="rounded-full border border-emerald-200/16 bg-emerald-300/10 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] text-emerald-50/84">
                          Final Boss Cleared
                        </div>
                        <div className="rounded-full border border-amber-200/18 bg-amber-300/10 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] text-amber-50/84">
                          {finalStartingFivePlayers.length}/5 Starters Standing
                        </div>
                      </div>
                    </div>
                    <div className="grid w-full max-w-[520px] gap-2 sm:grid-cols-2">
                      <FinalVictoryStatCard
                        label="Team Overall"
                        value={formatVictoryMetric(metrics.overall)}
                        sublabel="Final starting five"
                        accentClassName="border-amber-200/18 bg-amber-300/10"
                      />
                      <FinalVictoryStatCard
                        label="Chemistry"
                        value={formatVictoryMetric(metrics.chemistry)}
                        sublabel="Closing synergy score"
                        accentClassName="border-emerald-200/18 bg-emerald-300/10"
                      />
                      <FinalVictoryStatCard
                        label="Team Offense"
                        value={formatVictoryMetric(metrics.offense)}
                        sublabel="Scoring pressure"
                        accentClassName="border-rose-200/18 bg-rose-300/10"
                      />
                      <FinalVictoryStatCard
                        label="Team Defense"
                        value={formatVictoryMetric(metrics.defense)}
                        sublabel="Stops and resistance"
                        accentClassName="border-sky-200/18 bg-sky-300/10"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2.5 xl:grid-cols-[1.08fr_0.92fr]">
                    <div className="rounded-[24px] border border-white/14 bg-[linear-gradient(135deg,rgba(7,13,26,0.8),rgba(16,24,44,0.74),rgba(12,36,31,0.7))] p-3.5 shadow-[0_24px_64px_rgba(0,0,0,0.28)]">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/72">
                        <Trophy size={15} />
                        Championship Snapshot
                      </div>
                      <div className="mt-1 text-[12px] leading-5 text-white/66">
                        Your closing five finished with {formatVictoryMetric(shotCreationScore)} shot creation pressure and enough balance to bring the run home.
                      </div>
                      {finalVictoryFaceoffScore ? (
                        <div className="mt-2.5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                          <div className="rounded-[18px] border border-white/12 bg-black/18 px-3 py-3 text-center">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/56">The G.O.A.T.s</div>
                            <div className="mt-2 text-[2rem] font-semibold leading-none text-white">
                              {finalVictoryFaceoffScore.opponentScore}
                            </div>
                          </div>
                          <div className="text-center text-sm font-semibold uppercase tracking-[0.28em] text-white/50">
                            vs
                          </div>
                          <div className="rounded-[18px] border border-emerald-200/18 bg-emerald-300/10 px-3 py-3 text-center">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-50/72">Your Team</div>
                            <div className="mt-2 text-[2rem] font-semibold leading-none text-white">
                              {finalVictoryFaceoffScore.userScore}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                        <FinalVictoryStatCard
                          label="Training Camps Used"
                          value={`${totalTrainingSessionsUsed}`}
                          sublabel="All camp boosts applied"
                          accentClassName="border-indigo-200/18 bg-indigo-300/10"
                        />
                        <FinalVictoryStatCard
                          label="Rebounding"
                          value={formatVictoryMetric(reboundingChallengeScore)}
                          sublabel="Current starting five"
                          accentClassName="border-fuchsia-200/18 bg-fuchsia-300/10"
                        />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-amber-200/16 bg-[linear-gradient(135deg,rgba(46,28,8,0.5),rgba(15,18,28,0.72),rgba(6,26,23,0.62))] p-3.5 shadow-[0_24px_64px_rgba(0,0,0,0.26)]">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-amber-50/82">
                        <Sparkles size={15} />
                        Total Run Rewards
                      </div>
                      <div className="mt-2.5 space-y-2">
                        <div className="rounded-[18px] border border-amber-200/16 bg-amber-300/10 p-3">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-50/72">
                            <Coins size={14} />
                            Tokens Earned
                          </div>
                          <div className="mt-1.5 text-[2rem] font-semibold leading-none text-white">+{finalVictoryRewards.tokens}</div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <FinalVictoryStatCard
                            label="Prestige XP"
                            value={`+${finalVictoryRewards.prestigeXp}`}
                            sublabel="Across the full run"
                            accentClassName="border-sky-200/18 bg-sky-300/10"
                          />
                          <FinalVictoryStatCard
                            label="Locker Room Cash"
                            value={`+${finalVictoryRewards.lockerRoomCash}`}
                            sublabel="Store cash earned"
                            accentClassName="border-emerald-200/18 bg-emerald-300/10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-white/14 bg-[linear-gradient(180deg,rgba(8,12,22,0.74),rgba(12,18,30,0.9))] p-3.5 shadow-[0_22px_56px_rgba(0,0,0,0.24)]">
                    <div className="flex flex-col gap-1.5 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.24em] text-white/68">Final Starting Five</div>
                        <div className="mt-1 text-[1.45rem] font-semibold text-white">The lineup that finished the climb</div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
                      {finalStartingFivePlayers.map((slot) => (
                        <FinalVictoryStarterCard
                          key={`${slot.slot}-${slot.player.id}`}
                          slot={slot}
                          player={slot.player}
                          ownedPlayerIds={runOwnedPlayerIds}
                          trainedPlayerIds={run.trainedPlayerIds ?? []}
                          allStarBonusBadges={runAllStarBonusBadges}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => startRun(run.packageId, run.settings)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Run It Back
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToHome}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                      Back to Home
                    </button>
                  </div>
                </>
              ) : (
                <>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/78">
                {outcomeTone === "failure" ? <Swords size={16} /> : <Trophy size={16} />}
                {run.stage === "run-over"
                  ? "Rogue Run Failed"
                  : outcomeTone === "failure"
                    ? "Node Failed"
                    : "Node Cleared"}
              </div>
              <h2 className={clsx(
                "mt-3 font-display leading-none text-white",
                isFailureOverlay
                  ? "text-[clamp(2.35rem,4vw,3.5rem)]"
                  : "text-[clamp(2.5rem,5vw,4.6rem)]",
              )}>
                {run.stage === "run-over"
                  ? "Run Failed"
                  : run.nodeResult?.title}
              </h2>
              {!(run.stage === "faceoff-game" && run.nodeResult?.faceoffResult) ? (
                <p className={clsx(
                  "max-w-4xl text-white/88",
                  isFailureOverlay ? "mt-4 text-sm leading-7 lg:text-base" : "mt-5 text-base leading-8 lg:text-lg",
                )}>
                  {run.nodeResult?.detail}
                </p>
              ) : null}

              {run.nodeResult?.challengeResult && (run.stage === "run-over" || run.stage === "reward-draft" || run.stage === "node-result") ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <div className={clsx(
                    "rounded-[26px] border p-5",
                    outcomeTone === "failure"
                      ? "border-rose-100/22 bg-rose-950/18"
                      : "border-emerald-100/20 bg-emerald-950/18",
                  )}>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/72">Challenge Result</div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {run.nodeResult.challengeResult.metricLabel} Check
                    </div>
                    <div className="mt-2 text-sm leading-7 text-white/76">
                      Your selected starting five {run.nodeResult.challengeResult.passed ? "cleared" : "missed"} the target.
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">Your Score</div>
                      <div className="mt-3 text-4xl font-semibold leading-none text-white">
                        {run.nodeResult.challengeResult.score}
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-amber-100/16 bg-amber-300/10 px-4 py-4 text-center">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/72">Target</div>
                      <div className="mt-3 text-4xl font-semibold leading-none text-white">
                        {run.nodeResult.challengeResult.target}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {run.stage === "faceoff-game" && run.nodeResult?.faceoffResult && faceoffFinalScore ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    <div className={clsx(
                      "rounded-[26px] border p-5",
                      outcomeTone === "failure"
                        ? "border-rose-100/22 bg-rose-950/18"
                        : "border-emerald-100/20 bg-emerald-950/18",
                    )}>
                      <div className="text-center text-[10px] uppercase tracking-[0.24em] text-white/72">Final Score</div>
                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                            {activeNode?.opponentTeamName ?? "Boss Team"}
                          </div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {faceoffFinalScore.opponentScore}
                          </div>
                        </div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/46">
                          vs
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                            Your Team
                          </div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {faceoffFinalScore.userScore}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center text-sm text-white/74">
                        You {run.nodeResult.passed ? "won" : "lost"} the faceoff against {activeNode?.opponentTeamName ?? "the boss team"}.
                      </div>
                    </div>
                  {run.nodeResult.passed ? (
                    <div className="rounded-[26px] border border-amber-100/18 bg-[linear-gradient(135deg,rgba(64,36,6,0.26),rgba(122,76,18,0.18),rgba(28,20,8,0.22))] p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/78">What You Earned</div>
                      <div className="mt-3 space-y-4">
                        <div className="rounded-[22px] border border-amber-100/16 bg-black/14 px-4 py-4">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/72">What Happens Next</div>
                          <div className="mt-2 text-2xl font-semibold text-white">
                            Claim your boss reward draft
                          </div>
                          <div className="mt-2 text-sm leading-7 text-white/76">
                            {activeNode?.id === "act-one-boss"
                              ? "Choose 1 of 3 Ruby version players and set up a future evolution upgrade."
                              : "Choose 1 reward player and strengthen your roster before the next node."}
                          </div>
                        </div>
                        {activeNodeShowsClearRewards && activeNodeClearRewards ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-amber-100/16 bg-amber-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-100/78">
                                <Coins size={14} />
                                Token Reward
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{activeNodeClearRewards.tokenReward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                                Tokens earned
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-sky-100/16 bg-sky-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-100/78">
                                <Sparkles size={14} />
                                Prestige XP
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{activeNodeClearRewards.prestigeXpAward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-100/72">
                                Progress earned
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {activeNodeLockerRoomCash > 0 ? (
                          <div className="rounded-[22px] border border-emerald-100/16 bg-emerald-300/10 px-4 py-4">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-emerald-100/78">
                              <Coins size={14} />
                              Locker Room Cash
                            </div>
                            <div className="mt-2 text-3xl font-semibold text-white">
                              +{activeNodeLockerRoomCash}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-100/72">
                              Mid-run store cash
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-white/16 bg-black/18 p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/72">What Happens Next</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        Run ends on this loss
                      </div>
                      <div className="mt-2 text-sm leading-7 text-white/74">
                        You were eliminated by {activeNode?.opponentTeamName ?? "the boss team"}. Failure rewards are still paid out below so the next run starts with more momentum.
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {run.stage === "node-result" && run.nodeResult?.passed && nodeResultDisplayNode ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  {run.nodeResult.faceoffResult && nodeResultFinalScore ? (
                    <div className="rounded-[26px] border border-emerald-100/20 bg-emerald-950/18 p-5">
                      <div className="text-center text-[10px] uppercase tracking-[0.24em] text-white/72">Final Score</div>
                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                            {nodeResultDisplayNode.opponentTeamName ?? "Boss Team"}
                          </div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {nodeResultFinalScore.opponentScore}
                          </div>
                        </div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/46">
                          vs
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">Your Team</div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {nodeResultFinalScore.userScore}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center text-sm text-white/74">
                        You won the faceoff against {nodeResultDisplayNode.opponentTeamName ?? "the boss team"}.
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-emerald-100/20 bg-emerald-950/18 p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/78">What Happened</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {run.nodeResult.title}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-white/76">
                        {run.nodeResult.detail}
                      </div>
                    </div>
                  )}
                  {nodeResultShowsRewardSummary ? (
                    <div className="rounded-[26px] border border-amber-100/18 bg-[linear-gradient(135deg,rgba(64,36,6,0.26),rgba(122,76,18,0.18),rgba(28,20,8,0.22))] p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/78">What You Earned</div>
                      <div className="mt-3 space-y-4">
                        {nodeResultHasRewardChoices && nodeResultRewardCopy ? (
                          <div className="rounded-[22px] border border-amber-100/16 bg-black/14 px-4 py-4">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/72">Reward Draft</div>
                            <div className="mt-2 text-2xl font-semibold text-white">
                              {nodeResultRewardCopy.title}
                            </div>
                            <div className="mt-2 text-sm leading-7 text-white/76">
                              {nodeResultRewardCopy.description}
                            </div>
                          </div>
                        ) : null}
                        {nodeResultReferencesDraftShuffle ? (
                          <div className="rounded-[22px] border border-indigo-100/16 bg-indigo-300/10 px-4 py-4">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-indigo-100/78">
                              <RefreshCcw size={14} />
                              Draft Shuffle Reward
                            </div>
                            <div className="mt-2 text-3xl font-semibold text-white">
                              +{nodeResultDisplayNode.draftShuffleReward ?? 0}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-indigo-100/72">
                              Tickets earned
                            </div>
                          </div>
                        ) : null}
                        {nodeResultShowsClearRewards && nodeResultClearRewards ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-amber-100/16 bg-amber-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-100/78">
                                <Coins size={14} />
                                Token Reward
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{nodeResultClearRewards.tokenReward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                                Tokens earned
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-sky-100/16 bg-sky-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-100/78">
                                <Sparkles size={14} />
                                Prestige XP
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{nodeResultClearRewards.prestigeXpAward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-100/72">
                                Progress earned
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {nodeResultLockerRoomCash > 0 ? (
                          <div className="rounded-[22px] border border-emerald-100/16 bg-emerald-300/10 px-4 py-4">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-emerald-100/78">
                              <Coins size={14} />
                              Locker Room Cash
                            </div>
                            <div className="mt-2 text-3xl font-semibold text-white">
                              +{nodeResultLockerRoomCash}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-100/72">
                              Mid-run store cash
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-white/16 bg-black/18 p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/72">What Happens Next</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        Return to the run ladder
                      </div>
                      <div className="mt-2 text-sm leading-7 text-white/74">
                        {nodeResultNextStepDescription}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {isFailureOverlay && run.nodeResult?.failureRewards ? (
                <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)]">
                  {failureAutopsyCards.length > 0 ? (
                    <div className="rounded-[28px] border border-sky-100/16 bg-[linear-gradient(135deg,rgba(7,18,34,0.92),rgba(16,28,50,0.72),rgba(12,18,32,0.94))] p-4 shadow-[0_20px_44px_rgba(0,0,0,0.18)] sm:p-5">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-sky-100/80">
                        <Target size={14} />
                        Run Autopsy
                      </div>
                      <div className="mt-2 text-sm leading-6 text-white/82">
                        A factual snapshot of the lineup that reached this loss.
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {failureAutopsyCards.map((card) => (
                          <div
                            key={card.title}
                            className="rounded-[22px] border border-sky-100/14 bg-black/18 px-4 py-3.5"
                          >
                            <div className="text-[10px] uppercase tracking-[0.2em] text-sky-100/70">
                              {card.title}
                            </div>
                            <div className="mt-3 space-y-2.5">
                              {card.rows.map((row) => (
                                <div key={`${card.title}-${row.label}`} className="flex items-start justify-between gap-3">
                                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/52">
                                    {row.label}
                                  </div>
                                  <div className="max-w-[65%] text-right text-sm leading-6 text-white/88">
                                    {row.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[28px] border border-amber-100/18 bg-[linear-gradient(135deg,rgba(20,8,16,0.36),rgba(84,36,18,0.22),rgba(16,10,20,0.28))] p-4 shadow-[0_20px_44px_rgba(0,0,0,0.18)] sm:p-5">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-amber-100/78">
                      What You Keep
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/84">
                      This run is over, but its progression still banks into the next attempt.
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-[22px] border border-amber-100/18 bg-amber-300/10 p-4">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-100/78">
                          <Coins size={14} />
                          Token Reward
                        </div>
                        <div className="mt-2 text-3xl font-semibold text-white">
                          +{run.nodeResult.failureRewards.tokenReward}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                          Tokens added
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-sky-100/18 bg-sky-300/10 p-4">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-100/78">
                          <Sparkles size={14} />
                          Prestige XP
                        </div>
                        <div className="mt-2 text-3xl font-semibold text-white">
                          +{run.nodeResult.failureRewards.prestigeXpAward}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-100/72">
                          Progress saved
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={clsx("flex flex-col gap-3 sm:flex-row sm:flex-wrap", isFailureOverlay ? "mt-6" : "mt-8")}>
                {run.stage === "run-over" ? (
                    <>
                      {run.failureReviewStage === "challenge-setup" ? (
                        <button
                          type="button"
                          onClick={reviewFailedChallenge}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-rose-50"
                        >
                          See Results
                          <ArrowRight size={16} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={abortRun}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-rose-50"
                      >
                        Try Again
                        <ArrowRight size={16} />
                      </button>
                    <button
                      type="button"
                      onClick={handleBackToHome}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                      Back to Home
                    </button>
                  </>
                ) : run.stage === "faceoff-game" ? (
                  run.nodeResult?.passed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowOutcomeOverlay(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        See Results
                        <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={continueAfterFaceoff}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        Claim Reward
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowOutcomeOverlay(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        See Results
                        <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={abortRun}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={handleBackToHome}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        Back to Home
                      </button>
                    </>
                  )
                ) : run.stage === "reward-draft" ? (
                  <>
                    <button
                      type="button"
                      onClick={openChallengeResults}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                      See Results
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOutcomeOverlay(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Continue to Reward Draft
                      <ArrowRight size={16} />
                    </button>
                  </>
                ) : run.stage === "node-result" ? (
                  <>
                    <button
                      type="button"
                      onClick={run.nodeResult?.challengeResult ? openChallengeResults : () => setShowOutcomeOverlay(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                      See Results
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={continueAfterResult}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={continueAfterResult}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

