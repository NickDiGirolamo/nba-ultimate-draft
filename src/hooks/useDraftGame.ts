import { useEffect, useMemo, useState } from "react";
import { DraftState, Player, Screen } from "../types";
import { STORAGE_KEY, assignPlayerToRoster, createSeed, generateChoices, rosterTemplate } from "../lib/draft";
import { runSeasonSimulation } from "../lib/simulate";

const HISTORY_LIMIT = 6;

const createInitialState = (): DraftState => {
  const seed = createSeed();
  const roster = rosterTemplate();

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
    history: [],
    seed,
  };
};

export const useDraftGame = () => {
  const [state, setState] = useState<DraftState>(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();

    try {
      return JSON.parse(saved) as DraftState;
    } catch {
      return createInitialState();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const completedRoster = useMemo(() => state.roster.every((slot) => slot.player !== null), [state.roster]);
  const teamAverage = useMemo(() => {
    const players = state.roster.map((slot) => slot.player).filter(Boolean) as Player[];
    if (players.length === 0) return 0;
    return Math.round((players.reduce((sum, player) => sum + player.overall, 0) / players.length) * 10) / 10;
  }, [state.roster]);

  const startDraft = () => {
    const fresh = createInitialState();
    setState({ ...fresh, history: state.history, screen: "draft" });
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
      selectedPlayerId: player.id,
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
      const simulationResult = runSeasonSimulation(state.roster, state.seed);
      const historyEntry = {
        id: `${state.seed}-${Date.now()}`,
        teamName: simulationResult.teamName,
        record: `${simulationResult.record.wins}-${simulationResult.record.losses}`,
        playoffFinish: simulationResult.playoffFinish,
        grade: simulationResult.draftGrade,
        createdAt: new Date().toLocaleDateString(),
      };

      setState((current) => ({
        ...current,
        screen: "results",
        simulationResult,
        history: [historyEntry, ...current.history].slice(0, HISTORY_LIMIT),
      }));
    }, 3200);
  };

  const resetDraft = () => {
    const fresh = createInitialState();
    setState({ ...fresh, history: state.history, screen: "landing" });
  };

  const setScreen = (screen: Screen) => {
    setState((current) => ({ ...current, screen }));
  };

  return { state, teamAverage, completedRoster, startDraft, draftPlayer, beginSimulation, resetDraft, setScreen };
};
