import { useEffect, useMemo, useState } from "react";
import { CategoryChallengeSelection, DraftChallengeSelection, DraftState, Player, PrestigeChallengeDefinition, RareEventSelection, RoguePersonalBests, RunHistoryEntry, Screen } from "../types";
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

const HISTORY_LIMIT = 24;
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
    ownedTrainingCampTickets: 0,
    ownedTradePhones: 0,
    ownedSilverStarterPacks: 0,
    ownedGoldStarterPacks: 0,
    ownedPlatinumStarterPacks: 0,
    ownedRogueStarIds: [],
    activeRogueStarId: null,
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
    roguePersonalBests: value.roguePersonalBests ?? DEFAULT_ROGUE_PERSONAL_BESTS,
    spentTokens: value.spentTokens ?? 0,
    ownedTrainingCampTickets: value.ownedTrainingCampTickets ?? 0,
    ownedTradePhones: value.ownedTradePhones ?? 0,
    ownedSilverStarterPacks: value.ownedSilverStarterPacks ?? 0,
    ownedGoldStarterPacks: value.ownedGoldStarterPacks ?? 0,
    ownedPlatinumStarterPacks: value.ownedPlatinumStarterPacks ?? 0,
    ownedRogueStarIds: Array.isArray(value.ownedRogueStarIds) ? normalizePlayerIds(value.ownedRogueStarIds) : [],
    activeRogueStarId:
      typeof value.activeRogueStarId === "string"
        ? LEGACY_PLAYER_ID_MIGRATIONS[value.activeRogueStarId] ?? value.activeRogueStarId
        : null,
    seed,
  };
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
          balance: Math.max(0, boostedMeta.tokens.balance - state.spentTokens),
        },
      };
    },
    [state.history, state.unlockedPlayerIds, state.roguePersonalBests, state.rogueBonusPrestigeXp, state.spentTokens],
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
        ownedTrainingCampTickets: state.ownedTrainingCampTickets,
        ownedTradePhones: state.ownedTradePhones,
        ownedSilverStarterPacks: state.ownedSilverStarterPacks,
        ownedGoldStarterPacks: state.ownedGoldStarterPacks,
        ownedPlatinumStarterPacks: state.ownedPlatinumStarterPacks,
        ownedRogueStarIds: state.ownedRogueStarIds,
      activeRogueStarId: state.activeRogueStarId,
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
          ownedTrainingCampTickets: current.ownedTrainingCampTickets,
          ownedTradePhones: current.ownedTradePhones,
          ownedSilverStarterPacks: current.ownedSilverStarterPacks,
          ownedGoldStarterPacks: current.ownedGoldStarterPacks,
          ownedPlatinumStarterPacks: current.ownedPlatinumStarterPacks,
          ownedRogueStarIds: current.ownedRogueStarIds,
        activeRogueStarId: current.activeRogueStarId,
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

  const updateRoguePersonalBests = (nextValues: Partial<RoguePersonalBests>) => {
    setState((current) => ({
      ...current,
      roguePersonalBests: {
        furthestFloor: Math.max(
          current.roguePersonalBests?.furthestFloor ?? 0,
          nextValues.furthestFloor ?? 0,
        ),
        overall: Math.max(
          current.roguePersonalBests?.overall ?? 0,
          nextValues.overall ?? 0,
        ),
        offense: Math.max(
          current.roguePersonalBests?.offense ?? 0,
          nextValues.offense ?? 0,
        ),
        defense: Math.max(
          current.roguePersonalBests?.defense ?? 0,
          nextValues.defense ?? 0,
        ),
        chemistry: Math.max(
          current.roguePersonalBests?.chemistry ?? 0,
          nextValues.chemistry ?? 0,
        ),
      },
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

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedSilverStarterPacks: current.ownedSilverStarterPacks + 1,
    }));
    return true;
  };

  const purchaseGoldStarterPack = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedGoldStarterPacks: current.ownedGoldStarterPacks + 1,
    }));
    return true;
  };

  const purchasePlatinumStarterPack = (price: number) => {
    if (metaProgress.tokens.balance < price) return false;

    setState((current) => ({
      ...current,
      spentTokens: current.spentTokens + price,
      ownedPlatinumStarterPacks: current.ownedPlatinumStarterPacks + 1,
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
      activeRogueStarId: current.activeRogueStarId ?? playerId,
    }));
    return true;
  };

  const setActiveRogueStar = (playerId: string | null) => {
    setState((current) => ({
      ...current,
      activeRogueStarId:
        playerId && current.ownedRogueStarIds.includes(playerId) ? playerId : null,
    }));
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

    setState((current) => ({
      ...current,
      ownedSilverStarterPacks: Math.max(0, current.ownedSilverStarterPacks - 1),
    }));
    return true;
  };

  const useGoldStarterPack = () => {
    if (state.ownedGoldStarterPacks <= 0) return false;

    setState((current) => ({
      ...current,
      ownedGoldStarterPacks: Math.max(0, current.ownedGoldStarterPacks - 1),
    }));
    return true;
  };

  const usePlatinumStarterPack = () => {
    if (state.ownedPlatinumStarterPacks <= 0) return false;

    setState((current) => ({
      ...current,
      ownedPlatinumStarterPacks: Math.max(0, current.ownedPlatinumStarterPacks - 1),
    }));
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
    purchaseTrainingCampTicket,
    purchaseTradePhone,
    purchaseSilverStarterPack,
    purchaseGoldStarterPack,
    purchasePlatinumStarterPack,
    purchaseRogueStar,
    setActiveRogueStar,
    useTrainingCampTicket,
    useTradePhone,
    useSilverStarterPack,
    useGoldStarterPack,
    usePlatinumStarterPack,
  };
};
