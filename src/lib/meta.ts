import { allPlayers } from "../data/players";
import {
  CategoryChallenge,
  ChemistryBonus,
  CollectionGoals,
  DraftChallenge,
  LeaderboardEntry,
  MetaProgress,
  PersonalBests,
  PrestigeChallengeDefinition,
  PrestigeProgress,
  PrestigeRewardDefinition,
  RareEvent,
  RunHistoryEntry,
  SimulationResult,
  Trophy,
  TokenProgress,
} from "../types";
import { randomItem } from "./random";

type ChallengeDifficultyTier =
  | "rookie"
  | "role-player"
  | "starter"
  | "all-star"
  | "superstar"
  | "goat";

const CATEGORY_IDS = [
  "offense-lab",
  "defense-lab",
  "playmaking-lab",
  "shooting-lab",
  "rebounding-lab",
  "chemistry-lab",
] as const;

const categoryLabelsById: Record<(typeof CATEGORY_IDS)[number], string> = {
  "offense-lab": "offense",
  "defense-lab": "defense",
  "playmaking-lab": "passing",
  "shooting-lab": "shooting",
  "rebounding-lab": "rebounding",
  "chemistry-lab": "chemistry",
};

const challengeCategoryCompatibility: Record<string, string[]> = {
  "no-s-tier-shortcut": ["chemistry-lab", "defense-lab"],
  "fortress-build": ["defense-lab", "rebounding-lab", "chemistry-lab"],
  "creator-collective": ["playmaking-lab", "offense-lab", "shooting-lab", "chemistry-lab"],
  "dynasty-depth": ["chemistry-lab", "defense-lab", "rebounding-lab"],
  "title-or-bust": ["defense-lab", "chemistry-lab"],
};

const rareEventCategoryCompatibility: Record<string, string[]> = {
  "rare-events-disabled": [...CATEGORY_IDS],
  "tower-ball": ["rebounding-lab", "defense-lab", "chemistry-lab"],
};

const challengeRareEventCompatibility: Record<string, string[]> = {
  "no-s-tier-shortcut": ["tower-ball"],
  "fortress-build": ["tower-ball"],
  "creator-collective": ["tower-ball"],
  "dynasty-depth": ["tower-ball"],
  "title-or-bust": ["tower-ball"],
};

const fallbackChallengeStrategy = (challengeId: string) =>
  challengeCategoryCompatibility[challengeId] ?? [...CATEGORY_IDS];

const fallbackEventStrategy = (eventId: string) =>
  rareEventCategoryCompatibility[eventId] ?? [...CATEGORY_IDS];

const playoffFinishRank: Record<SimulationResult["playoffFinish"], number> = {
  "Missed Playoffs": 0,
  "Lost in Play-In": 1,
  "First Round Exit": 2,
  "Conference Semifinals": 3,
  "Conference Finals": 4,
  "NBA Finals Loss": 5,
  "NBA Champion": 6,
};

const seasonRunsOnly = (history: RunHistoryEntry[]) =>
  history.filter((run) => run.mode !== "category-focus");

export const draftChallenges: DraftChallenge[] = [
  {
    id: "none",
    title: "None",
    description: "No primary challenge is active. Draft the best team you can while keeping any other selected modifiers in play.",
    reward: 0,
  },
  {
    id: "classic",
    title: "Classic",
    description: "No special challenge modifiers. Draft the best team you can and simulate a full season plus playoffs.",
    reward: 0,
  },
  {
    id: "no-s-tier-shortcut",
    title: "No S-Tiers",
    description: "Finish the draft without taking any S-tier player.",
    reward: 18,
  },
  {
    id: "fortress-build",
    title: "Fortress Build",
    description: "Post an elite defense and real rim protection.",
    reward: 15,
  },
  {
    id: "creator-collective",
    title: "Creator Collective",
    description: "Build a team overflowing with shot creation and passing.",
    reward: 14,
  },
  {
    id: "dynasty-depth",
    title: "Dynasty Depth",
    description: "Build a team with real bench support and strong chemistry.",
    reward: 12,
  },
  {
    id: "title-or-bust",
    title: "Title or Bust",
    description: "Anything short of a championship is a failure.",
    reward: 24,
  },
];

export const rareEvents: RareEvent[] = [
  {
    id: "tower-ball",
    title: "Tower Ball",
    description: "Size and interior control are trending upward this run.",
    impact: "Frontcourt-heavy teams gain rebounding and rim-protection value.",
  },
];

