import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, ChevronDown, Coins, Package2, Target, Trophy, X } from "lucide-react";
import { allPlayers } from "../data/players";
import { getNbaTeamByName } from "../data/nbaTeams";
import { DraftPlayerCard } from "./DraftPlayerCard";
import {
  ROGUE_CHALLENGES,
  getRogueChallengeProgress,
  type RogueChallengeDefinition,
  type RogueChallengeGroupId,
  type RogueChallengeSubgroupId,
} from "../lib/rogueChallenges";
import { getRoguelikeCoachById } from "../lib/roguelike";
import { getPlayerTier } from "../lib/playerTier";
import { trackAnalyticsEventSoon } from "../lib/analytics";
import type { MetaProgress, Player } from "../types";

interface RogueChallengesOverlayProps {
  meta: MetaProgress;
  completedRogueChallengeIds: string[];
  claimedRogueChallengeIds: string[];
  onClaimRogueChallengeReward: (challengeId: string) => boolean;
  onRunRogueChallenge: (challengeId: string) => void;
  onClose: () => void;
}

const formatNumber = (value: number | string) => {
  const normalized = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(normalized)) return "0";
  return normalized.toLocaleString("en-US");
};

const ChallengeRewardPlayerPreview = ({
  player,
  size = "compact",
}: {
  player: Player;
  size?: "compact" | "large";
}) => (
  <div
    className={`shrink-0 overflow-hidden border border-emerald-200/35 bg-emerald-300/10 shadow-[0_10px_24px_rgba(16,185,129,0.18)] [&>button]:!opacity-100 ${
      size === "large" ? "h-[128px] w-[54px] rounded-[12px]" : "h-[96px] w-[40px] rounded-[9px]"
  }`}
    title={`${player.name} ${getPlayerTier(player)} reward`}
    aria-label={`${player.name} ${getPlayerTier(player)} reward card`}
  >
    <DraftPlayerCard
      player={player}
      compact
      compactScale={size === "large" ? 0.14 : 0.105}
      disabled
      rarityOverride={getPlayerTier(player)}
    />
  </div>
);

type ChallengeStatusFilter = "all" | "open" | "completed" | "ready" | "claimed";

const challengeStatusFilters: Array<{
  id: ChallengeStatusFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "completed", label: "Completed" },
  { id: "ready", label: "Ready" },
  { id: "claimed", label: "Claimed" },
];

const challengeGroups: Array<{
  id: RogueChallengeGroupId;
  label: string;
  description: string;
  subgroups?: Array<{
    id: RogueChallengeSubgroupId;
    label: string;
    description: string;
  }>;
}> = [
  {
    id: "milestones",
    label: "Milestones",
    description: "Persistent Rogue goals powered by saved run counts, Rogue drafted players, and collection size.",
    subgroups: [
      {
        id: "rogue-runs",
        label: "Rogue Runs",
        description: "Start more Rogue runs and bank rewards for long-term momentum.",
      },
      {
        id: "rogue-run-players",
        label: "Rogue Run Players",
        description: "Draft players across Rogue runs, including the full unique-player chase.",
      },
      {
        id: "collection",
        label: "Collection",
        description: "Grow your permanent player collection through packs, purchases, and rewards.",
      },
    ],
  },
  {
    id: "rookie",
    label: "Rookie",
    description: "Fast early goals with lower rewards to build momentum.",
  },
  {
    id: "pro",
    label: "Pro",
    description: "Moderate build restrictions for stronger Rogue payouts.",
  },
  {
    id: "all-star",
    label: "All-Star",
    description: "Harder run modifiers that ask for cleaner roster planning.",
  },
  {
    id: "superstar",
    label: "Superstar",
    description: "Advanced chemistry goals for focused roster builders.",
  },
  {
    id: "hall-of-fame",
    label: "Hall of Fame",
    description: "The toughest challenges with the biggest payouts.",
  },
  {
    id: "team-takeovers",
    label: "Team Takeovers",
    description: "Team-specific challenge families and their biggest identity rewards.",
    subgroups: [
      {
        id: "year-one-takeovers",
        label: "Year 1 Takeovers",
        description: "Beat the Year 1 Finals with a five-player team core.",
      },
      {
        id: "year-two-takeovers",
        label: "Year 2 Takeovers",
        description: "Beat the Year 2 Finals with a seven-player team core.",
      },
      {
        id: "total-takeovers",
        label: "Total Takeovers",
        description: "Beat the GOAT node with a full single-team roster.",
      },
    ],
  },
];

