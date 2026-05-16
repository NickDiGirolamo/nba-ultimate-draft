import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryChallengeSelection, DailyRogueChallengeProgress, DraftChallengeSelection, DraftState, Player, PlayerTier, PrestigeChallengeDefinition, RareEventSelection, RoguePersonalBests, RunHistoryEntry, Screen } from "../types";
import { STORAGE_KEY, assignPlayerToRoster, createSeed, generateChoices, rosterTemplate } from "../lib/draft";
import { allPlayers } from "../data/players";
import { evaluateDraftChemistry, getCategoryChallengeTarget, runSeasonSimulation } from "../lib/simulate";
import {
  applyMetaProgressBonus,
  buildPrestigeChallengeId,
  calculateRunEconomyRewards,
  buildMetaProgress,
  getCategoryChallengeById,
  getDraftChallengeById,
  getPrestigeChallengeDefinitionById,
  getRareEventById,
  hasPrestigeReward,
  prestigeRewardDefinitions,
  selectCategoryChallenge,
  selectCompatibleCategoryChallenge,
  selectCompatibleRareEvent,
  selectDraftChallenge,
  selectRareEvent,
  standardRareEvent,
} from "../lib/meta";
import { mulberry32 } from "../lib/random";
import {
  COLLECTION_REWARD_TOKENS,
  buildCollectionProgress,
  getRogueCollectionEntryIdsForRoster,
  type CollectionFamilyId,
} from "../lib/collections";
import {
  getCompletedRogueMilestoneChallengeIds,
  createDefaultDailyRogueChallengeProgress,
  getCompletedDailyRogueChallengeIds,
  getClaimedRogueChallengeRewardTotal,
  getLocalDailyChallengeDate,
  getRogueChallengeById,
  isDailyRogueChallengeId,
  isValidRogueChallengeId,
  normalizeDailyRogueChallengeProgress,
} from "../lib/rogueChallenges";
import { roguelikeCoaches } from "../lib/roguelike";
import { getRoguePackPlayerPool } from "../lib/tokenStore";
import { getPlayerTier } from "../lib/playerTier";
import type { UserStoreUnlockQuantities } from "../lib/cloudSave";

const HISTORY_LIMIT = 24;
const VERIFIED_COLLECTION_STORAGE_KEY = "nba-ultimate-draft-verified-collection-player-ids-v1";
const LEGACY_COLLECTION_TRUST_LIMIT = 8;
const STORE_UNLOCK_IDS = [
  "training-camp-ticket",
  "trade-phone",
  "mid-season-coach-change",
  "silver-starter-pack",
  "gold-starter-pack",
  "platinum-starter-pack",
  "coach-recruitment",
  "opening-locker-cash-1",
  "opening-locker-cash-2",
  "opening-locker-cash-3",
  "extra-draft-shuffle",
  "starter-pack-choice-plus",
] as const;
const DEFAULT_METRICS = {
  overall: 0,
  offense: 0,
  defense: 0,
  playmaking: 0,
  shooting: 0,
  rebounding: 0,
  athleticism: 0,
  depth: 0,
  starPower: 0,
  chemistry: 0,
  variance: 0,
  spacing: 0,
  rimProtection: 0,
  wingDefense: 0,
  benchScoring: 0,
};

const DEFAULT_ROGUE_PERSONAL_BESTS: RoguePersonalBests = {
  furthestFloor: 0,
  overall: 0,
  offense: 0,
  defense: 0,
  chemistry: 0,
  hardestDifficulty: "normal",
  hardestDifficultyFloor: 0,
};

const createTodayDailyChallengeProgress = () => createDefaultDailyRogueChallengeProgress();

const ensureCurrentDailyChallengeState = (state: DraftState): DraftState => {
  const today = getLocalDailyChallengeDate();

  if (state.dailyChallengeDate !== today) {
    return {
      ...state,
      dailyChallengeDate: today,
      dailyChallengeProgress: createTodayDailyChallengeProgress(),
      claimedDailyChallengeIds: [],
    };
  }

  const dailyChallengeProgress = normalizeDailyRogueChallengeProgress(state.dailyChallengeProgress);
  const claimedDailyChallengeIds = Array.isArray(state.claimedDailyChallengeIds)
    ? state.claimedDailyChallengeIds.filter(isDailyRogueChallengeId)
    : [];
  const progressUnchanged =
    dailyChallengeProgress.login === state.dailyChallengeProgress.login &&
    dailyChallengeProgress.bossWins === state.dailyChallengeProgress.bossWins &&
    dailyChallengeProgress.packsOpened === state.dailyChallengeProgress.packsOpened &&
    dailyChallengeProgress.yearTwoFinalsClears === state.dailyChallengeProgress.yearTwoFinalsClears;
  const claimedUnchanged =
    claimedDailyChallengeIds.length === state.claimedDailyChallengeIds.length &&
    claimedDailyChallengeIds.every((challengeId, index) => challengeId === state.claimedDailyChallengeIds[index]);

  if (progressUnchanged && claimedUnchanged) return state;

  return {
    ...state,
    dailyChallengeProgress,
    claimedDailyChallengeIds,
  };
};

const ROGUE_DIFFICULTY_RANK: Record<string, number> = {
  normal: 0,
  "all-star": 1,
  superstar: 2,
  "all-time": 3,
  goat: 4,
};

const shouldReplaceRogueDifficultyBest = (
  currentDifficulty: string | undefined,
  currentFloor: number | undefined,
  nextDifficulty: string | undefined,
  nextFloor: number | undefined,
) => {
  const currentRank = ROGUE_DIFFICULTY_RANK[currentDifficulty ?? "normal"] ?? 0;
  const nextRank = ROGUE_DIFFICULTY_RANK[nextDifficulty ?? "normal"] ?? 0;

  if (nextRank !== currentRank) return nextRank > currentRank;
  return (nextFloor ?? 0) > (currentFloor ?? 0);
};

const LEGACY_PLAYER_ID_MIGRATIONS: Record<string, string> = {
  "dwyane-wade-young": "dwayne-wade-03-10",
  "dwyane-wade-big-3": "dwayne-wade-10-14",
  "lebron-james-young-cavaliers": "lebron-james-03-10",
  "lebron-james": "lebron-james-14-18",
  "lebron-james-2nd-cavaliers": "lebron-james-14-18",
  "shaquille-o-neal": "shaquille-o-neal-lakers",
  "kobe-bryant": "kobe-bryant-24",
  "kevin-durant": "kevin-durant-warriors",
  "kareem-abdul-jabbar": "kareem-abdul-jabbar-lakers",
  "ray-allen": "ray-allen-sonics",
  "kevin-garnett": "kevin-garnett-timberwolves",
  "dwyane-wade": "dwyane-wade-big-3",
  "chris-paul": "chris-paul-clippers",
  "chris-bosh": "chris-bosh-heat",
  "carmelo-anthony": "carmelo-anthony-nuggets",
  "tracy-mcgrady": "tracy-mcgrady-rockets",
  "vince-carter": "vince-carter-raptors",
  "dennis-rodman": "dennis-rodman-bulls",
  "charles-barkley": "charles-barkley-suns",
  "clyde-drexler": "clyde-drexler-blazers",
  "james-harden": "james-harden-rockets",
  "luka-doncic": "luka-doncic-2025-26",
  "anthony-davis": "anthony-davis-pelicans",
  "kawhi-leonard": "kawhi-leonard-raptors",
  "pascal-siakam": "pascal-siakam-raptors",
  "kevin-love": "kevin-love-timberwolves",
  "kyrie-irving": "kyrie-irving-cavs",
  "allen-iverson": "allen-iverson-76ers",
  "amar-e-stoudemire": "amar-e-stoudemire-suns",
  "sharif-abdur-rahim": "shareef-abdour-rahim",
  "karl-anthony-towns-timberwolves": "karl-anthony-towns-wolves",
  "gus-williams-super-sonics": "gus-williams-sonics",
};

const LEGACY_PLAYER_NAME_MIGRATIONS: Record<string, string> = {
  "Dwyane Wade (Young)": "Dwayne Wade ('03 - '10)",
  "Dwyane Wade (Big 3)": "Dwayne Wade ('10 - '14)",
  "LeBron James (Young Cavaliers)": "LeBron James ('03 - '10)",
  "LeBron James": "LeBron James ('14 - '18)",
  "James Harden": "James Harden (Rockets)",
  "LeBron James (2nd Cavaliers)": "LeBron James ('14 - '18)",
  "Shaquille O'Neal": "Shaquille O'Neal (Lakers)",
  "Kobe Bryant": "Kobe Bryant (#24)",
  "Kevin Durant": "Kevin Durant (Warriors)",
  "Kareem Abdul-Jabbar": "Kareem Abdul-Jabbar (Lakers)",
  "Ray Allen": "Ray Allen (Sonics)",
  "Kevin Garnett": "Kevin Garnett (Timberwolves)",
  "Dwyane Wade": "Dwayne Wade ('10 - '14)",
  "Chris Bosh": "Chris Bosh (Heat)",
  "Chris Paul": "Chris Paul (Clippers)",
  "Carmelo Anthony": "Carmelo Anthony (Nuggets)",
  "Tracy McGrady": "Tracy McGrady (Rockets)",
  "Vince Carter": "Vince Carter (Raptors)",
  "Dennis Rodman": "Dennis Rodman (Bulls)",
  "Charles Barkley": "Charles Barkley (Suns)",
  "Clyde Drexler": "Clyde Drexler (Blazers)",
  "Luka Doncic": "Luka Doncic (2025-26)",
  "Anthony Davis": "Anthony Davis (Pelicans)",
  "Kawhi Leonard": "Kawhi Leonard (Raptors)",
  "Pascal Siakam": "Pascal Siakam (Raptors)",
  "Kevin Love": "Kevin Love (Timberwolves)",
  "Kyrie Irving": "Kyrie Irving (Cavs)",
  "Allen Iverson": "Allen Iverson (76ers)",
  "Amar'e Stoudemire": "Amar'e Stoudemire (Suns)",
  "Sharif Abdur-Rahim": "Shareef Abdour-Rahim",
  "Karl-Anthony Towns (Timberwolves)": "Karl-Anthony Towns (Wolves)",
  "Gus Williams (SuperSonics)": "Gus Williams (Sonics)",
};

const canonicalPlayersById = new Map(allPlayers.map((player) => [player.id, player]));
const canonicalPlayersByName = new Map(allPlayers.map((player) => [player.name, player]));
const validRoguelikeCoachIds = new Set(roguelikeCoaches.map((coach) => coach.id));
const exchangeRewardTierByInputTier: Partial<Record<PlayerTier, PlayerTier>> = {
  Emerald: "Sapphire",
  Sapphire: "Ruby",
  Ruby: "Amethyst",
};

const normalizePlayer = (player: Player | null | undefined): Player | null => {
  if (!player) return null;

  const migratedId = LEGACY_PLAYER_ID_MIGRATIONS[player.id] ?? player.id;
  const migratedName = LEGACY_PLAYER_NAME_MIGRATIONS[player.name] ?? player.name;

  return (
    canonicalPlayersById.get(migratedId) ??
    canonicalPlayersByName.get(migratedName) ??
    canonicalPlayersById.get(player.id) ??
    canonicalPlayersByName.get(player.name) ??
    player
  );
};

const normalizePlayerIds = (playerIds: string[]) =>
  playerIds.map((id) => LEGACY_PLAYER_ID_MIGRATIONS[id] ?? id);

