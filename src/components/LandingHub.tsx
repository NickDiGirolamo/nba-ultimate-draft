import { CheckCircle2, ChevronRight, Coins, Trophy } from "lucide-react";
import { MetaProgress, RunHistoryEntry } from "../types";
import { ROGUE_CHALLENGES } from "../lib/rogueChallenges";

interface LandingHubProps {
  onOpenPrestige: () => void;
  onOpenRoguelike: () => void;
  onOpenRogueChallenges: () => void;
  onRunRogueChallenge: (challengeId: string) => void;
  onClaimRogueChallengeReward: (challengeId: string) => boolean;
  onRestartTutorial: () => void;
  history: RunHistoryEntry[];
  meta: MetaProgress;
  completedRogueChallengeIds: string[];
  claimedRogueChallengeIds: string[];
}

export const LandingHub = ({
  onOpenPrestige,
  onOpenRoguelike,
  onOpenRogueChallenges,
  onRunRogueChallenge,
  onClaimRogueChallengeReward,
  onRestartTutorial,
  completedRogueChallengeIds,
  claimedRogueChallengeIds,
}: LandingHubProps) => {
  const completedChallengeIdSet = new Set(completedRogueChallengeIds);
  const claimedChallengeIdSet = new Set(claimedRogueChallengeIds);
  const visibleChallenges = ROGUE_CHALLENGES
    .filter((challenge) => !claimedChallengeIdSet.has(challenge.id))
    .sort((left, right) => {
      const leftClaimable = completedChallengeIdSet.has(left.id);
      const rightClaimable = completedChallengeIdSet.has(right.id);
      if (leftClaimable !== rightClaimable) return leftClaimable ? -1 : 1;
      return ROGUE_CHALLENGES.findIndex((challenge) => challenge.id === left.id) -
        ROGUE_CHALLENGES.findIndex((challenge) => challenge.id === right.id);
    });
  const claimableChallengeCount = visibleChallenges.filter((challenge) =>
    completedChallengeIdSet.has(challenge.id),
  ).length;
  const claimedChallengeCount = claimedChallengeIdSet.size;
  const formatNumber = (value: number) => value.toLocaleString("en-US");

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
              onClick={onOpenRogueChallenges}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200/24 bg-sky-300/12 px-8 py-3.5 text-sm font-semibold text-sky-50 transition hover:scale-[1.02] hover:bg-sky-300/18"
            >
              Rogue Challenges
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
              ["Manage the climb", "Training floors, trade floors, lineup tuning, and reward drafts all matter before each boss gate."],
              ["Build long-term power", "Your best rogue stats, prestige progress, tokens, and collection goals keep improving across runs."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-black/24 p-5">
                <div className="font-display text-xl text-white">{title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[36px] border border-sky-200/12 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-300/14 p-3 text-sky-200">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Rogue Challenges</p>
              <h2 className="mt-1 font-display text-2xl text-white">
                {claimableChallengeCount > 0 ? `${claimableChallengeCount} Ready To Claim` : "Token Goals"}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-amber-200/14 bg-amber-300/8 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Ready</div>
              <div className="mt-1 text-2xl font-semibold text-white">{claimableChallengeCount}</div>
            </div>
            <div className="rounded-2xl border border-emerald-200/14 bg-emerald-300/8 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Claimed</div>
              <div className="mt-1 text-2xl font-semibold text-white">{claimedChallengeCount}</div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {visibleChallenges.length > 0 ? (
              visibleChallenges.map((challenge) => {
                const completed = completedChallengeIdSet.has(challenge.id);

                return (
                  <div
                    key={challenge.id}
                    className={`rounded-[20px] border px-4 py-3 ${
                      completed
                        ? "border-amber-200/26 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(8,13,24,0.88))]"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="min-w-0 flex-1 text-base font-semibold leading-tight text-white">
                            {challenge.title}
                          </div>
                          <div className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] ${
                            completed
                              ? "border-amber-200/24 bg-amber-300/12 text-amber-100"
                              : "border-white/10 bg-black/20 text-slate-300"
                          }`}>
                            {completed ? "Ready" : "Open"}
                          </div>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-300">{challenge.description}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-white">
                          <Coins size={13} className="text-amber-200" />
                          {formatNumber(challenge.reward)} tokens
                        </div>
                      </div>
                      {completed ? (
                        <button
                          type="button"
                          onClick={() => onClaimRogueChallengeReward(challenge.id)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:scale-[1.02] sm:w-auto"
                        >
                          <CheckCircle2 size={15} />
                          Claim
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRunRogueChallenge(challenge.id)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-200/24 bg-sky-300/12 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-sky-50 transition hover:scale-[1.02] hover:bg-sky-300/18 sm:w-auto"
                        >
                          Run
                          <ChevronRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-emerald-200/18 bg-emerald-300/8 p-5">
                <div className="text-lg font-semibold text-white">All rewards claimed</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Every Rogue Challenge reward is banked. Future challenge drops will appear here.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenRogueChallenges}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View All Challenges
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </section>
  );
};
