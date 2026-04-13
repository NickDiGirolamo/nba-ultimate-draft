import { Crown, Sparkles, Trophy, X } from "lucide-react";
import { createPortal } from "react-dom";
import { MetaProgress, RunHistoryEntry } from "../types";
import { draftChallenges } from "../lib/meta";

interface PrestigeOverlayProps {
  meta: MetaProgress;
  history: RunHistoryEntry[];
  onClose: () => void;
}

export const PrestigeOverlay = ({
  meta,
  history,
  onClose,
}: PrestigeOverlayProps) => {
  const recentRuns = history.slice(0, 5);
  const prestigeChallenges = draftChallenges.filter((challenge) => challenge.id !== "classic");
  const completedChallengeTitles = new Set(
    history.filter((run) => run.challengeCompleted).map((run) => run.challengeTitle),
  );
  const completedChallenges = prestigeChallenges.filter((challenge) =>
    completedChallengeTitles.has(challenge.title),
  );
  const openChallenges = prestigeChallenges.filter(
    (challenge) => !completedChallengeTitles.has(challenge.title),
  );

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
              Prestige is your long-term front-office reputation. It grows from completed runs, titles,
              deep playoff success, challenge clears, collection milestones, and the overall quality of
              the teams you build.
            </p>
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
                {meta.prestige.breakdown.map((item) => (
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
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-300/14 p-3 text-emerald-200">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Challenge Ladder
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    Completed And Open
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                    Completed
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {completedChallenges.length}
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    Challenges you have already cleared at least once.
                  </div>

                  <div className="mt-4 space-y-2">
                    {completedChallenges.length > 0 ? (
                      completedChallenges.map((challenge) => (
                        <div
                          key={challenge.id}
                          className="rounded-2xl border border-emerald-300/18 bg-black/20 px-4 py-3 text-sm text-white"
                        >
                          {challenge.title}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                        No challenge clears yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                    Open Challenges
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {openChallenges.length}
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    These are still available ways to raise Prestige.
                  </div>

                  <div className="mt-4 space-y-2">
                    {openChallenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-white">{challenge.title}</div>
                          <div className="text-sm text-amber-100">+{challenge.reward}</div>
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-300">
                          {challenge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                    Fastest Ways To Climb
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    What To Chase Next
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Win championships, because banners are the single biggest Prestige boost.",
                  "Complete more challenge runs to prove you can build under different constraints.",
                  "Push for 60-win seasons and deep playoff finishes even when a title run falls short.",
                  "Keep expanding your collection of unique drafted legends across runs.",
                  "Use unfinished challenges as your clearest path to the next prestige jump.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Recent Franchises
              </div>
              <h3 className="mt-1 font-display text-2xl text-white">
                Recent Prestige Drivers
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
                    Finish a few runs and this page will start showing which franchises built your prestige profile.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return overlay;
  }

  return createPortal(overlay, document.body);
};