export const standardRareEvent: RareEvent = {
  id: "rare-events-disabled",
  title: "Rare Events Disabled",
  description: "This run uses the standard simulation environment with no rare-event modifier.",
  impact: "No extra event bonus will be applied this run.",
};

export const categoryChallenges: CategoryChallenge[] = [
  {
    id: "offense-lab",
    title: "Category Focus: Offense",
    description: "Draft for the highest offensive score you can produce, even if the roster gets a little volatile.",
    metric: "offense",
    metricLabel: "Offense",
  },
  {
    id: "defense-lab",
    title: "Category Focus: Defense",
    description: "Prioritize stoppers, rim deterrence, and two-way balance to post the best defense score possible.",
    metric: "defense",
    metricLabel: "Defense",
  },
  {
    id: "playmaking-lab",
    title: "Category Focus: Passing",
    description: "Stack elite passers, organizers, and connective creators to push the team's passing ceiling.",
    metric: "playmaking",
    metricLabel: "Passing",
  },
  {
    id: "shooting-lab",
    title: "Category Focus: Shooting",
    description: "Chase the most dangerous spacing profile in the draft by loading up on shooting.",
    metric: "shooting",
    metricLabel: "Shooting",
  },
  {
    id: "rebounding-lab",
    title: "Category Focus: Rebounding",
    description: "Build a glass-dominant roster and try to max out the rebounding score.",
    metric: "rebounding",
    metricLabel: "Rebounding",
  },
  {
    id: "chemistry-lab",
    title: "Category Focus: Chemistry",
    description: "Draft a roster with clean positional structure and strong badge synergies to produce the highest chemistry score possible.",
    metric: "chemistry",
    metricLabel: "Chemistry",
  },
];

const getPrestigeChallengeDifficulty = (
  draftChallengeId: string,
  rareEventId: string,
  categoryChallengeId: string | null,
): ChallengeDifficultyTier => {
  const hasRareEvent = rareEventId !== standardRareEvent.id;
  const hasCategoryFocus = Boolean(categoryChallengeId);

  if (draftChallengeId === "classic") {
    return "rookie";
  }

  if (draftChallengeId === "none") {
    return hasRareEvent ? "role-player" : "rookie";
  }

  if (draftChallengeId === "title-or-bust") {
    return hasRareEvent || hasCategoryFocus ? "goat" : "superstar";
  }

  if (draftChallengeId === "no-s-tier-shortcut") {
    return hasRareEvent || hasCategoryFocus ? "superstar" : "all-star";
  }

  if (hasRareEvent || hasCategoryFocus) {
    return "all-star";
  }

  return "starter";
};

const prestigeChallengeReward = (
  challenge: DraftChallenge,
  rareEventId: string,
  categoryChallengeId: string | null,
) => {
  const difficulty = getPrestigeChallengeDifficulty(
    challenge.id,
    rareEventId,
    categoryChallengeId,
  );
  if (challenge.id === "classic") {
    return 30;
  }
  const baseRewardByDifficulty: Record<ChallengeDifficultyTier, number> = {
    rookie: 12,
    "role-player": 22,
    starter: 30,
    "all-star": 42,
    superstar: 58,
    goat: 76,
  };
  const categoryBonus = categoryChallengeId ? 2 : 0;
  const rareEventBonus = rareEventId === standardRareEvent.id ? 0 : 2;

  return baseRewardByDifficulty[difficulty] + categoryBonus + rareEventBonus;
};

const prestigeChallengeGoal = (categoryChallengeId: string | null) =>
  categoryChallengeId
    ? "Post an elite score in the active category focus."
    : "Win the NBA Championship with this setup.";

export const buildPrestigeChallengeId = (
  draftChallengeId: string,
  rareEventId: string,
  categoryChallengeId: string | null,
) =>
  [draftChallengeId, rareEventId, categoryChallengeId ?? "disabled"].join("__");