const readVerifiedCollectionPlayerIds = () => {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(VERIFIED_COLLECTION_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as unknown;
    return Array.isArray(parsed)
      ? Array.from(
          new Set(normalizePlayerIds(parsed.filter((playerId): playerId is string => typeof playerId === "string"))),
        )
      : null;
  } catch {
    return null;
  }
};

const writeVerifiedCollectionPlayerIds = (playerIds: string[]) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    VERIFIED_COLLECTION_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(normalizePlayerIds(playerIds)))),
  );
};

const getNormalizedCollectionPlayerIds = (value: DraftState) => {
  const verifiedPlayerIds = readVerifiedCollectionPlayerIds();
  if (verifiedPlayerIds) return verifiedPlayerIds;

  const legacyPlayerIds = Array.isArray(value.ownedCollectionPlayerIds)
    ? Array.from(new Set(normalizePlayerIds(value.ownedCollectionPlayerIds)))
    : [];

  return legacyPlayerIds.length <= LEGACY_COLLECTION_TRUST_LIMIT ? legacyPlayerIds : [];
};

const resolveDraftChallenge = (selection: DraftChallengeSelection, rng: () => number) =>
  selection === "random"
    ? selectDraftChallenge(rng)
    : getDraftChallengeById(selection);

const resolveRareEvent = (selection: RareEventSelection, rng: () => number) => {
  if (selection === "disabled") return standardRareEvent;
  return selection === "random" ? selectRareEvent(rng) : getRareEventById(selection);
};

const resolveCategoryChallenge = (selection: CategoryChallengeSelection, rng: () => number) => {
  if (selection === "disabled") return null;
  return selection === "random" ? selectCategoryChallenge(rng) : getCategoryChallengeById(selection);
};

const resolveRunParameters = (
  draftChallengeSelection: DraftChallengeSelection,
  rareEventSelection: RareEventSelection,
  categoryChallengeSelection: CategoryChallengeSelection,
  rng: () => number,
) => {
  const challenge = resolveDraftChallenge(draftChallengeSelection, rng);
  if (challenge.id === "classic") {
    return {
      challenge,
      rareEvent: standardRareEvent,
      categoryChallenge: null,
    };
  }
  const rareEvent =
    rareEventSelection === "random"
      ? selectCompatibleRareEvent(challenge, rng)
      : resolveRareEvent(rareEventSelection, rng);
  const categoryChallenge =
    categoryChallengeSelection === "random"
      ? selectCompatibleCategoryChallenge(challenge, rareEvent, rng)
      : resolveCategoryChallenge(categoryChallengeSelection, rng);

  return { challenge, rareEvent, categoryChallenge };
};

const upgradeHistoryEntry = (entry: Record<string, unknown>): RunHistoryEntry => ({
  id: String(entry.id ?? `legacy-${Date.now()}`),
  mode: entry.mode === "category-focus" ? "category-focus" : "season",
  teamName: String(entry.teamName ?? "Legends Dynasty"),
  rosterPlayerIds: Array.isArray(entry.rosterPlayerIds)
    ? normalizePlayerIds(entry.rosterPlayerIds.map((value) => String(value)))
    : [],
  record: String(entry.record ?? "0-82"),
  wins: Number(entry.wins ?? 0),
  losses: Number(entry.losses ?? 82),
  seed: Number(entry.seed ?? 10),
  conference: (entry.conference === "West" ? "West" : "East"),
  playoffFinish: (entry.playoffFinish as RunHistoryEntry["playoffFinish"]) ?? "Missed Playoffs",
  grade: String(entry.grade ?? "C"),
  legacyScore: Number(entry.legacyScore ?? 0),
  createdAt: String(entry.createdAt ?? new Date().toLocaleDateString()),
  createdAtStamp: Number(entry.createdAtStamp ?? Date.now()),
  challengeTitle: String(entry.challengeTitle ?? "No active challenge"),
  challengeCompleted: Boolean(entry.challengeCompleted),
  challengeId: entry.challengeId ? String(entry.challengeId) : null,
  rareEventTitle: String(entry.rareEventTitle ?? "Standard environment"),
  rareEventId: entry.rareEventId ? String(entry.rareEventId) : null,
  categoryFocusId: entry.categoryFocusId ? String(entry.categoryFocusId) : null,
  categoryFocusTitle: entry.categoryFocusTitle ? String(entry.categoryFocusTitle) : null,
  prestigeChallengeId: entry.prestigeChallengeId ? String(entry.prestigeChallengeId) : null,
  prestigeChallengeTitle: entry.prestigeChallengeTitle ? String(entry.prestigeChallengeTitle) : null,
  prestigeChallengeGoal: entry.prestigeChallengeGoal ? String(entry.prestigeChallengeGoal) : null,
  prestigeChallengeCleared: Boolean(entry.prestigeChallengeCleared),
  prestigeChallengeSource:
    entry.prestigeChallengeSource === "loaded" || entry.prestigeChallengeSource === "surprise"
      ? entry.prestigeChallengeSource
      : null,
  prestigeChallengeReward:
    entry.prestigeChallengeReward === undefined || entry.prestigeChallengeReward === null
      ? null
      : Number(entry.prestigeChallengeReward),
  prestigeXpAward:
    entry.prestigeXpAward === undefined || entry.prestigeXpAward === null
      ? null
      : Number(entry.prestigeXpAward),
  tokenReward:
    entry.tokenReward === undefined || entry.tokenReward === null
      ? null
      : Number(entry.tokenReward),
  focusScore: entry.focusScore === undefined || entry.focusScore === null ? null : Number(entry.focusScore),
  titleOdds: Number(entry.titleOdds ?? 0),
  metrics: (entry.metrics as RunHistoryEntry["metrics"]) ?? DEFAULT_METRICS,
});

const upgradeSimulationResult = (
  result: DraftState["simulationResult"],
  fallbackChallenge: DraftState["currentChallenge"],
) => {
  if (!result) return null;

  return {
    ...result,
    metrics: result.metrics ?? DEFAULT_METRICS,
    challenge: result.challenge ?? fallbackChallenge,
    challengeCompleted: result.challengeCompleted ?? false,
    challengeReward: result.challengeReward ?? 0,
    rareEvent: result.rareEvent ?? standardRareEvent,
    rareEventBonus: result.rareEventBonus ?? {
      offense: 0,
      defense: 0,
      chemistryStructure: 0,
      chemistry: 0,
      summary: "Standard environment.",
    },
    chemistryBonuses: result.chemistryBonuses ?? [],
    chemistryScore: result.chemistryScore ?? 0,
    leagueContext: result.leagueContext ?? "",
    leagueLandscape: result.leagueLandscape ?? [],
    playoffBracket: result.playoffBracket ?? null,
    eliminatedBy: result.eliminatedBy ?? null,
    signatureWin: result.signatureWin ?? null,
    strengths: result.strengths ?? [],
    weaknesses: result.weaknesses ?? [],
    newPersonalBests: result.newPersonalBests ?? [],
  };
};

const createInitialState = (): DraftState => {
  const seed = createSeed();
  const roster = rosterTemplate();
  const rng = mulberry32(seed + 77);
  const draftChallengeSelection: DraftChallengeSelection = "random";
  const rareEventSelection: RareEventSelection = "random";
  const categoryChallengeSelection: CategoryChallengeSelection = "random";
  const rareEventsEnabled = rareEventSelection !== "disabled";
  const categoryChallengesEnabled = categoryChallengeSelection !== "disabled";
  const resolvedParameters = resolveRunParameters(
    draftChallengeSelection,
    rareEventSelection,
    categoryChallengeSelection,
    rng,
  );

  return {
    screen: "landing",
    roster,
    currentChoices: generateChoices(roster, [], seed, 1),
    availablePlayers: [],
    draftedPlayerIds: [],
    pickNumber: 1,
    selectedPlayerId: null,
    lastFilledSlot: null,
    simulationResult: null,
    selectedSlotIndex: null,
    history: [],
    unlockedPlayerIds: [],
    draftChallengeSelection,
    currentChallenge: resolvedParameters.challenge,
    rareEventSelection,
    currentRareEvent: resolvedParameters.rareEvent,
    rareEventsEnabled,
    categoryChallengesEnabled,
    categoryChallengeSelection,
    currentCategoryChallenge: resolvedParameters.categoryChallenge,
    activePrestigeChallengeId: null,
    activePrestigeChallengeTitle: null,
    activePrestigeChallengeGoal: null,
    activePrestigeChallengeReward: 0,
    bonusPickAvailable: false,
    bonusPickUsed: false,
    bonusPickActive: false,
    rogueBonusPrestigeXp: 0,
    roguePersonalBests: DEFAULT_ROGUE_PERSONAL_BESTS,
    rogueRunsStarted: 0,
    rogueRunPlayersDrafted: 0,
    rogueRunDraftedPlayerIds: [],
    spentTokens: 0,
    purchasedTokens: 0,
    ownedTrainingCampTickets: 0,
    ownedTradePhones: 0,
    ownedMidSeasonCoachChanges: 0,
    ownedSilverStarterPacks: 0,
    ownedGoldStarterPacks: 0,
    ownedPlatinumStarterPacks: 0,
    ownedCoachRecruitment: 0,
    ownedOpeningLockerCashTier: 0,
    ownedExtraDraftShuffle: 0,
    ownedStarterPackChoicePlus: 0,
    ownedCoachIds: [],
    ownedRogueStarIds: [],
    activeRogueStarId: null,
    ownedCollectionPlayerIds: [],
    exchangedCollectionPlayerIds: [],
    rogueCollectedCollectionEntryIds: [],
    claimedCollectionRewardIds: [],
    completedRogueChallengeIds: [],
    claimedRogueChallengeIds: [],
    rogueChallengePackRewardPlayerIds: {},
    dailyChallengeDate: getLocalDailyChallengeDate(),
    dailyChallengeProgress: createTodayDailyChallengeProgress(),
    claimedDailyChallengeIds: [],
    seed,
  };
};

