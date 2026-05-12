import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryChallengeSelection, DraftChallengeSelection, DraftState, Player, PlayerTier, PrestigeChallengeDefinition, RareEventSelection, RoguePersonalBests, RunHistoryEntry, Screen } from "../types";
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
  getClaimedRogueChallengeRewardTotal,
  getRogueChallengeById,
  isValidRogueChallengeId,
} from "../lib/rogueChallenges";
import { roguelikeCoaches } from "../lib/roguelike";
import { getRoguePackPlayerPool } from "../lib/tokenStore";

const HISTORY_LIMIT = 24;
const VERIFIED_COLLECTION_STORAGE_KEY = "nba-ultimate-draft-verified-collection-player-ids-v1";
const LEGACY_COLLECTION_TRUST_LIMIT = 8;
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
};

const canonicalPlayersById = new Map(allPlayers.map((player) => [player.id, player]));
const canonicalPlayersByName = new Map(allPlayers.map((player) => [player.name, player]));
const validRoguelikeCoachIds = new Set(roguelikeCoaches.map((coach) => coach.id));

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
    spentTokens: 0,
    purchasedTokens: 0,
    ownedTrainingCampTickets: 0,
    ownedTradePhones: 0,
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
    rogueCollectedCollectionEntryIds: [],
    claimedCollectionRewardIds: [],
    completedRogueChallengeIds: [],
    claimedRogueChallengeIds: [],
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

  return {
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
    spentTokens: value.spentTokens ?? 0,
    purchasedTokens: value.purchasedTokens ?? 0,
    ownedTrainingCampTickets: value.ownedTrainingCampTickets ?? 0,
    ownedTradePhones: value.ownedTradePhones ?? 0,
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
    ownedRogueStarIds: Array.isArray(value.ownedRogueStarIds) ? normalizePlayerIds(value.ownedRogueStarIds) : [],
    activeRogueStarId:
      typeof value.activeRogueStarId === "string"
        ? LEGACY_PLAYER_ID_MIGRATIONS[value.activeRogueStarId] ?? value.activeRogueStarId
        : null,
    ownedCollectionPlayerIds: getNormalizedCollectionPlayerIds(value),
    rogueCollectedCollectionEntryIds: Array.isArray(value.rogueCollectedCollectionEntryIds)
      ? value.rogueCollectedCollectionEntryIds.filter((entryId): entryId is string => typeof entryId === "string")
      : [],
    claimedCollectionRewardIds: Array.isArray(value.claimedCollectionRewardIds)
      ? value.claimedCollectionRewardIds.filter((entryId): entryId is string => typeof entryId === "string")
      : [],
    completedRogueChallengeIds: Array.isArray(value.completedRogueChallengeIds)
      ? value.completedRogueChallengeIds.filter((challengeId): challengeId is string => typeof challengeId === "string" && isValidRogueChallengeId(challengeId))
      : [],
    claimedRogueChallengeIds: Array.isArray(value.claimedRogueChallengeIds)
      ? value.claimedRogueChallengeIds.filter((challengeId): challengeId is string => typeof challengeId === "string" && isValidRogueChallengeId(challengeId))
      : [],
    seed,
  };
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
      state.rogueBonusPrestigeXp,
      state.purchasedTokens,
      state.claimedCollectionRewardIds.length,
      state.claimedRogueChallengeIds,
      state.spentTokens,
    ],
  );
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
      spentTokens: state.spentTokens,
      purchasedTokens: state.purchasedTokens,
      ownedTrainingCampTickets: state.ownedTrainingCampTickets,
      ownedTradePhones: state.ownedTradePhones,
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
        spentTokens: current.spentTokens,
        purchasedTokens: current.purchasedTokens,
        ownedTrainingCampTickets: current.ownedTrainingCampTickets,
        ownedTradePhones: current.ownedTradePhones,
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
      const purchasedTokenDelta = normalizedCloudBalance - displayedBalance;

      if (purchasedTokenDelta <= 0) return current;

      return {
        ...current,
        purchasedTokens: current.purchasedTokens + purchasedTokenDelta,
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
    if (validPlayerIds.length === 0) return;

    setState((current) => {
      const ownedCollectionPlayerIds = Array.from(
        new Set([...current.ownedCollectionPlayerIds, ...validPlayerIds]),
      );
      const ownedRogueStarIds = Array.from(
        new Set([...current.ownedRogueStarIds, ...validPlayerIds]),
      );

      if (
        ownedCollectionPlayerIds.length === current.ownedCollectionPlayerIds.length &&
        ownedRogueStarIds.length === current.ownedRogueStarIds.length
      ) {
        return current;
      }

      return {
        ...current,
        ownedCollectionPlayerIds,
        ownedRogueStarIds,
      };
    });
  }, []);

  const applyCloudAccountSnapshot = useCallback((cloudTokenBalance: number | null, playerIds: string[]) => {
    const normalizedCloudBalance =
      cloudTokenBalance !== null && Number.isFinite(cloudTokenBalance)
        ? Math.max(0, Math.floor(cloudTokenBalance))
        : 0;
    const validPlayerIds = Array.from(
      new Set(
        normalizePlayerIds(playerIds).filter((playerId) =>
          allPlayers.some((player) => player.id === playerId),
        ),
      ),
    );

    writeVerifiedCollectionPlayerIds(validPlayerIds);
    setState(() => ({
      ...createInitialState(),
      purchasedTokens: normalizedCloudBalance,
      ownedRogueStarIds: validPlayerIds,
      ownedCollectionPlayerIds: validPlayerIds,
    }));
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
      if (getDisplayedTokenBalanceForState(current) < price) return current;

      if (
        current.ownedRogueStarIds.includes(pulledPlayer.id) ||
        current.ownedCollectionPlayerIds.includes(pulledPlayer.id)
      ) {
        return current;
      }

      return {
        ...current,
        spentTokens: current.spentTokens + price,
        ownedRogueStarIds: [...current.ownedRogueStarIds, pulledPlayer.id],
        ownedCollectionPlayerIds: Array.from(
          new Set([...current.ownedCollectionPlayerIds, pulledPlayer.id]),
        ),
      };
    });

    return pulledPlayer;
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
    const validChallengeIds = challengeIds.filter(isValidRogueChallengeId);
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
    if (state.claimedRogueChallengeIds.includes(challengeId)) return false;
    if (!state.completedRogueChallengeIds.includes(challengeId)) return false;
    const challenge = getRogueChallengeById(challengeId);
    if (!challenge) return false;

    setState((current) => {
      if (current.claimedRogueChallengeIds.includes(challengeId)) return current;
      if (!current.completedRogueChallengeIds.includes(challengeId)) return current;
      const ownedCoachIds =
        challenge.rewardCoachId && !current.ownedCoachIds.includes(challenge.rewardCoachId)
          ? [...current.ownedCoachIds, challenge.rewardCoachId]
          : current.ownedCoachIds;

      return {
        ...current,
        ownedCoachIds,
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
    purchaseTrainingCampTicket,
    purchaseTradePhone,
    purchaseSilverStarterPack,
    purchaseGoldStarterPack,
    purchasePlatinumStarterPack,
    purchaseCoachRecruitment,
    purchaseOpeningLockerCashUpgrade,
    purchaseExtraDraftShuffle,
    purchaseStarterPackChoicePlus,
    purchaseRogueStar,
    purchaseRoguePack,
    ensureRoguePackPullOwned,
    setActiveRogueStar,
    recordRogueCollectionEntries,
    claimCollectionReward,
    recordRogueChallengeCompletions,
    claimRogueChallengeReward,
    useTrainingCampTicket,
    useTradePhone,
    useSilverStarterPack,
    useGoldStarterPack,
    usePlatinumStarterPack,
  };
};
