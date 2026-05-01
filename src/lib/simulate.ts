import {
  BracketMatchup,
  CategoryChallenge,
  ConferenceBracket,
  DraftChemistrySnapshot,
  DraftChallenge,
  LeagueContenderProfile,
  OpponentStory,
  Player,
  PlayoffBracket,
  RareEvent,
  RosterSlot,
  SimulationResult,
  TeamMetrics,
} from "../types";
import { allPlayers } from "../data/players";
import {
  assignPlayerToRoster,
  DRAFT_GENERATOR_VERSION,
  generateChoices,
  rosterTemplate,
} from "./draft";
import {
  calculateLegacyScore,
  evaluateChallengeCompletion,
  evaluateRareEventBonus,
  getChemistryBonuses,
} from "./meta";
import { getPlayerTier } from "./playerTier";
import {
  applySynergyBonuses,
  getActiveBigThrees,
  getActiveDynamicDuos,
  getActiveTeamChemistryGroups,
} from "./dynamicDuos";
import { getPlayerTypeBalanceSnapshot } from "./playerTypeBadges";
import { clamp, mulberry32 } from "./random";

const average = (values: number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);
const SLOT_IMPACT_WEIGHTS = [1.36, 1.28, 1.22, 1.18, 1.24, 0.62, 0.62, 0.62, 0.34, 0.24];
const VERSION_SUFFIX_PATTERN = /\s\([^)]*\)$/;
const STRUCTURAL_CHEMISTRY_FLOOR = 72;

const getWeightedRosterEntries = (roster: RosterSlot[]) =>
  roster
    .map((slot, index) => ({
      slot,
      index,
      player: slot.player,
      weight: SLOT_IMPACT_WEIGHTS[index] ?? 0.18,
    }))
    .filter((entry): entry is { slot: RosterSlot; index: number; player: Player; weight: number } => Boolean(entry.player));

const weightedAverage = <T>(items: T[], getValue: (item: T) => number, getWeight: (item: T) => number) => {
  if (items.length === 0) return 0;

  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  if (totalWeight <= 0) return 0;

  return items.reduce((sum, item) => sum + getValue(item) * getWeight(item), 0) / totalWeight;
};

const getPlayers = (roster: RosterSlot[]) => roster.map((slot) => slot.player).filter((player): player is Player => Boolean(player));
const getStarters = (roster: RosterSlot[]) => roster.slice(0, 5).map((slot) => slot.player).filter((player): player is Player => Boolean(player));
const getBench = (roster: RosterSlot[]) => roster.slice(5).map((slot) => slot.player).filter((player): player is Player => Boolean(player));
const getPlayerIdentityKey = (player: Player) =>
  player.name.replace(VERSION_SUFFIX_PATTERN, "").trim().toLowerCase();

const getSlotFitCounts = (roster: RosterSlot[]) => {
  let natural = 0;
  let outOfRole = 0;

  roster.forEach((slot) => {
    const player = slot.player;
    if (!player) return;

    if ([player.primaryPosition, ...player.secondaryPositions].some((position) => slot.allowedPositions.includes(position))) {
      natural += 1;
      return;
    }

    outOfRole += 1;
  });

  return { natural, outOfRole };
};

const getPlayerTypeBalanceBonus = (players: Player[]) => {
  const typeBalance = getPlayerTypeBalanceSnapshot(players);

  let bonus = 0;
  if (typeBalance.representedCount >= 2) bonus += 1.5;
  if (typeBalance.representedCount >= 3) bonus += 1.75;
  if (typeBalance.representedCount >= 4) bonus += 2;
  if (typeBalance.representedCount >= 5) bonus += 2.25;

  return clamp(bonus, 0, 10);
};

export const evaluateDraftChemistry = (roster: RosterSlot[]): DraftChemistrySnapshot => {
  const players = getPlayers(roster);
  const draftedCount = players.length;

  if (draftedCount === 0) {
    return {
      score: 0,
      draftedCount: 0,
      naturalSlotMatches: 0,
      activeBadgeCount: 0,
      badgeBonus: 0,
      slotFitRate: 0,
    };
  }

  const fillRatio = draftedCount / roster.length;
  const { natural, outOfRole } = getSlotFitCounts(roster);
  const slotFitRate = natural / draftedCount;
  const averageIntangibles = average(players.map((player) => player.intangibles));
  const chemistryBonuses = getChemistryBonuses(players.map((player) => player.id));
  const activeDynamicDuos = getActiveDynamicDuos(players.map((player) => player.id));
  const activeBigThrees = getActiveBigThrees(players.map((player) => player.id));
  const activeTeamChemistryGroups = getActiveTeamChemistryGroups(players.map((player) => player.id));
  const activeBadgeCount =
    chemistryBonuses.length +
    activeDynamicDuos.length +
    activeBigThrees.length +
    activeTeamChemistryGroups.length;

  const ballHandlers = players.filter((player) => player.playmaking >= 85 || player.primaryPosition === "PG").length;
  const shooters = players.filter((player) => player.shooting >= 88).length;
  const bigs = players.filter((player) => ["PF", "C"].includes(player.primaryPosition)).length;
  const wings = players.filter((player) => ["SG", "SF"].includes(player.primaryPosition)).length;
  const pointGuards = players.filter((player) => player.primaryPosition === "PG").length;
  const centers = players.filter((player) => player.primaryPosition === "C").length;
  const playerTypeBalanceBonus = getPlayerTypeBalanceBonus(players);

  const creatorsTarget = draftedCount >= 6 ? 2 : 1;
  const shootersTarget = draftedCount >= 7 ? 3 : draftedCount >= 4 ? 2 : 1;
  const bigsTarget = draftedCount >= 6 ? 2 : 1;
  const wingsTarget = draftedCount >= 6 ? 2 : 1;

  let structuralBase = 0;
  if (ballHandlers >= creatorsTarget) structuralBase += 7;
  if (shooters >= shootersTarget) structuralBase += 6;
  if (bigs >= bigsTarget) structuralBase += 5;
  if (wings >= wingsTarget) structuralBase += 4;
  if (draftedCount >= 5 && outOfRole === 0) structuralBase += 5;
  if (draftedCount >= 4 && pointGuards === 0) structuralBase -= 8;
  if (centers >= 4) structuralBase -= 10;
  if (outOfRole > 0) structuralBase -= outOfRole * 4;
  structuralBase += playerTypeBalanceBonus;

  const intangiblesBase = clamp(((averageIntangibles - 68) / 28) * 34, 0, 34);
  const slotFitBase = clamp(slotFitRate * 32, 0, 32);
  const structureBase = clamp(structuralBase, 0, 28);
  const badgeBonus = clamp(
    chemistryBonuses.reduce((sum, bonus) => sum + bonus.bonusScore, 0) * 0.85 +
      activeDynamicDuos.length * 5 +
      activeBigThrees.length * 8 +
      activeTeamChemistryGroups.length * 3,
    0,
    30,
  );

  const score = clamp(
    (intangiblesBase + slotFitBase + structureBase) * fillRatio + badgeBonus,
    0,
    99,
  );

  return {
    score: Math.round(score * 10) / 10,
    draftedCount,
    naturalSlotMatches: natural,
    activeBadgeCount,
    badgeBonus: Math.round(badgeBonus * 10) / 10,
    slotFitRate: Math.round(slotFitRate * 100),
  };
};

const labelForMetric = (value: number) => {
  if (value >= 94) return "Historic";
  if (value >= 89) return "Elite";
  if (value >= 83) return "Contender-Level";
  if (value >= 76) return "Strong";
  if (value >= 69) return "Volatile";
  return "Limited";
};