export const prestigeChallengeDefinitions: PrestigeChallengeDefinition[] = draftChallenges.flatMap(
  (challenge) => {
    if (challenge.id === "classic") {
      return [
          {
            id: buildPrestigeChallengeId(challenge.id, standardRareEvent.id, null),
            order: 0,
            title: challenge.title,
            description:
              "Run a pure season-and-playoffs sim with no extra modifiers and prove your base roster-building strength.",
            goal: prestigeChallengeGoal(null),
            reward: prestigeChallengeReward(challenge, standardRareEvent.id, null),
            difficulty: getPrestigeChallengeDifficulty(challenge.id, standardRareEvent.id, null),
            draftChallengeId: challenge.id,
            rareEventId: standardRareEvent.id,
            categoryChallengeId: null,
          },
      ];
    }

    const eventPool = [standardRareEvent, ...rareEvents];
    const categoryPool = [null, ...categoryChallenges];

    return eventPool.flatMap((event) =>
      categoryPool.map((category) => ({
        id: buildPrestigeChallengeId(challenge.id, event.id, category?.id ?? null),
        order: 0,
        title: [
          challenge.title,
          event.id === standardRareEvent.id ? "Standard Environment" : event.title,
          category ? category.metricLabel : "No Category Focus",
        ].join(" • "),
        description: `${challenge.description} ${
          event.id === standardRareEvent.id
            ? "No rare-event modifier is active."
            : event.description
          } ${
            category
              ? `Category target: maximize ${category.metricLabel.toLowerCase()}.`
              : "No category-focus objective is active."
          }`,
          goal: prestigeChallengeGoal(category?.id ?? null),
          reward: prestigeChallengeReward(challenge, event.id, category?.id ?? null),
          difficulty: getPrestigeChallengeDifficulty(challenge.id, event.id, category?.id ?? null),
          draftChallengeId: challenge.id,
          rareEventId: event.id,
          categoryChallengeId: category?.id ?? null,
        })),
      );
    },
  );

prestigeChallengeDefinitions.forEach((challenge, index) => {
  challenge.order = index + 1;
});

const chemistryDefinitions = [
  {
    id: "stockton-malone",
    title: "Stockton to Malone",
    players: ["john-stockton", "karl-malone"],
    summary: "Elite two-man timing sharpens the half-court offense.",
    bonusScore: 4,
  },
  {
    id: "shaq-kobe",
    title: "Shaq and Kobe",
    players: ["shaquille-o-neal-lakers", "kobe-bryant-8"],
    summary: "Prime star gravity creates one of the scariest scoring duos possible.",
    bonusScore: 5,
  },
  {
    id: "jordan-pippen",
    title: "Jordan and Pippen",
    players: ["michael-jordan", "scottie-pippen"],
    summary: "Two-way wing dominance gives the roster playoff-proof balance.",
    bonusScore: 5,
  },
  {
    id: "magic-kareem",
    title: "Showtime Core",
    players: ["magic-johnson", "kareem-abdul-jabbar-lakers"],
    summary: "Half-court poise and transition tempo both jump a level.",
    bonusScore: 4,
  },
  {
    id: "bucks-kareem",
    title: "Bucks Championship Core",
    players: ["kareem-abdul-jabbar-bucks", "oscar-robertson"],
    summary: "Elite interior scoring and giant-guard orchestration create a ruthless early-70s core.",
    bonusScore: 4,
  },
  {
    id: "celtics-big-3",
    title: "Boston Big 3",
    players: ["ray-allen-celtics", "paul-pierce", "kevin-garnett-celtics"],
    summary: "Spacing, wing shotmaking, and defensive culture create a championship-level trio.",
    bonusScore: 6,
  },
  {
    id: "run-tmc",
    title: "Run TMC",
    players: ["tim-hardaway", "mitch-richmond", "chris-mullin"],
    summary: "Elite pace, shooting, and backcourt creation recreate one of the most electric trios of the era.",
    bonusScore: 5,
  },
  {
    id: "heat-big-3",
    title: "Heat Big 3",
    players: ["lebron-james-heat", "dwayne-wade-10-14", "chris-bosh"],
    summary: "Star power, speed, and small-ball pressure create one of the nastiest modern trios.",
    bonusScore: 6,
  },
  {
    id: "steph-kd",
    title: "Impossible Spacing",
    players: ["steph-curry", "kevin-durant-warriors"],
    summary: "Off-ball gravity and elite shotmaking break the sim open.",
    bonusScore: 5,
  },
  {
    id: "lebron-ad",
    title: "Lakers Super Duo",
    players: ["lebron-james-lakers", "anthony-davis"],
    summary: "Star creation and defensive coverage complement each other cleanly.",
    bonusScore: 3,
  },
  {
    id: "penny-shaq",
    title: "Orlando Lift-Off",
    players: ["penny-hardaway", "shaquille-o-neal-magic"],
    summary: "Size and downhill pressure spike together.",
    bonusScore: 3,
  },
  {
    id: "heat-shaq-wade",
    title: "Heat Star Pair",
    players: ["shaquille-o-neal-heat", "dwayne-wade-03-10"],
    summary: "Veteran interior gravity and explosive slashing create immediate playoff stress.",
    bonusScore: 4,
  },
  {
    id: "kobe-pau",
    title: "Lakers Skill Core",
    players: ["kobe-bryant-24", "pau-gasol"],
    summary: "One elite closer plus one skilled interior connector smooth out every half-court possession.",
    bonusScore: 4,
  },
  {
    id: "kd-russ",
    title: "Thunder Co-Stars",
    players: ["kevin-durant-thunder", "russell-westbrook"],
    summary: "Athletic chaos and star shotmaking generate enormous offensive pressure.",
    bonusScore: 4,
  },
];

