import { Player } from "../types";
import type { PlayerTypeBadge } from "./playerTypeBadges";

export interface PlayerArchetypeBehaviorProfile {
  key: string;
  scoringWeightMultiplier: number;
  starShareMultiplier: number;
  assistWeightMultiplier: number;
  teamAssistRateBonus: number;
  reboundWeightMultiplier: number;
  defenseEventMultiplier: number;
  threePointBias: number;
  freeThrowBias: number;
  turnoverLoadMultiplier: number;
  shotQualityBonus: number;
}

type BehaviorAdjustment = Partial<Omit<PlayerArchetypeBehaviorProfile, "key">>;

const createBaseProfile = (): PlayerArchetypeBehaviorProfile => ({
  key: "balanced",
  scoringWeightMultiplier: 1,
  starShareMultiplier: 1,
  assistWeightMultiplier: 1,
  teamAssistRateBonus: 0,
  reboundWeightMultiplier: 1,
  defenseEventMultiplier: 1,
  threePointBias: 0,
  freeThrowBias: 0,
  turnoverLoadMultiplier: 1,
  shotQualityBonus: 0,
});

const multiplicativeKeys: Array<keyof Omit<PlayerArchetypeBehaviorProfile, "key">> = [
  "scoringWeightMultiplier",
  "starShareMultiplier",
  "assistWeightMultiplier",
  "reboundWeightMultiplier",
  "defenseEventMultiplier",
  "turnoverLoadMultiplier",
];

const additiveKeys: Array<keyof Omit<PlayerArchetypeBehaviorProfile, "key">> = [
  "teamAssistRateBonus",
  "threePointBias",
  "freeThrowBias",
  "shotQualityBonus",
];

const includesAny = (text: string, patterns: RegExp[]) =>
  patterns.some((pattern) => pattern.test(text));

const applyAdjustment = (
  profile: PlayerArchetypeBehaviorProfile,
  behaviorKey: string,
  adjustment: BehaviorAdjustment,
) => {
  profile.key = profile.key === "balanced" ? behaviorKey : `${profile.key}+${behaviorKey}`;

  multiplicativeKeys.forEach((key) => {
    const nextValue = adjustment[key];
    if (typeof nextValue === "number") {
      profile[key] *= nextValue;
    }
  });

  additiveKeys.forEach((key) => {
    const nextValue = adjustment[key];
    if (typeof nextValue === "number") {
      profile[key] += nextValue;
    }
  });
};

const clampProfile = (profile: PlayerArchetypeBehaviorProfile): PlayerArchetypeBehaviorProfile => ({
  ...profile,
  scoringWeightMultiplier: Math.max(0.52, Math.min(1.35, profile.scoringWeightMultiplier)),
  starShareMultiplier: Math.max(0.45, Math.min(1.35, profile.starShareMultiplier)),
  assistWeightMultiplier: Math.max(0.72, Math.min(2.1, profile.assistWeightMultiplier)),
  teamAssistRateBonus: Math.max(-0.02, Math.min(0.08, profile.teamAssistRateBonus)),
  reboundWeightMultiplier: Math.max(0.8, Math.min(1.35, profile.reboundWeightMultiplier)),
  defenseEventMultiplier: Math.max(0.85, Math.min(1.35, profile.defenseEventMultiplier)),
  threePointBias: Math.max(-0.02, Math.min(0.18, profile.threePointBias)),
  freeThrowBias: Math.max(0, Math.min(0.14, profile.freeThrowBias)),
  turnoverLoadMultiplier: Math.max(0.82, Math.min(1.24, profile.turnoverLoadMultiplier)),
  shotQualityBonus: Math.max(-0.015, Math.min(0.03, profile.shotQualityBonus)),
});

