import { useEffect, useMemo, useState } from "react";
import { CategoryChallengeSelection, DraftChallengeSelection, DraftState, Player, RareEventSelection, RunHistoryEntry, Screen } from "../types";
import { STORAGE_KEY, assignPlayerToRoster, createSeed, generateChoices, rosterTemplate } from "../lib/draft";
import { allPlayers } from "../data/players";
import { runSeasonSimulation } from "../lib/simulate";
import {
  buildMetaProgress,
  getCategoryChallengeById,
  getDraftChallengeById,
  getRareEventById,
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
  fit: 0,
  chemistry: 0,
  variance: 0,
  spacing: 0,
  rimProtection: 0,
  wingDefense: 0,
  benchScoring: 0,
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
  "carmelo-anthony": "carmelo-anthony-nuggets",
  "tracy-mcgrady": "tracy-mcgrady-rockets",
  "vince-carter": "vince-carter-raptors",
};

const LEGACY_PLAYER_NAME_MIGRATIONS: Record<string, string> = {
  "Dwyane Wade (Young)": "Dwayne Wade ('03 - '10)",
  "Dwyane Wade (Big 3)": "Dwayne Wade ('10 - '14)",
  "LeBron James (Young Cavaliers)": "LeBron James ('03 - '10)",
  "LeBron James": "LeBron James ('14 - '18)",
  "LeBron James (2nd Cavaliers)": "LeBron James ('14 - '18)",
  "Shaquille O'Neal": "Shaquille O'Neal (Lakers)",
  "Kobe Bryant": "Kobe Bryant (#24)",
  "Kevin Durant": "Kevin Durant (Warriors)",
  "Kareem Abdul-Jabbar": "Kareem Abdul-Jabbar (Lakers)",
  "Ray Allen": "Ray Allen (Sonics)",
  "Kevin Garnett": "Kevin Garnett (Timberwolves)",
  "Dwyane Wade": "Dwayne Wade ('10 - '14)",
  "Chris Paul": "Chris Paul (Clippers)",
  "Carmelo Anthony": "Carmelo Anthony (Nuggets)",
  "Tracy McGrady": "Tracy McGrady (Rockets)",
  "Vince Carter": "Vince Carter (Raptors)",
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
  rareEventTitle: String(entry.rareEventTitle ?? "Standard environment"),
  categoryFocusId: entry.categoryFocusId ? String(entry.categoryFocusId) : null,
  categoryFocusTitle: entry.categoryFocusTitle ? String(entry.categoryFocusTitle) : null,
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
      fit: 0,
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
    () => buildMetaProgress(state.history, state.unlockedPlayerIds),
    [state.history, state.unlockedPlayerIds],
  );
  const teamAverage = useMemo(() => {
    const players = state.roster.map((slot) => slot.player).filter(Boolean) as Player[];
    if (players.length === 0) return 0;
    return Math.round((players.reduce((sum, player) => sum + player.overall, 0) / players.length) * 10) / 10;
  }, [state.roster]);

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

    const assignment = assignPlayerToRoster(state.roster, player);
    const draftedPlayerIds = [...state.draftedPlayerIds, player.id];
    const nextPick = state.pickNumber + 1;
    const nextChoices = nextPick <= 10 ? generateChoices(assignment.roster, draftedPlayerIds, state.seed, nextPick) : [];

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
    }));

    window.setTimeout(() => {
      setState((current) => ({
        ...current,
        selectedPlayerId: null,
        screen: nextPick > 10 ? "lineup" : current.screen,
      }));
    }, 420);
  };

  const beginSimulation = () => {
    if (!completedRoster) return;
    setState((current) => ({ ...current, screen: "simulating" }));

    window.setTimeout(() => {
      const previousMeta = buildMetaProgress(state.history, state.unlockedPlayerIds);
      const simulationResult = runSeasonSimulation(
        state.roster,
        state.seed,
        state.currentChallenge,
        state.currentRareEvent,
        state.currentCategoryChallenge,
      );
      const newPersonalBests = [
        simulationResult.mode === "season" && simulationResult.record.wins > previousMeta.personalBests.wins ? "Wins" : null,
        simulationResult.metrics.overall > previousMeta.personalBests.overall ? "Overall" : null,
        simulationResult.metrics.offense > previousMeta.personalBests.offense ? "Offense" : null,
        simulationResult.metrics.defense > previousMeta.personalBests.defense ? "Defense" : null,
        simulationResult.metrics.fit > previousMeta.personalBests.fit ? "Fit" : null,
        simulationResult.legacyScore > previousMeta.personalBests.legacyScore ? "Legacy Score" : null,
      ].filter((value): value is string => Boolean(value));
      const historyEntry = {
        id: `${state.seed}-${Date.now()}`,
        mode: simulationResult.mode,
        teamName: simulationResult.teamName,
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
        challengeTitle: simulationResult.challenge.title,
        challengeCompleted: simulationResult.challengeCompleted,
        rareEventTitle: simulationResult.rareEvent.title,
        categoryFocusId: simulationResult.categoryChallenge?.id ?? null,
        categoryFocusTitle: simulationResult.categoryChallenge?.metricLabel ?? null,
        focusScore: simulationResult.focusScore,
        titleOdds: simulationResult.titleOdds,
        metrics: simulationResult.metrics,
      };

      setState((current) => ({
        ...current,
        screen: "results",
        simulationResult: { ...simulationResult, newPersonalBests },
        history: [historyEntry, ...current.history].slice(0, HISTORY_LIMIT),
      }));
    }, 3200);
  };

  const handleRosterSlotClick = (index: number) => {
    setState((current) => {
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

  const setScreen = (screen: Screen) => {
    setState((current) => ({ ...current, screen }));
  };

  return {
    state,
    metaProgress,
    teamAverage,
    completedRoster,
    startDraft,
    beginDraftFromBriefing,
    draftPlayer,
    beginSimulation,
    resetDraft,
    setScreen,
    handleRosterSlotClick,
    moveRosterPlayer,
    setDraftChallengeSelection,
    setRareEventSelection,
    setCategoryChallengeSelection,
  };
};
