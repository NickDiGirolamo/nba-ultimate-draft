import { allPlayers } from "../data/players";
import { MetaProgress, Player, PlayerTier } from "../types";
import { teamChemistryGroups } from "./dynamicDuos";
import { getPlayerTier } from "./playerTier";
import {
  getRoguelikeCoachTeamKey,
  roguelikeCoaches,
  type RoguelikeRunSettings,
} from "./roguelike";
import { getPlayerTeamKey } from "./teamChemistry";

export interface RogueChallengeDefinition {
  id: string;
  title: string;
  description: string;
  reward: number;
  requirement: string;
  groupId: RogueChallengeGroupId;
  subgroupId?: RogueChallengeSubgroupId;
  rewardCoachId?: string;
  rewardPlayerId?: string;
  rewardPackTier?: PlayerTier;
  requiredTeamName?: string;
  progress?: RogueChallengeProgressDefinition;
}

export type RogueChallengeGroupId =
  | "milestones"
  | "rookie"
  | "pro"
  | "all-star"
  | "superstar"
  | "hall-of-fame"
  | "team-takeovers";

export type RogueChallengeSubgroupId =
  | "rogue-runs"
  | "rogue-run-players"
  | "collection"
  | "year-one-takeovers"
  | "year-two-takeovers"
  | "total-takeovers";

type RogueMilestoneMetric =
  | "rogueRunsStarted"
  | "rogueRunPlayersDrafted"
  | "rogueRunUniquePlayersDrafted"
  | "collectionPlayers";

export interface RogueChallengeProgressDefinition {
  metric: RogueMilestoneMetric;
  target: number;
  label: string;
  unit: string;
}

export interface RogueChallengeProgress {
  current: number;
  target: number;
  percent: number;
  currentLabel: string;
  targetLabel: string;
  isComplete: boolean;
}

export interface RogueChallengeRunSettingsPreset {
  challengeId: string;
  settings: Partial<RoguelikeRunSettings>;
}

const slugifyTeamName = (teamName: string) =>
  teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const YEAR_ONE_TAKEOVER_REQUIRED_TEAM_PLAYERS = 5;
const YEAR_TWO_TAKEOVER_REQUIRED_TEAM_PLAYERS = 7;

const rogueRunStartedThresholds = [5, 10, 15, 25, 50, 100, 250, 500];
const rogueRunPlayerDraftThresholds = [25, 50, 100, 150, 250, 500, 750, 1000, 1250, 1500];
const collectionPlayerThresholds = [5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500];

const thresholdReward = (threshold: number, multiplier: number, minimum: number) =>
  Math.max(minimum, Math.round(threshold * multiplier));

const getTeamTakeoverRewardPlayerId = (teamName: string, tier: PlayerTier) =>
  allPlayers
    .filter((player) => getPlayerTeamKey(player) === teamName)
    .filter((player) => getPlayerTier(player) === tier)
    .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name))[0]?.id;

const milestoneChallenges: RogueChallengeDefinition[] = [
  ...rogueRunStartedThresholds.map<RogueChallengeDefinition>((threshold) => ({
    id: `milestone-rogue-runs-${threshold}`,
    title: `${threshold} Rogue Runs Started`,
    description:
      threshold === 5
        ? `Start ${threshold} Rogue runs and earn an Emerald player pack.`
        : `Start ${threshold} Rogue runs.`,
    reward: thresholdReward(threshold, 20, 100),
    requirement: `Start ${threshold} Rogue runs`,
    groupId: "milestones",
    subgroupId: "rogue-runs",
    rewardPackTier: threshold === 5 ? "Emerald" : undefined,
    progress: {
      metric: "rogueRunsStarted",
      target: threshold,
      label: "Runs started",
      unit: "runs",
    },
  })),
  ...rogueRunPlayerDraftThresholds.map<RogueChallengeDefinition>((threshold) => ({
    id: `milestone-rogue-run-players-${threshold}`,
    title: `${threshold} Rogue Run Players Drafted`,
    description: `Draft ${threshold} total players across Rogue runs.`,
    reward: thresholdReward(threshold, 5, 250),
    requirement: `Draft ${threshold} total Rogue run players`,
    groupId: "milestones",
    subgroupId: "rogue-run-players",
    progress: {
      metric: "rogueRunPlayersDrafted",
      target: threshold,
      label: "Players drafted",
      unit: "players",
    },
  })),
  {
    id: "milestone-rogue-run-players-all",
    title: "All Rogue Run Players Drafted",
    description: "Draft every player in the Rogue run pool at least once.",
    reward: 15_000,
    requirement: "Draft every player in Rogue runs at least once",
    groupId: "milestones",
    subgroupId: "rogue-run-players",
    progress: {
      metric: "rogueRunUniquePlayersDrafted",
      target: allPlayers.length,
      label: "Unique players drafted",
      unit: "players",
    },
  },
  ...collectionPlayerThresholds.map<RogueChallengeDefinition>((threshold) => ({
    id: `milestone-collection-${threshold}`,
    title: `${threshold} Collection Players`,
    description: `Add ${threshold} players to your permanent collection.`,
    reward: thresholdReward(threshold, 20, 250),
    requirement: `Add ${threshold} players to your collection`,
    groupId: "milestones",
    subgroupId: "collection",
    progress: {
      metric: "collectionPlayers",
      target: threshold,
      label: "Collection players",
      unit: "players",
    },
  })),
];

