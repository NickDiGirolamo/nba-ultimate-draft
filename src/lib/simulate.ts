import { Player, RosterSlot, SimulationResult, TeamMetrics } from "../types";
import { clamp, mulberry32 } from "./random";

const average = (values: number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);
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

export const evaluateTeam = (roster: RosterSlot[]): TeamMetrics => {
  const players = getPlayers(roster);
  const starters = getStarters(roster);
  const bench = getBench(roster);

  const starterOverall = average(starters.map((player) => player.overall));
  const benchOverall = average(bench.map((player) => player.overall));
  const offense = average(starters.map((player) => player.offense)) * 0.76 + average(bench.map((player) => player.offense)) * 0.24;
  const defense = average(starters.map((player) => player.defense)) * 0.78 + average(bench.map((player) => player.defense)) * 0.22;
  const playmaking = average(starters.map((player) => player.playmaking)) * 0.72 + average(bench.map((player) => player.playmaking)) * 0.28;
  const shooting = average(starters.map((player) => player.shooting)) * 0.75 + average(bench.map((player) => player.shooting)) * 0.25;
  const rebounding = average(players.map((player) => player.rebounding));
  const athleticism = average(players.map((player) => player.athleticism));
  const depth = benchOverall;
  const starPower = average(players.slice().sort((a, b) => b.overall - a.overall).slice(0, 3).map((player) => player.overall)) + 1.5;
  const spacing = average(starters.map((player) => player.shooting)) + starters.filter((player) => player.shooting >= 86).length * 1.6;
  const rimProtection = Math.max(...players.map((player) => player.interiorDefense)) * 0.65 + average(players.map((player) => player.interiorDefense)) * 0.35;
  const wingDefense = average(players.filter((player) => ["SG", "SF", "PF"].includes(player.primaryPosition)).map((player) => player.perimeterDefense));
  const benchScoring = average(bench.map((player) => player.offense));
  const ballHandlers = players.filter((player) => player.playmaking >= 85 || player.primaryPosition === "PG");
  const dominantCreators = players.filter((player) => player.ballDominance >= 88);
  const eliteShooters = starters.filter((player) => player.shooting >= 88).length;
  const defensiveBigs = players.filter((player) => player.interiorDefense >= 88).length;
  const highRebounders = players.filter((player) => player.rebounding >= 85).length;

  let fit = 72;
  let chemistry = average(players.map((player) => player.intangibles));

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

  chemistry += eliteShooters * 0.9;
  chemistry += ballHandlers.length * 0.75;
  chemistry -= dominantCreators.length > 3 ? 3 : 0;

  const variance = clamp(12 + average(players.map((player) => 96 - player.durability)) * 0.18 + dominantCreators.length * 0.5 - average(players.map((player) => player.intangibles)) * 0.08, 5, 20);
  const overall = clamp(starterOverall * 0.67 + benchOverall * 0.16 + fit * 0.09 + chemistry * 0.08, 65, 99);

  return {
    overall: Math.round(overall * 10) / 10,
    offense: Math.round(offense * 10) / 10,
    defense: Math.round(defense * 10) / 10,
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

export const runSeasonSimulation = (roster: RosterSlot[], seed: number): SimulationResult => {
  const metrics = evaluateTeam(roster);
  const rng = mulberry32(seed + 41023);
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
  };
};
