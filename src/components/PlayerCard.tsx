import clsx from "clsx";
import { Shield, Sparkles, Target } from "lucide-react";
import { getPlayerDisplayLines } from "../lib/playerDisplay";
import { getPlayerVisual } from "../lib/playerVisuals";
import { Player } from "../types";

const tierStyles = {
  S: "from-amber-300/30 via-amber-100/10 to-yellow-500/30 border-amber-300/45 shadow-[0_22px_50px_rgba(251,191,36,0.18)]",
  A: "from-sky-300/25 via-cyan-100/10 to-blue-500/25 border-sky-300/35 shadow-[0_22px_50px_rgba(56,189,248,0.16)]",
  B: "from-fuchsia-300/20 via-slate-100/5 to-violet-500/20 border-fuchsia-300/25 shadow-[0_22px_50px_rgba(167,139,250,0.12)]",
  C: "from-slate-300/14 via-slate-100/5 to-slate-500/14 border-slate-200/15 shadow-card",
};

interface PlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

export const PlayerCard = ({
  player,
  onSelect,
  selected,
  disabled,
  compact = false,
}: PlayerCardProps) => {
  const visual = getPlayerVisual(player);
  const { firstNameLine, lastNameLine, versionLine } = getPlayerDisplayLines(player);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(player)}
      disabled={disabled}
      className={clsx(
        "tier-shine group relative flex h-full w-full flex-col overflow-hidden rounded-[26px] border bg-gradient-to-br p-5 text-left transition duration-300",
        compact ? "min-h-[214px]" : "min-h-[360px]",
        tierStyles[player.hallOfFameTier],
        disabled ? "cursor-default opacity-70" : "hover:-translate-y-2 hover:scale-[1.01]",
        selected && "scale-[1.02] ring-2 ring-glow",
      )}
    >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%)]" />

        <div
          className={clsx(
            "relative mb-5 overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br p-4",
            visual.bg,
            compact ? "h-[118px]" : "h-[168px]",
          )}
        >
          <div
            className={clsx(
              "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl",
              visual.orb,
            )}
          />
          <div
            className={clsx(
              "absolute bottom-3 right-3 h-16 w-24 border bg-white/5 backdrop-blur-[2px]",
              visual.line,
              visual.motif,
            )}
          />
          <div className="absolute inset-x-3 bottom-3 top-3 overflow-hidden rounded-[18px] border border-white/8 bg-black/10">
            <div className="absolute -left-6 top-2 font-display text-[92px] leading-none text-white/7">
              {visual.initials}
            </div>
            <div className="absolute bottom-3 left-3">
              <div
                className={clsx(
                  "bg-gradient-to-r bg-clip-text font-display text-3xl font-semibold text-transparent",
                  visual.accent,
                )}
              >
                {visual.surname}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-slate-200/70">
                {visual.tagline}
              </div>
            </div>
            <div className="absolute right-3 top-3 rounded-full border border-white/12 bg-black/20 px-2 py-1 text-[10px] tracking-[0.26em] text-slate-300">
              #{visual.jerseyNumber}
            </div>
            <div className="absolute bottom-0 right-4 h-[78%] w-[42%] rounded-t-[999px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))]" />
            <div className="absolute bottom-[22%] right-[18%] h-7 w-7 rounded-full border border-white/10 bg-white/10" />
            <div className="absolute bottom-[35%] right-[12%] h-10 w-10 rounded-full border border-white/10 bg-white/6" />
            <div className="absolute bottom-[16%] right-[8%] h-12 w-20 rounded-[999px] border border-white/10 bg-white/6" />
            <div className="absolute inset-x-[45%] bottom-[18%] top-[14%] w-[2px] bg-white/8" />
          </div>
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <div className="mb-2 inline-flex rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-200/80">
              Tier {player.hallOfFameTier}
            </div>
            <h3 className="max-w-full font-display text-2xl font-semibold leading-tight text-white">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap tracking-tight">{firstNameLine}</div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap tracking-tight">{lastNameLine}</div>
              {versionLine ? <div className="text-[0.72em] tracking-tight text-slate-200/90">{versionLine}</div> : null}
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              {player.primaryPosition} • {player.teamLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-black/20 px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">OVR</div>
            <div className="font-display text-3xl font-semibold text-white">{player.overall}</div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {player.badges.slice(0, 3).map((badge) => (
            <span key={badge} className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-100">
              {badge}
            </span>
          ))}
        </div>

        <p
          className={clsx(
            "relative mt-4 text-sm leading-6 text-slate-200/85",
            compact && "line-clamp-2",
          )}
        >
          {player.shortDescription}
        </p>

        <div className="relative mt-auto space-y-3 pt-5">
          <div className="grid grid-cols-3 gap-2">
            <div className="stat-pill rounded-2xl p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <Target size={14} />
                Off
              </div>
              <div className="mt-2 text-lg font-semibold text-white">{player.offense}</div>
            </div>
            <div className="stat-pill rounded-2xl p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <Shield size={14} />
                Def
              </div>
              <div className="mt-2 text-lg font-semibold text-white">{player.defense}</div>
            </div>
            <div className="stat-pill rounded-2xl p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <Sparkles size={14} />
                Chem
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {Math.round(
                  (player.playmaking + player.shooting + player.intangibles) / 3,
                )}
              </div>
            </div>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">Playmaking {player.playmaking}</div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">Shooting {player.shooting}</div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">Rebounding {player.rebounding}</div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">Athleticism {player.athleticism}</div>
            </div>
          )}
        </div>
      </button>
  );
};