export const selectDraftChallenge = (rng: () => number) => randomItem(draftChallenges, rng);
export const selectRareEvent = (rng: () => number) => randomItem(rareEvents, rng);
export const selectCategoryChallenge = (rng: () => number) => randomItem(categoryChallenges, rng);
export const getDraftChallengeById = (id: string) =>
  draftChallenges.find((challenge) => challenge.id === id) ?? draftChallenges[0];
export const getRareEventById = (id: string) =>
  rareEvents.find((event) => event.id === id) ?? standardRareEvent;
export const getCategoryChallengeById = (id: string) =>
  categoryChallenges.find((challenge) => challenge.id === id) ?? null;
export const getPrestigeChallengeDefinitionById = (id: string) =>
  prestigeChallengeDefinitions.find((challenge) => challenge.id === id) ?? null;

export const selectCompatibleRareEvent = (
  challenge: DraftChallenge,
  rng: () => number,
) => {
  const allowedIds = challengeRareEventCompatibility[challenge.id];
  if (!allowedIds?.length) return selectRareEvent(rng);
  const pool = rareEvents.filter((event) => allowedIds.includes(event.id));
  return pool.length ? randomItem(pool, rng) : selectRareEvent(rng);
};

export const selectCompatibleCategoryChallenge = (
  challenge: DraftChallenge,
  rareEvent: RareEvent,
  rng: () => number,
) => {
  const challengeAllowed = new Set(fallbackChallengeStrategy(challenge.id));
  const eventAllowed = new Set(fallbackEventStrategy(rareEvent.id));
  const intersection = categoryChallenges.filter(
    (category) => challengeAllowed.has(category.id) && eventAllowed.has(category.id),
  );
  if (intersection.length) return randomItem(intersection, rng);

  const eventOnly = categoryChallenges.filter((category) => eventAllowed.has(category.id));
  if (eventOnly.length) return randomItem(eventOnly, rng);

  const challengeOnly = categoryChallenges.filter((category) => challengeAllowed.has(category.id));
  if (challengeOnly.length) return randomItem(challengeOnly, rng);

  return selectCategoryChallenge(rng);
};

export const isCategoryCompatibleWithRun = (
  categoryId: string,
  challenge: DraftChallenge,
  rareEvent: RareEvent,
) =>
  fallbackChallengeStrategy(challenge.id).includes(categoryId) &&
  fallbackEventStrategy(rareEvent.id).includes(categoryId);

export const describeRunCompatibility = (
  challenge: DraftChallenge,
  rareEvent: RareEvent,
  category: CategoryChallenge | null,
) => {
  if (!category) {
    return "No category focus is active, so draft toward the cleanest overall winning profile.";
  }

  if (isCategoryCompatibleWithRun(category.id, challenge, rareEvent)) {
    return `${category.metricLabel} supports this run's broader objective, so chasing it should reinforce your overall build instead of pulling against it.`;
  }

  const metricText = categoryLabelsById[category.id as keyof typeof categoryLabelsById] ?? category.metricLabel.toLowerCase();
  return `${category.metricLabel} is more of a side quest than a pure win condition here, so use ${metricText} as a tiebreaker and keep overall roster balance first.`;
};

export const getChemistryBonuses = (playerIds: string[]): ChemistryBonus[] => {
  const owned = new Set(playerIds);

  return chemistryDefinitions.filter((entry) =>
    entry.players.every((playerId) => owned.has(playerId)),
  );
};