const getDraftGrade = (overall: number, chemistry: number, depth: number) => {
  const score = overall * 0.5 + chemistry * 0.3 + depth * 0.2;
  if (score >= 93) return "A+";
  if (score >= 90) return "A";
  if (score >= 87) return "A-";
  if (score >= 84) return "B+";
  if (score >= 81) return "B";
  if (score >= 78) return "B-";
  if (score >= 75) return "C+";
  if (score >= 72) return "C";
  return "D";
};

interface SimulationCalibration {
  signature: string;
  sampleCount: number;
  sortedPowerScores: number[];
  categoryThresholds: Record<CategoryChallenge["metric"], number>;
}

const CALIBRATION_SAMPLE_COUNT = 1200;
const CATEGORY_TARGET_PERCENTILE = 0.83;
const CATEGORY_METRICS: CategoryChallenge["metric"][] = [
  "offense",
  "defense",
  "playmaking",
  "shooting",
  "rebounding",
  "chemistry",
];
const WIN_PERCENTILE_ANCHORS = [
  { percentile: 0, wins: 20 },
  { percentile: 0.12, wins: 31 },
  { percentile: 0.3, wins: 39 },
  { percentile: 0.5, wins: 46 },
  { percentile: 0.72, wins: 53 },
  { percentile: 0.88, wins: 58 },
  { percentile: 0.93, wins: 60 },
  { percentile: 0.97, wins: 70 },
  { percentile: 0.995, wins: 80 },
  { percentile: 1, wins: 82 },
] as const;
const TITLE_ODDS_PERCENTILE_ANCHORS = [
  { percentile: 0, odds: 1 },
  { percentile: 0.5, odds: 6 },
  { percentile: 0.75, odds: 14 },
  { percentile: 0.9, odds: 28 },
  { percentile: 0.95, odds: 42 },
  { percentile: 0.985, odds: 60 },
  { percentile: 1, odds: 78 },
] as const;

let simulationCalibrationCache: SimulationCalibration | null = null;

const getCalibrationSignature = () =>
  `${DRAFT_GENERATOR_VERSION}::${allPlayers.length}::${allPlayers
    .map((player) => `${player.id}:${player.hallOfFameTier}:${player.overall}`)
    .join("|")}`;

const interpolateAnchors = (
  value: number,
  anchors: readonly { percentile: number; wins?: number; odds?: number }[],
  key: "wins" | "odds",
) => {
  if (value <= anchors[0].percentile) return anchors[0][key] ?? 0;
  if (value >= anchors[anchors.length - 1].percentile) {
    return anchors[anchors.length - 1][key] ?? 0;
  }

  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    if (value <= current.percentile) {
      const span = current.percentile - previous.percentile || 1;
      const progress = (value - previous.percentile) / span;
      const previousValue = previous[key] ?? 0;
      const currentValue = current[key] ?? 0;
      return previousValue + (currentValue - previousValue) * progress;
    }
  }

  return anchors[anchors.length - 1][key] ?? 0;
};

const computePowerScore = (metrics: TeamMetrics) =>
  metrics.overall * 0.29 +
  metrics.offense * 0.18 +
  metrics.defense * 0.18 +
  metrics.chemistry * 0.13 +
  metrics.depth * 0.08 +
  metrics.starPower * 0.09 +
  metrics.chemistry * 0.05;

const scoreChoiceForAutoDraft = (player: Player, roster: RosterSlot[]) => {
  const openSlots = roster.filter((slot) => slot.player === null);
  const naturalOpenSlot = openSlots.some((slot) => slot.allowedPositions.includes(player.primaryPosition));
  const anyOpenSlot = openSlots.some((slot) =>
    [player.primaryPosition, ...player.secondaryPositions].some((position) =>
      slot.allowedPositions.includes(position),
    ),
  );

  return (
    player.overall * 0.48 +
    player.offense * 0.09 +
    player.defense * 0.09 +
    player.playmaking * 0.06 +
    player.shooting * 0.06 +
    player.rebounding * 0.04 +
    player.intangibles * 0.04 +
    (naturalOpenSlot ? 7 : anyOpenSlot ? 3 : -6)
  );
};

const scoreChoiceForCategoryDraft = (
  player: Player,
  roster: RosterSlot[],
  metric: CategoryChallenge["metric"],
) => {
  const openSlots = roster.filter((slot) => slot.player === null);
  const naturalOpenSlot = openSlots.some((slot) => slot.allowedPositions.includes(player.primaryPosition));
  const anyOpenSlot = openSlots.some((slot) =>
    [player.primaryPosition, ...player.secondaryPositions].some((position) =>
      slot.allowedPositions.includes(position),
    ),
  );
  const positionBonus = naturalOpenSlot ? 8 : anyOpenSlot ? 4 : -7;

  switch (metric) {
    case "offense":
      return (
        player.overall * 0.44 +
        player.offense * 0.3 +
        player.shooting * 0.1 +
        player.playmaking * 0.08 +
        positionBonus
      );
    case "defense":
      return (
        player.overall * 0.42 +
        player.defense * 0.28 +
        player.interiorDefense * 0.09 +
        player.perimeterDefense * 0.08 +
        player.rebounding * 0.05 +
        positionBonus
      );
    case "playmaking":
      return (
        player.overall * 0.42 +
        player.playmaking * 0.31 +
        player.intangibles * 0.08 +
        player.shooting * 0.05 +
        player.offense * 0.05 +
        positionBonus
      );
    case "shooting":
      return (
        player.overall * 0.43 +
        player.shooting * 0.34 +
        player.offense * 0.08 +
        player.playmaking * 0.04 +
        positionBonus
      );
    case "rebounding":
      return (
        player.overall * 0.43 +
        player.rebounding * 0.31 +
        player.interiorDefense * 0.08 +
        player.athleticism * 0.05 +
        positionBonus
      );
    case "chemistry":
      return (
        player.overall * 0.33 +
        player.intangibles * 0.18 +
        player.playmaking * 0.12 +
        player.defense * 0.08 +
        player.shooting * 0.08 +
        positionBonus * 1.05
      );
    default:
      return scoreChoiceForAutoDraft(player, roster);
  }
};

const runSyntheticDraftPowerSample = (seed: number) => {
  let roster = rosterTemplate();
  const draftedPlayerIds: string[] = [];

  for (let pick = 1; pick <= 10; pick += 1) {
    const choices = generateChoices(roster, draftedPlayerIds, seed, pick);
    const selected = choices
      .slice()
      .sort((a, b) => scoreChoiceForAutoDraft(b, roster) - scoreChoiceForAutoDraft(a, roster))[0];
    const assignment = assignPlayerToRoster(roster, selected);
    roster = assignment.roster;
    draftedPlayerIds.push(selected.id);
  }

  const metrics = evaluateTeam(roster);
  return computePowerScore(metrics);
};

const runSyntheticCategoryFocusSample = (
  metric: CategoryChallenge["metric"],
  seed: number,
) => {
  let roster = rosterTemplate();
  const draftedPlayerIds: string[] = [];

  for (let pick = 1; pick <= 10; pick += 1) {
    const choices = generateChoices(roster, draftedPlayerIds, seed, pick);
    const selected = choices
      .slice()
      .sort(
        (a, b) =>
          scoreChoiceForCategoryDraft(b, roster, metric) -
          scoreChoiceForCategoryDraft(a, roster, metric),
      )[0];
    const assignment = assignPlayerToRoster(roster, selected);
    roster = assignment.roster;
    draftedPlayerIds.push(selected.id);
  }

  const metrics = evaluateTeam(roster);
  return metrics[metric];
};