export const getPlayerArchetypeBehaviorProfile = (
  player: Player,
  badgeTypes: PlayerTypeBadge[] = [],
): PlayerArchetypeBehaviorProfile => {
  const text = `${player.archetype} ${player.badges.join(" ")}`.toLowerCase();
  const profile = createBaseProfile();
  const hasBadge = (badgeType: PlayerTypeBadge) => badgeTypes.includes(badgeType);

  if (
    includesAny(text, [
      /methodical floor general/,
      /table setter/,
      /tempo maestro/,
      /tempo showman/,
      /probing point guard/,
    ]) ||
    (player.primaryPosition === "PG" &&
      player.playmaking >= player.offense + 7 &&
      player.ballDominance >= 84 &&
      player.shooting <= 78)
  ) {
    applyAdjustment(profile, "pass-first-point-guard", {
      scoringWeightMultiplier: 0.58,
      starShareMultiplier: 0.48,
      assistWeightMultiplier: 1.95,
      teamAssistRateBonus: 0.06,
      turnoverLoadMultiplier: 1.08,
    });
  } else if (
    includesAny(text, [
      /floor general/,
      /tempo/,
      /organizer/,
      /orchestr/,
      /playmaking/,
      /connector creator/,
      /open-floor engine/,
    ]) ||
    (hasBadge("playmaker") && player.primaryPosition === "PG" && player.playmaking >= 88)
  ) {
    applyAdjustment(profile, "lead-playmaker", {
      scoringWeightMultiplier: 0.82,
      starShareMultiplier: 0.74,
      assistWeightMultiplier: 1.6,
      teamAssistRateBonus: 0.04,
      turnoverLoadMultiplier: 1.04,
    });
  }

  if (includesAny(text, [/connector/, /point forward/, /glue/, /utility/, /connective/])) {
    applyAdjustment(profile, "connector", {
      scoringWeightMultiplier: 0.92,
      starShareMultiplier: 0.9,
      assistWeightMultiplier: 1.2,
      reboundWeightMultiplier: 1.04,
      defenseEventMultiplier: 1.04,
    });
  }

  if (
    includesAny(text, [
      /shotmaking/,
      /scoring/,
      /bucket/,
      /three-level/,
      /isolation/,
      /microwave/,
      /bench scorer/,
      /pressure scorer/,
      /offensive engine/,
      /go-to/,
      /shot creator/,
      /combo guard/,
    ]) ||
    (player.offense >= 91 && player.ballDominance >= 82)
  ) {
    applyAdjustment(profile, "scoring-engine", {
      scoringWeightMultiplier: 1.18,
      starShareMultiplier: 1.16,
      assistWeightMultiplier: 0.94,
      turnoverLoadMultiplier: 1.07,
      shotQualityBonus: 0.01,
    });
  }

  if (
    includesAny(text, [
      /shooter/,
      /sniper/,
      /sharpshooting/,
      /spacing/,
      /off-ball/,
      /gravity/,
      /movement shooter/,
      /corner three/,
      /floor spacer/,
    ]) ||
    hasBadge("sniper")
  ) {
    applyAdjustment(profile, "sniper", {
      scoringWeightMultiplier: 1.05,
      starShareMultiplier: 0.96,
      assistWeightMultiplier: 0.92,
      threePointBias: 0.12,
      shotQualityBonus: 0.015,
    });
  }

  if (
    includesAny(text, [
      /slashing/,
      /downhill/,
      /explosive/,
      /transition/,
      /rim pressure/,
      /paint pressure/,
      /vertical/,
      /athletic freak/,
      /flight/,
      /force of nature/,
    ]) ||
    hasBadge("slasher")
  ) {
    applyAdjustment(profile, "slasher", {
      scoringWeightMultiplier: 1.08,
      freeThrowBias: 0.08,
      shotQualityBonus: 0.005,
    });
  }

  if (
    includesAny(text, [
      /glass/,
      /rebound/,
      /board/,
      /interior scoring/,
      /post/,
      /paint/,
      /frontcourt/,
      /big/,
      /center/,
      /power forward/,
    ]) ||
    hasBadge("board-man")
  ) {
    applyAdjustment(profile, "rebounder", {
      reboundWeightMultiplier: 1.16,
      starShareMultiplier: 0.94,
    });
  }

  if (
    includesAny(text, [
      /rim protector/,
      /paint anchor/,
      /anchor/,
      /defensive/,
      /stopper/,
      /point-of-attack/,
      /lockdown/,
      /switchable/,
      /wing stopper/,
      /swiss army defender/,
      /two-way/,
    ]) ||
    hasBadge("lockdown")
  ) {
    applyAdjustment(profile, "defender", {
      scoringWeightMultiplier: 0.92,
      defenseEventMultiplier: 1.18,
      reboundWeightMultiplier: 1.04,
    });
  }

  if (
    includesAny(text, [/low-usage/, /glue-guy disruptor/, /role player/, /utility forward/]) ||
    (player.offense <= 76 && player.defense >= 84 && player.primaryPosition !== "PG")
  ) {
    applyAdjustment(profile, "low-usage-glue", {
      scoringWeightMultiplier: 0.72,
      starShareMultiplier: 0.62,
      assistWeightMultiplier: 0.92,
      reboundWeightMultiplier: 1.02,
      defenseEventMultiplier: 1.08,
    });
  }

  if (player.primaryPosition === "C" && player.offense <= 75 && player.defense >= 85) {
    applyAdjustment(profile, "defensive-anchor", {
      scoringWeightMultiplier: 0.74,
      starShareMultiplier: 0.6,
      assistWeightMultiplier: 0.76,
      reboundWeightMultiplier: 1.22,
      defenseEventMultiplier: 1.24,
    });
  }

  if (player.primaryPosition === "PG" && hasBadge("playmaker") && !hasBadge("sniper") && player.shooting <= 80) {
    applyAdjustment(profile, "pure-playmaker", {
      scoringWeightMultiplier: 0.78,
      starShareMultiplier: 0.7,
      assistWeightMultiplier: 1.38,
      teamAssistRateBonus: 0.025,
    });
  }

  return clampProfile(profile);
};