export const evaluateRareEventBonus = (
  event: RareEvent,
  players: Array<{
    id: string;
    era: string;
    primaryPosition: string;
    shooting: number;
    defense: number;
    playmaking: number;
    rebounding: number;
    interiorDefense: number;
  }>,
) => {
  let offense = 0;
  let defense = 0;
  let chemistryStructure = 0;
  let chemistry = 0;
  let summary = "No meaningful event boost was triggered this run.";

  if (event.id === "nineties-night") {
    const ninetiesCount = players.filter((player) => /19(8|9)\d/.test(player.era)).length;
    if (ninetiesCount >= 3) {
      defense = 2;
      chemistry = 2;
      summary = "90s-heavy roster composition boosted chemistry and defensive resilience.";
    }
  }

  if (event.id === "pace-and-space") {
    const shooters = players.filter((player) => player.shooting >= 88).length;
    if (shooters >= 3) {
      offense = 3;
      chemistryStructure = 2;
      summary = "Elite spacing translated into extra offensive value and stronger chemistry.";
    }
  }

  if (event.id === "defense-travels") {
    const defenders = players.filter((player) => player.defense >= 88).length;
    if (defenders >= 3) {
      defense = 3;
      chemistry = 1;
      summary = "High-end defenders got an extra boost in this sim environment.";
    }
  }

  if (event.id === "point-forward-era") {
    const jumboCreators = players.filter(
      (player) =>
        ["SF", "PF"].includes(player.primaryPosition) && player.playmaking >= 78,
    ).length;
    if (jumboCreators >= 2) {
      offense = 2;
      chemistryStructure = 2;
      summary = "Big creators made the lineup more dynamic and harder to guard.";
    }
  }

  if (event.id === "tower-ball") {
    const bigs = players.filter((player) => ["PF", "C"].includes(player.primaryPosition)).length;
    if (bigs >= 4) {
      defense = 2;
      chemistryStructure = 1;
      summary = "Frontcourt size improved the team's paint presence and physicality.";
    }
  }

  return { offense, defense, chemistryStructure, chemistry, summary };
};

export const evaluateChallengeCompletion = (
  challenge: DraftChallenge,
  rosterPlayerIds: string[],
  playerTiers: string[],
  result: SimulationResult,
) => {
  if (result.mode === "category-focus") return false;
  switch (challenge.id) {
    case "no-s-tier-shortcut":
      return !playerTiers.includes("S");
    case "floor-spacers":
      return result.metrics.shooting >= 88 && result.metrics.spacing >= 88;
    case "fortress-build":
      return result.metrics.defense >= 90 && result.metrics.rimProtection >= 90;
    case "creator-collective":
      return result.metrics.playmaking >= 88 && result.metrics.offense >= 90;
    case "dynasty-depth":
      return result.metrics.depth >= 84 && result.metrics.chemistry >= 86;
    case "title-or-bust":
      return result.playoffFinish === "NBA Champion";
    default:
      return false;
  }
};

export const calculateLegacyScore = (
  result: SimulationResult,
  challengeReward: number,
  chemistryScore: number,
) => {
  const playoffBonus = playoffFinishRank[result.playoffFinish] * 14;
  return Math.round(
    result.record.wins * 1.35 +
      result.metrics.overall * 2.2 +
      result.metrics.chemistry * 1.2 +
      result.titleOdds * 0.6 +
      playoffBonus +
      challengeReward +
      chemistryScore * 2.2,
  );
};

const bestPlayoffFinish = (history: RunHistoryEntry[]) =>
  history.reduce<SimulationResult["playoffFinish"]>(
    (best, run) =>
      playoffFinishRank[run.playoffFinish] > playoffFinishRank[best]
        ? run.playoffFinish
        : best,
    "Missed Playoffs",
  );

const defaultBests = (): PersonalBests => ({
  wins: 0,
  overall: 0,
  offense: 0,
  defense: 0,
  playmaking: 0,
  shooting: 0,
  rebounding: 0,
  depth: 0,
  chemistry: 0,
  starPower: 0,
  spacing: 0,
  rimProtection: 0,
  legacyScore: 0,
  titleOdds: 0,
  playoffFinish: "Missed Playoffs",
});

