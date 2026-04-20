import { useEffect, useMemo, useState } from "react";
import { BookOpen, Coins, Crown, Flag, Sparkles, Swords, Target, Trophy } from "lucide-react";
import { DraftBriefing } from "./components/DraftBriefing";
import { DraftPlayerCard } from "./components/DraftPlayerCard";
import { LandingHub } from "./components/LandingHub";
import { LearnOverlay } from "./components/LearnOverlay";
import { LineupReorderScreen } from "./components/LineupReorderScreen";
import { PrestigeLevelUpModal } from "./components/PrestigeLevelUpModal";
import { PrestigeOverlay } from "./components/PrestigeOverlay";
import { ProgressHeader } from "./components/ProgressHeader";
import { ResultsShowcase } from "./components/ResultsShowcase";
import { RoguelikeMode } from "./components/RoguelikeMode";
import { RosterSidebar } from "./components/RosterSidebar";
import { SimulationScreen } from "./components/SimulationScreen";
import { TokenStoreOverlay } from "./components/TokenStoreOverlay";
import { useDraftGame } from "./hooks/useDraftGame";
import { getCategoryChallengeTarget } from "./lib/simulate";

const ROGUELIKE_UI_STORAGE_KEY = "legends-draft-roguelike-ui-v1";
const ROGUELIKE_RUN_STORAGE_KEY = "legends-draft-roguelike-run-v1";
const ROGUELIKE_PARKED_STORAGE_KEY = "legends-draft-roguelike-parked-v1";

const challengeStrategyMap: Record<string, string> = {
  "classic": "Take the best long-term team, not the flashiest individual player.",
  "no-s-tier-shortcut": "Lean into chemistry, value, and synergy instead of pure ceiling.",
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
  playmaking: "Stack passers, initiators, and connective decision-makers.",
  shooting: "Load up on elite spacing and avoid floor-cloggers.",
  rebounding: "Target size, strength, and multiple glass-crashers.",
  chemistry: "Chase badge synergies while keeping players in coherent positions and roles.",
};

