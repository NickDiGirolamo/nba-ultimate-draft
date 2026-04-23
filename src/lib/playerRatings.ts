import { Player, Position } from "../types";

export const backendRatingCategories = [
  "offense",
  "defense",
  "playmaking",
  "shooting",
  "rebounding",
  "athleticism",
  "intangibles",
] as const;

export type BackendRatingCategory = (typeof backendRatingCategories)[number];

type RatingsProfile = Record<BackendRatingCategory, number>;

type RatingSeed = Pick<
  Player,
  | "name"
  | "era"
  | "primaryPosition"
  | "secondaryPositions"
  | "overall"
  | "offense"
  | "defense"
  | "playmaking"
  | "shooting"
  | "rebounding"
  | "athleticism"
  | "intangibles"
  | "archetype"
  | "badges"
  | "ballDominance"
  | "interiorDefense"
  | "perimeterDefense"
>;

export interface PlayerRatingValidationIssue {
  severity: "warning" | "error";
  message: string;
}

export interface PlayerRatingValidationEntry {
  playerId: string;
  name: string;
  overall: number;
  backendAverage: number;
  budgetDelta: number;
  spread: number;
  maxStat: number;
  minStat: number;
  issues: PlayerRatingValidationIssue[];
}

export interface PlayerRatingValidationSummary {
  totalPlayers: number;
  flaggedPlayers: number;
  entries: PlayerRatingValidationEntry[];
}

