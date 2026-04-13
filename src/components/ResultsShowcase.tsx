import { useState } from "react";
import clsx from "clsx";
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
  Info,
} from "lucide-react";
import { usePlayerImage } from "../hooks/usePlayerImage";
import {
  BracketMatchup,
  ConferenceBracket,
  MetaProgress,
  Player,
  PlayoffBracket,
  RosterSlot,
  RunHistoryEntry,
  SimulationResult,
  TeamMetrics,
} from "../types";

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

const analyticMetricHelp: Record<string, string> = {
  "Top-3 Star Avg":
    "The average overall rating of your three best players. This captures how much top-end star talent your roster brought into the season.",
  "Stability Index":
    "A blend of low variance, chemistry, and depth. Higher stability means the team is less likely to swing wildly from game to game.",
  "Spacing Pressure":
    "A combined look at raw shooting and lineup spacing. Higher values mean your offense puts more strain on defenses away from the paint.",
  "Starting Five":
    "The average overall rating of your five starters. This is your opening-unit quality before the bench comes into play.",
  "Bench Unit":
    "The average overall rating of your reserve group. Higher values mean your non-starter minutes hold up better over a long season.",
  "Two-Way Index":
    "An overall balance score built from offense, defense, and lineup fit. It reflects how complete your team is on both sides of the ball.",
};

const dashboardMetricHelp: Record<string, string> = {
  Overall:
    "Your roster's total team strength once the full simulation model weighs talent, fit, and lineup structure together.",
  Offense:
    "How dangerous the team projects to be at generating points across scoring, creation, and shooting pressure.",
  Defense:
    "How reliably the roster can get stops through point-of-attack defense, help coverage, size, and rim resistance.",
  Playmaking:
    "Your team's ability to organize offense, create quality shots, and keep possessions flowing.",
  Shooting:
    "The pure shotmaking and floor-stretching quality of the roster.",
  Rebounding:
    "How well the team projects to win the glass and create extra possessions.",
  Depth:
    "How much quality survives after the starters. Better depth means less drop-off when the bench checks in.",
  Fit:
    "How cleanly the pieces work together in terms of roles, positional balance, and lineup logic.",
  Chemistry:
    "How naturally the roster accepts roles and benefits from synergy between the players you drafted.",
  "Star Power":
    "The ceiling-lifting talent at the top of the roster. This is about game-breaking players who can swing playoff series.",
  Spacing:
    "How much room the lineup creates for drives, post play, and offensive flow by forcing defenses to stretch out.",
  "Rim Protection":
    "How well the team can deter and contest shots near the basket.",
};

const MetricLabelWithTooltip = ({
  label,
  help,
  className,
}: {
  label: string;
  help?: string;
  className?: string;
}) => (
  <div className={clsx("flex items-center gap-2", className)}>
    <span>{label}</span>
    {help ? (
      <span className="group relative inline-flex">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/12 bg-white/6 text-slate-400 transition group-hover:border-amber-200/30 group-hover:text-amber-100">
          <Info size={11} />
        </span>
        <span className="pointer-events-none absolute bottom-full left-1/2 z-30 hidden w-56 -translate-x-1/2 pb-2 group-hover:block">
          <span className="block rounded-2xl border border-white/12 bg-slate-950 px-3 py-2 text-xs normal-case leading-5 tracking-normal text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
            {help}
          </span>
        </span>
      </span>
    ) : null}
  </div>
);

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

const personalBestForMetric = (label: string, meta: MetaProgress) => {
  switch (label) {
    case "Overall":
      return meta.personalBests.overall;
    case "Offense":
      return meta.personalBests.offense;
    case "Defense":
      return meta.personalBests.defense;
    case "Playmaking":
      return meta.personalBests.playmaking;
    case "Shooting":
      return meta.personalBests.shooting;
    case "Rebounding":
      return meta.personalBests.rebounding;
    case "Depth":
      return meta.personalBests.depth;
    case "Fit":
      return meta.personalBests.fit;
    case "Chemistry":
      return meta.personalBests.chemistry;
    case "Star Power":
      return meta.personalBests.starPower;
    case "Spacing":
      return meta.personalBests.spacing;
    case "Rim Protection":
      return meta.personalBests.rimProtection;
    default:
      return 0;
  }
};

