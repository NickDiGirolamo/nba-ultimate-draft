import { allPlayers } from "../data/players";
import { assignPlayerToRoster, rosterTemplate } from "./draft";
import {
  getActiveBigThrees,
  getActiveDynamicDuos,
  getActiveRivalBadges,
  getActiveRolePlayerPairs,
} from "./dynamicDuos";
import { mulberry32 } from "./random";
import { evaluateDraftChemistry } from "./simulate";
import { Player, PlayerTier, Position, RosterSlot, RosterSlotType } from "../types";
import { getPlayerTier } from "./playerTier";

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
  | "training"
  | "trade"
  | "evolution"
  | "roster-cut"
  | "add-position"
  | "all-star";
export type RoguelikeMetric = "overall" | "offense" | "defense" | "chemistry" | "rebounding";
export type RoguelikeBattleMode = "starting-five-faceoff";
export type RoguelikePlayerPoolMode = "all" | "current-season";

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

const VERSION_SUFFIX_PATTERN = /\s\([^)]*\)$/;
const STARTING_FIVE_POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];
const DEFAULT_FACEOFF_TARGET_AVERAGE = 84;

export const getRoguelikeFailureRewards = (floorIndex: number): RoguelikeFailureRewards => {
  const prestigeXpAward = Math.max(2, Math.min(8, floorIndex + 1));

  return {
    prestigeXpAward,
    tokenReward: prestigeXpAward * 10,
  };
};

export const doesRoguelikeNodeAwardClearRewards = (
  node: Pick<RoguelikeNode, "type" | "act" | "eliminationOnLoss">,
) => node.type === "challenge" || Boolean(node.eliminationOnLoss);

export const getRoguelikeClearRewards = (
  node: Pick<RoguelikeNode, "act" | "type" | "eliminationOnLoss" | "clearRewardsOverride">,
): RoguelikeClearRewards => {
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
    training: 3,
    trade: 3,
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
};

