import { ChevronLeft, ChevronRight, Flag, Shield, Sparkles, Target } from "lucide-react";
import { CategoryChallenge, DraftChallenge, RareEvent } from "../types";

interface DraftBriefingProps {
  challenge: DraftChallenge;
  rareEvent: RareEvent;
  rareEventsEnabled: boolean;
  categoryChallenge: CategoryChallenge | null;
  categoryChallengesEnabled: boolean;
  onBack: () => void;
  onBegin: () => void;
}

export const DraftBriefing = ({
  challenge,
  rareEvent,
  rareEventsEnabled,
  categoryChallenge,
  categoryChallengesEnabled,
  onBack,
  onBegin,
}: DraftBriefingProps) => (
  <section className="space-y-8">
    <div className="glass-panel rounded-[34px] p-8 shadow-card lg:p-10">
      <div className="inline-flex rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
        Draft Briefing
      </div>
      <h1 className="mt-5 font-display text-4xl text-white lg:text-6xl">
        Your run parameters are locked in.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200/85">
        Review the active challenges, environment rules, and category focus before the first five players are revealed.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-[26px] border border-amber-300/18 bg-amber-300/8 p-5">
          <div className="flex items-center gap-3 text-amber-100">
            <Flag size={18} />
            <span className="text-xs uppercase tracking-[0.22em]">Primary Challenge</span>
          </div>
          <h2 className="mt-3 font-display text-2xl text-white">{challenge.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">{challenge.description}</p>
          <div className="mt-4 text-sm text-amber-100">Reward: +{challenge.reward} legacy</div>
        </div>

        <div className="rounded-[26px] border border-sky-300/18 bg-sky-300/8 p-5">
          <div className="flex items-center gap-3 text-sky-100">
            <Sparkles size={18} />
            <span className="text-xs uppercase tracking-[0.22em]">Environment</span>
          </div>
          <h2 className="mt-3 font-display text-2xl text-white">{rareEvent.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            {rareEventsEnabled ? rareEvent.description : "Rare events are disabled for this run, so you are drafting into the standard environment."}
          </p>
          <div className="mt-4 text-sm text-sky-100">{rareEvent.impact}</div>
        </div>

        <div className="rounded-[26px] border border-emerald-300/18 bg-emerald-300/8 p-5">
          <div className="flex items-center gap-3 text-emerald-100">
            <Target size={18} />
            <span className="text-xs uppercase tracking-[0.22em]">Category Focus</span>
          </div>
          <h2 className="mt-3 font-display text-2xl text-white">
            {categoryChallengesEnabled && categoryChallenge ? categoryChallenge.metricLabel : "Disabled"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            {categoryChallengesEnabled && categoryChallenge
              ? categoryChallenge.description
              : "Category challenges are turned off, so this run has no random stat-focus objective."}
          </p>
          <div className="mt-4 text-sm text-emerald-100">
            {categoryChallengesEnabled && categoryChallenge
              ? `Goal: maximize your final ${categoryChallenge.metricLabel.toLowerCase()} score.`
              : "Goal: build the best all-around team you can."}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-6">
        <div className="flex items-center gap-3 text-slate-200">
          <Shield size={18} />
          <span className="text-xs uppercase tracking-[0.22em] text-slate-400">Rules + Goals</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "Draft exactly 10 players and place them in your preferred lineup order before the sim.",
            "Starter slots matter more than bench slots, and early bench spots matter more than deep utility spots.",
            "Synergy systems like Dynamic Duos, Big 3s, and Rivals can swing outcomes beyond raw overall ratings.",
            "If a category focus is active, treat it like a side objective and chase the highest score you can in that area.",
          ].map((rule) => (
            <div key={rule} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
              {rule}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onBegin}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
        >
          Begin Draft
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