const categoryMetricAbbreviation = (categoryChallenge: NonNullable<SimulationResult["categoryChallenge"]>) => {
  switch (categoryChallenge.metric) {
    case "offense":
      return "OFF";
    case "defense":
      return "DEF";
    case "playmaking":
      return "PLY";
    case "shooting":
      return "3PT";
    case "rebounding":
      return "REB";
    case "fit":
      return "FIT";
    case "chemistry":
      return "CHEM";
    default:
      return categoryChallenge.metricLabel.toUpperCase();
  }
};

const playerCategoryMetricValue = (
  player: Player,
  categoryChallenge: NonNullable<SimulationResult["categoryChallenge"]>,
) => {
  switch (categoryChallenge.metric) {
    case "offense":
      return player.offense;
    case "defense":
      return player.defense;
    case "playmaking":
      return player.playmaking;
    case "shooting":
      return player.shooting;
    case "rebounding":
      return player.rebounding;
    case "fit":
    case "chemistry":
      return player.intangibles;
    default:
      return player.overall;
  }
};

const getPrimaryStrengthMetric = (metrics: TeamMetrics) => {
  const entries = [
    { label: "Offense", value: metrics.offense, note: "Scoring ceiling traveled all year." },
    { label: "Defense", value: metrics.defense, note: "Stops gave this roster real playoff credibility." },
    { label: "Playmaking", value: metrics.playmaking, note: "Creation flow kept the attack organized." },
    { label: "Shooting", value: metrics.shooting, note: "Spacing helped every lineup breathe." },
    { label: "Rebounding", value: metrics.rebounding, note: "Extra possessions kept showing up." },
    { label: "Depth", value: metrics.depth, note: "The bench helped stabilize the run." },
    { label: "Fit", value: metrics.fit, note: "The pieces made sense together." },
    { label: "Chemistry", value: metrics.chemistry, note: "Roles and synergy held the group together." },
  ];

  return entries.sort((a, b) => b.value - a.value)[0];
};

const getPrimaryPressureMetric = (metrics: TeamMetrics) => {
  const entries = [
    { label: "Offense", value: metrics.offense, note: "This side of the ball never fully separated." },
    { label: "Defense", value: metrics.defense, note: "Defensive slippage held the ceiling down." },
    { label: "Playmaking", value: metrics.playmaking, note: "The half-court creation load got heavy." },
    { label: "Shooting", value: metrics.shooting, note: "Spacing pressure showed up in tighter games." },
    { label: "Rebounding", value: metrics.rebounding, note: "Possession battles stayed too close." },
    { label: "Depth", value: metrics.depth, note: "Bench support limited the margin for error." },
    { label: "Fit", value: metrics.fit, note: "Overlap or awkward role fit dragged a bit." },
    { label: "Chemistry", value: metrics.chemistry, note: "The group never became fully seamless." },
  ];

  return entries.sort((a, b) => a.value - b.value)[0];
};