const createEmptyProfile = (): RatingsProfile => ({
  offense: 0,
  defense: 0,
  playmaking: 0,
  shooting: 0,
  rebounding: 0,
  athleticism: 0,
  intangibles: 0,
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);

const standardDeviation = (values: number[]) => {
  if (values.length === 0) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
};

const roundToInt = (value: number) => Math.round(value);

const profileFromSeed = (seed: RatingSeed): RatingsProfile => ({
  offense: seed.offense,
  defense: seed.defense,
  playmaking: seed.playmaking,
  shooting: seed.shooting,
  rebounding: seed.rebounding,
  athleticism: seed.athleticism,
  intangibles: seed.intangibles,
});

const centerProfile = (profile: RatingsProfile): RatingsProfile => {
  const mean = average(backendRatingCategories.map((category) => profile[category]));
  return backendRatingCategories.reduce((accumulator, category) => {
    accumulator[category] = profile[category] - mean;
    return accumulator;
  }, createEmptyProfile());
};

const scaleProfile = (profile: RatingsProfile, scale: number): RatingsProfile =>
  backendRatingCategories.reduce((accumulator, category) => {
    accumulator[category] = profile[category] * scale;
    return accumulator;
  }, createEmptyProfile());

const addToProfile = (profile: RatingsProfile, delta: Partial<RatingsProfile>, scale = 1) => {
  backendRatingCategories.forEach((category) => {
    profile[category] += (delta[category] ?? 0) * scale;
  });
};

const combineProfiles = (left: RatingsProfile, right: RatingsProfile, rightWeight: number): RatingsProfile => {
  const leftWeight = 1 - rightWeight;
  return backendRatingCategories.reduce((accumulator, category) => {
    accumulator[category] = left[category] * leftWeight + right[category] * rightWeight;
    return accumulator;
  }, createEmptyProfile());
};

const positionProfiles: Record<Position, Partial<RatingsProfile>> = {
  PG: { offense: 0.4, playmaking: 1.7, shooting: 0.8, rebounding: -0.8, athleticism: 0.3, intangibles: 0.3 },
  SG: { offense: 1.0, playmaking: 0.4, shooting: 1.4, rebounding: -0.6, athleticism: 0.5, intangibles: 0.1 },
  SF: { offense: 0.7, defense: 0.4, playmaking: 0.3, rebounding: 0.1, athleticism: 0.5, intangibles: 0.2 },
  PF: { offense: 0.3, defense: 0.8, playmaking: -0.3, shooting: -0.2, rebounding: 1.3, athleticism: 0.2, intangibles: 0.4 },
  C: { offense: -0.1, defense: 1.3, playmaking: -0.8, shooting: -0.8, rebounding: 1.9, athleticism: 0.1, intangibles: 0.5 },
};

const badgeProfiles: Record<string, Partial<RatingsProfile>> = {
  "Elite Shooter": { offense: 0.8, shooting: 2.8, intangibles: 0.3 },
  "Off-Ball Gravity": { offense: 0.8, shooting: 1.8, intangibles: 0.4 },
  "Deep Range": { offense: 0.9, shooting: 2.5 },
  "Midrange Surgeon": { offense: 0.7, shooting: 2.0, intangibles: 0.2 },
  "Shot Creator": { offense: 1.9, playmaking: 0.7, shooting: 1.1, athleticism: 0.5 },
  "Three-Level Scorer": { offense: 2.1, shooting: 1.6, athleticism: 0.4 },
  "Paint Pressure": { offense: 1.7, athleticism: 1.2, intangibles: 0.2 },
  "Paint Touch": { offense: 1.4, playmaking: 0.4, athleticism: 0.7 },
  "Interior Force": { offense: 1.4, rebounding: 1.2, athleticism: 0.5 },
  "Post Scorer": { offense: 1.8, rebounding: 0.7, intangibles: 0.3 },
  "Rim Protector": { defense: 2.4, rebounding: 0.9, athleticism: 0.4, intangibles: 0.4 },
  "Paint Anchor": { defense: 2.5, rebounding: 1.0, intangibles: 0.5 },
  "Glass Cleaner": { defense: 0.6, rebounding: 2.8, athleticism: 0.2, intangibles: 0.2 },
  "Switchable Big": { defense: 2.0, athleticism: 0.8, intangibles: 0.3 },
  "Wing Stopper": { defense: 2.3, athleticism: 0.7, intangibles: 0.4 },
  "Point-of-Attack": { defense: 2.1, athleticism: 0.8, intangibles: 0.3 },
  "Lockdown Defender": { defense: 2.5, athleticism: 0.6, intangibles: 0.4 },
  "Defensive IQ": { defense: 1.9, intangibles: 1.0 },
  "Floor General": { offense: 0.7, playmaking: 2.7, intangibles: 0.8 },
  "Point Forward": { offense: 0.6, playmaking: 2.3, rebounding: 0.4, intangibles: 0.4 },
  Connector: { offense: 0.4, playmaking: 1.6, intangibles: 1.2 },
  "Tempo Control": { playmaking: 2.0, intangibles: 0.9, athleticism: 0.2 },
  "Fast Break Genius": { offense: 0.8, playmaking: 1.8, athleticism: 0.8 },
  "Transition Force": { offense: 1.1, athleticism: 2.1, intangibles: 0.3 },
  "Athletic Freak": { offense: 0.6, defense: 0.2, rebounding: 0.3, athleticism: 3.2 },
  "Vertical Threat": { offense: 0.6, rebounding: 1.0, athleticism: 1.8 },
  "Paint Gravity": { offense: 1.1, rebounding: 0.8, intangibles: 0.4 },
  "Clutch": { offense: 0.8, shooting: 0.5, intangibles: 2.0 },
  "Champion DNA": { defense: 0.4, intangibles: 2.6 },
  "Iron Man": { intangibles: 1.8 },
  Motor: { defense: 0.5, rebounding: 0.9, athleticism: 0.8, intangibles: 1.1 },
  "Bench Scorer": { offense: 1.4, shooting: 0.8, intangibles: 0.3 },
  "Bench Igniter": { offense: 1.1, athleticism: 0.9, intangibles: 0.5 },
  "Mismatch Weapon": { offense: 1.4, shooting: 0.5, playmaking: 0.4, athleticism: 0.4 },
  "Lead Guard": { offense: 0.8, playmaking: 1.7, intangibles: 0.7 },
  "Triple-Double Machine": { playmaking: 1.2, rebounding: 1.1, intangibles: 0.8 },
  "Lob Threat": { offense: 0.6, rebounding: 0.8, athleticism: 1.4 },
  "Difficult Shot Maker": { offense: 1.7, shooting: 1.2, intangibles: 0.5 },
  "Matchup Nightmare": { offense: 1.3, playmaking: 1.0, rebounding: 0.4, intangibles: 0.4 },
};

const keywordProfiles: Array<{ tokens: string[]; delta: Partial<RatingsProfile> }> = [
  { tokens: ["sniper", "marksman", "sharpshooting", "floor spacer"], delta: { offense: 0.7, shooting: 2.8, intangibles: 0.2 } },
  { tokens: ["shooter", "shotmaking", "shot creator", "three-level", "deep-range", "midrange"], delta: { offense: 1.6, shooting: 2.0, playmaking: 0.3 } },
  { tokens: ["playmaking", "creator", "engine", "maestro", "tempo", "connector", "point wing", "orchestrator"], delta: { offense: 0.7, playmaking: 2.4, intangibles: 0.6 } },
  { tokens: ["lockdown", "stopper", "defender", "defensive", "anchor", "enforcer"], delta: { defense: 2.3, rebounding: 0.6, athleticism: 0.4, intangibles: 0.7 } },
  { tokens: ["board", "glass", "rebounding", "interior", "paint", "rim-running", "rim", "post", "center", "big"], delta: { offense: 0.3, defense: 0.7, rebounding: 2.4, athleticism: 0.2, intangibles: 0.3 } },
  { tokens: ["slashing", "explosive", "athletic", "transition", "rim-attack", "showman", "dunking"], delta: { offense: 1.3, athleticism: 2.6, rebounding: 0.3, intangibles: 0.2 } },
  { tokens: ["clutch", "championship", "fundamental", "veteran", "steady", "reliable", "captain", "iq"], delta: { defense: 0.3, playmaking: 0.3, intangibles: 2.2 } },
];

const getModelProfile = (seed: RatingSeed): RatingsProfile => {
  const profile = createEmptyProfile();
  const archetype = seed.archetype.toLowerCase();
  const eraTag = seed.era.toLowerCase();

  addToProfile(profile, positionProfiles[seed.primaryPosition], 0.9);
  seed.secondaryPositions.forEach((position) => addToProfile(profile, positionProfiles[position], 0.28));

  keywordProfiles.forEach(({ tokens, delta }) => {
    if (tokens.some((token) => archetype.includes(token))) {
      addToProfile(profile, delta);
    }
  });

  seed.badges.forEach((badge) => {
    addToProfile(profile, badgeProfiles[badge] ?? {});
  });

  if (eraTag.includes("2025-26")) {
    addToProfile(profile, { playmaking: 0.2, shooting: 0.5, rebounding: -0.1 });
  } else if (/19[4-7]\d|1980/.test(seed.era)) {
    addToProfile(profile, { rebounding: 0.3, intangibles: 0.4, shooting: -0.2 });
  } else if (/19[8-9]\d|200[0-4]/.test(seed.era)) {
    addToProfile(profile, { offense: 0.2, athleticism: 0.2, shooting: 0.1 });
  }

  return centerProfile(profile);
};

const getOriginalCenteredValue = (seed: RatingSeed, category: BackendRatingCategory) => {
  const profile = profileFromSeed(seed);
  const centered = centerProfile(profile);
  return centered[category];
};

const clampProfileValue = (
  value: number,
  overall: number,
  seed: RatingSeed,
  category: BackendRatingCategory,
  modelProfile: RatingsProfile,
) => {
  const originalCentered = getOriginalCenteredValue(seed, category);
  const modeledLift = clamp(modelProfile[category] * 0.18, -1.4, 1.8);
  const premiumAllowance = originalCentered > 0 ? originalCentered * 0.22 : 0;
  const weaknessAllowance = originalCentered < 0 ? Math.abs(originalCentered) * 0.18 : 0;
  const distanceAbove =
    (overall >= 95 ? 7 : overall >= 90 ? 6 : overall >= 85 ? 5 : 4.5) +
    premiumAllowance +
    Math.max(0, modeledLift);
  const distanceBelow =
    (overall >= 95 ? 8 : overall >= 90 ? 8.5 : overall >= 85 ? 9.5 : 10.5) +
    weaknessAllowance +
    Math.max(0, -modeledLift);
  const upperBound = Math.min(99, overall + distanceAbove);
  const lowerBound = Math.max(25, overall - distanceBelow);
  return clamp(value, lowerBound, upperBound);
};

const finalizeBudget = (values: RatingsProfile, overall: number, seed: RatingSeed): RatingsProfile => {
  const targetBudget = overall * backendRatingCategories.length;
  const modelProfile = getModelProfile(seed);
  let floats = backendRatingCategories.map((category) =>
    clampProfileValue(values[category], overall, seed, category, modelProfile),
  );

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const delta = targetBudget - floats.reduce((sum, value) => sum + value, 0);
    if (Math.abs(delta) < 0.001) break;

    const eligibleIndices = floats
      .map((value, index) => ({ value, index }))
      .filter(({ value, index }) => {
        const category = backendRatingCategories[index];
        const clampedValue = clampProfileValue(value, overall, seed, category, modelProfile);
        return delta > 0 ? clampedValue < 99 && value < 99 : clampedValue > 25 && value > 25;
      })
      .map(({ index }) => index);

    if (eligibleIndices.length === 0) break;

    const increment = delta / eligibleIndices.length;
    eligibleIndices.forEach((index) => {
      const category = backendRatingCategories[index];
      floats[index] = clampProfileValue(floats[index] + increment, overall, seed, category, modelProfile);
    });
  }

  const floors = floats.map((value) => Math.floor(value));
  let remainder = targetBudget - floors.reduce((sum, value) => sum + value, 0);
  const fractionalOrder = floats
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction);

  if (remainder > 0) {
    for (const { index } of fractionalOrder) {
      const category = backendRatingCategories[index];
      const nextValue = floors[index] + 1;
      if (nextValue <= clampProfileValue(nextValue, overall, seed, category, modelProfile)) {
        floors[index] = nextValue;
        remainder -= 1;
      }
      if (remainder <= 0) break;
    }
  } else if (remainder < 0) {
    for (const { index } of fractionalOrder.reverse()) {
      const category = backendRatingCategories[index];
      const nextValue = floors[index] - 1;
      if (nextValue >= clampProfileValue(nextValue, overall, seed, category, modelProfile)) {
        floors[index] = nextValue;
        remainder += 1;
      }
      if (remainder >= 0) break;
    }
  }

  return backendRatingCategories.reduce((accumulator, category, index) => {
    accumulator[category] = clamp(floors[index], 25, 99);
    return accumulator;
  }, createEmptyProfile());
};

