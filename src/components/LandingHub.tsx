import { ChevronRight, Shield } from "lucide-react";
import { MetaProgress, RunHistoryEntry } from "../types";

interface LandingHubProps {
  onOpenPrestige: () => void;
  onOpenRoguelike: () => void;
  onOpenRogueChallenges: () => void;
  onRestartTutorial: () => void;
  history: RunHistoryEntry[];
  meta: MetaProgress;
}

export const LandingHub = ({
  onOpenPrestige,
  onOpenRoguelike,
  onOpenRogueChallenges,
  onRestartTutorial,
  meta,
}: LandingHubProps) => {
  const formatRogueBestValue = (label: string, value: number) =>
    label === "Furthest Floor" ? `${Math.round(value)}` : value.toFixed(1);
  const formatDifficultyLabel = (difficulty: string | undefined) => {
    const labels: Record<string, string> = {
      normal: "Normal",
      "all-star": "All-Star",
      superstar: "Superstar",
      "all-time": "All-Time",
      goat: "GOAT",
    };

    return labels[difficulty ?? "normal"] ?? "Normal";
  };
  const hardestDifficultyValue = `${formatDifficultyLabel(
    meta.roguePersonalBests.hardestDifficulty,
  )} | Floor ${Math.round(meta.roguePersonalBests.hardestDifficultyFloor ?? 0)}`;

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

        <div className="glass-panel rounded-[36px] border border-emerald-200/12 p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-300/14 p-3 text-emerald-200">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Rogue Profile</p>
              <h2 className="mt-1 font-display text-2xl text-white">All-Time Bests</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {([
              ["Furthest Floor", meta.roguePersonalBests.furthestFloor],
              ["Best OVR", meta.roguePersonalBests.overall],
              ["Best OFF", meta.roguePersonalBests.offense],
              ["Best DEF", meta.roguePersonalBests.defense],
              ["Difficulty Setting", hardestDifficultyValue],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-emerald-200/12 bg-emerald-300/6 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {typeof value === "number" ? formatRogueBestValue(label, value) : value}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenRoguelike}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Continue the Climb
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </section>
  );
};