export const roguelikeStarterPackages: RoguelikeStarterPackage[] = [
  {
    id: "balanced-foundation",
    title: "Balanced",
    subtitle: "Safest opener",
    description:
      "Start with a stable all-around pool of non-S-tier stars and high-end supporting pieces.",
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

const getProgressiveBossRewards = (bossIndex: number): RoguelikeClearRewards => ({
  tokenReward: 20 + (bossIndex - 1) * 4,
  prestigeXpAward: 4 + Math.round((26 * (bossIndex - 1)) / (REGULAR_BOSS_COUNT - 1)),
});

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

export const roguelikeNodes: RoguelikeNode[] = [
  makeDraftNode({
    id: "year-1-starting-five",
    floor: 1,
    act: 1,
    title: "Draft Your Starting 5",
    description: "Add two more current-season rotation pieces from Starter Cache to complete your opening five.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 0,
    targetLabel: "Choose 2 current-season D-tier players to complete your opening five",
    playerPoolMode: "current-season",
    allowedRewardTiers: ["D"],
  }),
  makeDraftNode({
    id: "year-1-free-agency-1",
    floor: 2,
    act: 1,
    title: "Free Agency 1",
    description: "Sign your first free agent from a current-season C-tier board.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 current-season C-tier players",
    playerPoolMode: "current-season",
    allowedRewardTiers: ["C"],
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
    playerPoolMode: "current-season",
    allowedRewardTiers: ["C"],
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
    playerPoolMode: "current-season",
    allowedRewardTiers: ["C"],
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
    playerPoolMode: "current-season",
    allowedRewardTiers: ["C"],
    clearRewardsOverride: { tokenReward: 20, prestigeXpAward: 4 },
  }),
  makeTradeNode({
    id: "year-1-early-season-trade",
    floor: 9,
    act: 1,
    title: "Early Season Trade",
    description: "Optionally trade one player and replace them from a current-season C-tier board.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 current-season C-tier replacement",
    playerPoolMode: "current-season",
    allowedRewardTiers: ["C"],
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
    description: "Send three players into the Dunk Contest, 3PT Contest, and Skills Challenge for permanent Rogue stat boosts.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Assign 1 player to each event and run All-Star Saturday",
  }),
  makeDraftNode({
    id: "year-1-mid-season-free-agent-add",
    floor: 12,
    act: 1,
    title: "Mid-Season Free Agent Add",
    description: "Add one more current-season C-tier contributor to the run.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 current-season C-tier players",
    playerPoolMode: "current-season",
    allowedRewardTiers: ["C"],
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
  makeBossNode(3, {
    id: "year-1-playoffs-round-1",
    floor: 14,
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
    playerPoolMode: "current-season",
    allowedRewardTiers: ["C"],
  }),
  makeAddPositionNode({
    id: "year-1-new-rotation-test-2",
    floor: 15,
    act: 1,
    title: "New Rotation Test",
    description: "Add another natural position and improve your lineup flexibility.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Choose 1 player and add 1 new natural position",
  }),
  makeTrainingNode({
    id: "year-1-playoff-training",
    floor: 16,
    act: 1,
    title: "Playoff Training Camp",
    description: "Get one player ready for the next series.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeDraftNode({
    id: "year-1-return-from-injury",
    floor: 17,
    act: 1,
    title: "Return from Injury",
    description: "Add one C-tier player from any era. If your roster is full, you'll need to drop someone after the pick.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 C-tier players",
    allowedRewardTiers: ["C"],
  }),
  makeBossNode(4, {
    id: "year-1-conference-semifinals",
    floor: 18,
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
    allowedRewardTiers: ["C"],
  }),
  makeTrainingNode({
    id: "year-1-playoff-training-2",
    floor: 19,
    act: 1,
    title: "Playoff Training Camp - 2",
    description: "Take one more player through playoff prep.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(5, {
    id: "year-1-conference-finals",
    floor: 20,
    act: 1,
    title: "NBA Playoffs: Conference Finals",
    description: "Survive the Conference Finals faceoff.",
    rewardBundleId: "balanced-floor",
    rewardChoices: 3,
    targetLabel: "Beat your Conference Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 84,
    opponentTeamName: "Conference Finals Opponent",
    allowedRewardTiers: ["C"],
  }),
  makeTrainingNode({
    id: "year-1-playoff-training-3",
    floor: 21,
    act: 1,
    title: "Playoff Training Camp - 3",
    description: "One last year-one playoff tune-up.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(6, {
    id: "year-1-finals",
    floor: 22,
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
    allowedRewardTiers: ["B"],
  }),
  makeDraftNode({
    id: "year-2-free-agency",
    floor: 23,
    act: 2,
    title: "Free Agency",
    description: "Open Year 2 by signing one B-tier player from any era.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 B-tier players",
    allowedRewardTiers: ["B"],
  }),
  makeTrainingNode({
    id: "year-2-offseason-training",
    floor: 24,
    act: 2,
    title: "Off-Season Training Camp",
    description: "Put one player through an off-season jump.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeTradeNode({
    id: "year-2-offseason-trade",
    floor: 25,
    act: 2,
    title: "Off-Season Trade",
    description: "Optionally trade one player and replace them from a B-tier board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 B-tier replacement",
    allowedRewardTiers: ["B"],
  }),
  makeRosterCutNode({
    id: "year-2-offseason-roster-cut",
    floor: 26,
    act: 2,
    title: "Off-Season Roster Cut",
    description: "Trim two players before the next season begins.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Select 2 players to cut from your roster",
  }),
  makeBossNode(7, {
    id: "year-2-opening-night",
    floor: 27,
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
    allowedRewardTiers: ["B"],
    unlocksBench: true,
  }),
  makeTrainingNode({
    id: "year-2-in-season-training",
    floor: 28,
    act: 2,
    title: "In-Season Training Camp",
    description: "Keep one player climbing.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeChallengeNode({
    id: "year-2-own-the-glass",
    floor: 29,
    act: 2,
    title: "Challenge 2: Own The Glass",
    description: "Set your strongest rebounding starting five and control the boards.",
    rewardBundleId: "frontcourt-pressure",
    rewardChoices: 3,
    targetLabel: "Reach 81 Rebounding with your starting five",
    checks: [{ metric: "rebounding", target: 81 }],
    allowedRewardTiers: ["B"],
    clearRewardsOverride: { tokenReward: 30, prestigeXpAward: 5 },
  }),
  makeTradeNode({
    id: "year-2-early-season-trade",
    floor: 30,
    act: 2,
    title: "Early Season Trade",
    description: "Optionally trade one player and replace them from a B-tier board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 B-tier replacement",
    allowedRewardTiers: ["B"],
  }),
  makeAddPositionNode({
    id: "year-2-new-rotation-test",
    floor: 31,
    act: 2,
    title: "New Rotation Test",
    description: "Add another natural position to one player.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Choose 1 player and add 1 new natural position",
  }),
  makeAllStarNode({
    id: "year-2-all-star-saturday",
    floor: 32,
    act: 2,
    title: "All-Star Saturday",
    description: "Send three players into the skills events for permanent Rogue boosts.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Assign 1 player to each event and run All-Star Saturday",
  }),
  makeTrainingNode({
    id: "year-2-in-season-training-2",
    floor: 33,
    act: 2,
    title: "In-Season Training Camp",
    description: "One more in-season improvement before the playoffs.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(8, {
    id: "year-2-playoffs-round-1",
    floor: 34,
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
    allowedRewardTiers: ["A"],
  }),
  makeTrainingNode({
    id: "year-2-playoff-training",
    floor: 35,
    act: 2,
    title: "Playoff Training Camp",
    description: "Tune up one player for the next round.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeDraftNode({
    id: "year-2-return-from-injury",
    floor: 36,
    act: 2,
    title: "Return from Injury",
    description: "Add one B-tier player from any era. If your roster is full, you'll need to drop someone after the pick.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 B-tier players",
    allowedRewardTiers: ["B"],
  }),
  makeBossNode(9, {
    id: "year-2-conference-semifinals",
    floor: 37,
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
    allowedRewardTiers: ["A"],
  }),
  makeTrainingNode({
    id: "year-2-playoff-training-2",
    floor: 38,
    act: 2,
    title: "Playoff Training Camp - 2",
    description: "Keep stacking improvements before the conference finals.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(10, {
    id: "year-2-conference-finals",
    floor: 39,
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
    allowedRewardTiers: ["A"],
  }),
  makeTrainingNode({
    id: "year-2-playoff-training-3",
    floor: 40,
    act: 2,
    title: "Playoff Training Camp - 3",
    description: "Give one player a final Year 2 playoff lift.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(11, {
    id: "year-2-finals",
    floor: 41,
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
    allowedRewardTiers: ["A"],
  }),
  makeDraftNode({
    id: "year-3-free-agency",
    floor: 42,
    act: 3,
    title: "Free Agency",
    description: "Start Year 3 by adding one A-tier player from any era.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 A-tier players",
    allowedRewardTiers: ["A"],
  }),
  makeTrainingNode({
    id: "year-3-offseason-training",
    floor: 43,
    act: 3,
    title: "Off-Season Training Camp",
    description: "Put one player through a Year 3 offseason jump.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeTradeNode({
    id: "year-3-offseason-trade",
    floor: 44,
    act: 3,
    title: "Off-Season Trade",
    description: "Optionally trade one player and replace them from an A-tier board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 A-tier replacement",
    allowedRewardTiers: ["A"],
  }),
  makeRosterCutNode({
    id: "year-3-offseason-roster-cut",
    floor: 45,
    act: 3,
    title: "Off-Season Roster Cut",
    description: "Cut two players before the final season opens.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Select 2 players to cut from your roster",
  }),
  makeBossNode(12, {
    id: "year-3-opening-night",
    floor: 46,
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
    allowedRewardTiers: ["A"],
    unlocksBench: true,
  }),
  makeTrainingNode({
    id: "year-3-in-season-training",
    floor: 47,
    act: 3,
    title: "In-Season Training Camp",
    description: "Train one player during the final season.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeChallengeNode({
    id: "year-3-chemistry-is-key",
    floor: 48,
    act: 3,
    title: "Challenge 3: Chemistry is Key",
    description: "Set your best chemistry lineup and prove this roster can function like a champion.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Reach 85 Chemistry with your starting five",
    checks: [{ metric: "chemistry", target: 85 }],
    allowedRewardTiers: ["A"],
    clearRewardsOverride: { tokenReward: 60, prestigeXpAward: 7 },
  }),
  makeTradeNode({
    id: "year-3-early-season-trade",
    floor: 49,
    act: 3,
    title: "Early Season Trade",
    description: "Optionally trade one player and replace them from an A-tier board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Optionally trade 1 player, then draft 1 A-tier replacement",
    allowedRewardTiers: ["A"],
  }),
  makeAddPositionNode({
    id: "year-3-new-rotation-test",
    floor: 50,
    act: 3,
    title: "New Rotation Test",
    description: "Add one last natural position to stretch your lineup options.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Choose 1 player and add 1 new natural position",
  }),
  makeAllStarNode({
    id: "year-3-all-star-saturday",
    floor: 51,
    act: 3,
    title: "All-Star Saturday",
    description: "Send three players into the skills events for final Rogue stat boosts.",
    rewardBundleId: "balanced-floor",
    targetLabel: "Assign 1 player to each event and run All-Star Saturday",
  }),
  makeTrainingNode({
    id: "year-3-in-season-training-2",
    floor: 52,
    act: 3,
    title: "In-Season Training Camp",
    description: "One more in-season boost before the final playoffs.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(13, {
    id: "year-3-playoffs-round-1",
    floor: 53,
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
    allowedRewardTiers: ["S"],
  }),
  makeTrainingNode({
    id: "year-3-playoff-training",
    floor: 54,
    act: 3,
    title: "Playoff Training Camp",
    description: "Keep one player climbing through the last postseason.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeDraftNode({
    id: "year-3-return-from-injury",
    floor: 55,
    act: 3,
    title: "Return from Injury",
    description: "Add one A-tier player from any era. If your roster is full, you'll need to drop someone after the pick.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Choose 1 of 5 A-tier players",
    allowedRewardTiers: ["A"],
  }),
  makeBossNode(14, {
    id: "year-3-conference-semifinals",
    floor: 56,
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
    allowedRewardTiers: ["S"],
  }),
  makeTrainingNode({
    id: "year-3-playoff-training-2",
    floor: 57,
    act: 3,
    title: "Playoff Training Camp - 2",
    description: "Take one player through one more playoff jump.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(15, {
    id: "year-3-conference-finals",
    floor: 58,
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
    allowedRewardTiers: ["S"],
  }),
  makeTrainingNode({
    id: "year-3-playoff-training-3",
    floor: 59,
    act: 3,
    title: "Playoff Training Camp - 3",
    description: "One last playoff tune-up before the championship fight.",
    rewardBundleId: "elite-closers",
    targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
  }),
  makeBossNode(16, {
    id: "year-3-finals",
    floor: 60,
    act: 3,
    title: "NBA Playoffs: Finals",
    description: "Beat your Finals opponent and earn the final pre-GOAT reward board.",
    rewardBundleId: "elite-closers",
    rewardChoices: 5,
    targetLabel: "Beat your Finals Opponent",
    battleMode: "starting-five-faceoff",
    eliminationOnLoss: true,
    opponentAverageOverall: 86,
    opponentTeamName: "Finals Opponent",
    allowedRewardTiers: ["S"],
  }),
  {
    id: "the-goats",
    floor: 61,
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
      return getPlayerTier(lowestVersion) === "B" ? [lowestVersion] : [];
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
      if (getPlayerTier(player) === "S") return -1;
      return player.overall * 0.75 + player.offense * 0.12 + player.defense * 0.13;
    }, 30),
  ),
  "defense-lab": uniqueByIdentity(
    rankPlayers((player) => {
      if (getPlayerTier(player) === "S") return -1;
      if (player.defense < 82) return -1;
      return player.defense * 1.45 + player.rebounding * 0.3 + player.overall * 0.45;
    }, 30),
  ),
  "creator-camp": uniqueByIdentity(
    rankPlayers((player) => {
      if (getPlayerTier(player) === "S") return -1;
      if (player.playmaking < 80) return -1;
      return player.playmaking * 1.45 + player.offense * 0.5 + player.shooting * 0.25;
    }, 30),
  ),
};

const bundleCandidates: Record<RoguelikeBundleId, Player[]> = {
  "balanced-floor": uniqueByIdentity(
    rankPlayers((player) => {
      if (getPlayerTier(player) === "S") return -1;
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
      if (getPlayerTier(player) === "S") return -1;
      return player.overall * 0.75 + player.offense * 0.12 + player.defense * 0.13;
    }, 30);
  }

  if (packageId === "defense-lab") {
    return rankCurrentPool((player) => {
      if (getPlayerTier(player) === "S") return -1;
      if (player.defense < 82) return -1;
      return player.defense * 1.45 + player.rebounding * 0.3 + player.overall * 0.45;
    }, 30);
  }

  return rankCurrentPool((player) => {
    if (getPlayerTier(player) === "S") return -1;
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

export const buildOpeningDraftPool = () =>
  uniqueByIdentity(
    allPlayers.filter(
      (player) => {
        const tier = getPlayerTier(player);
        return tier === "D" || tier === "C" || tier === "B";
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
      return tier === "C" || tier === "D";
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
) => {
  if (!player) return 0;
  return Math.max(
    0,
    player.overall +
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
  const selected: Player[] = [];
  const usedIdentities = new Set<string>();
  const targetTotalOverall = targetAverageOverall * STARTING_FIVE_POSITIONS.length;
  const minimumRemainingOverall = Math.max(80, targetAverageOverall - 2);
  const maximumRemainingOverall = Math.min(99, targetAverageOverall + 4);

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
        rebounding: 0,
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
    rebounding: average((player) => player.rebounding + getRoguelikeTrainingBoost(player, trainedPlayerIds, "rebounding")),
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
        rebounding: 0,
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
    rebounding: average((slot) => getRoguelikeAdjustedReboundingForSlot(slot.player, slot, playerIds, trainedPlayerIds)),
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
    (node.opponentStarterPlayerIds ?? node.opponentPlayerIds)?.map((playerId) => allPlayers.find((player) => player.id === playerId)).filter(
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