const getTargetSpread = (seed: RatingSeed, originalProfile: RatingsProfile) => {
  const originalSpread = standardDeviation(backendRatingCategories.map((category) => originalProfile[category]));
  const specializationCompression =
    originalSpread >= 15 ? 0.58 : originalSpread >= 12 ? 0.64 : originalSpread >= 9 ? 0.72 : originalSpread >= 6 ? 0.82 : 0.95;
  const overallCompression =
    seed.overall >= 96 ? 0.9 : seed.overall >= 92 ? 0.93 : seed.overall >= 88 ? 0.96 : 1;
  const badgeLift = Math.min(0.55, seed.badges.length * 0.12);
  return clamp(originalSpread * specializationCompression * overallCompression + badgeLift, 2.3, seed.overall >= 94 ? 10.8 : 9.6);
};

const buildNormalizedBackendRatings = (seed: RatingSeed): RatingsProfile => {
  const originalProfile = profileFromSeed(seed);
  const centeredIdentity = centerProfile(originalProfile);
  const centeredModel = getModelProfile(seed);
  const blended = centerProfile(
    backendRatingCategories.reduce((accumulator, category) => {
      accumulator[category] = centeredIdentity[category] + centeredModel[category] * 0.14;
      return accumulator;
    }, createEmptyProfile()),
  );
  const currentSpread = standardDeviation(backendRatingCategories.map((category) => blended[category])) || 1;
  const targetSpread = getTargetSpread(seed, originalProfile);
  const scaled = scaleProfile(blended, targetSpread / currentSpread);
  const provisional = backendRatingCategories.reduce((accumulator, category) => {
    accumulator[category] = seed.overall + scaled[category];
    return accumulator;
  }, createEmptyProfile());

  return finalizeBudget(provisional, seed.overall, seed);
};

