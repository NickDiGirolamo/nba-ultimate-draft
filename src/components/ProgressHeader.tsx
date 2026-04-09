interface ProgressHeaderProps {
  pickNumber: number;
}

export const ProgressHeader = ({ pickNumber }: ProgressHeaderProps) => {
  const completedPicks = Math.min(pickNumber - 1, 10);
  const current = Math.min(pickNumber, 10);
  const progress = (completedPicks / 10) * 100;

  return (
    <div className="glass-panel rounded-[28px] p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-sky-200/70">Legends Draft</p>
          <h2 className="mt-2 font-display text-3xl text-white">Pick {current} of 10</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Choose one of five all-time options. Every pick locks into your roster and changes how the season simulation evaluates your team.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-sm text-slate-300">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Rounds Left</div>
            <div className="mt-2 text-2xl font-semibold text-white">{Math.max(0, 10 - completedPicks)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Card Deal</div>
            <div className="mt-2 text-2xl font-semibold text-white">5</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Roster Size</div>
            <div className="mt-2 text-2xl font-semibold text-white">10</div>
          </div>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
