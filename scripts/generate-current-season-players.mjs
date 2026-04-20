import fs from "node:fs";

const PER_GAME_PATH = "temp-br-per-game.html";
const ADVANCED_PATH = "temp-br-advanced.html";
const OUTPUT_PATH = "src/data/players-current-2026.ts";

const TEAM_NAMES = {
  ATL: "Hawks",
  BOS: "Celtics",
  BRK: "Nets",
  BKN: "Nets",
  CHA: "Hornets",
  CHO: "Hornets",
  CHI: "Bulls",
  CLE: "Cavaliers",
  DAL: "Mavericks",
  DEN: "Nuggets",
  DET: "Pistons",
  GSW: "Warriors",
  HOU: "Rockets",
  IND: "Pacers",
  LAC: "Clippers",
  LAL: "Lakers",
  MEM: "Grizzlies",
  MIA: "Heat",
  MIL: "Bucks",
  MIN: "Timberwolves",
  NOP: "Pelicans",
  NOH: "Hornets",
  NYK: "Knicks",
  OKC: "Thunder",
  ORL: "Magic",
  PHI: "76ers",
  PHO: "Suns",
  POR: "Trail Blazers",
  SAC: "Kings",
  SAS: "Spurs",
  TOR: "Raptors",
  UTA: "Jazz",
  WAS: "Wizards",
};

const OVERALL_OVERRIDES = {
  "Shai Gilgeous-Alexander": 95,
  "Nikola Jokic": 95,
  "Victor Wembanyama": 94,
  "Giannis Antetokounmpo": 94,
  "Luka Doncic": 94,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundInt = (value) => Math.round(value);

const escapeString = (value) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "-")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");

const stripTags = (html) =>
  decodeEntities(html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());

const repairEncoding = (value) => {
  let current = value;
  for (let i = 0; i < 2; i += 1) {
    if (!/[ÃÅÂÐÑ]/.test(current)) break;
    try {
      const repaired = Buffer.from(current, "latin1").toString("utf8");
      if (repaired === current) break;
      current = repaired;
    } catch {
      break;
    }
  }
  return current;
};

const normalizeName = (value) =>
  repairEncoding(value)
    .normalize("NFKC")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/č/g, "c")
    .replace(/Č/g, "C")
    .replace(/ć/g, "c")
    .replace(/Ć/g, "C")
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N");

const getTableSegment = (html, tableId) => {
  const tableStart = html.indexOf(`id="${tableId}"`);
  if (tableStart === -1) {
    throw new Error(`Could not find table ${tableId}`);
  }

  const openStart = html.lastIndexOf("<table", tableStart);
  const closeIndex = html.indexOf("</table>", tableStart);
  if (openStart === -1 || closeIndex === -1) {
    throw new Error(`Could not isolate table ${tableId}`);
  }

  return html.slice(openStart, closeIndex + "</table>".length);
};

const parseRows = (html, tableId) => {
  const tableHtml = getTableSegment(html, tableId);
  const tbodyMatch = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) {
    throw new Error(`Could not find tbody for ${tableId}`);
  }

  const rows = [];
  const rowPattern = /<tr([^>]*)>([\s\S]*?)<\/tr>/g;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(tbodyMatch[1])) !== null) {
    const attrs = rowMatch[1] ?? "";
    const rowHtml = rowMatch[2] ?? "";
    if (attrs.includes('class="thead"')) continue;

    const cells = {};
    const cellPattern = /<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/g;
    let cellMatch;

    while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
      const cellAttrs = cellMatch[2] ?? "";
      const statMatch = cellAttrs.match(/data-stat="([^"]+)"/);
      if (!statMatch) continue;

      const stat = statMatch[1];
      cells[stat] = stripTags(cellMatch[3] ?? "");

      const appendMatch = cellAttrs.match(/data-append-csv="([^"]+)"/);
      if (appendMatch) {
        cells.player_code = appendMatch[1];
      }
    }

    if (!cells.player_code || !cells.name_display) continue;

    rows.push({
      classes: attrs,
      cells,
    });
  }

  return rows;
};