export const buildPersonalBests = (history: RunHistoryEntry[]): PersonalBests => {
  if (history.length === 0) return defaultBests();
  const seasonHistory = seasonRunsOnly(history);

    return {
      wins: seasonHistory.length ? Math.max(...seasonHistory.map((run) => run.wins)) : 0,
      overall: Math.max(...history.map((run) => run.metrics.overall)),
      offense: Math.max(...history.map((run) => run.metrics.offense)),
      defense: Math.max(...history.map((run) => run.metrics.defense)),
      playmaking: Math.max(...history.map((run) => run.metrics.playmaking)),
      shooting: Math.max(...history.map((run) => run.metrics.shooting)),
      rebounding: Math.max(...history.map((run) => run.metrics.rebounding)),
      depth: Math.max(...history.map((run) => run.metrics.depth)),
      chemistry: Math.max(...history.map((run) => run.metrics.chemistry)),
      starPower: Math.max(...history.map((run) => run.metrics.starPower)),
      spacing: Math.max(...history.map((run) => run.metrics.spacing)),
      rimProtection: Math.max(...history.map((run) => run.metrics.rimProtection)),
      legacyScore: Math.max(...history.map((run) => run.legacyScore)),
      titleOdds: seasonHistory.length ? Math.max(...seasonHistory.map((run) => run.titleOdds)) : 0,
      playoffFinish: seasonHistory.length ? bestPlayoffFinish(seasonHistory) : "Missed Playoffs",
    };
  };

export const buildLeaderboards = (history: RunHistoryEntry[]): LeaderboardEntry[] => {
  if (history.length === 0) return [];

  const bestBy = (selector: (run: RunHistoryEntry) => number) =>
    history.reduce((best, run) => (selector(run) > selector(best) ? run : best), history[0]);

  return [
    {
      label: "Best Legacy Score",
      value: `${bestBy((run) => run.legacyScore).legacyScore}`,
      teamName: bestBy((run) => run.legacyScore).teamName,
    },
    {
      label: "Best Record",
      value: `${bestBy((run) => run.wins).wins}-${bestBy((run) => run.wins).losses}`,
      teamName: bestBy((run) => run.wins).teamName,
    },
    {
      label: "Best Offense",
      value: `${bestBy((run) => run.metrics.offense).metrics.offense}`,
      teamName: bestBy((run) => run.metrics.offense).teamName,
    },
    {
      label: "Best Defense",
      value: `${bestBy((run) => run.metrics.defense).metrics.defense}`,
      teamName: bestBy((run) => run.metrics.defense).teamName,
    },
    {
      label: "Best Chemistry",
      value: `${bestBy((run) => run.metrics.chemistry).metrics.chemistry}`,
      teamName: bestBy((run) => run.metrics.chemistry).teamName,
    },
  ];
};

export const buildCollectionGoals = (unlockedPlayerIds: string[]): CollectionGoals => {
  const draftedPlayers = unlockedPlayerIds.length;
  const totalPlayers = allPlayers.length;
  const percentage = Math.round((draftedPlayers / totalPlayers) * 100);
  const milestones = [10, 25, 50, 75, totalPlayers].map((value) => ({
    label: value === totalPlayers ? "Complete the full legend collection" : `Draft ${value} unique players`,
    reached: draftedPlayers >= value,
  }));

  return { draftedPlayers, totalPlayers, percentage, milestones };
};

export const buildStreaks = (history: RunHistoryEntry[]) => {
  const ordered = [...seasonRunsOnly(history)].sort((a, b) => b.createdAtStamp - a.createdAtStamp);
  let playoff = 0;
  let titles = 0;
  let fiftyWin = 0;

  for (const run of ordered) {
    if (playoffFinishRank[run.playoffFinish] >= 2) playoff += 1;
    else break;
  }

  for (const run of ordered) {
    if (run.playoffFinish === "NBA Champion") titles += 1;
    else break;
  }

  for (const run of ordered) {
    if (run.wins >= 50) fiftyWin += 1;
    else break;
  }

  return { playoff, titles, fiftyWin };
};

export const buildTrophies = (
  history: RunHistoryEntry[],
  collection: CollectionGoals,
): Trophy[] => {
  const seasonHistory = seasonRunsOnly(history);
  const highestWins = seasonHistory.length ? Math.max(...seasonHistory.map((run) => run.wins)) : 0;
  const highestDefense = history.length ? Math.max(...history.map((run) => run.metrics.defense)) : 0;
  const highestOffense = history.length ? Math.max(...history.map((run) => run.metrics.offense)) : 0;
  const titles = seasonHistory.filter((run) => run.playoffFinish === "NBA Champion").length;

  return [
    {
      id: "first-title",
      title: "Raise Banner No. 1",
      description: "Win your first championship.",
      unlocked: titles >= 1,
    },
    {
      id: "sixty-wins",
      title: "Regular Season Machine",
      description: "Win at least 60 games.",
      unlocked: highestWins >= 60,
    },
    {
      id: "defensive-masterpiece",
      title: "Defensive Masterpiece",
      description: "Build a team with a 92+ defense score.",
      unlocked: highestDefense >= 92,
    },
    {
      id: "offensive-firestorm",
      title: "Offensive Firestorm",
      description: "Build a team with a 94+ offense score.",
      unlocked: highestOffense >= 94,
    },
    {
      id: "collector",
      title: "Collector",
      description: "Draft at least half of the total player pool across runs.",
      unlocked: collection.draftedPlayers >= Math.ceil(collection.totalPlayers / 2),
    },
  ];
};