const buildBallDominance = (seed: RatingSeed, ratings: RatingsProfile) => {
  const positionBias =
    seed.primaryPosition === "PG"
      ? 4
      : seed.primaryPosition === "SG"
        ? 2
        : seed.primaryPosition === "SF"
          ? 0
          : seed.primaryPosition === "PF"
            ? -2
            : -5;

  const value =
    seed.ballDominance +
    (ratings.playmaking - seed.playmaking) * 0.7 +
    (ratings.offense - seed.offense) * 0.2 +
    (ratings.athleticism - seed.athleticism) * 0.1 +
    positionBias;

  return clamp(roundToInt(value), 8, 99);
};

const buildInteriorDefense = (seed: RatingSeed, ratings: RatingsProfile) => {
  const bigBias =
    seed.primaryPosition === "C"
      ? 2
      : seed.primaryPosition === "PF"
        ? 1
        : seed.primaryPosition === "SF"
          ? -1
          : -4;

  const value =
    seed.interiorDefense +
    (ratings.defense - seed.defense) * 0.62 +
    (ratings.rebounding - seed.rebounding) * 0.18 +
    (ratings.athleticism - seed.athleticism) * 0.08 +
    bigBias;

  return clamp(roundToInt(value), 8, 99);
};

const buildPerimeterDefense = (seed: RatingSeed, ratings: RatingsProfile) => {
  const wingBias =
    seed.primaryPosition === "PG" || seed.primaryPosition === "SG"
      ? 2
      : seed.primaryPosition === "SF"
        ? 1
        : seed.primaryPosition === "PF"
          ? -1
          : -4;

  const value =
    seed.perimeterDefense +
    (ratings.defense - seed.defense) * 0.7 +
    (ratings.athleticism - seed.athleticism) * 0.14 +
    (ratings.intangibles - seed.intangibles) * 0.08 +
    wingBias;

  return clamp(roundToInt(value), 8, 99);
};

