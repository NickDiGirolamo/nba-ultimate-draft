import { BarChart3, RotateCcw, ShieldCheck, Star, Swords, Trophy } from "lucide-react";
import { RosterSlot, SimulationResult } from "../types";
import { PlayerCard } from "./PlayerCard";

interface ResultsScreenProps {
  result: SimulationResult;
  roster: RosterSlot[];
  onDraftAgain: () => void;
}

export const ResultsScreen = ({ result, roster, onDraftAgain }: ResultsScreenProps) => (
  <section className="space-y-8">
    <div className="glass-panel rounded-[34px] p-8 shadow-card lg:p-10">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-amber-200/80">Season Results</p>
          <h1 className="mt-3 font-display text-4xl text-white lg:text-6xl">{result.teamName}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{result.summary}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onDraftAgain} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">
            <RotateCcw size={18} />
            Draft Again
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Record", value: `${result.record.wins}-${result.record.losses}`, icon: BarChart3 },
          { label: "Seed", value: `${result.seed} Seed (${result.conference})`, icon: Trophy },
          { label: "Playoff Finish", value: result.playoffFinish, icon: Swords },
          { label: "Draft Grade", value: result.draftGrade, icon: Star },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/15 p-5">
            <item.icon size={18} className="text-sky-200" />
            <div className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</div>
            <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-8">
        <div className="glass-panel rounded-[30px] p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-300/12 p-3 text-sky-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Team Profile</p>
              <h2 className="mt-1 font-display text-2xl text-white">Metric Snapshot</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Overall", `${result.metrics.overall} • ${result.ratingLabel}`],
              ["Offense", `${result.metrics.offense} • ${result.offenseLabel}`],
              ["Defense", `${result.metrics.defense} • ${result.defenseLabel}`],
              ["Playmaking", `${result.metrics.playmaking}`],
              ["Shooting", `${result.metrics.shooting}`],
              ["Rebounding", `${result.metrics.rebounding}`],
              ["Depth", `${result.metrics.depth}`],
              ["Fit", `${result.metrics.fit}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
                <div className="mt-2 text-lg font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-6 shadow-card">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Strengths</div>
              <div className="mt-3 space-y-3">
                {result.strengths.map((item) => (
                  <div key={item} className="rounded-2xl border border-emerald-300/14 bg-emerald-300/7 p-4 text-sm leading-6 text-slate-100">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-rose-200/70">Weaknesses</div>
              <div className="mt-3 space-y-3">
                {result.weaknesses.map((item) => (
                  <div key={item} className="rounded-2xl border border-rose-300/14 bg-rose-300/7 p-4 text-sm leading-6 text-slate-100">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/15 p-5 text-sm leading-7 text-slate-300">
            <span className="font-semibold text-white">Why it ended this way:</span> {result.reason}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <PlayerCard player={result.mvp} compact />
          <PlayerCard player={result.xFactor} compact />
        </div>

        <div className="glass-panel rounded-[30px] p-6 shadow-card">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Final Roster</div>
          <div className="mt-4 space-y-3">
            {roster.map((slot, index) => (
              <div key={`${slot.label}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{slot.slot}</div>
                    <div className="mt-1 font-medium text-white">{slot.player?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">{slot.player?.primaryPosition}</div>
                    <div className="mt-1 text-lg font-semibold text-white">{slot.player?.overall}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
