import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Flag, Sparkles, Swords, Target, Trophy } from "lucide-react";
import { DraftBriefing } from "./components/DraftBriefing";
import { DraftPlayerCard } from "./components/DraftPlayerCard";
import { LandingHub } from "./components/LandingHub";
import { ProgressHeader } from "./components/ProgressHeader";
import { ResultsShowcase } from "./components/ResultsShowcase";
import { RosterSidebar } from "./components/RosterSidebar";
import { SimulationScreen } from "./components/SimulationScreen";
import { useDraftGame } from "./hooks/useDraftGame";

const challengeStrategyMap: Record<string, string> = {
  "classic": "Take the best long-term team, not the flashiest individual player.",
  "no-s-tier-shortcut": "Lean into fit, value, and synergy instead of pure ceiling.",
  "floor-spacers": "Protect spacing with shooters, creators, and at least one stable big.",
  "fortress-build": "Prioritize stoppers, rim protection, and versatile size.",
  "creator-collective": "Stack initiators so every lineup unit has an organizer.",
  "dynasty-depth": "Treat the middle of the rotation like real winning equity.",
  "title-or-bust": "Draft for playoff survivability with as few weak spots as possible.",
};

const rareEventStrategyMap: Record<string, string> = {
  "rare-events-disabled": "Draft the cleanest all-around roster you can.",
  "nineties-night": "90s cores, physical wings, and classic bigs get extra lift.",
  "pace-and-space": "Shooting and spacing matter more than usual here.",
  "defense-travels": "Stops, length, and versatility carry more weight.",
  "point-forward-era": "Big initiators and jumbo creators get a boost.",
  "tower-ball": "Size, rebounding, and paint control play better here.",
};

const categoryStrategyMap: Record<string, string> = {
  offense: "Prioritize scoring gravity, creators, and shot pressure.",
  defense: "Value stoppers, rim protection, and switchable size.",
  playmaking: "Stack initiators and connective passers.",
  shooting: "Load up on elite spacing and avoid floor-cloggers.",
  rebounding: "Target size, strength, and multiple glass-crashers.",
  fit: "Draft complementary roles instead of redundant stars.",
  chemistry: "Chase synergy badges and clean lineup balance.",
};