const teamTakeoverChallenges: RogueChallengeDefinition[] = roguelikeCoaches.map((coach) => ({
  id: `${slugifyTeamName(coach.teamName)}-year-1-takeover`,
  title: `${coach.teamName} Year 1 Takeover`,
  description: `Beat the Year 1 NBA Finals with ${YEAR_ONE_TAKEOVER_REQUIRED_TEAM_PLAYERS} ${coach.teamName} players in your run roster.`,
  reward: 500,
  requirement: `${YEAR_ONE_TAKEOVER_REQUIRED_TEAM_PLAYERS} ${coach.teamName} players in run roster, clear Year 1 Finals`,
  groupId: "team-takeovers",
  subgroupId: "year-one-takeovers",
  rewardPlayerId: getTeamTakeoverRewardPlayerId(coach.teamName, "Emerald"),
  requiredTeamName: coach.teamName,
}));

const yearTwoTakeoverChallenges: RogueChallengeDefinition[] = roguelikeCoaches.map((coach) => ({
  id: `${slugifyTeamName(coach.teamName)}-year-2-takeover`,
  title: `${coach.teamName} Year 2 Takeover`,
  description: `Beat the Year 2 NBA Finals with ${YEAR_TWO_TAKEOVER_REQUIRED_TEAM_PLAYERS} ${coach.teamName} players in your run roster.`,
  reward: 2_500,
  requirement: `${YEAR_TWO_TAKEOVER_REQUIRED_TEAM_PLAYERS} ${coach.teamName} players in run roster, clear Year 2 Finals`,
  groupId: "team-takeovers",
  subgroupId: "year-two-takeovers",
  rewardPlayerId: getTeamTakeoverRewardPlayerId(coach.teamName, "Sapphire"),
  requiredTeamName: coach.teamName,
}));

const totalTakeoverChallenges: RogueChallengeDefinition[] = roguelikeCoaches.map((coach) => ({
  id: `${slugifyTeamName(coach.teamName)}-total-takeover`,
  title: `${coach.teamName} Total Takeover`,
  description: `Beat the GOAT node with only ${coach.teamName} players in your run roster.`,
  reward: 25_000,
  requirement: `10 ${coach.teamName} players in run roster, clear GOAT node`,
  groupId: "team-takeovers",
  subgroupId: "total-takeovers",
  rewardPlayerId: getTeamTakeoverRewardPlayerId(coach.teamName, "Ruby"),
  requiredTeamName: coach.teamName,
}));

export const ROGUE_CHALLENGES: RogueChallengeDefinition[] = [
  ...milestoneChallenges,
  {
    id: "western-conference-takeover",
    title: "Western Conference Takeover",
    description: "Use the West-only player pool and get past the Year 1 NBA Finals.",
    reward: 250,
    requirement: "West-only player pool, clear Year 1 Finals",
    groupId: "rookie",
  },
  {
    id: "eastern-conference-takeover",
    title: "Eastern Conference Takeover",
    description: "Use the East-only player pool and get past the Year 1 NBA Finals.",
    reward: 250,
    requirement: "East-only player pool, clear Year 1 Finals",
    groupId: "rookie",
  },
  {
    id: "sapphire-year-two-round-one",
    title: "Sapphire Playoff Push",
    description: "Beat the Year 2 NBA Playoffs Round 1 without any Ruby or higher players in your starting lineup.",
    reward: 1000,
    requirement: "Starting lineup only: Emerald/Sapphire players, clear Year 2 Round 1",
    groupId: "pro",
  },
  {
    id: "no-trades-year-two-finals",
    title: "No-Trade Finals Run",
    description: "Turn Trades off before the run and beat the Year 2 NBA Finals.",
    reward: 2000,
    requirement: "Trades off, clear Year 2 Finals",
    groupId: "all-star",
  },
  {
    id: "no-training-year-two-finals",
    title: "No-Camp Finals Run",
    description: "Turn Training Camps off before the run and beat the Year 2 NBA Finals.",
    reward: 2000,
    requirement: "Training Camps off, clear Year 2 Finals",
    groupId: "all-star",
  },
  {
    id: "sapphire-year-one-finals",
    title: "Sapphire First Ring",
    description: "Beat the Year 1 NBA Finals without any Ruby or higher players in your starting lineup.",
    reward: 250,
    requirement: "Starting lineup only: Emerald/Sapphire players, clear Year 1 Finals",
    groupId: "rookie",
  },
  {
    id: "coach-team-finals-core",
    title: "Coach's Inner Circle",
    description: "Beat the Year 2 NBA Finals with 5 starters from your coach's NBA team.",
    reward: 750,
    requirement: "5 coach-team starters, clear Year 2 Finals",
    groupId: "pro",
  },
  {
    id: "iconic-team-chem-finals-core",
    title: "Iconic Chemistry Core",
    description: "Beat the Year 2 NBA Finals with 5 starters from the same Team Chemistry group.",
    reward: 2500,
    requirement: "5 same Team Chemistry group starters, clear Year 2 Finals",
    groupId: "superstar",
  },
  ...teamTakeoverChallenges,
  ...yearTwoTakeoverChallenges,
  ...totalTakeoverChallenges,
];