const percentileScoreFromSorted = (sortedScores: number[], percentile: number) => {
  if (sortedScores.length === 0) return 95;
  const index = Math.min(
    sortedScores.length - 1,
    Math.max(0, Math.floor((sortedScores.length - 1) * percentile)),
  );
  return Math.round(sortedScores[index] * 10) / 10;
};

const getSimulationCalibration = () => {
  const signature = getCalibrationSignature();
  if (simulationCalibrationCache?.signature === signature) return simulationCalibrationCache;

  const sortedPowerScores = Array.from({ length: CALIBRATION_SAMPLE_COUNT }, (_, index) =>
    runSyntheticDraftPowerSample(700000 + index * 193),
  ).sort((a, b) => a - b);
  const categoryThresholds = CATEGORY_METRICS.reduce(
    (accumulator, metric, metricIndex) => {
      const sortedMetricScores = Array.from(
        { length: CALIBRATION_SAMPLE_COUNT },
        (_, index) => runSyntheticCategoryFocusSample(metric, 910000 + metricIndex * 5000 + index * 211),
      ).sort((a, b) => a - b);
      accumulator[metric] = percentileScoreFromSorted(
        sortedMetricScores,
        CATEGORY_TARGET_PERCENTILE,
      );
      return accumulator;
    },
    {} as Record<CategoryChallenge["metric"], number>,
  );

  simulationCalibrationCache = {
    signature,
    sampleCount: CALIBRATION_SAMPLE_COUNT,
    sortedPowerScores,
    categoryThresholds,
  };

  return simulationCalibrationCache;
};

const getCalibratedPercentile = (powerScore: number) => {
  const calibration = getSimulationCalibration();
  const scores = calibration.sortedPowerScores;
  let low = 0;
  let high = scores.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (scores[mid] <= powerScore) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return clamp(low / scores.length, 0, 1);
};

const calibratedWinsFromPower = (powerScore: number, variance: number, rng: () => number) => {
  const percentile = getCalibratedPercentile(powerScore);
  const expectedWins = interpolateAnchors(percentile, WIN_PERCENTILE_ANCHORS, "wins");
  const varianceSwing = (rng() - 0.5) * clamp(variance * 0.32, 1.2, 4.6);

  return {
    percentile,
    wins: clamp(Math.round(expectedWins + varianceSwing), 18, 82),
  };
};

const calibratedTitleOddsFromPercentile = (percentile: number) =>
  clamp(Math.round(interpolateAnchors(percentile, TITLE_ODDS_PERCENTILE_ANCHORS, "odds")), 1, 78);

export const getCategoryChallengeTarget = (
  metric: CategoryChallenge["metric"],
) => getSimulationCalibration().categoryThresholds[metric];

const contenderStyleFromStars = (players: Player[]) => {
  const avgShooting = average(players.map((player) => player.shooting));
  const avgDefense = average(players.map((player) => player.defense));
  const avgPlaymaking = average(players.map((player) => player.playmaking));
  const avgRebounding = average(players.map((player) => player.rebounding));
  const avgSizeDefense = average(players.map((player) => player.interiorDefense));

  if (avgDefense >= 89 && avgSizeDefense >= 82) return "Defensive Fortress";
  if (avgShooting >= 88 && avgPlaymaking >= 84) return "Spacing Machine";
  if (avgPlaymaking >= 88 && avgRebounding >= 82) return "Jumbo Playmaking Core";
  if (avgShooting >= 85 && avgDefense >= 84) return "Two-Way Shotmaking Core";
  if (avgRebounding >= 87 && avgSizeDefense >= 84) return "Frontcourt Pressure Build";
  return "Star-Driven Offense";
};

const contenderSummaryFromStyle = (style: string) => {
  switch (style) {
    case "Defensive Fortress":
      return "Wins with rim deterrence, wing resistance, and low-possession playoff basketball.";
    case "Spacing Machine":
      return "Leans on shotmaking, spacing gravity, and half-court efficiency.";
    case "Jumbo Playmaking Core":
      return "Creates mismatches through size, rebounding, and oversized initiators.";
    case "Two-Way Shotmaking Core":
      return "Balances perimeter scoring with real defensive credibility.";
    case "Frontcourt Pressure Build":
      return "Controls the glass and the paint while forcing physical matchups.";
    default:
      return "Built around elite star talent with enough supporting offense to stay dangerous.";
  }
};

const buildLeagueContext = (
  contenders: LeagueContenderProfile[],
  userWins: number,
  userSeed: number,
  conference: "East" | "West",
) => {
  const topWins = contenders.slice(0, 4).map((team) => team.projectedWins);
  const eliteCount = contenders.filter((team) => team.projectedWins >= 56).length;
  const averageTopWins = average(topWins);
  const gapBetweenTopAndUser = contenders[0]
    ? contenders[0].projectedWins - userWins
    : 0;

  if (eliteCount >= 4) {
    return `This run generated an unusually loaded ${conference}, with ${eliteCount} teams projecting to at least 56 wins. A ${userSeed}-seed finish here was competing against a very top-heavy field.`;
  }

  if (averageTopWins >= 55) {
    return `The top of the ${conference} was strong in this run, with the leading contenders all tracking well above 50 wins. Your ${userSeed}-seed finish came in a tougher-than-normal conference environment.`;
  }

  if (gapBetweenTopAndUser <= 4) {
    return `This was a balanced ${conference} race. The gap between the top seed and the middle of the playoff field stayed narrow, which made every few wins matter.`;
  }

  return `The ${conference} field had a clear upper tier in this run, and your team landed just behind that front group in the standings race.`;
};

const buildMatchupReason = (
  opponent: LeagueContenderProfile,
  metrics: TeamMetrics,
  playoffFinish: SimulationResult["playoffFinish"],
) => {
  if (opponent.style === "Defensive Fortress" && metrics.shooting < 84) {
    return "Their defensive backbone and playoff resistance squeezed your spacing and forced tougher half-court possessions.";
  }
  if (opponent.style === "Spacing Machine" && metrics.rimProtection < 80) {
    return "Their spacing and shotmaking pulled your defense into uncomfortable coverage all series long.";
  }
  if (opponent.style === "Jumbo Playmaking Core" && metrics.rebounding < 84) {
    return "Their size and creation pressure won too many extra possessions and matchup advantages.";
  }
  if (playoffFinish === "NBA Champion") {
    return "Beating them was the turning point because your roster matched elite talent with just enough structure to survive every adjustment.";
  }

  return "Their star trio presented fewer structural weak spots, and that edge showed up over a long series.";
};

const buildSyntheticContender = (
  available: Player[],
  conference: "East" | "West",
  rng: () => number,
) => {
  const takeUniqueStar = () => {
    if (available.length === 0) {
      return allPlayers[Math.floor(rng() * allPlayers.length)];
    }

    const weightedPool = available
      .slice()
      .sort((a, b) => b.overall - a.overall)
      .slice(0, Math.max(18, Math.floor(available.length * 0.28)));
    const choice = weightedPool[Math.floor(rng() * weightedPool.length)];
    const choiceIdentity = getPlayerIdentityKey(choice);

    for (let index = available.length - 1; index >= 0; index -= 1) {
      if (getPlayerIdentityKey(available[index]) === choiceIdentity) {
        available.splice(index, 1);
      }
    }
    return choice;
  };

  const stars = [takeUniqueStar(), takeUniqueStar(), takeUniqueStar()];
  const style = contenderStyleFromStars(stars);
  const powerBase =
    average(stars.map((player) => player.overall)) * 0.56 +
    average(stars.map((player) => player.intangibles)) * 0.16 +
    average(stars.map((player) => player.shooting)) * 0.08 +
    average(stars.map((player) => player.defense)) * 0.08 +
    average(stars.map((player) => player.playmaking)) * 0.08;
  const power = Math.round(clamp(powerBase + (rng() - 0.5) * 4.5 + 1.5, 84, 98) * 10) / 10;
  const projectedWins = clamp(calibratedWinsFromPower(power, 10.5, rng).wins, 46, 68);

  return {
    teamName: `${stars[0].name.split(" ").slice(-1)[0]} ${style.split(" ")[0]}`,
    seed: 0,
    conference,
    projectedWins,
    power,
    style,
    summary: contenderSummaryFromStyle(style),
    stars,
  } satisfies LeagueContenderProfile;
};

