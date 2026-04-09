import clsx from "clsx";
import { ChevronRight, Crown, Medal, Radar, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { CategoryChallenge, CategoryChallengeSelection, MetaProgress, RareEvent, RunHistoryEntry } from "../types";
import { categoryChallenges } from "../lib/meta";

interface LandingHubProps {
  onStart: () => void;
  history: RunHistoryEntry[];
  meta: MetaProgress;
  rareEventsEnabled: boolean;
  currentRareEvent: RareEvent;
  onRareEventsToggle: (enabled: boolean) => void;
  categoryChallengesEnabled: boolean;
  categoryChallengeSelection: CategoryChallengeSelection;
  currentCategoryChallenge: CategoryChallenge | null;
  onCategoryChallengesToggle: (enabled: boolean) => void;
  onCategoryChallengeSelectionChange: (selection: CategoryChallengeSelection) => void;
}

export const LandingHub = ({
  onStart,
  history,
  meta,
  rareEventsEnabled,
  currentRareEvent,
  onRareEventsToggle,
  categoryChallengesEnabled,
  categoryChallengeSelection,
  currentCategoryChallenge,
  onCategoryChallengesToggle,
  onCategoryChallengeSelectionChange,
}: LandingHubProps) => (
  <section className="space-y-8">
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="glass-panel rounded-[34px] bg-hero-mesh p-8 shadow-card lg:p-12">
        <div className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-sky-100">
          All-Time NBA Draft Simulator
        </div>
        <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.04] text-white lg:text-7xl">
          Build a dynasty from the greatest players ever.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200/85">
          Draft a 10-man all-time NBA roster, balance star power with lineup fit, and simulate an 82-game season plus the entire playoff run.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <button onClick={onStart} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]">
            Start Draft
            <ChevronRight size={18} />
          </button>
          <div className="rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm text-slate-200">
            Play for records, trophies, collection milestones, and your best legacy score.
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                <Zap size={14} className={rareEventsEnabled ? "text-amber-200" : "text-slate-500"} />
                Rare Event Settings
              </div>
              <h2 className="mt-2 font-display text-2xl text-white">
                {rareEventsEnabled ? currentRareEvent.title : "Standard Draft Environment"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                {rareEventsEnabled ? currentRareEvent.description : "Rare events are turned off, so this run will use the default simulation environment."}
              </p>
              <p className="mt-2 text-sm text-amber-100/90">
                {rareEventsEnabled ? currentRareEvent.impact : "No event-specific boosts or modifiers will be active."}
              </p>
            </div>

            <div className="inline-flex rounded-full border border-white/12 bg-black/30 p-1">
              {[
                { label: "Enabled", value: true },
                { label: "Disabled", value: false },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onRareEventsToggle(option.value)}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    rareEventsEnabled === option.value
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                <Target size={14} className={categoryChallengesEnabled ? "text-emerald-200" : "text-slate-500"} />
                Category Challenge
              </div>
              <h2 className="mt-2 font-display text-2xl text-white">
                {categoryChallengesEnabled && currentCategoryChallenge ? currentCategoryChallenge.title : "Category Challenge Disabled"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                {categoryChallengesEnabled && currentCategoryChallenge
                  ? currentCategoryChallenge.description
                  : "Turn this on if you want an extra random objective that pushes you to chase the highest possible score in one specific team category."}
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">
                {categoryChallengeSelection === "random" && categoryChallengesEnabled
                  ? "This run will roll a random category focus on the draft briefing page."
                  : categoryChallengesEnabled && currentCategoryChallenge
                  ? `This run's side goal is to maximize ${currentCategoryChallenge.metricLabel.toLowerCase()}.`
                  : "No random category target will be assigned."}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="inline-flex rounded-full border border-white/12 bg-black/30 p-1">
                {[
                  { label: "Enabled", value: true },
                  { label: "Disabled", value: false },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => onCategoryChallengesToggle(option.value)}
                    className={clsx(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      categoryChallengesEnabled === option.value
                        ? "bg-white text-slate-950"
                        : "text-slate-300 hover:text-white",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <select
                value={categoryChallengesEnabled ? categoryChallengeSelection : "disabled"}
                onChange={(event) =>
                  onCategoryChallengeSelectionChange(event.target.value as CategoryChallengeSelection)
                }
                className="rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300/40"
                disabled={!categoryChallengesEnabled}
              >
                <option value="random">Random Category</option>
                {categoryChallenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.metricLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["10 picks", "Every round matters and every pick is permanent."],
            ["Meta progression", "Personal bests, trophies, streaks, and collection goals persist across runs."],
            ["Dynamic runs", "Draft challenges, rare events, and chemistry bonuses change the feel of each attempt."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="font-display text-xl text-white">{title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="glass-panel rounded-[30px] p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
              <Crown size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Personal Bests</p>
              <h2 className="mt-1 font-display text-2xl text-white">Chase Your Peak</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Wins", meta.personalBests.wins],
              ["Overall", meta.personalBests.overall],
              ["Offense", meta.personalBests.offense],
              ["Defense", meta.personalBests.defense],
              ["Fit", meta.personalBests.fit],
              ["Legacy", meta.personalBests.legacyScore],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-fuchsia-300/14 p-3 text-fuchsia-200">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Streaks + Collection</p>
              <h2 className="mt-1 font-display text-2xl text-white">Long-Term Chase</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Playoff Streak", meta.streaks.playoff],
              ["Title Streak", meta.streaks.titles],
              ["50-Win Streak", meta.streaks.fiftyWin],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Collection Progress</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {meta.collection.draftedPlayers} / {meta.collection.totalPlayers}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-white">{meta.collection.percentage}%</div>
                <div className="text-xs text-slate-400">of player pool drafted</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {meta.collection.milestones.map((milestone) => (
                <div key={milestone.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-300">{milestone.label}</span>
                  <span className={milestone.reached ? "text-emerald-200" : "text-slate-500"}>
                    {milestone.reached ? "Complete" : "Locked"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr_0.95fr]">
      <div className="glass-panel rounded-[30px] p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-300/14 p-3 text-emerald-200">
            <Radar size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Category Leaderboards</p>
            <h2 className="mt-1 font-display text-2xl text-white">Best Ever Builds</h2>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {meta.leaderboards.map((entry) => (
            <div key={entry.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{entry.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{entry.teamName}</div>
                </div>
                <div className="text-2xl font-semibold text-white">{entry.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-[30px] p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
            <Medal size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Trophy Case</p>
            <h2 className="mt-1 font-display text-2xl text-white">Meta Progress</h2>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {meta.trophies.map((trophy) => (
            <div
              key={trophy.id}
              className={`rounded-2xl border p-4 ${
                trophy.unlocked
                  ? "border-amber-300/25 bg-amber-300/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="font-medium text-white">{trophy.title}</div>
              <div className="mt-1 text-sm text-slate-300">{trophy.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-[30px] p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Run History</p>
            <h2 className="mt-1 font-display text-2xl text-white">Recent Franchises</h2>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{item.teamName}</div>
                    <div className="mt-1 text-sm text-slate-300">
                      {item.record} • {item.playoffFinish}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {item.challengeTitle} • {item.rareEventTitle}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">{item.grade}</div>
                    <div className="text-sm text-amber-100">{item.legacyScore} legacy</div>
                    <div className="text-xs text-slate-400">{item.createdAt}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-6 text-sm leading-7 text-slate-300">
              Your recent runs will appear here once you finish a draft and simulate the season.
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
);