const challengeById = new Map(ROGUE_CHALLENGES.map((challenge) => [challenge.id, challenge]));

const tierRank: Record<PlayerTier, number> = {
  Emerald: 0,
  Sapphire: 1,
  Ruby: 2,
  Amethyst: 3,
  Galaxy: 4,
};

const YEAR_ONE_FINALS_NODE_ID = "year-1-finals";
const YEAR_TWO_PLAYOFFS_ROUND_ONE_NODE_ID = "year-2-playoffs-round-1";
const YEAR_TWO_FINALS_NODE_ID = "year-2-finals";
const GOAT_NODE_ID = "the-goats";

export const getRogueChallengeById = (challengeId: string) => challengeById.get(challengeId) ?? null;

export const getClaimedRogueChallengeRewardTotal = (claimedChallengeIds: string[]) =>
  Array.from(new Set(claimedChallengeIds)).reduce(
    (sum, challengeId) => sum + (getRogueChallengeById(challengeId)?.reward ?? 0),
    0,
  );

export const isValidRogueChallengeId = (challengeId: string) => challengeById.has(challengeId);

const formatProgressNumber = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

const formatProgressLabel = (value: number, definition: RogueChallengeProgressDefinition) => {
  const formattedValue = formatProgressNumber(value);
  if (definition.unit === "floor") return `Floor ${formattedValue}`;
  return `${formattedValue} ${definition.unit}`;
};

export const getRogueChallengeProgress = (
  challenge: RogueChallengeDefinition,
  meta: Pick<MetaProgress, "rogueMilestones">,
): RogueChallengeProgress => {
  if (!challenge.progress) {
    return {
      current: 0,
      target: 1,
      percent: 0,
      currentLabel: "0 / 1",
      targetLabel: "1 clear",
      isComplete: false,
    };
  }

  const current = Math.max(
    0,
    challenge.progress.metric === "rogueRunsStarted"
      ? meta.rogueMilestones.runsStarted
      : challenge.progress.metric === "rogueRunPlayersDrafted"
        ? meta.rogueMilestones.playersDrafted
        : challenge.progress.metric === "rogueRunUniquePlayersDrafted"
          ? meta.rogueMilestones.uniquePlayersDrafted
          : meta.rogueMilestones.collectionPlayers,
  );
  const target = Math.max(1, challenge.progress.target);
  const cappedCurrent = Math.min(current, target);
  const percent = Math.max(0, Math.min(100, Math.round((cappedCurrent / target) * 100)));

  return {
    current,
    target,
    percent,
    currentLabel: `${formatProgressLabel(cappedCurrent, challenge.progress)} / ${formatProgressLabel(
      target,
      challenge.progress,
    )}`,
    targetLabel: challenge.progress.label,
    isComplete: current >= target,
  };
};

export const getCompletedRogueMilestoneChallengeIds = (
  meta: Pick<MetaProgress, "rogueMilestones">,
) =>
  milestoneChallenges
    .filter((challenge) => getRogueChallengeProgress(challenge, meta).isComplete)
    .map((challenge) => challenge.id);

export const getRogueChallengeRunSettingsPreset = (
  challengeId: string,
): RogueChallengeRunSettingsPreset => {
  switch (challengeId) {
    case "western-conference-takeover":
      return {
        challengeId,
        settings: {
          conferenceFilter: "west",
        },
      };
    case "eastern-conference-takeover":
      return {
        challengeId,
        settings: {
          conferenceFilter: "east",
        },
      };
    case "no-trades-year-two-finals":
      return {
        challengeId,
        settings: {
          disableTradeNodes: true,
        },
      };
    case "no-training-year-two-finals":
      return {
        challengeId,
        settings: {
          disableTrainingNodes: true,
        },
      };
    case "coach-team-finals-core":
      return {
        challengeId,
        settings: {
          enableCoaches: true,
        },
      };
    default:
      return {
        challengeId,
        settings: {},
      };
  }
};