const simulateSeriesWinner = (
  home: LeagueContenderProfile,
  away: LeagueContenderProfile,
  rng: () => number,
) => {
  const homeScore = home.power + home.projectedWins * 0.12 + (9 - home.seed) * 0.45 + (rng() - 0.5) * 4.2;
  const awayScore = away.power + away.projectedWins * 0.12 + (9 - away.seed) * 0.45 + (rng() - 0.5) * 4.2;
  return homeScore >= awayScore ? home : away;
};

const buildConferenceBracket = (
  teams: LeagueContenderProfile[],
  rng: () => number,
): ConferenceBracket => {
  const seededTeams = teams
    .slice()
    .sort((a, b) => a.seed - b.seed)
    .slice(0, 8);

  const quarterfinalPairs: Array<[LeagueContenderProfile, LeagueContenderProfile]> = [
    [seededTeams[0], seededTeams[7]],
    [seededTeams[3], seededTeams[4]],
    [seededTeams[2], seededTeams[5]],
    [seededTeams[1], seededTeams[6]],
  ].filter(
    (pair): pair is [LeagueContenderProfile, LeagueContenderProfile] =>
      Boolean(pair[0] && pair[1]),
  );

  const quarterfinals = quarterfinalPairs.map(([home, away], index) => {
    const winner = simulateSeriesWinner(home, away, rng);
    return {
      id: `${home.conference.toLowerCase()}-qf-${index + 1}`,
      round: "First Round",
      home,
      away,
      winnerTeamName: winner.teamName,
    };
  });

  const quarterWinners = quarterfinals.map((series) =>
    series.winnerTeamName === series.home.teamName ? series.home : series.away,
  );

  const semifinalPairs: Array<[LeagueContenderProfile, LeagueContenderProfile]> = [
    [quarterWinners[0], quarterWinners[1]],
    [quarterWinners[2], quarterWinners[3]],
  ].filter(
    (pair): pair is [LeagueContenderProfile, LeagueContenderProfile] =>
      Boolean(pair[0] && pair[1]),
  );

  const semifinals = semifinalPairs.map(([home, away], index) => {
    const winner = simulateSeriesWinner(home, away, rng);
    return {
      id: `${home.conference.toLowerCase()}-sf-${index + 1}`,
      round: "Conference Semifinals",
      home,
      away,
      winnerTeamName: winner.teamName,
    };
  });

  const semifinalWinners = semifinals.map((series) =>
    series.winnerTeamName === series.home.teamName ? series.home : series.away,
  );

  const conferenceFinal =
    semifinalWinners.length === 2
      ? (() => {
          const [home, away] = semifinalWinners;
          const winner = simulateSeriesWinner(home, away, rng);
          return {
            id: `${home.conference.toLowerCase()}-cf`,
            round: "Conference Finals",
            home,
            away,
            winnerTeamName: winner.teamName,
          };
        })()
      : null;

  const champion = conferenceFinal
    ? conferenceFinal.winnerTeamName === conferenceFinal.home.teamName
      ? conferenceFinal.home
      : conferenceFinal.away
    : null;

  return {
    teams: seededTeams,
    quarterfinals,
    semifinals,
    conferenceFinal,
    champion,
  };
};

const buildPlayoffBracket = (
  eastTeams: LeagueContenderProfile[],
  westTeams: LeagueContenderProfile[],
  rng: () => number,
): PlayoffBracket => {
  const east = buildConferenceBracket(eastTeams, rng);
  const west = buildConferenceBracket(westTeams, rng);

  const finals =
    east.champion && west.champion
      ? (() => {
          const winner = simulateSeriesWinner(east.champion, west.champion, rng);
          return {
            id: "nba-finals",
            round: "NBA Finals",
            home: east.champion,
            away: west.champion,
            winnerTeamName: winner.teamName,
          };
        })()
      : null;

  const champion = finals
    ? finals.winnerTeamName === finals.home.teamName
      ? finals.home
      : finals.away
    : null;

  return { east, west, finals, champion };
};

const matchupIncludesUser = (matchup: BracketMatchup | null | undefined) =>
  Boolean(matchup && (matchup.home.isUserTeam || matchup.away.isUserTeam));

const getUserOpponentFromMatchup = (matchup: BracketMatchup | null | undefined) => {
  if (!matchupIncludesUser(matchup) || !matchup) return null;
  return matchup.home.isUserTeam ? matchup.away : matchup.home;
};

const didUserWinMatchup = (matchup: BracketMatchup | null | undefined) => {
  if (!matchupIncludesUser(matchup) || !matchup) return false;
  const userTeam = matchup.home.isUserTeam ? matchup.home : matchup.away;
  return matchup.winnerTeamName === userTeam.teamName;
};

const getPlayoffFinishFromBracket = (
  playoffBracket: PlayoffBracket,
  conference: "East" | "West",
): SimulationResult["playoffFinish"] => {
  const userConference = conference === "East" ? playoffBracket.east : playoffBracket.west;
  const quarterfinal = userConference.quarterfinals.find((series) => matchupIncludesUser(series));
  if (!quarterfinal) return "Missed Playoffs";
  if (!didUserWinMatchup(quarterfinal)) return "First Round Exit";

  const semifinal = userConference.semifinals.find((series) => matchupIncludesUser(series));
  if (!semifinal) return "Conference Semifinals";
  if (!didUserWinMatchup(semifinal)) return "Conference Semifinals";

  const conferenceFinal = userConference.conferenceFinal;
  if (!matchupIncludesUser(conferenceFinal)) return "Conference Finals";
  if (!didUserWinMatchup(conferenceFinal)) return "Conference Finals";

  const finals = playoffBracket.finals;
  if (!matchupIncludesUser(finals)) return "NBA Finals Loss";
  return didUserWinMatchup(finals) ? "NBA Champion" : "NBA Finals Loss";
};

