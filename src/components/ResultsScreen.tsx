import {
  Activity,
  BarChart3,
  Gauge,
  Orbit,
  Radar,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { DraftPlayerCard } from "./DraftPlayerCard";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { Player, RosterSlot, SimulationResult, TeamMetrics } from "../types";

interface ResultsScreenProps {
  result: SimulationResult;
  roster: RosterSlot[];
  onDraftAgain: () => void;
}

const gradeFromMetric = (value: number) => {
  if (value >= 95) return "A+";
  if (value >= 91) return "A";
  if (value >= 87) return "A-";
  if (value >= 83) return "B+";
  if (value >= 79) return "B";
  if (value >= 75) return "B-";
  if (value >= 71) return "C+";
  if (value >= 67) return "C";
  return "D";
};

const metricTone = (value: number) => {
  if (value >= 90) return "from-amber-300 via-orange-300 to-rose-400";
  if (value >= 84) return "from-sky-300 via-cyan-300 to-blue-400";
  if (value >= 76) return "from-emerald-300 via-lime-300 to-teal-400";
  return "from-rose-300 via-orange-300 to-amber-400";
};

const scoreRing = (value: number) => ({
  background: `conic-gradient(rgba(251,191,36,0.95) ${Math.max(8, value)}%, rgba(255,255,255,0.08) ${Math.max(8, value)}% 100%)`,
});

const buildAnalytics = (roster: RosterSlot[], metrics: TeamMetrics) => {
  const players = roster.map((slot) => slot.player).filter((player): player is Player => Boolean(player));
  const starters = players.slice(0, 5);
  const bench = players.slice(5);
  const starterAverage = starters.reduce((sum, player) => sum + player.overall, 0) / Math.max(starters.length, 1);
  const benchAverage = bench.reduce((sum, player) => sum + player.overall, 0) / Math.max(bench.length, 1);
  const topThreeAverage =
    players
      .slice()
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 3)
      .reduce((sum, player) => sum + player.overall, 0) / Math.min(Math.max(players.length, 1), 3);

  return {
    starterAverage: Math.round(starterAverage * 10) / 10,
    benchAverage: Math.round(benchAverage * 10) / 10,
    topThreeAverage: Math.round(topThreeAverage * 10) / 10,
    twoWayIndex: Math.round(((metrics.offense + metrics.defense + metrics.chemistry) / 3) * 10) / 10,
    spacingPressure: Math.round(((metrics.shooting + metrics.spacing) / 2) * 10) / 10,
    stabilityIndex: Math.round((100 - metrics.variance + metrics.chemistry * 0.35 + metrics.depth * 0.25) * 10) / 10,
  };
};

const chartMetrics = (metrics: TeamMetrics, result: SimulationResult) => [
  { label: "Overall", value: metrics.overall, icon: Trophy, note: result.ratingLabel },
  { label: "Offense", value: metrics.offense, icon: Zap, note: result.offenseLabel },
  { label: "Defense", value: metrics.defense, icon: ShieldCheck, note: result.defenseLabel },
  { label: "Playmaking", value: metrics.playmaking, icon: Orbit, note: "Creation flow" },
  { label: "Shooting", value: metrics.shooting, icon: Target, note: "Spacing gravity" },
  { label: "Rebounding", value: metrics.rebounding, icon: Activity, note: "Extra possessions" },
  { label: "Depth", value: metrics.depth, icon: Users, note: "Bench resilience" },
  { label: "Chemistry", value: metrics.chemistry, icon: RefreshCcw, note: "Role acceptance" },
  { label: "Star Power", value: metrics.starPower, icon: Star, note: "Ceiling raiser" },
  { label: "Spacing", value: metrics.spacing, icon: Radar, note: "Floor balance" },
  { label: "Rim Protection", value: metrics.rimProtection, icon: Gauge, note: "Paint security" },
];

const CompactRosterCard = ({ slot, isStarter }: { slot: RosterSlot; isStarter: boolean }) => {
  const imageUrl = slot.player ? usePlayerImage(slot.player) : null;

  return (
    <div className="rounded-[22px] border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/6">
          {slot.player && imageUrl ? (
            <img
              src={imageUrl}
              alt={slot.player.name}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 font-display text-lg text-white/70">
              {slot.player?.name.charAt(0) ?? slot.slot.charAt(0)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-center text-[9px] uppercase tracking-[0.24em] text-white/85">
            {slot.player?.primaryPosition ?? slot.slot}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
              {slot.slot}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.24em] ${
                isStarter ? "bg-amber-300/16 text-amber-100" : "bg-sky-300/14 text-sky-100"
              }`}
            >
              {isStarter ? "Starter" : "Bench"}
            </span>
          </div>
          <div className="mt-2 truncate font-semibold text-white">{slot.player?.name ?? "Empty slot"}</div>
          <div className="mt-1 text-xs text-slate-400">{slot.player?.teamLabel ?? "No player assigned"}</div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">OVR</div>
          <div className="mt-1 text-2xl font-semibold text-white">{slot.player?.overall ?? "--"}</div>
        </div>
      </div>
    </div>
  );
};

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
              ["Chemistry", `${result.metrics.chemistry}`],
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
          <DraftPlayerCard player={result.mvp} compact />
          <DraftPlayerCard player={result.xFactor} compact />
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
