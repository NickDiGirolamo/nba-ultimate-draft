import { Crown, Gift, Sparkles, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MetaProgress, RunHistoryEntry } from "../types";
import {
  getPrestigeTitleForLevel,
  prestigeRewardDefinitions,
} from "../lib/meta";

type PrestigeView = "overview" | "rewards";

interface PrestigeOverlayProps {
  meta: MetaProgress;
  history: RunHistoryEntry[];
  initialView?: PrestigeView;
  onClose: () => void;
}

export const PrestigeOverlay = ({
  meta,
  history,
  initialView = "overview",
  onClose,
}: PrestigeOverlayProps) => {
  const [view, setView] = useState<PrestigeView>(initialView);
  const recentRuns = history.slice(0, 5);
  const rewardTrack = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => {
        const level = index + 1;
        const reward = prestigeRewardDefinitions.find((item) => item.level === level) ?? null;
        return {
          level,
          title: getPrestigeTitleForLevel(level),
          reward,
          unlocked: meta.prestige.level >= level,
        };
      }),
    [meta.prestige.level],
  );
  const rogueBests = meta.roguePersonalBests;

  const overlay = (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/82 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-[1180px] rounded-[34px] border border-white/10 bg-[#070b12] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-400">
              <Crown size={14} className="text-amber-200" />
              Prestige Profile
            </div>
            <h2 className="mt-3 font-display text-4xl text-white">
              Level {meta.prestige.level} - {meta.prestige.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Prestige is your long-term Rogue reputation. From now on, it only grows through
              NBA Rogue Mode rewards, so every climb, boss clear, and hard-earned run result stays
              tied to the main experience.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setView("overview")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  view === "overview"
                    ? "bg-amber-300/14 text-amber-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setView("rewards")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  view === "rewards"
                    ? "bg-fuchsia-300/14 text-fuchsia-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Prestige Rewards
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/10 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Prestige Score</div>
            <div className="mt-2 text-4xl font-semibold text-white">{meta.prestige.score}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Current Level Floor</div>
            <div className="mt-2 text-4xl font-semibold text-white">{meta.prestige.currentLevelFloor}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Next Level</div>
            <div className="mt-2 text-4xl font-semibold text-white">{meta.prestige.nextLevelScore}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Progress</div>
            <div className="mt-2 text-4xl font-semibold text-white">
              {Math.round(meta.prestige.progressToNextLevel * 100)}%
            </div>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300"
            style={{ width: `${Math.max(6, Math.round(meta.prestige.progressToNextLevel * 100))}%` }}
          />
        </div>

        {view === "overview" ? (
        <div className="mt-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Prestige Breakdown
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    How You Earned It
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {meta.prestige.breakdown.length > 0 ? (
                  meta.prestige.breakdown.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{item.label}</div>
                          <div className="mt-1 text-sm leading-6 text-slate-300">
                            {item.description}
                          </div>
                        </div>
                        <div className="shrink-0 text-2xl font-semibold text-amber-100">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-300">
                    Play NBA Rogue Mode to start earning Prestige XP. Standard draft challenge results no longer add Prestige.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-300/14 p-3 text-emerald-200">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Rogue Bests
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    What Your Runs Have Built
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  ["Furthest Floor", Math.round(rogueBests.furthestFloor)],
                  ["Best Overall", rogueBests.overall.toFixed(1)],
                  ["Best Offense", rogueBests.offense.toFixed(1)],
                  ["Best Defense", rogueBests.defense.toFixed(1)],
                  ["Best Chemistry", rogueBests.chemistry.toFixed(1)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                      {label}
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      {value}
                    </div>
                    <div className="mt-2 text-sm text-slate-200">
                      Recorded from NBA Rogue Mode.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-300/14 p-3 text-sky-200">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Fastest Way To Climb
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    What To Chase Next
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Push deeper in Rogue Mode to reach higher-value boss rewards.",
                  "Even failed Rogue runs can award Prestige XP, so every climb still moves the account forward.",
                  "Use tokens and permanent upgrades to make future Rogue starts stronger.",
                  "Rogue collections now pay token bonuses through the Token Store Collections tab.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Recent Draft History
              </div>
              <h3 className="mt-1 font-display text-2xl text-white">
                No Longer A Prestige Source
              </h3>

              <div className="mt-6 space-y-3">
                {recentRuns.length > 0 ? (
                  recentRuns.map((run) => (
                    <div key={run.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{run.teamName}</div>
                          <div className="mt-1 text-sm text-slate-300">
                            {run.mode === "category-focus"
                              ? `${run.categoryFocusTitle ?? "Category Focus"} - ${run.focusScore ?? "--"}`
                              : `${run.record} - ${run.playoffFinish}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{run.legacyScore}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            legacy
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                    Standard draft history can still exist locally, but it no longer contributes to Prestige.
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                These older draft results are kept for compatibility and context only. Rogue Mode is the only Prestige source.
              </p>
            </div>
          </div>
        </div>
        ) : view === "rewards" ? (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-fuchsia-300/14 bg-fuchsia-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-100/70">Current Level</div>
                <div className="mt-2 text-3xl font-semibold text-white">{meta.prestige.level}</div>
                <div className="mt-2 text-sm text-slate-200">{meta.prestige.title}</div>
              </div>
              <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Rewards Unlocked</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {prestigeRewardDefinitions.filter((reward) => meta.prestige.level >= reward.level).length}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Gameplay rewards already active on your profile.
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Next Reward</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {prestigeRewardDefinitions.find((reward) => reward.level > meta.prestige.level)?.title ?? "All current rewards unlocked"}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {prestigeRewardDefinitions.find((reward) => reward.level > meta.prestige.level)
                    ? `Unlocks at level ${prestigeRewardDefinitions.find((reward) => reward.level > meta.prestige.level)?.level}.`
                    : "You have unlocked every currently implemented prestige reward."}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-fuchsia-300/14 p-3 text-fuchsia-200">
                  <Gift size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Reward Track
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    What Every Level Unlocks
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {rewardTrack.map((entry) => (
                  <div
                    key={entry.level}
                    className={`rounded-[22px] border p-4 ${
                      entry.reward
                        ? entry.unlocked
                          ? "border-fuchsia-300/20 bg-fuchsia-300/10"
                          : "border-white/10 bg-black/20"
                        : "border-white/8 bg-black/12"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                            Level {entry.level}
                          </div>
                          <div className="text-sm font-semibold text-white">{entry.title}</div>
                          <div className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                            entry.unlocked
                              ? "border border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                              : "border border-white/10 bg-white/6 text-slate-400"
                          }`}>
                            {entry.unlocked ? "Unlocked" : "Locked"}
                          </div>
                        </div>
                        <div className="mt-2 text-sm leading-7 text-slate-300">
                          {entry.reward
                            ? entry.reward.description
                            : "No gameplay reward unlock at this exact level yet. Keep climbing to reach the next reward threshold."}
                        </div>
                      </div>
                      {entry.reward ? (
                        <div className="rounded-2xl border border-fuchsia-300/18 bg-black/20 px-4 py-3 text-sm text-fuchsia-100">
                          {entry.reward.title}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
	      </div>
	    </div>
  );

  if (typeof document === "undefined") {
    return overlay;
  }

  return createPortal(overlay, document.body);
};