export const getPrestigeTitleForLevel = (level: number) => {
  if (level >= 30) return "Immortal Architect";
  if (level >= 24) return "Hall of Fame Builder";
  if (level >= 18) return "Dynasty Visionary";
  if (level >= 13) return "Legacy Creator";
  if (level >= 9) return "Franchise Strategist";
  if (level >= 5) return "Rising Executive";
  return "Prospect GM";
};

export const prestigeRewardDefinitions: PrestigeRewardDefinition[] = [
  {
    id: "extra-pick",
    level: 5,
    title: "Extra Pick",
    description:
      "Once per draft, after your 10 core picks, you unlock one extra board of 5 players and may replace one current roster player.",
  },
];

const PRESTIGE_LEVEL_FLOORS = [
  0,
  35,
  75,
  120,
  168,
  235,
  308,
  386,
  470,
  560,
  656,
  758,
  866,
  980,
  1100,
  1226,
  1358,
  1496,
  1640,
  1790,
] as const;

const getPrestigeLevelFloor = (level: number) => {
  if (level <= PRESTIGE_LEVEL_FLOORS.length) {
    return PRESTIGE_LEVEL_FLOORS[level - 1];
  }

  const overflowLevels = level - PRESTIGE_LEVEL_FLOORS.length;
  const lastFloor = PRESTIGE_LEVEL_FLOORS[PRESTIGE_LEVEL_FLOORS.length - 1];
  return lastFloor + overflowLevels * 156;
};

const getPrestigeLevelFromScore = (score: number) => {
  let level = 1;

  while (getPrestigeLevelFloor(level + 1) <= score) {
    level += 1;
  }

  return level;
};

export const hasPrestigeReward = (
  level: number,
  rewardId: PrestigeRewardDefinition["id"],
) => prestigeRewardDefinitions.some((reward) => reward.id === rewardId && level >= reward.level);

const computePrestigeScore = (
  history: RunHistoryEntry[],
  collection: CollectionGoals,
) => {
  const seasonHistory = seasonRunsOnly(history);
  const titles = seasonHistory.filter((run) => run.playoffFinish === "NBA Champion").length;
  const finals = seasonHistory.filter((run) => run.playoffFinish === "NBA Finals Loss").length;
  const conferenceFinals = seasonHistory.filter((run) => run.playoffFinish === "Conference Finals").length;
  const sixtyWinRuns = seasonHistory.filter((run) => run.wins >= 60).length;
  const challengeCompletions = history.filter((run) => run.challengeCompleted).length;
  const completedChallengeRoutes = new Set(
    history
      .filter((run) => run.prestigeChallengeCleared)
      .map((run) => run.prestigeChallengeId)
      .filter((value): value is string => Boolean(value)),
  );
  const challengeRoutePrestige = prestigeChallengeDefinitions
    .filter((challenge) => completedChallengeRoutes.has(challenge.id))
    .reduce((sum, challenge) => sum + challenge.reward, 0);
  const averageLegacy =
    history.length > 0
      ? history.reduce((sum, run) => sum + run.legacyScore, 0) / history.length
      : 0;

  const completedRunsPrestige = history.length * 1;
  const championshipPrestige = titles * 3;
  const deepRunPrestige = finals * 1 + conferenceFinals * 1;
  const sixtyWinPrestige = sixtyWinRuns * 1;
  const challengeCompletionPrestige = challengeCompletions * 1;
  const collectionPrestige = Math.floor(collection.draftedPlayers / 20);
  const legacyQualityPrestige = Math.round(averageLegacy * 0.004);

  const score = Math.round(
    completedRunsPrestige +
      championshipPrestige +
      deepRunPrestige +
      sixtyWinPrestige +
      challengeCompletionPrestige +
      challengeRoutePrestige +
      collectionPrestige +
      legacyQualityPrestige,
  );

  return {
    score,
    titles,
    finals,
    conferenceFinals,
    sixtyWinRuns,
    challengeCompletions,
    completedChallengeRoutes,
    challengeRoutePrestige,
    averageLegacy,
    completedRunsPrestige,
    championshipPrestige,
    deepRunPrestige,
    sixtyWinPrestige,
    challengeCompletionPrestige,
    collectionPrestige,
    legacyQualityPrestige,
  };
};

