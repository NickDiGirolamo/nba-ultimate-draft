import { allPlayers } from "../data/players";
import {
  CategoryChallenge,
  ChemistryBonus,
  CollectionGoals,
  DraftChallenge,
  LeaderboardEntry,
  MetaProgress,
  PersonalBests,
  RareEvent,
  RunHistoryEntry,
  SimulationResult,
  Trophy,
} from "../types";
import { randomItem } from "./random";

const CATEGORY_IDS = [
  "offense-lab",
  "defense-lab",
  "playmaking-lab",
  "shooting-lab",
  "rebounding-lab",
  "fit-lab",
  "chemistry-lab",
] as const;

const categoryLabelsById: Record<(typeof CATEGORY_IDS)[number], string> = {
  "offense-lab": "offense",
  "defense-lab": "defense",
  "playmaking-lab": "playmaking",
  "shooting-lab": "shooting",
  "rebounding-lab": "rebounding",
  "fit-lab": "fit",
  "chemistry-lab": "chemistry",
};

const challengeCategoryCompatibility: Record<string, string[]> = {
  "no-s-tier-shortcut": ["fit-lab", "chemistry-lab", "defense-lab"],
  "floor-spacers": ["shooting-lab", "offense-lab", "fit-lab", "playmaking-lab"],
  "fortress-build": ["defense-lab", "rebounding-lab", "fit-lab", "chemistry-lab"],
  "creator-collective": ["playmaking-lab", "offense-lab", "shooting-lab", "fit-lab"],
  "dynasty-depth": ["fit-lab", "chemistry-lab", "defense-lab", "rebounding-lab"],
  "title-or-bust": ["fit-lab", "defense-lab", "chemistry-lab"],
};

const rareEventCategoryCompatibility: Record<string, string[]> = {
  "rare-events-disabled": [...CATEGORY_IDS],
  "nineties-night": ["defense-lab", "chemistry-lab", "fit-lab", "rebounding-lab"],
  "pace-and-space": ["shooting-lab", "offense-lab", "playmaking-lab", "fit-lab"],
  "defense-travels": ["defense-lab", "chemistry-lab", "fit-lab", "rebounding-lab"],
  "point-forward-era": ["playmaking-lab", "fit-lab", "offense-lab", "chemistry-lab"],
  "tower-ball": ["rebounding-lab", "defense-lab", "fit-lab", "chemistry-lab"],
};

const challengeRareEventCompatibility: Record<string, string[]> = {
  "no-s-tier-shortcut": ["nineties-night", "defense-travels", "point-forward-era", "tower-ball"],
  "floor-spacers": ["pace-and-space", "point-forward-era", "nineties-night"],
  "fortress-build": ["defense-travels", "tower-ball", "nineties-night"],
  "creator-collective": ["point-forward-era", "pace-and-space", "nineties-night"],
  "dynasty-depth": ["tower-ball", "defense-travels", "nineties-night", "point-forward-era"],
  "title-or-bust": ["defense-travels", "point-forward-era", "tower-ball"],
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
    id: "classic",
    title: "Classic",
    description: "No special challenge modifiers. Draft the best team you can and simulate a full season plus playoffs.",
    reward: 0,
  },
  {
    id: "no-s-tier-shortcut",
    title: "No S-Tier Shortcut",
    description: "Finish the draft without taking any S-tier player.",
    reward: 18,
  },
  {
    id: "floor-spacers",
    title: "Floor Spacers",
    description: "Build a starting lineup with elite shooting balance.",
    reward: 14,
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
    description: "Build a team with real bench support and lineup fit.",
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
    id: "nineties-night",
    title: "90s Night",
    description: "The sim loves teams built around 90s-era stars this run.",
    impact: "90s-heavy teams get a chemistry and defense bump.",
  },
  {
    id: "pace-and-space",
    title: "Pace and Space",
    description: "Spacing is at a premium in this environment.",
    impact: "Great shooting lineups gain extra offensive value.",
  },
  {
    id: "defense-travels",
    title: "Defense Travels",
    description: "Stops and versatility matter more than usual.",
    impact: "Elite defenders receive a stronger playoff translation bonus.",
  },
  {
    id: "point-forward-era",
    title: "Point Forward Era",
    description: "Large creators are especially dangerous in this sim environment.",
    impact: "Wing initiators and jumbo playmakers get a fit bump.",
  },
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
    title: "Category Focus: Playmaking",
    description: "Stack elite creators and connectors to push the team's playmaking ceiling.",
    metric: "playmaking",
    metricLabel: "Playmaking",
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
    id: "fit-lab",
    title: "Category Focus: Fit",
    description: "Build the cleanest, most complementary roster possible and aim for the highest fit score.",
    metric: "fit",
    metricLabel: "Fit",
  },
  {
    id: "chemistry-lab",
    title: "Category Focus: Chemistry",
    description: "Lean into synergy systems and lineup balance to produce the strongest chemistry score.",
    metric: "chemistry",
    metricLabel: "Chemistry",
  },
];

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
    players: ["shaquille-o-neal", "kobe-bryant"],
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
    players: ["magic-johnson", "kareem-abdul-jabbar"],
    summary: "Half-court poise and transition tempo both jump a level.",
    bonusScore: 4,
  },
  {
    id: "bird-mchale",
    title: "Celtic Frontcourt Craft",
    players: ["larry-bird", "kevin-garnett"],
    summary: "Smart spacing and connective skill amplify the lineup fit.",
    bonusScore: 2,
  },
  {
    id: "steph-kd",
    title: "Impossible Spacing",
    players: ["steph-curry", "kevin-durant"],
    summary: "Off-ball gravity and elite shotmaking break the sim open.",
    bonusScore: 5,
  },
  {
    id: "lebron-ad",
    title: "Lakers Super Duo",
    players: ["lebron-james", "anthony-davis"],
    summary: "Star creation and defensive coverage complement each other cleanly.",
    bonusScore: 3,
  },
  {
    id: "penny-shaq",
    title: "Orlando Lift-Off",
    players: ["penny-hardaway", "shaquille-o-neal"],
    summary: "Size and downhill pressure spike together.",
    bonusScore: 3,
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
  let fit = 0;
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
      fit = 2;
      summary = "Elite spacing translated into extra offensive and fit value.";
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
      fit = 2;
      summary = "Big creators made the lineup more dynamic and harder to guard.";
    }
  }

  if (event.id === "tower-ball") {
    const bigs = players.filter((player) => ["PF", "C"].includes(player.primaryPosition)).length;
    if (bigs >= 4) {
      defense = 2;
      fit = 1;
      summary = "Frontcourt size improved the team's paint presence and physicality.";
    }
  }

  return { offense, defense, fit, chemistry, summary };
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
      return result.metrics.depth >= 84 && result.metrics.fit >= 86;
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
      result.metrics.fit * 1.2 +
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
  fit: 0,
  depth: 0,
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
    fit: Math.max(...history.map((run) => run.metrics.fit)),
    depth: Math.max(...history.map((run) => run.metrics.depth)),
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
      label: "Best Fit",
      value: `${bestBy((run) => run.metrics.fit).metrics.fit}`,
      teamName: bestBy((run) => run.metrics.fit).teamName,
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

export const buildMetaProgress = (
  history: RunHistoryEntry[],
  unlockedPlayerIds: string[],
): MetaProgress => {
  const collection = buildCollectionGoals(unlockedPlayerIds);

  return {
    personalBests: buildPersonalBests(history),
    leaderboards: buildLeaderboards(history),
    trophies: buildTrophies(history, collection),
    streaks: buildStreaks(history),
    collection,
  };
};
