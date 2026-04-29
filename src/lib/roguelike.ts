import { allPlayers } from "../data/players";
import { assignPlayerToRoster, rosterTemplate } from "./draft";
import {
  getActiveBigThrees,
  getActiveDynamicDuos,
  getActiveRivalBadges,
  getActiveRolePlayerPairs,
  getActiveTeamChemistryGroups,
} from "./dynamicDuos";
import {
  getPlayerTypeBadges,
  playerTypeBadgeDefinitions,
  type PlayerTypeBadgeDefinition,
  type PlayerTypeBadge,
} from "./playerTypeBadges";
import { mulberry32 } from "./random";
import { evaluateDraftChemistry } from "./simulate";
import { getPlayerTeamKey, getSameTeamChemistryBonusForPlayer } from "./teamChemistry";
import { Player, PlayerTier, Position, RosterSlot, RosterSlotType } from "../types";
import { getPlayerTier } from "./playerTier";
import { getNbaTeamByName } from "../data/nbaTeams";

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

export type RoguelikeNodeType =
  | "draft"
  | "challenge"
  | "boss"
  | "locker-room"
  | "training"
  | "trade"
  | "choice"
  | "evolution"
  | "roster-cut"
  | "add-position"
  | "all-star";
export type RoguelikeMetric = "overall" | "offense" | "defense" | "chemistry" | "rebounding";
export type RoguelikeBattleMode = "starting-five-faceoff";
export type RoguelikePlayerPoolMode = "all" | "current-season";
export type RoguelikeConferenceFilter = "both" | "east" | "west";
export type RoguelikeDifficulty = "normal" | "all-star" | "superstar" | "all-time" | "goat";

export interface RoguelikeCoach {
  id: string;
  name: string;
  teamName: string;
  conference: Exclude<RoguelikeConferenceFilter, "both">;
}

export interface RoguelikeRunSettings {
  conferenceFilter: RoguelikeConferenceFilter;
  excludeGalaxyCards: boolean;
  currentSeasonOnly: boolean;
  difficulty: RoguelikeDifficulty;
  enableCoaches: boolean;
  disableTrainingNodes: boolean;
  disableTradeNodes: boolean;
}

export interface RoguelikeStarterPackage {
  id: RoguelikeStarterPackageId;
  title: string;
  subtitle: string;
  description: string;
  focus: string;
}

export const roguelikeCoaches: RoguelikeCoach[] = [
  { id: "mike-budenholzer", name: "Mike Budenholzer", teamName: "Atlanta Hawks", conference: "east" },
  { id: "red-auerbach", name: "Red Auerbach", teamName: "Boston Celtics", conference: "east" },
  { id: "lawrence-frank", name: "Lawrence Frank", teamName: "Brooklyn Nets", conference: "east" },
  { id: "paul-silas", name: "Paul Silas", teamName: "Charlotte Hornets", conference: "east" },
  { id: "phil-jackson-bulls", name: "Phil Jackson (Bulls)", teamName: "Chicago Bulls", conference: "east" },
  { id: "tyronn-lue", name: "Tyronn Lue", teamName: "Cleveland Cavaliers", conference: "east" },
  { id: "chuck-daly", name: "Chuck Daly", teamName: "Detroit Pistons", conference: "east" },
  { id: "larry-bird", name: "Larry Bird", teamName: "Indiana Pacers", conference: "east" },
  { id: "erik-spoelstra", name: "Erik Spoelstra", teamName: "Miami Heat", conference: "east" },
  { id: "don-nelson", name: "Don Nelson", teamName: "Milwaukee Bucks", conference: "east" },
  { id: "red-holzman", name: "Red Holzman", teamName: "New York Knicks", conference: "east" },
  { id: "stan-van-gundy", name: "Stan Van Gundy", teamName: "Orlando Magic", conference: "east" },
  { id: "billy-cunningham", name: "Billy Cunningham", teamName: "Philadelphia 76ers", conference: "east" },
  { id: "nick-nurse", name: "Nick Nurse", teamName: "Toronto Raptors", conference: "east" },
  { id: "doug-collins", name: "Doug Collins", teamName: "Washington Wizards", conference: "east" },
  { id: "rick-carlisle", name: "Rick Carlisle", teamName: "Dallas Mavericks", conference: "west" },
  { id: "michael-malone", name: "Michael Malone", teamName: "Denver Nuggets", conference: "west" },
  { id: "steve-kerr", name: "Steve Kerr", teamName: "Golden State Warriors", conference: "west" },
  { id: "rudy-tomjanovich", name: "Rudy Tomjanovich", teamName: "Houston Rockets", conference: "west" },
  { id: "doc-rivers", name: "Doc Rivers", teamName: "Los Angeles Clippers", conference: "west" },
  { id: "phil-jackson-lakers", name: "Phil Jackson (Lakers)", teamName: "Los Angeles Lakers", conference: "west" },
  { id: "lionel-hollins", name: "Lionel Hollins", teamName: "Memphis Grizzlies", conference: "west" },
  { id: "flip-saunders", name: "Flip Saunders", teamName: "Minnesota Timberwolves", conference: "west" },
  { id: "byron-scott-pelicans", name: "Byron Scott", teamName: "New Orleans Pelicans", conference: "west" },
  { id: "mark-daigneault", name: "Mark Daigneault", teamName: "Oklahoma City Thunder", conference: "west" },
  { id: "mike-dantoni", name: "Mike D'Antoni", teamName: "Phoenix Suns", conference: "west" },
  { id: "jack-ramsay", name: "Jack Ramsay", teamName: "Portland Trail Blazers", conference: "west" },
  { id: "rick-adelman", name: "Rick Adelman", teamName: "Sacramento Kings", conference: "west" },
  { id: "gregg-popovich", name: "Gregg Popovich", teamName: "San Antonio Spurs", conference: "west" },
  { id: "jerry-sloan", name: "Jerry Sloan", teamName: "Utah Jazz", conference: "west" },
];

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
  draftShuffleReward?: number;
  livesPenalty?: number;
  targetLabel?: string;
  battleMode?: RoguelikeBattleMode;
  eliminationOnLoss?: boolean;
  opponentAverageOverall?: number;
  checks?: Array<{
    metric: RoguelikeMetric;
    target: number;
  }>;
  opponentTeamName?: string;
  opponentPlayerIds?: string[];
  opponentStarterPlayerIds?: string[];
  playerPoolMode?: RoguelikePlayerPoolMode;
  allowedRewardTiers?: PlayerTier[];
  clearRewardsOverride?: RoguelikeClearRewards;
  unlocksBench?: boolean;
  choiceOptions?: Array<"training" | "trade">;
}

export interface RoguelikeRosterMetrics {
  overall: number;
  offense: number;
  defense: number;
  chemistry: number;
  rebounding: number;
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
  userBreakdown: RoguelikeFaceoffRatingBreakdown;
  opponentBreakdown: RoguelikeFaceoffRatingBreakdown;
}

export interface RoguelikeFaceoffRatingBreakdown {
  baseScore: number;
  chemistrySupport: number;
  teamProfileSupport: number;
  lineupBalanceBonus: number;
  badgeMatchupBonus: number;
  headToHeadBonus: number;
  total: number;
}

export interface RoguelikeFaceoffResult {
  userLineup: RosterSlot[];
  opponentLineup: RosterSlot[];
  matchups: RoguelikeFaceoffMatchup[];
  userTeamWinProbability: number;
  opponentTeamWinProbability: number;
}

export interface RoguelikeEvolutionOption {
  currentPlayer: Player;
  nextPlayer: Player;
}

export interface RoguelikeFailureRewards {
  prestigeXpAward: number;
  tokenReward: number;
}

export interface RoguelikeClearRewards {
  prestigeXpAward: number;
  tokenReward: number;
}

export interface RoguelikeBonusBadgeAssignment {
  playerId: string;
  badgeType: PlayerTypeBadge;
}

const VERSION_SUFFIX_PATTERN = /\s\([^)]*\)$/;
const STARTING_FIVE_POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];
const DEFAULT_FACEOFF_TARGET_AVERAGE = 84;
const BOSS_AVERAGE_OVERRIDES_BY_FLOOR: Partial<Record<number, number>> = {
  4: 79,
  6: 81,
  15: 84.75,
  19: 85,
  21: 85.5,
  23: 86,
  28: 88,
  36: 89,
  39: 90.25,
  41: 92,
  43: 92.5,
  48: 92.75,
  56: 93,
  59: 94,
  61: 95,
  63: 96,
};

export const getRoguelikeFailureRewards = (floorIndex: number): RoguelikeFailureRewards => {
  const prestigeXpAward = Math.max(2, Math.min(8, floorIndex + 1));

  return {
    prestigeXpAward,
    tokenReward: prestigeXpAward * 10,
  };
};

export const getRoguelikeDifficultyTokenMultiplier = (
  difficulty: RoguelikeDifficulty = "normal",
) => {
  const multiplierByDifficulty: Record<RoguelikeDifficulty, number> = {
    normal: 1,
    "all-star": 1.1,
    superstar: 1.2,
    "all-time": 1.3,
    goat: 1.4,
  };

  return multiplierByDifficulty[difficulty] ?? 1;
};

export const doesRoguelikeNodeAwardClearRewards = (
  node: Pick<RoguelikeNode, "type" | "act" | "eliminationOnLoss">,
) => node.type === "challenge" || Boolean(node.eliminationOnLoss);

export const getRoguelikeClearRewards = (
  node: Pick<RoguelikeNode, "act" | "type" | "eliminationOnLoss" | "clearRewardsOverride">,
  settings?: Pick<RoguelikeRunSettings, "difficulty"> | null,
): RoguelikeClearRewards => {
  const baseRewards = (() => {
    if (node.clearRewardsOverride) {
      return node.clearRewardsOverride;
    }

    if (!doesRoguelikeNodeAwardClearRewards(node)) {
      return {
        prestigeXpAward: 0,
        tokenReward: 0,
      };
    }

    const baseByType: Record<RoguelikeNodeType, number> = {
    draft: 2,
    "locker-room": 0,
    training: 3,
    trade: 3,
    choice: 3,
      evolution: 4,
      "roster-cut": 0,
      "add-position": 0,
      "all-star": 0,
      challenge: 4,
      boss: 5,
    };

    const prestigeXpAward = Math.max(2, Math.min(8, baseByType[node.type] + node.act - 1));

    return {
      prestigeXpAward,
      tokenReward: prestigeXpAward * 10,
    };
  })();

  const difficultyMultiplier = getRoguelikeDifficultyTokenMultiplier(settings?.difficulty ?? "normal");

  return {
    prestigeXpAward: baseRewards.prestigeXpAward,
    tokenReward: Math.round(baseRewards.tokenReward * difficultyMultiplier),
  };
};