export const calculateRunEconomyRewards = (
  previousHistory: RunHistoryEntry[],
  nextHistory: RunHistoryEntry[],
  unlockedPlayerIds: string[],
) => {
  const collection = buildCollectionGoals(unlockedPlayerIds);
  const previousScore = computePrestigeScore(previousHistory, collection).score;
  const nextScore = computePrestigeScore(nextHistory, collection).score;
  const prestigeXpAward = Math.max(0, nextScore - previousScore);
  const tokenReward = prestigeXpAward * 10;

  return {
    prestigeXpAward,
    tokenReward,
  };
};

export const buildTokenProgress = (prestigeScore: number): TokenProgress => {
  const lifetimeEarned = prestigeScore * 10;
  return {
    balance: lifetimeEarned,
    lifetimeEarned,
  };
};

export const buildPrestigeProgress = (
  history: RunHistoryEntry[],
  collection: CollectionGoals,
): PrestigeProgress => {
  const {
    score,
    titles,
    completedChallengeRoutes,
    challengeRoutePrestige,
    completedRunsPrestige,
    championshipPrestige,
    deepRunPrestige,
    sixtyWinPrestige,
    challengeCompletionPrestige,
    collectionPrestige,
    legacyQualityPrestige,
  } = computePrestigeScore(history, collection);

  const breakdown = [
    {
      label: "Completed Runs",
      value: completedRunsPrestige,
      description: `${history.length} finished runs add a tiny baseline so failed attempts still move you forward a little.`,
    },
    {
      label: "Championship Banners",
      value: championshipPrestige,
      description: `${titles} titles help, but they are only a small bonus compared with route clears.`,
    },
    {
      label: "Deep Playoff Runs",
      value: deepRunPrestige,
      description: "Deep runs are now light supporting bonuses, not major Prestige drivers.",
    },
    {
      label: "60-Win Seasons",
      value: sixtyWinPrestige,
      description: "Dominant regular seasons add a tiny extra push, but challenge mastery matters much more.",
    },
    {
      label: "Challenge Clears",
      value: challengeCompletionPrestige,
      description: "Finishing challenge runs adds a very small extra push on top of the route reward itself.",
    },
    {
      label: "Challenge Routes",
      value: challengeRoutePrestige,
      description: "Unique route clears are the main source of Prestige. The challenge map is now the real leveling track.",
    },
    {
      label: "Collection Growth",
      value: collectionPrestige,
      description: "Collection growth is now only a very small background bonus.",
    },
    {
      label: "Legacy Quality Bonus",
      value: legacyQualityPrestige,
      description: "Better average run quality still helps a little, but challenge routes should drive almost all of your progress.",
    },
  ];

  const level = getPrestigeLevelFromScore(score);
  const currentLevelFloor = getPrestigeLevelFloor(level);
  const nextLevelScore = getPrestigeLevelFloor(level + 1);
  const progressToNextLevel =
    nextLevelScore === currentLevelFloor
      ? 1
      : (score - currentLevelFloor) / (nextLevelScore - currentLevelFloor);

  return {
    score,
    level,
    title: getPrestigeTitleForLevel(level),
    progressToNextLevel: Math.max(0, Math.min(progressToNextLevel, 1)),
    nextLevelScore,
    currentLevelFloor,
    completedChallengeRoutes: completedChallengeRoutes.size,
    totalChallengeRoutes: prestigeChallengeDefinitions.length,
    breakdown,
  };
};

export const buildMetaProgress = (
  history: RunHistoryEntry[],
  unlockedPlayerIds: string[],
): MetaProgress => {
  const collection = buildCollectionGoals(unlockedPlayerIds);
  const prestige = buildPrestigeProgress(history, collection);

  return {
    prestige,
    tokens: buildTokenProgress(prestige.score),
    personalBests: buildPersonalBests(history),
    leaderboards: buildLeaderboards(history),
    trophies: buildTrophies(history, collection),
    streaks: buildStreaks(history),
    collection,
  };
};
