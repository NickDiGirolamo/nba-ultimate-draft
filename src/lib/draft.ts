import { allPlayers } from "../data/players";
import { Player, Position, RosterSlot, RosterSlotType } from "../types";
import { getPlayerTier } from "./playerTier";
import { clamp, mulberry32, randomItem, randomInt } from "./random";

export const STORAGE_KEY = "legends-draft-state-v1";
export const DRAFT_GENERATOR_VERSION = "2026-04-15-scarcity-v1";

export const rosterTemplate = (): RosterSlot[] => [
  { slot: "PG", label: "Starting PG", allowedPositions: ["PG"], player: null },
  { slot: "SG", label: "Starting SG", allowedPositions: ["SG"], player: null },
  { slot: "SF", label: "Starting SF", allowedPositions: ["SF"], player: null },
  { slot: "PF", label: "Starting PF", allowedPositions: ["PF"], player: null },
  { slot: "C", label: "Starting C", allowedPositions: ["C"], player: null },
  { slot: "G", label: "Bench Guard", allowedPositions: ["PG", "SG"], player: null },
  { slot: "G/F", label: "Wing Flex", allowedPositions: ["SG", "SF", "PF"], player: null },
  { slot: "F/C", label: "Frontcourt Flex", allowedPositions: ["PF", "C"], player: null },
  { slot: "UTIL", label: "Utility", allowedPositions: ["PG", "SG", "SF", "PF", "C"], player: null },
  { slot: "UTIL", label: "Utility", allowedPositions: ["PG", "SG", "SF", "PF", "C"], player: null },
];

const tierWeights: Record<string, number> = {
  Galaxy: 1.2,
  Amethyst: 2.4,
  Ruby: 3.6,
  Sapphire: 1.9,
  Emerald: 1.2,
};
const choiceTierProfiles = [
  { weight: 34, slots: { Galaxy: 0, Amethyst: 1, Ruby: 3, Sapphire: 1 } },
  { weight: 26, slots: { Galaxy: 0, Amethyst: 1, Ruby: 2, Sapphire: 2 } },
  { weight: 18, slots: { Galaxy: 0, Amethyst: 2, Ruby: 2, Sapphire: 1 } },
  { weight: 10, slots: { Galaxy: 1, Amethyst: 1, Ruby: 2, Sapphire: 1 } },
  { weight: 6, slots: { Galaxy: 1, Amethyst: 2, Ruby: 2, Sapphire: 0 } },
  { weight: 6, slots: { Galaxy: 0, Amethyst: 0, Ruby: 4, Sapphire: 1 } },
];

const slotPriority: Record<RosterSlotType, number> = {
  PG: 12,
  SG: 12,
  SF: 12,
  PF: 12,
  C: 12,
  G: 9,
  "G/F": 8,
  "F/C": 8,
  UTIL: 4,
};

const VERSION_SUFFIX_PATTERN = /\s\([^)]*\)$/;
const playerById = new Map(allPlayers.map((player) => [player.id, player]));

export const createSeed = () =>
  Math.floor(Date.now() % 1_000_000_000) + Math.floor(Math.random() * 10000);

const getPlayerPositions = (player: Player) => [player.primaryPosition, ...player.secondaryPositions];
const getPlayerIdentityKey = (player: Player) =>
  player.name.replace(VERSION_SUFFIX_PATTERN, "").trim().toLowerCase();

const scorePlayerForSlot = (player: Player, slot: RosterSlot) => {
  const positions = getPlayerPositions(player);
  const hasFit = positions.some((position) => slot.allowedPositions.includes(position));
  if (!hasFit) return -Infinity;

  let score = slotPriority[slot.slot];
  score += 18;
  score += clamp(player.overall - 80, 0, 25);
  score += clamp((player.playmaking - 70) / 3, 0, 7);
  score += clamp((player.defense - 70) / 4, 0, 6);
  if (slot.slot === "PG" && positions.includes("PG")) score += 10;
  if (slot.slot === "C" && positions.includes("C")) score += 10;
  if (slot.slot === "G" && positions.some((position) => ["PG", "SG"].includes(position))) score += 4;
  if (slot.slot === "F/C" && positions.some((position) => ["PF", "C"].includes(position))) score += 4;
  return score;
};