const getRegularBossNodes = () =>
  roguelikeNodes.filter((node) => node.type === "boss" && node.floor !== 64);

export const getRoguelikeLockerRoomCashReward = (
  node: Pick<RoguelikeNode, "id" | "floor" | "act" | "type">,
) => {
  if (node.type === "roster-cut") {
    return 6 + (node.act - 1) * 4;
  }

  if (node.type === "challenge") {
    return 8 + (node.act - 1) * 4;
  }

  if (node.type === "boss") {
    if (node.floor === 64) {
      return 40;
    }

    const bossIndex =
      getRegularBossNodes().findIndex((bossNode) => bossNode.id === node.id) + 1;

    if (bossIndex <= 0) return 0;
    return 10 + Math.round(((bossIndex - 1) * 14) / 15);
  }

  return 0;
};

export const roguelikeStarterPackages: RoguelikeStarterPackage[] = [
  {
    id: "balanced-foundation",
    title: "Balanced",
    subtitle: "Safest opener",
    description:
      "Start with a stable all-around pool of non-Galaxy stars and high-end supporting pieces.",
    focus: "Great if you want the cleanest first run and the most forgiving early chemistry checks.",
  },
  {
    id: "defense-lab",
    title: "Defense",
    subtitle: "Stops first",
    description:
      "Lean into stoppers, rim deterrence, and stronger defensive floors right from the opening board.",
    focus: "Best for surviving early checks, but you may have to work harder later for offense and creation.",
  },
  {
    id: "creator-camp",
    title: "Offense",
    subtitle: "Scoring pressure",
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

const REGULAR_BOSS_COUNT = 16;
const ROGUELIKE_DIFFICULTY_OVR_MODIFIERS: Record<RoguelikeDifficulty, number> = {
  normal: 0,
  "all-star": 1,
  superstar: 2,
  "all-time": 3,
  goat: 4,
};

const legacyRoguelikeCoachIds: Record<string, string> = {
  "doug-moe": "michael-malone",
  "larry-brown": "larry-bird",
  "scott-brooks": "mark-daigneault",
};

export const getRoguelikeCoachById = (coachId: string | null | undefined) => {
  if (!coachId) return null;
  const resolvedCoachId = legacyRoguelikeCoachIds[coachId] ?? coachId;
  return roguelikeCoaches.find((coach) => coach.id === resolvedCoachId) ?? null;
};

export const getRoguelikeCoachTeamKey = (coachId: string | null | undefined) =>
  getRoguelikeCoachById(coachId)?.teamName ?? null;

export const DEFAULT_ROGUELIKE_RUN_SETTINGS: RoguelikeRunSettings = {
  conferenceFilter: "both",
  excludeGalaxyCards: false,
  currentSeasonOnly: false,
  difficulty: "normal",
  enableCoaches: true,
  disableTrainingNodes: false,
  disableTradeNodes: false,
};

const getProgressiveBossRewards = (bossIndex: number): RoguelikeClearRewards => ({
  tokenReward: 20 + (bossIndex - 1) * 4,
  prestigeXpAward: 4 + Math.round((26 * (bossIndex - 1)) / (REGULAR_BOSS_COUNT - 1)),
});

const getBossAverageOverallForFloor = (floor: number, fallback?: number) =>
  BOSS_AVERAGE_OVERRIDES_BY_FLOOR[floor] ?? fallback ?? DEFAULT_FACEOFF_TARGET_AVERAGE;

export const normalizeRoguelikeRunSettings = (
  settings?: Partial<RoguelikeRunSettings> | null,
): RoguelikeRunSettings => ({
  conferenceFilter: settings?.conferenceFilter ?? DEFAULT_ROGUELIKE_RUN_SETTINGS.conferenceFilter,
  excludeGalaxyCards: settings?.excludeGalaxyCards ?? DEFAULT_ROGUELIKE_RUN_SETTINGS.excludeGalaxyCards,
  currentSeasonOnly: settings?.currentSeasonOnly ?? DEFAULT_ROGUELIKE_RUN_SETTINGS.currentSeasonOnly,
  difficulty: settings?.difficulty ?? DEFAULT_ROGUELIKE_RUN_SETTINGS.difficulty,
  enableCoaches: settings?.enableCoaches ?? DEFAULT_ROGUELIKE_RUN_SETTINGS.enableCoaches,
  disableTrainingNodes: settings?.disableTrainingNodes ?? DEFAULT_ROGUELIKE_RUN_SETTINGS.disableTrainingNodes,
  disableTradeNodes: settings?.disableTradeNodes ?? DEFAULT_ROGUELIKE_RUN_SETTINGS.disableTradeNodes,
});

export const drawRoguelikeCoachChoices = (
  seed: number,
  settings?: Partial<RoguelikeRunSettings> | null,
  count = 5,
) => {
  const normalizedSettings = normalizeRoguelikeRunSettings(settings);
  const filteredCoaches = roguelikeCoaches.filter((coach) => {
    if (normalizedSettings.conferenceFilter === "both") return true;
    return coach.conference === normalizedSettings.conferenceFilter;
  });
  const random = mulberry32(seed);
  const shuffled = [...filteredCoaches];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const getRoguelikeDifficultyBossModifier = (difficulty: RoguelikeDifficulty) =>
  ROGUELIKE_DIFFICULTY_OVR_MODIFIERS[difficulty] ?? 0;

const makeDraftNode = (node: Omit<RoguelikeNode, "type">): RoguelikeNode => ({
  ...node,
  type: "draft",
});

const makeTrainingNode = (node: Omit<RoguelikeNode, "type" | "rewardChoices">): RoguelikeNode => ({
  ...node,
  type: "training",
  rewardChoices: 0,
});

const makeTradeNode = (node: Omit<RoguelikeNode, "type">): RoguelikeNode => ({
  ...node,
  type: "trade",
});

const makeChoiceNode = (
  node: Omit<RoguelikeNode, "type" | "rewardChoices"> & {
    choiceOptions: Array<"training" | "trade">;
  },
): RoguelikeNode => ({
  ...node,
  type: "choice",
  rewardChoices: 0,
});

const makeChallengeNode = (
  node: Omit<RoguelikeNode, "type" | "clearRewardsOverride"> & { clearRewardsOverride: RoguelikeClearRewards },
): RoguelikeNode => ({
  ...node,
  type: "challenge",
});

const makeBossNode = (
  bossIndex: number,
  node: Omit<RoguelikeNode, "type" | "clearRewardsOverride">,
): RoguelikeNode => ({
  ...node,
  opponentAverageOverall: getBossAverageOverallForFloor(node.floor, node.opponentAverageOverall),
  type: "boss",
  clearRewardsOverride: getProgressiveBossRewards(bossIndex),
});

const makeRosterCutNode = (node: Omit<RoguelikeNode, "type" | "rewardChoices">): RoguelikeNode => ({
  ...node,
  type: "roster-cut",
  rewardChoices: 0,
});

const makeAddPositionNode = (node: Omit<RoguelikeNode, "type" | "rewardChoices">): RoguelikeNode => ({
  ...node,
  type: "add-position",
  rewardChoices: 0,
});

const makeAllStarNode = (node: Omit<RoguelikeNode, "type" | "rewardChoices">): RoguelikeNode => ({
  ...node,
  type: "all-star",
  rewardChoices: 0,
});

const makeLockerRoomVisitNode = (node: Omit<RoguelikeNode, "type" | "rewardChoices">): RoguelikeNode => ({
  ...node,
  type: "locker-room",
  rewardChoices: 0,
});

export const roguelikeNodes: RoguelikeNode[] = [
  makeDraftNode({
    id: "year-1-starting-five",
    floor: 1,
    act: 1,
    title: "Draft Your Starting 5",
    description: "Add two more rotation pieces from Starter Cache to complete your opening five.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 0,
    targetLabel: "Choose 2 Emerald players to complete your opening five",
    allowedRewardTiers: ["Emerald"],
  }),
  makeDraftNode({
    id: "year-1-free-agency-1",
    floor: 2,
    act: 1,
    title: "Free Agency 1",
    description: "Sign your first free agent from a Sapphire board.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 Sapphire players",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeTrainingNode({
    id: "year-1-offseason-training",
    floor: 3,
    act: 1,
    title: "Off-Season Training Camp",
    description: "Choose one player to sharpen before the first real test.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(1, {
    id: "year-1-summer-league-championship",
    floor: 4,
    act: 1,
    title: "Summer League Championship",
    description: "Beat the Summer League Champs in your first direct faceoff.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Beat the Summer League Champs starting five",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 79,
    opponentTeamName: "Summer League Champs",
    allowedRewardTiers: ["Sapphire"],
    unlocksBench: true,
  }),
  makeRosterCutNode({
    id: "year-1-roster-cut",
    floor: 5,
    act: 1,
    title: "Roster Cut",
    description: "Trim your roster back down by cutting two players before Opening Night.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Select 2 players to cut from your roster",
  }),
  makeBossNode(2, {
    id: "year-1-opening-night",
    floor: 6,
    act: 1,
    title: "Opening Night",
    description: "Beat the Atlanta Hawks and prove this roster is ready for real games.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Beat the Atlanta Hawks starting five",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 81,
    opponentTeamName: "Atlanta Hawks",
    allowedRewardTiers: ["Sapphire"],
    unlocksBench: true,
  }),
  makeTrainingNode({
    id: "year-1-in-season-training",
    floor: 7,
    act: 1,
    title: "In-Season Training Camp",
    description: "Give one player another round of development.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeChallengeNode({
    id: "year-1-offense-challenge",
    floor: 8,
    act: 1,
    title: "Challenge 1: Offense is the Best Defense",
    description: "Arrange your best offensive starting five and hit the season-opening threshold.",
    rewardBundleId: "frontcourt-pressure",
    rewardChoices: 5,
    targetLabel: "Reach 83 Offense with your starting five",
    checks: [{ metric: "offense", target: 83 }],
    allowedRewardTiers: ["Sapphire"],
    clearRewardsOverride: { tokenReward: 20, prestigeXpAward: 4 },
  }),
  makeTradeNode({
    id: "year-1-early-season-trade",
    floor: 9,
    act: 1,
    title: "Early Season Trade",
    description: "Optionally trade one player and replace them from a Sapphire board.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 Sapphire replacement",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeAddPositionNode({
    id: "year-1-new-rotation-test",
    floor: 10,
    act: 1,
    title: "New Rotation Test",
    description: "Teach one player a new natural position for the rest of the run.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Choose 1 player and add 1 new natural position",
  }),
  makeAllStarNode({
    id: "year-1-all-star-saturday",
    floor: 11,
    act: 1,
    title: "All-Star Saturday",
    description: "Send three players into the Dunk Contest, 3PT Contest, and Skills Challenge to earn permanent Rogue bonus badges.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Assign 1 player to each event and run All-Star Saturday",
  }),
  makeDraftNode({
    id: "year-1-mid-season-free-agent-add",
    floor: 12,
    act: 1,
    title: "Mid-Season Free Agent Add",
    description: "Add one more Sapphire contributor to the run.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 Sapphire players",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeTrainingNode({
    id: "year-1-in-season-training-2",
    floor: 13,
    act: 1,
    title: "In-Season Training Camp - Day 2",
    description: "One more focused upgrade before the playoffs begin.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeLockerRoomVisitNode({
    id: "year-1-locker-room-visit",
    floor: 14,
    act: 1,
    title: "Locker Room Visit",
    description: "Step into the locker room store and decide whether to spend your saved cash before the playoff push.",
    rewardBundleId: "elite-closers",
    targetLabel: "Visit the Locker Room store",
  }),
  makeBossNode(3, {
    id: "year-1-playoffs-round-1",
    floor: 15,
    act: 1,
    title: "NBA Playoffs Round 1",
    description: "Win your first playoff series faceoff.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 3,
    targetLabel: "Beat your First Round Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 85,
    opponentTeamName: "NBA Playoffs Round 1",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeTradeNode({
    id: "year-1-new-rotation-test-2",
    floor: 16,
    act: 1,
    title: "Trade Opportunity",
    description: "Optionally trade one player and replace them from a similar-caliber board.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 similar-caliber replacement",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeTrainingNode({
    id: "year-1-playoff-training",
    floor: 17,
    act: 1,
    title: "Playoff Training Camp",
    description: "Get one player ready for the next series.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeDraftNode({
    id: "year-1-return-from-injury",
    floor: 18,
    act: 1,
    title: "Return from Injury",
    description: "Add one Sapphire player from any era. If your roster is full, you'll need to drop someone after the pick.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 Sapphire players",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeBossNode(4, {
    id: "year-1-conference-semifinals",
    floor: 19,
    act: 1,
    title: "NBA Playoffs: Conference Semifinals",
    description: "Beat your Conference Semifinal opponent and keep the run alive.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 3,
    targetLabel: "Beat your Conference Semifinal Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 85.2,
    opponentTeamName: "Conference Semifinal Opponent",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeTrainingNode({
    id: "year-1-playoff-training-2",
    floor: 20,
    act: 1,
    title: "Playoff Training Camp - 2",
    description: "Take one more player through playoff prep.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(5, {
    id: "year-1-conference-finals",
    floor: 21,
    act: 1,
    title: "NBA Playoffs: Conference Finals",
    description: "Survive the Conference Finals faceoff.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 3,
    targetLabel: "Beat your Conference Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 85.5,
    opponentTeamName: "Conference Finals Opponent",
    allowedRewardTiers: ["Sapphire"],
  }),
  makeTrainingNode({
    id: "year-1-playoff-training-3",
    floor: 22,
    act: 1,
    title: "Playoff Training Camp - 3",
    description: "One last year-one playoff tune-up.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(6, {
    id: "year-1-finals",
    floor: 23,
    act: 1,
    title: "NBA Playoffs: Finals",
    description: "Finish Year 1 with a title-round faceoff.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Beat your Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 86,
    opponentTeamName: "Finals Opponent",
    allowedRewardTiers: ["Ruby"],
  }),
  makeDraftNode({
    id: "year-2-free-agency",
    floor: 24,
    act: 2,
    title: "Free Agency",
    description: "Open Year 2 by signing one Ruby player from any era.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 Ruby players",
    allowedRewardTiers: ["Ruby"],
  }),
  makeTrainingNode({
    id: "year-2-offseason-training",
    floor: 25,
    act: 2,
    title: "Off-Season Training Camp",
    description: "Put one player through an off-season jump.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeTradeNode({
    id: "year-2-offseason-trade",
    floor: 26,
    act: 2,
    title: "Off-Season Trade",
    description: "Optionally trade one player and replace them from a Ruby board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 Ruby replacement",
    allowedRewardTiers: ["Ruby"],
  }),
  makeRosterCutNode({
    id: "year-2-offseason-roster-cut",
    floor: 27,
    act: 2,
    title: "Off-Season Roster Cut",
    description: "Trim two players before the next season begins.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Select 2 players to cut from your roster",
  }),
  makeBossNode(7, {
    id: "year-2-opening-night",
    floor: 28,
    act: 2,
    title: "Opening Night",
    description: "Beat the Boston Celtics to kick off Year 2.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Beat the Boston Celtics starting five",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 89,
    opponentTeamName: "Boston Celtics",
    allowedRewardTiers: ["Ruby"],
    unlocksBench: true,
  }),
  makeTrainingNode({
    id: "year-2-in-season-training",
    floor: 29,
    act: 2,
    title: "In-Season Training Camp",
    description: "Keep one player climbing.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeChallengeNode({
    id: "year-2-own-the-glass",
    floor: 30,
    act: 2,
    title: "Challenge 2: Own The Glass",
    description: "Set your strongest rebounding starting five and control the boards.",
    rewardBundleId: "frontcourt-pressure",
    rewardChoices: 3,
    targetLabel: "Reach 84.5 Rebounding with your starting five",
    checks: [{ metric: "rebounding", target: 84.5 }],
    allowedRewardTiers: ["Ruby"],
    clearRewardsOverride: { tokenReward: 30, prestigeXpAward: 5 },
  }),
  makeTradeNode({
    id: "year-2-early-season-trade",
    floor: 31,
    act: 2,
    title: "Early Season Trade",
    description: "Optionally trade one player and replace them from a Ruby board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 Ruby replacement",
    allowedRewardTiers: ["Ruby"],
  }),
  makeAddPositionNode({
    id: "year-2-new-rotation-test",
    floor: 32,
    act: 2,
    title: "New Rotation Test",
    description: "Add another natural position to one player.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Choose 1 player and add 1 new natural position",
  }),
  makeAllStarNode({
    id: "year-2-all-star-saturday",
    floor: 33,
    act: 2,
    title: "All-Star Saturday",
    description: "Send three players into the skills events to earn permanent Rogue bonus badges.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Assign 1 player to each event and run All-Star Saturday",
  }),
  makeLockerRoomVisitNode({
    id: "year-2-locker-room-visit",
    floor: 34,
    act: 2,
    title: "Locker Room Visit",
    description: "Open the locker room store and decide how much cash to commit before the next boss gate.",
    rewardBundleId: "elite-closers",
    targetLabel: "Visit the Locker Room store",
  }),
  makeTrainingNode({
    id: "year-2-in-season-training-2",
    floor: 35,
    act: 2,
    title: "In-Season Training Camp",
    description: "One more in-season improvement before the playoffs.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(8, {
    id: "year-2-playoffs-round-1",
    floor: 36,
    act: 2,
    title: "NBA Playoffs Round 1",
    description: "Beat your first-round opponent in Year 2.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
    targetLabel: "Beat your First Round Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 88,
    opponentTeamName: "NBA Playoffs Round 1",
    allowedRewardTiers: ["Ruby"],
  }),
  makeChoiceNode({
    id: "year-2-playoff-training",
    floor: 37,
    act: 2,
    title: "Training Camp or Trade",
    description: "Choose whether to tune up one player or reshuffle the roster before the next round.",
    rewardBundleId: "elite-closers",
    targetLabel: "Choose Training Camp or Trade",
    choiceOptions: ["training", "trade"],
  }),
  makeDraftNode({
    id: "year-2-return-from-injury",
    floor: 38,
    act: 2,
    title: "Return from Injury",
    description: "Add one Ruby player from any era. If your roster is full, you'll need to drop someone after the pick.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 Ruby players",
    allowedRewardTiers: ["Ruby"],
  }),
  makeBossNode(9, {
    id: "year-2-conference-semifinals",
    floor: 39,
    act: 2,
    title: "NBA Playoffs: Conference Semifinals",
    description: "Survive the Conference Semifinals faceoff in Year 2.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
    targetLabel: "Beat your Conference Semifinal Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 89,
    opponentTeamName: "Conference Semifinal Opponent",
    allowedRewardTiers: ["Ruby"],
  }),
  makeTrainingNode({
    id: "year-2-playoff-training-2",
    floor: 40,
    act: 2,
    title: "Playoff Training Camp - 2",
    description: "Keep stacking improvements before the conference finals.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(10, {
    id: "year-2-conference-finals",
    floor: 41,
    act: 2,
    title: "NBA Playoffs: Conference Finals",
    description: "Beat your Conference Finals opponent in Year 2.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
    targetLabel: "Beat your Conference Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 91,
    opponentTeamName: "Conference Finals Opponent",
    allowedRewardTiers: ["Ruby"],
  }),
  makeTrainingNode({
    id: "year-2-playoff-training-3",
    floor: 42,
    act: 2,
    title: "Playoff Training Camp - 3",
    description: "Give one player a final Year 2 playoff lift.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(11, {
    id: "year-2-finals",
    floor: 43,
    act: 2,
    title: "NBA Playoffs: Finals",
    description: "Finish Year 2 by beating the Finals opponent.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Beat your Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 86,
    opponentTeamName: "Finals Opponent",
    allowedRewardTiers: ["Amethyst"],
  }),
  makeDraftNode({
    id: "year-3-free-agency",
    floor: 44,
    act: 3,
    title: "Free Agency",
    description: "Start Year 3 by adding one Amethyst player from any era.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 Amethyst players",
    allowedRewardTiers: ["Amethyst"],
  }),
  makeTrainingNode({
    id: "year-3-offseason-training",
    floor: 45,
    act: 3,
    title: "Off-Season Training Camp",
    description: "Put one player through a Year 3 offseason jump.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeTradeNode({
    id: "year-3-offseason-trade",
    floor: 46,
    act: 3,
    title: "Off-Season Trade",
    description: "Optionally trade one player and replace them from an Amethyst board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 Amethyst replacement",
    allowedRewardTiers: ["Amethyst"],
  }),
  makeRosterCutNode({
    id: "year-3-offseason-roster-cut",
    floor: 47,
    act: 3,
    title: "Off-Season Roster Cut",
    description: "Cut two players before the final season opens.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Select 2 players to cut from your roster",
  }),
  makeBossNode(12, {
    id: "year-3-opening-night",
    floor: 48,
    act: 3,
    title: "Opening Night",
    description: "Beat the Boston Celtics to launch the final season.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Beat the Boston Celtics starting five",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 92,
    opponentTeamName: "Boston Celtics",
    allowedRewardTiers: ["Amethyst"],
    unlocksBench: true,
  }),
  makeTrainingNode({
    id: "year-3-in-season-training",
    floor: 49,
    act: 3,
    title: "In-Season Training Camp",
    description: "Train one player during the final season.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeChallengeNode({
    id: "year-3-chemistry-is-key",
    floor: 50,
    act: 3,
    title: "Challenge 3: Chemistry is Key",
    description: "Set your best chemistry lineup and prove this roster can function like a champion.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Reach 85 Chemistry with your starting five",
    checks: [{ metric: "chemistry", target: 85 }],
    allowedRewardTiers: ["Amethyst"],
    clearRewardsOverride: { tokenReward: 60, prestigeXpAward: 7 },
  }),
  makeTradeNode({
    id: "year-3-early-season-trade",
    floor: 51,
    act: 3,
    title: "Early Season Trade",
    description: "Optionally trade one player and replace them from an Amethyst board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 Amethyst replacement",
    allowedRewardTiers: ["Amethyst"],
  }),
  makeAddPositionNode({
    id: "year-3-new-rotation-test",
    floor: 52,
    act: 3,
    title: "New Rotation Test",
    description: "Add one last natural position to stretch your lineup options.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Choose 1 player and add 1 new natural position",
  }),
  makeLockerRoomVisitNode({
    id: "year-3-locker-room-visit",
    floor: 53,
    act: 3,
    title: "Locker Room Visit",
    description: "Make one last locker room stop and spend any remaining cash before the final playoff climb.",
    rewardBundleId: "elite-closers",
    targetLabel: "Visit the Locker Room store",
  }),
  makeAllStarNode({
    id: "year-3-all-star-saturday",
    floor: 54,
    act: 3,
    title: "All-Star Saturday",
    description: "Send three players into the skills events for final Rogue bonus badges.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Assign 1 player to each event and run All-Star Saturday",
  }),
  makeTrainingNode({
    id: "year-3-in-season-training-2",
    floor: 55,
    act: 3,
    title: "In-Season Training Camp",
    description: "One more in-season boost before the final playoffs.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(13, {
    id: "year-3-playoffs-round-1",
    floor: 56,
    act: 3,
    title: "NBA Playoffs Round 1",
    description: "Beat your first-round opponent in the final season.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
    targetLabel: "Beat your First Round Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 93,
    opponentTeamName: "NBA Playoffs Round 1",
    allowedRewardTiers: ["Galaxy"],
  }),
  makeTrainingNode({
    id: "year-3-playoff-training",
    floor: 57,
    act: 3,
    title: "Playoff Training Camp",
    description: "Keep one player climbing through the last postseason.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeDraftNode({
    id: "year-3-return-from-injury",
    floor: 58,
    act: 3,
    title: "Return from Injury",
    description: "Add one Amethyst player from any era. If your roster is full, you'll need to drop someone after the pick.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 Amethyst players",
    allowedRewardTiers: ["Amethyst"],
  }),
  makeBossNode(14, {
    id: "year-3-conference-semifinals",
    floor: 59,
    act: 3,
    title: "NBA Playoffs: Conference Semifinals",
    description: "Beat your Conference Semifinal opponent in the final season.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
    targetLabel: "Beat your Conference Semifinal Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 94,
    opponentTeamName: "Conference Semifinal Opponent",
    allowedRewardTiers: ["Galaxy"],
  }),
  makeTrainingNode({
    id: "year-3-playoff-training-2",
    floor: 60,
    act: 3,
    title: "Playoff Training Camp - 2",
    description: "Take one player through one more playoff jump.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(15, {
    id: "year-3-conference-finals",
    floor: 61,
    act: 3,
    title: "NBA Playoffs: Conference Finals",
    description: "Win the last Conference Finals faceoff of the run.",
    rewardBundleId: "elite-closers",
    rewardChoices: 3,
    targetLabel: "Beat your Conference Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 95,
    opponentTeamName: "Conference Finals Opponent",
    allowedRewardTiers: ["Galaxy"],
  }),
  makeTrainingNode({
    id: "year-3-playoff-training-3",
    floor: 62,
    act: 3,
    title: "Playoff Training Camp - 3",
    description: "One last playoff tune-up before the championship fight.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(16, {
    id: "year-3-finals",
    floor: 63,
    act: 3,
    title: "NBA Playoffs: Finals",
    description: "Beat your Finals opponent and earn the final pre-GOAT reward board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Beat your Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 96,
    opponentTeamName: "Finals Opponent",
    allowedRewardTiers: ["Galaxy"],
  }),
  {
    id: "the-goats",
    floor: 64,
    act: 3,
    type: "boss",
    title: "The G.O.A.T.s",
    description: "Beat the GOATs to finish the full three-year Rogue run.",
    rewardBundleId: "elite-closers",
    rewardChoices: 0,
    targetLabel: "Beat the GOATs starting five",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 98,
    opponentTeamName: "The G.O.A.T.s",
    opponentStarterPlayerIds: [
      "lebron-james-14-18",
      "michael-jordan",
      "kobe-bryant-24",
      "tim-duncan",
      "kareem-abdul-jabbar-bucks",
    ],
    clearRewardsOverride: {
      tokenReward: 500,
      prestigeXpAward: 100,
    },
  },
];

const isCurrentSeasonPlayer = (player: Player) => player.era === "2025-26";

const matchesConferenceFilter = (player: Player, conferenceFilter: RoguelikeConferenceFilter) => {
  if (conferenceFilter === "both") return true;

  const conference = getNbaTeamByName(player.teamLabel)?.conference;
  if (!conference) return true;

  return conferenceFilter === "east" ? conference === "East" : conference === "West";
};

export const getRoguelikePlayerUniverse = (
  settings?: Partial<RoguelikeRunSettings> | null,
  sourcePlayers: Player[] = allPlayers,
) => {
  const normalizedSettings = normalizeRoguelikeRunSettings(settings);

  return sourcePlayers.filter((player) => {
    if (normalizedSettings.currentSeasonOnly && !isCurrentSeasonPlayer(player)) return false;
    if (normalizedSettings.excludeGalaxyCards && getPlayerTier(player) === "Galaxy") return false;
    if (!matchesConferenceFilter(player, normalizedSettings.conferenceFilter)) return false;
    return true;
  });
};

export const getRoguelikeNodesForSettings = (
  settings?: Partial<RoguelikeRunSettings> | null,
): RoguelikeNode[] => {
  const normalizedSettings = normalizeRoguelikeRunSettings(settings);
  const bossOverallModifier = getRoguelikeDifficultyBossModifier(normalizedSettings.difficulty);

  return roguelikeNodes
    .filter((node) => {
      if (normalizedSettings.disableTrainingNodes && node.type === "training") return false;
      if (normalizedSettings.disableTradeNodes && node.type === "trade") return false;
      return true;
    })
    .map((node, index) => ({
      ...node,
      floor: index + 1,
      opponentAverageOverall:
        node.type === "boss" && typeof node.opponentAverageOverall === "number"
          ? node.opponentAverageOverall + bossOverallModifier
          : node.opponentAverageOverall,
    }));
};

const getPlayerIdentityKey = (player: Player) =>
  player.name.replace(VERSION_SUFFIX_PATTERN, "").trim().toLowerCase();

export const getRoguelikeEvolutionRewardPool = () => {
  const groupedByIdentity = allPlayers.reduce((groups, player) => {
    const identity = getPlayerIdentityKey(player);
    const current = groups.get(identity) ?? [];
    current.push(player);
    groups.set(identity, current);
    return groups;
  }, new Map<string, Player[]>());

  return Array.from(groupedByIdentity.values())
    .flatMap((versions) => {
      if (versions.length < 2) return [];
      const sortedVersions = [...versions].sort(
        (a, b) => a.overall - b.overall || a.name.localeCompare(b.name),
      );
      const lowestVersion = sortedVersions[0];
      const highestOverall = sortedVersions[sortedVersions.length - 1]?.overall ?? lowestVersion.overall;
      if (lowestVersion.overall >= highestOverall) return [];
      return getPlayerTier(lowestVersion) === "Ruby" ? [lowestVersion] : [];
    })
    .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
};

export const getRoguelikeEvolutionOptions = (roster: Player[]) => {
  const rosterIdentities = new Set(roster.map(getPlayerIdentityKey));
  const groupedByIdentity = allPlayers.reduce((groups, player) => {
    const identity = getPlayerIdentityKey(player);
    const current = groups.get(identity) ?? [];
    current.push(player);
    groups.set(identity, current);
    return groups;
  }, new Map<string, Player[]>());

  return roster
    .flatMap((player) => {
      const identity = getPlayerIdentityKey(player);
      if (!rosterIdentities.has(identity)) return [];
      const versions = [...(groupedByIdentity.get(identity) ?? [])].sort(
        (a, b) => a.overall - b.overall || a.name.localeCompare(b.name),
      );
      const currentIndex = versions.findIndex((version) => version.id === player.id);
      if (currentIndex < 0) return [];
      const nextPlayer = versions[currentIndex + 1];
      if (!nextPlayer) return [];
      return [{ currentPlayer: player, nextPlayer }];
    })
    .sort(
      (a, b) =>
        b.nextPlayer.overall - a.nextPlayer.overall ||
        a.currentPlayer.name.localeCompare(b.currentPlayer.name),
    );
};

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
  if (getPlayerTier(player) === "Galaxy") return -1;
      return player.overall * 0.75 + player.offense * 0.12 + player.defense * 0.13;
    }, 30),
  ),
  "defense-lab": uniqueByIdentity(
    rankPlayers((player) => {
  if (getPlayerTier(player) === "Galaxy") return -1;
      if (player.defense < 82) return -1;
      return player.defense * 1.45 + player.rebounding * 0.3 + player.overall * 0.45;
    }, 30),
  ),
  "creator-camp": uniqueByIdentity(
    rankPlayers((player) => {
  if (getPlayerTier(player) === "Galaxy") return -1;
      if (player.playmaking < 80) return -1;
      return player.playmaking * 1.45 + player.offense * 0.5 + player.shooting * 0.25;
    }, 30),
  ),
};

const bundleCandidates: Record<RoguelikeBundleId, Player[]> = {
  "balanced-floor": uniqueByIdentity(
    rankPlayers((player) => {
  if (getPlayerTier(player) === "Galaxy") return -1;
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

const getStarterPoolCandidates = (
  packageId: RoguelikeStarterPackageId,
  sourcePlayers: Player[],
) => {
  const rankCurrentPool = (scorer: (player: Player) => number, limit: number) =>
    uniqueByIdentity(
      [...sourcePlayers]
        .map((player) => ({ player, score: scorer(player) }))
        .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((entry) => entry.player),
    );

  if (packageId === "balanced-foundation") {
    return rankCurrentPool((player) => {
  if (getPlayerTier(player) === "Galaxy") return -1;
      return player.overall * 0.75 + player.offense * 0.12 + player.defense * 0.13;
    }, 30);
  }

  if (packageId === "defense-lab") {
    return rankCurrentPool((player) => {
  if (getPlayerTier(player) === "Galaxy") return -1;
      if (player.defense < 82) return -1;
      return player.defense * 1.45 + player.rebounding * 0.3 + player.overall * 0.45;
    }, 30);
  }

  return rankCurrentPool((player) => {
  if (getPlayerTier(player) === "Galaxy") return -1;
    if (player.playmaking < 80) return -1;
    return player.playmaking * 1.45 + player.offense * 0.5 + player.shooting * 0.25;
  }, 30);
};

export const buildStarterPool = (
  packageId: RoguelikeStarterPackageId,
  sourcePlayers: Player[] = allPlayers,
) =>
  sourcePlayers === allPlayers
    ? [...starterPackageCandidates[packageId]]
    : getStarterPoolCandidates(packageId, sourcePlayers);

export const buildOpeningDraftPool = (sourcePlayers: Player[] = allPlayers) =>
  uniqueByIdentity(
    sourcePlayers.filter(
      (player) => {
        const tier = getPlayerTier(player);
        return tier === "Emerald" || tier === "Sapphire" || tier === "Ruby";
      },
    ),
  );

const starterRevealSlots = [
  ["PG", "SG"],
  ["SG", "SF", "PF"],
  ["PF", "C"],
] as const;

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
  targetAverageOverall = 80,
  candidatePool: Player[] = allPlayers,
) => {
  const rng = mulberry32(seed);
  const minimumOverall = Math.max(60, targetAverageOverall - 5);
  const maximumOverall = Math.min(99, targetAverageOverall + 5);
  const targetTotalOverall = targetAverageOverall * starterRevealSlots.length;
  const eligible = uniqueByIdentity(
    candidatePool.filter((player) => {
      const tier = getPlayerTier(player);
      return tier === "Sapphire" || tier === "Emerald";
    }),
  );
  const selectedIds = new Set<string>();
  const buildSlotCandidatePools = (maxCandidatesPerSlot?: number) =>
    starterRevealSlots.map((slotPositions) => {
      const pool = eligible
        .filter((player) => canFillStarterRevealSlot(player, slotPositions))
        .filter((player) => player.overall >= minimumOverall && player.overall <= maximumOverall)
        .sort((a, b) => scoreStarterRevealPlayer(b, packageId) - scoreStarterRevealPlayer(a, packageId));

      return typeof maxCandidatesPerSlot === "number" ? pool.slice(0, maxCandidatesPerSlot) : pool;
    });

  const findValidSelections = (slotCandidatePools: Player[][]) => {
    const validSelections: Player[][] = [];
    const currentSelection: Player[] = [];
    selectedIds.clear();

    const search = (slotIndex: number, totalOverall: number) => {
      if (slotIndex === slotCandidatePools.length) {
        if (totalOverall === targetTotalOverall) {
          validSelections.push([...currentSelection]);
        }
        return;
      }

      const remainingSlots = slotCandidatePools.length - slotIndex - 1;
      const candidates = slotCandidatePools[slotIndex] ?? [];

      for (const candidate of candidates) {
        if (selectedIds.has(candidate.id)) continue;

        const nextTotal = totalOverall + candidate.overall;
        const minPossible = nextTotal + remainingSlots * minimumOverall;
        const maxPossible = nextTotal + remainingSlots * maximumOverall;
        if (minPossible > targetTotalOverall || maxPossible < targetTotalOverall) {
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
    return validSelections;
  };

  const preferredSlotCandidatePools = buildSlotCandidatePools(24);
  let validSelections = findValidSelections(preferredSlotCandidatePools);

  if (validSelections.length === 0) {
    validSelections = findValidSelections(buildSlotCandidatePools());
  }

  if (validSelections.length > 0) {
    const selectedIndex = Math.floor(rng() * validSelections.length);
    return validSelections[selectedIndex] ?? validSelections[0];
  }

  const selected: Player[] = [];
  selectedIds.clear();
  preferredSlotCandidatePools.forEach((candidates) => {
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
  candidateUniverse: Player[] = allPlayers,
) => {
  const seenIds = new Set(currentPool.map((player) => player.id));
  const blockedIdentities = new Set(currentRoster.map(getPlayerIdentityKey));
  const allowedIds = new Set(candidateUniverse.map((player) => player.id));

  const additions = bundleCandidates[bundleId].filter((player) => {
    if (!allowedIds.has(player.id)) return false;
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
  fallbackPool: Player[] = allPlayers,
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
      if (enforceTiers && allowedTiers && !allowedTiers.includes(getPlayerTier(player))) return false;
      seenIds.add(player.id);
      return true;
    });

  const candidates = collectCandidates(pool, true);

  if (candidates.length < count && allowedTiers) {
    candidates.push(...collectCandidates(fallbackPool, true));
  }

  if (candidates.length < count && !allowedTiers) {
    candidates.push(...collectCandidates(pool, false));
    candidates.push(...collectCandidates(fallbackPool, false));
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
  if ([player.primaryPosition, ...player.secondaryPositions].some((position) => slot.allowedPositions.includes(position))) {
    return 200 + player.overall;
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

const isRoguelikeStarterSlot = (slot: RosterSlot) =>
  slot.slot === "PG" ||
  slot.slot === "SG" ||
  slot.slot === "SF" ||
  slot.slot === "PF" ||
  slot.slot === "C";

const getRoguelikeSlotMismatchSeverity = (player: Player | null, slot: RosterSlot) => {
  if (!player) return 0;
  if (!isRoguelikeStarterSlot(slot)) return 0;
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

const ROGUELIKE_ROLE_PAIR_BOOST = {
  overall: 1,
  offense: 1,
  defense: 1,
  playmaking: 1,
  shooting: 1,
  rebounding: 1,
  athleticism: 0,
  intangibles: 1,
  ballDominance: 1,
  interiorDefense: 1,
  perimeterDefense: 1,
} as const;

const ROGUELIKE_BIG_THREE_BOOST = {
  overall: 3,
  offense: 3,
  defense: 3,
  playmaking: 2,
  shooting: 2,
  rebounding: 2,
  athleticism: 1,
  intangibles: 3,
  ballDominance: 2,
  interiorDefense: 2,
  perimeterDefense: 2,
} as const;

const ROGUELIKE_RIVAL_BOOST = {
  overall: 1,
  offense: 1,
  defense: 1,
  playmaking: 1,
  shooting: 1,
  rebounding: 0,
  athleticism: 0,
  intangibles: 1,
  ballDominance: 1,
  interiorDefense: 1,
  perimeterDefense: 1,
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
  return getActiveDynamicDuos(playerIds).filter((duo) => duo.players.includes(player.id)).length * ROGUELIKE_DUO_BOOST[stat];
};

const getRoguelikeRolePairBoost = (
  player: Player | null,
  playerIds: string[] = [],
  stat: keyof typeof ROGUELIKE_ROLE_PAIR_BOOST = "overall",
) => {
  if (!player || playerIds.length === 0) return 0;
  return getActiveRolePlayerPairs(playerIds).filter(
    (pair) => pair.rolePlayer === player.id || pair.centerpiece === player.id,
  ).length * ROGUELIKE_ROLE_PAIR_BOOST[stat];
};

const getRoguelikeBigThreeBoost = (
  player: Player | null,
  playerIds: string[] = [],
  stat: keyof typeof ROGUELIKE_BIG_THREE_BOOST = "overall",
) => {
  if (!player || playerIds.length === 0) return 0;
  return getActiveBigThrees(playerIds).filter((group) => group.players.includes(player.id)).length * ROGUELIKE_BIG_THREE_BOOST[stat];
};

const getRoguelikeRivalBoost = (
  player: Player | null,
  playerIds: string[] = [],
  stat: keyof typeof ROGUELIKE_RIVAL_BOOST = "overall",
) => {
  if (!player || playerIds.length === 0) return 0;
  return getActiveRivalBadges(playerIds).filter((group) => group.players.includes(player.id)).length * ROGUELIKE_RIVAL_BOOST[stat];
};

const getRoguelikeTeamChemistryBoost = (
  player: Player | null,
  playerIds: string[] = [],
  stat: "overall" | "other" = "overall",
) => {
  if (!player || playerIds.length === 0) return 0;
  if (stat !== "overall") return 0;
  return getActiveTeamChemistryGroups(playerIds).filter((group) =>
    group.eligiblePlayers.includes(player.id),
  ).length;
};

const getRoguelikeTrainingBoost = (
  player: Player | null,
  trainedPlayerIds: string[] = [],
  stat: keyof typeof ROGUELIKE_TRAINING_BOOST = "overall",
) => {
  if (!player || trainedPlayerIds.length === 0) return 0;
  const trainingCount = trainedPlayerIds.filter((trainedPlayerId) => trainedPlayerId === player.id).length;
  return trainingCount * ROGUELIKE_TRAINING_BOOST[stat];
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
    getRoguelikeTeamChemistryBoost(player, playerIds, boostStat === "overall" ? "overall" : "other") +
    getRoguelikeDynamicDuoBoost(player, playerIds, boostStat) +
    getRoguelikeRolePairBoost(player, playerIds, boostStat) +
    getRoguelikeBigThreeBoost(player, playerIds, boostStat) +
    getRoguelikeRivalBoost(player, playerIds, boostStat) +
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
  if (!isRoguelikeStarterSlot(slot)) return 0;
  if (slot.allowedPositions.includes(player.primaryPosition)) return 0;
  if (player.secondaryPositions.some((position) => slot.allowedPositions.includes(position))) return 0;
  return 5;
};

export const getRoguelikeAdjustedOverallForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
  coachTeamKey: string | null = null,
) => {
  if (!player) return 0;
  const coachBoost = coachTeamKey && getPlayerTeamKey(player) === coachTeamKey ? 1 : 0;
  return Math.max(
    0,
    player.overall +
      coachBoost +
      getRoguelikeTeamChemistryBoost(player, playerIds) +
      getSameTeamChemistryBonusForPlayer(player, playerIds) +
      getRoguelikeDynamicDuoBoost(player, playerIds, "overall") +
      getRoguelikeRolePairBoost(player, playerIds, "overall") +
      getRoguelikeBigThreeBoost(player, playerIds, "overall") +
      getRoguelikeRivalBoost(player, playerIds, "overall") +
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

const getRoguelikeAdjustedInteriorDefenseForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) =>
  getRoguelikeAdjustedRatingForSlot(
    player,
    slot,
    playerIds,
    trainedPlayerIds,
    (target) => target.interiorDefense,
    "interiorDefense",
    0.66,
    1.55,
  );

const getRoguelikeAdjustedPerimeterDefenseForSlot = (
  player: Player | null,
  slot: RosterSlot,
  playerIds: string[] = [],
  trainedPlayerIds: string[] = [],
) =>
  getRoguelikeAdjustedRatingForSlot(
    player,
    slot,
    playerIds,
    trainedPlayerIds,
    (target) => target.perimeterDefense,
    "perimeterDefense",
    0.66,
    1.55,
  );

export const buildRoguelikeOpponentLineup = (node: RoguelikeNode) => {
  const lineup = rosterTemplate();
  const explicitStarterPlayers =
    node.opponentStarterPlayerIds
      ?.map((playerId) => allPlayers.find((player) => player.id === playerId))
      .filter((player): player is Player => Boolean(player)) ?? [];
  if (explicitStarterPlayers.length > 0) {
    explicitStarterPlayers.slice(0, 5).forEach((player, index) => {
      lineup[index] = {
        ...lineup[index],
        player,
      };
    });
    return lineup;
  }

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
  targetAverageOverall = DEFAULT_FACEOFF_TARGET_AVERAGE,
  candidatePool: Player[] = allPlayers,
) =>
  STARTING_FIVE_POSITIONS.reduce((accumulator, position) => {
    const allExactPositionPlayers = uniqueByIdentity(
      candidatePool.filter((player) => {
        if (player.primaryPosition !== position) return false;
        return !blockedIdentities.has(getPlayerIdentityKey(player));
      }),
    ).sort(
      (a, b) =>
        Math.abs(a.overall - targetAverageOverall) - Math.abs(b.overall - targetAverageOverall) ||
        b.overall - a.overall,
    );

    const boundedPlayers = allExactPositionPlayers.filter(
      (player) => player.overall >= targetAverageOverall - 2 && player.overall <= targetAverageOverall + 4,
    );
    const positionPlayers = boundedPlayers.length > 0 ? boundedPlayers : allExactPositionPlayers;

    accumulator[position] = shufflePlayers(positionPlayers, rng);
    return accumulator;
  }, {} as Record<Position, Player[]>);

const wouldActivateBossLineupLinkBoost = (
  candidate: Player,
  selectedPlayers: Player[],
) => {
  if (selectedPlayers.length === 0) return false;

  const proposedPlayers = [...selectedPlayers, candidate];
  const proposedIds = proposedPlayers.map((player) => player.id);

  if (getSameTeamChemistryBonusForPlayer(candidate, proposedIds) > 0) {
    return true;
  }

  return (
    getActiveDynamicDuos(proposedIds).length > 0 ||
    getActiveRolePlayerPairs(proposedIds).length > 0 ||
    getActiveBigThrees(proposedIds).length > 0 ||
    getActiveRivalBadges(proposedIds).length > 0 ||
    getActiveTeamChemistryGroups(proposedIds).length > 0
  );
};

export const generateFaceoffOpponentPlayerIds = (
  roster: Player[],
  seed: number,
  targetAverageOverall = DEFAULT_FACEOFF_TARGET_AVERAGE,
  candidatePool: Player[] = allPlayers,
) => {
  const rng = mulberry32(seed);
  const blockedIdentities = new Set(roster.map(getPlayerIdentityKey));
  const candidatesByPosition = buildExactPositionCandidateMap(
    blockedIdentities,
    rng,
    targetAverageOverall,
    candidatePool,
  );
  const minimumRemainingOverall = Math.max(80, targetAverageOverall - 2);
  const maximumRemainingOverall = Math.min(99, targetAverageOverall + 4);
  const minimumTargetTotal = Math.ceil(minimumRemainingOverall * STARTING_FIVE_POSITIONS.length);
  const maximumTargetTotal = Math.floor(maximumRemainingOverall * STARTING_FIVE_POSITIONS.length);
  const rawTargetTotalOverall = targetAverageOverall * STARTING_FIVE_POSITIONS.length;
  const targetTotalCandidates = Array.from(
    { length: Math.max(0, maximumTargetTotal - minimumTargetTotal + 1) },
    (_, index) => minimumTargetTotal + index,
  ).sort((left, right) => {
    const leftDelta = Math.abs(left - rawTargetTotalOverall);
    const rightDelta = Math.abs(right - rawTargetTotalOverall);
    if (leftDelta !== rightDelta) return leftDelta - rightDelta;
    return left - right;
  });

  const searchForTargetTotal = (targetTotalOverall: number) => {
    const selected: Player[] = [];
    const usedIdentities = new Set<string>();

    const search = (positionIndex: number, totalOverall: number): boolean => {
      if (positionIndex === STARTING_FIVE_POSITIONS.length) {
        return totalOverall === targetTotalOverall;
      }

      const position = STARTING_FIVE_POSITIONS[positionIndex];
      const candidates = candidatesByPosition[position] ?? [];
      const remainingSlots = STARTING_FIVE_POSITIONS.length - positionIndex - 1;

      for (const candidate of candidates) {
        const identity = getPlayerIdentityKey(candidate);
        if (usedIdentities.has(identity)) continue;
        if (wouldActivateBossLineupLinkBoost(candidate, selected)) continue;

        const nextTotal = totalOverall + candidate.overall;
        const minimumPossible = nextTotal + remainingSlots * minimumRemainingOverall;
        const maximumPossible = nextTotal + remainingSlots * maximumRemainingOverall;
        if (minimumPossible > targetTotalOverall || maximumPossible < targetTotalOverall) {
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

    return search(0, 0) ? selected.map((player) => player.id) : null;
  };

  for (const targetTotalOverall of targetTotalCandidates) {
    const matchedLineup = searchForTargetTotal(targetTotalOverall);
    if (matchedLineup) {
      return matchedLineup;
    }
  }

  const fallbackSelected: string[] = [];
  const fallbackUsedIdentities = new Set<string>();

  STARTING_FIVE_POSITIONS.forEach((position) => {
    const candidate = (candidatesByPosition[position] ?? []).find((player) => {
      const identity = getPlayerIdentityKey(player);
      if (fallbackUsedIdentities.has(identity)) return false;
      return !wouldActivateBossLineupLinkBoost(
        player,
        fallbackSelected
          .map((playerId) => allPlayers.find((entry) => entry.id === playerId))
          .filter((entry): entry is Player => Boolean(entry)),
      );
    });

    if (candidate) {
      fallbackSelected.push(candidate.id);
      fallbackUsedIdentities.add(getPlayerIdentityKey(candidate));
    }
  });

  return fallbackSelected;
};

export const evaluateRoguelikeRoster = (
  players: Player[],
  trainedPlayerIds: string[] = [],
  coachTeamKey: string | null = null,
): RoguelikeRosterMetrics => {
  if (players.length === 0) {
      return {
        overall: 0,
        offense: 0,
        defense: 0,
        chemistry: 0,
        rebounding: 0,
      };
  }

  const average = (selector: (player: Player) => number) =>
    Math.round((players.reduce((sum, player) => sum + selector(player), 0) / players.length) * 10) / 10;

  const chemistry = evaluateDraftChemistry(buildPreviewRoster(players)).score;
  const ownedPlayerIds = players.map((player) => player.id);

    return {
      overall: average((player) =>
        player.overall +
        (coachTeamKey && getPlayerTeamKey(player) === coachTeamKey ? 1 : 0) +
        getSameTeamChemistryBonusForPlayer(player, ownedPlayerIds) +
        getRoguelikeTrainingBoost(player, trainedPlayerIds, "overall"),
      ),
    offense: average((player) => player.offense + getRoguelikeTrainingBoost(player, trainedPlayerIds, "offense")),
    defense: average((player) => player.defense + getRoguelikeTrainingBoost(player, trainedPlayerIds, "defense")),
    chemistry: Math.round(chemistry * 10) / 10,
    rebounding: average((player) => player.rebounding + getRoguelikeTrainingBoost(player, trainedPlayerIds, "rebounding")),
  };
};

export const evaluateRoguelikeLineup = (
  lineup: RosterSlot[],
  ownedPlayerIds: string[] = [],
  trainedPlayerIds: string[] = [],
  coachTeamKey: string | null = null,
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
        rebounding: 0,
      };
  }

  const filledSlots = lineup.filter((slot) => Boolean(slot.player));
  const average = (selector: (slot: RosterSlot) => number) =>
    Math.round((filledSlots.reduce((sum, slot) => sum + selector(slot), 0) / filledSlots.length) * 10) / 10;

  const chemistry = evaluateDraftChemistry(lineup).score;

  return {
      overall: average((slot) =>
        getRoguelikeAdjustedOverallForSlot(slot.player, slot, playerIds, trainedPlayerIds, coachTeamKey),
      ),
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
    rebounding: average((slot) => getRoguelikeAdjustedReboundingForSlot(slot.player, slot, playerIds, trainedPlayerIds)),
  };
};

const getFaceoffPlayerRating = (
  player: Player | null,
  slot: RosterSlot,
  opponentPlayer: Player | null,
  ownedPlayerIds: string[] = [],
  opponentOwnedPlayerIds: string[] = [],
  lineupMetrics: RoguelikeRosterMetrics,
  lineupBalanceBonus: number,
  lineupPlayers: Player[],
  trainedPlayerIds: string[] = [],
  opponentTrainedPlayerIds: string[] = [],
  coachTeamKey: string | null = null,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
  opponentBonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
) => {
  if (!player) {
    return {
      baseScore: 0,
      chemistrySupport: 0,
      teamProfileSupport: 0,
      lineupBalanceBonus: 0,
      badgeMatchupBonus: 0,
      headToHeadBonus: 0,
      total: 0,
    } satisfies RoguelikeFaceoffRatingBreakdown;
  }

  const adjustedOverall = getRoguelikeAdjustedOverallForSlot(
    player,
    slot,
    ownedPlayerIds,
    trainedPlayerIds,
    coachTeamKey,
  );
  const adjustedOffense = getRoguelikeAdjustedOffenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedDefense = getRoguelikeAdjustedDefenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedPlaymaking = getRoguelikeAdjustedPlaymakingForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedShooting = getRoguelikeAdjustedShootingForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedRebounding = getRoguelikeAdjustedReboundingForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedAthleticism = getRoguelikeAdjustedAthleticismForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedIntangibles = getRoguelikeAdjustedIntangiblesForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedInteriorDefense = getRoguelikeAdjustedInteriorDefenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedPerimeterDefense = getRoguelikeAdjustedPerimeterDefenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds);
  const adjustedOpponentOverall = getRoguelikeAdjustedOverallForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const adjustedOpponentOffense = getRoguelikeAdjustedOffenseForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const adjustedOpponentDefense = getRoguelikeAdjustedDefenseForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const adjustedOpponentPlaymaking = getRoguelikeAdjustedPlaymakingForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const adjustedOpponentShooting = getRoguelikeAdjustedShootingForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const adjustedOpponentRebounding = getRoguelikeAdjustedReboundingForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const adjustedOpponentInteriorDefense = getRoguelikeAdjustedInteriorDefenseForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const adjustedOpponentPerimeterDefense = getRoguelikeAdjustedPerimeterDefenseForSlot(opponentPlayer, slot, opponentOwnedPlayerIds, opponentTrainedPlayerIds);
  const chemistrySupport = (lineupMetrics.chemistry - 78) * 0.025;
  const teamProfileSupport =
    (lineupMetrics.offense - 80) * 0.006 +
    (lineupMetrics.defense - 80) * 0.006 +
    (lineupMetrics.rebounding - 80) * 0.005;
  const badgeMatchupBonus = getBossBattleBadgeMatchupBonus(
    player,
    opponentPlayer,
    slot,
    lineupMetrics,
    lineupBalanceBonus,
    lineupPlayers,
    bonusBadgeAssignments,
    opponentBonusBadgeAssignments,
  );
  const headToHeadBonus = getBossBattleHeadToHeadBonus(
    {
      overall: adjustedOverall,
      offense: adjustedOffense,
      defense: adjustedDefense,
      playmaking: adjustedPlaymaking,
      shooting: adjustedShooting,
      rebounding: adjustedRebounding,
      perimeterDefense: adjustedPerimeterDefense,
      interiorDefense: adjustedInteriorDefense,
    },
    opponentPlayer
      ? {
          overall: adjustedOpponentOverall,
          offense: adjustedOpponentOffense,
          defense: adjustedOpponentDefense,
          playmaking: adjustedOpponentPlaymaking,
          shooting: adjustedOpponentShooting,
          rebounding: adjustedOpponentRebounding,
          perimeterDefense: adjustedOpponentPerimeterDefense,
          interiorDefense: adjustedOpponentInteriorDefense,
        }
      : null,
    slot,
  );
  const slotSimulationScore =
    adjustedOverall * getBossBattleSlotWeight(slot.slot, "overall") +
    adjustedOffense * getBossBattleSlotWeight(slot.slot, "offense") +
    adjustedDefense * getBossBattleSlotWeight(slot.slot, "defense") +
    adjustedPlaymaking * getBossBattleSlotWeight(slot.slot, "playmaking") +
    adjustedShooting * getBossBattleSlotWeight(slot.slot, "shooting") +
    adjustedRebounding * getBossBattleSlotWeight(slot.slot, "rebounding") +
    adjustedAthleticism * getBossBattleSlotWeight(slot.slot, "athleticism") +
    adjustedIntangibles * getBossBattleSlotWeight(slot.slot, "intangibles");

  const baseScore = Math.round(slotSimulationScore * 10) / 10;
  const total =
    Math.round(
      (baseScore + chemistrySupport + teamProfileSupport + lineupBalanceBonus + badgeMatchupBonus + headToHeadBonus) * 10,
    ) / 10;

  return {
    baseScore,
    chemistrySupport: Math.round(chemistrySupport * 10) / 10,
    teamProfileSupport: Math.round(teamProfileSupport * 10) / 10,
    lineupBalanceBonus: Math.round(lineupBalanceBonus * 10) / 10,
    badgeMatchupBonus: Math.round(badgeMatchupBonus * 10) / 10,
    headToHeadBonus: Math.round(headToHeadBonus * 10) / 10,
    total,
  } satisfies RoguelikeFaceoffRatingBreakdown;
};

const BOSS_BATTLE_SLOT_WEIGHTS: Record<
  RosterSlotType,
  {
    overall: number;
    offense: number;
    defense: number;
    playmaking: number;
    shooting: number;
    rebounding: number;
    athleticism: number;
    intangibles: number;
  }
> = {
  PG: { overall: 0.5, offense: 0.11, defense: 0.08, playmaking: 0.13, shooting: 0.07, rebounding: 0.02, athleticism: 0.05, intangibles: 0.04 },
  SG: { overall: 0.52, offense: 0.13, defense: 0.08, playmaking: 0.07, shooting: 0.1, rebounding: 0.03, athleticism: 0.04, intangibles: 0.03 },
  SF: { overall: 0.5, offense: 0.12, defense: 0.11, playmaking: 0.05, shooting: 0.07, rebounding: 0.06, athleticism: 0.05, intangibles: 0.04 },
  PF: { overall: 0.5, offense: 0.1, defense: 0.12, playmaking: 0.04, shooting: 0.05, rebounding: 0.1, athleticism: 0.04, intangibles: 0.05 },
  C: { overall: 0.5, offense: 0.08, defense: 0.14, playmaking: 0.03, shooting: 0.02, rebounding: 0.14, athleticism: 0.04, intangibles: 0.05 },
  G: { overall: 0.52, offense: 0.11, defense: 0.1, playmaking: 0.07, shooting: 0.07, rebounding: 0.05, athleticism: 0.04, intangibles: 0.04 },
  "G/F": { overall: 0.52, offense: 0.11, defense: 0.1, playmaking: 0.07, shooting: 0.07, rebounding: 0.05, athleticism: 0.04, intangibles: 0.04 },
  "F/C": { overall: 0.52, offense: 0.11, defense: 0.1, playmaking: 0.07, shooting: 0.07, rebounding: 0.05, athleticism: 0.04, intangibles: 0.04 },
  UTIL: { overall: 0.52, offense: 0.11, defense: 0.1, playmaking: 0.07, shooting: 0.07, rebounding: 0.05, athleticism: 0.04, intangibles: 0.04 },
};

const getBossBattleSlotWeight = (
  slotType: RosterSlotType,
  metric: keyof (typeof BOSS_BATTLE_SLOT_WEIGHTS)[RosterSlotType],
) => BOSS_BATTLE_SLOT_WEIGHTS[slotType]?.[metric] ?? BOSS_BATTLE_SLOT_WEIGHTS.UTIL[metric];

const getBonusBadgeDefinitionsForPlayer = (
  playerId: string,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
) =>
  bonusBadgeAssignments
    .filter((assignment) => assignment.playerId === playerId)
    .map((assignment) => playerTypeBadgeDefinitions[assignment.badgeType])
    .filter((badge): badge is PlayerTypeBadgeDefinition => Boolean(badge));

export const getRoguelikePlayerTypeBadges = (
  player: Player,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const mergedBadges = [
    ...getPlayerTypeBadges(player),
    ...getBonusBadgeDefinitionsForPlayer(player.id, bonusBadgeAssignments),
  ];
  const seenTypes = new Set<PlayerTypeBadge>();

  return mergedBadges.filter((badge) => {
    if (seenTypes.has(badge.type)) return false;
    seenTypes.add(badge.type);
    return true;
  });
};

const getRoguelikePlayerTypeBalanceSnapshot = (
  players: Player[],
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const representedTypes = Array.from(
    new Set(
      players.flatMap((player) =>
        getRoguelikePlayerTypeBadges(player, bonusBadgeAssignments).map((badge) => badge.type),
      ),
    ),
  ) as PlayerTypeBadge[];

  return {
    representedTypes,
    representedCount: representedTypes.length,
  };
};

const getBossBattleLineupBalanceBonus = (
  players: Player[],
  chemistry: number,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const snapshot = getRoguelikePlayerTypeBalanceSnapshot(players, bonusBadgeAssignments);
  let bonus = 0;

  if (snapshot.representedCount >= 3) bonus += 0.3;
  if (snapshot.representedCount >= 4) bonus += 0.45;
  if (snapshot.representedCount >= 5) bonus += 0.55;
  bonus += (chemistry - 80) * 0.012;

  return Math.max(0, Math.min(1.8, Math.round(bonus * 10) / 10));
};

const getBossBattleBadgeMatchupBonus = (
  player: Player,
  opponentPlayer: Player | null,
  slot: RosterSlot,
  lineupMetrics: RoguelikeRosterMetrics,
  lineupBalanceBonus: number,
  lineupPlayers: Player[],
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
  opponentBonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const playerBadges = getRoguelikePlayerTypeBadges(player, bonusBadgeAssignments);
  const opponentBadges = opponentPlayer
    ? getRoguelikePlayerTypeBadges(opponentPlayer, opponentBonusBadgeAssignments)
    : [];
  const representedTypes = getRoguelikePlayerTypeBalanceSnapshot(
    lineupPlayers,
    bonusBadgeAssignments,
  ).representedTypes;
  const opponentHasBadge = (badgeType: PlayerTypeBadge) => opponentBadges.some((badge) => badge.type === badgeType);

  let bonus = 0;

  if (playerBadges.some((badge) => badge.type === "slasher")) {
    let slasherBonus = 0;
    if (!opponentHasBadge("lockdown")) slasherBonus += 0.45;
    if ((opponentPlayer?.defense ?? 0) <= player.offense - 2) slasherBonus += 0.3;
    if (slot.slot === "PG" || slot.slot === "SG" || slot.slot === "SF") slasherBonus += 0.15;
    if (representedTypes.includes("sniper")) slasherBonus += 0.15;
    bonus += Math.min(1.1, slasherBonus);
  }

  if (playerBadges.some((badge) => badge.type === "sniper")) {
    let sniperBonus = 0;
    if (!opponentHasBadge("lockdown")) sniperBonus += 0.45;
    if ((opponentPlayer?.perimeterDefense ?? 0) <= player.shooting - 3) sniperBonus += 0.35;
    if (representedTypes.includes("playmaker")) sniperBonus += 0.15;
    if (lineupMetrics.offense >= 86) sniperBonus += 0.1;
    bonus += Math.min(1.1, sniperBonus);
  }

  if (playerBadges.some((badge) => badge.type === "playmaker")) {
    let playmakerBonus = 0;
    if (representedTypes.length >= 4) playmakerBonus += 0.4;
    if (lineupBalanceBonus >= 1.2) playmakerBonus += 0.25;
    if (lineupMetrics.chemistry >= 86) playmakerBonus += 0.2;
    bonus += Math.min(1, playmakerBonus);
  }

  if (playerBadges.some((badge) => badge.type === "board-man")) {
    let boardManBonus = 0;
    if (slot.slot === "PF" || slot.slot === "C") boardManBonus += 0.35;
    if ((opponentPlayer?.rebounding ?? 0) <= player.rebounding - 3) boardManBonus += 0.35;
    if (!opponentHasBadge("board-man")) boardManBonus += 0.15;
    if (lineupMetrics.rebounding >= 85) boardManBonus += 0.1;
    bonus += Math.min(1, boardManBonus);
  }

  if (playerBadges.some((badge) => badge.type === "lockdown")) {
    let lockdownBonus = 0;
    if (opponentHasBadge("slasher") || opponentHasBadge("sniper") || opponentHasBadge("playmaker")) lockdownBonus += 0.55;
    if ((opponentPlayer?.offense ?? 0) >= 88) lockdownBonus += 0.2;
    if ((player.defense + player.perimeterDefense + player.interiorDefense) / 3 >= (opponentPlayer?.offense ?? 0)) lockdownBonus += 0.2;
    if (lineupMetrics.defense >= 86) lockdownBonus += 0.1;
    bonus += Math.min(1.1, lockdownBonus);
  }

  return Math.round(bonus * 10) / 10;
};

const getBossBattleHeadToHeadBonus = (
  playerRatings: {
    overall: number;
    offense: number;
    defense: number;
    playmaking: number;
    shooting: number;
    rebounding: number;
    perimeterDefense: number;
    interiorDefense: number;
  },
  opponentRatings: {
    overall: number;
    offense: number;
    defense: number;
    playmaking: number;
    shooting: number;
    rebounding: number;
    perimeterDefense: number;
    interiorDefense: number;
  } | null,
  slot: RosterSlot,
) => {
  if (!opponentRatings) return 0;

  const overallGap = playerRatings.overall - opponentRatings.overall;

  let bonus = 0;

  if (slot.slot === "PG") {
    bonus =
      overallGap * 0.28 +
      (playerRatings.playmaking - opponentRatings.playmaking) * 0.06 +
      (playerRatings.shooting - opponentRatings.shooting) * 0.03 +
      (playerRatings.perimeterDefense - opponentRatings.perimeterDefense) * 0.03;
  } else if (slot.slot === "SG") {
    bonus =
      overallGap * 0.3 +
      (playerRatings.offense - opponentRatings.offense) * 0.05 +
      (playerRatings.shooting - opponentRatings.shooting) * 0.05 +
      (playerRatings.perimeterDefense - opponentRatings.perimeterDefense) * 0.03;
  } else if (slot.slot === "SF") {
    bonus =
      overallGap * 0.32 +
      (playerRatings.offense - opponentRatings.offense) * 0.04 +
      (playerRatings.defense - opponentRatings.defense) * 0.04 +
      (playerRatings.rebounding - opponentRatings.rebounding) * 0.02;
  } else if (slot.slot === "PF") {
    bonus =
      overallGap * 0.35 +
      (playerRatings.defense - opponentRatings.defense) * 0.05 +
      (playerRatings.rebounding - opponentRatings.rebounding) * 0.04 +
      (playerRatings.interiorDefense - opponentRatings.interiorDefense) * 0.04;
  } else if (slot.slot === "C") {
    bonus =
      overallGap * 0.42 +
      (playerRatings.defense - opponentRatings.defense) * 0.05 +
      (playerRatings.rebounding - opponentRatings.rebounding) * 0.04 +
      (playerRatings.interiorDefense - opponentRatings.interiorDefense) * 0.05;
  } else {
    bonus =
      overallGap * 0.3 +
      (playerRatings.offense - opponentRatings.offense) * 0.03 +
      (playerRatings.defense - opponentRatings.defense) * 0.03;
  }

  return Math.max(-3.5, Math.min(3.5, Math.round(bonus * 10) / 10));
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
  coachTeamKey: string | null = null,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
  opponentBonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
): RoguelikeFaceoffResult => {
  const userLineup = lineup.map((slot) => ({ ...slot })).slice(0, 5);
  const opponentLineup = buildRoguelikeOpponentLineup(node).slice(0, 5);
  const userPlayers = userLineup.map((slot) => slot.player).filter((player): player is Player => Boolean(player));
  const opponentPlayers = opponentLineup.map((slot) => slot.player).filter((player): player is Player => Boolean(player));
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
    const userLineupMetrics = evaluateRoguelikeLineup(
      userLineup,
      resolvedUserPlayerIds,
      trainedPlayerIds,
      coachTeamKey,
    );
  const opponentLineupMetrics = evaluateRoguelikeLineup(opponentLineup, resolvedOpponentPlayerIds, opponentTrainedPlayerIds);
  const userLineupBalanceBonus = getBossBattleLineupBalanceBonus(
    userPlayers,
    userLineupMetrics.chemistry,
    bonusBadgeAssignments,
  );
  const opponentLineupBalanceBonus = getBossBattleLineupBalanceBonus(
    opponentPlayers,
    opponentLineupMetrics.chemistry,
    opponentBonusBadgeAssignments,
  );

  const matchups = userLineup.map((userSlot, index) => {
    const opponentSlot = opponentLineup[index] ?? userSlot;
    const userPlayer = userSlot.player;
    const opponentPlayer = opponentSlot?.player ?? null;
    const userBreakdown = getFaceoffPlayerRating(
      userPlayer,
      userSlot,
      opponentPlayer,
      resolvedUserPlayerIds,
      resolvedOpponentPlayerIds,
      userLineupMetrics,
        userLineupBalanceBonus,
        userPlayers,
        trainedPlayerIds,
        opponentTrainedPlayerIds,
        coachTeamKey,
        bonusBadgeAssignments,
        opponentBonusBadgeAssignments,
      );
    const opponentBreakdown = getFaceoffPlayerRating(
      opponentPlayer,
      opponentSlot ?? userSlot,
      userPlayer,
      resolvedOpponentPlayerIds,
      resolvedUserPlayerIds,
      opponentLineupMetrics,
      opponentLineupBalanceBonus,
      opponentPlayers,
      opponentTrainedPlayerIds,
      trainedPlayerIds,
      null,
      opponentBonusBadgeAssignments,
      bonusBadgeAssignments,
    );
    const userRating = userBreakdown.total;
    const opponentRating = opponentBreakdown.total;
    const ratingDelta = Math.round((userRating - opponentRating) * 10) / 10;
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
      userBreakdown,
      opponentBreakdown,
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
  coachTeamKey: string | null = null,
  bonusBadgeAssignments: RoguelikeBonusBadgeAssignment[] = [],
) => {
  const playerIds = players.map((player) => player.id);
  const metrics = lineup
    ? evaluateRoguelikeLineup(lineup, playerIds, trainedPlayerIds, coachTeamKey)
    : evaluateRoguelikeRoster(players, trainedPlayerIds, coachTeamKey);
  const opponentPlayers =
    (node.opponentStarterPlayerIds ?? node.opponentPlayerIds)?.map((playerId) => allPlayers.find((player) => player.id === playerId)).filter(
      (player): player is Player => Boolean(player),
    ) ?? [];
  const opponentMetrics =
    opponentPlayers.length > 0 ? evaluateRoguelikeLineup(buildPreviewRoster(opponentPlayers), opponentPlayers.map((player) => player.id)) : null;
  const faceoffResult =
      node.battleMode === "starting-five-faceoff" && lineup
        ? resolveRoguelikeFaceoff(
            node,
              lineup,
              playerIds,
              opponentPlayers.map((player) => player.id),
              trainedPlayerIds,
              [],
              coachTeamKey,
              bonusBadgeAssignments,
            )
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
