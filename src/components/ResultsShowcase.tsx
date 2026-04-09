import {
  Activity,
  BarChart3,
  Crown,
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
import { usePlayerImage } from "../hooks/usePlayerImage";
import { MetaProgress, Player, RosterSlot, RunHistoryEntry, SimulationResult, TeamMetrics } from "../types";

interface ResultsShowcaseProps {
  result: SimulationResult;
  roster: RosterSlot[];
  onDraftAgain: () => void;
  meta: MetaProgress;
  history: RunHistoryEntry[];
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
  background: `conic-gradient(rgba(251,191,36,0.95) ${Math.max(
    8,
    value,
  )}%, rgba(255,255,255,0.08) ${Math.max(8, value)}% 100%)`,
});

const buildAnalytics = (roster: RosterSlot[], metrics: TeamMetrics) => {
  const players = roster
    .map((slot) => slot.player)
    .filter((player): player is Player => Boolean(player));
  const starters = players.slice(0, 5);
  const bench = players.slice(5);
  const starterAverage =
    starters.reduce((sum, player) => sum + player.overall, 0) /
    Math.max(starters.length, 1);
  const benchAverage =
    bench.reduce((sum, player) => sum + player.overall, 0) /
    Math.max(bench.length, 1);
  const topThreeAverage =
    players
      .slice()
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 3)
      .reduce((sum, player) => sum + player.overall, 0) /
    Math.min(Math.max(players.length, 1), 3);

  return {
    starterAverage: Math.round(starterAverage * 10) / 10,
    benchAverage: Math.round(benchAverage * 10) / 10,
    topThreeAverage: Math.round(topThreeAverage * 10) / 10,
    twoWayIndex:
      Math.round(((metrics.offense + metrics.defense + metrics.fit) / 3) * 10) /
      10,
    spacingPressure:
      Math.round(((metrics.shooting + metrics.spacing) / 2) * 10) / 10,
    stabilityIndex:
      Math.round(
        (100 - metrics.variance + metrics.chemistry * 0.35 + metrics.depth * 0.25) *
          10,
      ) / 10,
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
  { label: "Fit", value: metrics.fit, icon: Sparkles, note: "Lineup synergy" },
  { label: "Chemistry", value: metrics.chemistry, icon: RefreshCcw, note: "Role acceptance" },
  { label: "Star Power", value: metrics.starPower, icon: Star, note: "Ceiling raiser" },
  { label: "Spacing", value: metrics.spacing, icon: Radar, note: "Floor balance" },
  { label: "Rim Protection", value: metrics.rimProtection, icon: Gauge, note: "Paint security" },
];

const CompactRosterCard = ({
  slot,
  isStarter,
}: {
  slot: RosterSlot;
  isStarter: boolean;
}) => {
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
          <div className="mt-2 truncate font-semibold text-white">
            {slot.player?.name ?? "Empty slot"}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {slot.player?.teamLabel ?? "No player assigned"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
            OVR
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {slot.player?.overall ?? "--"}
          </div>
        </div>
      </div>
    </div>
  );
};