const normalizeState = (value: DraftState): DraftState => {
  const seed = value.seed ?? createSeed();
  const rng = mulberry32(seed + 77);
  const normalizedDraftChallengeSelection = value.draftChallengeSelection ?? "random";
  const normalizedRareEventSelection =
    value.rareEventSelection ??
    ((value.rareEventsEnabled ?? true) ? "random" : "disabled");
  const normalizedCategoryChallengeSelection =
    value.categoryChallengeSelection ?? ((value.categoryChallengesEnabled ?? true) ? "random" : "disabled");
  const resolvedParameters = resolveRunParameters(
    normalizedDraftChallengeSelection,
    normalizedRareEventSelection,
    normalizedCategoryChallengeSelection,
    rng,
  );
  const exchangedCollectionPlayerIds = Array.isArray(value.exchangedCollectionPlayerIds)
    ? normalizePlayerIds(value.exchangedCollectionPlayerIds)
    : [];
  const exchangedCollectionPlayerIdSet = new Set(exchangedCollectionPlayerIds);

  return ensureCurrentDailyChallengeState({
    ...createInitialState(),
    ...value,
    history: Array.isArray(value.history) ? value.history.map((entry) => upgradeHistoryEntry(entry as unknown as Record<string, unknown>)) : [],
    simulationResult: upgradeSimulationResult(
      value.simulationResult,
      value.currentChallenge ?? resolvedParameters.challenge,
    ),
    roster: Array.isArray(value.roster)
      ? value.roster.map((slot) => ({
          ...slot,
          player: normalizePlayer(slot.player),
        }))
      : rosterTemplate(),
    currentChoices: Array.isArray(value.currentChoices)
      ? value.currentChoices.map((player) => normalizePlayer(player)).filter((player): player is Player => Boolean(player))
      : [],
    availablePlayers: Array.isArray(value.availablePlayers)
      ? value.availablePlayers.map((player) => normalizePlayer(player)).filter((player): player is Player => Boolean(player))
      : [],
    draftedPlayerIds: Array.isArray(value.draftedPlayerIds) ? normalizePlayerIds(value.draftedPlayerIds) : [],
    unlockedPlayerIds: Array.isArray(value.unlockedPlayerIds) ? normalizePlayerIds(value.unlockedPlayerIds) : [],
    draftChallengeSelection: normalizedDraftChallengeSelection,
    currentChallenge: value.currentChallenge ?? resolvedParameters.challenge,
    rareEventSelection: normalizedRareEventSelection,
    rareEventsEnabled:
      value.rareEventsEnabled ??
      (normalizedRareEventSelection !== "disabled"),
    currentRareEvent:
      value.currentRareEvent ?? resolvedParameters.rareEvent,
    categoryChallengesEnabled: value.categoryChallengesEnabled ?? true,
    categoryChallengeSelection: normalizedCategoryChallengeSelection,
    currentCategoryChallenge:
      value.currentCategoryChallenge ?? resolvedParameters.categoryChallenge,
    bonusPickAvailable: value.bonusPickAvailable ?? false,
    bonusPickUsed: value.bonusPickUsed ?? false,
    bonusPickActive: value.bonusPickActive ?? false,
    rogueBonusPrestigeXp: value.rogueBonusPrestigeXp ?? 0,
    roguePersonalBests: {
      ...DEFAULT_ROGUE_PERSONAL_BESTS,
      ...(value.roguePersonalBests ?? {}),
    },
    rogueRunsStarted: Math.max(0, Math.floor(value.rogueRunsStarted ?? 0)),
    rogueRunPlayersDrafted: Math.max(0, Math.floor(value.rogueRunPlayersDrafted ?? 0)),
    rogueRunDraftedPlayerIds: Array.isArray(value.rogueRunDraftedPlayerIds)
      ? normalizePlayerIds(value.rogueRunDraftedPlayerIds)
      : [],
    spentTokens: value.spentTokens ?? 0,
    purchasedTokens: value.purchasedTokens ?? 0,
    ownedTrainingCampTickets: value.ownedTrainingCampTickets ?? 0,
    ownedTradePhones: value.ownedTradePhones ?? 0,
    ownedMidSeasonCoachChanges: value.ownedMidSeasonCoachChanges ?? 0,
    ownedSilverStarterPacks: value.ownedSilverStarterPacks ?? 0,
    ownedGoldStarterPacks: value.ownedGoldStarterPacks ?? 0,
    ownedPlatinumStarterPacks: value.ownedPlatinumStarterPacks ?? 0,
    ownedCoachRecruitment: value.ownedCoachRecruitment ?? 0,
    ownedOpeningLockerCashTier: Math.min(3, Math.max(0, value.ownedOpeningLockerCashTier ?? 0)),
    ownedExtraDraftShuffle: value.ownedExtraDraftShuffle ?? 0,
    ownedStarterPackChoicePlus: value.ownedStarterPackChoicePlus ?? 0,
    ownedCoachIds: Array.isArray(value.ownedCoachIds)
      ? value.ownedCoachIds.filter((coachId): coachId is string => typeof coachId === "string" && validRoguelikeCoachIds.has(coachId))
      : [],
    ownedRogueStarIds: Array.isArray(value.ownedRogueStarIds)
      ? normalizePlayerIds(value.ownedRogueStarIds).filter((playerId) => !exchangedCollectionPlayerIdSet.has(playerId))
      : [],
    activeRogueStarId:
      typeof value.activeRogueStarId === "string" &&
      !exchangedCollectionPlayerIdSet.has(LEGACY_PLAYER_ID_MIGRATIONS[value.activeRogueStarId] ?? value.activeRogueStarId)
        ? LEGACY_PLAYER_ID_MIGRATIONS[value.activeRogueStarId] ?? value.activeRogueStarId
        : null,
    ownedCollectionPlayerIds: getNormalizedCollectionPlayerIds(value).filter(
      (playerId) => !exchangedCollectionPlayerIdSet.has(playerId),
    ),
    exchangedCollectionPlayerIds,
    rogueCollectedCollectionEntryIds: Array.isArray(value.rogueCollectedCollectionEntryIds)
      ? value.rogueCollectedCollectionEntryIds.filter((entryId): entryId is string => typeof entryId === "string")
      : [],
    claimedCollectionRewardIds: Array.isArray(value.claimedCollectionRewardIds)
      ? value.claimedCollectionRewardIds.filter((entryId): entryId is string => typeof entryId === "string")
      : [],
    completedRogueChallengeIds: Array.isArray(value.completedRogueChallengeIds)
      ? value.completedRogueChallengeIds.filter((challengeId): challengeId is string => typeof challengeId === "string" && isValidRogueChallengeId(challengeId) && !isDailyRogueChallengeId(challengeId))
      : [],
    claimedRogueChallengeIds: Array.isArray(value.claimedRogueChallengeIds)
      ? value.claimedRogueChallengeIds.filter((challengeId): challengeId is string => typeof challengeId === "string" && isValidRogueChallengeId(challengeId) && !isDailyRogueChallengeId(challengeId))
      : [],
    rogueChallengePackRewardPlayerIds:
      value.rogueChallengePackRewardPlayerIds && typeof value.rogueChallengePackRewardPlayerIds === "object"
        ? Object.fromEntries(
            Object.entries(value.rogueChallengePackRewardPlayerIds).filter(([challengeId, playerId]) =>
              typeof challengeId === "string" &&
              typeof playerId === "string" &&
              isValidRogueChallengeId(challengeId) &&
              !isDailyRogueChallengeId(challengeId) &&
              allPlayers.some((player) => player.id === playerId),
            ),
          )
        : {},
    dailyChallengeDate:
      typeof value.dailyChallengeDate === "string" ? value.dailyChallengeDate : getLocalDailyChallengeDate(),
    dailyChallengeProgress: normalizeDailyRogueChallengeProgress(value.dailyChallengeProgress),
    claimedDailyChallengeIds: Array.isArray(value.claimedDailyChallengeIds)
      ? value.claimedDailyChallengeIds.filter(isDailyRogueChallengeId)
      : [],
    seed,
  });
};

const getDisplayedTokenBalanceForState = (draftState: DraftState) => {
  const boostedMeta = applyMetaProgressBonus(
    buildMetaProgress(draftState.history, draftState.unlockedPlayerIds, draftState.roguePersonalBests),
    draftState.rogueBonusPrestigeXp,
  );

  return Math.max(
    0,
    boostedMeta.tokens.balance +
      draftState.claimedCollectionRewardIds.length * COLLECTION_REWARD_TOKENS -
      draftState.spentTokens +
      draftState.purchasedTokens +
      getClaimedRogueChallengeRewardTotal(draftState.claimedRogueChallengeIds),
  );
};

const getRogueChallengeRewardPlayerIds = (challengeIds: string[]) =>
  Array.from(
    new Set(
      challengeIds
        .map((challengeId) => getRogueChallengeById(challengeId)?.rewardPlayerId)
        .filter((playerId): playerId is string =>
          Boolean(playerId) && allPlayers.some((player) => player.id === playerId),
        ),
    ),
  );

const drawRogueChallengePackRewardPlayerId = (
  tier: PlayerTier,
  draftState: Pick<DraftState, "ownedRogueStarIds" | "ownedCollectionPlayerIds" | "rogueChallengePackRewardPlayerIds">,
) => {
  const excludedPlayerIds = Array.from(
    new Set([
      ...draftState.ownedRogueStarIds,
      ...draftState.ownedCollectionPlayerIds,
      ...Object.values(draftState.rogueChallengePackRewardPlayerIds ?? {}),
    ]),
  );
  const packPool = getRoguePackPlayerPool(tier, excludedPlayerIds);
  return packPool[Math.floor(Math.random() * packPool.length)]?.id ?? null;
};

const getStoreUnlockQuantity = (
  unlocks: UserStoreUnlockQuantities,
  unlockId: (typeof STORE_UNLOCK_IDS)[number],
) => Math.max(0, Math.floor(unlocks[unlockId] ?? 0));

const getOpeningLockerCashTierFromUnlocks = (unlocks: UserStoreUnlockQuantities) => {
  if (getStoreUnlockQuantity(unlocks, "opening-locker-cash-3") > 0) return 3;
  if (getStoreUnlockQuantity(unlocks, "opening-locker-cash-2") > 0) return 2;
  if (getStoreUnlockQuantity(unlocks, "opening-locker-cash-1") > 0) return 1;
  return 0;
};

export const getStoreUnlockQuantitiesForState = (draftState: DraftState): UserStoreUnlockQuantities => ({
  "training-camp-ticket": draftState.ownedTrainingCampTickets,
  "trade-phone": draftState.ownedTradePhones,
  "mid-season-coach-change": draftState.ownedMidSeasonCoachChanges,
  "silver-starter-pack": draftState.ownedSilverStarterPacks,
  "gold-starter-pack": draftState.ownedGoldStarterPacks,
  "platinum-starter-pack": draftState.ownedPlatinumStarterPacks,
  "coach-recruitment": draftState.ownedCoachRecruitment,
  "opening-locker-cash-1": draftState.ownedOpeningLockerCashTier >= 1 ? 1 : 0,
  "opening-locker-cash-2": draftState.ownedOpeningLockerCashTier >= 2 ? 1 : 0,
  "opening-locker-cash-3": draftState.ownedOpeningLockerCashTier >= 3 ? 1 : 0,
  "extra-draft-shuffle": draftState.ownedExtraDraftShuffle,
  "starter-pack-choice-plus": draftState.ownedStarterPackChoicePlus,
});