const CompactRosterCard = ({
  slot,
  isStarter,
  categoryChallenge,
}: {
  slot: RosterSlot;
  isStarter: boolean;
  categoryChallenge?: SimulationResult["categoryChallenge"];
}) => {
  const imageUrl = slot.player ? usePlayerImage(slot.player) : null;
  const categoryLabel = categoryChallenge ? categoryMetricAbbreviation(categoryChallenge) : null;
  const categoryValue =
    slot.player && categoryChallenge ? playerCategoryMetricValue(slot.player, categoryChallenge) : null;

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
            <div className="flex items-center justify-end gap-3 text-[10px] uppercase tracking-[0.24em] text-slate-500">
              <span>OVR</span>
              {categoryLabel ? <span>{categoryLabel}</span> : null}
            </div>
            <div className="mt-1 flex items-center justify-end gap-3">
              <div className="text-2xl font-semibold text-white">{slot.player?.overall ?? "--"}</div>
              {categoryLabel ? (
                <div className="text-2xl font-semibold text-amber-100">{categoryValue ?? "--"}</div>
              ) : null}
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

const BracketTeamPill = ({
  team,
  isWinner,
}: {
  team: BracketMatchup["home"];
  isWinner: boolean;
}) => (
  <div className="group relative">
    <div
      className={clsx(
        "rounded-2xl border px-3 py-3 transition",
        isWinner
          ? "border-amber-200/25 bg-amber-300/10"
          : "border-white/10 bg-white/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
            {team.seed} Seed
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-white">
            {team.teamName}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-white">{team.projectedWins}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Wins</div>
        </div>
      </div>
    </div>

    <div className="pointer-events-none absolute left-1/2 top-full z-20 hidden w-64 -translate-x-1/2 pt-3 group-hover:block">
      <div className="rounded-[20px] border border-white/10 bg-slate-950/96 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
          Top 3 Players
        </div>
        <div className="mt-2 text-sm font-semibold text-white">{team.teamName}</div>
        <div className="mt-3 space-y-2">
          {team.stars.map((player) => (
            <div
              key={`${team.teamName}-${player.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-white">{player.name}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {player.primaryPosition}
                </div>
              </div>
              <div className="text-sm font-semibold text-amber-100">{player.overall}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BracketTeamRow = ({
  team,
  isWinner,
  compact = false,
  tooltipSide = "right",
}: {
  team: BracketMatchup["home"];
  isWinner: boolean;
  compact?: boolean;
  tooltipSide?: "right" | "left" | "top";
}) => (
  <div className="group relative">
    <div
      className={clsx(
        "flex h-[58px] w-full min-w-0 max-w-full items-center justify-between gap-2 overflow-hidden rounded-xl border px-2.5 py-2",
        compact && "h-[52px]",
        team.isUserTeam && "ring-2 ring-sky-300/70 shadow-[0_0_0_1px_rgba(125,211,252,0.45),0_0_28px_rgba(56,189,248,0.22)]",
        isWinner
          ? "border-amber-200/25 bg-amber-300/10"
          : "border-white/10 bg-white/5",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {team.isUserTeam ? (
          <div className="flex h-7 shrink-0 items-center justify-center rounded-lg bg-sky-300/18 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-sky-100">
            You
          </div>
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/35 text-[11px] font-bold text-white">
            {team.seed}
          </div>
        )}
        <div className="min-w-0">
          <div className={clsx("truncate font-semibold text-white", compact ? "text-[11px]" : "text-[13px]")}>
            {team.teamName}
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              {team.projectedWins} wins
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      className={clsx(
        "pointer-events-none absolute z-20 hidden w-64 group-hover:block",
        tooltipSide === "right" && "left-full top-1/2 ml-3 -translate-y-1/2",
        tooltipSide === "left" && "right-full top-1/2 mr-3 -translate-y-1/2",
        tooltipSide === "top" && "bottom-full left-1/2 mb-3 -translate-x-1/2",
      )}
    >
      <div className="rounded-[20px] border border-white/12 bg-slate-950 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
        <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
          Top 3 Players
        </div>
        <div className="mt-2 text-sm font-semibold text-white">{team.teamName}</div>
        <div className="mt-3 space-y-2">
          {team.stars.map((player) => (
            <div
              key={`${team.teamName}-${player.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-white">{player.name}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {player.primaryPosition}
                </div>
              </div>
              <div className="text-sm font-semibold text-amber-100">{player.overall}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BracketSeriesStack = ({
  matchup,
  compact = false,
  tooltipSide = "right",
}: {
  matchup: BracketMatchup;
  compact?: boolean;
  tooltipSide?: "right" | "left" | "top";
}) => (
  <div className={clsx("w-full min-w-0 max-w-full space-y-2", compact ? "min-h-[106px]" : "min-h-[118px]")}>
    <BracketTeamRow
      team={matchup.home}
      isWinner={matchup.winnerTeamName === matchup.home.teamName}
      compact={compact}
      tooltipSide={tooltipSide}
    />
    <BracketTeamRow
      team={matchup.away}
      isWinner={matchup.winnerTeamName === matchup.away.teamName}
      compact={compact}
      tooltipSide={tooltipSide}
    />
  </div>
);

const BracketRoundCell = ({
  matchup,
  reverse = false,
  compact = false,
}: {
  matchup: BracketMatchup;
  reverse?: boolean;
  compact?: boolean;
}) => (
  <div className="relative flex h-full min-h-0 items-center">
    <BracketSeriesStack
      matchup={matchup}
      compact={compact}
      tooltipSide={reverse ? "left" : "right"}
    />
    <div
      className={clsx(
        "pointer-events-none absolute top-1/2 hidden h-px w-4 -translate-y-1/2 bg-white/18 xl:block",
        reverse ? "-left-4" : "-right-4",
      )}
    />
  </div>
);

const BracketConferenceTree = ({
  title,
  bracket,
  reverse = false,
}: {
  title: string;
  bracket: ConferenceBracket;
  reverse?: boolean;
}) => {
  const quarterTop = [0, 150, 300, 450];
  const semiTop = [75, 375];
  const conferenceTop = 225;

  const quarterLane = reverse ? "right-0" : "left-0";
  const semiLane = reverse ? "right-[184px]" : "left-[184px]";
  const conferenceLane = reverse ? "right-[336px]" : "left-[336px]";

  return (
    <div className="space-y-4">
      <div className={clsx("text-center", reverse ? "xl:text-right" : "xl:text-left")}>
        <div className="text-sm font-black uppercase tracking-[0.28em] text-slate-300">
          {title}
        </div>
      </div>

      <div className="relative mx-auto h-[600px] w-[520px] max-w-full">
        {bracket.quarterfinals.slice(0, 4).map((matchup, index) => (
          <div
            key={matchup.id}
            className={clsx("absolute w-[172px]", quarterLane)}
            style={{ top: `${quarterTop[index]}px` }}
          >
            <BracketRoundCell matchup={matchup} reverse={reverse} />
          </div>
        ))}

        {bracket.semifinals.slice(0, 2).map((matchup, index) => (
          <div
            key={matchup.id}
            className={clsx("absolute w-[144px]", semiLane)}
            style={{ top: `${semiTop[index]}px` }}
          >
            <BracketRoundCell matchup={matchup} reverse={reverse} compact />
          </div>
        ))}

        {bracket.conferenceFinal ? (
          <div
            className={clsx("absolute w-[128px]", conferenceLane)}
            style={{ top: `${conferenceTop}px` }}
          >
            <BracketRoundCell matchup={bracket.conferenceFinal} reverse={reverse} compact />
          </div>
        ) : (
          <div
            className={clsx(
              "absolute w-[128px] rounded-[20px] border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-400",
              conferenceLane,
            )}
            style={{ top: `${conferenceTop}px` }}
          >
            Bracket unavailable
          </div>
        )}
      </div>
    </div>
  );
};

const PlayoffBracketBoard = ({ bracket }: { bracket: PlayoffBracket }) => (
  <div className="glass-panel overflow-visible rounded-[30px] p-6 shadow-card">
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Playoff Bracket
        </div>
        <h2 className="mt-1 font-display text-2xl text-white">
          16-Team Title Path
        </h2>
      </div>
      <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
        Hover teams for top 3 players
      </div>
    </div>

    <div className="mt-6 min-w-0 overflow-hidden">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,520px)_360px_minmax(0,520px)] xl:items-start xl:justify-between">
      <BracketConferenceTree title="Western Conference" bracket={bracket.west} />

      <div className="min-w-0 space-y-4 xl:pt-28">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
            NBA Finals
          </div>
          <div className="mt-2 font-display text-3xl text-white">Championship</div>
        </div>

        {bracket.finals ? (
          <div className="rounded-[26px] border border-amber-200/18 bg-amber-300/8 p-5">
            <BracketSeriesStack matchup={bracket.finals} tooltipSide="top" />
            <div className="mt-4 rounded-2xl border border-emerald-300/18 bg-emerald-300/10 px-4 py-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.24em] text-emerald-100/70">
                NBA Champion
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                {bracket.champion?.teamName ?? bracket.finals.winnerTeamName}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <BracketConferenceTree title="Eastern Conference" bracket={bracket.east} reverse />
      </div>
    </div>
  </div>
);

export const ResultsShowcase = ({
  result,
  roster,
  onDraftAgain,
  meta,
  history,
}: ResultsShowcaseProps) => {
  const [resultsPage, setResultsPage] = useState<"season" | "dashboard">("season");
  const prestigeChallengeActive = Boolean(result.prestigeChallengeId && result.prestigeChallengeTitle);
  const prestigeChallengeStatusLine = result.prestigeChallengeCleared
    ? `Cleared for +${result.prestigeChallengeReward ?? 0} Prestige`
    : `Failed · +${result.prestigeChallengeReward ?? 0} was on the line`;
  const prestigeChallengeDetail =
    result.mode === "category-focus"
      ? `Final focus score: ${result.focusScore ?? 0} / 95 target`
      : `Final playoff result: ${result.playoffFinish}`;
  const prestigeChallengeTone = result.prestigeChallengeCleared
    ? "border-emerald-300/22 bg-emerald-300/10"
    : "border-rose-300/18 bg-rose-300/10";
  const prestigeChallengeIconTone = result.prestigeChallengeCleared
    ? "bg-emerald-300/16 text-emerald-100"
    : "bg-rose-300/16 text-rose-100";
  const prestigeChallengeLabelTone = result.prestigeChallengeCleared
    ? "text-emerald-100"
    : "text-rose-100";
  const PrestigeChallengeIcon = result.prestigeChallengeCleared ? Crown : Swords;

  if (result.mode === "category-focus" && result.categoryChallenge) {
    const focusHistory = history
      .filter((entry) => entry.mode === "category-focus" && entry.categoryFocusId === result.categoryChallenge?.id)
      .sort((a, b) => b.createdAtStamp - a.createdAtStamp)
      .slice(0, 5);
    const personalBestForCategory = Math.max(
      result.focusScore ?? 0,
      ...focusHistory.map((entry) => entry.focusScore ?? 0),
    );
    const gapToBest = Math.round(((result.focusScore ?? 0) - personalBestForCategory) * 10) / 10;
    const focusMetricCards = [
      { label: result.categoryChallenge.metricLabel, value: result.focusScore ?? 0, icon: Target },
      { label: "Personal Best", value: personalBestForCategory, icon: Crown },
      { label: "Overall", value: result.metrics.overall, icon: Trophy },
      { label: "Chemistry", value: result.metrics.chemistry, icon: Sparkles },
    ];
    const supportMetrics = [
      { label: "Offense", value: result.metrics.offense },
      { label: "Defense", value: result.metrics.defense },
      { label: "Playmaking", value: result.metrics.playmaking },
      { label: "Shooting", value: result.metrics.shooting },
      { label: "Rebounding", value: result.metrics.rebounding },
      { label: "Fit", value: result.metrics.fit },
    ];

    return (
      <section className="space-y-8">
        {prestigeChallengeActive && (
          <div className={`glass-panel rounded-[32px] p-6 shadow-card ${prestigeChallengeTone}`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className={`rounded-[22px] p-3 ${prestigeChallengeIconTone}`}>
                  <PrestigeChallengeIcon size={20} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.26em] text-slate-400">
                    Loaded Challenge Route
                  </div>
                  <h2 className="mt-2 font-display text-3xl text-white">
                    {result.prestigeChallengeTitle}
                  </h2>
                  <div className={`mt-2 text-sm font-semibold uppercase tracking-[0.18em] ${prestigeChallengeLabelTone}`}>
                    {prestigeChallengeStatusLine}
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
                    Goal: {result.prestigeChallengeGoal}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{prestigeChallengeDetail}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Prestige Reward</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    +{result.prestigeChallengeReward ?? 0}
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Outcome</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {result.prestigeChallengeCleared ? "Challenge Cleared" : "Try Again"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel overflow-hidden rounded-[34px] p-8 shadow-card lg:p-10">
          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/85">
                Category Focus Results
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <h1 className="font-display text-4xl text-white lg:text-6xl">
                  {result.categoryChallenge.metricLabel} Run
                </h1>
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-4 py-2">
                  <div className="rounded-full bg-emerald-300/20 p-2 text-emerald-100">
                    <Target size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.26em] text-emerald-100/70">
                      Focus Score
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {result.focusScore}
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

          <div className="relative mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {focusMetricCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-white/8 p-3 text-emerald-100">
                    <item.icon size={18} />
                  </div>
                  <div className="text-3xl font-semibold text-white">{item.value}</div>
                </div>
                <div className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Focus Breakdown
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-white">
                    {result.categoryChallenge.metricLabel} Dashboard
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">
                  Specialist mode
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {supportMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          {metric.label}
                        </div>
                        <div className="mt-1 text-xl font-semibold text-white">
                          {metric.value}
                        </div>
                      </div>
                      <div className="text-xs uppercase tracking-[0.22em] text-emerald-100">
                        {gradeFromMetric(metric.value)}
                      </div>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${metricTone(metric.value)}`}
                        style={{
                          width: `${Math.max(12, Math.min(metric.value, 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/15 p-5 text-sm leading-7 text-slate-300">
                <span className="font-semibold text-white">What drove the score:</span>{" "}
                {result.reason}
              </div>
            </div>

            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Recent Focus Runs
              </div>
              <h2 className="mt-1 font-display text-2xl text-white">
                Last 5 {result.categoryChallenge.metricLabel} Attempts
              </h2>

              <div className="mt-5 space-y-3">
                {focusHistory.length > 0 ? (
                  focusHistory.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{entry.teamName}</div>
                          <div className="mt-1 text-sm text-slate-300">
                            {entry.categoryFocusTitle} score: {entry.focusScore ?? "--"}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                            {entry.rareEventTitle}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{entry.grade}</div>
                          <div className="text-xs text-slate-400">{entry.createdAt}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-6 text-sm leading-7 text-slate-300">
                    This is your first recorded run for this category focus.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Personal Best</div>
                  <div className="mt-2 text-4xl font-semibold text-white">{personalBestForCategory}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    Best recorded {result.categoryChallenge.metricLabel.toLowerCase()} score in this mode.
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Current Run Delta</div>
                  <div className="mt-2 text-4xl font-semibold text-white">
                    {gapToBest === 0 ? "Tied" : gapToBest > 0 ? `+${gapToBest}` : `${gapToBest}`}
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    Difference versus your best-ever {result.categoryChallenge.metricLabel.toLowerCase()} run.
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <SpotlightCard
                  title="Best Driver"
                  player={result.mvp}
                  accent="from-emerald-300/25 to-lime-400/20"
                />
                <SpotlightCard
                  title="Key Support"
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
                      categoryChallenge={result.categoryChallenge}
                    />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const analytics = buildAnalytics(roster, result.metrics);
  const metricsForDisplay = chartMetrics(result.metrics, result);
  const primaryStrength = getPrimaryStrengthMetric(result.metrics);
  const primaryPressure = getPrimaryPressureMetric(result.metrics);
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

  const highlightValueClass = (value: string) => {
    if (value.length >= 13) return "text-[1.02rem] leading-5";
    if (value.length >= 10) return "text-[1.2rem] leading-6";
    return "text-2xl";
  };

  return (
    <section className="space-y-8">
      <div className="flex justify-center">
        <button
          onClick={onDraftAgain}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_45px_rgba(255,255,255,0.12)]"
        >
          <RotateCcw size={18} />
          Draft Again
        </button>
      </div>

      {prestigeChallengeActive && (
        <div className={`glass-panel rounded-[32px] p-6 shadow-card ${prestigeChallengeTone}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className={`rounded-[22px] p-3 ${prestigeChallengeIconTone}`}>
                <PrestigeChallengeIcon size={20} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.26em] text-slate-400">
                  Loaded Challenge Route
                </div>
                <h2 className="mt-2 font-display text-3xl text-white">
                  {result.prestigeChallengeTitle}
                </h2>
                <div className={`mt-2 text-sm font-semibold uppercase tracking-[0.18em] ${prestigeChallengeLabelTone}`}>
                  {prestigeChallengeStatusLine}
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
                  Goal: {result.prestigeChallengeGoal}
                </p>
                <p className="mt-1 text-sm text-slate-400">{prestigeChallengeDetail}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Prestige Reward</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  +{result.prestigeChallengeReward ?? 0}
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Outcome</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {result.prestigeChallengeCleared ? "Challenge Cleared" : "Try Again"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          {[
            { id: "season" as const, label: "Season Outcome" },
            { id: "dashboard" as const, label: "Team Dashboard" },
          ].map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setResultsPage(page.id)}
              className={clsx(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition",
                resultsPage === page.id
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:text-white",
              )}
            >
              {page.label}
            </button>
          ))}
        </div>
      </div>

      <div className={clsx("grid gap-8", resultsPage === "season" ? "xl:grid-cols-1" : "xl:grid-cols-[1.1fr_0.9fr]")}>
        <div className="space-y-8">
          {resultsPage === "dashboard" && (
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
                            <MetricLabelWithTooltip
                              label={metric.label}
                              help={dashboardMetricHelp[metric.label]}
                            />
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
                      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-amber-100/80">
                        Best {personalBestForMetric(metric.label, meta)}
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
          )}

          {resultsPage === "season" && (
          <div className="glass-panel overflow-hidden rounded-[34px] p-8 shadow-card lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.16),transparent_28%)]" />

            <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_340px] xl:items-start">
              <div className="max-w-4xl">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200/85">
                  Season Outcome
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

              <div className="space-y-4 xl:justify-self-end xl:w-full">
                <div className="grid gap-3">
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      Run Snapshot
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {result.record.wins >= 55 ? "Upper-tier contender" : result.record.wins >= 48 ? "Strong playoff build" : "Volatile playoff build"}
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {result.seed} seed, {result.record.wins} wins, {result.playoffFinish}.
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-4 backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-emerald-100/70">
                      Biggest Edge
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold text-white">{primaryStrength.label}</div>
                      <div className="text-xl font-semibold text-emerald-100">{primaryStrength.value}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-200">
                      {primaryStrength.note}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-rose-300/14 bg-rose-300/8 p-4 backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-rose-100/70">
                      Biggest Pressure Point
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold text-white">{primaryPressure.label}</div>
                      <div className="text-xl font-semibold text-rose-100">{primaryPressure.value}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-200">
                      {primaryPressure.note}
                    </div>
                  </div>
                </div>
              </div>
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
              </div>
                  <div className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </div>
                  <div
                    className={clsx(
                      "mt-2 font-semibold text-white break-words",
                      highlightValueClass(String(item.value)),
                    )}
                  >
                    {item.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{item.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
          )}

          {resultsPage === "season" && result.playoffBracket && (
            <div className="space-y-8">
              <PlayoffBracketBoard bracket={result.playoffBracket} />
            </div>
          )}

          {resultsPage === "season" && (
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
                    <span className="text-slate-400">
                      <MetricLabelWithTooltip
                        label="Top-3 Star Avg:"
                        help={analyticMetricHelp["Top-3 Star Avg"]}
                      />
                    </span>{" "}
                    <span className="font-semibold text-white">
                      {analytics.topThreeAverage}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-slate-400">
                      <MetricLabelWithTooltip
                        label="Stability Index:"
                        help={analyticMetricHelp["Stability Index"]}
                      />
                    </span>{" "}
                    <span className="font-semibold text-white">
                      {analytics.stabilityIndex}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-slate-400">
                      <MetricLabelWithTooltip
                        label="Spacing Pressure:"
                        help={analyticMetricHelp["Spacing Pressure"]}
                      />
                    </span>{" "}
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
                      <span className="text-slate-300">
                        <MetricLabelWithTooltip
                          label={row.label}
                          help={analyticMetricHelp[row.label]}
                        />
                      </span>
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
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/15 p-5 text-sm leading-7 text-slate-300">
                <span className="font-semibold text-white">All-time league context:</span>{" "}
                This simulation assumes the rest of the field is also built from all-time caliber rosters, so even a great team can run into a crowded standings race or a stronger optimized build elsewhere in the league.
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
          )}
        </div>

        {resultsPage === "dashboard" && (
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
                  categoryChallenge={result.categoryChallenge}
                />
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
};