export const RogueChallengesOverlay = ({
  meta,
  completedRogueChallengeIds,
  claimedRogueChallengeIds,
  onClaimRogueChallengeReward,
  onRunRogueChallenge,
  onClose,
}: RogueChallengesOverlayProps) => {
  const [activeGroupId, setActiveGroupId] = useState<RogueChallengeGroupId>("milestones");
  const [activeSubgroupId, setActiveSubgroupId] = useState<RogueChallengeSubgroupId | null>(null);
  const [statusFilter, setStatusFilter] = useState<ChallengeStatusFilter>("all");
  const completedChallengeIds = useMemo(
    () => new Set(completedRogueChallengeIds),
    [completedRogueChallengeIds],
  );
  const claimedChallengeIds = useMemo(
    () => new Set(claimedRogueChallengeIds),
    [claimedRogueChallengeIds],
  );
  const challengesByGroup = useMemo(() => {
    const groups = new Map<RogueChallengeGroupId, RogueChallengeDefinition[]>();
    challengeGroups.forEach((group) => groups.set(group.id, []));
    ROGUE_CHALLENGES.forEach((challenge) => {
      groups.get(challenge.groupId)?.push(challenge);
    });
    return groups;
  }, []);
  const activeGroup = challengeGroups.find((group) => group.id === activeGroupId) ?? challengeGroups[0];
  const activeSubgroup =
    activeGroup.subgroups?.find((subgroup) => subgroup.id === activeSubgroupId) ??
    activeGroup.subgroups?.[0] ??
    null;
  const activeGroupChallenges = (challengesByGroup.get(activeGroup.id) ?? []).filter((challenge) =>
    activeSubgroup ? challenge.subgroupId === activeSubgroup.id : true,
  );
  const activeGroupCompletedCount = activeGroupChallenges.filter((challenge) =>
    completedChallengeIds.has(challenge.id),
  ).length;
  const activeGroupReadyCount = activeGroupChallenges.filter(
    (challenge) => completedChallengeIds.has(challenge.id) && !claimedChallengeIds.has(challenge.id),
  ).length;
  const activeGroupClaimedCount = activeGroupChallenges.filter((challenge) =>
    claimedChallengeIds.has(challenge.id),
  ).length;
  const activeGroupOpenCount = activeGroupChallenges.filter((challenge) =>
    !completedChallengeIds.has(challenge.id),
  ).length;
  const filteredActiveGroupChallenges = activeGroupChallenges.filter((challenge) => {
    const completed = completedChallengeIds.has(challenge.id);
    const claimed = claimedChallengeIds.has(challenge.id);

    if (statusFilter === "open") return !completed;
    if (statusFilter === "completed") return completed;
    if (statusFilter === "ready") return completed && !claimed;
    if (statusFilter === "claimed") return claimed;
    return true;
  });
  const statusFilterCounts: Record<ChallengeStatusFilter, number> = {
    all: activeGroupChallenges.length,
    open: activeGroupOpenCount,
    completed: activeGroupCompletedCount,
    ready: activeGroupReadyCount,
    claimed: activeGroupClaimedCount,
  };

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const claimChallengeReward = (challengeId: string) => {
    const claimed = onClaimRogueChallengeReward(challengeId);
    if (!claimed) return;

    trackAnalyticsEventSoon("store_reward_claimed", {
      payload: {
        rewardType: "rogue_challenge",
        rewardId: challengeId,
        claimedFrom: "rogue_challenges_overlay",
      },
    });
  };

  const selectGroup = (group: (typeof challengeGroups)[number]) => {
    setActiveGroupId(group.id);
    setActiveSubgroupId(group.subgroups?.[0]?.id ?? null);
  };

  const selectSubgroup = (groupId: RogueChallengeGroupId, subgroupId: RogueChallengeSubgroupId) => {
    setActiveGroupId(groupId);
    setActiveSubgroupId(subgroupId);
  };

  const overlay = (
    <div data-tutorial-id="rogue-challenges-overlay" className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/82 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-8">
      <div className="w-full max-w-[1360px] rounded-[28px] border border-white/10 bg-[#070b12] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:p-6 lg:rounded-[34px] lg:p-7 xl:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-sky-100/72">
              <Trophy size={14} className="text-sky-200" />
              Rogue Challenges
            </div>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">Challenge Tracker</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Track one-time Rogue goals, launch challenge runs, and claim permanent token, card, or coach rewards.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end rounded-full border border-white/10 bg-white/6 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white sm:self-auto"
            aria-label="Close challenges"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)]">
          <nav data-tutorial-id="rogue-challenges-groups" className="rounded-[24px] border border-white/10 bg-white/5 p-2" aria-label="Challenge groups">
            {challengeGroups.map((group) => {
              const groupChallenges = challengesByGroup.get(group.id) ?? [];
              const completedCount = groupChallenges.filter((challenge) => completedChallengeIds.has(challenge.id)).length;
              const readyCount = groupChallenges.filter(
                (challenge) => completedChallengeIds.has(challenge.id) && !claimedChallengeIds.has(challenge.id),
              ).length;
              const groupProgress = groupChallenges.length
                ? Math.round((completedCount / groupChallenges.length) * 100)
                : 0;
              const active = group.id === activeGroup.id;
              const expanded = active && Boolean(group.subgroups?.length);

              return (
                <div key={group.id} className="mb-1 last:mb-0">
                  <button
                    type="button"
                    onClick={() => selectGroup(group)}
                    aria-expanded={expanded}
                    className={`w-full rounded-[18px] border px-3 py-3 text-left transition ${
                      active
                        ? "border-sky-200/28 bg-sky-300/14 text-white shadow-[0_16px_34px_rgba(56,189,248,0.12)]"
                        : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/6"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 text-xs font-semibold uppercase tracking-[0.17em]">{group.label}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {readyCount ? (
                          <span className="rounded-full border border-amber-200/24 bg-amber-300/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                            {readyCount}
                          </span>
                        ) : null}
                        {group.subgroups?.length ? (
                          <ChevronDown
                            size={13}
                            className={`text-slate-300 transition ${expanded ? "rotate-180" : ""}`}
                          />
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      <span>{completedCount} / {groupChallenges.length}</span>
                      <span>{groupProgress}%</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-700/70">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200"
                        style={{ width: `${Math.max(groupProgress ? 6 : 0, groupProgress)}%` }}
                      />
                    </div>
                  </button>

                  {expanded ? (
                    <div className="mt-1.5 space-y-1 pl-3">
                      {group.subgroups?.map((subgroup) => {
                        const subgroupChallenges = groupChallenges.filter(
                          (challenge) => challenge.subgroupId === subgroup.id,
                        );
                        const subgroupCompletedCount = subgroupChallenges.filter((challenge) =>
                          completedChallengeIds.has(challenge.id),
                        ).length;
                        const subgroupReadyCount = subgroupChallenges.filter(
                          (challenge) =>
                            completedChallengeIds.has(challenge.id) && !claimedChallengeIds.has(challenge.id),
                        ).length;
                        const subgroupProgress = subgroupChallenges.length
                          ? Math.round((subgroupCompletedCount / subgroupChallenges.length) * 100)
                          : 0;
                        const subgroupActive = activeSubgroup?.id === subgroup.id;

                        return (
                          <button
                            key={subgroup.id}
                            type="button"
                            onClick={() => selectSubgroup(group.id, subgroup.id)}
                            className={`w-full rounded-2xl border px-3 py-2.5 text-left transition ${
                              subgroupActive
                                ? "border-cyan-200/24 bg-cyan-300/12 text-white"
                                : "border-white/8 bg-black/18 text-slate-300 hover:border-white/14 hover:bg-white/6"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                                {subgroup.label}
                              </span>
                              {subgroupReadyCount ? (
                                <span className="rounded-full bg-amber-300/14 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                                  {subgroupReadyCount}
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.12em] text-slate-400">
                              <span>{subgroupCompletedCount} / {subgroupChallenges.length}</span>
                              <span>{subgroupProgress}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <section className="min-w-0">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-sky-100/70">
                    <Target size={13} />
                    {activeSubgroup ? `${activeGroup.label} / ${activeSubgroup.label}` : activeGroup.label}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">
                    {activeSubgroup?.description ?? activeGroup.description}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div data-tutorial-id="rogue-challenges-summary" className="grid grid-cols-2 gap-2 text-center">
                    <div className="min-w-[82px] rounded-2xl border border-white/10 bg-black/18 px-3 py-2.5">
                      <div className="text-xl font-semibold leading-none text-white">{activeGroupChallenges.length}</div>
                      <div className="mt-1.5 whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-[0.11em] text-slate-400">Goals</div>
                    </div>
                    <div className="min-w-[82px] rounded-2xl border border-emerald-300/14 bg-emerald-300/8 px-3 py-2.5">
                      <div className="text-xl font-semibold leading-none text-white">{activeGroupCompletedCount}</div>
                      <div className="mt-1.5 whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-[0.11em] text-slate-400">Done</div>
                    </div>
                  </div>
                  <div data-tutorial-id="rogue-challenges-filters" className="flex flex-wrap justify-start gap-1.5 rounded-2xl border border-white/10 bg-black/18 p-1.5 md:justify-end">
                    {challengeStatusFilters.map((filter) => {
                      const active = statusFilter === filter.id;

                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setStatusFilter(filter.id)}
                          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
                            active
                              ? "bg-white text-slate-950"
                              : "text-slate-300 hover:bg-white/8 hover:text-white"
                          }`}
                        >
                          {filter.label} {statusFilterCounts[filter.id]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div data-tutorial-id="rogue-challenges-list" className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/18">
              {filteredActiveGroupChallenges.length > 0 ? filteredActiveGroupChallenges.map((challenge) => {
            const completed = completedChallengeIds.has(challenge.id);
            const claimed = claimedChallengeIds.has(challenge.id);
            const canClaim = completed && !claimed;
            const rewardCoach = getRoguelikeCoachById(challenge.rewardCoachId);
            const rewardPlayer = challenge.rewardPlayerId
              ? allPlayers.find((player) => player.id === challenge.rewardPlayerId) ?? null
              : null;
            const rewardPackTier = challenge.rewardPackTier ?? null;
            const challengeTeam = challenge.requiredTeamName
              ? getNbaTeamByName(challenge.requiredTeamName)
              : null;
            const progress = getRogueChallengeProgress(challenge, meta);
            const progressValue = completed ? 100 : progress.percent;
            const progressLabel = completed && challenge.progress
              ? `${progress.targetLabel} reached`
              : challenge.progress
                ? progress.currentLabel
                : completed
                  ? "1 / 1"
                  : "0 / 1";
            const takeoverCardChallenge = challenge.groupId === "team-takeovers" && Boolean(rewardPlayer);

            return (
              <article
                key={challenge.id}
                className={`border-b border-white/10 p-4 last:border-b-0 sm:p-5 ${
                  claimed
                    ? "bg-emerald-300/8"
                    : completed
                      ? "bg-amber-300/10"
                      : "bg-white/[0.03]"
                }`}
              >
                <div
                  className={`grid gap-4 xl:items-center xl:gap-3 ${
                    takeoverCardChallenge
                      ? "xl:grid-cols-[minmax(250px,1.18fr)_minmax(74px,0.24fr)_minmax(104px,0.38fr)_minmax(112px,0.42fr)]"
                      : "xl:grid-cols-[minmax(230px,1.1fr)_minmax(190px,0.85fr)_minmax(104px,0.38fr)_minmax(112px,0.42fr)]"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`shrink-0 rounded-2xl border p-3 ${
                        completed
                          ? "border-amber-200/24 bg-amber-300/12 text-amber-100"
                          : "border-white/12 bg-black/20 text-slate-300"
                      }`}
                    >
                      {challengeTeam?.logo ? (
                        <img
                          src={challengeTeam.logo}
                          alt=""
                          className="h-[22px] w-[22px] object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Trophy size={22} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Rogue Challenge</div>
                      <div className="mt-1 text-lg font-semibold text-white sm:text-xl">{challenge.title}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{challenge.description}</p>
                      {rewardCoach ? (
                        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-100">
                          Coach reward: {rewardCoach.name}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {takeoverCardChallenge ? (
                    <div className="flex min-w-0 items-center justify-start sm:justify-center">
                      {rewardPlayer ? (
                        <ChallengeRewardPlayerPreview player={rewardPlayer} size="large" />
                      ) : null}
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Progress</div>
                        <div className="text-xs font-semibold text-white">{progressLabel}</div>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full border border-white/10 bg-slate-700/70">
                        <div
                          className={`h-full rounded-full ${
                            completed ? "bg-gradient-to-r from-emerald-300 to-amber-200" : "bg-sky-300/30"
                          }`}
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-300">{challenge.requirement}</div>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-start gap-3">
                      {rewardPlayer && !takeoverCardChallenge ? (
                        <ChallengeRewardPlayerPreview player={rewardPlayer} />
                      ) : null}
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Reward</div>
                        <div className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-white">
                          <Coins size={18} className="shrink-0 text-amber-200" />
                          {formatNumber(challenge.reward)}
                        </div>
                        {rewardPackTier ? (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/24 bg-emerald-300/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                            <Package2 size={13} />
                            {rewardPackTier} Pack
                          </div>
                        ) : null}
                        <div
                          className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${
                            claimed
                              ? "border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                              : completed
                                ? "border-amber-200/24 bg-amber-300/12 text-amber-100"
                                : "border-white/10 bg-black/20 text-slate-300"
                          }`}
                        >
                          {claimed ? "Claimed" : completed ? "Complete" : "Open"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
                    <button
                      type="button"
                      onClick={() => onRunRogueChallenge(challenge.id)}
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-sky-200/28 bg-sky-300/12 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-50 transition hover:scale-[1.02] hover:bg-sky-300/18 xl:w-full"
                    >
                      Run
                      <ArrowLeft size={14} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => claimChallengeReward(challenge.id)}
                      disabled={!canClaim}
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/18 disabled:text-white/46 xl:w-full"
                    >
                      {claimed ? (
                        <>
                          <CheckCircle2 size={14} />
                          Claimed
                        </>
                      ) : canClaim ? (
                        "Claim"
                      ) : (
                        "Locked"
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          }) : (
                <div className="p-6 text-center sm:p-8">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-200">
                    No {challengeStatusFilters.find((filter) => filter.id === statusFilter)?.label.toLowerCase()} challenges here
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Switch filters or choose another challenge group to find more goals.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
