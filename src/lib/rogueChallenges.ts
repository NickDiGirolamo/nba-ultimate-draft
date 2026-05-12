import { Player, PlayerTier } from "../types";
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
  rewardCoachId?: string;
  requiredTeamName?: string;
}

export interface RogueChallengeRunSettingsPreset {
  challengeId: string;
  settings: Partial<RoguelikeRunSettings>;
}

const slugifyTeamName = (teamName: string) =>
  teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const teamTakeoverChallenges: RogueChallengeDefinition[] = roguelikeCoaches.map((coach) => ({
  id: `${slugifyTeamName(coach.teamName)}-year-1-takeover`,
  title: `${coach.teamName} Year 1 Takeover`,
  description: `Beat the Year 1 NBA Finals with 7 ${coach.teamName} players in your run roster.`,
  reward: 500,
  requirement: `7 ${coach.teamName} players in run roster, clear Year 1 Finals`,
  rewardCoachId: coach.id,
  requiredTeamName: coach.teamName,
}));

const totalTakeoverChallenges: RogueChallengeDefinition[] = roguelikeCoaches.map((coach) => ({
  id: `${slugifyTeamName(coach.teamName)}-total-takeover`,
  title: `${coach.teamName} Total Takeover`,
  description: `Beat the GOAT node with only ${coach.teamName} players in your run roster.`,
  reward: 25_000,
  requirement: `10 ${coach.teamName} players in run roster, clear GOAT node`,
  requiredTeamName: coach.teamName,
}));

export const ROGUE_CHALLENGES: RogueChallengeDefinition[] = [
  {
    id: "western-conference-takeover",
    title: "Western Conference Takeover",
    description: "Use the West-only player pool and get past the Year 1 NBA Finals.",
    reward: 250,
    requirement: "West-only player pool, clear Year 1 Finals",
  },
  {
    id: "eastern-conference-takeover",
    title: "Eastern Conference Takeover",
    description: "Use the East-only player pool and get past the Year 1 NBA Finals.",
    reward: 250,
    requirement: "East-only player pool, clear Year 1 Finals",
  },
  {
    id: "sapphire-year-two-round-one",
    title: "Sapphire Playoff Push",
    description: "Beat the Year 2 NBA Playoffs Round 1 without any Ruby or higher players in your starting lineup.",
    reward: 1000,
    requirement: "Starting lineup only: Emerald/Sapphire players, clear Year 2 Round 1",
  },
  {
    id: "no-trades-year-two-finals",
    title: "No-Trade Finals Run",
    description: "Turn Trades off before the run and beat the Year 2 NBA Finals.",
    reward: 2000,
    requirement: "Trades off, clear Year 2 Finals",
  },
  {
    id: "no-training-year-two-finals",
    title: "No-Camp Finals Run",
    description: "Turn Training Camps off before the run and beat the Year 2 NBA Finals.",
    reward: 2000,
    requirement: "Training Camps off, clear Year 2 Finals",
  },
  {
    id: "sapphire-year-one-finals",
    title: "Sapphire First Ring",
    description: "Beat the Year 1 NBA Finals without any Ruby or higher players in your starting lineup.",
    reward: 250,
    requirement: "Starting lineup only: Emerald/Sapphire players, clear Year 1 Finals",
  },
  {
    id: "coach-team-finals-core",
    title: "Coach's Inner Circle",
    description: "Beat the Year 2 NBA Finals with 5 starters from your coach's NBA team.",
    reward: 750,
    requirement: "5 coach-team starters, clear Year 2 Finals",
  },
  {
    id: "iconic-team-chem-finals-core",
    title: "Iconic Chemistry Core",
    description: "Beat the Year 2 NBA Finals with 5 starters from the same Team Chemistry group.",
    reward: 2500,
    requirement: "5 same Team Chemistry group starters, clear Year 2 Finals",
  },
  ...teamTakeoverChallenges,
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
        hasAtLeastPlayersFromTeam(rosterPlayers, challenge.requiredTeamName, 7)
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
