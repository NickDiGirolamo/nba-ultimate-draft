interface ProgressHeaderProps {
  pickNumber: number;
}

export const ProgressHeader = ({ pickNumber }: ProgressHeaderProps) => {
  const completedPicks = Math.min(pickNumber - 1, 10);
  const current = Math.min(pickNumber, 10);
  const progress = (completedPicks / 10) * 100;

  return (
    <div className="glass-panel h-full rounded-[28px] p-4 shadow-card">
      <div className="flex h-full flex-col justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-sky-200/70">Legends Draft</p>
          <h2 className="mt-1 font-display text-[1.85rem] leading-none text-white">Pick {current} of 10</h2>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            One choice locks in each round.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Left</div>
            <div className="mt-1 text-xl font-semibold text-white">{Math.max(0, 10 - completedPicks)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Deal</div>
            <div className="mt-1 text-xl font-semibold text-white">5</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Roster</div>
            <div className="mt-1 text-xl font-semibold text-white">10</div>
          </div>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