const generateLeagueLandscape = (
  roster: RosterSlot[],
  metrics: TeamMetrics,
  wins: number,
  seed: number,
  conference: "East" | "West",
  teamName: string,
  projectedPlayoffFinish: SimulationResult["playoffFinish"],
  rng: () => number,
) => {
  const userIdentities = new Set(getPlayers(roster).map((player) => getPlayerIdentityKey(player)));
  const pool = allPlayers.filter((player) => !userIdentities.has(getPlayerIdentityKey(player)));
  const available = [...pool];
  const eastGenerated: LeagueContenderProfile[] = [];
  const westGenerated: LeagueContenderProfile[] = [];

  for (let i = 0; i < (conference === "East" ? 7 : 8); i += 1) {
    eastGenerated.push(buildSyntheticContender(available, "East", rng));
  }

  for (let i = 0; i < (conference === "West" ? 7 : 8); i += 1) {
    westGenerated.push(buildSyntheticContender(available, "West", rng));
  }

  const userContender: LeagueContenderProfile = {
    teamName,
    seed: 0,
    conference,
    projectedWins: wins,
    power: Math.round((metrics.overall * 0.62 + metrics.chemistry * 0.2 + metrics.starPower * 0.18) * 10) / 10,
    style:
      metrics.defense >= 90
        ? "Defensive Fortress"
        : metrics.shooting >= 88
          ? "Spacing Machine"
          : metrics.playmaking >= 88
            ? "Jumbo Playmaking Core"
            : "Star-Driven Offense",
    summary:
      metrics.chemistry >= 88
        ? "Your roster paired star talent with strong balance and role coherence."
        : "Your roster leaned on premium talent, but a few structural questions stayed in play.",
    stars: getPlayers(roster)
      .slice()
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 3),
    isUserTeam: true,
  };

  const conferenceTeams =
    conference === "East"
      ? [...eastGenerated, userContender]
      : [...westGenerated, userContender];
  const oppositeConferenceTeams = conference === "East" ? westGenerated : eastGenerated;

  const sorted = conferenceTeams
    .sort((a, b) => b.projectedWins - a.projectedWins || b.power - a.power)
    .map((team, index) => ({
      ...team,
      seed: index + 1,
    }));

  const oppositeSorted = oppositeConferenceTeams
    .sort((a, b) => b.projectedWins - a.projectedWins || b.power - a.power)
    .map((team, index) => ({
      ...team,
      seed: index + 1,
    }));

  const playoffBracket = buildPlayoffBracket(
    conference === "East" ? sorted : oppositeSorted,
    conference === "West" ? sorted : oppositeSorted,
    rng,
  );
  const userEntry = sorted.find((team) => team.isUserTeam) ?? userContender;
  const nonUser = sorted.filter((team) => !team.isUserTeam);
  const actualPlayoffFinish =
    userEntry.seed <= 8
      ? getPlayoffFinishFromBracket(playoffBracket, conference)
      : projectedPlayoffFinish;
  const userConferenceBracket = conference === "East" ? playoffBracket.east : playoffBracket.west;
  const eliminationMatchup =
    actualPlayoffFinish === "First Round Exit"
      ? userConferenceBracket.quarterfinals.find((series) => matchupIncludesUser(series)) ?? null
      : actualPlayoffFinish === "Conference Semifinals"
        ? userConferenceBracket.semifinals.find((series) => matchupIncludesUser(series)) ?? null
        : actualPlayoffFinish === "Conference Finals"
          ? userConferenceBracket.conferenceFinal
          : actualPlayoffFinish === "NBA Finals Loss"
            ? playoffBracket.finals
            : null;
  const eliminatedBase = getUserOpponentFromMatchup(eliminationMatchup);
  const eliminatedBy: OpponentStory | null = eliminatedBase
    ? {
        ...eliminatedBase,
        matchupReason: buildMatchupReason(eliminatedBase, metrics, actualPlayoffFinish),
      }
    : null;

  const signatureMatchup =
    actualPlayoffFinish === "NBA Champion"
      ? playoffBracket.finals
      : actualPlayoffFinish === "NBA Finals Loss" || actualPlayoffFinish === "Conference Finals"
        ? userConferenceBracket.semifinals.find((series) => matchupIncludesUser(series)) ?? null
        : actualPlayoffFinish === "Conference Semifinals"
          ? userConferenceBracket.quarterfinals.find((series) => matchupIncludesUser(series)) ?? null
          : null;
  const signatureBase =
    getUserOpponentFromMatchup(signatureMatchup) ??
    (actualPlayoffFinish === "NBA Champion" ? nonUser[0] ?? null : null);
  const signatureWin: OpponentStory | null = signatureBase
    ? {
        ...signatureBase,
        matchupReason: buildMatchupReason(signatureBase, metrics, "NBA Champion"),
      }
    : null;

  return {
    leagueLandscape: sorted.slice(0, 6),
    leagueContext: buildLeagueContext(sorted.slice(0, 6), wins, seed, conference),
    playoffBracket,
    playoffFinish: actualPlayoffFinish,
    eliminatedBy,
    signatureWin,
  };
};

const getCategoryGrade = (value: number) => {
  if (value >= 95) return "A+";
  if (value >= 91) return "A";
  if (value >= 87) return "A-";
  if (value >= 83) return "B+";
  if (value >= 79) return "B";
  if (value >= 75) return "B-";
  if (value >= 71) return "C+";
  if (value >= 67) return "C";
  return "D";
};

const deterministicSeedFromPlayers = (players: Player[], salt = 0) =>
  players.reduce((sum, player, index) => {
    const charTotal = player.id
      .split("")
      .reduce((innerSum, char) => innerSum + char.charCodeAt(0), 0);
    return sum + charTotal * (index + 3 + salt);
  }, 97 + salt * 31);

const deterministicIndex = (players: Player[], length: number, salt = 0) => {
  if (length <= 0) return 0;
  return deterministicSeedFromPlayers(players, salt) % length;
};

const pickDeterministic = (items: string[], players: Player[], salt = 0) =>
  items[deterministicIndex(players, items.length, salt)];

export const buildTeamName = (roster: RosterSlot[]) => {
  const starters = getStarters(roster);
  const players = getPlayers(roster);
  const fallbackAnchor = starters[0]?.name.split(" ").slice(-1)[0] ?? "Legends";

  const identityScores = {
    shooting: average(starters.map((player) => player.shooting)),
    defense: average(starters.map((player) => player.defense)),
    playmaking: average(starters.map((player) => player.playmaking)),
    rebounding: average(starters.map((player) => player.rebounding)),
    athleticism: average(starters.map((player) => player.athleticism)),
    chemistry: average(starters.map((player) => player.intangibles)),
  };

  const anchors = starters
    .slice()
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 3);
  const anchorPrimary = anchors[0]?.name.split(" ").slice(-1)[0] ?? fallbackAnchor;
  const anchorSecondary = anchors[1]?.name.split(" ").slice(-1)[0] ?? anchorPrimary;

  const identity =
    identityScores.defense >= 90
      ? {
          noun: ["Fortress", "Wall", "Lock", "Citadel", "Clamp"],
          collective: ["Stoppers", "Guard", "No-Fly Zone", "Shields"],
          atmosphere: ["Iron", "Steel", "Onyx", "Granite"],
        }
      : identityScores.shooting >= 89
        ? {
            noun: ["Firestorm", "Voltage", "Rain", "Flare", "Heatwave"],
            collective: ["Snipers", "Flamethrowers", "Bombers", "Marksmen"],
            atmosphere: ["Neon", "Solar", "Crimson", "Blaze"],
          }
        : identityScores.playmaking >= 89
          ? {
              noun: ["Orchestra", "Engine", "Pulse", "Signal", "Flow"],
              collective: ["Conductors", "Architects", "Makers", "Directors"],
              atmosphere: ["Royal", "Signal", "Midnight", "Velvet"],
            }
          : identityScores.rebounding >= 88
            ? {
                noun: ["Empire", "Frontline", "Pressure", "Stronghold", "Towers"],
                collective: ["Giants", "Glass Cleaners", "Bruisers", "Bigs"],
                atmosphere: ["Titan", "Ivory", "Granite", "Summit"],
              }
            : identityScores.athleticism >= 90
              ? {
                  noun: ["Flight", "Surge", "Storm", "Rush", "Skyline"],
                  collective: ["Runners", "Gliders", "Sprinters", "Flyers"],
                  atmosphere: ["Sky", "Velocity", "Aerial", "Thunder"],
                }
              : {
                  noun: ["Dynasty", "Ascend", "Legacy", "Summit", "Crown"],
                  collective: ["Legends", "Icons", "Royalty", "Standard"],
                  atmosphere: ["Golden", "Prime", "Grand", "Crown"],
                };

  const templates = [
    () => `${anchorPrimary} ${pickDeterministic(identity.noun, players, 1)}`,
    () => `The ${pickDeterministic(identity.atmosphere, players, 2)} ${pickDeterministic(identity.collective, players, 3)}`,
    () => `${pickDeterministic(identity.atmosphere, players, 4)} ${pickDeterministic(identity.noun, players, 5)}`,
    () => `${anchorPrimary} & ${anchorSecondary}`,
    () => `${anchorPrimary}'s ${pickDeterministic(identity.collective, players, 6)}`,
  ];

  return templates[deterministicIndex(players, templates.length)]();
};