const hasNoRubyOrHigherStarters = (startingLineup: Player[]) =>
  startingLineup.length >= 5 &&
  startingLineup.slice(0, 5).every((player) => tierRank[getPlayerTier(player)] < tierRank.Ruby);

const hasFiveCoachTeamStarters = (startingLineup: Player[], coachId: string | null | undefined) => {
  const coachTeamKey = getRoguelikeCoachTeamKey(coachId);
  if (!coachTeamKey || startingLineup.length < 5) return false;

  return startingLineup.slice(0, 5).every((player) => getPlayerTeamKey(player) === coachTeamKey);
};

const hasFiveSameTeamChemistryGroupStarters = (startingLineup: Player[]) => {
  const starterIds = new Set(startingLineup.slice(0, 5).map((player) => player.id));
  if (starterIds.size < 5) return false;

  return teamChemistryGroups.some(
    (group) => group.eligiblePlayers.filter((playerId) => starterIds.has(playerId)).length >= 5,
  );
};

const hasAtLeastPlayersFromTeam = (players: Player[], teamName: string, requiredCount: number) => {
  const matchingPlayerIds = new Set(
    players
      .filter((player) => getPlayerTeamKey(player) === teamName)
      .map((player) => player.id),
  );

  return matchingPlayerIds.size >= requiredCount;
};

const hasOnlyPlayersFromTeam = (players: Player[], teamName: string, requiredCount: number) => {
  const uniquePlayerIds = new Set(players.map((player) => player.id));
  if (uniquePlayerIds.size < requiredCount) return false;

  return players.every((player) => getPlayerTeamKey(player) === teamName);
};

export interface RogueChallengeCompletionContext {
  clearedNodeId: string;
  settings: RoguelikeRunSettings;
  startingLineup: Player[];
  rosterPlayers: Player[];
  hiredCoachId: string | null;
}

export const getCompletedRogueChallengeIdsForClear = ({
  clearedNodeId,
  settings,
  startingLineup,
  rosterPlayers,
  hiredCoachId,
}: RogueChallengeCompletionContext) => {
  const completedIds: string[] = [];

  if (clearedNodeId === YEAR_ONE_FINALS_NODE_ID) {
    if (settings.conferenceFilter === "west") completedIds.push("western-conference-takeover");
    if (settings.conferenceFilter === "east") completedIds.push("eastern-conference-takeover");
    if (hasNoRubyOrHigherStarters(startingLineup)) completedIds.push("sapphire-year-one-finals");
    teamTakeoverChallenges.forEach((challenge) => {
      if (
        challenge.requiredTeamName &&
        hasAtLeastPlayersFromTeam(
          rosterPlayers,
          challenge.requiredTeamName,
          YEAR_ONE_TAKEOVER_REQUIRED_TEAM_PLAYERS,
        )
      ) {
        completedIds.push(challenge.id);
      }
    });
  }

  if (
    clearedNodeId === YEAR_TWO_PLAYOFFS_ROUND_ONE_NODE_ID &&
    hasNoRubyOrHigherStarters(startingLineup)
  ) {
    completedIds.push("sapphire-year-two-round-one");
  }

  if (clearedNodeId === YEAR_TWO_FINALS_NODE_ID) {
    if (settings.disableTradeNodes) completedIds.push("no-trades-year-two-finals");
    if (settings.disableTrainingNodes) completedIds.push("no-training-year-two-finals");
    if (hasFiveCoachTeamStarters(startingLineup, hiredCoachId)) completedIds.push("coach-team-finals-core");
    if (hasFiveSameTeamChemistryGroupStarters(startingLineup)) completedIds.push("iconic-team-chem-finals-core");
    yearTwoTakeoverChallenges.forEach((challenge) => {
      if (
        challenge.requiredTeamName &&
        hasAtLeastPlayersFromTeam(
          rosterPlayers,
          challenge.requiredTeamName,
          YEAR_TWO_TAKEOVER_REQUIRED_TEAM_PLAYERS,
        )
      ) {
        completedIds.push(challenge.id);
      }
    });
  }

  if (clearedNodeId === GOAT_NODE_ID) {
    totalTakeoverChallenges.forEach((challenge) => {
      if (
        challenge.requiredTeamName &&
        hasOnlyPlayersFromTeam(rosterPlayers, challenge.requiredTeamName, 10)
      ) {
        completedIds.push(challenge.id);
      }
    });
  }

  return completedIds;
};
