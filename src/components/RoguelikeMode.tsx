import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Handshake,
  Package2,
  PillBottle,
  Pause,
  Play,
  RefreshCcw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { DraftPlayerCard } from "./DraftPlayerCard";
import { DynamicDuoBadge } from "./DynamicDuoBadge";
import { CardLabCoachCard } from "./CardLabCoachCard";
import { CardLabCoachRunRosterCard } from "./CardLabCoachRunRosterCard";
import { PlayerTypeBadges, playerTypeBadgeStyleClass, renderPlayerTypeBadgeIcon } from "./PlayerTypeBadges";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { RunRosterPlayerCard } from "./RunRosterPlayerCard";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { allPlayers } from "../data/players";
import { getNbaTeamByName } from "../data/nbaTeams";
import { assignPlayerToRoster } from "../lib/draft";
import { getPlayerDisplayLines } from "../lib/playerDisplay";
import { getPlayerTier, getPlayerTierLabel, playerTierRunRosterSurfaceStyles } from "../lib/playerTier";
import { getPlayerArchetypeBehaviorProfile } from "../lib/playerArchetypeBehavior";
import { mulberry32 } from "../lib/random";
import { getPlayerTeamKey, getSameTeamChemistryBonusForPlayer } from "../lib/teamChemistry";
import {
  buildRoguelikeOpponentLineup,
  buildOpeningDraftPool,
  doesRoguelikeNodeAwardClearRewards,
  getRoguelikeClearRewards,
  getRoguelikeFailureRewards,
  buildRoguelikeStarterLineup,
  DEFAULT_ROGUELIKE_RUN_SETTINGS,
  drawRoguelikeStarterRevealPlayers,
  drawRoguelikeCoachChoices,
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
  getRoguelikeDisplayOverallBonus,
  getRoguelikeSlotPenalty,
  generateFaceoffOpponentPlayerIds,
  getRoguelikePlayerTypeBadges,
  getRoguelikeCoachById,
  getRoguelikeCoachTeamKey,
  RoguelikeClearRewards,
  RoguelikeBonusBadgeAssignment,
  RoguelikeCoach,
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
  | "coach-select"
  | "coaching-change"
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
  | "special-stuff"
  | "new-position-training";

type SimulationTeam = "user" | "opponent";
type StarterPackUpgrade = "standard" | "silver" | "gold" | "platinum";
type AllStarEventKey =
  | "dunkContest"
  | "threePointContest"
  | "skillsChallenge"
  | "risingStarGame"
  | "allStarGame";

type AllStarAssignments = Record<AllStarEventKey, string | null>;

interface RoguelikeSimulationScore {
  user: number;
  opponent: number;
}

interface RoguelikeSimulationQuarterScore extends RoguelikeSimulationScore {
  quarter: 1 | 2 | 3 | 4;
}

interface RoguelikeSimulationPlayerStat {
  playerId: string;
  playerName: string;
  team: SimulationTeam;
  slot: RosterSlot["slot"];
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
}

interface RoguelikeSimulationEvent {
  id: string;
  quarter: 1 | 2 | 3 | 4;
  gameClockSeconds: number;
  playbackMs: number;
  team: SimulationTeam;
  points: 1 | 2 | 3;
  playerId: string;
  assistPlayerId?: string;
  description: string;
}

interface RoguelikeGameSimulationResult {
  id: string;
  durationMs: number;
  finalScore: RoguelikeSimulationScore;
  quarterBreakdown: RoguelikeSimulationQuarterScore[];
  playerStats: RoguelikeSimulationPlayerStat[];
  timeline: RoguelikeSimulationEvent[];
}

interface SimulationFitProfile {
  scoringMultiplier: number;
  assistMultiplier: number;
  shotQualityLift: number;
  turnoverMultiplier: number;
}

interface RoguelikeRun {
  ladderVersion?: number;
  seed: number;
  packageId: RoguelikeStarterPackageId;
  settings: RoguelikeRunSettings;
  coachRecruitmentUnlocked?: boolean;
  starterRevealTargetAverage?: number;
  roster: Player[];
  lineup: RosterSlot[];
  availablePool: Player[];
  seenChoicePlayerIds: string[];
  choices: Player[];
  starterRevealPlayers: Player[];
  coachChoices: RoguelikeCoach[];
  hiredCoachId: string | null;
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
  specialStuffInventoryCount: number;
  activeSpecialStuffPlayerId: string | null;
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[];
  pendingChoiceSelection?: "training" | "trade" | null;
  selectedCutPlayerIds: string[];
  selectedNaturalPositionPlayerId: string | null;
  selectedNaturalPosition: Position | null;
  allStarAssignments: AllStarAssignments;
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
    simulationResult?: RoguelikeGameSimulationResult | null;
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
  ownedCoachRecruitment: number;
  onLeaveRun: () => void;
  onBackToHome: () => void;
  onAwardFailureRewards: (prestigeXpAward: number) => void;
  onUpdatePersonalBests: (nextValues: Partial<RoguePersonalBests>) => void;
  onUseTrainingCampTicket: () => boolean;
  onUseTradePhone: () => boolean;
  onUseSilverStarterPack: () => boolean;
  onUseGoldStarterPack: () => boolean;
  onUsePlatinumStarterPack: () => boolean;
  cloudSavedRunData?: unknown | null;
  onCloudSaveRun?: (run: RoguelikeRun) => void;
  onCloudDeleteRun?: () => void;
}

const ROGUELIKE_STORAGE_KEY = "legends-draft-roguelike-run-v1";
const ROGUELIKE_PARKED_STORAGE_KEY = "legends-draft-roguelike-parked-v1";
const CURRENT_ROGUELIKE_LADDER_VERSION = 4;

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

const LOCKER_ROOM_SPECIAL_STUFF_NODE: RoguelikeNode = {
  id: "locker-room-special-stuff",
  floor: 0,
  act: 0,
  type: "training",
  title: "Special Stuff",
  description: "Choose 1 player to gain +3 OVR for the next boss battle only.",
  rewardBundleId: "elite-closers",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain +3 OVR for the next boss battle only",
};

const SPECIAL_STUFF_BOOST_AMOUNT = 3;

const LOCKER_ROOM_ITEM_PRICES: Record<LockerRoomItemId, number> = {
  "advanced-scouting": 24,
  "draft-shuffle-ticket": 30,
  "training-camp-ticket": 42,
  "practice-shooting": 22,
  "practice-rebounding": 22,
  "practice-defense": 22,
  "practice-playmaking": 22,
  "practice-offense": 22,
  "special-stuff": 12,
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

const STARTER_PACK_UPGRADE_OPTIONS: Array<{
  value: StarterPackUpgrade;
  label: string;
  detail: string;
  targetAverage: number;
}> = [
  { value: "standard", label: "Standard", detail: "Default starter reveal", targetAverage: 80 },
  { value: "silver", label: "Silver", detail: "Raises starter reveal target", targetAverage: 81 },
  { value: "gold", label: "Gold", detail: "Stronger upgraded opener", targetAverage: 82 },
  { value: "platinum", label: "Platinum", detail: "Best upgraded starter reveal", targetAverage: 83 },
];

const DEFAULT_ALL_STAR_ASSIGNMENTS: AllStarAssignments = {
  dunkContest: null,
  threePointContest: null,
  skillsChallenge: null,
  risingStarGame: null,
  allStarGame: null,
};

const ALL_STAR_EVENT_CARDS: Array<{
  key: AllStarEventKey;
  title: string;
  stat: string;
  badgeType: PlayerTypeBadge;
}> = [
  {
    key: "dunkContest",
    title: "Dunk Contest",
    stat: "Slasher badge",
    badgeType: "slasher",
  },
  {
    key: "threePointContest",
    title: "3PT Shootout",
    stat: "Sniper badge",
    badgeType: "sniper",
  },
  {
    key: "skillsChallenge",
    title: "Skills Challenge",
    stat: "Playmaker badge",
    badgeType: "playmaker",
  },
  {
    key: "risingStarGame",
    title: "Rising Star Game",
    stat: "Board Man badge",
    badgeType: "board-man",
  },
  {
    key: "allStarGame",
    title: "All-Star Game",
    stat: "Lockdown badge",
    badgeType: "lockdown",
  },
];

const isAllStarEventKey = (value: string | null): value is AllStarEventKey =>
  Boolean(value && ALL_STAR_EVENT_CARDS.some((eventCard) => eventCard.key === value));

const LOCKER_ROOM_SELECTION_NODE_IDS = new Set<string>([
  LOCKER_ROOM_TRAINING_NODE.id,
  LOCKER_ROOM_PRACTICE_SHOOTING_NODE.id,
  LOCKER_ROOM_PRACTICE_REBOUNDING_NODE.id,
  LOCKER_ROOM_PRACTICE_DEFENSE_NODE.id,
  LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE.id,
  LOCKER_ROOM_PRACTICE_OFFENSE_NODE.id,
  LOCKER_ROOM_SPECIAL_STUFF_NODE.id,
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

const getStarterPackAverageForUpgrade = (upgrade: StarterPackUpgrade) => {
  if (upgrade === "silver") return 81;
  if (upgrade === "gold") return 82;
  if (upgrade === "platinum") return 83;
  return 80;
};

const getBestOwnedStarterPackUpgrade = ({
  ownedSilverStarterPacks,
  ownedGoldStarterPacks,
  ownedPlatinumStarterPacks,
}: {
  ownedSilverStarterPacks: number;
  ownedGoldStarterPacks: number;
  ownedPlatinumStarterPacks: number;
}): StarterPackUpgrade => {
  if (ownedPlatinumStarterPacks > 0) return "platinum";
  if (ownedGoldStarterPacks > 0) return "gold";
  if (ownedSilverStarterPacks > 0) return "silver";
  return "standard";
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

const getLegacyRoguelikeNodesForSettings = (
  settings: RoguelikeRunSettings,
  ladderVersion: number,
  enableCoachRecruitment: boolean,
) =>
  getRoguelikeNodesForSettings(settings, { enableCoachRecruitment })
    .filter((node) => ladderVersion >= 4 || !node.requiresCoachRecruitment)
    .filter((node) => ladderVersion >= 3 || node.type !== "coaching-change")
    .filter((node) => ladderVersion >= 2 || node.type !== "locker-room")
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
  ladderVersion: number,
  enableCoachRecruitment: boolean,
) => {
  const currentNodes = getRoguelikeNodesForSettings(settings, { enableCoachRecruitment });
  const legacyNodes = getLegacyRoguelikeNodesForSettings(settings, ladderVersion, enableCoachRecruitment);
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
  const coachRecruitmentUnlocked = Boolean(parsed.coachRecruitmentUnlocked && settings.enableCoaches);
  const currentRunNodes = getRoguelikeNodesForSettings(settings, {
    enableCoachRecruitment: coachRecruitmentUnlocked,
  });
  const runPlayerUniverse = getRoguelikePlayerUniverse(settings);
  const normalizedStage =
    (parsed.stage === "coach-select" || parsed.stage === "coaching-change") && !settings.enableCoaches
      ? "ladder-overview"
      : parsed.stage;
  const migratedFloorIndex =
    ladderVersion >= CURRENT_ROGUELIKE_LADDER_VERSION
      ? parsed.floorIndex ?? 0
      : migrateLegacyFloorIndex(parsed.floorIndex, settings, ladderVersion, coachRecruitmentUnlocked);
  const starterRevealTargetAverage = parsed.starterRevealTargetAverage ?? 80;
  const starterRevealPlayers =
    normalizedStage === "starter-reveal"
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
  const coachChoices =
    (normalizedStage === "coach-select" || normalizedStage === "coaching-change") && settings.enableCoaches
      ? (parsed.coachChoices && parsed.coachChoices.length > 0
          ? parsed.coachChoices
          : drawRoguelikeCoachChoices(
              normalizedStage === "coaching-change"
                ? nextChoiceSeed(parsed.seed, 900 + (migratedFloorIndex ?? 0) * 31)
                : parsed.seed + 702,
              settings,
              5,
              normalizedStage === "coaching-change" && parsed.hiredCoachId ? [parsed.hiredCoachId] : [],
            ))
      : parsed.coachChoices ?? [];

  return {
    ladderVersion: CURRENT_ROGUELIKE_LADDER_VERSION,
    seed: parsed.seed,
    packageId: parsed.packageId,
    settings,
    coachRecruitmentUnlocked,
    starterRevealTargetAverage,
    roster: parsed.roster ?? [],
    lineup: parsed.lineup ?? buildRoguelikeStarterLineup([]),
    availablePool: runPlayerUniverse,
    seenChoicePlayerIds: parsed.seenChoicePlayerIds ?? [],
    choices: parsed.choices ?? [],
    starterRevealPlayers,
    coachChoices,
    hiredCoachId: parsed.hiredCoachId ?? null,
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
    specialStuffInventoryCount: parsed.specialStuffInventoryCount ?? 0,
    activeSpecialStuffPlayerId: parsed.activeSpecialStuffPlayerId ?? null,
    allStarBonusBadges: parsed.allStarBonusBadges ?? [],
    pendingChoiceSelection: parsed.pendingChoiceSelection ?? null,
    selectedCutPlayerIds: parsed.selectedCutPlayerIds ?? [],
    selectedNaturalPositionPlayerId: parsed.selectedNaturalPositionPlayerId ?? null,
    selectedNaturalPosition: parsed.selectedNaturalPosition ?? null,
    allStarAssignments: {
      ...DEFAULT_ALL_STAR_ASSIGNMENTS,
      ...(parsed.allStarAssignments ?? {}),
    },
    utilityReturnState: parsed.utilityReturnState
      ? {
          ...parsed.utilityReturnState,
          activeNode: mapStoredNodeToCurrentLadder(parsed.utilityReturnState.activeNode, currentRunNodes),
        }
      : null,
    failureReviewStage: parsed.failureReviewStage ?? null,
    stage: normalizedStage ?? "package-select",
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

const getSpecialStuffTrainingIds = (playerId: string | null | undefined) =>
  playerId ? Array.from({ length: SPECIAL_STUFF_BOOST_AMOUNT }, () => playerId) : [];

const getEffectiveBossTrainedPlayerIds = (run: Pick<RoguelikeRun, "trainedPlayerIds" | "activeSpecialStuffPlayerId">) => [
  ...(run.trainedPlayerIds ?? []),
  ...getSpecialStuffTrainingIds(run.activeSpecialStuffPlayerId),
];

const getCoachBoostForPlayer = (player: Player, coachTeamKey: string | null = null) =>
  coachTeamKey && getPlayerTeamKey(player) === coachTeamKey ? 1 : 0;

const getTradePreviewOverall = (
  player: Player,
  nextOwnedPlayerIds: string[] = [],
  coachTeamKey: string | null = null,
) => {
  const previewOwnedPlayerIds = nextOwnedPlayerIds.includes(player.id)
    ? nextOwnedPlayerIds
    : [...nextOwnedPlayerIds, player.id];

  return player.overall + getRoguelikeDisplayOverallBonus(player, previewOwnedPlayerIds, [], coachTeamKey);
};

const PLAYER_IDENTITY_SUFFIX_PATTERN = /\s\([^)]*\)$/;

const getRunPlayerIdentityKey = (player: Player) =>
  player.name.replace(PLAYER_IDENTITY_SUFFIX_PATTERN, "").trim().toLowerCase();

const isPlayerIdentityOnRoster = (player: Player, roster: Player[]) => {
  const identity = getRunPlayerIdentityKey(player);
  return roster.some((owned) => owned.id === player.id || getRunPlayerIdentityKey(owned) === identity);
};

const hasRosterDuplicateChoice = (choices: Player[], roster: Player[]) =>
  choices.some((choice) => isPlayerIdentityOnRoster(choice, roster));

const getRunPlayerTypeBadgeOverrides = (
  player: Player | null,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => (player ? getRoguelikePlayerTypeBadges(player, allStarBonusBadges) : []);

const getRunDisplayPlayer = (
  player: Player,
  ownedPlayerIds: string[] = [],
  trainedPlayerIds: string[] = [],
  coachTeamKey: string | null = null,
) => {
  const trainingCount = getTrainingCountForPlayer(player.id, trainedPlayerIds);
  const displayOverallBonus = getRoguelikeDisplayOverallBonus(player, ownedPlayerIds, trainedPlayerIds, coachTeamKey);
  if (trainingCount === 0 && displayOverallBonus === 0) return player;

  return {
    ...player,
    overall: player.overall + displayOverallBonus,
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

const autoPromoteAddedPlayerIntoStartingLineup = (
  lineup: RosterSlot[],
  addedPlayer: Player,
  getPromotionOverall: (player: Player) => number = (player) => player.overall,
) => {
  const nextLineup = lineup.map((slot) => ({ ...slot }));
  const benchIndex = nextLineup.findIndex((slot, index) => index >= 5 && slot.player?.id === addedPlayer.id);
  const addedPlayerOverall = getPromotionOverall(addedPlayer);

  if (benchIndex === -1) {
    return compactBenchSlots(nextLineup);
  }

  const eligibleStarterIndex = nextLineup
    .slice(0, 5)
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => isNaturalFitForSlot(addedPlayer, slot))
    .filter(({ slot }) => {
      const starter = slot.player;
      return !starter || getPromotionOverall(starter) < addedPlayerOverall;
    })
    .sort((a, b) => {
      const aStarterOverall = a.slot.player ? getPromotionOverall(a.slot.player) : -Infinity;
      const bStarterOverall = b.slot.player ? getPromotionOverall(b.slot.player) : -Infinity;
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

const getNodePlayerPool = (
  node: RoguelikeNode | null,
  pool: Player[],
  fallbackPool: Player[],
  coachTeamKey: string | null = null,
) => {
  const applyNodeFilters = (source: Player[]) =>
    source
      .filter((player) =>
        node?.allowedRewardTiers?.length ? node.allowedRewardTiers.includes(getPlayerTier(player)) : true,
      )
      .filter((player) => (node?.coachTeamOnly ? getPlayerTeamKey(player) === coachTeamKey : true));

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
  coachTeamKey: string | null = null,
) => {
  const minimumOverall = tradedOverall - 1;
  const maximumOverall = tradedOverall + 1;
  const nextOwnedPlayerIds = nextRoster.map((player) => player.id);
  const eligiblePool = getNodePlayerPool(node, pool, fallbackPool).filter(
    (candidate) => candidate.id !== outgoingPlayerId && !isPlayerIdentityOnRoster(candidate, nextRoster),
  );
    const seenIds = new Set<string>();
    const seenIdentities = new Set<string>();
    return [...eligiblePool, ...pool, ...fallbackPool].filter((candidate) => {
      if (candidate.id === outgoingPlayerId) return false;
      if (isPlayerIdentityOnRoster(candidate, nextRoster)) return false;
      const candidatePreviewOverallWithCoach = getTradePreviewOverall(candidate, nextOwnedPlayerIds, coachTeamKey);
      if (candidatePreviewOverallWithCoach < minimumOverall || candidatePreviewOverallWithCoach > maximumOverall) {
        return false;
      }
    if (seenIds.has(candidate.id)) return false;
    const identity = getRunPlayerIdentityKey(candidate);
    if (seenIdentities.has(identity)) return false;
    seenIds.add(candidate.id);
    seenIdentities.add(identity);
    return true;
  });
};

const drawTradeReplacementChoices = (
  tradeReplacementPool: Player[],
  nextRoster: Player[],
  count: number,
  seed: number,
  tradedOverall: number,
  coachTeamKey: string | null = null,
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
  const choiceIdentities = new Set(initialChoices.map(getRunPlayerIdentityKey));
  const adjustedChoices = [...initialChoices];
  const desiredOveralls = [tradedOverall + 1, tradedOverall, tradedOverall - 1];

    desiredOveralls.forEach((desiredOverall) => {
      const hasDesiredOverall = adjustedChoices.some(
        (choice) => getTradePreviewOverall(choice, nextOwnedPlayerIds, coachTeamKey) === desiredOverall,
      );
    if (hasDesiredOverall) return;

      const replacement = shuffledPool.find(
        (candidate) =>
          getTradePreviewOverall(candidate, nextOwnedPlayerIds, coachTeamKey) === desiredOverall &&
          !choiceIds.has(candidate.id) &&
          !choiceIdentities.has(getRunPlayerIdentityKey(candidate)) &&
          !isPlayerIdentityOnRoster(candidate, nextRoster),
      );
    if (!replacement) return;

      const replacementIndex = adjustedChoices.findIndex(
        (choice) =>
          getTradePreviewOverall(choice, nextOwnedPlayerIds, coachTeamKey) !== desiredOverall &&
          !desiredOveralls.some(
            (overall) =>
              overall !== desiredOverall &&
              getTradePreviewOverall(choice, nextOwnedPlayerIds, coachTeamKey) === overall,
          ),
      );

    const fallbackIndex =
        replacementIndex >= 0
          ? replacementIndex
          : adjustedChoices.findIndex(
              (choice) => getTradePreviewOverall(choice, nextOwnedPlayerIds, coachTeamKey) !== desiredOverall,
            );

    if (fallbackIndex < 0) return;

    choiceIds.delete(adjustedChoices[fallbackIndex].id);
    choiceIdentities.delete(getRunPlayerIdentityKey(adjustedChoices[fallbackIndex]));
    adjustedChoices[fallbackIndex] = replacement;
    choiceIds.add(replacement.id);
    choiceIdentities.add(getRunPlayerIdentityKey(replacement));
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

const shouldStrictlyUseNodePool = (node: RoguelikeNode | null) => Boolean(node?.coachTeamOnly);

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
    "coaching-change": {
      label: "Coaching Change",
      Icon: Handshake,
      chip: "border-cyan-200/18 bg-cyan-300/10 text-cyan-100",
      iconWrap: "border-cyan-200/22 bg-cyan-300/12",
      iconColor: "text-cyan-100",
      accentLine: "from-cyan-300/90 via-emerald-300/30 to-transparent",
      summary:
        "border-cyan-200/22 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(15,23,42,0.86),rgba(16,185,129,0.14))] text-cyan-50",
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

  return getNodePlayerPool(node, pool, fallbackPool, getRoguelikeCoachTeamKey(run.hiredCoachId));
};

const getRewardDraftTitle = (node: RoguelikeNode) => {
  if (node.id === "act-one-boss" || node.id === "act-one-boss-current") {
    return "Version player reward";
  }

  if (node.coachTeamOnly) {
    return "Coach recruitment";
  }

  if (node.rewardChoices > 0) {
    return "Reward draft";
  }

  return "Node reward";
};

const getRewardDraftDescription = (node: RoguelikeNode, choiceCount = node.rewardChoices) => {
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

  if (node.coachTeamOnly) {
    if (choiceCount <= 0) {
      return "No eligible coach-team players are available for this board with the current run settings.";
    }
    return `Your coach's network is active. Choose 1 of ${choiceCount} ${tierLabel} players from your coach's NBA team.`;
  }

  if (node.rewardChoices > 0) {
    return `Choose 1 of ${choiceCount} ${tierLabel} players for your run roster.`;
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

  if (node.type === "coaching-change") {
    return {
      title: "Coaching decision",
      description: "Re-sign your current coach to keep the same team boost, or fire them and hire a new coach to change which team gets +1 OVR.",
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
  coachTeamKey: string | null = null,
) => {
  if (!slot.player) return 0;

  if (metric === "overall") {
    return (
      Math.round(
        getRoguelikeAdjustedOverallForSlot(
          slot.player,
          slot,
          ownedPlayerIds,
          trainedPlayerIds,
          coachTeamKey,
        ) * 10,
      ) / 10
    );
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

const SIMULATION_DURATION_MS = 42_000;
const QUARTER_SECONDS = 12 * 60;
const SIMULATION_QUARTERS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

const formatGameClock = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.min(QUARTER_SECONDS, Math.round(seconds)));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatPercentage = (made: number, attempted: number) =>
  attempted > 0 ? `${Math.round((made / attempted) * 100)}%` : "0%";

const getSimulationPlayerLabel = (player: Player) =>
  player.name.replace(/\s*\([^)]*\)\s*$/, "").trim();

const distributeIntegerTotal = (total: number, weights: number[]) => {
  const safeTotal = Math.max(0, Math.round(total));
  if (weights.length === 0) return [];

  const positiveWeights = weights.map((weight) => Math.max(0.01, weight));
  const weightTotal = positiveWeights.reduce((sum, weight) => sum + weight, 0);
  const rawShares = positiveWeights.map((weight) => (safeTotal * weight) / weightTotal);
  const floors = rawShares.map(Math.floor);
  let remaining = safeTotal - floors.reduce((sum, value) => sum + value, 0);
  const order = rawShares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((left, right) => right.remainder - left.remainder);

  order.forEach(({ index }) => {
    if (remaining <= 0) return;
    floors[index] += 1;
    remaining -= 1;
  });

  return floors;
};

const pickWeightedIndex = (weights: number[], rng: () => number, blockedIndex: number | null = null) => {
  const safeWeights = weights.map((weight, index) =>
    index === blockedIndex ? 0 : Math.max(0, weight),
  );
  const total = safeWeights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return safeWeights.findIndex((_, index) => index !== blockedIndex);

  let cursor = rng() * total;
  for (let index = 0; index < safeWeights.length; index += 1) {
    cursor -= safeWeights[index];
    if (cursor <= 0) return index;
  }

  return Math.max(0, safeWeights.length - 1);
};

const getPlayerSimulationBadges = (
  player: Player,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => getRoguelikePlayerTypeBadges(player, allStarBonusBadges).map((badge) => badge.type);

const DEFAULT_SIMULATION_FIT_PROFILE: SimulationFitProfile = {
  scoringMultiplier: 1,
  assistMultiplier: 1,
  shotQualityLift: 0,
  turnoverMultiplier: 1,
};

const getSimulationFitSupportScore = (
  breakdown: RoguelikeFaceoffResult["matchups"][number]["userBreakdown"],
) =>
  breakdown.chemistrySupport * 0.7 +
  breakdown.teamProfileSupport * 0.35 +
  breakdown.lineupBalanceBonus * 0.55 +
  breakdown.badgeMatchupBonus * 0.45;

const buildSimulationFitProfiles = (
  matchups: RoguelikeFaceoffResult["matchups"],
  side: SimulationTeam,
) => {
  const entries = matchups
    .map((matchup) => {
      const player = side === "user" ? matchup.userPlayer : matchup.opponentPlayer;
      const breakdown = side === "user" ? matchup.userBreakdown : matchup.opponentBreakdown;
      return player
        ? {
            playerId: player.id,
            supportScore: getSimulationFitSupportScore(breakdown),
          }
        : null;
    })
    .filter((entry): entry is { playerId: string; supportScore: number } => Boolean(entry));

  if (entries.length === 0) return new Map<string, SimulationFitProfile>();

  const averageSupport =
    entries.reduce((sum, entry) => sum + entry.supportScore, 0) / entries.length;

  return new Map(
    entries.map((entry) => {
      const relativeFit = entry.supportScore - averageSupport;
      return [
        entry.playerId,
        {
          scoringMultiplier: Math.max(0.92, Math.min(1.1, 1 + relativeFit * 0.035)),
          assistMultiplier: Math.max(0.94, Math.min(1.08, 1 + relativeFit * 0.025)),
          shotQualityLift: Math.max(-0.015, Math.min(0.018, relativeFit * 0.004)),
          turnoverMultiplier: Math.max(0.9, Math.min(1.1, 1 - relativeFit * 0.025)),
        },
      ];
    }),
  );
};

const getSimulationScoringWeight = (
  player: Player,
  matchupRating: number,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
  fitProfile: SimulationFitProfile = DEFAULT_SIMULATION_FIT_PROFILE,
) => {
  const badges = getPlayerSimulationBadges(player, allStarBonusBadges);
  const behavior = getPlayerArchetypeBehaviorProfile(player, badges);
  return (
    (
      Math.max(1, player.overall - 60) * 1.15 +
      Math.max(1, player.offense - 58) * 0.72 +
      Math.max(1, player.shooting - 58) * (badges.includes("sniper") ? 0.38 : 0.2) +
      Math.max(1, player.athleticism - 58) * (badges.includes("slasher") ? 0.3 : 0.12) +
      Math.max(0, matchupRating - 80) * 0.75
    ) * behavior.scoringWeightMultiplier * fitProfile.scoringMultiplier
  );
};

const getStarAnchoredScoringWeights = (
  players: Player[],
  baseWeights: number[],
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => {
  if (players.length === 0) return baseWeights;

  const overalls = players.map((player) => player.overall);
  const topOverall = Math.max(...overalls);
  const topIndex = overalls.findIndex((overall) => overall === topOverall);
  if (topIndex < 0) return baseWeights;

  const secondOverall = overalls
    .filter((_, index) => index !== topIndex)
    .reduce((best, overall) => Math.max(best, overall), 0);
  const averageOverall = overalls.reduce((sum, overall) => sum + overall, 0) / overalls.length;
  const topGap = Math.max(0, topOverall - secondOverall);
  const averageGap = Math.max(0, topOverall - averageOverall);
  const topBehavior = getPlayerArchetypeBehaviorProfile(
    players[topIndex]!,
    getPlayerSimulationBadges(players[topIndex]!, allStarBonusBadges),
  );
  const topMultiplier =
    (1.18 + Math.min(1.65, topGap * 0.16 + averageGap * 0.09)) *
    topBehavior.starShareMultiplier;

  return baseWeights.map((weight, index) => {
    if (index === topIndex) return weight * topMultiplier;

    const playerGap = Math.max(0, topOverall - (players[index]?.overall ?? topOverall));
    const supportTrim = Math.min(0.24, playerGap * 0.018);
    return weight * (1 - supportTrim);
  });
};

const getSimulationScoringTargets = (
  teamPoints: number,
  players: Player[],
  scoringWeights: number[],
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const anchoredWeights = getStarAnchoredScoringWeights(
    players,
    scoringWeights,
    allStarBonusBadges,
  );
  const overalls = players.map((player) => player.overall);
  const topOverall = Math.max(...overalls);
  const topIndex = overalls.findIndex((overall) => overall === topOverall);
  const targets = distributeIntegerTotal(teamPoints, anchoredWeights);

  if (topIndex < 0 || targets.length === 0) {
    return targets;
  }

  const averageOverall = overalls.reduce((sum, overall) => sum + overall, 0) / Math.max(1, overalls.length);
  const secondOverall = overalls
    .filter((_, index) => index !== topIndex)
    .reduce((best, overall) => Math.max(best, overall), 0);
  const topGap = Math.max(0, topOverall - secondOverall);
  const averageGap = Math.max(0, topOverall - averageOverall);
  const topBehavior = getPlayerArchetypeBehaviorProfile(
    players[topIndex]!,
    getPlayerSimulationBadges(players[topIndex]!, allStarBonusBadges),
  );
  const minimumTopShare =
    (
      0.22 +
      Math.min(0.12, topGap * 0.012) +
      Math.min(0.08, averageGap * 0.009)
    ) * topBehavior.starShareMultiplier;
  const minimumTopPoints = Math.min(
    Math.max(0, teamPoints - Math.max(0, players.length - 1) * 4),
    Math.round(teamPoints * minimumTopShare),
  );

  if ((targets[topIndex] ?? 0) >= minimumTopPoints) {
    return targets;
  }

  let needed = minimumTopPoints - (targets[topIndex] ?? 0);
  targets[topIndex] = minimumTopPoints;

  [...targets.keys()]
    .filter((index) => index !== topIndex)
    .sort((left, right) => targets[right] - targets[left])
    .forEach((index) => {
      if (needed <= 0) return;
      const removable = Math.max(0, targets[index] - 4);
      const taken = Math.min(removable, needed);
      targets[index] -= taken;
      needed -= taken;
    });

  return targets;
};

const getSimulationAssistWeight = (
  player: Player,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
  fitProfile: SimulationFitProfile = DEFAULT_SIMULATION_FIT_PROFILE,
) => {
  const badges = getPlayerSimulationBadges(player, allStarBonusBadges);
  const behavior = getPlayerArchetypeBehaviorProfile(player, badges);
  const positionBonus =
    player.primaryPosition === "PG" ? 14 : player.primaryPosition === "SG" ? 5 : player.primaryPosition === "SF" ? 3 : 0;
  return (
    (
      Math.max(1, player.playmaking - 60) * (badges.includes("playmaker") ? 1.45 : 1) +
      player.ballDominance * 0.12 +
      positionBonus
    ) * behavior.assistWeightMultiplier * fitProfile.assistMultiplier
  );
};

const getSimulationTeamAssistRate = (
  players: Player[],
  rng: () => number,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => {
  if (players.length === 0) return 0.55;

  const averagePlaymaking =
    players.reduce((sum, player) => sum + player.playmaking, 0) / players.length;
  const leadCreator = players.reduce((best, player) => Math.max(best, player.playmaking), 0);
  const playmakerBadgeCount = players.filter((player) =>
    getPlayerSimulationBadges(player, allStarBonusBadges).includes("playmaker"),
  ).length;
  const archetypeAssistRateBonus =
    players.reduce(
      (sum, player) =>
        sum +
        getPlayerArchetypeBehaviorProfile(
          player,
          getPlayerSimulationBadges(player, allStarBonusBadges),
        ).teamAssistRateBonus,
      0,
    ) / players.length;
  const baseRate =
    0.49 +
    Math.max(0, averagePlaymaking - 72) * 0.0022 +
    Math.max(0, leadCreator - 84) * 0.003 +
    playmakerBadgeCount * 0.012 +
    archetypeAssistRateBonus +
    (rng() - 0.5) * 0.07;

  return Math.max(0.46, Math.min(0.72, baseRate));
};

const getSimulationReboundWeight = (
  player: Player,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const badges = getPlayerSimulationBadges(player, allStarBonusBadges);
  const behavior = getPlayerArchetypeBehaviorProfile(player, badges);
  return (
    Math.max(1, player.rebounding - 55) * (badges.includes("board-man") ? 1.35 : 1) +
    Math.max(1, player.interiorDefense - 55) * 0.18
  ) * behavior.reboundWeightMultiplier;
};

const getSimulationDefenseWeight = (
  player: Player,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const badges = getPlayerSimulationBadges(player, allStarBonusBadges);
  const behavior = getPlayerArchetypeBehaviorProfile(player, badges);
  return (
    Math.max(1, player.defense - 55) * (badges.includes("lockdown") ? 1.35 : 1) +
    Math.max(1, player.perimeterDefense - 55) * 0.2
  ) * behavior.defenseEventMultiplier;
};

const getSimulationFieldGoalPercentage = (
  player: Player,
  stat: RoguelikeSimulationPlayerStat,
  rng: () => number,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
  fitProfile: SimulationFitProfile = DEFAULT_SIMULATION_FIT_PROFILE,
) => {
  const badges = getPlayerSimulationBadges(player, allStarBonusBadges);
  const behavior = getPlayerArchetypeBehaviorProfile(player, badges);
  const positionBaseline =
    player.primaryPosition === "C"
      ? 0.535
      : player.primaryPosition === "PF"
        ? 0.495
        : player.primaryPosition === "SF"
          ? 0.465
          : player.primaryPosition === "SG"
            ? 0.445
            : 0.435;
  const skillLift =
    Math.max(-0.035, Math.min(0.055, (player.offense - 80) * 0.0021)) +
    Math.max(-0.025, Math.min(0.05, (player.shooting - 78) * 0.0014));
  const badgeLift =
    (badges.includes("board-man") || badges.includes("slasher") ? 0.018 : 0) +
    (badges.includes("sniper") ? 0.012 : 0) +
    behavior.shotQualityBonus;
  const shotDietAdjustment =
    stat.fieldGoalsMade > 0 && stat.points / Math.max(1, stat.fieldGoalsMade) >= 2.45
      ? -0.025
      : 0;
  const gameVariance = (rng() - 0.5) * 0.09;
  const minimum = player.primaryPosition === "C" || player.primaryPosition === "PF" ? 0.42 : 0.36;
  const maximum =
    player.primaryPosition === "C"
      ? 0.68
      : player.primaryPosition === "PF"
        ? 0.64
        : player.primaryPosition === "SF"
          ? 0.61
          : 0.59;

  return Math.max(
    minimum,
    Math.min(
      maximum,
      positionBaseline + skillLift + badgeLift + shotDietAdjustment + fitProfile.shotQualityLift + gameVariance,
    ),
  );
};

const getSimulationTeamFieldGoalPercentageTarget = (
  players: Player[],
  rng: () => number,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
) => {
  if (players.length === 0) return 0.46;

  const averageOffense = players.reduce((sum, player) => sum + player.offense, 0) / players.length;
  const averageShooting = players.reduce((sum, player) => sum + player.shooting, 0) / players.length;
  const teamSkillLift =
    Math.max(-0.018, Math.min(0.024, (averageOffense - 80) * 0.0012)) +
    Math.max(-0.014, Math.min(0.018, (averageShooting - 78) * 0.0008));
  const badgeLift =
    players.reduce((sum, player) => {
      const badges = getPlayerSimulationBadges(player, allStarBonusBadges);
      return sum + (badges.includes("sniper") ? 0.003 : 0) + (badges.includes("slasher") ? 0.002 : 0);
    }, 0) / players.length;
  const gameVariance = (rng() - 0.5) * 0.035;

  return Math.max(0.425, Math.min(0.515, 0.462 + teamSkillLift + badgeLift + gameVariance));
};

const chooseSimulationPointValue = (
  remaining: number,
  scorer: Player,
  rng: () => number,
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[] = [],
): 1 | 2 | 3 => {
  if (remaining <= 1) return 1;
  if (remaining === 2 || remaining === 4) return 2;

  const badges = getPlayerSimulationBadges(scorer, allStarBonusBadges);
  const behavior = getPlayerArchetypeBehaviorProfile(scorer, badges);
  const threeWeight =
    Math.max(0.08, (scorer.shooting - 62) / 80) +
    (badges.includes("sniper") ? 0.16 : 0) +
    behavior.threePointBias;
  const freeThrowWeight =
    Math.max(0.04, (scorer.athleticism - 66) / 160) +
    (badges.includes("slasher") ? 0.08 : 0) +
    behavior.freeThrowBias;
  const roll = rng();

  if (remaining >= 3 && roll < threeWeight) return 3;
  if (roll < threeWeight + freeThrowWeight) return 1;
  return 2;
};

const createEmptySimulationStat = (
  player: Player,
  team: SimulationTeam,
  slot: RosterSlot["slot"],
): RoguelikeSimulationPlayerStat => ({
  playerId: player.id,
  playerName: getSimulationPlayerLabel(player),
  team,
  slot,
  points: 0,
  assists: 0,
  rebounds: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
});

const buildSimulationQuarterBreakdown = (
  finalScore: RoguelikeSimulationScore,
  rng: () => number,
): RoguelikeSimulationQuarterScore[] => {
  const baseWeights = [0.24, 0.26, 0.23, 0.27];
  const makeWeights = () => baseWeights.map((weight) => weight + (rng() - 0.5) * 0.08);
  const userScores = distributeIntegerTotal(finalScore.user, makeWeights());
  const opponentScores = distributeIntegerTotal(finalScore.opponent, makeWeights());

  return SIMULATION_QUARTERS.map((quarter, index) => ({
    quarter,
    user: userScores[index] ?? 0,
    opponent: opponentScores[index] ?? 0,
  }));
};

const distributeSimulationAssists = (
  events: RoguelikeSimulationEvent[],
  stats: RoguelikeSimulationPlayerStat[],
  players: Player[],
  team: SimulationTeam,
  rng: () => number,
  opponentTeamName?: string | null,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
  fitProfiles: Map<string, SimulationFitProfile> = new Map(),
) => {
  const teamStats = stats.filter((stat) => stat.team === team);
  const fieldGoalEvents = events.filter((event) => event.team === team && event.points > 1);
  const assistTarget = Math.min(
    fieldGoalEvents.length,
    Math.round(fieldGoalEvents.length * getSimulationTeamAssistRate(players, rng, bonusBadgeAssignments)),
  );
  const assistWeights = players.map((player) =>
    getSimulationAssistWeight(
      player,
      bonusBadgeAssignments,
      fitProfiles.get(player.id) ?? DEFAULT_SIMULATION_FIT_PROFILE,
    ),
  );
  const statById = new Map(teamStats.map((stat) => [stat.playerId, stat]));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const selectedEventIndexes = new Set<number>();

  while (selectedEventIndexes.size < assistTarget && selectedEventIndexes.size < fieldGoalEvents.length) {
    const weightedEvents = fieldGoalEvents.map((event, index) =>
      selectedEventIndexes.has(index) ? 0 : Math.max(0.1, event.points === 3 ? 1.08 : 1),
    );
    const eventIndex = pickWeightedIndex(weightedEvents, rng);
    if (eventIndex < 0) break;
    selectedEventIndexes.add(eventIndex);
  }

  selectedEventIndexes.forEach((eventIndex) => {
    const event = fieldGoalEvents[eventIndex];
    if (!event) return;

    const scorerIndex = players.findIndex((player) => player.id === event.playerId);
    const assistIndex = pickWeightedIndex(assistWeights, rng, scorerIndex >= 0 ? scorerIndex : null);
    const assistPlayer = assistIndex >= 0 ? players[assistIndex] : null;
    if (!assistPlayer) return;

    const assistStat = statById.get(assistPlayer.id);
    if (assistStat) assistStat.assists += 1;

    const scorer = playerById.get(event.playerId);
    const teamLabel = team === "user" ? "Your team" : opponentTeamName ?? "Boss team";
    const playLabel = event.points === 3 ? "hits a three" : "scores inside";

    event.assistPlayerId = assistPlayer.id;
    event.description = `${teamLabel}: ${getSimulationPlayerLabel(scorer ?? assistPlayer)} ${playLabel} off a feed from ${getSimulationPlayerLabel(assistPlayer)}.`;
  });
};

const addNonScoringSimulationStats = (
  stats: RoguelikeSimulationPlayerStat[],
  players: Player[],
  team: SimulationTeam,
  rng: () => number,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
  fitProfiles: Map<string, SimulationFitProfile> = new Map(),
) => {
  const teamStats = stats.filter((stat) => stat.team === team);
  const playerById = new Map(players.map((player) => [player.id, player]));
  const scoringPoints = teamStats.reduce((sum, stat) => sum + stat.points, 0);
  const reboundTotal = Math.max(31, Math.round(36 + rng() * 8 + scoringPoints * 0.04));
  const stealTotal = Math.max(4, Math.round(6 + rng() * 4));
  const blockTotal = Math.max(3, Math.round(4 + rng() * 4));
  const turnoverTotal = Math.max(7, Math.round(10 + rng() * 6));

  const distributeToStats = (
    total: number,
    weightSelector: (player: Player, stat: RoguelikeSimulationPlayerStat) => number,
    apply: (stat: RoguelikeSimulationPlayerStat, value: number) => void,
  ) => {
    const weights = teamStats.map((stat) => {
      const player = playerById.get(stat.playerId);
      return player ? weightSelector(player, stat) : 1;
    });
    distributeIntegerTotal(total, weights).forEach((value, index) => {
      const stat = teamStats[index];
      if (stat) apply(stat, value);
    });
  };

  distributeToStats(
    reboundTotal,
    (player) => getSimulationReboundWeight(player, bonusBadgeAssignments),
    (stat, value) => {
      stat.rebounds += value;
    },
  );
  distributeToStats(
    stealTotal,
    (player) => getSimulationDefenseWeight(player, bonusBadgeAssignments),
    (stat, value) => {
      stat.steals += value;
    },
  );
  distributeToStats(
    blockTotal,
    (player) => getSimulationDefenseWeight(player, bonusBadgeAssignments) + player.interiorDefense * 0.18,
    (stat, value) => {
      stat.blocks += value;
    },
  );
  distributeToStats(
    turnoverTotal,
    (player, stat) => {
      const behavior = getPlayerArchetypeBehaviorProfile(
        player,
        getPlayerSimulationBadges(player, bonusBadgeAssignments),
      );
      const fitProfile = fitProfiles.get(player.id) ?? DEFAULT_SIMULATION_FIT_PROFILE;
      return (
        Math.max(1, player.ballDominance * 0.16 + stat.points * 0.12) *
        behavior.turnoverLoadMultiplier *
        fitProfile.turnoverMultiplier
      );
    },
    (stat, value) => {
      stat.turnovers += value;
    },
  );

  const shotQualityById = new Map<string, number>();
  teamStats.forEach((stat) => {
    const player = playerById.get(stat.playerId);
    const fitProfile = fitProfiles.get(stat.playerId) ?? DEFAULT_SIMULATION_FIT_PROFILE;
    const shotQuality = player
      ? getSimulationFieldGoalPercentage(player, stat, rng, bonusBadgeAssignments, fitProfile)
      : 0.45;
    shotQualityById.set(stat.playerId, shotQuality);
    const extraMisses = Math.max(0, Math.round(stat.fieldGoalsMade * (1 / shotQuality - 1)));
    stat.fieldGoalsAttempted += extraMisses;
  });

  const teamFieldGoalsMade = teamStats.reduce((sum, stat) => sum + stat.fieldGoalsMade, 0);
  const teamFieldGoalTarget = getSimulationTeamFieldGoalPercentageTarget(
    players,
    rng,
    bonusBadgeAssignments,
  );
  const targetTeamAttempts = Math.max(
    teamFieldGoalsMade,
    Math.round(teamFieldGoalsMade / teamFieldGoalTarget),
  );
  const currentTeamAttempts = teamStats.reduce((sum, stat) => sum + stat.fieldGoalsAttempted, 0);

  if (currentTeamAttempts < targetTeamAttempts) {
    const additionalMisses = targetTeamAttempts - currentTeamAttempts;
    const missWeights = teamStats.map((stat) => {
      const player = playerById.get(stat.playerId);
      const shotQuality = shotQualityById.get(stat.playerId) ?? 0.46;
      return Math.max(
        0.5,
        stat.fieldGoalsMade * (1.08 - shotQuality) + (player?.ballDominance ?? 50) * 0.02,
      );
    });
    distributeIntegerTotal(additionalMisses, missWeights).forEach((misses, index) => {
      const stat = teamStats[index];
      if (stat) stat.fieldGoalsAttempted += misses;
    });
  }

  if (currentTeamAttempts > targetTeamAttempts) {
    let removableMisses = currentTeamAttempts - targetTeamAttempts;
    [...teamStats]
      .sort((left, right) => {
        const leftQuality = shotQualityById.get(left.playerId) ?? 0.46;
        const rightQuality = shotQualityById.get(right.playerId) ?? 0.46;
        return rightQuality - leftQuality;
      })
      .forEach((stat) => {
        if (removableMisses <= 0) return;
        const misses = Math.max(0, stat.fieldGoalsAttempted - stat.fieldGoalsMade);
        const removed = Math.min(misses, removableMisses);
        stat.fieldGoalsAttempted -= removed;
        removableMisses -= removed;
      });
  }
};

const normalizeSimulationReboundsToMissedShots = (
  stats: RoguelikeSimulationPlayerStat[],
  rng: () => number,
) => {
  const totalMissedShots = stats.reduce(
    (sum, stat) =>
      sum +
      Math.max(0, stat.fieldGoalsAttempted - stat.fieldGoalsMade) +
      Math.max(0, stat.freeThrowsAttempted - stat.freeThrowsMade),
    0,
  );
  const totalRebounds = stats.reduce((sum, stat) => sum + stat.rebounds, 0);
  const targetRebounds = Math.max(
    0,
    Math.min(totalMissedShots, Math.round(totalMissedShots * (0.88 + rng() * 0.08))),
  );

  if (totalRebounds <= targetRebounds) return;

  let reboundsToRemove = totalRebounds - targetRebounds;
  const removalWeights = stats.map((stat) => Math.max(0, stat.rebounds - 1));

  distributeIntegerTotal(reboundsToRemove, removalWeights).forEach((removal, index) => {
    const stat = stats[index];
    if (!stat || reboundsToRemove <= 0) return;
    const removed = Math.min(Math.max(0, stat.rebounds - 1), removal, reboundsToRemove);
    stat.rebounds -= removed;
    reboundsToRemove -= removed;
  });

  if (reboundsToRemove <= 0) return;

  [...stats]
    .sort((left, right) => right.rebounds - left.rebounds)
    .forEach((stat) => {
      if (reboundsToRemove <= 0) return;
      const removed = Math.min(Math.max(0, stat.rebounds - 1), reboundsToRemove);
      stat.rebounds -= removed;
      reboundsToRemove -= removed;
    });
};

const buildRoguelikeGameSimulationResult = ({
  faceoffResult,
  seed,
  opponentTeamName,
  ownedPlayerIds,
  trainedPlayerIds,
  coachTeamKey,
  allStarBonusBadges,
}: {
  faceoffResult: RoguelikeFaceoffResult;
  seed: number;
  opponentTeamName?: string | null;
  ownedPlayerIds: string[];
  trainedPlayerIds: string[];
  coachTeamKey: string | null;
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[];
}): RoguelikeGameSimulationResult => {
  const rng = mulberry32(seed);
  const finalFaceoffScore = getFaceoffFinalScore(faceoffResult);
  const finalScore = {
    user: finalFaceoffScore.userScore,
    opponent: finalFaceoffScore.opponentScore,
  };
  const quarterBreakdown = buildSimulationQuarterBreakdown(finalScore, rng);
  const userSlots = faceoffResult.userLineup.slice(0, 5);
  const opponentSlots = faceoffResult.opponentLineup.slice(0, 5);
  const userPlayers = userSlots.map((slot) => slot.player).filter((player): player is Player => Boolean(player));
  const opponentPlayers = opponentSlots.map((slot) => slot.player).filter((player): player is Player => Boolean(player));
  const userSimulationPlayers = userPlayers.map((player) =>
    getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds, coachTeamKey),
  );
  const opponentSimulationPlayers = opponentPlayers;
  const stats = [
    ...userSlots
      .filter((slot): slot is RosterSlot & { player: Player } => Boolean(slot.player))
      .map((slot) =>
        createEmptySimulationStat(
          getRunDisplayPlayer(slot.player, ownedPlayerIds, trainedPlayerIds, coachTeamKey),
          "user",
          slot.slot,
        ),
      ),
    ...opponentSlots
      .filter((slot): slot is RosterSlot & { player: Player } => Boolean(slot.player))
      .map((slot) => createEmptySimulationStat(slot.player, "opponent", slot.slot)),
  ];
  const statByKey = new Map(stats.map((stat) => [`${stat.team}:${stat.playerId}`, stat]));
  const userRatingById = new Map(faceoffResult.matchups.map((matchup) => [matchup.userPlayer?.id, matchup.userRating]));
  const opponentRatingById = new Map(faceoffResult.matchups.map((matchup) => [matchup.opponentPlayer?.id, matchup.opponentRating]));
  const userFitProfiles = buildSimulationFitProfiles(faceoffResult.matchups, "user");
  const opponentFitProfiles = buildSimulationFitProfiles(faceoffResult.matchups, "opponent");
  const userScoringWeights = userPlayers.map((player) =>
    getSimulationScoringWeight(
      getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds, coachTeamKey),
      userRatingById.get(player.id) ?? player.overall,
      allStarBonusBadges,
      userFitProfiles.get(player.id) ?? DEFAULT_SIMULATION_FIT_PROFILE,
    ),
  );
  const opponentScoringWeights = opponentPlayers.map((player) =>
    getSimulationScoringWeight(
      player,
      opponentRatingById.get(player.id) ?? player.overall,
      [],
      opponentFitProfiles.get(player.id) ?? DEFAULT_SIMULATION_FIT_PROFILE,
    ),
  );
  const userScoringTargets = getSimulationScoringTargets(
    finalScore.user,
    userSimulationPlayers,
    userScoringWeights,
    allStarBonusBadges,
  );
  const opponentScoringTargets = getSimulationScoringTargets(finalScore.opponent, opponentSimulationPlayers, opponentScoringWeights);
  const userScoringActuals = userPlayers.map(() => 0);
  const opponentScoringActuals = opponentPlayers.map(() => 0);
  const events: RoguelikeSimulationEvent[] = [];

  const addTeamQuarterEvents = (
    team: SimulationTeam,
    quarter: 1 | 2 | 3 | 4,
    quarterPoints: number,
  ) => {
    const teamPlayers = team === "user" ? userPlayers : opponentPlayers;
    const teamSimulationPlayers = team === "user" ? userSimulationPlayers : opponentSimulationPlayers;
    const scoringWeights = team === "user" ? userScoringWeights : opponentScoringWeights;
    const scoringTargets = team === "user" ? userScoringTargets : opponentScoringTargets;
    const scoringActuals = team === "user" ? userScoringActuals : opponentScoringActuals;
    if (teamPlayers.length === 0 || quarterPoints <= 0) return;

    let remaining = quarterPoints;
    let eventIndex = 0;
    while (remaining > 0) {
      const scorerIndex = Math.max(
        0,
        pickWeightedIndex(
          scoringWeights.map((weight, index) => {
            const target = scoringTargets[index] ?? 0;
            const actual = scoringActuals[index] ?? 0;
            const remainingTarget = Math.max(0, target - actual);
            const progressPressure = target > 0 ? remainingTarget / target : 0;
            return weight * (0.18 + remainingTarget * 0.24 + progressPressure * 1.9);
          }),
          rng,
        ),
      );
      const rawScorer = teamPlayers[scorerIndex] ?? teamPlayers[0];
      const scorer = team === "user"
        ? teamSimulationPlayers[scorerIndex] ?? getRunDisplayPlayer(rawScorer, ownedPlayerIds, trainedPlayerIds, coachTeamKey)
        : teamSimulationPlayers[scorerIndex] ?? rawScorer;
      const points = chooseSimulationPointValue(
        remaining,
        scorer,
        rng,
        team === "user" ? allStarBonusBadges : [],
      );
      scoringActuals[scorerIndex] = (scoringActuals[scorerIndex] ?? 0) + points;
      const stat = statByKey.get(`${team}:${rawScorer.id}`);
      if (stat) {
        stat.points += points;
        if (points === 1) {
          stat.freeThrowsMade += 1;
          stat.freeThrowsAttempted += 1;
        } else {
          stat.fieldGoalsMade += 1;
          stat.fieldGoalsAttempted += 1;
        }
      }

      const clockSpread = QUARTER_SECONDS - 42;
      const naturalPosition = (eventIndex + 0.65 + rng() * 0.72) / Math.max(1, Math.ceil(quarterPoints / 2.25) + 1);
      const gameClockSeconds = Math.max(8, Math.min(QUARTER_SECONDS - 10, Math.round(QUARTER_SECONDS - naturalPosition * clockSpread)));
      const quarterOffsetMs = (quarter - 1) * (SIMULATION_DURATION_MS / 4);
      const playbackMs =
        quarterOffsetMs +
        ((QUARTER_SECONDS - gameClockSeconds) / QUARTER_SECONDS) * (SIMULATION_DURATION_MS / 4);
      const teamLabel = team === "user" ? "Your team" : opponentTeamName ?? "Boss team";
      const playLabel =
        points === 3
          ? "hits a three"
          : points === 2
            ? "scores inside"
            : "makes a free throw";

      events.push({
        id: `${team}-${quarter}-${eventIndex}-${rawScorer.id}`,
        quarter,
        gameClockSeconds,
        playbackMs,
        team,
        points,
        playerId: rawScorer.id,
        description: `${teamLabel}: ${getSimulationPlayerLabel(scorer)} ${playLabel}.`,
      });

      remaining -= points;
      eventIndex += 1;
    }
  };

  quarterBreakdown.forEach((quarter) => {
    addTeamQuarterEvents("user", quarter.quarter, quarter.user);
    addTeamQuarterEvents("opponent", quarter.quarter, quarter.opponent);
  });

  distributeSimulationAssists(
    events,
    stats,
    userSimulationPlayers,
    "user",
    rng,
    opponentTeamName,
    allStarBonusBadges,
    userFitProfiles,
  );
  distributeSimulationAssists(events, stats, opponentPlayers, "opponent", rng, opponentTeamName, [], opponentFitProfiles);
  addNonScoringSimulationStats(stats, userSimulationPlayers, "user", rng, allStarBonusBadges, userFitProfiles);
  addNonScoringSimulationStats(stats, opponentPlayers, "opponent", rng, [], opponentFitProfiles);
  normalizeSimulationReboundsToMissedShots(stats, rng);

  const userPointDelta = finalScore.user - stats.filter((stat) => stat.team === "user").reduce((sum, stat) => sum + stat.points, 0);
  const opponentPointDelta = finalScore.opponent - stats.filter((stat) => stat.team === "opponent").reduce((sum, stat) => sum + stat.points, 0);
  [
    ["user", userPointDelta],
    ["opponent", opponentPointDelta],
  ].forEach(([team, delta]) => {
    if (typeof delta !== "number" || delta === 0) return;
    const teamStats = stats.filter((stat) => stat.team === team);
    const target = teamStats.sort((left, right) => right.points - left.points)[0];
    if (!target) return;
    target.points += delta;
    if (delta > 0) {
      target.freeThrowsMade += delta;
      target.freeThrowsAttempted += delta;
    }
  });

  return {
    id: `sim-${seed}-${finalScore.user}-${finalScore.opponent}`,
    durationMs: SIMULATION_DURATION_MS,
    finalScore,
    quarterBreakdown,
    playerStats: stats.sort((left, right) =>
      left.team.localeCompare(right.team) || right.points - left.points || left.slot.localeCompare(right.slot),
    ),
    timeline: events.sort((left, right) => left.playbackMs - right.playbackMs),
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
  coachTeamKey = null,
  allStarBonusBadges,
  focusMetrics = [],
  cutSelectionMode = false,
  selectedForCut = false,
  dragged,
}: {
  slot: RosterSlot;
  index: number;
  ownedPlayerIds: string[];
  trainedPlayerIds: string[];
  coachTeamKey?: string | null;
  allStarBonusBadges: RoguelikeBonusBadgeAssignment[];
  focusMetrics?: Array<"overall" | "offense" | "defense" | "chemistry" | "rebounding">;
  cutSelectionMode?: boolean;
  selectedForCut?: boolean;
  dragged: boolean;
}) => {
  const player = slot.player;
  const displayPlayer = player ? getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds, coachTeamKey) : null;
  const naturalPositions = displayPlayer
    ? [displayPlayer.primaryPosition, ...displayPlayer.secondaryPositions].join(" / ")
    : "Open";
  const slotPenalty = player ? getRoguelikeSlotPenalty(player, slot) : 0;
  const adjustedOverall = player
    ? getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds, coachTeamKey)
    : 0;
  const outOfPosition = slotPenalty > 0;
  const overallDelta = displayPlayer ? adjustedOverall - displayPlayer.overall : 0;
  const boosted = overallDelta > 0;
  const coachConnectionActive = player ? getCoachBoostForPlayer(player, coachTeamKey) > 0 : false;
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
    <div
      className={clsx(
        "relative overflow-hidden rounded-[22px] transition",
        dragged && "scale-[0.98] opacity-55",
        selectedForCut && "shadow-[0_0_0_1px_rgba(248,113,113,0.55),0_0_30px_rgba(248,113,113,0.22)]",
      )}
    >
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
        coachConnectionActive={coachConnectionActive}
      />
      {cutSelectionMode && player ? (
        <>
          <div
            className={clsx(
              "pointer-events-none absolute inset-0 rounded-[22px] border transition",
              selectedForCut
                ? "border-rose-300/70 bg-rose-500/28"
                : "border-transparent bg-transparent",
            )}
          />
          {selectedForCut ? (
            <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-rose-100/34 bg-rose-500/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_rgba(127,29,29,0.28)]">
              Cut Selected
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

const FaceoffStarterCard = ({
  player,
  slot,
  slotLabel,
  ownedPlayerIds = [],
  trainedPlayerIds = [],
  coachTeamKey = null,
  allStarBonusBadges = [],
  align = "left",
}: {
  player: Player | null;
  slot: RosterSlot;
  slotLabel: string;
  ownedPlayerIds?: string[];
  trainedPlayerIds?: string[];
  coachTeamKey?: string | null;
  allStarBonusBadges?: RoguelikeBonusBadgeAssignment[];
  align?: "left" | "right";
}) => {
  const displayPlayer = player ? getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds, coachTeamKey) : null;
  const badgeOverrides = player
    ? getRunPlayerTypeBadgeOverrides(displayPlayer ?? player, allStarBonusBadges)
    : [];
  const imageUrl = player ? usePlayerImage(player) : null;
  const { firstNameLine, lastNameLine, versionLine } = displayPlayer
    ? getPlayerDisplayLines(displayPlayer)
    : { firstNameLine: "", lastNameLine: "", versionLine: "" };
  const slotPenalty = player ? getRoguelikeSlotPenalty(player, slot) : 0;
  const adjustedOverall = player
    ? getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds, coachTeamKey)
    : 0;
  const outOfPosition = slotPenalty > 0;
  const coachConnectionActive = player ? getCoachBoostForPlayer(player, coachTeamKey) > 0 : false;
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
            {coachConnectionActive ? (
              <div
                title="Coach Link active: player matches the coach's associated team"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
              >
                <Handshake size={13} strokeWidth={2.3} />
              </div>
            ) : null}
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
  ownedPlayerIds = [],
  trainedPlayerIds = [],
  coachTeamKey = null,
  allStarBonusBadges = [],
}: {
  matchup: RoguelikeFaceoffMatchup;
  ownedPlayerIds?: string[];
  trainedPlayerIds?: string[];
  coachTeamKey?: string | null;
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
          ownedPlayerIds={ownedPlayerIds}
          trainedPlayerIds={trainedPlayerIds}
          coachTeamKey={coachTeamKey}
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
    const shellRef = useRef<HTMLDivElement | null>(null);
    const starterRevealBackLogo = "/nba-ultimate-draft-badge.png";
    const starterRevealCardScale = 0.43;
  const starterRevealBaseWidth = 380;
  const starterRevealBaseHeight = 920;
  const [responsiveScale, setResponsiveScale] = useState(starterRevealCardScale);
  const starterRevealCardWidth = Math.round(starterRevealBaseWidth * responsiveScale);
  const starterRevealCardHeight = Math.round(starterRevealBaseHeight * responsiveScale);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === "undefined") {
      setResponsiveScale(starterRevealCardScale);
      return;
    }

    const updateScale = () => {
      const availableWidth = shell.clientWidth;
      if (!availableWidth) {
        setResponsiveScale(starterRevealCardScale);
        return;
      }

      const nextScale = Math.min(starterRevealCardScale, availableWidth / starterRevealBaseWidth);
      setResponsiveScale(Number.isFinite(nextScale) ? nextScale : starterRevealCardScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(shell);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="group w-full max-w-[186px] justify-self-center [perspective:1600px]"
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
              compactScale={responsiveScale}
              actionLabel="Starter revealed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DraftChoiceRevealCard = ({
  children,
  index,
  compactScale,
  revealKey,
}: {
  children: ReactNode;
  index: number;
  compactScale: number;
  revealKey: string;
}) => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [responsiveScale, setResponsiveScale] = useState(compactScale);
  const cardWidth = Math.round(380 * responsiveScale);
  const cardHeight = Math.round(920 * responsiveScale);

  useEffect(() => {
    setRevealed(false);
    const revealTimer = window.setTimeout(() => {
      setRevealed(true);
    }, 220 + index * 360);

    return () => window.clearTimeout(revealTimer);
  }, [index, revealKey]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === "undefined") {
      setResponsiveScale(compactScale);
      return;
    }

    const updateScale = () => {
      const availableWidth = shell.clientWidth;
      if (!availableWidth) {
        setResponsiveScale(compactScale);
        return;
      }

      const nextScale = Math.min(compactScale, availableWidth / 380);
      setResponsiveScale(Number.isFinite(nextScale) ? nextScale : compactScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(shell);

    return () => {
      observer.disconnect();
    };
  }, [compactScale]);

  return (
    <div
      ref={shellRef}
      className="w-full justify-self-center [perspective:1600px]"
      style={{ maxWidth: `${Math.round(380 * compactScale)}px`, height: `${cardHeight}px` }}
    >
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{
          transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(54,34,20,0.96),rgba(33,20,12,0.98))] shadow-[0_24px_56px_rgba(0,0,0,0.34)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.09),transparent_35%)]" />
            <div className="absolute inset-[10px] rounded-[22px] border border-white/8" />
            <div className="relative flex h-full items-center justify-center p-6">
              <div className="relative flex items-center justify-center rounded-[24px] border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.06),rgba(255,255,255,0.01)_58%,transparent_78%)] px-6 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
                <img
                  src="/nba-ultimate-draft-badge.png"
                  alt="NBA Ultimate Draft"
                  className="h-auto w-full max-w-[180px] object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.35)]"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={clsx(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]",
            !revealed && "pointer-events-none",
          )}
        >
          {children}
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

const AllStarEventPlayerCard = ({ player }: { player: Player }) => {
  const imageUrl = usePlayerImage(player);
  const tier = getPlayerTier(player);
  const { firstNameLine, lastNameLine } = getPlayerDisplayLines(player);
  const nameLines = [firstNameLine, lastNameLine].filter(Boolean);
  const longestNameLineLength = nameLines.reduce((max, line) => Math.max(max, line.length), 0);
  const nameClassName =
    longestNameLineLength >= 20
      ? "text-[0.64rem]"
      : longestNameLineLength >= 17
        ? "text-[0.76rem]"
        : "text-[0.95rem]";

  return (
    <div className="rounded-[22px] border border-dashed border-white/40 p-1">
      <div
        className={clsx(
          "relative overflow-hidden rounded-[19px] border border-white/12 px-3 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.28)]",
          playerTierRunRosterSurfaceStyles[tier],
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_34%),linear-gradient(180deg,transparent,rgba(2,6,23,0.28)_64%,rgba(2,6,23,0.48))]" />
        <div className="relative flex min-h-[150px] flex-col items-center justify-start px-2 py-2 text-center">
          <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[18px] border border-white/12 bg-black/24 shadow-[0_12px_26px_rgba(0,0,0,0.24)]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={player.name}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-200">
                {player.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </div>
            )}
          </div>
          <div className="mt-3 w-full rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.66),rgba(4,8,18,0.84))] px-1.5 py-2.5 shadow-[0_12px_26px_rgba(0,0,0,0.24)] backdrop-blur-[4px]">
            <div
              className={clsx(
                "font-display font-semibold leading-[1.04] tracking-[-0.01em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]",
                nameClassName,
              )}
            >
              {nameLines.map((line) => (
                <div key={line} className="block overflow-hidden whitespace-nowrap text-center">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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

const CoachChoiceCard = ({
  coach,
  onHire,
  actionLabel = "Hire",
}: {
  coach: RoguelikeCoach;
  onHire: () => void;
  actionLabel?: string;
}) => {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const coachCard = {
    id: coach.id,
    label: coach.name,
    teamName: coach.teamName,
    conference: coach.conference,
  };
  const cardScale = 0.48;
  const [responsiveScale, setResponsiveScale] = useState(cardScale);
  const cardWidth = 380 * responsiveScale;
  const cardHeight = 920 * responsiveScale;

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === "undefined") {
      setResponsiveScale(cardScale);
      return;
    }

    const updateScale = () => {
      const availableWidth = shell.clientWidth;
      if (!availableWidth) {
        setResponsiveScale(cardScale);
        return;
      }

      const nextScale = Math.min(cardScale, availableWidth / 380);
      setResponsiveScale(Number.isFinite(nextScale) ? nextScale : cardScale);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(shell);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onHire}
      className="group flex h-full flex-col items-center rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,16,26,0.96),rgba(13,19,30,0.98))] p-4 text-center shadow-card transition hover:-translate-y-1 hover:border-emerald-200/24 hover:bg-[linear-gradient(180deg,rgba(12,20,32,0.98),rgba(14,24,36,0.99))]"
    >
      <div className="mb-3 flex w-full items-center justify-between gap-3">
        <div className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/78">
          Coach Pick
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
          {actionLabel}
          <ArrowRight size={12} />
        </div>
      </div>
      <div
        ref={shellRef}
        className="relative w-full overflow-hidden rounded-[22px]"
        style={{ maxWidth: `${380 * cardScale}px`, height: `${cardHeight}px` }}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            transform: `scale(${responsiveScale})`,
            transformOrigin: "top left",
          }}
        >
          <CardLabCoachCard coach={coachCard} rarity="Galaxy" />
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
  coachTeamKey = null,
  allStarBonusBadges = [],
}: {
  slot: RosterSlot;
  player: Player;
  ownedPlayerIds: string[];
  trainedPlayerIds: string[];
  coachTeamKey?: string | null;
  allStarBonusBadges?: RoguelikeBonusBadgeAssignment[];
}) => {
  const imageUrl = usePlayerImage(player);
  const displayPlayer = getRunDisplayPlayer(player, ownedPlayerIds, trainedPlayerIds, coachTeamKey);
  const badgeOverrides = getRunPlayerTypeBadgeOverrides(displayPlayer, allStarBonusBadges);
  const adjustedOverall = Math.round(
    getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds, coachTeamKey) * 10,
  ) / 10;
  const coachConnectionActive = getCoachBoostForPlayer(player, coachTeamKey) > 0;

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
        {coachConnectionActive ? (
          <div
            title="Coach Link active: player matches the coach's associated team"
            className="absolute right-3 top-12 inline-flex h-7 w-7 items-center justify-center rounded-full border border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
          >
            <Handshake size={13} strokeWidth={2.3} />
          </div>
        ) : null}
      </div>
      <div className="space-y-2 p-2.5">
        <div className="min-w-0 flex-1">
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
  ownedCoachRecruitment,
  onLeaveRun,
  onBackToHome,
  onAwardFailureRewards,
  onUpdatePersonalBests,
  onUseTrainingCampTicket,
  onUseTradePhone,
  onUseSilverStarterPack,
  onUseGoldStarterPack,
  onUsePlatinumStarterPack,
  cloudSavedRunData,
  onCloudSaveRun,
  onCloudDeleteRun,
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
  const [simulationElapsedMs, setSimulationElapsedMs] = useState(0);
  const [simulationPlaying, setSimulationPlaying] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<1 | 2 | 4>(1);
  const [showSimulationBoxScore, setShowSimulationBoxScore] = useState(false);
  const [showCoachChangeRoster, setShowCoachChangeRoster] = useState(false);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [cutDropTargetIndex, setCutDropTargetIndex] = useState<number | null>(null);
  const [allStarDropTargetKey, setAllStarDropTargetKey] = useState<AllStarEventKey | null>(null);
  const bestOwnedStarterPackUpgrade = getBestOwnedStarterPackUpgrade({
    ownedSilverStarterPacks,
    ownedGoldStarterPacks,
    ownedPlatinumStarterPacks,
  });
  const previousBestStarterPackUpgradeRef = useRef<StarterPackUpgrade>(bestOwnedStarterPackUpgrade);
  const cloudSavedRunAppliedRef = useRef(false);
  const [selectedStarterPackUpgrade, setSelectedStarterPackUpgrade] = useState<StarterPackUpgrade>(
    () => bestOwnedStarterPackUpgrade,
  );
  const [selectedRunSettings, setSelectedRunSettings] = useState<RoguelikeRunSettings>(
    DEFAULT_ROGUELIKE_RUN_SETTINGS,
  );
  const [showRunSettingsScreen, setShowRunSettingsScreen] = useState(() => !run || showPackSelectionHub);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );
  const [mobileBottomPanel, setMobileBottomPanel] = useState<"board" | "roster">("board");
  const currentLadderNodeRef = useRef<HTMLDivElement | null>(null);
  const [dragPointer, setDragPointer] = useState<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const activeSimulationResult = run?.nodeResult?.simulationResult ?? null;

  const metrics = useMemo(() => {
    if (!run) return evaluateRoguelikeRoster([]);
    const coachTeamKey = getRoguelikeCoachTeamKey(run.hiredCoachId);
    const ownedPlayerIds = getRunOwnedPlayers(run).map((player) => player.id);
    if (run.stage !== "starter-reveal") {
      return evaluateRoguelikeLineup(run.lineup, ownedPlayerIds, run.trainedPlayerIds ?? [], coachTeamKey);
    }

    const revealedStarterPlayers = run.starterRevealPlayers.filter((player) =>
      run.revealedStarterIds.includes(player.id),
    );
    return evaluateRoguelikeLineup(
      buildRoguelikeStarterLineup(revealedStarterPlayers),
      revealedStarterPlayers.map((player) => player.id),
      run.trainedPlayerIds ?? [],
      coachTeamKey,
    );
  }, [run]);

  const activeRunSettings = run?.settings ?? selectedRunSettings;
  const enableCoachRecruitmentForLadder =
    activeRunSettings.enableCoaches && Boolean(run?.coachRecruitmentUnlocked ?? ownedCoachRecruitment > 0);
  const runNodes = useMemo(
    () =>
      getRoguelikeNodesForSettings(activeRunSettings, {
        enableCoachRecruitment: enableCoachRecruitmentForLadder,
      }),
    [activeRunSettings, enableCoachRecruitmentForLadder],
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
    if (typeof window === "undefined") return;

    const syncViewport = () => setIsMobileViewport(window.innerWidth < 640);
    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  const starterPackUpgradeCounts: Record<StarterPackUpgrade, number> = {
    standard: Infinity,
    silver: ownedSilverStarterPacks,
    gold: ownedGoldStarterPacks,
    platinum: ownedPlatinumStarterPacks,
  };

  useEffect(() => {
    const previousBestStarterPackUpgrade = previousBestStarterPackUpgradeRef.current;
    previousBestStarterPackUpgradeRef.current = bestOwnedStarterPackUpgrade;

    if (starterPackUpgradeCounts[selectedStarterPackUpgrade] <= 0) {
      setSelectedStarterPackUpgrade(bestOwnedStarterPackUpgrade);
      return;
    }

    if (bestOwnedStarterPackUpgrade !== previousBestStarterPackUpgrade) {
      setSelectedStarterPackUpgrade(bestOwnedStarterPackUpgrade);
    }
  }, [
    bestOwnedStarterPackUpgrade,
    ownedSilverStarterPacks,
    ownedGoldStarterPacks,
    ownedPlatinumStarterPacks,
    selectedStarterPackUpgrade,
  ]);

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
    if (!run || run.stage !== "coach-select") return;
    if (run.coachChoices.length >= 5) return;

    setRun({
      ...run,
      coachChoices: drawRoguelikeCoachChoices(run.seed + 702, run.settings, 5),
    });
  }, [run]);

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
    setSelectedStarterPackUpgrade(bestOwnedStarterPackUpgrade);
    setShowPackSelectionHub(false);
    setShowRunSettingsScreen(false);
    setShowOutcomeOverlay(false);
    setShowChallengeBreakdown(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setCutDropTargetIndex(null);
    setAllStarDropTargetKey(null);
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
      coachRecruitmentUnlocked: runSettings.enableCoaches && ownedCoachRecruitment > 0,
      roster: [],
      lineup,
      availablePool: playerUniverse,
        seenChoicePlayerIds: [],
        choices: [],
        starterRevealPlayers,
        coachChoices: [],
        hiredCoachId: null,
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
      allStarAssignments: { ...DEFAULT_ALL_STAR_ASSIGNMENTS },
      trainedPlayerIds: [],
      specialStuffInventoryCount: 0,
      activeSpecialStuffPlayerId: null,
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
        allStarAssignments: { ...DEFAULT_ALL_STAR_ASSIGNMENTS },
        utilityReturnState: null,
      });
      return;
    }

    setRun(
      restoreUtilityReturnState({
        ...run,
        selectedCutPlayerIds: [],
        selectedNaturalPositionPlayerId: null,
        selectedNaturalPosition: null,
        allStarAssignments: { ...DEFAULT_ALL_STAR_ASSIGNMENTS },
      }),
    );
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
    const coachChoices = run.settings.enableCoaches
      ? drawRoguelikeCoachChoices(run.seed + 702, run.settings, 5)
      : [];
    setShowPackSelectionHub(false);
    setParkedRunState(false);

    setRun({
      ...run,
      roster: ownedPlayers,
      lineup,
      coachChoices,
      hiredCoachId: null,
      stage: run.settings.enableCoaches ? "coach-select" : "ladder-overview",
      activeNode: null,
      activeOpponentPlayerIds: null,
    });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const hireCoach = (coachId: string) => {
    if (!run || run.stage !== "coach-select") return;

    setRun({
      ...run,
      hiredCoachId: coachId,
      stage: "ladder-overview",
      activeNode: null,
      activeOpponentPlayerIds: null,
    });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const completeCoachingChange = (coachId: string, resignedCurrentCoach: boolean) => {
    if (!run || run.stage !== "coaching-change" || run.activeNode?.type !== "coaching-change") return;

    const selectedCoach = getRoguelikeCoachById(coachId);
    const nextFloorIndex = run.floorIndex + 1;

    setRun({
      ...run,
      hiredCoachId: coachId,
      floorIndex: nextFloorIndex,
      stage: runNodes[nextFloorIndex] ? "node-result" : "run-cleared",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: resignedCurrentCoach ? "Coach re-signed" : "Coaching change complete",
        detail: resignedCurrentCoach
          ? `${selectedCoach?.name ?? "Your coach"} stays in charge. ${selectedCoach?.teamName ?? "Their team"} players keep the +1 coach boost.`
          : `${selectedCoach?.name ?? "Your new coach"} takes over. ${selectedCoach?.teamName ?? "Their team"} players now receive the +1 coach boost.`,
        passed: true,
      },
    });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
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

      if (currentNode.type === "coaching-change") {
        setRun({ ...run, stage: "coaching-change", nodeResult: null });
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
        getRoguelikeCoachTeamKey(nextRun.hiredCoachId),
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
                : getRewardDraftDescription(currentNode, nextChoicesState.choices.length),
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

    if (currentNode.type === "coaching-change") {
      const currentCoachId = run.hiredCoachId;
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        coachChoices: drawRoguelikeCoachChoices(
          nextChoiceSeed(run.seed, 900 + run.floorIndex * 31),
          run.settings,
          5,
          currentCoachId ? [currentCoachId] : [],
        ),
        stage: "coaching-change",
        nodeResult: null,
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
        allStarAssignments: { ...DEFAULT_ALL_STAR_ASSIGNMENTS },
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

    if (isPlayerIdentityOnRoster(player, getRunOwnedPlayers(run))) {
      setRun({
        ...run,
        choices: run.choices.filter((choice) => !isPlayerIdentityOnRoster(choice, getRunOwnedPlayers(run))),
        nodeResult: {
          title: "Duplicate player blocked",
          detail: `${player.name} is already on your run roster, so that duplicate offer was removed from this board.`,
          passed: true,
        },
      });
      return;
    }

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
    const nextRosterPlayerIds = nextRoster.map((ownedPlayer) => ownedPlayer.id);
    const promotionCoachTeamKey = getRoguelikeCoachTeamKey(run.hiredCoachId);
    const getRunPromotionOverall = (targetPlayer: Player) =>
      getRunDisplayPlayer(
        targetPlayer,
        nextRosterPlayerIds,
        run.trainedPlayerIds ?? [],
        promotionCoachTeamKey,
      ).overall;
    const nextLineup =
      run.stage === "initial-draft"
        ? buildRoguelikeStarterLineup(nextRoster)
        : autoPromoteAddedPlayerIntoStartingLineup(
            assignPlayerToRoster(run.lineup, player).roster,
            player,
            getRunPromotionOverall,
          );
    const nextInitialPicks = run.initialPicks + 1;

    if (run.stage === "initial-draft") {
      if (nextInitialPicks < 2) {
        const initialDraftNode = run.activeNode;
        if (!initialDraftNode) return;
        const openingDraftPool = getNodePlayerPool(
          initialDraftNode,
          buildOpeningDraftPool(runPlayerUniverse),
          runPlayerUniverse,
          getRoguelikeCoachTeamKey(run.hiredCoachId),
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

  const assignAllStarPlayer = (slot: AllStarEventKey, player: Player) => {
    if (!run || run.stage !== "all-star-select") return;

    const nextAssignments: AllStarAssignments = {
      ...DEFAULT_ALL_STAR_ASSIGNMENTS,
      ...run.allStarAssignments,
    };

    ALL_STAR_EVENT_CARDS.forEach((eventCard) => {
      if (eventCard.key !== slot && nextAssignments[eventCard.key] === player.id) {
        nextAssignments[eventCard.key] = null;
      }
    });
    nextAssignments[slot] = player.id;

    setRun({
      ...run,
      allStarAssignments: nextAssignments,
    });
  };

  const assignDraggedPlayerToAllStarEvent = (fromIndex: number, eventKey: AllStarEventKey) => {
    setRun((currentRun) => {
      if (!currentRun || currentRun.stage !== "all-star-select") return currentRun;

      const hydratedRun = getHydratedRun(currentRun, runNodes);
      const player = hydratedRun.lineup[fromIndex]?.player ?? null;
      if (!player) return currentRun;

      const nextAssignments: AllStarAssignments = {
        ...DEFAULT_ALL_STAR_ASSIGNMENTS,
        ...currentRun.allStarAssignments,
      };

      ALL_STAR_EVENT_CARDS.forEach((eventCard) => {
        if (eventCard.key !== eventKey && nextAssignments[eventCard.key] === player.id) {
          nextAssignments[eventCard.key] = null;
        }
      });
      nextAssignments[eventKey] = player.id;

      return {
        ...hydratedRun,
        allStarAssignments: nextAssignments,
      };
    });
  };

  const removeAllStarAssignment = (eventKey: AllStarEventKey) => {
    setRun((currentRun) => {
      if (!currentRun || currentRun.stage !== "all-star-select") return currentRun;

      return {
        ...currentRun,
        allStarAssignments: {
          ...DEFAULT_ALL_STAR_ASSIGNMENTS,
          ...currentRun.allStarAssignments,
          [eventKey]: null,
        },
      };
    });
  };

  const allStarAssignmentsComplete = (assignments: AllStarAssignments) =>
    ALL_STAR_EVENT_CARDS.every((eventCard) => Boolean(assignments[eventCard.key]));

  const getAllStarAssignedPlayer = (eventKey: AllStarEventKey) => {
    const playerId = run?.allStarAssignments[eventKey] ?? null;
    if (!playerId) return null;
    return runOwnedDisplayPlayers.find((player) => player.id === playerId) ?? null;
  };

  const getAllStarResultCopy = (assignments: AllStarAssignments) => {
    const parts = ALL_STAR_EVENT_CARDS.map((eventCard) => {
      const player = runOwnedDisplayPlayers.find((entry) => entry.id === assignments[eventCard.key]);
      const badgeLabel = eventCard.stat.replace(" badge", "");
      return `${player?.name ?? eventCard.title} earned a ${badgeLabel} badge`;
    });

    if (parts.length <= 1) return parts[0] ?? "Your All-Star Weekend selections earned new badges.";

    return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]} for the rest of this run.`;
  };

  const runAllStarSaturday = () => {
    if (!run || run.stage !== "all-star-select" || !run.activeNode) return;
    const assignments: AllStarAssignments = {
      ...DEFAULT_ALL_STAR_ASSIGNMENTS,
      ...run.allStarAssignments,
    };
    if (!allStarAssignmentsComplete(assignments)) return;
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

    ALL_STAR_EVENT_CARDS.forEach((eventCard) => {
      const playerId = assignments[eventCard.key];
      if (playerId) addBonusBadge(playerId, eventCard.badgeType);
    });
    const nextFloorIndex = run.floorIndex + 1;

    setRun({
      ...run,
      allStarBonusBadges: nextBonusBadges,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      allStarAssignments: { ...DEFAULT_ALL_STAR_ASSIGNMENTS },
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: getAllStarResultCopy(assignments),
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
        getNodePlayerPool(node, run.availablePool, runPlayerUniverse, getRoguelikeCoachTeamKey(run.hiredCoachId)),
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
          detail: getRewardDraftDescription(node, nextChoicesState.choices.length),
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

    if (node.type === "coaching-change") {
      const currentCoachId = run.hiredCoachId;
      setRun({
        ...run,
        coachChoices: drawRoguelikeCoachChoices(
          nextChoiceSeed(run.seed, 900 + run.floorIndex * 31),
          run.settings,
          5,
          currentCoachId ? [currentCoachId] : [],
        ),
        stage: "coaching-change",
        nodeResult: null,
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
        allStarAssignments: { ...DEFAULT_ALL_STAR_ASSIGNMENTS },
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
        getRoguelikeCoachTeamKey(run.hiredCoachId),
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
        getRoguelikeCoachTeamKey(run.hiredCoachId),
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

    const effectiveTrainedPlayerIds = getEffectiveBossTrainedPlayerIds(run);
    const node = {
      ...run.activeNode,
      opponentPlayerIds: run.activeOpponentPlayerIds ?? run.activeNode.opponentPlayerIds,
    };
    const resolution = resolveRoguelikeNode(
        node,
        getRunOwnedPlayers(run),
        run.lineup,
        effectiveTrainedPlayerIds,
        getRoguelikeCoachTeamKey(run.hiredCoachId),
        run.allStarBonusBadges ?? [],
      );
    const faceoffResult = resolution.faceoffResult;
    if (!faceoffResult) return;

    const edge =
      Math.round((faceoffResult.userTeamWinProbability - faceoffResult.opponentTeamWinProbability) * 10) / 10;
    const ownedPlayers = getRunOwnedPlayers(run);
    const simulationResult = buildRoguelikeGameSimulationResult({
      faceoffResult,
      seed: run.seed + run.floorIndex * 211 + 31,
      opponentTeamName: node.opponentTeamName,
      ownedPlayerIds: ownedPlayers.map((player) => player.id),
      trainedPlayerIds: effectiveTrainedPlayerIds,
      coachTeamKey: getRoguelikeCoachTeamKey(run.hiredCoachId),
      allStarBonusBadges: run.allStarBonusBadges ?? [],
    });

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
        simulationResult,
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
          activeSpecialStuffPlayerId: null,
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
        activeSpecialStuffPlayerId: null,
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
        activeSpecialStuffPlayerId: null,
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
        activeSpecialStuffPlayerId: null,
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
      activeSpecialStuffPlayerId: null,
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
    if (node.id === LOCKER_ROOM_SPECIAL_STUFF_NODE.id) {
      openSpecialStuffSelection();
      return;
    }
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

  const openSpecialStuffSelection = () => {
    if (!run) return;
    if (run.specialStuffInventoryCount <= 0 && !run.activeSpecialStuffPlayerId) return;
    if (!getUpcomingBossNodeForLockerRoom(run, runNodes)) return;

    setRun({
      ...run,
      stage: "training-select",
      activeNode: LOCKER_ROOM_SPECIAL_STUFF_NODE,
      activeOpponentPlayerIds: null,
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      nodeResult: null,
      lockerRoomNotice: null,
      utilityReturnState:
        run.utilityReturnState ?? {
          stage: run.stage,
          activeNode: run.activeNode,
          activeOpponentPlayerIds: run.activeOpponentPlayerIds,
          nodeResult: run.nodeResult,
        },
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

  const buyLockerRoomSpecialStuff = () => {
    if (!run || run.stage !== "locker-room") return;
    const nextBossNode = getUpcomingBossNodeForLockerRoom(run, runNodes);
    const price = getLockerRoomItemPrice("special-stuff");
    if (!nextBossNode || run.lockerRoomCash < price) return;

    const nextInventoryCount = run.specialStuffInventoryCount + 1;
    setRun({
      ...run,
      lockerRoomCash: run.lockerRoomCash - price,
      specialStuffInventoryCount: nextInventoryCount,
      lockerRoomNotice: {
        title: "Special Stuff Purchased",
        detail: `You banked Special Stuff for this run. Apply it to any player before ${nextBossNode.title} to give them +${SPECIAL_STUFF_BOOST_AMOUNT} OVR for that boss game only.`,
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

    if (run.activeNode.id === LOCKER_ROOM_SPECIAL_STUFF_NODE.id) {
      const hadActiveSpecialStuff = Boolean(run.activeSpecialStuffPlayerId);
      if (!hadActiveSpecialStuff && run.specialStuffInventoryCount <= 0) return;

      const nextBossNode = getUpcomingBossNodeForLockerRoom(run, runNodes);
      const nextSpecialStuffInventoryCount = hadActiveSpecialStuff
        ? run.specialStuffInventoryCount
        : Math.max(0, run.specialStuffInventoryCount - 1);

      setRun(restoreUtilityReturnState({
        ...run,
        activeSpecialStuffPlayerId: player.id,
        specialStuffInventoryCount: nextSpecialStuffInventoryCount,
        lockerRoomNotice: {
          title: "Special Stuff Ready",
          detail: `${player.name} will get +${SPECIAL_STUFF_BOOST_AMOUNT} OVR for ${nextBossNode?.title ?? "the next boss battle"} only.`,
        },
      }, run.utilityReturnState?.stage ?? "locker-room"));
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
        ? getNodePlayerPool(
            sourceNode,
            buildOpeningDraftPool(runPlayerUniverse),
            runPlayerUniverse,
            getRoguelikeCoachTeamKey(run.hiredCoachId),
          )
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
      getRoguelikeCoachTeamKey(run.hiredCoachId),
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
        getRoguelikeCoachTeamKey(run.hiredCoachId),
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
        getRoguelikeCoachTeamKey(run.hiredCoachId),
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
    const nextRosterPlayerIds = nextRoster.map((ownedPlayer) => ownedPlayer.id);
    const promotionCoachTeamKey = getRoguelikeCoachTeamKey(run.hiredCoachId);
    const getRunPromotionOverall = (targetPlayer: Player) =>
      getRunDisplayPlayer(
        targetPlayer,
        nextRosterPlayerIds,
        run.trainedPlayerIds ?? [],
        promotionCoachTeamKey,
      ).overall;
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
            getRunPromotionOverall,
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
      const selectedCutPlayerIds = currentRun.selectedCutPlayerIds.filter((playerId) =>
        nextLineup.some((slot) => slot.player?.id === playerId),
      );

      return {
        ...hydratedRun,
        lineup: nextLineup,
        selectedCutPlayerIds,
      };
    });
  };

  const assignDraggedPlayerToCutSlot = (fromIndex: number, cutSlotIndex: number) => {
    setRun((currentRun) => {
      if (!currentRun || currentRun.stage !== "roster-cut-select") return currentRun;

      const hydratedRun = getHydratedRun(currentRun, runNodes);
      const player = hydratedRun.lineup[fromIndex]?.player ?? null;
      if (!player) return currentRun;

      const nextSelectedCutPlayerIds = [...currentRun.selectedCutPlayerIds];
      const existingIndex = nextSelectedCutPlayerIds.indexOf(player.id);
      if (existingIndex >= 0) {
        nextSelectedCutPlayerIds.splice(existingIndex, 1);
      }
      nextSelectedCutPlayerIds[cutSlotIndex] = player.id;

      return {
        ...hydratedRun,
        selectedCutPlayerIds: nextSelectedCutPlayerIds.filter(Boolean).slice(0, 2),
      };
    });
  };

  const removeCutSlotSelection = (cutSlotIndex: number) => {
    setRun((currentRun) => {
      if (!currentRun || currentRun.stage !== "roster-cut-select") return currentRun;

      const nextSelectedCutPlayerIds = currentRun.selectedCutPlayerIds.filter((_, index) => index !== cutSlotIndex);
      return {
        ...currentRun,
        selectedCutPlayerIds: nextSelectedCutPlayerIds,
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
    setCutDropTargetIndex(null);
    setAllStarDropTargetKey(null);
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
    onCloudSaveRun?.(run);
  }, [onCloudSaveRun, run]);

  useEffect(() => {
    if (cloudSavedRunAppliedRef.current || run || !cloudSavedRunData) return;

    const normalizedCloudRun = normalizeStoredRun(
      cloudSavedRunData as Partial<RoguelikeRun>,
      activeRogueStarId,
    );
    if (!normalizedCloudRun) return;

    cloudSavedRunAppliedRef.current = true;
    setRun(normalizedCloudRun);
  }, [activeRogueStarId, cloudSavedRunData, run]);

  useEffect(() => {
    const shouldOpen =
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
    setSimulationElapsedMs(0);
    setSimulationPlaying(Boolean(activeSimulationResult));
    setSimulationSpeed(1);
    setShowSimulationBoxScore(false);
  }, [activeSimulationResult?.id]);

  useEffect(() => {
    if (!activeSimulationResult || !simulationPlaying) return;

    let animationFrame = 0;
    let lastFrameTime = performance.now();

    const tick = (frameTime: number) => {
      const delta = (frameTime - lastFrameTime) * simulationSpeed;
      lastFrameTime = frameTime;
      setSimulationElapsedMs((currentElapsedMs) => {
        const nextElapsedMs = Math.min(activeSimulationResult.durationMs, currentElapsedMs + delta);
        if (nextElapsedMs >= activeSimulationResult.durationMs) {
          setSimulationPlaying(false);
          setShowSimulationBoxScore(true);
        }
        return nextElapsedMs;
      });
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [activeSimulationResult, simulationPlaying, simulationSpeed]);

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

    const ownedPlayers = getRunOwnedPlayers(run);
    const boardHasRosterDuplicate = hasRosterDuplicateChoice(run.choices, ownedPlayers);
    const isTradeReplacementBoard =
      (sourceNode.type === "trade" ||
        (sourceNode.type === "choice" && run.pendingChoiceSelection === "trade")) &&
      Boolean(run.pendingTradeState);

    if (run.choices.length > 0 && !boardHasRosterDuplicate) return;
    if (sourceNode.rewardChoices <= 0 && !isTradeReplacementBoard) return;

    const repairedPool =
      isTradeReplacementBoard && run.pendingTradeState
          ? getSimilarCaliberTradePool(
              sourceNode,
              run.availablePool,
              runPlayerUniverse,
              run.pendingTradeState.outgoingPlayerOverall,
              ownedPlayers,
              run.pendingTradeState.outgoingPlayerId,
              getRoguelikeCoachTeamKey(run.hiredCoachId),
            )
        : getRewardDraftPool(run, sourceNode, run.availablePool, runPlayerUniverse);

    const repairedChoicesState =
      isTradeReplacementBoard && run.pendingTradeState
        ? (() => {
              const repairedTradeChoices = drawTradeReplacementChoices(
                repairedPool,
                ownedPlayers,
                getTradeReplacementChoiceCount(sourceNode, run.pendingChoiceSelection),
                nextChoiceSeed(run.seed, 900 + run.floorIndex * 37),
                run.pendingTradeState.outgoingPlayerOverall,
                getRoguelikeCoachTeamKey(run.hiredCoachId),
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
        ?.closest("[data-roster-cut-slot-index]");
      const nextCutTarget = hovered?.getAttribute("data-roster-cut-slot-index");
      setCutDropTargetIndex(nextCutTarget ? Number(nextCutTarget) : null);

      const hoveredAllStarSlot = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-all-star-event-key]");
      const nextAllStarTarget = hoveredAllStarSlot?.getAttribute("data-all-star-event-key") ?? null;
      setAllStarDropTargetKey(isAllStarEventKey(nextAllStarTarget) ? nextAllStarTarget : null);

      const hoveredRosterSlot = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-rogue-slot-index]");
      const nextTarget = hoveredRosterSlot?.getAttribute("data-rogue-slot-index");
      setDropTargetIndex(nextCutTarget || nextAllStarTarget ? null : nextTarget ? Number(nextTarget) : null);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const hoveredCutSlot = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-roster-cut-slot-index]");
      const nextCutTarget = hoveredCutSlot?.getAttribute("data-roster-cut-slot-index");

      if (nextCutTarget) {
        assignDraggedPlayerToCutSlot(draggingIndex, Number(nextCutTarget));
          setDraggingIndex(null);
          setDropTargetIndex(null);
          setCutDropTargetIndex(null);
          setAllStarDropTargetKey(null);
          setDragPointer(null);
        return;
      }

      const hoveredAllStarSlot = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-all-star-event-key]");
      const nextAllStarTarget = hoveredAllStarSlot?.getAttribute("data-all-star-event-key") ?? null;

      if (isAllStarEventKey(nextAllStarTarget)) {
        assignDraggedPlayerToAllStarEvent(draggingIndex, nextAllStarTarget);
        setDraggingIndex(null);
        setDropTargetIndex(null);
        setCutDropTargetIndex(null);
        setAllStarDropTargetKey(null);
        setDragPointer(null);
        return;
      }

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
      setCutDropTargetIndex(null);
      setAllStarDropTargetKey(null);
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
    onCloudDeleteRun?.();
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
    setCutDropTargetIndex(null);
    setAllStarDropTargetKey(null);
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
    onCloudDeleteRun?.();
    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setCutDropTargetIndex(null);
    setAllStarDropTargetKey(null);
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
    setCutDropTargetIndex(null);
    setAllStarDropTargetKey(null);
    setDragPointer(null);
    setRun({
      ...run,
      stage: "ladder-overview",
      selectedCutPlayerIds: [],
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      pendingChoiceSelection: null,
      allStarAssignments: { ...DEFAULT_ALL_STAR_ASSIGNMENTS },
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
        <div className="glass-panel rounded-[34px] border border-white/14 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(6,10,18,0.82),rgba(22,12,34,0.7))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)] lg:p-6">
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
          <div className="glass-panel rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(6,10,18,0.9))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] lg:p-6">
            <div className="grid gap-5">
              <div className="rounded-[24px] border border-sky-200/12 bg-[linear-gradient(135deg,rgba(14,35,58,0.54),rgba(9,13,22,0.82))] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]">
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
                            ? "border-sky-200/48 bg-[linear-gradient(135deg,rgba(56,189,248,0.26),rgba(14,165,233,0.12))] text-white shadow-[0_10px_24px_rgba(56,189,248,0.16)]"
                            : "border-white/10 bg-white/8 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/18 hover:bg-white/12",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-amber-200/12 bg-[linear-gradient(135deg,rgba(57,40,14,0.5),rgba(9,13,22,0.82))] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]">
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
                            ? "border-amber-200/44 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(180,83,9,0.12))] text-white shadow-[0_12px_28px_rgba(251,191,36,0.14)]"
                            : "border-white/10 bg-white/8 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/18 hover:bg-white/12",
                        )}
                      >
                        <div className="text-sm font-semibold">{option.label}</div>
                        <div className="mt-1 text-xs text-slate-300/78">{option.detail}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-fuchsia-200/12 bg-[linear-gradient(135deg,rgba(50,25,72,0.5),rgba(9,13,22,0.82))] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-200/16 bg-fuchsia-300/10 text-fuchsia-100">
                    <Package2 size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Starter Pack Upgrade</div>
                    <div className="mt-1 text-lg font-semibold text-white">Which opener should this run use?</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {STARTER_PACK_UPGRADE_OPTIONS.map((option) => {
                    const selected = selectedStarterPackUpgrade === option.value;
                    const ownedCount = starterPackUpgradeCounts[option.value];
                    const unlocked = ownedCount > 0;
                    const inventoryLabel =
                      option.value === "standard" ? "Always available" : unlocked ? "Owned" : "Not owned";

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => {
                          if (!unlocked) return;
                          setSelectedStarterPackUpgrade(option.value);
                        }}
                        className={clsx(
                          "rounded-[18px] border px-4 py-3 text-left transition",
                          selected
                            ? "border-fuchsia-200/44 bg-[linear-gradient(135deg,rgba(217,70,239,0.22),rgba(124,58,237,0.13))] text-white shadow-[0_14px_30px_rgba(217,70,239,0.16),inset_0_1px_0_rgba(255,255,255,0.07)]"
                            : unlocked
                              ? "border-white/10 bg-white/8 text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/18 hover:bg-white/12"
                              : "cursor-not-allowed border-white/8 bg-black/18 text-slate-500 opacity-75",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold">{option.label}</div>
                          <div
                            className={clsx(
                              "rounded-full border px-2 py-1 text-[9px] uppercase tracking-[0.16em]",
                              unlocked
                                ? selected
                                  ? "border-fuchsia-100/28 bg-white/10 text-fuchsia-50"
                                  : "border-white/10 bg-white/6 text-slate-300"
                                : "border-white/8 bg-black/14 text-slate-500",
                            )}
                          >
                            {unlocked ? "Unlocked" : "Locked"}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-slate-300/78">{option.detail}</div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em]">
                          <span className="rounded-full border border-white/10 bg-black/14 px-2.5 py-1 text-slate-300">
                            {option.targetAverage} avg target
                          </span>
                          <span className={clsx(
                            "rounded-full border px-2.5 py-1",
                            unlocked ? "border-emerald-200/22 bg-emerald-300/12 text-emerald-100" : "border-white/8 bg-black/18 text-slate-500",
                          )}>
                            {inventoryLabel}
                          </span>
                        </div>
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
                    key: "enableCoaches" as const,
                    title: "Coaches",
                    detail: "Hire a coach after starter reveal for a team-based +1 OVR boost.",
                    icon: Shield,
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
                        "rounded-[24px] border p-4 text-left shadow-[0_14px_30px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] transition",
                        enabled
                          ? "border-emerald-300/38 bg-[linear-gradient(135deg,rgba(6,78,59,0.48),rgba(16,185,129,0.18),rgba(6,24,38,0.42))] shadow-[0_16px_38px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.46),rgba(3,7,18,0.62))] hover:border-white/18 hover:bg-white/8",
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

          <div className="glass-panel rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(6,10,18,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] lg:p-6">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Preview</div>
            <h2 className="mt-2 font-display text-3xl text-white">What this setup changes</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-200/82">
              <div className="rounded-[20px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                Player pool: {selectedRunSettings.conferenceFilter === "both" ? "both conferences" : selectedRunSettings.conferenceFilter === "east" ? "Eastern Conference only" : "Western Conference only"}.
              </div>
              <div className="rounded-[20px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                Card line: {selectedRunSettings.currentSeasonOnly ? "current season only" : "all eras available"}.
              </div>
              <div className="rounded-[20px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                Top-end cards: {selectedRunSettings.excludeGalaxyCards ? "Galaxy cards removed" : "Galaxy cards allowed"}.
              </div>
              <div className="rounded-[20px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                Coaches: {selectedRunSettings.enableCoaches ? "hire 1 coach after starter reveal" : "skipped, with no coach bonuses"}.
              </div>
              <div className="rounded-[20px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                Starter upgrade: {STARTER_PACK_UPGRADE_OPTIONS.find((option) => option.value === selectedStarterPackUpgrade)?.label ?? "Standard"} pack, {getStarterPackAverageForUpgrade(selectedStarterPackUpgrade)} average target.
              </div>
              <div className="rounded-[20px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.045))] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
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
                  onClick={() => {
                    setSelectedRunSettings(DEFAULT_ROGUELIKE_RUN_SETTINGS);
                    setSelectedStarterPackUpgrade(bestOwnedStarterPackUpgrade);
                  }}
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
      <section className="space-y-3">
        <div className="rounded-[26px] border border-white/14 bg-[linear-gradient(180deg,rgba(9,13,21,0.98),rgba(12,18,28,0.99))] px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-fuchsia-100/80">Roguelike Run</div>
              <h1 className="mt-1 font-display text-3xl text-white">Starter Reveal</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Open the three starter cards from your selected pack to reveal the foundation of this Rogue run.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackToHome}
              className="rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/14 bg-[linear-gradient(180deg,rgba(10,14,20,0.98),rgba(16,22,32,0.99))] px-5 py-4 shadow-card">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Starter Reveal</div>
          <h2 className="mt-1 font-display text-2xl text-white">Open your first 3 cards</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Reveal all three to see which players are starting this run before you move on to the Run Ladder.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-5">
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
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={proceedToRunLadder}
                className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
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

    if (run.stage === "coach-select") {
      return (
        <section className="space-y-5">
          <div className="rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(9,13,21,0.98),rgba(12,18,28,0.99))] p-6 shadow-card">
            <div className="max-w-4xl">
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-100/80">Hire a Coach</div>
              <h1 className="mt-2 font-display text-4xl text-white">Choose 1 coach for this run</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Your coach gives all players from their NBA team +1 overall for the rest of this Rogue run. Pick the team boost that best matches the run you want to build.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-200">
                <Shield size={14} className="text-emerald-100" />
                Applies to every future player you add from that team
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-5 md:grid-cols-2">
            {run.coachChoices.map((coach) => (
              <CoachChoiceCard key={coach.id} coach={coach} onHire={() => hireCoach(coach.id)} />
            ))}
          </div>
        </section>
      );
    }

    if (run.stage === "coaching-change") {
      const currentCoach = getRoguelikeCoachById(run.hiredCoachId);
      const currentCoachTeam = currentCoach ? getNbaTeamByName(currentCoach.teamName) : null;
      const coachChangeRun = getHydratedRun(run, runNodes);
      const coachChangeCoachTeamKey = getRoguelikeCoachTeamKey(run.hiredCoachId);
      const coachChangeAllStarBonusBadges = run.allStarBonusBadges ?? [];
      const coachChangeOwnedPlayers = getRunOwnedPlayers(coachChangeRun);
      const coachChangeOwnedPlayerIds = coachChangeOwnedPlayers.map((player) => player.id);
      const coachChangeFurthestOccupiedSlotIndex = coachChangeRun.lineup.reduce(
        (furthestIndex, slot, index) => (slot.player ? index : furthestIndex),
        -1,
      );
      const coachChangeVisibleRosterSlotCount = Math.min(
        10,
        Math.max(5, coachChangeOwnedPlayers.length, coachChangeFurthestOccupiedSlotIndex + 1),
      );
      const coachChangeVisibleLineup = coachChangeRun.lineup.slice(0, coachChangeVisibleRosterSlotCount);
      const coachChangeBoostedPlayerCount = coachChangeOwnedPlayers.filter((player) =>
        getCoachBoostForPlayer(player, coachChangeCoachTeamKey) > 0,
      ).length;

      return (
        <>
          <section className="space-y-5">
            <div className="rounded-[30px] border border-white/14 bg-[linear-gradient(180deg,rgba(9,13,21,0.98),rgba(12,18,28,0.99))] p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">Coaching Change</div>
                  <h1 className="mt-2 font-display text-4xl text-white">Keep your coach or change the boost</h1>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Re-sign your current coach to keep the same +1 team boost, or fire them and hire a new coach to shift your roster-building target.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCoachChangeRoster(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-100/22 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:scale-[1.02] hover:border-cyan-100/34 hover:bg-cyan-300/16"
                >
                  <Users size={16} />
                  View Run Roster
                </button>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.7fr)]">
              <div className="rounded-[28px] border border-emerald-200/18 bg-[linear-gradient(180deg,rgba(6,78,59,0.18),rgba(10,16,26,0.96))] p-5 shadow-card">
                <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-100/80">Current Coach</div>
                {currentCoach ? (
                  <>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/12 bg-white/8">
                        {currentCoachTeam?.logo ? (
                          <img
                            src={currentCoachTeam.logo}
                            alt=""
                            className="h-12 w-12 object-contain"
                            draggable={false}
                          />
                        ) : (
                          <Shield size={28} className="text-emerald-100" />
                        )}
                      </div>
                      <div>
                        <div className="font-display text-2xl text-white">{currentCoach.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {currentCoach.teamName} +1 OVR
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => completeCoachingChange(currentCoach.id, true)}
                      className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:scale-[1.01]"
                    >
                      Re-sign Coach
                      <CheckCircle2 size={16} />
                    </button>
                  </>
                ) : (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/6 p-4 text-sm leading-6 text-slate-300">
                    No coach is currently hired, so choose one of the available coaches to activate a team boost.
                  </div>
                )}
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Available Replacements</div>
                    <div className="mt-1 text-sm text-slate-300">Hiring a new coach immediately changes which team gets the +1 OVR boost.</div>
                  </div>
                </div>
                <div
                  className={clsx(
                    "gap-5",
                    isMobileViewport ? "grid grid-cols-5 gap-1.5" : "grid md:grid-cols-2 xl:grid-cols-5",
                  )}
                >
                  {run.coachChoices.map((coach) => (
                    <CoachChoiceCard
                      key={coach.id}
                      coach={coach}
                      actionLabel="Hire"
                      onHire={() => completeCoachingChange(coach.id, false)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
          {showCoachChangeRoster ? (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm">
              <div className="max-h-[calc(100vh-48px)] w-full max-w-5xl overflow-y-auto rounded-[30px] border border-white/14 bg-[#070b12]/98 shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#070b12]/96 px-5 py-4 backdrop-blur-xl">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/78">Run Roster</div>
                    <div className="mt-1 font-display text-2xl text-white">Check your team before choosing</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCoachChangeRoster(false)}
                    className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
                <div className="p-5">
                  {currentCoach ? (
                    <div className="mb-5">
                      <CardLabCoachRunRosterCard
                        coach={{
                          id: currentCoach.id,
                          label: currentCoach.name,
                          teamName: currentCoach.teamName,
                          conference: currentCoach.conference,
                        }}
                        boostedCount={coachChangeBoostedPlayerCount}
                        rosterCount={coachChangeVisibleRosterSlotCount}
                      />
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {coachChangeVisibleLineup.map((slot, index) => (
                      <div key={`${slot.slot}-${index}`}>
                        {index === 5 ? (
                          <div className="mb-5 mt-7">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                            <div className="mt-2 text-center text-[10px] uppercase tracking-[0.24em] text-slate-500">
                              Bench Unit
                            </div>
                          </div>
                        ) : null}
                        <div className="rounded-[24px] border border-dashed border-white/12 bg-black/12 p-1.5">
                          <RogueRosterSlotCard
                            slot={slot}
                            index={index}
                            ownedPlayerIds={coachChangeOwnedPlayerIds}
                            trainedPlayerIds={run.trainedPlayerIds ?? []}
                            coachTeamKey={coachChangeCoachTeamKey}
                            allStarBonusBadges={coachChangeAllStarBonusBadges}
                            dragged={false}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      );
    }

  const activeNode = run.activeNode;
  const displayedRun = getHydratedRun(run, runNodes);
  const runHiredCoach = run.hiredCoachId
    ? run.coachChoices.find((coach) => coach.id === run.hiredCoachId) ?? getRoguelikeCoachById(run.hiredCoachId)
    : null;
  const runCoachTeamKey = getRoguelikeCoachTeamKey(run.hiredCoachId);
  const runAllStarBonusBadges = run.allStarBonusBadges ?? [];
  const runOwnedPlayers = getRunOwnedPlayers(displayedRun);
  const runOwnedPlayerIds = runOwnedPlayers.map((player) => player.id);
  const runEffectiveBossTrainedPlayerIds = getEffectiveBossTrainedPlayerIds(run);
  const runDisplayTrainedPlayerIds =
    run.activeSpecialStuffPlayerId && ["locker-room", "faceoff-setup", "faceoff-game"].includes(run.stage)
      ? runEffectiveBossTrainedPlayerIds
      : run.trainedPlayerIds ?? [];
  const runOwnedDisplayPlayers = runOwnedPlayers.map((player) =>
    getRunDisplayPlayer(player, runOwnedPlayerIds, runDisplayTrainedPlayerIds, runCoachTeamKey),
  );
  const runOwnedDisplayPlayerById = new Map(runOwnedDisplayPlayers.map((player) => [player.id, player]));
  const runCoachBoostedPlayerCount = runOwnedPlayers.filter((player) =>
    getCoachBoostForPlayer(player, runCoachTeamKey) > 0,
  ).length;
  const currentLadderNode = runNodes[Math.min(run.floorIndex, runNodes.length - 1)] ?? null;
  const nextBossNode = getUpcomingBossNodeForLockerRoom(run, runNodes);
  const nextBossScouted = Boolean(nextBossNode && run.scoutedBossNodeIds.includes(nextBossNode.id));
  const scoutedBossLineup = nextBossScouted ? getScoutedBossLineup(run, nextBossNode, runPlayerUniverse) : [];
  const canApplySpecialStuff =
    Boolean(nextBossNode) && (run.specialStuffInventoryCount > 0 || Boolean(run.activeSpecialStuffPlayerId));
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
  const startingFiveMetrics = evaluateRoguelikeLineup(
    startingFive,
    runOwnedPlayerIds,
    runDisplayTrainedPlayerIds,
    runCoachTeamKey,
  );
  const shotCreationScore = getAverageAdjustedOffense(startingFive, runOwnedPlayerIds, runDisplayTrainedPlayerIds);
  const reboundingChallengeScore = getAverageAdjustedRebounding(startingFive, runOwnedPlayerIds, runDisplayTrainedPlayerIds);
  const challengeMetric = activeNode?.checks?.[0]?.metric ?? "offense";
  const canUseDraftShuffle =
    run.draftShuffleTickets > 0 &&
    (run.stage === "initial-draft" || run.stage === "reward-draft") &&
    run.choices.length > 0;
  const draftChoiceRevealKey = [
    run.stage,
    run.floorIndex,
    run.initialPicks,
    run.pendingTradeState?.outgoingPlayerId ?? "standard",
    run.choices.map((player) => player.id).join("|"),
  ].join(":");
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
  const simulationResult = activeSimulationResult;
  const simulationDurationMs = simulationResult?.durationMs ?? SIMULATION_DURATION_MS;
  const clampedSimulationElapsedMs = Math.min(simulationElapsedMs, simulationDurationMs);
  const simulationComplete =
    Boolean(simulationResult) && clampedSimulationElapsedMs >= simulationDurationMs;
  const visibleSimulationEvents =
    simulationResult?.timeline.filter((event) => event.playbackMs <= clampedSimulationElapsedMs) ?? [];
  const simulationLiveScore = visibleSimulationEvents.reduce<RoguelikeSimulationScore>(
    (score, event) => ({
      user: score.user + (event.team === "user" ? event.points : 0),
      opponent: score.opponent + (event.team === "opponent" ? event.points : 0),
    }),
    { user: 0, opponent: 0 },
  );
  const simulationQuarterLengthMs = simulationDurationMs / 4;
  const currentSimulationQuarter = Math.min(
    4,
    Math.max(1, Math.floor(clampedSimulationElapsedMs / simulationQuarterLengthMs) + 1),
  ) as 1 | 2 | 3 | 4;
  const currentQuarterElapsedMs =
    clampedSimulationElapsedMs - (currentSimulationQuarter - 1) * simulationQuarterLengthMs;
  const currentSimulationClock = formatGameClock(
    QUARTER_SECONDS - (currentQuarterElapsedMs / simulationQuarterLengthMs) * QUARTER_SECONDS,
  );
  const simulationQuarterScores = SIMULATION_QUARTERS.map((quarter) => {
    const events = visibleSimulationEvents.filter((event) => event.quarter === quarter);
    return {
      quarter,
      user: events.reduce((sum, event) => sum + (event.team === "user" ? event.points : 0), 0),
      opponent: events.reduce((sum, event) => sum + (event.team === "opponent" ? event.points : 0), 0),
    };
  });
  const simulationWinner =
    simulationComplete && simulationLiveScore.user !== simulationLiveScore.opponent
      ? simulationLiveScore.user > simulationLiveScore.opponent
        ? "user"
        : "opponent"
      : null;
  const recentSimulationEvents = [...visibleSimulationEvents].reverse().slice(0, 6);
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
        player: getRunDisplayPlayer(slot.player, runOwnedPlayerIds, runDisplayTrainedPlayerIds, runCoachTeamKey),
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
      ? run.utilityReturnState.stage === "locker-room"
        ? "Back to Locker Room"
        : "Back to Game"
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
                : activeNode?.id === LOCKER_ROOM_SPECIAL_STUFF_NODE.id
                  ? {
                      eyebrow: "Locker Room Boost",
                      description: `Choose 1 player to gain +${SPECIAL_STUFF_BOOST_AMOUNT} OVR for the upcoming boss battle only.`,
                      detail: run.activeSpecialStuffPlayerId
                        ? "Changing the selected player will keep using the same purchased Special Stuff. The boost still expires after the next boss game."
                        : "This consumes 1 owned Special Stuff, does not count as permanent training, and expires after the next boss game.",
                      actionLabel: run.activeSpecialStuffPlayerId ? "Change Special Stuff target" : "Apply Special Stuff",
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
  const showDraftRosterRail = [
    "choice-select",
    "initial-draft",
    "reward-draft",
    "coach-select",
    "coaching-change",
    "faceoff-setup",
    "challenge-setup",
    "add-position-select",
    "all-star-select",
    "roster-cut-select",
    "training-select",
    "trade-offer",
    "trade-select",
    "evolution-select",
  ].includes(run.stage) ||
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
  const showingPostFaceoffAnalysis =
    run.stage === "faceoff-game" && Boolean(run.nodeResult?.faceoffResult);
  const shouldRenderOutcomeOverlay =
    showOutcomeOverlay &&
    run.stage === "faceoff-game" ||
    showOutcomeOverlay && run.stage === "node-result" ||
    showOutcomeOverlay && run.stage === "reward-draft" && Boolean(run.nodeResult?.challengeResult) ||
    showOutcomeOverlay && run.stage === "run-over" ||
    showOutcomeOverlay && run.stage === "run-cleared";
  const hideRightRail =
    run.stage === "locker-room" ||
    showingPostFaceoffAnalysis ||
    run.stage === "training-select" ||
    run.stage === "reward-replace-select";
  const showMobileBottomNav = isMobileViewport && showDraftRosterRail && !hideRightRail;
  const showMobileRosterPanel = showMobileBottomNav && mobileBottomPanel === "roster";
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
  const selectedCutSlotPlayers = [0, 1].map((slotIndex) => {
    const playerId = run.selectedCutPlayerIds[slotIndex];
    return playerId ? runOwnedDisplayPlayers.find((player) => player.id === playerId) ?? null : null;
  });
  const runRosterPanel = (
    <div className="glass-panel rounded-[30px] p-6 shadow-card">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Roster</div>
        {run.stage === "roster-cut-select" ? (
          <div className="mt-3 rounded-[22px] border border-rose-200/14 bg-rose-300/8 px-4 py-3 text-sm leading-6 text-slate-100">
            Set your lineup and bench order here, then drag exactly 2 players into the cut slots. Red cards are currently selected for removal.
          </div>
        ) : null}
        {runHiredCoach ? (
          <div className="mt-3">
            <CardLabCoachRunRosterCard
              coach={{
                id: runHiredCoach.id,
                label: runHiredCoach.name,
                teamName: runHiredCoach.teamName,
                conference: runHiredCoach.conference,
              }}
              boostedCount={runCoachBoostedPlayerCount}
              rosterCount={visibleRosterSlotCount}
            />
          </div>
        ) : null}
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
                    trainedPlayerIds={runDisplayTrainedPlayerIds}
                    coachTeamKey={runCoachTeamKey}
                    allStarBonusBadges={runAllStarBonusBadges}
                  focusMetrics={challengeReviewFocusMetrics}
                  cutSelectionMode={run.stage === "roster-cut-select"}
                  selectedForCut={Boolean(slot.player && run.selectedCutPlayerIds.includes(slot.player.id))}
                  dragged={draggingIndex === index}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const useCompactRunHeader =
    run.stage === "initial-draft" ||
    run.stage === "reward-draft" ||
    run.stage === "reward-replace-select";

  const headerPanel = (
    <div className={clsx("glass-panel shadow-card", useCompactRunHeader ? "rounded-[24px] p-4" : "rounded-[30px] p-6")}>
      <div className={clsx("flex flex-wrap justify-between", useCompactRunHeader ? "items-center gap-3" : "items-start gap-4")}>
        <div>
          <div className={clsx("uppercase text-fuchsia-100/80", useCompactRunHeader ? "text-[10px] tracking-[0.2em]" : "text-xs tracking-[0.24em]")}>
            Roguelike Run
          </div>
          <h1 className={clsx("font-display text-white", useCompactRunHeader ? "mt-1 truncate whitespace-nowrap text-[clamp(1rem,1.9vw,2.1rem)] leading-[1.02]" : "mt-2 text-4xl")}>
            {headerTitle}
          </h1>
          <p className={clsx("max-w-3xl text-slate-300", useCompactRunHeader ? "mt-2 text-xs leading-5" : "mt-3 text-sm leading-7")}>
            {headerDescription}
          </p>
        </div>
        <div className={clsx("flex flex-wrap", useCompactRunHeader ? "gap-2" : "gap-3")}>
          <button
            type="button"
            onClick={leaveRun}
            className={clsx(
              "border border-white/12 bg-white/6 text-left text-slate-100 transition hover:scale-[1.02] hover:border-white/20 hover:bg-white/10",
              useCompactRunHeader ? "rounded-[18px] px-4 py-2.5" : "rounded-[22px] px-5 py-3",
            )}
          >
            <div className={clsx("uppercase text-slate-300/82", useCompactRunHeader ? "text-[9px] tracking-[0.18em]" : "text-[10px] tracking-[0.2em]")}>
              Leave Run
            </div>
            <div className={clsx("font-semibold text-white", useCompactRunHeader ? "mt-1 text-lg" : "mt-2 text-2xl")}>Save & Exit</div>
          </button>
          <button
            type="button"
            onClick={abortRun}
            className={clsx(
              "border border-rose-200/22 bg-[linear-gradient(135deg,rgba(127,29,29,0.95),rgba(153,27,27,0.92),rgba(69,10,10,0.96))] text-left text-rose-50 shadow-[0_16px_36px_rgba(127,29,29,0.24)] transition hover:scale-[1.02] hover:border-rose-100/30 hover:bg-[linear-gradient(135deg,rgba(153,27,27,0.98),rgba(185,28,28,0.94),rgba(87,13,13,0.98))]",
              useCompactRunHeader ? "rounded-[18px] px-4 py-2.5" : "rounded-[22px] px-5 py-3",
            )}
          >
            <div className={clsx("uppercase text-rose-100/82", useCompactRunHeader ? "text-[9px] tracking-[0.18em]" : "text-[10px] tracking-[0.2em]")}>
              Abort Run
            </div>
            <div className={clsx("font-semibold text-white", useCompactRunHeader ? "mt-1 text-lg" : "mt-2 text-2xl")}>End Now</div>
          </button>
          <button
            type="button"
            onClick={useDraftShuffleTicket}
            disabled={!canUseDraftShuffle}
            className={clsx(
              "border text-left transition",
              useCompactRunHeader ? "rounded-[18px] px-4 py-2.5" : "rounded-[22px] px-5 py-3",
              canUseDraftShuffle
                ? "border-indigo-200/22 bg-[linear-gradient(135deg,rgba(37,46,104,0.95),rgba(67,56,202,0.88),rgba(20,24,60,0.96))] text-indigo-50 shadow-[0_16px_36px_rgba(67,56,202,0.24)] hover:scale-[1.02] hover:border-indigo-100/30"
                : "cursor-not-allowed border-white/10 bg-white/5 text-slate-300 opacity-70",
            )}
          >
            <div className={clsx("flex items-center gap-2 uppercase text-current", useCompactRunHeader ? "text-[9px] tracking-[0.18em]" : "text-[10px] tracking-[0.2em]")}>
              <RefreshCcw size={12} />
              Draft Shuffle
            </div>
            <div className={clsx("font-semibold text-white", useCompactRunHeader ? "mt-1 text-base" : "mt-2 text-xl")}>{run.draftShuffleTickets}</div>
            <div className={clsx("mt-1 uppercase tracking-[0.16em] text-current", useCompactRunHeader ? "text-[9px]" : "text-[11px]")}>
              {canUseDraftShuffle ? "Reroll current board" : "No live board to reroll"}
            </div>
          </button>
          {canUseStoreUtilities && ownedTrainingCampTickets > 0 ? (
            <button
              type="button"
              onClick={openStoreTrainingCamp}
              className={clsx(
                "border border-sky-200/18 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,52,96,0.9),rgba(9,19,34,0.96))] text-left text-sky-50 shadow-[0_16px_36px_rgba(14,116,144,0.2)] transition hover:scale-[1.02] hover:border-sky-100/30",
                useCompactRunHeader ? "rounded-[18px] px-4 py-2.5" : "rounded-[22px] px-5 py-3",
              )}
            >
              <div className={clsx("uppercase text-sky-100/82", useCompactRunHeader ? "text-[9px] tracking-[0.18em]" : "text-[10px] tracking-[0.2em]")}>
                Training Camp Ticket
              </div>
              <div className={clsx("font-semibold text-white", useCompactRunHeader ? "mt-1 text-base" : "mt-2 text-xl")}>Use Ticket</div>
              <div className={clsx("mt-1 uppercase tracking-[0.16em] text-sky-100/74", useCompactRunHeader ? "text-[9px]" : "text-[11px]")}>
                {ownedTrainingCampTickets} owned
              </div>
            </button>
          ) : null}
          {canUseStoreUtilities && ownedTradePhones > 0 ? (
            <button
              type="button"
              onClick={openStoreTradePhone}
              className={clsx(
                "border border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(54,18,76,0.95),rgba(91,33,182,0.84),rgba(25,12,48,0.96))] text-left text-fuchsia-50 shadow-[0_16px_36px_rgba(126,34,206,0.22)] transition hover:scale-[1.02] hover:border-fuchsia-100/30",
                useCompactRunHeader ? "rounded-[18px] px-4 py-2.5" : "rounded-[22px] px-5 py-3",
              )}
            >
              <div className={clsx("uppercase text-fuchsia-100/82", useCompactRunHeader ? "text-[9px] tracking-[0.18em]" : "text-[10px] tracking-[0.2em]")}>
                Trade Phone
              </div>
              <div className={clsx("font-semibold text-white", useCompactRunHeader ? "mt-1 text-base" : "mt-2 text-xl")}>Make A Trade</div>
              <div className={clsx("mt-1 uppercase tracking-[0.16em] text-fuchsia-100/74", useCompactRunHeader ? "text-[9px]" : "text-[11px]")}>
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
    <section className={clsx("space-y-6", showMobileBottomNav && "pb-28")}>
      {showInlineRosterHeaderLayout ? null : headerPanel}

      <div
        className={clsx(
          "grid gap-6",
          run.stage === "ladder-overview" || hideRightRail || showMobileBottomNav
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
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
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

                  <div className="rounded-[28px] border border-cyan-200/18 bg-[linear-gradient(135deg,rgba(14,116,144,0.24),rgba(7,20,32,0.94))] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xl font-semibold text-white">
                          <PillBottle size={20} className="text-cyan-100" />
                          Special Stuff
                        </div>
                        <div className="mt-3 text-sm leading-7 text-slate-300">
                          Buy now, apply later. When used, 1 player gets +{SPECIAL_STUFF_BOOST_AMOUNT} OVR for the next boss battle only.
                        </div>
                      </div>
                      <div className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                        {getLockerRoomItemPrice("special-stuff")} Cash
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {run.activeSpecialStuffPlayerId
                          ? `Active: ${getPlayerById(run.activeSpecialStuffPlayerId)?.name ?? "selected player"}`
                          : run.specialStuffInventoryCount > 0
                            ? `Owned: ${run.specialStuffInventoryCount}`
                          : nextBossNode
                            ? `Next boss: ${nextBossNode.title}`
                            : "No upcoming boss"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={buyLockerRoomSpecialStuff}
                          disabled={!nextBossNode || run.lockerRoomCash < getLockerRoomItemPrice("special-stuff")}
                          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
                        >
                          Buy
                        </button>
                        <button
                          type="button"
                          onClick={() => openLockerRoomSelection(LOCKER_ROOM_SPECIAL_STUFF_NODE)}
                          disabled={!nextBossNode || (run.specialStuffInventoryCount <= 0 && !run.activeSpecialStuffPlayerId)}
                          className="rounded-full border border-white/14 bg-white/6 px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/5 disabled:text-white/38"
                        >
                          {run.activeSpecialStuffPlayerId ? "Change Player" : "Apply"}
                        </button>
                      </div>
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
                      title: "Sniper Badge",
                      description: "Add the Sniper badge to 1 player on your current run roster.",
                      badgeType: "sniper" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_SHOOTING_NODE,
                      tone: "border-sky-200/18 bg-[linear-gradient(135deg,rgba(14,116,144,0.24),rgba(7,20,32,0.94))]",
                    },
                    {
                      id: "practice-rebounding" as LockerRoomItemId,
                      title: "Board Man Badge",
                      description: "Add the Board Man badge to 1 player on your current run roster.",
                      badgeType: "board-man" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_REBOUNDING_NODE,
                      tone: "border-amber-200/18 bg-[linear-gradient(135deg,rgba(120,53,15,0.24),rgba(28,18,8,0.94))]",
                    },
                    {
                      id: "practice-defense" as LockerRoomItemId,
                      title: "Lockdown Badge",
                      description: "Add the Lockdown badge to 1 player on your current run roster.",
                      badgeType: "lockdown" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_DEFENSE_NODE,
                      tone: "border-emerald-200/18 bg-[linear-gradient(135deg,rgba(12,74,50,0.24),rgba(8,22,18,0.94))]",
                    },
                    {
                      id: "practice-playmaking" as LockerRoomItemId,
                      title: "Playmaker Badge",
                      description: "Add the Playmaker badge to 1 player on your current run roster.",
                      badgeType: "playmaker" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_PLAYMAKING_NODE,
                      tone: "border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(91,33,182,0.24),rgba(16,10,32,0.94))]",
                    },
                    {
                      id: "practice-offense" as LockerRoomItemId,
                      title: "Slasher Badge",
                      description: "Add the Slasher badge to 1 player on your current run roster.",
                      badgeType: "slasher" as PlayerTypeBadge,
                      node: LOCKER_ROOM_PRACTICE_OFFENSE_NODE,
                      tone: "border-rose-200/18 bg-[linear-gradient(135deg,rgba(136,19,55,0.24),rgba(28,12,16,0.94))]",
                    },
                    ].map((item) => (
                      <div key={item.id} className={`rounded-[28px] border p-4 ${item.tone}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">Player Type Badge</div>
                          <div className="shrink-0 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                            {getLockerRoomItemPrice(item.id)} Cash
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4">
                          <div
                            className={clsx(
                              "flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[22px] border backdrop-blur-sm shadow-[0_18px_34px_rgba(0,0,0,0.18)]",
                              playerTypeBadgeStyleClass[item.badgeType],
                            )}
                          >
                            <div className="scale-[1.5]">{renderPlayerTypeBadgeIcon(item.badgeType, false)}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[1.95rem] font-semibold leading-[0.98] text-white">{item.title}</div>
                            <div className="mt-2 text-sm leading-6 text-slate-300">{item.description}</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-black/14 px-3 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                            Add to 1 run-roster player
                          </div>
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
                <div
                  className={clsx(
                    "mt-6 overflow-visible px-1 pt-2 pb-3",
                    isMobileViewport ? "grid gap-1.5" : "flex flex-wrap justify-center gap-3",
                  )}
                  style={isMobileViewport ? { gridTemplateColumns: `repeat(${run.choices.length}, minmax(0, 1fr))` } : undefined}
                >
                {run.choices.map((player, index) => (
                  <DraftChoiceRevealCard
                    key={`${draftChoiceRevealKey}-${player.id}`}
                    index={index}
                    compactScale={0.46}
                    revealKey={draftChoiceRevealKey}
                  >
                    <DraftPlayerCard
                      player={player}
                      onSelect={draftChoice}
                      compact
                      compactScale={0.46}
                      draftedPlayerIds={runOwnedPlayerIds}
                      playerTypeBadgesOverride={getRunPlayerTypeBadgeOverrides(player, runAllStarBonusBadges)}
                      enableTeamChemistryPreview
                      coachConnectionActive={getCoachBoostForPlayer(player, runCoachTeamKey) > 0}
                    />
                  </DraftChoiceRevealCard>
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
              {(run.specialStuffInventoryCount > 0 || run.activeSpecialStuffPlayerId) && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-cyan-200/18 bg-cyan-300/8 px-4 py-4 text-sm text-slate-100">
                  <div>
                    <div className="font-semibold text-cyan-50">Special Stuff</div>
                    <div className="mt-1 text-slate-300">
                      {run.activeSpecialStuffPlayerId
                        ? `${getPlayerById(run.activeSpecialStuffPlayerId)?.name ?? "Selected player"} is boosted +${SPECIAL_STUFF_BOOST_AMOUNT} OVR for this boss game.`
                        : `${run.specialStuffInventoryCount} owned. Apply one before tipoff to give a player +${SPECIAL_STUFF_BOOST_AMOUNT} OVR for this boss game.`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openSpecialStuffSelection}
                    disabled={!canApplySpecialStuff}
                    className="rounded-full border border-cyan-100/24 bg-cyan-100/12 px-5 py-2.5 text-sm font-semibold text-cyan-50 transition hover:scale-[1.02] hover:bg-cyan-100/18 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/5 disabled:text-white/38"
                  >
                    {run.activeSpecialStuffPlayerId ? "Change Player" : "Apply"}
                  </button>
                </div>
              )}
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
                        trainedPlayerIds={runDisplayTrainedPlayerIds}
                        coachTeamKey={runCoachTeamKey}
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
                  Start Game
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
                    playerTypeBadgesOverride={getRunPlayerTypeBadgeOverrides(player, runAllStarBonusBadges)}
                    enableTeamChemistryPreview
                    coachConnectionActive={getCoachBoostForPlayer(player, runCoachTeamKey) > 0}
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
                Set your lineup and bench order in the Run Roster panel, then drag exactly 2 players into the cut slots below. Those players will be removed permanently, and the rest of your rotation will carry forward.
              </p>
              <div className="mt-5 rounded-[22px] border border-rose-200/14 bg-rose-300/8 px-4 py-4 text-sm text-slate-100">
                Cuts selected: {run.selectedCutPlayerIds.length}/2. Drop players into both cut slots, then confirm the move.
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {selectedCutSlotPlayers.map((player, slotIndex) => (
                  <div
                    key={`cut-slot-${slotIndex}`}
                    data-roster-cut-slot-index={slotIndex}
                    className={clsx(
                      "min-h-[128px] rounded-[24px] border border-dashed p-4 transition",
                      cutDropTargetIndex === slotIndex
                        ? "border-rose-200/70 bg-rose-400/18 shadow-[0_0_26px_rgba(248,113,113,0.16)]"
                        : player
                          ? "border-rose-200/34 bg-rose-500/12"
                          : "border-white/14 bg-white/6",
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-[0.22em] text-rose-100/78">
                      Cut Slot {slotIndex + 1}
                    </div>
                    {player ? (
                      <div className="mt-4 space-y-3">
                        <RunRosterPlayerCard
                          player={player}
                          displayPlayer={player}
                          draftedPlayerIds={runOwnedPlayerIds}
                          scale={0.74}
                          enableTeamChemistry
                          coachConnectionActive={getCoachBoostForPlayer(player, runCoachTeamKey) > 0}
                          badgesOverride={getRoguelikePlayerTypeBadges(player, runAllStarBonusBadges)}
                          className="border-rose-200/40 bg-rose-500/10 shadow-[0_0_26px_rgba(244,63,94,0.12)]"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex rounded-full border border-rose-200/18 bg-rose-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-rose-100">
                            Selected to cut
                          </div>
                        <button
                          type="button"
                          onClick={() => removeCutSlotSelection(slotIndex)}
                          className="shrink-0 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                        >
                          Remove
                        </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm leading-6 text-slate-300">
                        Drag a roster card here.
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-slate-200">
                Tip: arrange the roster first if you want to check team gaps, then drag the two players you want removed into the cut slots.
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
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">All-Star Weekend</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Drag players from your Run Roster into each event slot. Every event awards its listed player-type badge for the rest of the run.
              </p>
              <div className="mt-5 rounded-[22px] border border-violet-200/14 bg-violet-300/8 px-4 py-4 text-sm leading-6 text-slate-100">
                Each player can only enter one event. Dropping the same player into a new event will move them from their previous slot.
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
                {ALL_STAR_EVENT_CARDS.map((eventCard) => {
                  const assignedPlayer = getAllStarAssignedPlayer(eventCard.key);
                  const selected = Boolean(assignedPlayer);
                  const highlighted = allStarDropTargetKey === eventCard.key;

                  return (
                  <div
                    key={eventCard.key}
                    data-all-star-event-key={eventCard.key}
                    className={clsx(
                      "min-h-[238px] rounded-[24px] border border-dashed p-4 transition",
                      highlighted
                        ? "border-violet-200/70 bg-violet-400/18 shadow-[0_0_30px_rgba(167,139,250,0.2)]"
                        : selected
                          ? "border-violet-200/34 bg-violet-500/12 shadow-[0_16px_36px_rgba(0,0,0,0.24)]"
                          : "border-white/14 bg-white/6",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border",
                          playerTypeBadgeStyleClass[eventCard.badgeType],
                        )}
                      >
                        <div className="scale-125">{renderPlayerTypeBadgeIcon(eventCard.badgeType, false)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{eventCard.title}</div>
                        <div className="mt-1 text-sm font-semibold text-white">{eventCard.stat}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      {assignedPlayer ? (
                        <div className="space-y-3">
                          <AllStarEventPlayerCard player={assignedPlayer} />
                          <div className="flex items-center justify-between gap-2">
                            <div className="rounded-full border border-violet-200/18 bg-violet-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-violet-100">
                              Assigned
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAllStarAssignment(eventCard.key)}
                              className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-white/14 bg-black/16 px-4 py-8 text-center text-sm leading-6 text-slate-300">
                          Drag a roster card here.
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runAllStarSaturday}
                  disabled={!allStarAssignmentsComplete({ ...DEFAULT_ALL_STAR_ASSIGNMENTS, ...run.allStarAssignments })}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    allStarAssignmentsComplete({ ...DEFAULT_ALL_STAR_ASSIGNMENTS, ...run.allStarAssignments })
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Begin All-Star Weekend
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
                    playerTypeBadgesOverride={getRunPlayerTypeBadgeOverrides(player, runAllStarBonusBadges)}
                    enableTeamChemistryPreview
                    coachConnectionActive={getCoachBoostForPlayer(player, runCoachTeamKey) > 0}
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
                  : "It's Trade Deadline day. If you trade 1 player away, your 5 replacement choices will be limited to players of similar caliber."}
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
                Select 1 player from your run roster to trade away. After that, you'll get to draft 1 replacement from 5 players whose OVR is within 1 point of the player you moved.
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
                    playerTypeBadgesOverride={getRunPlayerTypeBadgeOverrides(player, runAllStarBonusBadges)}
                    enableTeamChemistryPreview
                    coachConnectionActive={getCoachBoostForPlayer(player, runCoachTeamKey) > 0}
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
                    playerTypeBadgesOverride={getRunPlayerTypeBadgeOverrides(
                      runOwnedDisplayPlayerById.get(option.currentPlayer.id) ?? option.currentPlayer,
                      runAllStarBonusBadges,
                    )}
                    enableTeamChemistryPreview
                    coachConnectionActive={getCoachBoostForPlayer(option.currentPlayer, runCoachTeamKey) > 0}
                    actionLabel={`Evolve to ${option.nextPlayer.overall} OVR`}
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "faceoff-game" && activeNode && run.nodeResult?.faceoffResult && (
            <div className="glass-panel overflow-hidden rounded-[30px] p-0 shadow-card">
              {simulationResult ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_34%),linear-gradient(135deg,rgba(6,10,18,0.98),rgba(9,18,30,0.98),rgba(12,10,20,0.98))]" />
                  <div className="relative p-5 lg:p-7">
                    <div>
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-emerald-50/84">
                          Live Simulation
                        </div>
                        <h2 className="mt-3 font-display text-[clamp(2.2rem,5vw,4.8rem)] leading-none text-white">
                          {activeNode.opponentTeamName ?? "Boss Battle"}
                        </h2>
                        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
                          The result is locked in. Watch the precomputed game play out, then review the final box score and matchup breakdown.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
                      <div className="rounded-[30px] border border-white/12 bg-black/22 p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setSimulationPlaying((playing) => !playing)}
                            disabled={simulationComplete}
                            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/18 disabled:text-white/50"
                          >
                            {simulationPlaying ? <Pause size={15} /> : <Play size={15} />}
                            {simulationPlaying ? "Pause" : simulationComplete ? "Complete" : "Play"}
                          </button>
                          {[1, 2, 4].map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => setSimulationSpeed(speed as 1 | 2 | 4)}
                              className={clsx(
                                "rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                                simulationSpeed === speed
                                  ? "border-emerald-200/32 bg-emerald-300/14 text-emerald-50"
                                  : "border-white/12 bg-white/6 text-white/78 hover:bg-white/10",
                              )}
                            >
                              {speed}x
                            </button>
                          ))}
                          {!simulationComplete ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSimulationElapsedMs(simulationResult.durationMs);
                                setSimulationPlaying(false);
                                setShowSimulationBoxScore(true);
                              }}
                              className="rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white/84 transition hover:bg-white/10"
                            >
                              Skip to Final
                            </button>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                          <div
                            className={clsx(
                              "rounded-[24px] border px-4 py-5 text-center transition-colors",
                              simulationWinner === "user"
                                ? "border-emerald-100/70 bg-[linear-gradient(180deg,rgba(52,211,153,0.54),rgba(5,150,105,0.42))] shadow-[0_0_0_1px_rgba(167,243,208,0.34),0_0_36px_rgba(16,185,129,0.34)]"
                                : simulationWinner === "opponent"
                                  ? "border-rose-100/70 bg-[linear-gradient(180deg,rgba(251,113,133,0.52),rgba(190,18,60,0.42))] shadow-[0_0_0_1px_rgba(254,205,211,0.28),0_0_36px_rgba(244,63,94,0.3)]"
                                  : "border-emerald-200/16 bg-emerald-300/8",
                            )}
                          >
                            <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/76">Your Team</div>
                            <div className="mt-3 text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-none text-white">
                              {simulationLiveScore.user}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="rounded-[24px] border border-white/12 bg-white/8 px-5 py-4">
                              <div className="text-[10px] uppercase tracking-[0.22em] text-white/54">Q{currentSimulationQuarter}</div>
                              <div className="mt-1 font-display text-4xl text-white">{currentSimulationClock}</div>
                            </div>
                            <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                              {simulationComplete ? "Final" : "Game Clock"}
                            </div>
                          </div>
                          <div
                            className={clsx(
                              "rounded-[24px] border px-4 py-5 text-center transition-colors",
                              simulationWinner === "opponent"
                                ? "border-emerald-100/70 bg-[linear-gradient(180deg,rgba(52,211,153,0.54),rgba(5,150,105,0.42))] shadow-[0_0_0_1px_rgba(167,243,208,0.34),0_0_36px_rgba(16,185,129,0.34)]"
                                : simulationWinner === "user"
                                  ? "border-rose-100/70 bg-[linear-gradient(180deg,rgba(251,113,133,0.52),rgba(190,18,60,0.42))] shadow-[0_0_0_1px_rgba(254,205,211,0.28),0_0_36px_rgba(244,63,94,0.3)]"
                                  : "border-rose-200/16 bg-rose-300/8",
                            )}
                          >
                            <div className="text-[10px] uppercase tracking-[0.22em] text-rose-100/76">
                              {activeNode.opponentTeamName ?? "Boss Team"}
                            </div>
                            <div className="mt-3 text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-none text-white">
                              {simulationLiveScore.opponent}
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
                          <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(56px,0.35fr))_minmax(70px,0.42fr)] border-b border-white/10 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                            <div>Team</div>
                            {SIMULATION_QUARTERS.map((quarter) => <div key={quarter} className="text-center">Q{quarter}</div>)}
                            <div className="text-center">Total</div>
                          </div>
                          {[
                            { key: "user" as const, label: "Your Team", score: simulationLiveScore.user },
                            { key: "opponent" as const, label: activeNode.opponentTeamName ?? "Boss Team", score: simulationLiveScore.opponent },
                          ].map((teamRow) => (
                            <div key={teamRow.key} className="grid grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(56px,0.35fr))_minmax(70px,0.42fr)] items-center px-4 py-3 text-sm text-white">
                              <div className="font-semibold">{teamRow.label}</div>
                              {simulationQuarterScores.map((quarter) => (
                                <div key={`${teamRow.key}-${quarter.quarter}`} className="text-center text-slate-200">
                                  {quarter[teamRow.key]}
                                </div>
                              ))}
                              <div className="text-center text-lg font-semibold">{teamRow.score}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[30px] border border-white/12 bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Play By Play</div>
                            <div className="mt-1 text-xl font-semibold text-white">
                              {simulationComplete ? "Final sequence" : "Live action"}
                            </div>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                            {Math.round((clampedSimulationElapsedMs / simulationDurationMs) * 100)}%
                          </div>
                        </div>
                        <div className="mt-5 space-y-3">
                          {recentSimulationEvents.length > 0 ? (
                            recentSimulationEvents.map((event) => (
                              <div
                                key={event.id}
                                className={clsx(
                                  "rounded-[20px] border px-4 py-3",
                                  event.team === "user"
                                    ? "border-emerald-200/14 bg-emerald-300/8"
                                    : "border-rose-200/14 bg-rose-300/8",
                                )}
                              >
                                <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                                  <span>Q{event.quarter} | {formatGameClock(event.gameClockSeconds)}</span>
                                  <span>{event.points} PTS</span>
                                </div>
                                <div className="mt-1 text-sm leading-6 text-white/88">{event.description}</div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-300">
                              Tipoff is set. Press play to watch the game unfold.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setShowSimulationBoxScore((shown) => !shown)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        {showSimulationBoxScore ? "Hide Box Score" : "Show Box Score"}
                      </button>
                      {simulationComplete ? (
                        <button
                          type="button"
                          onClick={run.nodeResult?.passed ? continueAfterFaceoff : abortRun}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                        >
                          {run.nodeResult?.passed ? "Claim Reward" : "Try Again"}
                          <ArrowRight size={16} />
                        </button>
                      ) : null}
                      {simulationComplete && !run.nodeResult?.passed ? (
                        <button
                          type="button"
                          onClick={handleBackToHome}
                          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Back to Home
                        </button>
                      ) : null}
                    </div>

                    {showSimulationBoxScore || simulationComplete ? (
                      <div className="mt-6 grid gap-5 xl:grid-cols-2">
                        {(["user", "opponent"] as SimulationTeam[]).map((team) => {
                          const teamStats = simulationResult.playerStats.filter((stat) => stat.team === team);
                          return (
                            <div key={team} className="overflow-hidden rounded-[26px] border border-white/10 bg-black/18">
                              <div className="border-b border-white/10 px-4 py-3">
                                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                                  {team === "user" ? "Your Team" : activeNode.opponentTeamName ?? "Boss Team"}
                                </div>
                                <div className="mt-1 text-xl font-semibold text-white">Box Score</div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px] text-left text-sm">
                                  <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                    <tr className="border-b border-white/8">
                                      <th className="px-4 py-3">Player</th>
                                      <th className="px-3 py-3 text-right">PTS</th>
                                      <th className="px-3 py-3 text-right">AST</th>
                                      <th className="px-3 py-3 text-right">REB</th>
                                      <th className="px-3 py-3 text-right">STL</th>
                                      <th className="px-3 py-3 text-right">BLK</th>
                                      <th className="px-3 py-3 text-right">TO</th>
                                      <th className="px-3 py-3 text-right">FG</th>
                                      <th className="px-3 py-3 text-right">FG%</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teamStats.map((stat) => (
                                      <tr key={`${team}-${stat.playerId}`} className="border-b border-white/6 last:border-b-0">
                                        <td className="px-4 py-3">
                                          <div className="font-semibold text-white">{stat.playerName}</div>
                                          <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.slot}</div>
                                        </td>
                                        <td className="px-3 py-3 text-right font-semibold text-white">{stat.points}</td>
                                        <td className="px-3 py-3 text-right text-slate-200">{stat.assists}</td>
                                        <td className="px-3 py-3 text-right text-slate-200">{stat.rebounds}</td>
                                        <td className="px-3 py-3 text-right text-slate-200">{stat.steals}</td>
                                        <td className="px-3 py-3 text-right text-slate-200">{stat.blocks}</td>
                                        <td className="px-3 py-3 text-right text-slate-200">{stat.turnovers}</td>
                                        <td className="px-3 py-3 text-right text-slate-200">{stat.fieldGoalsMade}/{stat.fieldGoalsAttempted}</td>
                                        <td className="px-3 py-3 text-right text-slate-200">{formatPercentage(stat.fieldGoalsMade, stat.fieldGoalsAttempted)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {simulationComplete ? (
                      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
                        <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Matchup Breakdown</div>
                        <div className="mt-4 space-y-4">
                          {run.nodeResult.faceoffResult.matchups.map((matchup) => (
                            <FaceoffMatchupRow
                              key={`${matchup.slot}-${matchup.userPlayer?.id ?? "empty"}-${matchup.opponentPlayer?.id ?? "boss"}`}
                              matchup={matchup}
                              ownedPlayerIds={runOwnedPlayerIds}
                              trainedPlayerIds={runDisplayTrainedPlayerIds}
                              coachTeamKey={runCoachTeamKey}
                              allStarBonusBadges={runAllStarBonusBadges}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Faceoff Result</div>
                  <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult.detail}</p>
                </div>
              )}
            </div>
          )}

          {run.stage === "reward-draft" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Reward Draft</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult?.title ?? "Choose 1 reward"}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult?.detail}</p>
              <div
                className={clsx(
                  "mt-6 overflow-visible px-1 pt-2 pb-3",
                  isMobileViewport
                    ? "grid gap-1.5"
                    : "flex flex-wrap justify-center gap-3",
                  !isMobileViewport && run.choices.length === 3
                    ? "mx-auto max-w-5xl"
                    : "",
                )}
                style={isMobileViewport ? { gridTemplateColumns: `repeat(${run.choices.length}, minmax(0, 1fr))` } : undefined}
              >
                {run.choices.map((player, index) => {
                  const compactScale = run.choices.length >= 5 ? 0.46 : 0.59;

                  return (
                    <DraftChoiceRevealCard
                      key={`${draftChoiceRevealKey}-${player.id}`}
                      index={index}
                      compactScale={compactScale}
                      revealKey={draftChoiceRevealKey}
                    >
                      <DraftPlayerCard
                        player={player}
                        onSelect={draftChoice}
                        compact
                        compactScale={compactScale}
                        draftedPlayerIds={runOwnedPlayerIds}
                        playerTypeBadgesOverride={getRunPlayerTypeBadgeOverrides(player, runAllStarBonusBadges)}
                        enableTeamChemistryPreview
                        coachConnectionActive={getCoachBoostForPlayer(player, runCoachTeamKey) > 0}
                      />
                    </DraftChoiceRevealCard>
                  );
                })}
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
                          ownedPlayerIds={runOwnedPlayerIds}
                          trainedPlayerIds={runDisplayTrainedPlayerIds}
                          coachTeamKey={runCoachTeamKey}
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

        <div className={clsx("space-y-6", (run.stage === "ladder-overview" || hideRightRail || showMobileBottomNav) && "hidden")}>
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
      {showMobileRosterPanel ? (
        <div className="fixed inset-x-0 bottom-[78px] z-[90] px-3 sm:hidden">
          <div className="max-h-[calc(100vh-148px)] overflow-y-auto rounded-[28px] border border-white/12 bg-[#070b12]/98 shadow-[0_22px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#070b12]/96 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Run Roster</div>
              <button
                type="button"
                onClick={() => setMobileBottomPanel("board")}
                className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
              >
                Close
              </button>
            </div>
            <div className="p-3">
              {runRosterPanel}
            </div>
          </div>
        </div>
      ) : null}
      {showMobileBottomNav ? (
        <div className="fixed inset-x-0 bottom-0 z-[95] border-t border-white/10 bg-[#050811]/96 px-3 py-3 shadow-[0_-12px_36px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMobileBottomPanel("board")}
              className={clsx(
                "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                mobileBottomPanel === "board"
                  ? "bg-white text-slate-950"
                  : "border border-white/12 bg-white/6 text-white",
              )}
            >
              <Swords size={16} />
              Draft Board
            </button>
            <button
              type="button"
              onClick={() => setMobileBottomPanel("roster")}
              className={clsx(
                "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                mobileBottomPanel === "roster"
                  ? "bg-white text-slate-950"
                  : "border border-white/12 bg-white/6 text-white",
              )}
            >
              <Users size={16} />
              Run Roster
            </button>
          </div>
        </div>
      ) : null}
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
              trainedPlayerIds={runDisplayTrainedPlayerIds}
              coachTeamKey={runCoachTeamKey}
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
                          trainedPlayerIds={runDisplayTrainedPlayerIds}
                          coachTeamKey={runCoachTeamKey}
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

