import { ChevronLeft, ChevronRight, Crown, Flag, Shield, Sparkles, Star, Target, Users } from "lucide-react";
import { CategoryChallenge, DraftChallenge, RareEvent } from "../types";

interface DraftBriefingProps {
  challenge: DraftChallenge;
  rareEvent: RareEvent;
  rareEventsEnabled: boolean;
  categoryChallenge: CategoryChallenge | null;
  categoryChallengesEnabled: boolean;
  prestigeReward?: number;
  focusTargetScore?: number | null;
  onBack: () => void;
  onBegin: () => void;
}

export const DraftBriefing = ({
  challenge,
  rareEvent,
  rareEventsEnabled,
  categoryChallenge,
  categoryChallengesEnabled,
  prestigeReward = 0,
  focusTargetScore = null,
  onBack,
  onBegin,
}: DraftBriefingProps) => {
  const classicMode = challenge.id === "classic";
  const tokenReward = prestigeReward * 10;
  const activeRule = classicMode
    ? "Draft the strongest all-around 10-player team you can."
    : challenge.id === "none"
      ? "Build the best roster possible within this setup."
      : challenge.description;
  const activeGoal = classicMode
    ? "Win the NBA Championship."
    : categoryChallengesEnabled && categoryChallenge
      ? `Post a ${focusTargetScore ?? 95}+ ${categoryChallenge.metricLabel.toLowerCase()} score.`
      : "Win the NBA Championship.";
  return (
  <section className="space-y-8">
    <div className="glass-panel rounded-[34px] p-8 shadow-card lg:p-10">
      <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
        Draft Briefing
      </div>
      <h1 className="mt-5 font-display text-4xl text-white lg:text-6xl">
        Challenge ready.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200/85">
        This run is locked in and ready to go. Keep the goal simple, draft with intent, and see if you can clear it.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_1.05fr_0.9fr]">
        <div className="rounded-[28px] border border-amber-300/18 bg-amber-300/8 p-6">
          <div className="flex items-center gap-3 text-amber-100">
            <Flag size={18} />
            <span className="text-xs uppercase tracking-[0.22em]">Rule</span>
          </div>
          <h2 className="mt-4 font-display text-3xl text-white">{challenge.title}</h2>
          <p className="mt-4 text-base leading-8 text-slate-100">{activeRule}</p>
        </div>

        <div className="rounded-[28px] border border-emerald-300/18 bg-emerald-300/8 p-6">
          <div className="flex items-center gap-3 text-emerald-100">
            <Target size={18} />
            <span className="text-xs uppercase tracking-[0.22em]">Goal</span>
          </div>
          <h2 className="mt-4 font-display text-3xl text-white">{activeGoal}</h2>
          <p className="mt-4 text-base leading-8 text-slate-100">
            {categoryChallengesEnabled && categoryChallenge
              ? `This run is focused on ${categoryChallenge.metricLabel.toLowerCase()}, so every pick should help push that number up.`
              : "This is a full-season challenge, so build a team that can survive both the regular season and the playoffs."}
          </p>
        </div>

        <div className="rounded-[28px] border border-sky-300/18 bg-sky-300/8 p-6">
          <div className="flex items-center gap-3 text-sky-100">
            <Sparkles size={18} />
            <span className="text-xs uppercase tracking-[0.22em]">Run Intel</span>
          </div>
          <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
              <Crown size={14} className="text-amber-200" />
              Rewards
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <div className="text-4xl font-semibold text-white">+{prestigeReward} XP</div>
                <div className="mt-1 text-sm font-medium text-amber-100">+{tokenReward} Tokens</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Clear this challenge route to bank its one-time Prestige payout toward your next level and earn Tokens at a 10-to-1 rate.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-6">
        <div className="flex items-center gap-3 text-slate-200">
          <Target size={18} />
          <span className="text-xs uppercase tracking-[0.22em] text-slate-400">How To Win This Run</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            categoryChallengesEnabled && categoryChallenge
              ? `Prioritize players who move ${categoryChallenge.metricLabel.toLowerCase()} immediately, then use chemistry as the tiebreaker.`
              : "Start with the best available core, then keep the roster balanced enough to survive a full season.",
            "Watch badge previews before you pick. A glowing badge means that player would activate value the moment you draft them.",
            "Use the reorder screen to put your real best five in the starter slots. The sim rewards strong top-end lineup ordering.",
          ].map((tip) => (
            <div key={tip} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
              {tip}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
        <div className="flex items-center gap-3 text-slate-200">
          <Shield size={18} />
          <span className="text-xs uppercase tracking-[0.22em] text-slate-400">Quick Notes</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              rule: "You will draft exactly 10 players before the sim begins.",
              icon: Star,
              iconClass: "bg-amber-300/14 text-amber-200",
            },
            {
              rule: "Lineup order matters, so put your best core in the starter slots.",
              icon: Crown,
              iconClass: "bg-sky-300/14 text-sky-200",
            },
            {
              rule: "Synergies like Dynamic Duos and Big 3s can swing a close run.",
              icon: Users,
              iconClass: "bg-emerald-300/14 text-emerald-200",
            },
          ].map((item) => (
            <div key={item.rule} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2 ${item.iconClass}`}>
                  <item.icon size={16} />
                </div>
                <div className="min-w-0 pt-0.5">{item.rule}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onBegin}
          className="inline-flex min-w-[260px] items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900 transition hover:scale-[1.02]"
        >
          Start Drafting
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
        >
          <ChevronLeft size={18} />
          Back to Setup
        </button>
      </div>
    </div>
  </section>
);
};
