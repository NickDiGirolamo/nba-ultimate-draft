import { Crown, Sparkles, X } from "lucide-react";
import { PrestigeLevelUpEvent } from "../types";

interface PrestigeLevelUpModalProps {
  levelUp: PrestigeLevelUpEvent;
  onClose: () => void;
}

export const PrestigeLevelUpModal = ({
  levelUp,
  onClose,
}: PrestigeLevelUpModalProps) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/72 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[36px] border border-amber-200/18 bg-[#090c14] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <div className="rounded-[18px] border border-amber-200/20 bg-amber-300/10 p-3 text-amber-100">
            <Crown size={22} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-amber-100/75">
              Prestige Level Up
            </div>
            <h2 className="mt-1 font-display text-[clamp(2rem,4vw,3.5rem)] leading-none text-white">
              Level {levelUp.newLevel}
            </h2>
          </div>
        </div>

        <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Previous Level
              </div>
              <div className="mt-2 text-4xl font-semibold text-white">{levelUp.previousLevel}</div>
            </div>
            <div className="flex flex-1 items-center gap-3 px-2">
              <div className="h-3 flex-1 overflow-hidden rounded-full border border-white/10 bg-slate-800/90">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300" />
              </div>
              <div className="text-2xl font-semibold text-amber-100">→</div>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                New Level
              </div>
              <div className="mt-2 text-5xl font-semibold text-white">{levelUp.newLevel}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-300">
            <span>{levelUp.previousScore} XP</span>
            <span className="font-medium text-amber-100">{levelUp.newScore} XP</span>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
            <Sparkles size={14} className="text-amber-200" />
            Unlocks At This Level
          </div>

          {levelUp.unlockedRewards.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {levelUp.unlockedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="rounded-[26px] border border-emerald-200/16 bg-emerald-300/10 p-5"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-100/80">
                    Level {reward.level} Reward
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">{reward.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{reward.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-6 text-slate-300">
              No gameplay unlock lands exactly on this level, but your prestige total still moved up and got you closer to the next reward tier.
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-100"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
