import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Swords, Trophy } from "lucide-react";
import { DraftPlayerCard } from "./components/DraftPlayerCard";
import { LandingScreen } from "./components/LandingScreen";
import { ProgressHeader } from "./components/ProgressHeader";
import { ResultsShowcase } from "./components/ResultsShowcase";
import { RosterSidebar } from "./components/RosterSidebar";
import { SimulationScreen } from "./components/SimulationScreen";
import { useDraftGame } from "./hooks/useDraftGame";

function App() {
  const {
    state,
    teamAverage,
    completedRoster,
    startDraft,
    draftPlayer,
    beginSimulation,
    resetDraft,
    handleRosterSlotClick,
  } = useDraftGame();

  const choiceSignature = useMemo(
    () => state.currentChoices.map((player) => player.id).join("|"),
    [state.currentChoices],
  );
  const [visibleChoiceCount, setVisibleChoiceCount] = useState(
    state.currentChoices.length,
  );

  useEffect(() => {
    if (state.screen !== "draft") {
      setVisibleChoiceCount(state.currentChoices.length);
      return;
    }

    if (state.currentChoices.length === 0) {
      setVisibleChoiceCount(0);
      return;
    }

    setVisibleChoiceCount(0);
    const timers = state.currentChoices.map((_, index) =>
      window.setTimeout(() => {
        setVisibleChoiceCount((current) => Math.max(current, index + 1));
      }, 120 + index * 170),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [choiceSignature, state.currentChoices, state.screen]);

  return (
    <div className="arena-shell text-white">
      <div className="mx-auto max-w-[1520px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-[24px] border border-white/12 bg-white/8 p-3 shadow-card">
              <Trophy size={26} className="text-amber-200" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Legends Draft</div>
              <div className="mt-1 font-display text-2xl text-white">All-Time NBA Franchise Builder</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Draft Mode", value: "1 of 5", icon: Swords },
              { label: "Simulation", value: "82 + Playoffs", icon: BrainCircuit },
              { label: "Team Building", value: "Fit Matters", icon: Trophy },
            ].map((item) => (
              <div key={item.label} className="glass-panel rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                  <item.icon size={14} />
                  {item.label}
                </div>
                <div className="mt-2 text-base font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </header>

        {state.screen === "landing" && <LandingScreen onStart={startDraft} history={state.history} />}

        {state.screen === "draft" && (
          <section className="space-y-6">
            <ProgressHeader pickNumber={state.pickNumber} />

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-5">
                <div className="glass-panel rounded-[28px] p-5 shadow-card">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pick Window</p>
                      <h2 className="mt-2 font-display text-3xl text-white">Choose 1 of 5 legends</h2>
                    </div>
                    <button
                      type="button"
                      onClick={beginSimulation}
                      disabled={!completedRoster}
                      className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-slate-400"
                    >
                      Simulate Season
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {state.currentChoices.map((player, index) => {
                    const revealed = index < visibleChoiceCount;

                    return (
                      <div
                        key={player.id}
                        className={revealed ? "choice-reveal animate-choice-reveal" : "choice-hidden"}
                        style={{ animationDelay: revealed ? `${index * 45}ms` : "0ms" }}
                      >
                        {revealed ? (
                          <DraftPlayerCard
                            player={player}
                            onSelect={draftPlayer}
                            disabled={Boolean(state.selectedPlayerId)}
                            selected={state.selectedPlayerId === player.id}
                          />
                        ) : (
                          <div className="choice-placeholder h-full min-h-[390px] rounded-[26px] border border-white/10">
                            <div className="flex h-full flex-col justify-between p-5">
                              <div className="h-20 rounded-[22px] bg-white/6" />
                              <div className="h-[244px] rounded-[22px] bg-white/6" />
                              <div className="h-8 rounded-xl bg-white/6" />
                              <div className="h-12 rounded-2xl bg-white/6" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <RosterSidebar
                  roster={state.roster}
                  teamAverage={teamAverage}
                  lastFilledSlot={state.lastFilledSlot}
                  selectedSlotIndex={state.selectedSlotIndex}
                  onSlotClick={handleRosterSlotClick}
                />
                <div className="glass-panel rounded-[28px] p-5 shadow-card">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Team Snapshot</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Drafted Players</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{state.draftedPlayerIds.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Best Path</div>
                      <div className="mt-2 text-sm leading-6 text-slate-200">
                        Build around creation, spacing, and at least one real interior defender.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Run Reset</div>
                      <button onClick={resetDraft} className="mt-2 text-sm font-medium text-rose-200 transition hover:text-white">
                        Start new draft
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {state.screen === "simulating" && <SimulationScreen />}

        {state.screen === "results" && state.simulationResult && (
          <ResultsShowcase result={state.simulationResult} roster={state.roster} onDraftAgain={startDraft} />
        )}
      </div>
    </div>
  );
}

export default App;
