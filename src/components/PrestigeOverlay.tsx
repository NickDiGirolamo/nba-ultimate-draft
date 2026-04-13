import { Crown, Gift, Sparkles, Swords, Target, Trophy, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MetaProgress, PrestigeChallengeDefinition, RunHistoryEntry } from "../types";
import {
  draftChallenges,
  getPrestigeTitleForLevel,
  prestigeChallengeDefinitions,
  prestigeRewardDefinitions,
  standardRareEvent,
} from "../lib/meta";

interface PrestigeOverlayProps {
  meta: MetaProgress;
  history: RunHistoryEntry[];
  initialView?: "overview" | "challenges" | "rewards";
  onApplyChallengePreset: (challengePreset: PrestigeChallengeDefinition) => void;
  onClose: () => void;
}

export const PrestigeOverlay = ({
  meta,
  history,
  initialView = "overview",
  onApplyChallengePreset,
  onClose,
}: PrestigeOverlayProps) => {
  const [view, setView] = useState<"overview" | "challenges" | "rewards">(initialView);
  const [challengeFilter, setChallengeFilter] = useState<"open" | "completed">("open");
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
  const completedRouteIds = new Set(
    history
      .filter((run) => run.prestigeChallengeCleared)
      .map((run) => run.prestigeChallengeId)
      .filter((value): value is string => Boolean(value)),
  );
  const challengeGroups = useMemo(
    () =>
      draftChallenges.map((challenge) => ({
        challenge,
        items: prestigeChallengeDefinitions.filter(
          (item) => item.draftChallengeId === challenge.id,
        ),
      })),
    [],
  );
  const filteredChallengeGroups = useMemo(
    () =>
      challengeGroups
        .map(({ challenge, items }) => ({
          challenge,
          items: items.filter((item) =>
            challengeFilter === "open"
              ? !completedRouteIds.has(item.id)
              : completedRouteIds.has(item.id),
          ),
        }))
        .filter(({ items }) => items.length > 0),
    [challengeFilter, challengeGroups, completedRouteIds],
  );
  const visibleChallengeCount = filteredChallengeGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
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
              Prestige is your long-term front-office reputation. The main way to level it up is by
              clearing challenge routes across different run setups, with titles, deep playoff runs,
              collection growth, and team quality acting as supporting bonuses.
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
                onClick={() => setView("challenges")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  view === "challenges"
                    ? "bg-sky-300/14 text-sky-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Challenges
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
                  "Clear new challenge routes first, because that is now the fastest way to gain Prestige.",
                  "Use the Challenges page to hunt untouched setup combinations instead of replaying the same easy path.",
                  "Treat titles and deep runs as bonus XP on top of challenge progress, not the core leveling strategy.",
                  "Keep expanding your collection of unique drafted legends for a small passive Prestige boost.",
                  "Use unfinished challenge routes as your clearest path to the next prestige jump.",
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
        ) : (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-sky-300/14 bg-sky-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-sky-100/70">Total Challenge Routes</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {meta.prestige.totalChallengeRoutes}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Every valid combination of primary challenge, environment, and category focus.
                </div>
              </div>
              <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Routes Cleared</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {meta.prestige.completedChallengeRoutes}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  One-time clears you have already banked toward your Prestige profile.
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Still Available</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {meta.prestige.totalChallengeRoutes - meta.prestige.completedChallengeRoutes}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Each uncleared route has its own one-time prestige payout waiting for you.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Challenge Filter</div>
                <div className="mt-2 text-sm text-slate-200">
                  Open routes stay front and center by default. Completed clears are still easy to revisit.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => setChallengeFilter("open")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      challengeFilter === "open"
                        ? "bg-amber-300/14 text-amber-100"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeFilter("completed")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      challengeFilter === "completed"
                        ? "bg-emerald-300/14 text-emerald-100"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Completed
                  </button>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {visibleChallengeCount} visible
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {filteredChallengeGroups.length > 0 ? (
                filteredChallengeGroups.map(({ challenge, items }) => (
                <section
                  key={challenge.id}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Primary Challenge Group
                      </div>
                      <h3 className="mt-2 font-display text-3xl text-white">{challenge.title}</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                        {challenge.description}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {items.filter((item) => completedRouteIds.has(item.id)).length} / {items.length} cleared
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {items.map((item) => {
                      const completed = completedRouteIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`rounded-[24px] border p-5 ${
                            completed
                              ? "border-emerald-300/18 bg-emerald-300/8"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold text-white">{item.title}</div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                                  <Swords size={12} />
                                  {challenge.title}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                                  <Zap size={12} />
                                  {item.rareEventId === standardRareEvent.id ? "Standard" : item.title.split(" • ")[1]}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                                  <Target size={12} />
                                  {item.categoryChallengeId ? item.title.split(" • ")[2] : "No Focus"}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Reward</div>
                              <div className="mt-1 text-2xl font-semibold text-amber-100">+{item.reward}</div>
                            </div>
                          </div>

                          <div className="mt-4 text-sm leading-7 text-slate-300">{item.description}</div>
                          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                            Clear goal: {item.goal}
                          </div>

                          <div className="mt-5 flex items-center justify-between gap-3">
                            <div className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                              completed
                                ? "border border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                                : "border border-amber-200/18 bg-amber-300/10 text-amber-100"
                            }`}>
                              {completed ? "Cleared" : "Open"}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onApplyChallengePreset(item);
                                onClose();
                              }}
                              className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-sky-300/24 hover:bg-sky-300/10"
                            >
                              {completed ? "Replay Setup" : "Load Setup"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-8 text-sm leading-7 text-slate-300">
                  {challengeFilter === "open"
                    ? "You have already cleared every challenge route in the current catalog. Switch to Completed to review your full mastery board."
                    : "No challenge clears yet. Finish a loaded challenge route and it will appear here."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return overlay;
  }

  return createPortal(overlay, document.body);
};