function App() {
  const {
    state,
    metaProgress,
    teamAverage,
    completedRoster,
    startDraft,
    draftPlayer,
    beginSimulation,
    resetDraft,
    handleRosterSlotClick,
    setDraftChallengeSelection,
    setRareEventSelection,
    setCategoryChallengeSelection,
    beginDraftFromBriefing,
  } = useDraftGame();

  const choiceSignature = useMemo(
    () => state.currentChoices.map((player) => player.id).join("|"),
    [state.currentChoices],
  );
  const [visibleChoiceCount, setVisibleChoiceCount] = useState(
    state.currentChoices.length,
  );
  const draftIntel = useMemo(() => {
    const cards = [
      {
        id: "challenge",
        label: "Primary Challenge",
        title: state.currentChallenge.title,
        summary:
          state.currentChallenge.reward > 0
            ? `+${state.currentChallenge.reward} legacy`
            : "Standard season sim",
        strategy:
          challengeStrategyMap[state.currentChallenge.id] ??
          "Draft with the active objective in mind and let it break ties between similar players.",
        icon: Flag,
        wrapperClass:
          "rounded-xl border border-amber-300/18 bg-amber-300/10 p-3",
        iconClass: "rounded-lg bg-amber-300/16 p-2 text-amber-100",
        summaryClass: "text-amber-100",
      },
      {
        id: "event",
        label: state.rareEventsEnabled ? "Rare Event Active" : "Environment",
        title: state.currentRareEvent.title,
        summary: state.currentRareEvent.impact,
        strategy:
          rareEventStrategyMap[state.currentRareEvent.id] ??
          "Use the event as a tiebreaker whenever you are choosing between otherwise similar roster directions.",
        icon: Sparkles,
        wrapperClass: state.rareEventsEnabled
          ? "rounded-xl border border-sky-300/18 bg-sky-300/10 p-3"
          : "rounded-xl border border-white/10 bg-black/20 p-3",
        iconClass: state.rareEventsEnabled
          ? "rounded-lg bg-sky-300/16 p-2 text-sky-100"
          : "rounded-lg bg-white/8 p-2 text-slate-300",
        summaryClass: state.rareEventsEnabled ? "text-sky-100" : "text-slate-300",
      },
      {
        id: "category",
        label: "Category Focus",
        title:
          state.categoryChallengesEnabled && state.currentCategoryChallenge
            ? state.currentCategoryChallenge.metricLabel
            : "Disabled",
        summary:
          state.categoryChallengesEnabled && state.currentCategoryChallenge
            ? `Goal: maximize your final ${state.currentCategoryChallenge.metricLabel.toLowerCase()} score.`
            : "Goal: maximize total team quality instead of chasing one specific metric.",
        strategy:
          state.categoryChallengesEnabled && state.currentCategoryChallenge
            ? categoryStrategyMap[state.currentCategoryChallenge.metric] ??
              "Let the focus category break ties between players while still protecting overall roster balance."
            : "Use this flexibility to build the strongest balanced roster possible.",
        icon: Target,
        wrapperClass: state.categoryChallengesEnabled
          ? "rounded-xl border border-emerald-300/18 bg-emerald-300/10 p-3"
          : "rounded-xl border border-white/10 bg-black/20 p-3",
        iconClass: state.categoryChallengesEnabled
          ? "rounded-lg bg-emerald-300/16 p-2 text-emerald-100"
          : "rounded-lg bg-white/8 p-2 text-slate-300",
        summaryClass: state.categoryChallengesEnabled ? "text-emerald-100" : "text-slate-300",
      },
    ];

    return cards;
  }, [
    state.categoryChallengesEnabled,
    state.currentCategoryChallenge,
    state.currentChallenge,
    state.currentRareEvent,
    state.rareEventsEnabled,
  ]);

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
      }, 500 + index * 1700),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [choiceSignature, state.currentChoices, state.screen]);

  return (
    <div className="arena-shell text-white">
      <div className="mx-auto max-w-[1520px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        {state.screen !== "draft" && (
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={resetDraft}
              className="flex items-center gap-3 text-left transition hover:text-amber-100"
            >
              <div className="rounded-[20px] border border-white/12 bg-white/8 p-2.5 shadow-card">
                <Trophy size={22} className="text-amber-200" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Legends Draft</div>
                <div className="mt-1 font-display text-xl text-white">
                  All-Time NBA Franchise Builder
                </div>
              </div>
            </button>

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
        )}

        {state.screen === "landing" && (
          <LandingHub
            onStart={startDraft}
            history={state.history}
            meta={metaProgress}
            draftChallengeSelection={state.draftChallengeSelection}
            currentChallenge={state.currentChallenge}
            onDraftChallengeSelectionChange={setDraftChallengeSelection}
            rareEventsEnabled={state.rareEventsEnabled}
            rareEventSelection={state.rareEventSelection}
            currentRareEvent={state.currentRareEvent}
            onRareEventSelectionChange={setRareEventSelection}
            categoryChallengesEnabled={state.categoryChallengesEnabled}
            categoryChallengeSelection={state.categoryChallengeSelection}
            currentCategoryChallenge={state.currentCategoryChallenge}
            onCategoryChallengeSelectionChange={setCategoryChallengeSelection}
          />
        )}

        {state.screen === "briefing" && (
          <DraftBriefing
            challenge={state.currentChallenge}
            rareEvent={state.currentRareEvent}
            rareEventsEnabled={state.rareEventsEnabled}
            categoryChallenge={state.currentCategoryChallenge}
            categoryChallengesEnabled={state.categoryChallengesEnabled}
            onBack={resetDraft}
            onBegin={beginDraftFromBriefing}
          />
        )}

        {state.screen === "draft" && (
          <section className="space-y-6">
            <div className="flex gap-6 [&>*]:min-w-0 [&>*]:flex-1">
              <ProgressHeader pickNumber={state.pickNumber} />

              <div className="glass-panel flex-1 rounded-[28px] p-5 shadow-card">
                <div className="flex h-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                        Legends Draft
                      </span>
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Pick Window</span>
                    </div>
                    <h2 className="mt-2 font-display text-3xl text-white">Choose 1 of 5 legends</h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                      <span className="rounded-full border border-amber-200/18 bg-amber-300/10 px-3 py-2 text-amber-100">
                        Challenge: {state.currentChallenge.title}
                      </span>
                      <span className={state.rareEventsEnabled
                        ? "rounded-full border border-sky-200/18 bg-sky-300/10 px-3 py-2 text-sky-100"
                        : "rounded-full border border-white/12 bg-white/8 px-3 py-2 text-slate-300"}>
                        Event: {state.currentRareEvent.title}
                      </span>
                      {state.categoryChallengesEnabled && state.currentCategoryChallenge ? (
                        <span className="rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-2 text-emerald-100">
                          Focus: {state.currentCategoryChallenge.metricLabel}
                        </span>
                      ) : null}
                    </div>
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
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-5">

                <div className="glass-panel rounded-[20px] p-3 shadow-card">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Run Intel</div>
                    <div className="text-[11px] text-slate-500">Quick modifiers</div>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-3">
                    {draftIntel.map((item) => (
                      <div key={item.id} className={item.wrapperClass}>
                        <div className="flex items-start gap-3">
                          <div className={item.iconClass}>
                            <item.icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                              {item.label}
                            </div>
                            <h4 className="mt-0.5 font-display text-base text-white">{item.title}</h4>
                            <p className={`mt-1 text-[11px] leading-4 ${item.summaryClass}`}>{item.summary}</p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-300">{item.strategy}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {state.currentChoices.map((player, index) => {
                    const revealed = index < visibleChoiceCount;

                    return (
                      <div
                        key={player.id}
                        className="choice-slot"
                        style={{ animationDelay: `${index * 220}ms` }}
                      >
                        <div className={`choice-flip-card ${revealed ? "is-revealed" : ""}`}>
                          <div className="choice-face choice-face-back">
                            <div className="choice-card-back h-full min-h-[1040px] rounded-[26px] border border-white/10">
                              <div className="choice-card-back__inner">
                                <div className="choice-card-back__badge">Legends Draft</div>
                                <div className="choice-card-back__crest">
                                  <div className="choice-card-back__crest-ring" />
                                  <div className="choice-card-back__crest-core">NBA</div>
                                </div>
                                <div className="choice-card-back__pattern" />
                                <div className="choice-card-back__footer">
                                  <span>All-Time</span>
                                  <span>Reveal</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="choice-face choice-face-front">
                            <DraftPlayerCard
                              player={player}
                              onSelect={draftPlayer}
                              disabled={Boolean(state.selectedPlayerId)}
                              selected={state.selectedPlayerId === player.id}
                              draftedPlayerIds={state.draftedPlayerIds}
                            />
                          </div>
                        </div>
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
          <ResultsShowcase
            result={state.simulationResult}
            roster={state.roster}
            onDraftAgain={startDraft}
            meta={metaProgress}
            history={state.history}
          />
        )}
      </div>
    </div>
  );
}

export default App;