export const evaluateTeam = (roster: RosterSlot[], rareEvent?: RareEvent) => {
  const boostedPlayers = applySynergyBonuses(getPlayers(roster));
  const boostedPlayerMap = new Map(boostedPlayers.map((player) => [player.id, player]));
  const players = getPlayers(roster).map((player) => boostedPlayerMap.get(player.id) ?? player);
  const starters = getStarters(roster).map((player) => boostedPlayerMap.get(player.id) ?? player);
  const bench = getBench(roster).map((player) => boostedPlayerMap.get(player.id) ?? player);
  const weightedEntries = getWeightedRosterEntries(roster);
  const weightedBoostedEntries = weightedEntries.map((entry) => ({
    ...entry,
    player: boostedPlayerMap.get(entry.player.id) ?? entry.player,
  }));
  const starterEntries = weightedBoostedEntries.filter((entry) => entry.index < 5);
  const benchEntries = weightedBoostedEntries.filter((entry) => entry.index >= 5);
  const weightedStarters = weightedAverage(starterEntries, (entry) => entry.player.overall, (entry) => entry.weight);
  const weightedBench = weightedAverage(benchEntries, (entry) => entry.player.overall, (entry) => entry.weight);
  const starterOverall = weightedStarters || average(starters.map((player) => player.overall));
  const benchOverall = weightedBench || average(bench.map((player) => player.overall));
  const offense = weightedAverage(weightedBoostedEntries, (entry) => entry.player.offense, (entry) => entry.weight);
  const defense = weightedAverage(weightedBoostedEntries, (entry) => entry.player.defense, (entry) => entry.weight);
  const playmaking = weightedAverage(weightedBoostedEntries, (entry) => entry.player.playmaking, (entry) => entry.weight);
  const shooting = weightedAverage(weightedBoostedEntries, (entry) => entry.player.shooting, (entry) => entry.weight);
  const rebounding = weightedAverage(weightedBoostedEntries, (entry) => entry.player.rebounding, (entry) => entry.weight);
  const athleticism = weightedAverage(weightedBoostedEntries, (entry) => entry.player.athleticism, (entry) => entry.weight);
  const depth = weightedAverage(benchEntries, (entry) => entry.player.overall, (entry) => entry.weight * (1.1 - entry.index * 0.03));
  const starPower = weightedAverage(
    starterEntries.slice().sort((a, b) => b.player.overall - a.player.overall).slice(0, 3),
    (entry) => entry.player.overall,
    (entry) => entry.weight,
  ) + 1.5;
  const spacing = weightedAverage(starterEntries, (entry) => entry.player.shooting, (entry) => entry.weight) + starters.filter((player) => player.shooting >= 86).length * 1.6;
  const rimProtection = Math.max(...weightedBoostedEntries.map((entry) => entry.player.interiorDefense)) * 0.68 + weightedAverage(weightedBoostedEntries, (entry) => entry.player.interiorDefense, (entry) => entry.weight) * 0.32;
  const wingDefense = weightedAverage(
    weightedBoostedEntries.filter((entry) => ["SG", "SF", "PF"].includes(entry.player.primaryPosition)),
    (entry) => entry.player.perimeterDefense,
    (entry) => entry.weight,
  );
  const benchScoring = weightedAverage(benchEntries, (entry) => entry.player.offense, (entry) => entry.weight * (1.16 - entry.index * 0.05));
  const ballHandlers = players.filter((player) => player.playmaking >= 85 || player.primaryPosition === "PG");
  const dominantCreators = players.filter((player) => player.ballDominance >= 88);
  const eliteShooters = starters.filter((player) => player.shooting >= 88).length;
  const defensiveBigs = players.filter((player) => player.interiorDefense >= 88).length;
  const highRebounders = players.filter((player) => player.rebounding >= 85).length;
  const outOfRoleStars = benchEntries.filter((entry) => entry.player.overall >= 90).length;
  const chemistryBonuses = getChemistryBonuses(players.map((player) => player.id));
  const chemistryScore = chemistryBonuses.reduce((sum, bonus) => sum + bonus.bonusScore, 0);
  const activeDynamicDuos = getActiveDynamicDuos(players.map((player) => player.id));
  const activeBigThrees = getActiveBigThrees(players.map((player) => player.id));
  const rareEventBonus = rareEvent
    ? evaluateRareEventBonus(rareEvent, players)
    : { offense: 0, defense: 0, chemistryStructure: 0, chemistry: 0, summary: "Standard environment." };
  const chemistryCore = starters.length >= 5 ? starters : players;
  const playerTypeBalanceBonus = getPlayerTypeBalanceBonus(chemistryCore);

  let structuralChemistry = STRUCTURAL_CHEMISTRY_FLOOR;
  let chemistry = weightedAverage(weightedBoostedEntries, (entry) => entry.player.intangibles, (entry) => entry.weight);

  if (ballHandlers.length >= 2) structuralChemistry += 6;
  else if (ballHandlers.length === 0) structuralChemistry -= 12;
  if (eliteShooters >= 3) structuralChemistry += 7;
  else if (eliteShooters <= 1) structuralChemistry -= 8;
  if (defensiveBigs >= 1) structuralChemistry += 6;
  else structuralChemistry -= 10;
  if (wingDefense >= 82) structuralChemistry += 5;
  if (highRebounders >= 2) structuralChemistry += 4;
  else structuralChemistry -= 5;
  if (benchScoring >= 84) structuralChemistry += 3;
  else if (benchScoring <= 74) structuralChemistry -= 4;
  if (dominantCreators.length >= 3 && shooting < 82) structuralChemistry -= 8;
  if (players.filter((player) => ["C", "PF"].includes(player.primaryPosition)).length >= 5) structuralChemistry -= 9;
  if (players.filter((player) => player.primaryPosition === "C").length >= 4) structuralChemistry -= 10;
  if (players.filter((player) => player.primaryPosition === "PG").length === 0) structuralChemistry -= 12;
  if (outOfRoleStars >= 2) structuralChemistry -= 4;
  else if (outOfRoleStars === 1) structuralChemistry -= 2;
  structuralChemistry += playerTypeBalanceBonus;

  chemistry += eliteShooters * 0.9;
  chemistry += ballHandlers.length * 0.75;
  chemistry -= dominantCreators.length > 3 ? 3 : 0;
  chemistry += playerTypeBalanceBonus * 0.55;
  chemistry += activeDynamicDuos.length * 1.4 + activeBigThrees.length * 2.2;
  chemistry += chemistryScore * 0.7 + rareEventBonus.chemistry;
  structuralChemistry += chemistryScore * 0.55 + activeBigThrees.length * 1.25 + rareEventBonus.chemistryStructure;

  const variance = clamp(
    11 +
      weightedAverage(weightedEntries, (entry) => 96 - entry.player.durability, (entry) => entry.weight) * 0.18 +
      activeDynamicDuos.length * -0.35 +
      activeBigThrees.length * -0.55 +
      dominantCreators.length * 0.5 -
      weightedAverage(weightedBoostedEntries, (entry) => entry.player.intangibles, (entry) => entry.weight) * 0.08,
    5,
    20,
  );
  const chemistryComposite = clamp(chemistry * 0.62 + structuralChemistry * 0.38, 55, 99);
  const overall = clamp(
    starterOverall * 0.74 + benchOverall * 0.09 + chemistryComposite * 0.17,
    65,
    99,
  );

  return {
    overall: Math.round(overall * 10) / 10,
    offense: Math.round(clamp(offense + chemistryScore * 0.3 + rareEventBonus.offense, 35, 99) * 10) / 10,
    defense: Math.round(clamp(defense + chemistryScore * 0.18 + rareEventBonus.defense, 35, 99) * 10) / 10,
    playmaking: Math.round(playmaking * 10) / 10,
    shooting: Math.round(shooting * 10) / 10,
    rebounding: Math.round(rebounding * 10) / 10,
    athleticism: Math.round(athleticism * 10) / 10,
    depth: Math.round(depth * 10) / 10,
    starPower: Math.round(starPower * 10) / 10,
    chemistry: Math.round(chemistryComposite * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    spacing: Math.round(clamp(spacing, 50, 99) * 10) / 10,
    rimProtection: Math.round(clamp(rimProtection, 35, 99) * 10) / 10,
    wingDefense: Math.round(clamp(wingDefense || 45, 35, 99) * 10) / 10,
    benchScoring: Math.round(clamp(benchScoring || 50, 35, 99) * 10) / 10,
  };
};

const getStrengthsAndWeaknesses = (roster: RosterSlot[], metrics: TeamMetrics, playoffFinish: SimulationResult["playoffFinish"]) => {
  const players = getPlayers(roster);
  const starters = getStarters(roster);
  const mvp = players.slice().sort((a, b) => b.overall + b.intangibles - (a.overall + a.intangibles))[0];
  const xFactor =
    players
      .slice()
      .sort((a, b) => b.intangibles + b.defense + b.shooting - (a.intangibles + a.defense + a.shooting))
      .find((player) => player.id !== mvp?.id) ??
    players
      .slice()
      .sort((a, b) => b.offense + b.defense + b.playmaking - (a.offense + a.defense + a.playmaking))
      .find((player) => player.id !== mvp?.id) ??
    mvp;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (metrics.offense >= 90) strengths.push("High-end offensive creation gives the team a top-tier scoring ceiling.");
  if (metrics.defense >= 89) strengths.push("The defense has enough length and discipline to survive deep into May.");
  if (metrics.shooting >= 87) strengths.push("Spacing travels, and this roster has enough shooting to keep stars comfortable.");
  if (metrics.depth >= 84) strengths.push("Bench quality prevents major drop-off when the stars sit.");
  if (metrics.chemistry >= 88) strengths.push("Lineup balance, player-type coverage, and badge synergy gave the roster a real structural advantage.");
  if (metrics.rimProtection >= 88) strengths.push("Interior defense gives the roster a strong safety net at the rim.");
  if (metrics.wingDefense >= 85) strengths.push("Wing defense versatility lets the team handle most playoff matchups.");

  if (metrics.playmaking < 78) weaknesses.push("The roster can stall when it needs a primary organizer in the half court.");
  if (metrics.shooting < 80) weaknesses.push("Shooting is inconsistent enough to shrink the floor against elite playoff defenses.");
  if (metrics.rimProtection < 74) weaknesses.push("Lack of interior deterrence leaves the back line vulnerable.");
  if (metrics.depth < 79) weaknesses.push("Bench drop-off creates risk over the course of a long season.");
  if (metrics.chemistry < 78) weaknesses.push("The talent is real, but positional overlap, repetitive player types, and weak synergy drag the team down.");
  if (metrics.variance > 14) weaknesses.push("Durability and role volatility make the season feel less stable than contenders prefer.");

  const reason = playoffFinish === "NBA Champion"
    ? "The title run came from top-end star power paired with enough structural balance to survive every series."
    : metrics.chemistry < 80
      ? "The roster never fully clicked structurally, so the talent ceiling was harder to reach."
      : metrics.depth < 80
        ? "The team leaned heavily on its stars, and the lack of support showed late."
        : metrics.shooting < 82
          ? "The offense ran into spacing issues once the postseason tightened."
          : "The team was good enough to contend, but playoff variance closed the gap.";

  while (strengths.length < 3) {
    strengths.push(starters.some((player) => player.playmaking >= 90)
      ? "A reliable lead creator gives the team a steady offensive baseline."
      : "Top-end talent ensures the roster is dangerous on any given night.");
  }

  while (weaknesses.length < 2) {
    weaknesses.push(metrics.variance > 12
      ? "There is some volatility built into the roster's profile."
      : "The team is strong overall, but there is limited room for error against elite opponents.");
  }

  return { strengths: strengths.slice(0, 3), weaknesses: weaknesses.slice(0, 2), reason, mvp, xFactor };
};

const seedFromWins = (wins: number) => {
  if (wins >= 61) return 1;
  if (wins >= 57) return 2;
  if (wins >= 53) return 3;
  if (wins >= 49) return 4;
  if (wins >= 46) return 5;
  if (wins >= 43) return 6;
  if (wins >= 40) return 7;
  if (wins >= 37) return 8;
  if (wins >= 34) return 9;
  return 10;
};

const simulatePlayoffs = (power: number, seed: number, variance: number, rng: () => number): SimulationResult["playoffFinish"] => {
  if (seed >= 9) return rng() > 0.55 && power > 82 ? "Lost in Play-In" : "Missed Playoffs";
  if (seed >= 7) {
    if (power + rng() * 8 < 83) return "Lost in Play-In";
    return rng() > 0.72 ? "Conference Semifinals" : "First Round Exit";
  }

  let seriesPower = power + (rng() - 0.5) * variance;
  if (seriesPower < 82) return "First Round Exit";
  seriesPower += rng() * 5 - 2;
  if (seriesPower < 86) return "Conference Semifinals";
  seriesPower += rng() * 5 - 2.5;
  if (seriesPower < 90) return "Conference Finals";
  seriesPower += rng() * 6 - 3;
  return seriesPower >= 92 ? "NBA Champion" : "NBA Finals Loss";
};

export const runSeasonSimulation = (
  roster: RosterSlot[],
  seed: number,
  challenge: DraftChallenge,
  rareEvent: RareEvent,
  categoryChallenge: CategoryChallenge | null,
): SimulationResult => {
  const metrics = evaluateTeam(roster, rareEvent);
  const rng = mulberry32(seed + 41023);
  const rosterPlayers = getPlayers(roster);
  const chemistryBonuses = getChemistryBonuses(rosterPlayers.map((player) => player.id));
  const chemistryScore = chemistryBonuses.reduce((sum, bonus) => sum + bonus.bonusScore, 0);
  const rareEventBonus = evaluateRareEventBonus(rareEvent, rosterPlayers);

  if (categoryChallenge) {
    const focusScore = Math.round(metrics[categoryChallenge.metric] * 10) / 10;
    const { strengths, weaknesses, mvp, xFactor } = getStrengthsAndWeaknesses(
      roster,
      metrics,
      "Missed Playoffs",
    );
    const focusSummary =
      focusScore >= 94
        ? `This run was all about maximizing ${categoryChallenge.metricLabel.toLowerCase()}, and your roster delivered an elite ${focusScore} ${categoryChallenge.metricLabel.toLowerCase()} score.`
        : focusScore >= 88
          ? `Your roster posted a strong ${focusScore} in ${categoryChallenge.metricLabel.toLowerCase()}, putting together a credible specialist build in that category.`
          : focusScore >= 82
            ? `The build reached a respectable ${focusScore} in ${categoryChallenge.metricLabel.toLowerCase()}, though there was still room to push the specialization further.`
            : `This run only reached ${focusScore} in ${categoryChallenge.metricLabel.toLowerCase()}, so the roster never fully committed to the category focus objective.`;

    const focusReason =
      categoryChallenge.metric === "offense"
        ? "Shot creation, spacing, and star-level scoring gravity were the biggest drivers of the final offense score."
        : categoryChallenge.metric === "defense"
          ? "Perimeter resistance, rim protection, and lineup versatility were the biggest swing factors in the final defense score."
          : categoryChallenge.metric === "playmaking"
            ? "Primary initiators and connective passers did the most to lift the playmaking profile."
            : categoryChallenge.metric === "shooting"
              ? "Floor spacing and the sheer number of credible shooting threats decided the final shooting grade."
              : categoryChallenge.metric === "rebounding"
                ? "Size, physicality, and frontcourt depth dictated the final rebounding result."
                : categoryChallenge.metric === "chemistry"
                  ? "Badge synergies, player-type coverage, positional coherence, and role balance did the most to raise the chemistry score."
                  : "Primary initiators and connective passers did the most to lift the passing score.";

    const focusLegacyScore = Math.round(
      metrics[categoryChallenge.metric] * 8 +
        metrics.chemistry * 1.1 +
        chemistryScore * 2 +
        metrics.overall * 0.6,
    );

    return {
      mode: "category-focus",
      categoryChallenge,
      focusScore,
      metrics,
      record: { wins: 0, losses: 0 },
      seed: 0,
      conference: "East",
      playoffFinish: "Missed Playoffs",
      titleOdds: 0,
      summary: focusSummary,
      reason: focusReason,
      mvp,
      xFactor,
      strengths,
      weaknesses,
      ratingLabel: labelForMetric(metrics.overall),
      offenseLabel: labelForMetric(metrics.offense),
      defenseLabel: labelForMetric(metrics.defense),
      draftGrade: getCategoryGrade(focusScore),
      teamName: buildTeamName(roster),
      legacyScore: focusLegacyScore,
      challenge,
      challengeCompleted: false,
      challengeReward: 0,
      rareEvent,
      rareEventBonus,
      chemistryBonuses,
      chemistryScore,
      leagueContext: "",
      leagueLandscape: [],
      playoffBracket: null,
      eliminatedBy: null,
      signatureWin: null,
    };
  }

  const powerScore = computePowerScore(metrics);
  const { wins, percentile } = calibratedWinsFromPower(powerScore, metrics.variance, rng);
  const losses = 82 - wins;
  const seedResult = seedFromWins(wins);
  const conference = rng() > 0.5 ? "East" : "West";
  const projectedPlayoffFinish = simulatePlayoffs(powerScore, seedResult, metrics.variance, rng);
  const teamName = buildTeamName(roster);
  const { leagueLandscape, leagueContext, playoffBracket, playoffFinish, eliminatedBy, signatureWin } = generateLeagueLandscape(
    roster,
    metrics,
    wins,
    seedResult,
    conference,
    teamName,
    projectedPlayoffFinish,
    rng,
  );
  const { strengths, weaknesses, reason, mvp, xFactor } = getStrengthsAndWeaknesses(roster, metrics, playoffFinish);
  const titleOdds = calibratedTitleOddsFromPercentile(percentile);
  const draftGrade = getDraftGrade(metrics.overall, metrics.chemistry, metrics.depth);
  const baseResult = {
    mode: "season" as const,
    categoryChallenge: null,
    focusScore: null,
    metrics,
    record: { wins, losses },
    seed: seedResult,
    conference,
    playoffFinish,
    titleOdds,
    summary: "",
    reason,
    mvp,
    xFactor,
    strengths,
    weaknesses,
    ratingLabel: labelForMetric(metrics.overall),
    offenseLabel: labelForMetric(metrics.offense),
    defenseLabel: labelForMetric(metrics.defense),
    draftGrade,
    teamName,
    legacyScore: 0,
    challenge,
    challengeCompleted: false,
    challengeReward: 0,
    rareEvent,
    rareEventBonus,
    chemistryBonuses,
    chemistryScore,
    leagueContext,
    leagueLandscape,
    playoffBracket,
    eliminatedBy,
    signatureWin,
  } satisfies SimulationResult;
  const challengeCompleted = evaluateChallengeCompletion(
    challenge,
    rosterPlayers.map((player) => player.id),
    rosterPlayers.map((player) => getPlayerTier(player)),
    baseResult,
  );
  const challengeReward = challengeCompleted ? challenge.reward : 0;
  const legacyScore = calculateLegacyScore(
    { ...baseResult, challengeCompleted, challengeReward },
    challengeReward,
    chemistryScore,
  );
  const summary = (() => {
    const opening = wins >= 58
      ? `Your ${teamName} controlled the regular season, finishing ${wins}-${losses} with a profile that looked like a genuine title favorite.`
      : wins >= 50
        ? `Your ${teamName} put together a strong ${wins}-${losses} season and spent most of the year in the contender tier.`
        : wins >= 43
          ? `Your ${teamName} landed in the playoff mix at ${wins}-${losses}, but the margin for error never felt especially large.`
          : `Your ${teamName} battled through a volatile ${wins}-${losses} season and never fully solved its roster questions.`;

    const middle = metrics.chemistry >= 88
      ? "The chemistry stood out, with strong positional balance, player-type coverage, and badge synergy amplifying the star talent."
      : metrics.shooting < 80
        ? "Top-end talent carried long stretches, but cramped spacing made the half-court offense less reliable against elite opponents."
        : metrics.depth < 79
          ? "The starting group did heavy lifting, while the bench created enough instability to cap the team's ceiling."
          : "The roster had real strengths, though a few matchup weaknesses kept showing up against higher-end competition.";

    const ending = playoffFinish === "NBA Champion"
      ? "Once the playoffs tightened, the stars delivered and the roster structure held all the way to a championship."
      : playoffFinish === "NBA Finals Loss"
        ? "The run reached the Finals, but the last series exposed just enough weakness to keep the title out of reach."
        : playoffFinish === "Conference Finals"
          ? "The conference finals run felt legitimate, even if one final gear was missing."
          : playoffFinish === "Conference Semifinals"
            ? "A second-round exit felt fair for a team that was dangerous but not quite complete."
            : playoffFinish === "First Round Exit"
              ? "The postseason ended quickly, with the roster's flaws becoming harder to hide in a seven-game setting."
              : playoffFinish === "Lost in Play-In"
                ? "The group showed flashes, but it never generated enough consistency to move beyond the play-in stage."
                : "There were enough bright spots to justify another run, but this version never seriously threatened the field.";

    return `${opening} ${middle} ${ending}`;
  })();

  return {
    mode: "season",
    categoryChallenge: null,
    focusScore: null,
    metrics,
    record: { wins, losses },
    seed: seedResult,
    conference,
    playoffFinish,
    titleOdds,
    summary,
    reason,
    mvp,
    xFactor,
    strengths,
    weaknesses,
    ratingLabel: labelForMetric(metrics.overall),
    offenseLabel: labelForMetric(metrics.offense),
    defenseLabel: labelForMetric(metrics.defense),
    draftGrade,
    teamName,
    legacyScore,
    challenge,
    challengeCompleted,
    challengeReward,
    rareEvent,
    rareEventBonus,
    chemistryBonuses,
    chemistryScore,
    leagueContext,
    leagueLandscape,
    playoffBracket,
    eliminatedBy,
    signatureWin,
  };
};
