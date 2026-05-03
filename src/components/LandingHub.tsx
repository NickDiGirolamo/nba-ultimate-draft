import { ChevronRight, Crown, Medal, Radar, Shield, Sparkles, Swords, Trophy } from "lucide-react";
import { MetaProgress, RunHistoryEntry } from "../types";

interface LandingHubProps {
  onOpenPrestige: () => void;
  onOpenRoguelike: () => void;
  onRestartTutorial: () => void;
  history: RunHistoryEntry[];
  meta: MetaProgress;
}

export const LandingHub = ({
  onOpenPrestige,
  onOpenRoguelike,
  onRestartTutorial,
  history,
  meta,
}: LandingHubProps) => {
  const latestRun = history[0] ?? null;
  const formatRogueBestValue = (label: string, value: number) =>
    label === "Furthest Floor" ? `${Math.round(value)}` : value.toFixed(1);

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="glass-panel overflow-hidden rounded-[36px] border border-fuchsia-200/16 bg-[linear-gradient(140deg,rgba(28,11,45,0.98),rgba(11,18,34,0.96),rgba(7,11,18,0.98))] p-8 shadow-card lg:p-12">
          <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-white lg:text-7xl">
            NBA Ultimate Draft
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200/86">
            Draft your opening core, train key players, trade for cleaner fits, evolve cards, and survive boss faceoffs floor by floor.
            NBA Rogue Mode is now the main way to play, improve, and build your long-term profile.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              data-tutorial-id="home-enter-rogue"
              onClick={onOpenRoguelike}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
            >
              Enter NBA Rogue Mode
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={onOpenPrestige}
              className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-8 py-3.5 text-sm font-semibold text-fuchsia-100 transition hover:scale-[1.02] hover:bg-fuchsia-300/14"
            >
              View Meta Progress
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={onRestartTutorial}
              className="inline-flex items-center gap-2 rounded-full border border-amber-200/22 bg-amber-300/10 px-8 py-3.5 text-sm font-semibold text-amber-100 transition hover:scale-[1.02] hover:bg-amber-300/14"
            >
              Replay Tutorial
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Draft live choices", "Open with a real starter reveal, then make 1-of-5 decisions that permanently shape the run."],
              ["Manage the climb", "Training, trade nodes, lineup tuning, and reward drafts all matter before each boss gate."],
              ["Build long-term power", "Your best rogue stats, prestige progress, tokens, and collection goals keep improving across runs."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-black/24 p-5">
                <div className="font-display text-xl text-white">{title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[36px] border border-emerald-200/12 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-300/14 p-3 text-emerald-200">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Rogue Profile</p>
              <h2 className="mt-1 font-display text-2xl text-white">All-Time Bests</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {([
              ["Furthest Floor", meta.roguePersonalBests.furthestFloor],
              ["Best OVR", meta.roguePersonalBests.overall],
              ["Best OFF", meta.roguePersonalBests.offense],
              ["Best DEF", meta.roguePersonalBests.defense],
              ["Best CHEM", meta.roguePersonalBests.chemistry],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-emerald-200/12 bg-emerald-300/6 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {formatRogueBestValue(label, value)}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenRoguelike}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Continue the Climb
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[32px] p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-fuchsia-300/14 p-3 text-fuchsia-200">
                <Swords size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Mode Focus</p>
                <h2 className="mt-1 font-display text-2xl text-white">Why Rogue Mode Matters</h2>
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
              Main Experience
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[
              {
                title: "Meaningful roster building",
                description:
                  "Every floor asks for a different kind of discipline: drafting pure talent, protecting chemistry, and deciding when to invest in upgrades.",
                icon: Sparkles,
                tone: "border-fuchsia-200/16 bg-fuchsia-300/8 text-fuchsia-100",
              },
              {
                title: "Boss battles with readable stakes",
                description:
                  "You can scout the matchup, study your starting five, and understand how each slot duel shapes the boss faceoff result.",
                icon: Trophy,
                tone: "border-amber-200/16 bg-amber-300/8 text-amber-100",
              },
              {
                title: "Persistent progression",
                description:
                  "Tokens, prestige, rogue bests, and unlock-driven choices make each run matter even when the ladder ends early.",
                icon: Crown,
                tone: "border-sky-200/16 bg-sky-300/8 text-sky-100",
              },
              {
                title: "Cleaner replay value",
                description:
                  "Starter packs, bundle rewards, training camps, trades, and evolving lineups create very different run shapes from one attempt to the next.",
                icon: Radar,
                tone: "border-emerald-200/16 bg-emerald-300/8 text-emerald-100",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className={`inline-flex rounded-2xl border px-3 py-3 ${item.tone}`}>
                  <item.icon size={18} />
                </div>
                <div className="mt-4 font-display text-xl text-white">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <button
            type="button"
            onClick={onOpenPrestige}
            className="glass-panel block w-full rounded-[32px] border border-amber-200/12 bg-black/20 p-6 text-left shadow-card transition hover:border-amber-200/25 hover:bg-black/25"
          >
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                  <Crown size={14} className="text-amber-200" />
                  Prestige Profile
                </div>
                <h2 className="mt-2 font-display text-3xl text-white">
                  Level {meta.prestige.level} | {meta.prestige.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Rogue runs now drive the home page and are the only way to earn long-term Prestige.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Prestige</div>
                  <div className="mt-2 text-[clamp(1.7rem,2.1vw,2.2rem)] font-semibold leading-none text-white">{meta.prestige.score}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Next Level</div>
                  <div className="mt-2 text-[clamp(1.7rem,2.1vw,2.2rem)] font-semibold leading-none text-white">{meta.prestige.nextLevelScore}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
          </button>

          <div className="glass-panel rounded-[32px] border border-white/10 p-6 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Latest Run</p>
                <h2 className="mt-1 font-display text-2xl text-white">Recent Result</h2>
              </div>
            </div>

            <div className="mt-6">
              {latestRun ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-white">{latestRun.teamName}</div>
                      <div className="mt-2 text-sm text-slate-300">
                        {latestRun.mode === "category-focus"
                          ? `${latestRun.categoryFocusTitle ?? "Category Focus"} | ${latestRun.focusScore ?? "--"}`
                          : `${latestRun.record} | ${latestRun.playoffFinish}`}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {latestRun.mode === "category-focus"
                          ? `${latestRun.categoryFocusTitle ?? "Category Focus"} mode`
                          : latestRun.challengeTitle}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{latestRun.grade}</div>
                      <div className="mt-1 text-sm text-amber-100">{latestRun.legacyScore} legacy</div>
                      <div className="mt-1 text-xs text-slate-400">{latestRun.createdAt}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-6 text-sm leading-7 text-slate-300">
                  Your rogue climbs, challenge runs, and recent finishes will show up here once you log a completed run.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.8fr]">
        <div className="glass-panel rounded-[30px] p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-300/14 p-3 text-emerald-200">
              <Radar size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Best Ever Builds</p>
              <h2 className="mt-1 font-display text-2xl text-white">Leaderboards</h2>
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

        <div className="glass-panel rounded-[30px] p-6 text-left shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
              <Medal size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Collection + Trophies</p>
              <h2 className="mt-1 font-display text-2xl text-white">Long-Term Chase</h2>
              <p className="mt-1 text-xs text-slate-400">Rogue collection rewards now live in the Token Store.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
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

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
        </div>

        <div className="glass-panel rounded-[30px] border border-sky-200/12 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-300/14 p-3 text-sky-200">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Rogue Prestige</p>
              <h2 className="mt-1 font-display text-2xl text-white">Main Progress Path</h2>
            </div>
          </div>

          <p className="mt-6 text-sm leading-7 text-slate-300">
            Prestige now belongs fully to NBA Rogue Mode. Climb floors, clear bosses, survive hard runs, and bank the rewards that move your account forward.
          </p>

          <div className="mt-6 space-y-3">
            {[
              "Rogue floor rewards",
              "Boss battle payouts",
              "Failure rewards that still move the account",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenRoguelike}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-200/18 bg-sky-300/10 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/14"
          >
            Enter Rogue Mode
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