function App() {
  const {
    state,
    metaProgress,
    teamAverage,
    draftChemistry,
    completedRoster,
    startDraft,
    draftPlayer,
    beginSimulation,
    resetDraft,
    handleRosterSlotClick,
    moveRosterPlayer,
    skipBonusPick,
    setDraftChallengeSelection,
    setRareEventSelection,
    setCategoryChallengeSelection,
    applyRunPreset,
    beginDraftFromBriefing,
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
  } = useDraftGame();

  const choiceSignature = useMemo(
    () => state.currentChoices.map((player) => player.id).join("|"),
    [state.currentChoices],
  );
  const [visibleChoiceCount, setVisibleChoiceCount] = useState(
    state.currentChoices.length,
  );
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [prestigeInitialView, setPrestigeInitialView] = useState<"overview" | "challenges" | "rewards" | "collection">("overview");
  const [learnOpen, setLearnOpen] = useState(false);
  const [tokenStoreOpen, setTokenStoreOpen] = useState(false);
  const [showPrestigeLevelUp, setShowPrestigeLevelUp] = useState(false);
  const [showExtraPickIntro, setShowExtraPickIntro] = useState(false);
  const [roguelikeOpen, setRoguelikeOpen] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      const openFlag = window.localStorage.getItem(ROGUELIKE_UI_STORAGE_KEY);
      const hasSavedRun = Boolean(window.localStorage.getItem(ROGUELIKE_RUN_STORAGE_KEY));
      const parkedRun = window.localStorage.getItem(ROGUELIKE_PARKED_STORAGE_KEY) === "true";
      return openFlag === "true" || (hasSavedRun && !parkedRun);
    } catch {
      return false;
    }
  });
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
  const currentCategoryTarget = useMemo(
    () =>
      state.currentCategoryChallenge
        ? getCategoryChallengeTarget(state.currentCategoryChallenge.metric)
        : null,
    [state.currentCategoryChallenge],
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
      }, 500 + index * 1700),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [choiceSignature, state.currentChoices, state.screen]);

  useEffect(() => {
    if (state.screen === "results" && state.simulationResult?.prestigeLevelUp) {
      setShowPrestigeLevelUp(true);
      return;
    }

    setShowPrestigeLevelUp(false);
  }, [state.screen, state.simulationResult?.prestigeLevelUp]);

  useEffect(() => {
    if (state.screen === "draft" && state.bonusPickActive) {
      setShowExtraPickIntro(true);
      return;
    }

    setShowExtraPickIntro(false);
  }, [state.screen, state.bonusPickActive]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROGUELIKE_UI_STORAGE_KEY, roguelikeOpen ? "true" : "false");
  }, [roguelikeOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [state.screen, roguelikeOpen, prestigeOpen, tokenStoreOpen, learnOpen, showPrestigeLevelUp]);

  return (
    <div className="arena-shell text-white">
      <div className="mx-auto max-w-[1520px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (roguelikeOpen && typeof window !== "undefined") {
                window.localStorage.setItem(ROGUELIKE_PARKED_STORAGE_KEY, "true");
              }
              setRoguelikeOpen(false);
              resetDraft();
            }}
            className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-left transition hover:border-amber-200/22 hover:bg-black/24"
          >
            <div className="rounded-2xl border border-amber-200/18 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),rgba(249,115,22,0.14),rgba(15,23,42,0.2))] p-2.5 text-amber-200 shadow-[0_10px_24px_rgba(251,191,36,0.16)]">
              <Trophy size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Home</div>
              <div className="mt-1 truncate font-display text-[clamp(1.1rem,1.6vw,1.6rem)] text-white">
                NBA Ultimate Draft
              </div>
            </div>
          </button>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setLearnOpen(true)}
              className="glass-panel group h-[94px] min-w-[230px] rounded-2xl border border-sky-200/12 bg-[linear-gradient(135deg,rgba(9,18,34,0.96),rgba(16,26,46,0.92))] px-4 py-3 text-left shadow-[0_16px_32px_rgba(0,0,0,0.24)] transition hover:border-sky-200/28 hover:bg-[linear-gradient(135deg,rgba(12,24,44,0.98),rgba(20,34,58,0.94))] hover:shadow-[0_18px_36px_rgba(56,189,248,0.14)]"
            >
	              <div className="flex items-center justify-between gap-3">
	                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                  <div className="rounded-full border border-sky-200/18 bg-sky-300/12 p-1.5 text-sky-200 transition group-hover:border-sky-200/28 group-hover:bg-sky-300/18">
                    <BookOpen size={13} />
                  </div>
                  Learn The Game
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-100">
                  Open
                </span>
              </div>
	              <div className="mt-3 text-[0.88rem] font-medium leading-5 text-slate-300">
	                Learn categories, badges, and draft tips
	              </div>
            </button>
            <button
              type="button"
              onClick={() => setTokenStoreOpen(true)}
              className="glass-panel h-[94px] min-w-[200px] rounded-2xl px-4 py-3 text-left transition hover:border-amber-200/24 hover:bg-white/10"
            >
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                <Coins size={13} className="text-amber-200" />
                Tokens
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-[2rem] font-semibold leading-none text-white">
                  {metaProgress.tokens.balance}
                </div>
                <div className="pb-1 text-right text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  Spendable
                </div>
              </div>
              <div className="mt-2 h-1" />
            </button>
            <button
              type="button"
              onClick={() => {
                setPrestigeInitialView("overview");
                setPrestigeOpen(true);
              }}
              className="glass-panel h-[94px] min-w-[230px] rounded-2xl px-4 py-3 text-left transition hover:border-amber-200/24 hover:bg-white/10"
            >
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                <Crown size={13} className="text-amber-200" />
                Prestige
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="flex items-end gap-2">
                  <span className="pb-1 text-[10px] uppercase tracking-[0.14em] text-amber-100/80">Lvl</span>
                  <span className="text-[2rem] font-semibold leading-none text-white">
                    {metaProgress.prestige.level}
                  </span>
                </div>
                <div className="pb-1 text-right text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  {metaProgress.prestige.score}/{metaProgress.prestige.nextLevelScore}
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-slate-700/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300"
                  style={{
                    width: `${Math.max(
                      6,
                      Math.round(metaProgress.prestige.progressToNextLevel * 100),
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 h-1" />
            </button>
          </div>
        </div>

        {roguelikeOpen && (
          <RoguelikeMode
            activeRogueStarId={state.activeRogueStarId}
            ownedTrainingCampTickets={state.ownedTrainingCampTickets}
            ownedTradePhones={state.ownedTradePhones}
            ownedSilverStarterPacks={state.ownedSilverStarterPacks}
            ownedGoldStarterPacks={state.ownedGoldStarterPacks}
            ownedPlatinumStarterPacks={state.ownedPlatinumStarterPacks}
            onAwardFailureRewards={awardRogueFailureRewards}
            onUpdatePersonalBests={updateRoguePersonalBests}
            onUseTrainingCampTicket={useTrainingCampTicket}
            onUseTradePhone={useTradePhone}
            onUseSilverStarterPack={useSilverStarterPack}
            onUseGoldStarterPack={useGoldStarterPack}
            onUsePlatinumStarterPack={usePlatinumStarterPack}
            onLeaveRun={() => {
              setRoguelikeOpen(false);
              resetDraft();
            }}
            onBackToHome={() => {
              setRoguelikeOpen(false);
              resetDraft();
            }}
          />
        )}

        {!roguelikeOpen && state.screen === "landing" && (
          <LandingHub
            onOpenPrestige={() => {
              setPrestigeInitialView("overview");
              setPrestigeOpen(true);
            }}
            onOpenChallenges={() => {
              setPrestigeInitialView("challenges");
              setPrestigeOpen(true);
            }}
            onOpenCollection={() => {
              setPrestigeInitialView("collection");
              setPrestigeOpen(true);
            }}
            onOpenRoguelike={() => setRoguelikeOpen(true)}
            history={state.history}
            meta={metaProgress}
          />
        )}

        {!roguelikeOpen && state.screen === "briefing" && (
          <DraftBriefing
            challenge={state.currentChallenge}
            rareEvent={state.currentRareEvent}
            rareEventsEnabled={state.rareEventsEnabled}
            categoryChallenge={state.currentCategoryChallenge}
            categoryChallengesEnabled={state.categoryChallengesEnabled}
            prestigeReward={state.activePrestigeChallengeReward}
            focusTargetScore={currentCategoryTarget}
            onBack={resetDraft}
            onBegin={beginDraftFromBriefing}
          />
        )}

        {!roguelikeOpen && state.screen === "draft" && (
          <section className="space-y-6">
            <div
              style={{
                display: "grid",
                width: "100%",
                gridTemplateColumns: "minmax(0,10fr) minmax(0,45fr) minmax(0,45fr)",
                alignItems: "stretch",
                columnGap: "12px",
              }}
            >
              <button
                type="button"
                onClick={resetDraft}
                className="glass-panel inline-flex h-full min-w-0 flex-col items-center justify-center gap-2 rounded-[28px] p-3 text-center shadow-card transition hover:border-amber-200/40 hover:text-amber-100"
              >
                <div className="rounded-full border border-white/12 bg-white/8 p-2">
                  <Trophy size={14} className="text-amber-200" />
                </div>
                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-200">Home</span>
              </button>

              <div className="min-w-0">
                <ProgressHeader pickNumber={state.pickNumber} bonusPickActive={state.bonusPickActive} />
              </div>

              <div
                className="glass-panel min-w-0 rounded-[28px] p-4 shadow-card"
              >
                <div className="flex h-full min-w-0 flex-col justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                        Legends Draft
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Pick Window</span>
                      </div>
                    <h2 className="mt-2 font-display text-[clamp(1.35rem,2vw,2.3rem)] leading-none text-white">
                      {state.bonusPickActive ? "Choose 1 bonus player" : "Choose 1 of 5"}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[0.12em] text-slate-300">
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
                      {state.bonusPickActive ? (
                        <span className="rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-3 py-2 text-fuchsia-100">
                          Prestige Reward: Extra Pick
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-300">
                      {state.bonusPickActive
                        ? state.selectedSlotIndex === null
                          ? "Select one current roster slot from the lineup board, then choose a bonus player to replace it."
                          : "Choose one of the 5 bonus players to replace the highlighted roster slot."
                        : "Build the strongest 10-player roster you can before heading to lineup re-order."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={state.bonusPickActive ? skipBonusPick : beginSimulation}
                    disabled={state.bonusPickActive ? false : !completedRoster}
                    className="self-start rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-slate-400"
                  >
                    {state.bonusPickActive ? "Skip Extra Pick" : "Simulate Season"}
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

                <div className="px-1">
                  <p className="text-center text-xs font-medium tracking-[0.14em] text-white/90">
                    {state.bonusPickActive ? "Choose 1 of 5 Bonus Players" : "Choose 1 of 5 Players"}
                  </p>
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
                              disabled={Boolean(state.selectedPlayerId) || (state.bonusPickActive && state.selectedSlotIndex === null)}
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
                  draftChemistry={draftChemistry}
                  lastFilledSlot={state.lastFilledSlot}
                  selectedSlotIndex={state.selectedSlotIndex}
                  bonusPickActive={state.bonusPickActive}
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

            {showExtraPickIntro && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/78 px-4 backdrop-blur-sm">
                <div className="w-full max-w-2xl rounded-[32px] border border-fuchsia-200/22 bg-[linear-gradient(135deg,rgba(36,16,54,0.98),rgba(15,23,42,0.98),rgba(28,18,52,0.96))] p-7 shadow-[0_0_0_1px_rgba(216,180,254,0.06),0_0_42px_rgba(192,132,252,0.24)] lg:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-[22px] border border-fuchsia-200/22 bg-fuchsia-300/14 p-3 text-fuchsia-100">
                      <Crown size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.28em] text-fuchsia-100/78">
                        Extra Pick
                      </div>
                      <h2 className="mt-2 font-display text-4xl text-white lg:text-5xl">
                        Bonus Board Unlocked
                      </h2>
                      <p className="mt-4 text-base leading-8 text-slate-200">
                        You can replace one player on your roster with one of these 5 extra-pick options, or skip the pick and keep your team exactly as it is.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-black/22 p-5">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                        <Target size={14} className="text-sky-200" />
                        How It Works
                      </div>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                        <p>1. Select one roster player to replace on the lineup board.</p>
                        <p>2. Choose one of the 5 extra-pick players.</p>
                        <p>3. If none help your team, skip the pick.</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-emerald-200/18 bg-emerald-300/10 p-5">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-emerald-100/80">
                        <Sparkles size={14} />
                        Best Use
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-100">
                        This is a great chance to upgrade your weakest roster spot or complete a synergy badge you already have in play.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExtraPickIntro(false);
                        skipBonusPick();
                      }}
                      className="rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Skip Pick
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExtraPickIntro(false)}
                      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100"
                    >
                      Choose Player To Replace
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {!roguelikeOpen && state.screen === "lineup" && (
          <LineupReorderScreen
            roster={state.roster}
            onMovePlayer={moveRosterPlayer}
            onSimulate={beginSimulation}
            onHome={resetDraft}
          />
        )}

        {!roguelikeOpen && state.screen === "simulating" && <SimulationScreen />}

        {!roguelikeOpen && state.screen === "results" && state.simulationResult && (
          <ResultsShowcase
            result={state.simulationResult}
            roster={state.roster}
            onDraftAgain={startDraft}
            onBackToHome={resetDraft}
            onBackToChallenges={() => {
              setPrestigeInitialView("challenges");
              setPrestigeOpen(true);
            }}
            meta={metaProgress}
            history={state.history}
          />
        )}
      </div>

      {prestigeOpen && (
        <PrestigeOverlay
          meta={metaProgress}
          history={state.history}
          initialView={prestigeInitialView}
          onApplyChallengePreset={applyRunPreset}
          onClose={() => setPrestigeOpen(false)}
        />
      )}

      {tokenStoreOpen && (
        <TokenStoreOverlay
          meta={metaProgress}
          ownedTrainingCampTickets={state.ownedTrainingCampTickets}
          ownedTradePhones={state.ownedTradePhones}
          ownedSilverStarterPacks={state.ownedSilverStarterPacks}
          ownedGoldStarterPacks={state.ownedGoldStarterPacks}
          ownedPlatinumStarterPacks={state.ownedPlatinumStarterPacks}
          ownedRogueStarIds={state.ownedRogueStarIds}
          activeRogueStarId={state.activeRogueStarId}
          onBuyTrainingCampTicket={() => purchaseTrainingCampTicket(10_000)}
          onBuyTradePhone={() => purchaseTradePhone(5_000)}
          onBuySilverStarterPack={() => purchaseSilverStarterPack(35_000)}
          onBuyGoldStarterPack={() => purchaseGoldStarterPack(70_000)}
          onBuyPlatinumStarterPack={() => purchasePlatinumStarterPack(100_000)}
          onBuyRogueStar={purchaseRogueStar}
          onSetActiveRogueStar={setActiveRogueStar}
          onClose={() => setTokenStoreOpen(false)}
        />
      )}

      {learnOpen && <LearnOverlay onClose={() => setLearnOpen(false)} />}

      {showPrestigeLevelUp && state.simulationResult?.prestigeLevelUp && (
        <PrestigeLevelUpModal
          levelUp={state.simulationResult.prestigeLevelUp}
          onClose={() => setShowPrestigeLevelUp(false)}
        />
      )}
    </div>
  );
}

export default App;