const finalizeSeasonRows = (rows) => {
  const aggregateRows = new Map();
  const directRows = new Map();
  const partialRows = new Map();

  for (const row of rows) {
    const code = row.cells.player_code;
    const teamAbbr = String(row.cells.team_name_abbr ?? "").trim();

    if (/^\dTM$/.test(teamAbbr)) {
      aggregateRows.set(code, { ...row.cells, team_name_abbr: teamAbbr });
      continue;
    }

    if (row.classes.includes("partial_table")) {
      const list = partialRows.get(code) ?? [];
      list.push({ ...row.cells, team_name_abbr: teamAbbr });
      partialRows.set(code, list);
      continue;
    }

    directRows.set(code, { ...row.cells, team_name_abbr: teamAbbr });
  }

  const finalRows = new Map(directRows);

  for (const [code, row] of aggregateRows.entries()) {
    const partials = partialRows.get(code) ?? [];
    const currentTeam =
      partials.length > 0
        ? partials[partials.length - 1].team_name_abbr
        : row.team_name_abbr;

    finalRows.set(code, {
      ...row,
      team_name_abbr: currentTeam,
    });
  }

  return finalRows;
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPositionSet = (value) =>
  String(value)
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

const percentileRank = (values, value) => {
  if (values.length <= 1) return 0.5;
  let low = 0;
  let high = values.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return clamp((low - 1) / (values.length - 1), 0, 1);
};

const buildPercentileGetter = (items, accessor) => {
  const sorted = [...items]
    .map((item) => accessor(item))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  return (itemOrValue) => {
    const value =
      typeof itemOrValue === "number"
        ? itemOrValue
        : accessor(itemOrValue);
    return percentileRank(sorted, value);
  };
};

const rate = (rawValue, min, max) =>
  roundInt(clamp(min + rawValue * (max - min), min, max));

const getTier = (overall) => {
  if (overall >= 94) return "S";
  if (overall >= 88) return "A";
  if (overall >= 80) return "B";
  return "C";
};

const getPrimaryPosition = (positions, raw) => {
  if (positions.length > 0) return positions[0];
  if (raw.blkPctP >= 0.72 || raw.trbPctP >= 0.72) return "C";
  if (raw.astPctP >= 0.76) return "PG";
  return "SF";
};

const buildArchetype = (player) => {
  const { primaryPosition, offense, defense, playmaking, shooting, rebounding, athleticism } = player;

  if (primaryPosition === "PG" && playmaking >= 90 && offense >= 88) return "2025-26 Offensive Engine";
  if (primaryPosition === "PG" && shooting >= 88) return "2025-26 Shotmaking Guard";
  if (primaryPosition === "SG" && shooting >= 90) return "2025-26 Perimeter Sniper";
  if (primaryPosition === "SF" && defense >= 86 && offense >= 84) return "2025-26 Two-Way Wing";
  if (primaryPosition === "PF" && rebounding >= 86 && defense >= 84) return "2025-26 Frontcourt Enforcer";
  if (primaryPosition === "C" && defense >= 88 && rebounding >= 88) return "2025-26 Interior Anchor";
  if (playmaking >= 88) return "2025-26 Connector Creator";
  if (shooting >= 88) return "2025-26 Floor Spacer";
  if (athleticism >= 88) return "2025-26 Transition Threat";
  return "2025-26 Rotation Piece";
};

const buildDescription = (player) => {
  const name = player.name.replace(/\s\(2025-26\)$/, "");
  if (player.primaryPosition === "PG") {
    return `${name}'s 2025-26 regular season card captures how ${player.teamLabel}'s lead guard created offense, managed possessions, and bent defenses every night.`;
  }
  if (player.primaryPosition === "C") {
    return `${name}'s 2025-26 regular season card reflects how ${player.teamLabel}'s center impacted the paint, the glass, and the interior structure of a game.`;
  }
  if (player.shooting >= 89) {
    return `${name}'s 2025-26 regular season card leans into the spacing, shotmaking, and scoring pressure that defined the year for ${player.teamLabel}.`;
  }
  if (player.defense >= 87) {
    return `${name}'s 2025-26 regular season card highlights the defensive activity, versatility, and possession-winning impact shown for ${player.teamLabel}.`;
  }
  return `${name}'s 2025-26 regular season card is built from full-season production, efficiency, and impact for ${player.teamLabel}.`;
};

const buildBadges = (player, raw) => {
  const badges = [];

  if (player.shooting >= 91) badges.push("Elite Shooter");
  if (player.playmaking >= 90) badges.push("Floor General");
  if (player.rebounding >= 91) badges.push("Glass Cleaner");
  if (player.primaryPosition === "C" && player.defense >= 89) badges.push("Rim Protector");
  if (player.primaryPosition !== "C" && player.defense >= 88) badges.push(player.primaryPosition === "PF" ? "Switchable Big" : "Wing Stopper");
  if (player.offense >= 91) badges.push("Three-Level Scorer");
  if (player.ballDominance >= 90 && player.playmaking >= 84) badges.push("Shot Creator");
  if (player.athleticism >= 89) badges.push(player.primaryPosition === "C" ? "Vertical Threat" : "Transition Force");
  if (raw.stlPctP >= 0.78 && player.defense >= 85) badges.push("Point-of-Attack");
  if (raw.ftaPerGameP >= 0.76 && player.offense >= 86) badges.push("Paint Pressure");

  return [...new Set(badges)].slice(0, 3);
};

const formatSeed = (seed) => {
  const secondary = seed.secondaryPositions.length
    ? `[${seed.secondaryPositions.map((position) => `"${position}"`).join(", ")}]`
    : "[]";
  const badges = seed.badges.length
    ? `[${seed.badges.map((badge) => `"${escapeString(badge)}"`).join(", ")}]`
    : "[]";

  return `  makePlayer({ name: "${escapeString(seed.name)}", era: "${seed.era}", teamLabel: "${escapeString(seed.teamLabel)}", primaryPosition: "${seed.primaryPosition}", secondaryPositions: ${secondary}, overall: ${seed.overall}, offense: ${seed.offense}, defense: ${seed.defense}, playmaking: ${seed.playmaking}, shooting: ${seed.shooting}, rebounding: ${seed.rebounding}, athleticism: ${seed.athleticism}, intangibles: ${seed.intangibles}, durability: ${seed.durability}, archetype: "${escapeString(seed.archetype)}", hallOfFameTier: "${seed.hallOfFameTier}", shortDescription: "${escapeString(seed.shortDescription)}", badges: ${badges}, ballDominance: ${seed.ballDominance}, interiorDefense: ${seed.interiorDefense}, perimeterDefense: ${seed.perimeterDefense} }),`;
};

const buildPlayerSeeds = () => {
  const perGameHtml = fs.readFileSync(PER_GAME_PATH, "utf8");
  const advancedHtml = fs.readFileSync(ADVANCED_PATH, "utf8");

  const perGameRows = finalizeSeasonRows(parseRows(perGameHtml, "per_game_stats"));
  const advancedRows = finalizeSeasonRows(parseRows(advancedHtml, "advanced"));

  const joined = [];
  for (const [code, per] of perGameRows.entries()) {
    const advanced = advancedRows.get(code);
    if (!advanced) continue;

    const teamAbbr = String(per.team_name_abbr ?? "").trim();
    const teamLabel = TEAM_NAMES[teamAbbr] ?? teamAbbr;

    joined.push({
      code,
      name: normalizeName(per.name_display),
      teamLabel,
      positions: getPositionSet(per.pos),
      games: toNumber(per.games),
      starts: toNumber(per.games_started),
      minutesPerGame: toNumber(per.mp_per_g),
      totalMinutes: toNumber(advanced.mp),
      points: toNumber(per.pts_per_g),
      assists: toNumber(per.ast_per_g),
      rebounds: toNumber(per.trb_per_g),
      offensiveRebounds: toNumber(per.orb_per_g),
      defensiveRebounds: toNumber(per.drb_per_g),
      steals: toNumber(per.stl_per_g),
      blocks: toNumber(per.blk_per_g),
      turnovers: toNumber(per.tov_per_g),
      fgPct: toNumber(per.fg_pct),
      fg3Pct: toNumber(per.fg3_pct),
      fg3PerGame: toNumber(per.fg3_per_g),
      fg3Attempts: toNumber(per.fg3a_per_g),
      ftPct: toNumber(per.ft_pct),
      ftaPerGame: toNumber(per.fta_per_g),
      efgPct: toNumber(per.efg_pct),
      per: toNumber(advanced.per),
      tsPct: toNumber(advanced.ts_pct),
      threePointAttemptRate: toNumber(advanced.fg3a_per_fga_pct),
      freeThrowAttemptRate: toNumber(advanced.fta_per_fga_pct),
      orbPct: toNumber(advanced.orb_pct),
      drbPct: toNumber(advanced.drb_pct),
      trbPct: toNumber(advanced.trb_pct),
      astPct: toNumber(advanced.ast_pct),
      stlPct: toNumber(advanced.stl_pct),
      blkPct: toNumber(advanced.blk_pct),
      tovPct: toNumber(advanced.tov_pct),
      usgPct: toNumber(advanced.usg_pct),
      ows: toNumber(advanced.ows),
      dws: toNumber(advanced.dws),
      ws: toNumber(advanced.ws),
      wsPer48: toNumber(advanced.ws_per_48),
      obpm: toNumber(advanced.obpm),
      dbpm: toNumber(advanced.dbpm),
      bpm: toNumber(advanced.bpm),
      vorp: toNumber(advanced.vorp),
    });
  }

  const metrics = {
    pointsP: buildPercentileGetter(joined, (player) => player.points),
    assistsP: buildPercentileGetter(joined, (player) => player.assists),
    reboundsP: buildPercentileGetter(joined, (player) => player.rebounds),
    offensiveReboundsP: buildPercentileGetter(joined, (player) => player.offensiveRebounds),
    defensiveReboundsP: buildPercentileGetter(joined, (player) => player.defensiveRebounds),
    stealsP: buildPercentileGetter(joined, (player) => player.steals),
    blocksP: buildPercentileGetter(joined, (player) => player.blocks),
    turnoversP: buildPercentileGetter(joined, (player) => player.turnovers),
    fgPctP: buildPercentileGetter(joined, (player) => player.fgPct),
    fg3PctP: buildPercentileGetter(joined, (player) => player.fg3Pct),
    fg3PerGameP: buildPercentileGetter(joined, (player) => player.fg3PerGame),
    fg3AttemptsP: buildPercentileGetter(joined, (player) => player.fg3Attempts),
    ftPctP: buildPercentileGetter(joined, (player) => player.ftPct),
    ftaPerGameP: buildPercentileGetter(joined, (player) => player.ftaPerGame),
    efgPctP: buildPercentileGetter(joined, (player) => player.efgPct),
    perP: buildPercentileGetter(joined, (player) => player.per),
    tsPctP: buildPercentileGetter(joined, (player) => player.tsPct),
    threePointAttemptRateP: buildPercentileGetter(joined, (player) => player.threePointAttemptRate),
    freeThrowAttemptRateP: buildPercentileGetter(joined, (player) => player.freeThrowAttemptRate),
    orbPctP: buildPercentileGetter(joined, (player) => player.orbPct),
    drbPctP: buildPercentileGetter(joined, (player) => player.drbPct),
    trbPctP: buildPercentileGetter(joined, (player) => player.trbPct),
    astPctP: buildPercentileGetter(joined, (player) => player.astPct),
    stlPctP: buildPercentileGetter(joined, (player) => player.stlPct),
    blkPctP: buildPercentileGetter(joined, (player) => player.blkPct),
    tovPctP: buildPercentileGetter(joined, (player) => player.tovPct),
    usgPctP: buildPercentileGetter(joined, (player) => player.usgPct),
    wsP: buildPercentileGetter(joined, (player) => player.ws),
    dwsP: buildPercentileGetter(joined, (player) => player.dws),
    ws48P: buildPercentileGetter(joined, (player) => player.wsPer48),
    obpmP: buildPercentileGetter(joined, (player) => player.obpm),
    dbpmP: buildPercentileGetter(joined, (player) => player.dbpm),
    bpmP: buildPercentileGetter(joined, (player) => player.bpm),
    vorpP: buildPercentileGetter(joined, (player) => player.vorp),
    gamesP: buildPercentileGetter(joined, (player) => player.games),
    minutesP: buildPercentileGetter(joined, (player) => player.totalMinutes),
    startsP: buildPercentileGetter(joined, (player) => player.starts),
  };

  const scored = joined.map((player) => {
    const p = Object.fromEntries(
      Object.entries(metrics).map(([key, getter]) => [key, getter(player)]),
    );

    const participation = clamp(0.3 + p.minutesP * 0.7, 0.3, 1);
    const blend = (rawValue, baseline) =>
      rawValue * participation + baseline * (1 - participation);

    const shootingRaw = blend(
      0.3 * p.fg3PctP +
        0.24 * p.fg3PerGameP +
        0.14 * p.fg3AttemptsP +
        0.12 * p.ftPctP +
        0.12 * p.tsPctP +
        0.08 * p.efgPctP,
      0.42,
    );

    const playmakingRaw = blend(
      0.34 * p.assistsP +
        0.34 * p.astPctP +
        0.16 * p.obpmP +
        0.16 * (1 - p.tovPctP),
      0.36,
    );

    const reboundingRaw = blend(
      0.3 * p.reboundsP +
        0.26 * p.trbPctP +
        0.18 * p.offensiveReboundsP +
        0.14 * p.defensiveReboundsP +
        0.12 * p.orbPctP,
      0.34,
    );

    const defenseRaw = blend(
      0.24 * p.dbpmP +
        0.18 * p.dwsP +
        0.16 * p.stealsP +
        0.14 * p.blocksP +
        0.1 * p.stlPctP +
        0.1 * p.blkPctP +
        0.08 * p.trbPctP,
      0.38,
    );

    const offenseRaw = blend(
      0.3 * p.pointsP +
        0.16 * p.usgPctP +
        0.16 * p.tsPctP +
        0.14 * p.obpmP +
        0.1 * p.fgPctP +
        0.08 * p.efgPctP +
        0.06 * p.freeThrowAttemptRateP,
      0.4,
    );

    const athleticismRaw = blend(
      0.2 * p.stealsP +
        0.18 * p.blocksP +
        0.18 * p.freeThrowAttemptRateP +
        0.16 * p.offensiveReboundsP +
        0.14 * p.minutesP +
        0.14 * p.pointsP,
      0.42,
    );

    const intangiblesRaw = blend(
      0.24 * p.wsP +
        0.18 * p.bpmP +
        0.14 * p.vorpP +
        0.14 * p.gamesP +
        0.1 * p.startsP +
        0.1 * (1 - p.tovPctP) +
        0.1 * p.ws48P,
      0.45,
    );

    const ballDominanceRaw = blend(
      0.46 * p.usgPctP +
        0.34 * p.astPctP +
        0.2 * p.pointsP,
      0.34,
    );

    const perimeterDefenseRaw = blend(
      0.32 * p.stealsP +
        0.22 * p.stlPctP +
        0.22 * p.dbpmP +
        0.12 * p.minutesP +
        0.12 * defenseRaw,
      0.36,
    );

    const interiorDefenseRaw = blend(
      0.32 * p.blocksP +
        0.22 * p.blkPctP +
        0.18 * p.defensiveReboundsP +
        0.12 * p.drbPctP +
        0.16 * defenseRaw,
      0.36,
    );

    const durabilityRaw = 0.72 * p.gamesP + 0.28 * p.minutesP;

    return {
      ...player,
      ...p,
      rawScores: {
        offenseRaw,
        defenseRaw,
        playmakingRaw,
        shootingRaw,
        reboundingRaw,
        athleticismRaw,
        intangiblesRaw,
        ballDominanceRaw,
        perimeterDefenseRaw,
        interiorDefenseRaw,
        durabilityRaw,
      },
    };
  });

  const overallGetter = buildPercentileGetter(scored, (player) =>
    0.3 * player.rawScores.offenseRaw +
    0.18 * player.rawScores.defenseRaw +
    0.13 * player.rawScores.playmakingRaw +
    0.12 * player.rawScores.shootingRaw +
    0.1 * player.rawScores.reboundingRaw +
    0.07 * player.rawScores.athleticismRaw +
    0.1 * player.rawScores.intangiblesRaw,
  );

  const seeds = scored.map((player) => {
    const primaryPosition = getPrimaryPosition(player.positions, player);
    const secondaryPositions = player.positions
      .filter((position) => position !== primaryPosition)
      .slice(0, 2);

    let overall = roundInt(clamp(70 + overallGetter(player) * 25, 70, 95));
    if (player.name in OVERALL_OVERRIDES) {
      overall = OVERALL_OVERRIDES[player.name];
    } else {
      overall = Math.min(93, overall);
    }

    const offense = rate(player.rawScores.offenseRaw, 70, 98);
    const defense = rate(player.rawScores.defenseRaw, 70, 97);
    const playmaking = rate(player.rawScores.playmakingRaw, 70, 98);
    const shooting = rate(player.rawScores.shootingRaw, 70, 99);
    const rebounding = rate(player.rawScores.reboundingRaw, 70, 99);
    const athleticism = rate(player.rawScores.athleticismRaw, 70, 97);
    const intangibles = rate(player.rawScores.intangiblesRaw, 70, 98);
    const durability = rate(player.rawScores.durabilityRaw, 68, 98);
    const ballDominance = rate(player.rawScores.ballDominanceRaw, 25, 99);

    let perimeterDefense = rate(player.rawScores.perimeterDefenseRaw, 64, 98);
    let interiorDefense = rate(player.rawScores.interiorDefenseRaw, 60, 98);

    if (primaryPosition === "C") {
      interiorDefense = Math.max(interiorDefense, defense);
      perimeterDefense = Math.min(perimeterDefense, defense - 4);
    } else if (primaryPosition === "PG" || primaryPosition === "SG") {
      perimeterDefense = Math.max(perimeterDefense, defense);
      interiorDefense = Math.min(interiorDefense, defense - 8);
    }

    const seed = {
      name: `${player.name} (2025-26)`,
      era: "2025-26",
      teamLabel: player.teamLabel,
      primaryPosition,
      secondaryPositions,
      overall,
      offense,
      defense,
      playmaking,
      shooting,
      rebounding,
      athleticism,
      intangibles,
      durability,
      archetype: "",
      hallOfFameTier: getTier(overall),
      shortDescription: "",
      badges: [],
      ballDominance,
      interiorDefense: roundInt(clamp(interiorDefense, 40, 99)),
      perimeterDefense: roundInt(clamp(perimeterDefense, 35, 99)),
    };

    seed.archetype = buildArchetype(seed);
    seed.shortDescription = buildDescription(seed);
    seed.badges = buildBadges(seed, player);

    return seed;
  });

  return seeds.sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
};

const seeds = buildPlayerSeeds();

const output = `import { Player, PlayerTier, Position } from "../types";

interface PlayerSeed {
  name: string;
  era: string;
  teamLabel: string;
  primaryPosition: Position;
  secondaryPositions: Position[];
  overall: number;
  offense: number;
  defense: number;
  playmaking: number;
  shooting: number;
  rebounding: number;
  athleticism: number;
  intangibles: number;
  durability: number;
  archetype: string;
  hallOfFameTier: PlayerTier;
  shortDescription: string;
  badges: string[];
  ballDominance: number;
  interiorDefense: number;
  perimeterDefense: number;
}

const makePlayer = (seed: PlayerSeed): Player => ({
  id: seed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
  ...seed,
});

export const currentSeason2026Players: Player[] = [
${seeds.map(formatSeed).join("\n")}
];
`;

fs.writeFileSync(OUTPUT_PATH, output, "utf8");
console.log(`Wrote ${seeds.length} current-season players to ${OUTPUT_PATH}`);
