import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Flag, Shield, Sparkles, Swords, Target, Trophy } from "lucide-react";
import { DraftBriefing } from "./components/DraftBriefing";
import { DraftPlayerCard } from "./components/DraftPlayerCard";
import { LandingHub } from "./components/LandingHub";
import { ProgressHeader } from "./components/ProgressHeader";
import { ResultsShowcase } from "./components/ResultsShowcase";
import { RosterSidebar } from "./components/RosterSidebar";
import { SimulationScreen } from "./components/SimulationScreen";
import { useDraftGame } from "./hooks/useDraftGame";

const challengeStrategyMap: Record<string, string> = {
  "no-s-tier-shortcut": "Pass on raw ceiling and hunt efficient value, lineup fit, and synergy chains that can overperform their overall totals.",
  "floor-spacers": "Prioritize elite shooters early, then protect the spacing with playmakers and at least one dependable big.",
  "fortress-build": "Chase interior anchors, point-of-attack defenders, and rangy wings before you worry about pure scoring punch.",
  "creator-collective": "Stack initiators and secondary creators so every lineup unit has a real offensive organizer.",
  "dynasty-depth": "Treat the bench as a weapon. Balanced support slots and smart lineup order matter more than one extra star swing.",
  "title-or-bust": "Draft for playoff survivability: two-way stars, real size, late-game creation, and as few lineup holes as possible.",
};

const rareEventStrategyMap: Record<string, string> = {
  "rare-events-disabled": "No environment trick here. Draft the cleanest all-around roster you can and lean into broad team fit.",
  "nineties-night": "Old-school wings, bruising bigs, and 90s cores get more love than usual, so nostalgia-heavy builds have extra upside.",
  "pace-and-space": "Spacing matters more than normal. Prioritize shooting at guard and wing, and avoid clogging the floor with too many non-shooters.",
  "defense-travels": "This is the run to chase stoppers. Wing defense, rim deterrence, and lineup versatility will hold value deep into the playoffs.",
  "point-forward-era": "Large creators are premium. Wings and forwards who can initiate offense give your lineup a bigger boost than usual.",
  "tower-ball": "Don't be afraid to go big. Rebounding, interior defense, and frontcourt depth get a friendlier translation this run.",
};

const categoryStrategyMap: Record<string, string> = {
  offense: "Lean toward primary scorers, shot creators, and guards or wings who can keep pressure on the defense every possession.",
  defense: "Value stoppers, rim protectors, and lineup versatility over microwave offense.",
  playmaking: "Prioritize lead initiators and connective passers so every unit can generate easy looks.",
  shooting: "Load up on elite perimeter threats and avoid too many spacing liabilities in the same lineup.",
  rebounding: "Target size, physicality, and multiple frontcourt contributors who can control the glass.",
  fit: "Draft complementary skill sets instead of redundant stars. Cover creation, spacing, defense, and size in one coherent build.",
  chemistry: "Chase badge synergies, iconic pairings, and clean lineup balance that amplifies everyone else.",
  depth: "Treat the sixth through eighth spots like real rotation anchors and avoid letting the bench fall off a cliff.",
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
        summary: state.currentChallenge.description,
        detail: `Reward: +${state.currentChallenge.reward} legacy if you complete it.`,
        strategy:
          challengeStrategyMap[state.currentChallenge.id] ??
          "Draft with the active objective in mind and let it break ties between similar players.",
        icon: Flag,
        wrapperClass:
          "rounded-[26px] border border-amber-300/18 bg-[linear-gradient(135deg,rgba(252,211,77,0.14),rgba(15,23,42,0.82))] p-5",
        iconClass: "rounded-2xl bg-amber-300/16 p-3 text-amber-100",
        detailClass: "text-amber-100",
      },
      {
        id: "event",
        label: state.rareEventsEnabled ? "Rare Event Active" : "Environment",
        title: state.currentRareEvent.title,
        summary: state.rareEventsEnabled
          ? state.currentRareEvent.description
          : "Rare events are disabled, so this run uses the standard simulation environment.",
        detail: state.currentRareEvent.impact,
        strategy:
          rareEventStrategyMap[state.currentRareEvent.id] ??
          "Use the event as a tiebreaker whenever you are choosing between otherwise similar roster directions.",
        icon: Sparkles,
        wrapperClass: state.rareEventsEnabled
          ? "rounded-[26px] border border-sky-300/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(15,23,42,0.78))] p-5"
          : "rounded-[26px] border border-white/10 bg-black/20 p-5",
        iconClass: state.rareEventsEnabled
          ? "rounded-2xl bg-sky-300/16 p-3 text-sky-100"
          : "rounded-2xl bg-white/8 p-3 text-slate-300",
        detailClass: state.rareEventsEnabled ? "text-sky-100" : "text-slate-300",
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
            ? state.currentCategoryChallenge.description
            : "No category-focus objective is active, so you can draft for the best all-around outcome.",
        detail:
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
          ? "rounded-[26px] border border-emerald-300/18 bg-[linear-gradient(135deg,rgba(74,222,128,0.14),rgba(15,23,42,0.82))] p-5"
          : "rounded-[26px] border border-white/10 bg-black/20 p-5",
        iconClass: state.categoryChallengesEnabled
          ? "rounded-2xl bg-emerald-300/16 p-3 text-emerald-100"
          : "rounded-2xl bg-white/8 p-3 text-slate-300",
        detailClass: state.categoryChallengesEnabled ? "text-emerald-100" : "text-slate-300",
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
      }, 500 + index * 2200),
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
              <button
                type="button"
                onClick={resetDraft}
                className="mt-1 font-display text-2xl text-white transition hover:text-amber-100"
              >
                All-Time NBA Franchise Builder
              </button>
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
            <ProgressHeader pickNumber={state.pickNumber} />

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-5">
                <div className="glass-panel rounded-[28px] p-5 shadow-card">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pick Window</p>
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

                <div className="glass-panel rounded-[28px] p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/8 p-3 text-slate-200">
                      <Shield size={20} />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Intel</div>
                      <h3 className="mt-1 font-display text-2xl text-white">Active parameters and draft strategy</h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-3">
                    {draftIntel.map((item) => (
                      <div key={item.id} className={item.wrapperClass}>
                        <div className="flex items-start gap-4">
                          <div className={item.iconClass}>
                            <item.icon size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                              {item.label}
                            </div>
                            <h4 className="mt-2 font-display text-2xl text-white">{item.title}</h4>
                            <p className="mt-3 text-sm leading-7 text-slate-200">{item.summary}</p>
                            <div className={`mt-3 text-sm ${item.detailClass}`}>{item.detail}</div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Draft Strategy</div>
                          <div className="mt-2 text-sm leading-7 text-slate-200">{item.strategy}</div>
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
                        className={revealed ? "choice-reveal animate-choice-reveal" : "choice-hidden"}
                        style={{ animationDelay: revealed ? `${index * 220}ms` : "0ms" }}
                      >
                        {revealed ? (
                          <DraftPlayerCard
                            player={player}
                            onSelect={draftPlayer}
                            disabled={Boolean(state.selectedPlayerId)}
                            selected={state.selectedPlayerId === player.id}
                            draftedPlayerIds={state.draftedPlayerIds}
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