export const normalizePlayerSeedRatings = (seed: RatingSeed) => {
  const backendRatings = buildNormalizedBackendRatings(seed);

  return {
    ...backendRatings,
    ballDominance: buildBallDominance(seed, backendRatings),
    interiorDefense: buildInteriorDefense(seed, backendRatings),
    perimeterDefense: buildPerimeterDefense(seed, backendRatings),
  };
};

export const validatePlayerRatings = (players: Player[]): PlayerRatingValidationSummary => {
  const entries = players.map((player) => {
    const values = backendRatingCategories.map((category) => player[category]);
    const backendAverage = average(values);
    const maxStat = Math.max(...values);
    const minStat = Math.min(...values);
    const spread = maxStat - minStat;
    const budgetDelta = values.reduce((sum, value) => sum + value, 0) - player.overall * backendRatingCategories.length;
    const issues: PlayerRatingValidationIssue[] = [];

    if (budgetDelta !== 0) {
      issues.push({ severity: "error", message: "Backend stat budget does not align with overall anchor." });
    }

    if (Math.abs(backendAverage - player.overall) > 0.4) {
      issues.push({ severity: "warning", message: "Backend average is drifting away from the fixed overall rating." });
    }

    if (player.overall <= 80 && maxStat >= 95) {
      issues.push({ severity: "warning", message: "Low-overall player has an unusually extreme single-stat spike." });
    }

    if (player.overall >= 92 && average([...values].sort((left, right) => right - left).slice(0, 3)) < 89) {
      issues.push({ severity: "warning", message: "Elite overall player may be missing enough standout backend strengths." });
    }

    return {
      playerId: player.id,
      name: player.name,
      overall: player.overall,
      backendAverage: Math.round(backendAverage * 10) / 10,
      budgetDelta,
      spread,
      maxStat,
      minStat,
      issues,
    } satisfies PlayerRatingValidationEntry;
  });

  return {
    totalPlayers: players.length,
    flaggedPlayers: entries.filter((entry) => entry.issues.length > 0).length,
    entries,
  };
};
