import { useEffect, useMemo, useState } from "react";
import { DraftState, Player, RunHistoryEntry, Screen } from "../types";
import { STORAGE_KEY, assignPlayerToRoster, createSeed, generateChoices, rosterTemplate } from "../lib/draft";
import { runSeasonSimulation } from "../lib/simulate";
import { buildMetaProgress, selectDraftChallenge, selectRareEvent } from "../lib/meta";
import { mulberry32 } from "../lib/random";

const HISTORY_LIMIT = 24;

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
    currentChallenge: selectDraftChallenge(rng),
    currentRareEvent: selectRareEvent(rng),
    seed,
  };
};

const normalizeState = (value: DraftState): DraftState => {
  const seed = value.seed ?? createSeed();
  const rng = mulberry32(seed + 77);

  return {
    ...createInitialState(),
    ...value,
    history: Array.isArray(value.history) ? value.history.map((entry) => upgradeHistoryEntry(entry as unknown as Record<string, unknown>)) : [],
    unlockedPlayerIds: Array.isArray(value.unlockedPlayerIds) ? value.unlockedPlayerIds : [],
    currentChallenge: value.currentChallenge ?? selectDraftChallenge(rng),
    currentRareEvent: value.currentRareEvent ?? selectRareEvent(rng),
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
    const fresh = createInitialState();
    setState({
      ...fresh,
      history: state.history,
      unlockedPlayerIds: state.unlockedPlayerIds,
      screen: "draft",
    });
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
    setState({
      ...fresh,
      history: state.history,
      unlockedPlayerIds: state.unlockedPlayerIds,
      screen: "landing",
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
    draftPlayer,
    beginSimulation,
    resetDraft,
    setScreen,
    handleRosterSlotClick,
  };
};