export const assignPlayerToRoster = (roster: RosterSlot[], player: Player) => {
  const openSlots = roster.map((slot, index) => ({ slot, index })).filter(({ slot }) => slot.player === null);
  let bestIndex = -1;
  let bestScore = -Infinity;

  for (const { slot, index } of openSlots) {
    const score = scorePlayerForSlot(player, slot);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  if (bestIndex === -1) bestIndex = roster.findIndex((slot) => slot.player === null);

  const updatedRoster = roster.map((slot, index) => (index === bestIndex ? { ...slot, player } : slot));
  return { roster: updatedRoster, filledSlot: updatedRoster[bestIndex].slot };
};

const weightedSampleWithoutReplacement = (pool: Player[], count: number, rng: () => number) => {
  const available = [...pool];
  const results: Player[] = [];

  while (results.length < count && available.length > 0) {
    const totalWeight = available.reduce((sum, player) => sum + (tierWeights[getPlayerTier(player)] ?? 1), 0);
    let threshold = rng() * totalWeight;
    let selectedIndex = 0;

    for (let index = 0; index < available.length; index += 1) {
      threshold -= tierWeights[getPlayerTier(available[index])] ?? 1;
      if (threshold <= 0) {
        selectedIndex = index;
        break;
      }
    }

    results.push(available[selectedIndex]);
    available.splice(selectedIndex, 1);
  }

  return results;
};

const chooseNeededPositions = (roster: RosterSlot[]) => {
  const openSlots = roster.filter((slot) => slot.player === null);
  const frequency = new Map<Position, number>();

  openSlots.forEach((slot) => {
    slot.allowedPositions.forEach((position) => {
      frequency.set(position, (frequency.get(position) ?? 0) + 1);
    });
  });

  return [...frequency.entries()].sort((a, b) => b[1] - a[1]).map(([position]) => position);
};

const fillRemainingChoices = (currentChoices: Player[], pool: Player[], rng: () => number) => {
  if (currentChoices.length >= 5) return currentChoices;
  const usedIds = new Set(currentChoices.map((player) => player.id));
  const remainder = pool.filter((player) => !usedIds.has(player.id));
  return [...currentChoices, ...weightedSampleWithoutReplacement(remainder, 5 - currentChoices.length, rng)];
};

const chooseTierProfile = (rng: () => number) => {
  const totalWeight = choiceTierProfiles.reduce((sum, profile) => sum + profile.weight, 0);
  let threshold = rng() * totalWeight;

  for (const profile of choiceTierProfiles) {
    threshold -= profile.weight;
    if (threshold <= 0) return profile.slots;
  }

  return choiceTierProfiles[choiceTierProfiles.length - 1].slots;
};

const shuffleChoices = (choices: Player[], rng: () => number) => {
  const shuffled = [...choices];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

export const generateChoices = (roster: RosterSlot[], draftedPlayerIds: string[], seed: number, pickNumber: number) => {
  const rng = mulberry32(seed + pickNumber * 9973);
  const draftedIdentityKeys = new Set(
    draftedPlayerIds
      .map((id) => playerById.get(id))
      .filter((player): player is Player => Boolean(player))
      .map((player) => getPlayerIdentityKey(player)),
  );
  const availablePool = allPlayers.filter(
    (player) =>
      !draftedPlayerIds.includes(player.id) &&
      !draftedIdentityKeys.has(getPlayerIdentityKey(player)),
  );
  const neededPositions = chooseNeededPositions(roster);
  const profile = chooseTierProfile(rng);
  const choices: Player[] = [];
  const usedIds = new Set<string>();

  for (const [tier, count] of Object.entries(profile)) {
    if (count <= 0) continue;
    const tierPool = availablePool.filter(
      (player) =>
        getPlayerTier(player) === tier &&
        !usedIds.has(player.id) &&
        getPlayerPositions(player).some((position) => neededPositions.includes(position)),
    );
    weightedSampleWithoutReplacement(tierPool, count, rng).forEach((player) => {
      choices.push(player);
      usedIds.add(player.id);
    });
  }

  const fallbackPool = availablePool.filter((player) => !usedIds.has(player.id));
  const completed = fillRemainingChoices(choices, fallbackPool, rng);

  return shuffleChoices(completed.slice(0, 5), rng);
};
