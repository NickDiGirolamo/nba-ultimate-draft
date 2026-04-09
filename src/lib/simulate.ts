import {
  CategoryChallenge,
  DraftChallenge,
  Player,
  RareEvent,
  RosterSlot,
  SimulationResult,
  TeamMetrics,
} from "../types";
import {
  calculateLegacyScore,
  evaluateChallengeCompletion,
  evaluateRareEventBonus,
  getChemistryBonuses,
} from "./meta";
import { applySynergyBonuses, getActiveBigThrees, getActiveDynamicDuos } from "./dynamicDuos";
import { clamp, mulberry32 } from "./random";

const average = (values: number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);
const SLOT_IMPACT_WEIGHTS = [1.36, 1.28, 1.22, 1.18, 1.24, 0.62, 0.62, 0.62, 0.34, 0.24];

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

const labelForMetric = (value: number) => {
  if (value >= 94) return "Historic";
  if (value >= 89) return "Elite";
  if (value >= 83) return "Contender-Level";
  if (value >= 76) return "Strong";
  if (value >= 69) return "Volatile";
  return "Limited";
};

const getDraftGrade = (overall: number, fit: number, depth: number) => {
  const score = overall * 0.5 + fit * 0.3 + depth * 0.2;
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

export const buildTeamName = (roster: RosterSlot[]) => {
  const starters = getStarters(roster);
  const anchor = starters[0]?.name.split(" ").slice(-1)[0] ?? "Legends";
  const style = starters.some((player) => player.shooting >= 92)
    ? "Snipers"
    : starters.some((player) => player.defense >= 94)
      ? "Stops"
      : starters.some((player) => player.athleticism >= 94)
        ? "Flight"
        : "Dynasty";

  return `${anchor} ${style}`;
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
    : { offense: 0, defense: 0, fit: 0, chemistry: 0, summary: "Standard environment." };

  let fit = 72;
  let chemistry = weightedAverage(weightedBoostedEntries, (entry) => entry.player.intangibles, (entry) => entry.weight);

  if (ballHandlers.length >= 2) fit += 6;
  else if (ballHandlers.length === 0) fit -= 12;
  if (eliteShooters >= 3) fit += 7;
  else if (eliteShooters <= 1) fit -= 8;
  if (defensiveBigs >= 1) fit += 6;
  else fit -= 10;
  if (wingDefense >= 82) fit += 5;
  if (highRebounders >= 2) fit += 4;
  else fit -= 5;
  if (benchScoring >= 84) fit += 3;
  else if (benchScoring <= 74) fit -= 4;
  if (dominantCreators.length >= 3 && shooting < 82) fit -= 8;
  if (players.filter((player) => ["C", "PF"].includes(player.primaryPosition)).length >= 5) fit -= 9;
  if (players.filter((player) => player.primaryPosition === "C").length >= 4) fit -= 10;
  if (players.filter((player) => player.primaryPosition === "PG").length === 0) fit -= 12;
  if (outOfRoleStars >= 2) fit -= 4;
  else if (outOfRoleStars === 1) fit -= 2;

  chemistry += eliteShooters * 0.9;
  chemistry += ballHandlers.length * 0.75;
  chemistry -= dominantCreators.length > 3 ? 3 : 0;
  chemistry += activeDynamicDuos.length * 1.4 + activeBigThrees.length * 2.2;
  chemistry += chemistryScore * 0.7 + rareEventBonus.chemistry;
  fit += chemistryScore * 0.55 + activeBigThrees.length * 1.25 + rareEventBonus.fit;

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
  const overall = clamp(starterOverall * 0.74 + benchOverall * 0.09 + fit * 0.1 + chemistry * 0.07, 65, 99);

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
    fit: Math.round(clamp(fit, 48, 98) * 10) / 10,
    chemistry: Math.round(clamp(chemistry, 55, 99) * 10) / 10,
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
  const xFactor = players.slice().sort((a, b) => b.intangibles + b.defense + b.shooting - (a.intangibles + a.defense + a.shooting))[1] ?? mvp;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (metrics.offense >= 90) strengths.push("High-end offensive creation gives the team a top-tier scoring ceiling.");
  if (metrics.defense >= 89) strengths.push("The defense has enough length and discipline to survive deep into May.");
  if (metrics.shooting >= 87) strengths.push("Spacing travels, and this roster has enough shooting to keep stars comfortable.");
  if (metrics.depth >= 84) strengths.push("Bench quality prevents major drop-off when the stars sit.");
  if (metrics.fit >= 88) strengths.push("Lineup balance is a real advantage, with roles that complement each other cleanly.");
  if (metrics.rimProtection >= 88) strengths.push("Interior defense gives the roster a strong safety net at the rim.");
  if (metrics.wingDefense >= 85) strengths.push("Wing defense versatility lets the team handle most playoff matchups.");

  if (metrics.playmaking < 78) weaknesses.push("The roster can stall when it needs a primary organizer in the half court.");
  if (metrics.shooting < 80) weaknesses.push("Shooting is inconsistent enough to shrink the floor against elite playoff defenses.");
  if (metrics.rimProtection < 74) weaknesses.push("Lack of interior deterrence leaves the back line vulnerable.");
  if (metrics.depth < 79) weaknesses.push("Bench drop-off creates risk over the course of a long season.");
  if (metrics.fit < 78) weaknesses.push("The talent is real, but positional overlap hurts lineup efficiency.");
  if (metrics.variance > 14) weaknesses.push("Durability and role volatility make the season feel less stable than contenders prefer.");

  const reason = playoffFinish === "NBA Champion"
    ? "The title run came from top-end star power paired with enough structural balance to survive every series."
    : metrics.fit < 80
      ? "The roster's structural flaws eventually outweighed the talent."
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
                  ? "Synergy bonuses, lineup fit, and role balance did the most to raise the chemistry score."
                  : "Complementary skill overlap and lineup coherence were the biggest levers behind the final fit grade.";

    const focusLegacyScore = Math.round(
      metrics[categoryChallenge.metric] * 8 +
        metrics.fit * 1.1 +
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
    };
  }

  const powerScore = metrics.overall * 0.29 + metrics.offense * 0.18 + metrics.defense * 0.18 + metrics.fit * 0.13 + metrics.depth * 0.08 + metrics.starPower * 0.09 + metrics.chemistry * 0.05;
  const varianceSwing = (rng() - 0.5) * metrics.variance * 1.6;
  const wins = clamp(Math.round(16 + (powerScore - 70) * 1.38 + varianceSwing), 18, 74);
  const losses = 82 - wins;
  const seedResult = seedFromWins(wins);
  const conference = rng() > 0.5 ? "East" : "West";
  const playoffFinish = simulatePlayoffs(powerScore, seedResult, metrics.variance, rng);
  const { strengths, weaknesses, reason, mvp, xFactor } = getStrengthsAndWeaknesses(roster, metrics, playoffFinish);
  const titleOdds = clamp(Math.round((powerScore - 72) * 3.5), 1, 78);
  const teamName = buildTeamName(roster);
  const draftGrade = getDraftGrade(metrics.overall, metrics.fit, metrics.depth);
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
  } satisfies SimulationResult;
  const challengeCompleted = evaluateChallengeCompletion(
    challenge,
    rosterPlayers.map((player) => player.id),
    rosterPlayers.map((player) => player.hallOfFameTier),
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

    const middle = metrics.fit >= 88
      ? "The lineup balance stood out, with stars amplified by useful spacing, playmaking support, and enough defensive coverage."
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
  };
};
