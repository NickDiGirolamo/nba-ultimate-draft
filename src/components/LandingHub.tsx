import { CheckCircle2, ChevronRight, Coins, Crown, PackageOpen, Shield, Trophy, Zap } from "lucide-react";
import { MetaProgress, RunHistoryEntry } from "../types";
import { allPlayers } from "../data/players";
import { getNbaTeamByName } from "../data/nbaTeams";
import { ROGUE_CHALLENGES } from "../lib/rogueChallenges";
import { getRoguelikeCoachById } from "../lib/roguelike";
import { DraftPlayerCard } from "./DraftPlayerCard";

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

const getHeroCardPlayer = (name: string) =>
  allPlayers.find((player) => player.name === name) ?? allPlayers[0];

const heroCardStack = [
  {
    key: "emerald",
    player: getHeroCardPlayer("Brandon Clarke (2025-26)"),
    rarity: "Emerald" as const,
    className: "home-rogue-hero__real-card--emerald",
  },
  {
    key: "sapphire",
    player: getHeroCardPlayer("Michael Jordan (Wizards)"),
    rarity: "Sapphire" as const,
    className: "home-rogue-hero__real-card--sapphire",
  },
  {
    key: "ruby",
    player: getHeroCardPlayer("Chris Mullin"),
    rarity: "Ruby" as const,
    className: "home-rogue-hero__real-card--ruby",
  },
];

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
    <section className="home-landing-fit">
      <div className="grid w-full items-stretch gap-3 lg:grid-cols-[1.35fr_0.65fr] xl:grid-cols-[1.42fr_0.58fr]">
        <div className="home-rogue-hero glass-panel relative flex min-h-[460px] flex-col overflow-hidden rounded-[28px] border border-cyan-100/18 bg-[#060912] p-5 shadow-card sm:p-6 lg:h-full lg:rounded-[30px] xl:p-8 2xl:p-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="home-rogue-hero__court absolute inset-0" />
            <div className="home-rogue-hero__glow absolute -right-[9%] top-[7%] h-[62%] w-[48%] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 h-28 w-full bg-[linear-gradient(180deg,transparent,rgba(2,6,13,0.84))]" />
          </div>

          <div className="relative z-10 grid h-full gap-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(360px,0.68fr)] lg:items-stretch">
            <div className="flex min-h-0 flex-col">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-100/22 bg-amber-200/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100 shadow-[0_0_22px_rgba(251,191,36,0.12)]">
                <Crown size={13} />
                NBA Rogue Mode
              </div>
              <h1 className="mt-5 max-w-5xl font-display text-[clamp(2.9rem,5vw,5.65rem)] font-semibold leading-[0.95] text-white">
                Build your dynasty.
                <span className="block bg-[linear-gradient(90deg,#fef3c7,#a5f3fc,#ffffff)] bg-clip-text text-transparent">
                  Floor by floor.
                </span>
              </h1>
              <p className="mt-5 max-w-4xl text-[clamp(0.95rem,1.04vw,1.15rem)] leading-[1.6] text-slate-200/86">
                Draft a starter core, survive boss gates, earn permanent cards, and turn every run into a cleaner path toward the next great roster.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  data-tutorial-id="home-enter-rogue"
                  onClick={onOpenRoguelike}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.11em] text-slate-900 shadow-[0_18px_40px_rgba(255,255,255,0.18)] transition hover:scale-[1.02] xl:px-7"
                >
                  Enter Rogue
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={onOpenRogueChallenges}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-100/28 bg-cyan-300/12 px-6 py-3 text-xs font-semibold uppercase tracking-[0.11em] text-cyan-50 transition hover:scale-[1.02] hover:bg-cyan-300/18 xl:px-7"
                >
                  Challenges
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={onRestartTutorial}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-200/26 bg-amber-300/12 px-6 py-3 text-xs font-semibold uppercase tracking-[0.11em] text-amber-100 transition hover:scale-[1.02] hover:bg-amber-300/16 xl:px-7"
                >
                  Tutorial
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3 lg:mt-auto lg:pt-8">
                {[
                  { label: "Draft", value: "1-of-5 boards", Icon: PackageOpen },
                  { label: "Climb", value: "69 floors", Icon: Zap },
                  { label: "Collect", value: "Owned forever", Icon: Shield },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="rounded-[18px] border border-white/10 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur">
                    <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100/68">
                      <Icon size={13} />
                      {label}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white xl:text-base">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pointer-events-none relative hidden min-h-[430px] lg:block">
              <div className="absolute inset-x-[13%] top-[7%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),rgba(125,211,252,0.12)_45%,transparent_74%)] blur-2xl" />
              <div className="home-rogue-hero__real-card-stack absolute left-1/2 top-[1%] h-[356px] w-[380px] -translate-x-1/2">
                {heroCardStack.map((card) => (
                  <div key={card.key} className={`home-rogue-hero__real-card ${card.className}`}>
                    <DraftPlayerCard
                      player={card.player}
                      compact
                      compactScale={0.35}
                      rarityOverride={card.rarity}
                    />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-[7%] left-0 right-0 rounded-[24px] border border-white/10 bg-black/36 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
                <div className="grid grid-cols-5 gap-1.5">
                  {["Start", "Build", "Train", "Reward", "Repeat"].map((step, index) => (
                    <div key={step} className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[18px] border border-cyan-100/10 bg-white/[0.045] px-1.5 py-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-cyan-100/24 bg-cyan-300/10 text-[10px] font-semibold text-cyan-50">
                        {index + 1}
                      </div>
                      <div className="w-full text-center text-[8px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-100">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel flex min-h-[460px] flex-col rounded-[28px] border border-sky-200/12 p-4 shadow-card lg:h-full lg:rounded-[30px] xl:p-5">
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
                const challengeTeam = challenge.requiredTeamName
                  ? getNbaTeamByName(challenge.requiredTeamName)
                  : null;

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
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white">
                          <Coins size={12} className="text-amber-200" />
                          {formatNumber(challenge.reward)} tokens{rewardCoach ? " + Coach" : ""}
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
