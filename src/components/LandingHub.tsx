import { ChevronRight, Crown, Medal, Radar, Sparkles, Trophy } from "lucide-react";
import {
  MetaProgress,
  RunHistoryEntry,
} from "../types";

interface LandingHubProps {
  onOpenPrestige: () => void;
  onOpenChallenges: () => void;
  onOpenCollection: () => void;
  onOpenRoguelike: () => void;
  history: RunHistoryEntry[];
  meta: MetaProgress;
}

export const LandingHub = ({
  onOpenPrestige,
  onOpenChallenges,
  onOpenCollection,
  onOpenRoguelike,
  history,
  meta,
}: LandingHubProps) => {
  return (
  <section className="space-y-8">
    <div className="glass-panel rounded-[34px] bg-hero-mesh p-8 shadow-card lg:p-12">
        <div className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-sky-100">
          All-Time NBA Draft Simulator
        </div>
        <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.04] text-white lg:text-7xl">
          Can you draft the best all-time NBA team?
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200/85">
          Draft a 10-man all-time NBA roster, balance star power with chemistry, and simulate an 82-game season plus the entire playoff run.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onOpenChallenges}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
          >
            Start Draft Challenges
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={onOpenRoguelike}
            className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-8 py-3.5 text-sm font-semibold text-fuchsia-100 transition hover:scale-[1.02] hover:bg-fuchsia-300/14"
          >
            Try Roguelike Mode
            <ChevronRight size={18} />
          </button>
        </div>

        <p className="mt-4 text-center text-sm leading-7 text-slate-300">
          Take on challenge routes, chase prestige rewards, and prove you can build elite rosters in every draft environment.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["1. Start with Challenge 1", "The first category-focus routes are the cleanest way to learn the draft loop."],
            ["2. Watch Chemistry", "Chemistry now shows both lineup sense and badge synergy, so it explains why a pick helps or hurts."],
            ["3. Chase Prestige", "Challenge clears are the main way to level up, unlock rewards, and open deeper systems."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-left">
              <div className="font-semibold text-white">{title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onOpenPrestige}
          className="mt-8 block w-full rounded-[28px] border border-amber-200/12 bg-black/20 p-5 text-left transition hover:border-amber-200/25 hover:bg-black/25"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                <Crown size={14} className="text-amber-200" />
                Prestige Profile
              </div>
              <h2 className="mt-2 font-display text-3xl text-white">
                Level {meta.prestige.level} · {meta.prestige.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                Prestige tracks your long-term all-time GM legacy across completed runs, titles, challenge clears, and collection growth.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[390px]">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Prestige</div>
                <div className="mt-2 break-words text-[clamp(1.7rem,2.1vw,2.2rem)] font-semibold leading-none text-white">{meta.prestige.score}</div>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Next Level</div>
                <div className="mt-2 break-words text-[clamp(1.7rem,2.1vw,2.2rem)] font-semibold leading-none text-white">{meta.prestige.nextLevelScore}</div>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Progress</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {Math.round(meta.prestige.progressToNextLevel * 100)}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300"
              style={{ width: `${Math.max(6, Math.round(meta.prestige.progressToNextLevel * 100))}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span>{meta.prestige.currentLevelFloor}</span>
            <span>{meta.prestige.nextLevelScore}</span>
          </div>
        </button>

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

      <button
        type="button"
        onClick={onOpenCollection}
        className="glass-panel rounded-[30px] p-6 text-left shadow-card transition hover:border-amber-200/24 hover:bg-white/7"
      >
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
      </button>

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
            ["Chemistry", meta.personalBests.chemistry],
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
                      {item.mode === "category-focus"
                        ? `${item.categoryFocusTitle ?? "Category Focus"} • ${item.focusScore ?? "--"}`
                        : `${item.record} • ${item.playoffFinish}`}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {item.mode === "category-focus"
                        ? `${item.categoryFocusTitle ?? "Category Focus"} mode • ${item.rareEventTitle}`
                        : `${item.challengeTitle} • ${item.rareEventTitle}`}
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
  </section>
);
};
