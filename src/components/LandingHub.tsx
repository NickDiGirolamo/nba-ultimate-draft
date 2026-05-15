import { CheckCircle2, ChevronRight, Coins, Package2, Trophy } from "lucide-react";
import { MetaProgress, RunHistoryEntry } from "../types";
import { allPlayers } from "../data/players";
import { getNbaTeamByName } from "../data/nbaTeams";
import { ROGUE_CHALLENGES, getRogueChallengeProgress } from "../lib/rogueChallenges";
import { getRoguelikeCoachById } from "../lib/roguelike";
import { getPlayerTier } from "../lib/playerTier";
import { RogueHero } from "./RogueHero";

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
  meta,
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
    <section className="home-landing-fit">
      <div className="grid w-full items-stretch gap-3 lg:grid-cols-[1.35fr_0.65fr] xl:grid-cols-[1.42fr_0.58fr]">
        <RogueHero
          onEnterRogue={onOpenRoguelike}
          onOpenChallenges={onOpenRogueChallenges}
          onRestartTutorial={onRestartTutorial}
        />

        <div data-tutorial-id="home-challenge-panel" className="glass-panel flex min-h-[460px] flex-col rounded-[28px] border border-sky-200/12 p-4 shadow-card lg:h-full lg:rounded-[30px] xl:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-300/14 p-2.5 text-sky-200">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Rogue Challenges</p>
              <h2 className="mt-0.5 font-display text-[clamp(1.2rem,1.6vw,1.55rem)] leading-tight text-white">
                {claimableChallengeCount > 0 ? `${claimableChallengeCount} Ready To Claim` : "Token Goals"}
              </h2>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-amber-200/14 bg-amber-300/8 px-3 py-2.5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Ready</div>
              <div className="mt-0.5 text-xl font-semibold text-white">{claimableChallengeCount}</div>
            </div>
            <div className="rounded-2xl border border-emerald-200/14 bg-emerald-300/8 px-3 py-2.5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Claimed</div>
              <div className="mt-0.5 text-xl font-semibold text-white">{claimedChallengeCount}</div>
            </div>
          </div>

          <div className="mt-3 grid flex-1 grid-rows-3 gap-2">
            {visibleChallenges.length > 0 ? (
              visibleChallenges.slice(0, 3).map((challenge) => {
                const completed = completedChallengeIdSet.has(challenge.id);
                const rewardCoach = getRoguelikeCoachById(challenge.rewardCoachId);
                const rewardPlayer = challenge.rewardPlayerId
                  ? allPlayers.find((player) => player.id === challenge.rewardPlayerId) ?? null
                  : null;
                const rewardPlayerTier = rewardPlayer ? getPlayerTier(rewardPlayer) : null;
                const rewardPackTier = challenge.rewardPackTier ?? null;
                const challengeTeam = challenge.requiredTeamName
                  ? getNbaTeamByName(challenge.requiredTeamName)
                  : null;
                const progress = getRogueChallengeProgress(challenge, meta);

                return (
                  <div
                    key={challenge.id}
                    className={`flex min-h-0 rounded-[18px] border px-3 py-2.5 ${
                      completed
                        ? "border-amber-200/26 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(8,13,24,0.88))]"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {challengeTeam?.logo ? (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/8 p-1">
                              <img
                                src={challengeTeam.logo}
                                alt=""
                                className="h-full w-full object-contain"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            </span>
                          ) : null}
                          <div className="min-w-0 flex-1 text-sm font-semibold leading-tight text-white">
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
                        <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-300">{challenge.description}</p>
                        {challenge.progress ? (
                          <div className="mt-1.5">
                            <div className="flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                              <span>{progress.targetLabel}</span>
                              <span className="text-slate-200">{completed ? "Reached" : progress.currentLabel}</span>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-700/70">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-300 to-amber-200"
                                style={{ width: `${completed ? 100 : progress.percent}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white">
                          <Coins size={12} className="text-amber-200" />
                          {formatNumber(challenge.reward)} tokens{rewardCoach ? " + Coach" : ""}{rewardPlayerTier ? ` + ${rewardPlayerTier}` : ""}
                          {rewardPackTier ? (
                            <span className="inline-flex items-center gap-1 text-emerald-100">
                              +
                              <Package2 size={12} />
                              {rewardPackTier} Pack
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {completed ? (
                        <button
                          type="button"
                          onClick={() => onClaimRogueChallengeReward(challenge.id)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:scale-[1.02] sm:w-auto"
                        >
                          <CheckCircle2 size={15} />
                          Claim
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRunRogueChallenge(challenge.id)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-200/24 bg-sky-300/12 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-50 transition hover:scale-[1.02] hover:bg-sky-300/18 sm:w-auto"
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
              <div className="rounded-[20px] border border-emerald-200/18 bg-emerald-300/8 p-4">
                <div className="text-base font-semibold text-white">All rewards claimed</div>
                <p className="mt-1.5 text-xs leading-5 text-slate-300">
                  Every Rogue Challenge reward is banked. Future challenge drops will appear here.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenRogueChallenges}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-white/10"
          >
            View All Challenges
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </section>
  );
};