export const useDraftGame = () => {
  const [state, setState] = useState<DraftState>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();

    try {
      return normalizeState(JSON.parse(saved) as DraftState);
    } catch {
      return createInitialState();
    }
  });

  useEffect(() => {
    if (readVerifiedCollectionPlayerIds() !== null) return;
    if (state.ownedCollectionPlayerIds.length <= LEGACY_COLLECTION_TRUST_LIMIT) return;

    setState((current) => ({
      ...current,
      ownedCollectionPlayerIds: [],
    }));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const refreshDailyChallengeDate = () => {
      setState((current) => {
        const next = ensureCurrentDailyChallengeState(current);
        return next === current ? current : next;
      });
    };

    refreshDailyChallengeDate();
    const intervalId = window.setInterval(refreshDailyChallengeDate, 60_000);
    window.addEventListener("focus", refreshDailyChallengeDate);
    document.addEventListener("visibilitychange", refreshDailyChallengeDate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshDailyChallengeDate);
      document.removeEventListener("visibilitychange", refreshDailyChallengeDate);
    };
  }, []);

  useEffect(() => {
    if (
      readVerifiedCollectionPlayerIds() === null &&
      state.ownedCollectionPlayerIds.length > LEGACY_COLLECTION_TRUST_LIMIT
    ) {
      return;
    }

    writeVerifiedCollectionPlayerIds(state.ownedCollectionPlayerIds);
  }, [state.ownedCollectionPlayerIds]);

  const completedRoster = useMemo(() => state.roster.every((slot) => slot.player !== null), [state.roster]);
  const metaProgress = useMemo(
    () => {
      const boostedMeta = applyMetaProgressBonus(
        buildMetaProgress(state.history, state.unlockedPlayerIds, state.roguePersonalBests),
        state.rogueBonusPrestigeXp,
      );

      return {
        ...boostedMeta,
        rogueMilestones: {
          runsStarted: Math.max(0, Math.floor(state.rogueRunsStarted ?? 0)),
          playersDrafted: Math.max(0, Math.floor(state.rogueRunPlayersDrafted ?? 0)),
          uniquePlayersDrafted: state.rogueRunDraftedPlayerIds.length,
          collectionPlayers: state.ownedCollectionPlayerIds.length,
          totalPlayers: allPlayers.length,
        },
        tokens: {
          ...boostedMeta.tokens,
          lifetimeEarned:
            boostedMeta.tokens.lifetimeEarned +
            state.purchasedTokens +
            state.claimedCollectionRewardIds.length * COLLECTION_REWARD_TOKENS +
            getClaimedRogueChallengeRewardTotal(state.claimedRogueChallengeIds),
          balance: Math.max(
            0,
            boostedMeta.tokens.balance +
              state.claimedCollectionRewardIds.length * COLLECTION_REWARD_TOKENS -
              state.spentTokens +
              state.purchasedTokens +
              getClaimedRogueChallengeRewardTotal(state.claimedRogueChallengeIds),
          ),
        },
      };
    },
    [
      state.history,
      state.unlockedPlayerIds,
      state.roguePersonalBests,
      state.rogueRunsStarted,
      state.rogueRunPlayersDrafted,
      state.rogueRunDraftedPlayerIds.length,
      state.ownedCollectionPlayerIds.length,
      state.rogueBonusPrestigeXp,
      state.purchasedTokens,
      state.claimedCollectionRewardIds.length,
      state.claimedRogueChallengeIds,
      state.spentTokens,
    ],
  );

  const completedDailyChallengeIds = useMemo(
    () => getCompletedDailyRogueChallengeIds(state.dailyChallengeProgress),
    [
      state.dailyChallengeProgress.login,
      state.dailyChallengeProgress.bossWins,
      state.dailyChallengeProgress.packsOpened,
      state.dailyChallengeProgress.yearTwoFinalsClears,
    ],
  );

  useEffect(() => {
    const milestoneChallengeIds = getCompletedRogueMilestoneChallengeIds(metaProgress);
    if (milestoneChallengeIds.length === 0) return;

    setState((current) => {
      const mergedChallengeIds = Array.from(
        new Set([...current.completedRogueChallengeIds, ...milestoneChallengeIds]),
      );

      if (mergedChallengeIds.length === current.completedRogueChallengeIds.length) {
        return current;
      }

      return {
        ...current,
        completedRogueChallengeIds: mergedChallengeIds,
      };
    });
  }, [
    metaProgress.roguePersonalBests.furthestFloor,
    metaProgress.roguePersonalBests.overall,
    metaProgress.roguePersonalBests.offense,
    metaProgress.roguePersonalBests.defense,
    metaProgress.roguePersonalBests.chemistry,
    metaProgress.rogueMilestones.runsStarted,
    metaProgress.rogueMilestones.playersDrafted,
    metaProgress.rogueMilestones.uniquePlayersDrafted,
    metaProgress.rogueMilestones.collectionPlayers,
    state.completedRogueChallengeIds,
  ]);

  useEffect(() => {
    const rewardPlayerIds = getRogueChallengeRewardPlayerIds(state.claimedRogueChallengeIds);
    if (rewardPlayerIds.length === 0) return;

    setState((current) => {
      const exchangedPlayerIds = new Set(current.exchangedCollectionPlayerIds);
      const currentRewardPlayerIds = getRogueChallengeRewardPlayerIds(current.claimedRogueChallengeIds).filter(
        (playerId) => !exchangedPlayerIds.has(playerId),
      );
      const ownedRogueStarIds = Array.from(
        new Set([...current.ownedRogueStarIds, ...currentRewardPlayerIds]),
      );
      const ownedCollectionPlayerIds = Array.from(
        new Set([...current.ownedCollectionPlayerIds, ...currentRewardPlayerIds]),
      );

      if (
        ownedRogueStarIds.length === current.ownedRogueStarIds.length &&
        ownedCollectionPlayerIds.length === current.ownedCollectionPlayerIds.length
      ) {
        return current;
      }

      return {
        ...current,
        ownedRogueStarIds,
        ownedCollectionPlayerIds,
      };
    });
  }, [
    state.claimedRogueChallengeIds,
    state.exchangedCollectionPlayerIds,
    state.ownedCollectionPlayerIds,
    state.ownedRogueStarIds,
  ]);

  useEffect(() => {
    const pendingPackRewardChallengeIds = state.claimedRogueChallengeIds.filter((challengeId) => {
      const challenge = getRogueChallengeById(challengeId);
      return Boolean(challenge?.rewardPackTier) && !state.rogueChallengePackRewardPlayerIds[challengeId];
    });
    if (pendingPackRewardChallengeIds.length === 0) return;

    setState((current) => {
      const nextPackRewardPlayerIds = { ...current.rogueChallengePackRewardPlayerIds };
      const packPlayerIds: string[] = [];

      pendingPackRewardChallengeIds.forEach((challengeId) => {
        if (nextPackRewardPlayerIds[challengeId]) return;
        const challenge = getRogueChallengeById(challengeId);
        if (!challenge?.rewardPackTier) return;

        const playerId = drawRogueChallengePackRewardPlayerId(challenge.rewardPackTier, {
          ...current,
          rogueChallengePackRewardPlayerIds: nextPackRewardPlayerIds,
        });
        if (!playerId) return;

        nextPackRewardPlayerIds[challengeId] = playerId;
        packPlayerIds.push(playerId);
      });

      if (packPlayerIds.length === 0) return current;

      return {
        ...current,
        rogueChallengePackRewardPlayerIds: nextPackRewardPlayerIds,
        ownedRogueStarIds: Array.from(new Set([...current.ownedRogueStarIds, ...packPlayerIds])),
        ownedCollectionPlayerIds: Array.from(new Set([...current.ownedCollectionPlayerIds, ...packPlayerIds])),
        exchangedCollectionPlayerIds: current.exchangedCollectionPlayerIds.filter(
          (playerId) => !packPlayerIds.includes(playerId),
        ),
      };
    });
  }, [
    state.claimedRogueChallengeIds,
    state.exchangedCollectionPlayerIds,
    state.ownedCollectionPlayerIds,
    state.ownedRogueStarIds,
    state.rogueChallengePackRewardPlayerIds,
  ]);

  const teamAverage = useMemo(() => {
    const players = state.roster.map((slot) => slot.player).filter(Boolean) as Player[];
    if (players.length === 0) return 0;
    return Math.round((players.reduce((sum, player) => sum + player.overall, 0) / players.length) * 10) / 10;
  }, [state.roster]);
  const draftChemistry = useMemo(() => evaluateDraftChemistry(state.roster), [state.roster]);

  const startDraft = () => {
    const seed = createSeed();
    const roster = rosterTemplate();
    const rng = mulberry32(seed + 77);
    const currentChoices = generateChoices(roster, [], seed, 1);
    const resolvedParameters = resolveRunParameters(
      state.draftChallengeSelection,
      state.rareEventSelection,
      state.categoryChallengeSelection,
      rng,
    );
    const hasExtraPick = hasPrestigeReward(metaProgress.prestige.level, "extra-pick");
    setState({
      ...state,
      roster,
      currentChoices,
      availablePlayers: [],
      draftedPlayerIds: [],
      pickNumber: 1,
      selectedPlayerId: null,
      lastFilledSlot: null,
      simulationResult: null,
      selectedSlotIndex: null,
      history: state.history,
      unlockedPlayerIds: state.unlockedPlayerIds,
      currentChallenge: resolvedParameters.challenge,
      currentRareEvent: resolvedParameters.rareEvent,
      currentCategoryChallenge: resolvedParameters.categoryChallenge,
      activePrestigeChallengeId: null,
      activePrestigeChallengeTitle: null,
      activePrestigeChallengeGoal: null,
      activePrestigeChallengeReward: 0,
      bonusPickAvailable: hasExtraPick,
      bonusPickUsed: false,
      bonusPickActive: false,
      seed,
      screen: "briefing",
    });
  };

  const beginDraftFromBriefing = () => {
    setState((current) => ({
      ...current,
      screen: "draft",
    }));
  };

  const draftPlayer = (player: Player) => {
    if (state.selectedPlayerId) return;

    if (state.bonusPickActive) {
      if (state.selectedSlotIndex === null) return;
      const replacedPlayer = state.roster[state.selectedSlotIndex]?.player;
      if (!replacedPlayer) return;

      const updatedRoster = state.roster.map((slot, index) =>
        index === state.selectedSlotIndex ? { ...slot, player } : slot,
      );
      const draftedPlayerIds = [
        ...state.draftedPlayerIds.filter((id) => id !== replacedPlayer.id),
        player.id,
      ];

      setState((current) => ({
        ...current,
        roster: updatedRoster,
        draftedPlayerIds,
        unlockedPlayerIds: current.unlockedPlayerIds.includes(player.id)
          ? current.unlockedPlayerIds
          : [...current.unlockedPlayerIds, player.id],
        selectedPlayerId: player.id,
        selectedSlotIndex: null,
        lastFilledSlot: updatedRoster[state.selectedSlotIndex!].slot,
        currentChoices: [],
        bonusPickUsed: true,
        bonusPickActive: false,
      }));

      window.setTimeout(() => {
        setState((current) => ({
          ...current,
          selectedPlayerId: null,
          screen: "lineup",
        }));
      }, 420);
      return;
    }

    const assignment = assignPlayerToRoster(state.roster, player);
    const draftedPlayerIds = [...state.draftedPlayerIds, player.id];
    const nextPick = state.pickNumber + 1;
    const entersBonusPick = nextPick > 10 && state.bonusPickAvailable && !state.bonusPickUsed;
    const nextChoices = entersBonusPick
      ? generateChoices(assignment.roster, draftedPlayerIds, state.seed, 11)
      : nextPick <= 10
        ? generateChoices(assignment.roster, draftedPlayerIds, state.seed, nextPick)
        : [];

    setState((current) => ({
      ...current,
      roster: assignment.roster,
      draftedPlayerIds,
      unlockedPlayerIds: current.unlockedPlayerIds.includes(player.id)
        ? current.unlockedPlayerIds
        : [...current.unlockedPlayerIds, player.id],
      selectedPlayerId: player.id,
      selectedSlotIndex: null,
      lastFilledSlot: assignment.filledSlot,
      currentChoices: nextChoices,
      pickNumber: nextPick,
      bonusPickActive: entersBonusPick,
    }));

    window.setTimeout(() => {
      setState((current) => ({
        ...current,
        selectedPlayerId: null,
        screen: entersBonusPick ? "draft" : nextPick > 10 ? "lineup" : current.screen,
      }));
    }, 420);
  };

  const beginSimulation = () => {
    if (!completedRoster) return;
    setState((current) => ({ ...current, screen: "simulating" }));

    window.setTimeout(() => {
      const previousMeta = applyMetaProgressBonus(
        buildMetaProgress(state.history, state.unlockedPlayerIds, state.roguePersonalBests),
        state.rogueBonusPrestigeXp,
      );
      const simulationResult = runSeasonSimulation(
        state.roster,
        state.seed,
        state.currentChallenge,
        state.currentRareEvent,
        state.currentCategoryChallenge,
      );
      const matchedChallengeRouteId = buildPrestigeChallengeId(
        state.currentChallenge.id,
        state.currentRareEvent.id,
        state.currentCategoryChallenge?.id ?? null,
      );
      const matchedChallengeRoute = getPrestigeChallengeDefinitionById(matchedChallengeRouteId);
      const matchedNonDefaultChallengeRoute =
        matchedChallengeRoute &&
        !(
          matchedChallengeRoute.draftChallengeId === "none" &&
          matchedChallengeRoute.rareEventId === standardRareEvent.id &&
          matchedChallengeRoute.categoryChallengeId === null
        )
          ? matchedChallengeRoute
          : null;
      const activeCategoryTarget =
        simulationResult.categoryChallenge
          ? getCategoryChallengeTarget(simulationResult.categoryChallenge.metric)
          : null;
      const routeClearAchieved =
        matchedChallengeRoute !== null
          ? simulationResult.mode === "category-focus"
            ? (simulationResult.focusScore ?? 0) >= (activeCategoryTarget ?? 95)
            : simulationResult.playoffFinish === "NBA Champion"
          : false;
      const effectivePrestigeChallengeId =
        state.activePrestigeChallengeId ??
        matchedNonDefaultChallengeRoute?.id ??
        (routeClearAchieved ? matchedChallengeRoute?.id ?? null : null);
      const effectivePrestigeChallenge =
        effectivePrestigeChallengeId !== null
          ? getPrestigeChallengeDefinitionById(effectivePrestigeChallengeId)
          : matchedChallengeRoute;
      const alreadyClearedRoutes = new Set(
        state.history
          .filter((entry) => entry.prestigeChallengeCleared)
          .map((entry) => entry.prestigeChallengeId)
          .filter((value): value is string => Boolean(value)),
      );
      const prestigeChallengeCleared =
        effectivePrestigeChallenge !== null ? routeClearAchieved : false;
      const prestigeChallengeNewlyCleared =
        prestigeChallengeCleared &&
        Boolean(effectivePrestigeChallenge?.id) &&
        !alreadyClearedRoutes.has(effectivePrestigeChallenge!.id);
      const prestigeChallengeReward = prestigeChallengeCleared
        ? effectivePrestigeChallenge?.reward ?? 0
        : state.activePrestigeChallengeReward;
      const prestigeChallengeSource =
        effectivePrestigeChallenge === null
          ? null
          : state.activePrestigeChallengeId
            ? "loaded"
            : matchedNonDefaultChallengeRoute || prestigeChallengeCleared
              ? "surprise"
              : null;
      const newPersonalBests = [
        simulationResult.mode === "season" && simulationResult.record.wins > previousMeta.personalBests.wins ? "Wins" : null,
        simulationResult.metrics.overall > previousMeta.personalBests.overall ? "Overall" : null,
        simulationResult.metrics.offense > previousMeta.personalBests.offense ? "Offense" : null,
        simulationResult.metrics.defense > previousMeta.personalBests.defense ? "Defense" : null,
        simulationResult.metrics.chemistry > previousMeta.personalBests.chemistry ? "Chemistry" : null,
        simulationResult.legacyScore > previousMeta.personalBests.legacyScore ? "Legacy Score" : null,
      ].filter((value): value is string => Boolean(value));
      const historyEntry: RunHistoryEntry = {
        id: `${state.seed}-${Date.now()}`,
        mode: simulationResult.mode,
        teamName: simulationResult.teamName,
        rosterPlayerIds: state.roster
          .map((slot) => slot.player?.id)
          .filter((value): value is string => Boolean(value)),
        record:
          simulationResult.mode === "category-focus" && simulationResult.categoryChallenge
            ? `${simulationResult.categoryChallenge.metricLabel} ${simulationResult.focusScore}`
            : `${simulationResult.record.wins}-${simulationResult.record.losses}`,
        wins: simulationResult.record.wins,
        losses: simulationResult.record.losses,
        seed: simulationResult.seed,
        conference: simulationResult.conference,
        playoffFinish: simulationResult.playoffFinish,
        grade: simulationResult.draftGrade,
        legacyScore: simulationResult.legacyScore,
        createdAt: new Date().toLocaleDateString(),
        createdAtStamp: Date.now(),
        challengeId: simulationResult.challenge.id,
        challengeTitle: simulationResult.challenge.title,
        challengeCompleted: simulationResult.challengeCompleted,
        rareEventId: simulationResult.rareEvent.id,
        rareEventTitle: simulationResult.rareEvent.title,
        categoryFocusId: simulationResult.categoryChallenge?.id ?? null,
        categoryFocusTitle: simulationResult.categoryChallenge?.metricLabel ?? null,
        prestigeChallengeId: effectivePrestigeChallenge?.id ?? null,
        prestigeChallengeTitle:
          effectivePrestigeChallenge?.title ??
          state.activePrestigeChallengeTitle,
        prestigeChallengeGoal:
          effectivePrestigeChallenge?.goal ??
          state.activePrestigeChallengeGoal,
        prestigeChallengeCleared,
        prestigeChallengeSource:
          prestigeChallengeSource === null ? null : prestigeChallengeSource,
        prestigeChallengeReward,
        prestigeXpAward: 0,
        tokenReward: 0,
        focusScore: simulationResult.focusScore,
        titleOdds: simulationResult.titleOdds,
        metrics: simulationResult.metrics,
      };
      const provisionalHistory = [historyEntry, ...state.history].slice(0, HISTORY_LIMIT);
      const { prestigeXpAward, tokenReward } = calculateRunEconomyRewards(
        state.history,
        provisionalHistory,
        state.unlockedPlayerIds,
      );
      const finalizedHistoryEntry: RunHistoryEntry = {
        ...historyEntry,
        prestigeXpAward,
        tokenReward,
      };
      const nextHistory = [finalizedHistoryEntry, ...state.history].slice(0, HISTORY_LIMIT);
      const nextMeta = applyMetaProgressBonus(
        buildMetaProgress(nextHistory, state.unlockedPlayerIds, state.roguePersonalBests),
        state.rogueBonusPrestigeXp,
      );
      const prestigeLevelUp =
        nextMeta.prestige.level > previousMeta.prestige.level
          ? {
              previousLevel: previousMeta.prestige.level,
              newLevel: nextMeta.prestige.level,
              previousScore: previousMeta.prestige.score,
              newScore: nextMeta.prestige.score,
              unlockedRewards: prestigeRewardDefinitions.filter(
                (reward) =>
                  reward.level > previousMeta.prestige.level &&
                  reward.level <= nextMeta.prestige.level,
              ),
            }
          : null;

      setState((current) => ({
        ...current,
        screen: "results",
        simulationResult: {
          ...simulationResult,
          prestigeChallengeId: effectivePrestigeChallenge?.id ?? null,
          prestigeChallengeTitle:
            effectivePrestigeChallenge?.title ??
            state.activePrestigeChallengeTitle,
          prestigeChallengeGoal:
            effectivePrestigeChallenge?.goal ??
            state.activePrestigeChallengeGoal,
          prestigeChallengeCleared,
          prestigeChallengeSource,
          prestigeChallengeNewlyCleared,
          prestigeChallengeReward,
          prestigeXpAward,
          tokenReward,
          prestigeLevelUp,
          newPersonalBests,
        },
        history: nextHistory,
      }));
    }, 3200);
  };

  const handleRosterSlotClick = (index: number) => {
    setState((current) => {
      if (current.screen === "draft" && current.bonusPickActive) {
        return {
          ...current,
          selectedSlotIndex: current.selectedSlotIndex === index ? null : index,
        };
      }

      const clickedSlot = current.roster[index];

      if (current.selectedSlotIndex === null) {
        if (!clickedSlot.player) return current;
        return {
          ...current,
          selectedSlotIndex: index,
        };
      }

      if (current.selectedSlotIndex === index) {
        return {
          ...current,
          selectedSlotIndex: null,
        };
      }

      const nextRoster = [...current.roster];
      const selectedPlayer = nextRoster[current.selectedSlotIndex].player;
      nextRoster[current.selectedSlotIndex] = {
        ...nextRoster[current.selectedSlotIndex],
        player: nextRoster[index].player,
      };
      nextRoster[index] = {
        ...nextRoster[index],
        player: selectedPlayer,
      };

      return {
        ...current,
        roster: nextRoster,
        selectedSlotIndex: null,
        lastFilledSlot: nextRoster[index].slot,
      };
    });
  };

  const skipBonusPick = () => {
    setState((current) => {
      if (!current.bonusPickActive) return current;

      return {
        ...current,
        bonusPickUsed: true,
        bonusPickActive: false,
        currentChoices: [],
        selectedSlotIndex: null,
        screen: "lineup",
      };
    });
  };

  const moveRosterPlayer = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setState((current) => {
      if (!current.roster[fromIndex]?.player || !current.roster[toIndex]) return current;

      const nextRoster = [...current.roster];
      const draggedPlayer = nextRoster[fromIndex].player;

      nextRoster[fromIndex] = {
        ...nextRoster[fromIndex],
        player: nextRoster[toIndex].player,
      };
      nextRoster[toIndex] = {
        ...nextRoster[toIndex],
        player: draggedPlayer,
      };

      return {
        ...current,
        roster: nextRoster,
        selectedSlotIndex: null,
        lastFilledSlot: nextRoster[toIndex].slot,
      };
    });
  };

  const resetDraft = () => {
    const fresh = createInitialState();
    const rng = mulberry32(fresh.seed + 77);
    const resolvedParameters = resolveRunParameters(
      state.draftChallengeSelection,
      state.rareEventSelection,
      state.categoryChallengesEnabled ? state.categoryChallengeSelection : "disabled",
      rng,
    );
    setState({
      ...fresh,
      history: state.history,
      unlockedPlayerIds: state.unlockedPlayerIds,
      draftChallengeSelection: state.draftChallengeSelection,
      currentChallenge: resolvedParameters.challenge,
      rareEventSelection: state.rareEventSelection,
      rareEventsEnabled: state.rareEventsEnabled,
      currentRareEvent: resolvedParameters.rareEvent,
      categoryChallengesEnabled: state.categoryChallengesEnabled,
      categoryChallengeSelection: state.categoryChallengesEnabled ? state.categoryChallengeSelection : "disabled",
      currentCategoryChallenge: resolvedParameters.categoryChallenge,
      activePrestigeChallengeId: null,
      activePrestigeChallengeTitle: null,
      activePrestigeChallengeGoal: null,
      activePrestigeChallengeReward: 0,
      bonusPickAvailable: false,
      bonusPickUsed: false,
      bonusPickActive: false,
      rogueBonusPrestigeXp: state.rogueBonusPrestigeXp,
      rogueRunsStarted: state.rogueRunsStarted,
      rogueRunPlayersDrafted: state.rogueRunPlayersDrafted,
      rogueRunDraftedPlayerIds: state.rogueRunDraftedPlayerIds,
      spentTokens: state.spentTokens,
      purchasedTokens: state.purchasedTokens,
      ownedTrainingCampTickets: state.ownedTrainingCampTickets,
      ownedTradePhones: state.ownedTradePhones,
      ownedMidSeasonCoachChanges: state.ownedMidSeasonCoachChanges,
      ownedSilverStarterPacks: state.ownedSilverStarterPacks,
      ownedGoldStarterPacks: state.ownedGoldStarterPacks,
      ownedPlatinumStarterPacks: state.ownedPlatinumStarterPacks,
      ownedCoachRecruitment: state.ownedCoachRecruitment,
      ownedOpeningLockerCashTier: state.ownedOpeningLockerCashTier,
      ownedExtraDraftShuffle: state.ownedExtraDraftShuffle,
      ownedStarterPackChoicePlus: state.ownedStarterPackChoicePlus,
      ownedCoachIds: state.ownedCoachIds,
      ownedRogueStarIds: state.ownedRogueStarIds,
      activeRogueStarId: state.activeRogueStarId,
      ownedCollectionPlayerIds: state.ownedCollectionPlayerIds,
      rogueCollectedCollectionEntryIds: state.rogueCollectedCollectionEntryIds,
      claimedCollectionRewardIds: state.claimedCollectionRewardIds,
      completedRogueChallengeIds: state.completedRogueChallengeIds,
      claimedRogueChallengeIds: state.claimedRogueChallengeIds,
      rogueChallengePackRewardPlayerIds: state.rogueChallengePackRewardPlayerIds,
      dailyChallengeDate: state.dailyChallengeDate,
      dailyChallengeProgress: state.dailyChallengeProgress,
      claimedDailyChallengeIds: state.claimedDailyChallengeIds,
      screen: "landing",
    });
  };

  const setRareEventSelection = (selection: RareEventSelection) => {
    setState((current) => {
      const rng = mulberry32(current.seed + 77);
      const resolvedParameters = resolveRunParameters(
        current.draftChallengeSelection,
        selection,
        current.categoryChallengeSelection,
        rng,
      );
      return {
        ...current,
        rareEventSelection: selection,
        rareEventsEnabled: selection !== "disabled",
        currentRareEvent: resolvedParameters.rareEvent,
        currentCategoryChallenge:
          current.categoryChallengeSelection === "random"
            ? resolvedParameters.categoryChallenge
            : current.currentCategoryChallenge,
      };
    });
  };

  const setDraftChallengeSelection = (selection: DraftChallengeSelection) => {
    setState((current) => {
      const rng = mulberry32(current.seed + 57);
      const resolvedParameters = resolveRunParameters(
        selection,
        current.rareEventSelection,
        current.categoryChallengeSelection,
        rng,
      );
      return {
        ...current,
        draftChallengeSelection: selection,
        currentChallenge: resolvedParameters.challenge,
        currentRareEvent:
          selection === "classic"
            ? standardRareEvent
            : current.rareEventSelection === "random"
              ? resolvedParameters.rareEvent
              : current.currentRareEvent,
        currentCategoryChallenge:
          selection === "classic"
            ? null
            : current.categoryChallengeSelection === "random"
              ? resolvedParameters.categoryChallenge
              : current.currentCategoryChallenge,
      };
    });
  };

  const setCategoryChallengeSelection = (selection: CategoryChallengeSelection) => {
    setState((current) => {
      const rng = mulberry32(current.seed + 177);
      const resolvedParameters = resolveRunParameters(
        current.draftChallengeSelection,
        current.rareEventSelection,
        selection,
        rng,
      );
      return {
        ...current,
        categoryChallengesEnabled: selection !== "disabled",
        categoryChallengeSelection: selection,
        currentCategoryChallenge: resolvedParameters.categoryChallenge,
      };
    });
  };

  const applyRunPreset = (
    challengePreset: PrestigeChallengeDefinition,
  ) => {
    setState((current) => {
      const draftChallengeSelection = challengePreset.draftChallengeId as DraftChallengeSelection;
      const rareEventSelection =
        (challengePreset.rareEventId === standardRareEvent.id
          ? "disabled"
          : challengePreset.rareEventId) as RareEventSelection;
      const categoryChallengeSelection =
        (challengePreset.categoryChallengeId ?? "disabled") as CategoryChallengeSelection;
      const normalizedRareEventSelection =
        draftChallengeSelection === "classic" ? "disabled" : rareEventSelection;
      const normalizedCategorySelection =
        draftChallengeSelection === "classic" ? "disabled" : categoryChallengeSelection;
      const seed = createSeed();
      const roster = rosterTemplate();
      const rng = mulberry32(seed + 77);
      const resolvedParameters = resolveRunParameters(
        draftChallengeSelection,
        normalizedRareEventSelection,
        normalizedCategorySelection,
        rng,
      );
      const challengeGoal =
        resolvedParameters.categoryChallenge
          ? `Post a ${getCategoryChallengeTarget(resolvedParameters.categoryChallenge.metric)}+ ${resolvedParameters.categoryChallenge.metricLabel.toLowerCase()} score.`
          : challengePreset.goal;
      const hasExtraPick = hasPrestigeReward(metaProgress.prestige.level, "extra-pick");

      return {
        ...createInitialState(),
        history: current.history,
        unlockedPlayerIds: current.unlockedPlayerIds,
        draftChallengeSelection,
        currentChallenge: resolvedParameters.challenge,
        rareEventSelection: normalizedRareEventSelection,
        rareEventsEnabled: normalizedRareEventSelection !== "disabled",
        currentRareEvent: resolvedParameters.rareEvent,
        categoryChallengesEnabled: normalizedCategorySelection !== "disabled",
        categoryChallengeSelection: normalizedCategorySelection,
        currentCategoryChallenge: resolvedParameters.categoryChallenge,
        activePrestigeChallengeId: challengePreset.id,
        activePrestigeChallengeTitle: challengePreset.title,
        activePrestigeChallengeGoal: challengeGoal,
        activePrestigeChallengeReward: challengePreset.reward,
        bonusPickAvailable: hasExtraPick,
        bonusPickUsed: false,
        bonusPickActive: false,
        rogueBonusPrestigeXp: current.rogueBonusPrestigeXp,
        rogueRunsStarted: current.rogueRunsStarted,
        rogueRunPlayersDrafted: current.rogueRunPlayersDrafted,
        rogueRunDraftedPlayerIds: current.rogueRunDraftedPlayerIds,
        spentTokens: current.spentTokens,
        purchasedTokens: current.purchasedTokens,
        ownedTrainingCampTickets: current.ownedTrainingCampTickets,
        ownedTradePhones: current.ownedTradePhones,
        ownedMidSeasonCoachChanges: current.ownedMidSeasonCoachChanges,
        ownedSilverStarterPacks: current.ownedSilverStarterPacks,
        ownedGoldStarterPacks: current.ownedGoldStarterPacks,
        ownedPlatinumStarterPacks: current.ownedPlatinumStarterPacks,
        ownedCoachRecruitment: current.ownedCoachRecruitment,
        ownedOpeningLockerCashTier: current.ownedOpeningLockerCashTier,
        ownedExtraDraftShuffle: current.ownedExtraDraftShuffle,
        ownedStarterPackChoicePlus: current.ownedStarterPackChoicePlus,
        ownedCoachIds: current.ownedCoachIds,
        ownedRogueStarIds: current.ownedRogueStarIds,
        activeRogueStarId: current.activeRogueStarId,
        ownedCollectionPlayerIds: current.ownedCollectionPlayerIds,
        rogueCollectedCollectionEntryIds: current.rogueCollectedCollectionEntryIds,
        claimedCollectionRewardIds: current.claimedCollectionRewardIds,
        completedRogueChallengeIds: current.completedRogueChallengeIds,
        claimedRogueChallengeIds: current.claimedRogueChallengeIds,
        rogueChallengePackRewardPlayerIds: current.rogueChallengePackRewardPlayerIds,
        dailyChallengeDate: current.dailyChallengeDate,
        dailyChallengeProgress: current.dailyChallengeProgress,
        claimedDailyChallengeIds: current.claimedDailyChallengeIds,
        seed,
        roster,
        currentChoices: generateChoices(roster, [], seed, 1),
        screen: "briefing",
      };
    });
  };

  const setScreen = (screen: Screen) => {
    setState((current) => ({ ...current, screen }));
  };

  const awardRogueFailureRewards = (prestigeXpAward: number) => {
    if (prestigeXpAward <= 0) return;

    setState((current) => ({
      ...current,
      rogueBonusPrestigeXp: current.rogueBonusPrestigeXp + prestigeXpAward,
    }));
  };

  const absorbCloudTokenBalance = useCallback((cloudTokenBalance: number | null) => {
    if (cloudTokenBalance === null || !Number.isFinite(cloudTokenBalance)) return;

    setState((current) => {
      const normalizedCloudBalance = Math.max(0, Math.floor(cloudTokenBalance));
      const displayedBalance = getDisplayedTokenBalanceForState(current);
      const tokenDelta = normalizedCloudBalance - displayedBalance;

      if (tokenDelta === 0) return current;

      if (tokenDelta > 0) {
        return {
          ...current,
          purchasedTokens: current.purchasedTokens + tokenDelta,
        };
      }

      const balanceReduction = Math.abs(tokenDelta);
      const purchasedTokenReduction = Math.min(current.purchasedTokens, balanceReduction);
      const remainingReduction = balanceReduction - purchasedTokenReduction;

      return {
        ...current,
        purchasedTokens: current.purchasedTokens - purchasedTokenReduction,
        spentTokens: current.spentTokens + remainingReduction,
      };
    });
  }, []);

  const absorbCloudCollectionPlayerIds = useCallback((playerIds: string[]) => {
    const validPlayerIds = Array.from(
      new Set(
        normalizePlayerIds(playerIds).filter((playerId) =>
          allPlayers.some((player) => player.id === playerId),
        ),
      ),
    );

    setState((current) => {
      const exchangedPlayerIds = new Set(current.exchangedCollectionPlayerIds);
      const addablePlayerIds = validPlayerIds.filter((playerId) => !exchangedPlayerIds.has(playerId));
      const ownedCollectionPlayerIds = Array.from(
        new Set([...current.ownedCollectionPlayerIds, ...addablePlayerIds]),
      );
      const ownedRogueStarIds = Array.from(
        new Set([...current.ownedRogueStarIds, ...addablePlayerIds]),
      );

      if (
        ownedCollectionPlayerIds.length === current.ownedCollectionPlayerIds.length &&
        ownedCollectionPlayerIds.every((playerId) => current.ownedCollectionPlayerIds.includes(playerId)) &&
        ownedRogueStarIds.length === current.ownedRogueStarIds.length &&
        ownedRogueStarIds.every((playerId) => current.ownedRogueStarIds.includes(playerId))
      ) {
        return current;
      }

      return {
        ...current,
        ownedCollectionPlayerIds,
        ownedRogueStarIds,
        activeRogueStarId:
          current.activeRogueStarId && ownedRogueStarIds.includes(current.activeRogueStarId)
            ? current.activeRogueStarId
            : null,
      };
    });
  }, []);

  const applyCloudAccountSnapshot = useCallback((
    cloudTokenBalance: number | null | undefined,
    playerIds: string[] | undefined,
    storeUnlocks: UserStoreUnlockQuantities = {},
  ) => {
    const validPlayerIds =
      playerIds === undefined
        ? undefined
        : Array.from(
            new Set(
              normalizePlayerIds(playerIds).filter((playerId) =>
                allPlayers.some((player) => player.id === playerId),
              ),
            ),
          );

    if (validPlayerIds !== undefined) {
      writeVerifiedCollectionPlayerIds(validPlayerIds);
    }
    setState((current) => {
      const exchangedPlayerIds = new Set(current.exchangedCollectionPlayerIds);
      const addablePlayerIds = validPlayerIds?.filter((playerId) => !exchangedPlayerIds.has(playerId));
      const ownedCollectionPlayerIds =
        addablePlayerIds === undefined
          ? current.ownedCollectionPlayerIds
          : Array.from(new Set([...current.ownedCollectionPlayerIds, ...addablePlayerIds]));
      const ownedRogueStarIds =
        addablePlayerIds === undefined
          ? current.ownedRogueStarIds
          : Array.from(new Set([...current.ownedRogueStarIds, ...addablePlayerIds]));

      let nextState: DraftState = {
        ...current,
        ownedTrainingCampTickets: getStoreUnlockQuantity(storeUnlocks, "training-camp-ticket"),
        ownedTradePhones: getStoreUnlockQuantity(storeUnlocks, "trade-phone"),
        ownedMidSeasonCoachChanges: getStoreUnlockQuantity(storeUnlocks, "mid-season-coach-change"),
        ownedSilverStarterPacks: getStoreUnlockQuantity(storeUnlocks, "silver-starter-pack") > 0 ? 1 : 0,
        ownedGoldStarterPacks: getStoreUnlockQuantity(storeUnlocks, "gold-starter-pack") > 0 ? 1 : 0,
        ownedPlatinumStarterPacks: getStoreUnlockQuantity(storeUnlocks, "platinum-starter-pack") > 0 ? 1 : 0,
        ownedCoachRecruitment: getStoreUnlockQuantity(storeUnlocks, "coach-recruitment") > 0 ? 1 : 0,
        ownedOpeningLockerCashTier: getOpeningLockerCashTierFromUnlocks(storeUnlocks),
        ownedExtraDraftShuffle: getStoreUnlockQuantity(storeUnlocks, "extra-draft-shuffle") > 0 ? 1 : 0,
        ownedStarterPackChoicePlus: getStoreUnlockQuantity(storeUnlocks, "starter-pack-choice-plus") > 0 ? 1 : 0,
        ownedRogueStarIds,
        activeRogueStarId:
          current.activeRogueStarId && ownedRogueStarIds.includes(current.activeRogueStarId)
            ? current.activeRogueStarId
            : null,
        ownedCollectionPlayerIds,
      };

      if (cloudTokenBalance !== undefined && cloudTokenBalance !== null && Number.isFinite(cloudTokenBalance)) {
        const normalizedCloudBalance = Math.max(0, Math.floor(cloudTokenBalance));
        const displayedBalance = getDisplayedTokenBalanceForState(nextState);
        const tokenDelta = normalizedCloudBalance - displayedBalance;

        if (tokenDelta > 0) {
          nextState = {
            ...nextState,
            purchasedTokens: nextState.purchasedTokens + tokenDelta,
          };
        } else if (tokenDelta < 0) {
          const balanceReduction = Math.abs(tokenDelta);
          const purchasedTokenReduction = Math.min(nextState.purchasedTokens, balanceReduction);
          const remainingReduction = balanceReduction - purchasedTokenReduction;

          nextState = {
            ...nextState,
            purchasedTokens: nextState.purchasedTokens - purchasedTokenReduction,
            spentTokens: nextState.spentTokens + remainingReduction,
          };
        }
      }

      return nextState;
    });
  }, []);

  const updateRoguePersonalBests = (nextValues: Partial<RoguePersonalBests>) => {
    setState((current) => ({
      ...current,
      roguePersonalBests: (() => {
        const currentBests = {
          ...DEFAULT_ROGUE_PERSONAL_BESTS,
          ...(current.roguePersonalBests ?? {}),
        };
        const replaceDifficultyBest = shouldReplaceRogueDifficultyBest(
          currentBests.hardestDifficulty,
          currentBests.hardestDifficultyFloor,
          nextValues.hardestDifficulty,
          nextValues.hardestDifficultyFloor,
        );

        return {
        furthestFloor: Math.max(
          currentBests.furthestFloor,
          nextValues.furthestFloor ?? 0,
        ),
        overall: Math.max(
          currentBests.overall,
          nextValues.overall ?? 0,
        ),
        offense: Math.max(
          currentBests.offense,
          nextValues.offense ?? 0,
        ),
        defense: Math.max(
          currentBests.defense,
          nextValues.defense ?? 0,
        ),
        chemistry: Math.max(
          currentBests.chemistry,
          nextValues.chemistry ?? 0,
        ),
          hardestDifficulty: replaceDifficultyBest
            ? nextValues.hardestDifficulty ?? currentBests.hardestDifficulty
            : currentBests.hardestDifficulty,
          hardestDifficultyFloor: replaceDifficultyBest
            ? nextValues.hardestDifficultyFloor ?? currentBests.hardestDifficultyFloor
            : currentBests.hardestDifficultyFloor,
        };
      })(),
    }));
  };

  const recordRogueRunStarted = () => {
    setState((current) => ({
      ...current,
      rogueRunsStarted: Math.max(0, Math.floor(current.rogueRunsStarted ?? 0)) + 1,
    }));
  };

  const recordRogueRunDraftedPlayers = (playerIds: string[]) => {
    const normalizedPlayerIds = Array.from(
      new Set(
        normalizePlayerIds(playerIds).filter((playerId) =>
          allPlayers.some((player) => player.id === playerId),
        ),
      ),
    );
    if (normalizedPlayerIds.length === 0) return;

    setState((current) => ({
      ...current,
      rogueRunPlayersDrafted:
        Math.max(0, Math.floor(current.rogueRunPlayersDrafted ?? 0)) + normalizedPlayerIds.length,
      rogueRunDraftedPlayerIds: Array.from(
        new Set([...(current.rogueRunDraftedPlayerIds ?? []), ...normalizedPlayerIds]),
      ),
    }));
  };

  const recordDailyChallengeProgress = (progress: Partial<DailyRogueChallengeProgress>) => {
    const bossWins = Math.max(0, Math.floor(progress.bossWins ?? 0));
    const packsOpened = Math.max(0, Math.floor(progress.packsOpened ?? 0));
    const yearTwoFinalsClears = Math.max(0, Math.floor(progress.yearTwoFinalsClears ?? 0));
    const login = Math.max(0, Math.floor(progress.login ?? 0));

    if (bossWins + packsOpened + yearTwoFinalsClears + login <= 0) return;

    setState((current) => {
      const next = ensureCurrentDailyChallengeState(current);

      return {
        ...next,
        dailyChallengeProgress: {
          login: Math.max(1, next.dailyChallengeProgress.login + login),
          bossWins: next.dailyChallengeProgress.bossWins + bossWins,
          packsOpened: next.dailyChallengeProgress.packsOpened + packsOpened,
          yearTwoFinalsClears: next.dailyChallengeProgress.yearTwoFinalsClears + yearTwoFinalsClears,
        },
      };
    });
  };

  const purchaseTrainingCampTicket = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedTrainingCampTickets: current.ownedTrainingCampTickets + 1,
    }));
    return true;
  };

  const purchaseTradePhone = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedTradePhones: current.ownedTradePhones + 1,
    }));
    return true;
  };

  const purchaseMidSeasonCoachChange = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedMidSeasonCoachChanges: current.ownedMidSeasonCoachChanges + 1,
    }));
    return true;
  };

  const purchaseSilverStarterPack = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (state.ownedSilverStarterPacks > 0) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedSilverStarterPacks: 1,
    }));
    return true;
  };

  const purchaseGoldStarterPack = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (state.ownedGoldStarterPacks > 0) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedGoldStarterPacks: 1,
    }));
    return true;
  };

  const purchasePlatinumStarterPack = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (state.ownedPlatinumStarterPacks > 0) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedPlatinumStarterPacks: 1,
    }));
    return true;
  };

  const purchaseCoachRecruitment = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (state.ownedCoachRecruitment > 0) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedCoachRecruitment: 1,
    }));
    return true;
  };

  const purchaseOpeningLockerCashUpgrade = (price: number, tier: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (tier < 1 || tier > 3) return false;
    if (state.ownedOpeningLockerCashTier >= tier) return false;
    if (state.ownedOpeningLockerCashTier !== tier - 1) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedOpeningLockerCashTier: tier,
    }));
    return true;
  };

  const purchaseExtraDraftShuffle = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (state.ownedExtraDraftShuffle > 0) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedExtraDraftShuffle: 1,
    }));
    return true;
  };

  const purchaseStarterPackChoicePlus = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (state.ownedStarterPackChoicePlus > 0) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedStarterPackChoicePlus: 1,
    }));
    return true;
  };

  const purchaseRogueStar = (playerId: string, price: number) => {
    if (metaProgress.tokens.balance < price) return false;
    if (state.ownedRogueStarIds.includes(playerId)) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedRogueStarIds: [...current.ownedRogueStarIds, playerId],
      ownedCollectionPlayerIds: Array.from(new Set([...current.ownedCollectionPlayerIds, playerId])),
      exchangedCollectionPlayerIds: current.exchangedCollectionPlayerIds.filter(
        (exchangedPlayerId) => exchangedPlayerId !== playerId,
      ),
    }));
    return true;
  };

  const purchaseRoguePack = (tier: PlayerTier, price: number) => {
    if (getDisplayedTokenBalanceForState(state) < price) return null;

    const packPool = getRoguePackPlayerPool(tier, [
      ...state.ownedRogueStarIds,
      ...state.ownedCollectionPlayerIds,
    ]);
    if (packPool.length === 0) return null;

    const pulledPlayer = packPool[Math.floor(Math.random() * packPool.length)];

    setState((current) => {
      const next = ensureCurrentDailyChallengeState(current);
      if (getDisplayedTokenBalanceForState(next) < price) return current;

      if (
        next.ownedRogueStarIds.includes(pulledPlayer.id) ||
        next.ownedCollectionPlayerIds.includes(pulledPlayer.id)
      ) {
        return current;
      }

      return {
        ...next,
        spentTokens: next.spentTokens + price,
        ownedRogueStarIds: [...next.ownedRogueStarIds, pulledPlayer.id],
        ownedCollectionPlayerIds: Array.from(
          new Set([...next.ownedCollectionPlayerIds, pulledPlayer.id]),
        ),
        exchangedCollectionPlayerIds: next.exchangedCollectionPlayerIds.filter(
          (playerId) => playerId !== pulledPlayer.id,
        ),
        dailyChallengeProgress: {
          ...next.dailyChallengeProgress,
          packsOpened: next.dailyChallengeProgress.packsOpened + 1,
        },
      };
    });

    return pulledPlayer;
  };

  const completeCollectionExchange = (playerIds: string[], rewardTier: PlayerTier) => {
    const normalizedPlayerIds = normalizePlayerIds(playerIds);
    const uniquePlayerIds = Array.from(new Set(normalizedPlayerIds));
    if (uniquePlayerIds.length !== normalizedPlayerIds.length || uniquePlayerIds.length !== 3) return null;
    if (uniquePlayerIds.some((playerId) => !state.ownedCollectionPlayerIds.includes(playerId))) return null;
    const exchangedPlayers = uniquePlayerIds
      .map((playerId) => canonicalPlayersById.get(playerId) ?? null)
      .filter((player): player is Player => Boolean(player));
    if (exchangedPlayers.length !== 3) return null;
    const exchangedTiers = exchangedPlayers.map(getPlayerTier);
    const inputTier = exchangedTiers[0];
    if (!exchangedTiers.every((tier) => tier === inputTier)) return null;
    if (exchangeRewardTierByInputTier[inputTier] !== rewardTier) return null;

    const consumedPlayerIdSet = new Set(uniquePlayerIds);
    const remainingCollectionPlayerIds = state.ownedCollectionPlayerIds.filter(
      (playerId) => !consumedPlayerIdSet.has(playerId),
    );
    const remainingRogueStarIds = state.ownedRogueStarIds.filter(
      (playerId) => !consumedPlayerIdSet.has(playerId),
    );
    const rewardPool = getRoguePackPlayerPool(rewardTier, [
      ...remainingRogueStarIds,
      ...remainingCollectionPlayerIds,
      ...uniquePlayerIds,
    ]);
    const rewardPlayer = rewardPool[Math.floor(Math.random() * rewardPool.length)] ?? null;
    if (!rewardPlayer) return null;

    setState((current) => {
      const next = ensureCurrentDailyChallengeState(current);
      if (uniquePlayerIds.some((playerId) => !next.ownedCollectionPlayerIds.includes(playerId))) return current;

      const nextConsumedPlayerIdSet = new Set(uniquePlayerIds);
      const nextCollectionPlayerIds = next.ownedCollectionPlayerIds.filter(
        (playerId) => !nextConsumedPlayerIdSet.has(playerId),
      );
      const nextRogueStarIds = next.ownedRogueStarIds.filter(
        (playerId) => !nextConsumedPlayerIdSet.has(playerId),
      );

      return {
        ...next,
        ownedRogueStarIds: Array.from(new Set([...nextRogueStarIds, rewardPlayer.id])),
        activeRogueStarId:
          next.activeRogueStarId && !nextConsumedPlayerIdSet.has(next.activeRogueStarId)
            ? next.activeRogueStarId
            : null,
        ownedCollectionPlayerIds: Array.from(new Set([...nextCollectionPlayerIds, rewardPlayer.id])),
        exchangedCollectionPlayerIds: Array.from(
          new Set([
            ...next.exchangedCollectionPlayerIds.filter((playerId) => playerId !== rewardPlayer.id),
            ...uniquePlayerIds,
          ]),
        ),
        dailyChallengeProgress: {
          ...next.dailyChallengeProgress,
          packsOpened: next.dailyChallengeProgress.packsOpened + 1,
        },
      };
    });

    return rewardPlayer;
  };

  const ensureRoguePackPullOwned = useCallback((playerId: string) => {
    if (!allPlayers.some((player) => player.id === playerId)) return;

    setState((current) => {
      const ownedRogueStarIds = current.ownedRogueStarIds.includes(playerId)
        ? current.ownedRogueStarIds
        : [...current.ownedRogueStarIds, playerId];
      const ownedCollectionPlayerIds = current.ownedCollectionPlayerIds.includes(playerId)
        ? current.ownedCollectionPlayerIds
        : [...current.ownedCollectionPlayerIds, playerId];

      if (
        ownedRogueStarIds === current.ownedRogueStarIds &&
        ownedCollectionPlayerIds === current.ownedCollectionPlayerIds
      ) {
        return current;
      }

      return {
        ...current,
        ownedRogueStarIds,
        ownedCollectionPlayerIds,
        exchangedCollectionPlayerIds: current.exchangedCollectionPlayerIds.filter(
          (exchangedPlayerId) => exchangedPlayerId !== playerId,
        ),
      };
    });
  }, []);

  const setActiveRogueStar = (playerId: string | null) => {
    setState((current) => ({
      ...current,
      activeRogueStarId:
        playerId && current.ownedRogueStarIds.includes(playerId) ? playerId : null,
    }));
  };

  const recordRogueCollectionEntries = (playerIds: string[]) => {
    const normalizedPlayerIds = normalizePlayerIds(playerIds);
    const entryIds = getRogueCollectionEntryIdsForRoster(normalizedPlayerIds);
    if (entryIds.length === 0) return;

    setState((current) => {
      const mergedEntryIds = Array.from(
        new Set([...current.rogueCollectedCollectionEntryIds, ...entryIds]),
      );

      if (mergedEntryIds.length === current.rogueCollectedCollectionEntryIds.length) {
        return current;
      }

      return {
        ...current,
        rogueCollectedCollectionEntryIds: mergedEntryIds,
      };
    });
  };

  const claimCollectionReward = (familyId: CollectionFamilyId) => {
    if (state.claimedCollectionRewardIds.includes(familyId)) return false;

    const collection = buildCollectionProgress(state.rogueCollectedCollectionEntryIds).find(
      (entry) => entry.family.id === familyId,
    );
    if (!collection?.unlocked) return false;

    setState((current) => {
      if (current.claimedCollectionRewardIds.includes(familyId)) return current;

      return {
        ...current,
        claimedCollectionRewardIds: [...current.claimedCollectionRewardIds, familyId],
      };
    });
    return true;
  };

  const recordRogueChallengeCompletions = (challengeIds: string[]) => {
    const validChallengeIds = challengeIds.filter(
      (challengeId) => isValidRogueChallengeId(challengeId) && !isDailyRogueChallengeId(challengeId),
    );
    if (validChallengeIds.length === 0) return;

    setState((current) => {
      const mergedChallengeIds = Array.from(
        new Set([...current.completedRogueChallengeIds, ...validChallengeIds]),
      );

      if (mergedChallengeIds.length === current.completedRogueChallengeIds.length) {
        return current;
      }

      return {
        ...current,
        completedRogueChallengeIds: mergedChallengeIds,
      };
    });
  };

  const claimRogueChallengeReward = (challengeId: string) => {
    const challenge = getRogueChallengeById(challengeId);
    if (!challenge) return false;

    if (isDailyRogueChallengeId(challengeId)) {
      const currentDailyState = ensureCurrentDailyChallengeState(state);
      const completedDailyIds = getCompletedDailyRogueChallengeIds(currentDailyState.dailyChallengeProgress);
      if (currentDailyState.claimedDailyChallengeIds.includes(challengeId)) return false;
      if (!completedDailyIds.includes(challengeId)) return false;

      setState((current) => {
        const next = ensureCurrentDailyChallengeState(current);
        const nextCompletedDailyIds = getCompletedDailyRogueChallengeIds(next.dailyChallengeProgress);
        if (next.claimedDailyChallengeIds.includes(challengeId)) return current;
        if (!nextCompletedDailyIds.includes(challengeId)) return current;

        return {
          ...next,
          purchasedTokens: next.purchasedTokens + challenge.reward,
          claimedDailyChallengeIds: [...next.claimedDailyChallengeIds, challengeId],
        };
      });
      return true;
    }

    if (state.claimedRogueChallengeIds.includes(challengeId)) return false;
    if (!state.completedRogueChallengeIds.includes(challengeId)) return false;
    const rewardPlayerId = getRogueChallengeRewardPlayerIds([challengeId])[0] ?? null;

    setState((current) => {
      if (current.claimedRogueChallengeIds.includes(challengeId)) return current;
      if (!current.completedRogueChallengeIds.includes(challengeId)) return current;
      const ownedCoachIds =
        challenge.rewardCoachId && !current.ownedCoachIds.includes(challenge.rewardCoachId)
          ? [...current.ownedCoachIds, challenge.rewardCoachId]
          : current.ownedCoachIds;
      const packRewardPlayerId =
        challenge.rewardPackTier && !current.rogueChallengePackRewardPlayerIds[challengeId]
          ? drawRogueChallengePackRewardPlayerId(challenge.rewardPackTier, current)
          : null;
      const rewardPlayerIds = [rewardPlayerId, packRewardPlayerId].filter(
        (playerId): playerId is string => Boolean(playerId),
      );
      const ownedRogueStarIds =
        rewardPlayerIds.length > 0
          ? Array.from(new Set([...current.ownedRogueStarIds, ...rewardPlayerIds]))
          : current.ownedRogueStarIds;
      const ownedCollectionPlayerIds =
        rewardPlayerIds.length > 0
          ? Array.from(new Set([...current.ownedCollectionPlayerIds, ...rewardPlayerIds]))
          : current.ownedCollectionPlayerIds;
      const rogueChallengePackRewardPlayerIds = packRewardPlayerId
        ? {
            ...current.rogueChallengePackRewardPlayerIds,
            [challengeId]: packRewardPlayerId,
          }
        : current.rogueChallengePackRewardPlayerIds;

      return {
        ...current,
        ownedCoachIds,
        ownedRogueStarIds,
        ownedCollectionPlayerIds,
        exchangedCollectionPlayerIds:
          rewardPlayerIds.length > 0
            ? current.exchangedCollectionPlayerIds.filter((playerId) => !rewardPlayerIds.includes(playerId))
            : current.exchangedCollectionPlayerIds,
        rogueChallengePackRewardPlayerIds,
        claimedRogueChallengeIds: [...current.claimedRogueChallengeIds, challengeId],
      };
    });
    return true;
  };

  const useTrainingCampTicket = () => {
    if (state.ownedTrainingCampTickets <= 0) return false;

    setState((current) => ({
      ...current,
      ownedTrainingCampTickets: Math.max(0, current.ownedTrainingCampTickets - 1),
    }));
    return true;
  };

  const useTradePhone = () => {
    if (state.ownedTradePhones <= 0) return false;

    setState((current) => ({
      ...current,
      ownedTradePhones: Math.max(0, current.ownedTradePhones - 1),
    }));
    return true;
  };

  const useMidSeasonCoachChange = () => {
    if (state.ownedMidSeasonCoachChanges <= 0) return false;

    setState((current) => ({
      ...current,
      ownedMidSeasonCoachChanges: Math.max(0, current.ownedMidSeasonCoachChanges - 1),
    }));
    return true;
  };

  const useSilverStarterPack = () => {
    if (state.ownedSilverStarterPacks <= 0) return false;
    return true;
  };

  const useGoldStarterPack = () => {
    if (state.ownedGoldStarterPacks <= 0) return false;
    return true;
  };

  const usePlatinumStarterPack = () => {
    if (state.ownedPlatinumStarterPacks <= 0) return false;
    return true;
  };

  return {
    state,
    metaProgress,
    completedDailyChallengeIds,
    teamAverage,
    draftChemistry,
    completedRoster,
    startDraft,
    beginDraftFromBriefing,
    draftPlayer,
    beginSimulation,
    resetDraft,
    setScreen,
    handleRosterSlotClick,
    moveRosterPlayer,
    skipBonusPick,
    setDraftChallengeSelection,
    setRareEventSelection,
    setCategoryChallengeSelection,
    applyRunPreset,
    awardRogueFailureRewards,
    updateRoguePersonalBests,
    absorbCloudTokenBalance,
    absorbCloudCollectionPlayerIds,
    applyCloudAccountSnapshot,
    recordRogueRunStarted,
    recordRogueRunDraftedPlayers,
    recordDailyChallengeProgress,
    purchaseTrainingCampTicket,
    purchaseTradePhone,
    purchaseMidSeasonCoachChange,
    purchaseSilverStarterPack,
    purchaseGoldStarterPack,
    purchasePlatinumStarterPack,
    purchaseCoachRecruitment,
    purchaseOpeningLockerCashUpgrade,
    purchaseExtraDraftShuffle,
    purchaseStarterPackChoicePlus,
    purchaseRogueStar,
    purchaseRoguePack,
    completeCollectionExchange,
    ensureRoguePackPullOwned,
    setActiveRogueStar,
    recordRogueCollectionEntries,
    claimCollectionReward,
    recordRogueChallengeCompletions,
    claimRogueChallengeReward,
    useTrainingCampTicket,
    useTradePhone,
    useMidSeasonCoachChange,
    useSilverStarterPack,
    useGoldStarterPack,
    usePlatinumStarterPack,
  };
};
