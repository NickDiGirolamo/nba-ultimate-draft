import { ChevronRight, Trophy } from "lucide-react";

interface LandingScreenProps {
  onStart: () => void;
  history: Array<{
    id: string;
    teamName: string;
    record: string;
    playoffFinish: string;
    grade: string;
    createdAt: string;
  }>;
}

export const LandingScreen = ({ onStart, history }: LandingScreenProps) => (
  <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
    <div className="glass-panel rounded-[34px] bg-hero-mesh p-8 shadow-card lg:p-12">
      <div className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-sky-100">
        All-Time NBA Draft Simulator
      </div>
      <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.04] text-white lg:text-7xl">
        Build a dynasty from the greatest players ever.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200/85">
        Draft a 10-man all-time NBA roster, balance star power with lineup fit, and simulate an 82-game season plus the entire playoff run.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <button onClick={onStart} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]">
          Start Draft
          <ChevronRight size={18} />
        </button>
        <div className="rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm text-slate-200">
          Choose 1 of 5 every round. Simulate the season when your roster is full.
        </div>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          ["10 picks", "Every round matters and every pick is permanent."],
          ["Smart fit model", "Spacing, playmaking, defense, depth, and balance all matter."],
          ["Replayable results", "A stacked team can dominate, but flawed builds can flame out."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
            <div className="font-display text-xl text-white">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="glass-panel rounded-[34px] p-8 shadow-card">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
          <Trophy size={22} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Run History</p>
          <h2 className="mt-1 font-display text-2xl text-white">Recent Franchises</h2>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {history.length > 0 ? (
          history.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{item.teamName}</div>
                  <div className="mt-1 text-sm text-slate-300">
                    {item.record} • {item.playoffFinish}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">{item.grade}</div>
                  <div className="text-xs text-slate-400">{item.createdAt}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-6 text-sm leading-7 text-slate-300">
            Your recent runs will appear here once you finish a draft and simulate the season.
          </div>
        )}
      </div>
    </div>
  </section>
);
