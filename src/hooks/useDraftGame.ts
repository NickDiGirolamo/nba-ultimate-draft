import { useEffect, useMemo, useState } from "react";
import { CategoryChallengeSelection, DraftChallengeSelection, DraftState, Player, RareEventSelection, RunHistoryEntry, Screen } from "../types";
import { STORAGE_KEY, assignPlayerToRoster, createSeed, generateChoices, rosterTemplate } from "../lib/draft";
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

const resolveDraftChallenge = (selection: DraftChallengeSelection, rng: () => number) =>
  selection === "random" ? selectDraftChallenge(rng) : getDraftChallengeById(selection);

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
  titleOdds: Number(entry.titleOdds ?? 0),
  metrics: (entry.metrics as RunHistoryEntry["metrics"]) ?? {
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
  },
});

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
    unlockedPlayerIds: Array.isArray(value.unlockedPlayerIds) ? value.unlockedPlayerIds : [],
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
      setState((current) => ({ ...current, selectedPlayerId: null }));
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
      );
      const newPersonalBests = [
        simulationResult.record.wins > previousMeta.personalBests.wins ? "Wins" : null,
        simulationResult.metrics.overall > previousMeta.personalBests.overall ? "Overall" : null,
        simulationResult.metrics.offense > previousMeta.personalBests.offense ? "Offense" : null,
        simulationResult.metrics.defense > previousMeta.personalBests.defense ? "Defense" : null,
        simulationResult.metrics.fit > previousMeta.personalBests.fit ? "Fit" : null,
        simulationResult.legacyScore > previousMeta.personalBests.legacyScore ? "Legacy Score" : null,
      ].filter((value): value is string => Boolean(value));
      const historyEntry = {
        id: `${state.seed}-${Date.now()}`,
        teamName: simulationResult.teamName,
        record: `${simulationResult.record.wins}-${simulationResult.record.losses}`,
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
          current.rareEventSelection === "random"
            ? resolvedParameters.rareEvent
            : current.currentRareEvent,
        currentCategoryChallenge:
          current.categoryChallengeSelection === "random"
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
    setDraftChallengeSelection,
    setRareEventSelection,
    setCategoryChallengeSelection,
  };
};