const SpotlightCard = ({
  title,
  player,
  accent,
}: {
  title: string;
  player: Player;
  accent: string;
}) => {
  const imageUrl = usePlayerImage(player);

  return (
    <div
      className={`overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br ${accent}`}
    >
      <div className="relative h-48 overflow-hidden border-b border-white/10 bg-black/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={player.name}
            className="h-full w-full object-cover object-top"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900 font-display text-5xl text-white/25">
            {player.name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent px-4 py-4">
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-300">
            {title}
          </div>
          <div className="mt-1 font-display text-2xl text-white">{player.name}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 text-center">
        {[
          { label: "OVR", value: player.overall },
          { label: "OFF", value: player.offense },
          { label: "DEF", value: player.defense },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-black/20 px-2 py-3"
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
              {stat.label}
            </div>
            <div className="mt-1 text-lg font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ResultsShowcase = ({
  result,
  roster,
  onDraftAgain,
  meta,
  history,
}: ResultsShowcaseProps) => {
  const analytics = buildAnalytics(roster, result.metrics);
  const metricsForDisplay = chartMetrics(result.metrics, result);
  const highlightCards = [
    {
      label: "Record",
      value: `${result.record.wins}-${result.record.losses}`,
      sublabel: `${result.seed} seed in the ${result.conference}`,
      icon: BarChart3,
      ringValue: result.metrics.overall,
    },
    {
      label: "Playoff Finish",
      value: result.playoffFinish,
      sublabel: `${result.titleOdds}% title odds`,
      icon: Swords,
      ringValue: result.titleOdds,
    },
    {
      label: "Draft Grade",
      value: result.draftGrade,
      sublabel: `${result.metrics.fit} fit score`,
      icon: Star,
      ringValue: result.metrics.fit,
    },
    {
      label: "Team Identity",
      value: `${analytics.twoWayIndex}`,
      sublabel: "Two-way index",
      icon: ShieldCheck,
      ringValue: analytics.twoWayIndex,
    },
    {
      label: "Legacy Score",
      value: `${result.legacyScore}`,
      sublabel: result.newPersonalBests?.includes("Legacy Score") ? "New personal best" : "Meta leaderboard score",
      icon: Crown,
      ringValue: Math.min(100, result.legacyScore / 4),
    },
  ];

  return (
    <section className="space-y-8">
      <div className="glass-panel overflow-hidden rounded-[34px] p-8 shadow-card lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_28%)]" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/85">
              Season Results
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <h1 className="font-display text-4xl text-white lg:text-6xl">
                {result.teamName}
              </h1>
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2">
                <div className="rounded-full bg-amber-300/20 p-2 text-amber-100">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.26em] text-amber-100/70">
                    Final Grade
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {result.draftGrade}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
              {result.summary}
            </p>
          </div>

          <button
            onClick={onDraftAgain}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
          >
            <RotateCcw size={18} />
            Draft Again
          </button>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {highlightCards.map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl bg-white/8 p-3 text-amber-100">
                  <item.icon size={18} />
                </div>
                <div
                  className="h-14 w-14 rounded-full p-[4px]"
                  style={scoreRing(item.ringValue)}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {typeof item.value === "string" && item.value.length > 4
                      ? item.value.slice(0, 4)
                      : item.value}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                {item.label}
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {item.value}
              </div>
              <div className="mt-2 text-sm text-slate-400">{item.sublabel}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="glass-panel rounded-[30px] p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Team Profile
                </p>
                <h2 className="mt-1 font-display text-2xl text-white">
                  Performance Dashboard
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">
                12-category scan
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {metricsForDisplay.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-2xl bg-gradient-to-br p-3 text-slate-950 ${metricTone(
                          metric.value,
                        )}`}
                      >
                        <metric.icon size={17} />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          {metric.label}
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {metric.note}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-white">
                        {metric.value}
                      </div>
                      <div className="text-xs uppercase tracking-[0.22em] text-amber-100">
                        {gradeFromMetric(metric.value)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${metricTone(
                        metric.value,
                      )}`}
                      style={{
                        width: `${Math.max(12, Math.min(metric.value, 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Championship Lens
              </p>
              <h2 className="mt-1 font-display text-2xl text-white">
                Power Snapshot
              </h2>

              <div className="mt-6 flex items-center gap-5">
                <div
                  className="h-32 w-32 rounded-full p-[8px]"
                  style={scoreRing(result.titleOdds)}
                >
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-slate-950">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      Title Odds
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      {result.titleOdds}%
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-slate-400">Top-3 Star Avg:</span>{" "}
                    <span className="font-semibold text-white">
                      {analytics.topThreeAverage}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-slate-400">Stability Index:</span>{" "}
                    <span className="font-semibold text-white">
                      {analytics.stabilityIndex}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-slate-400">Spacing Pressure:</span>{" "}
                    <span className="font-semibold text-white">
                      {analytics.spacingPressure}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {[
                  { label: "Starting Five", value: analytics.starterAverage },
                  { label: "Bench Unit", value: analytics.benchAverage },
                  { label: "Two-Way Index", value: analytics.twoWayIndex },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="rounded-2xl border border-white/10 bg-black/15 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-300">{row.label}</span>
                      <span className="font-semibold text-white">{row.value}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${metricTone(
                          row.value,
                        )}`}
                        style={{
                          width: `${Math.max(10, Math.min(row.value, 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">
                    Strengths
                  </div>
                  <div className="mt-3 space-y-3">
                    {result.strengths.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-emerald-300/14 bg-emerald-300/7 p-4 text-sm leading-6 text-slate-100"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-rose-200/70">
                    Weaknesses
                  </div>
                  <div className="mt-3 space-y-3">
                    {result.weaknesses.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-rose-300/14 bg-rose-300/7 p-4 text-sm leading-6 text-slate-100"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/15 p-5 text-sm leading-7 text-slate-300">
                <span className="font-semibold text-white">
                  Why it ended this way:
                </span>{" "}
                {result.reason}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Draft Challenge</div>
                  <div className="mt-2 text-xl font-semibold text-white">{result.challenge.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{result.challenge.description}</div>
                  <div className="mt-4 text-sm text-amber-100">
                    {result.challengeCompleted
                      ? `Completed for +${result.challengeReward} legacy`
                      : `Missed challenge bonus (+${result.challenge.reward} legacy)`}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Rare Event</div>
                  <div className="mt-2 text-xl font-semibold text-white">{result.rareEvent.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{result.rareEvent.description}</div>
                  <div className="mt-4 text-sm text-sky-100">{result.rareEventBonus.summary}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel rounded-[30px] p-6 shadow-card">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Personal Record Watch</div>
                <div className="mt-3 space-y-2">
                  {(result.newPersonalBests?.length ?? 0) > 0 ? (
                    result.newPersonalBests?.map((item) => (
                      <div key={item} className="rounded-2xl border border-emerald-300/18 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                        New personal best: {item}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      No records were broken this run. The chase continues.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Chemistry + Meta</div>
                <div className="mt-2 text-3xl font-semibold text-white">{result.chemistryScore}</div>
                <div className="mt-1 text-sm text-slate-300">Chemistry score from iconic pairings</div>
                <div className="mt-4 text-sm text-amber-100">
                  Lifetime best legacy: {meta.personalBests.legacyScore}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Total recorded runs: {history.length}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/15 p-5">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Chemistry Bonuses</div>
              <div className="mt-4 grid gap-3">
                {result.chemistryBonuses.length > 0 ? (
                  result.chemistryBonuses.map((bonus) => (
                    <div key={bonus.id} className="rounded-2xl border border-amber-300/16 bg-amber-300/8 p-4">
                      <div className="font-medium text-white">{bonus.title}</div>
                      <div className="mt-1 text-sm text-slate-300">{bonus.summary}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    No iconic chemistry pairings were completed on this roster.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[30px] p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Award Watch
                </div>
                <h2 className="mt-1 font-display text-2xl text-white">
                  Headliners
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">
                Team pillars
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <SpotlightCard
                title="Team MVP"
                player={result.mvp}
                accent="from-amber-300/25 to-orange-400/20"
              />
              <SpotlightCard
                title="X-Factor"
                player={result.xFactor}
                accent="from-sky-300/25 to-cyan-400/20"
              />
            </div>
          </div>

          <div className="glass-panel rounded-[30px] p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Final Roster
                </div>
                <h2 className="mt-1 font-display text-2xl text-white">
                  Team Film Strip
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">
                10-player rotation
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {roster.map((slot, index) => (
                <CompactRosterCard
                  key={`${slot.label}-${index}`}
                  slot={slot}
                  isStarter={index < 5}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
