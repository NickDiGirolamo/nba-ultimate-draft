import clsx from "clsx";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { DynamicDuoBadge } from "./DynamicDuoBadge";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { getPlayerDisplayLines } from "../lib/playerDisplay";
import { getPlayerVisual } from "../lib/playerVisuals";
import { Player } from "../types";

const tierStyles = {
  S: "from-amber-300/30 via-amber-100/10 to-yellow-500/30 border-amber-300/45 shadow-[0_22px_50px_rgba(251,191,36,0.18)]",
  A: "from-sky-300/25 via-cyan-100/10 to-blue-500/25 border-sky-300/35 shadow-[0_22px_50px_rgba(56,189,248,0.16)]",
  B: "from-fuchsia-300/20 via-slate-100/5 to-violet-500/20 border-fuchsia-300/25 shadow-[0_22px_50px_rgba(167,139,250,0.12)]",
  C: "from-slate-300/14 via-slate-100/5 to-slate-500/14 border-slate-200/15 shadow-card",
};

interface DraftPlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  draftedPlayerIds?: string[];
  actionLabel?: string;
}

export const DraftPlayerCard = ({
  player,
  onSelect,
  selected,
  disabled,
  compact = false,
  draftedPlayerIds = [],
  actionLabel = "Tap to draft",
}: DraftPlayerCardProps) => {
  const visual = getPlayerVisual(player);
  const imageUrl = usePlayerImage(player);
  const naturalPositions = [player.primaryPosition, ...player.secondaryPositions].join(" / ");
  const { firstNameLine, lastNameLine, versionLine } = getPlayerDisplayLines(player);
  const longestPrimaryNameLine = Math.max(firstNameLine.length, lastNameLine.length);
  const longName = longestPrimaryNameLine >= 8;
  const veryLongName = longestPrimaryNameLine >= 10;
  const extremeName = longestPrimaryNameLine >= 12;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(player)}
      disabled={disabled}
      className={clsx(
        "tier-shine group relative z-0 flex h-full w-full flex-col overflow-visible rounded-[26px] border bg-gradient-to-br text-left transition duration-300",
        compact ? "min-h-[420px] p-4" : "min-h-[1040px] p-5",
        tierStyles[player.hallOfFameTier],
        disabled ? "cursor-default opacity-70" : "hover:z-20 hover:-translate-y-2 hover:scale-[1.01]",
        selected && "scale-[1.02] ring-2 ring-glow",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%)]" />

      <div
        className={clsx(
          "relative mb-4 rounded-[22px] border border-white/12 bg-black/20 text-center",
          compact ? "px-4 py-3" : "px-4 py-3",
        )}
      >
        <div className={clsx("font-display font-semibold leading-none text-white", compact ? "text-[2.3rem]" : "text-[2.6rem]")}>
          {player.overall}
        </div>
        <div className={clsx("font-medium uppercase tracking-[0.2em] text-white/90", compact ? "mt-1.5 text-[10px]" : "mt-2 text-[11px]")}>
          {player.hallOfFameTier}-Tier
        </div>
      </div>

      <div
        className={clsx(
          "relative mb-4 w-full flex-none overflow-hidden rounded-[24px]",
          imageUrl ? "bg-black" : visual.bg,
          compact ? "h-[180px] min-h-[180px] max-h-[180px]" : "h-[303px] min-h-[303px] max-h-[303px]",
        )}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={player.name}
              className={clsx(
                "absolute inset-0 h-full w-full",
                compact ? "object-cover object-top scale-[1.02]" : "object-cover object-center",
              )}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%)]" />
            <div
              className={clsx(
                "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl",
                visual.orb,
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
                  Loading image
                </div>
              </div>
            </div>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      <div className="relative">
        <div
          className={clsx(
            "font-display font-semibold leading-none text-white",
            compact
              ? extremeName
                ? "text-[0.98rem]"
                : veryLongName
                  ? "text-[1.08rem]"
                  : longName
                    ? "text-[1.2rem]"
                    : "text-[1.38rem]"
              : extremeName
              ? "text-[0.78rem]"
              : veryLongName
                ? "text-[0.9rem]"
                : longName
                  ? "text-[1.04rem]"
                  : "text-[1.32rem]",
          )}
        >
          <div className="overflow-hidden text-ellipsis whitespace-nowrap tracking-tight">{firstNameLine}</div>
          <div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap tracking-tight">{lastNameLine}</div>
          {versionLine ? <div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.74em] tracking-tight text-slate-200/92">{versionLine}</div> : null}
        </div>
        <div
          className={clsx(
            "mt-2 text-slate-300",
            compact ? "text-[10px]" : veryLongName ? "text-[10px]" : "text-[11px]",
          )}
        >
          <div className={clsx("uppercase text-slate-300/90", compact ? "tracking-[0.16em]" : "tracking-[0.18em]")}>
            Natural Position:
          </div>
          <div className={clsx("mt-1 leading-5 text-white/92", compact ? "line-clamp-2 text-[11px]" : "text-[11px]")}>
            {naturalPositions}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <DynamicDuoBadge
            playerId={player.id}
            draftedPlayerIds={draftedPlayerIds}
            dense={compact}
          />
          <PlayerSynergyBadges
            playerId={player.id}
            draftedPlayerIds={draftedPlayerIds}
            dense={compact}
            excludeTypes={["dynamic-duo"]}
          />
        </div>
      </div>

      <div className="relative mt-auto flex flex-col justify-end pt-3">
        <div
          className={clsx(
            "rounded-2xl border border-white/10 bg-white/5 px-3 text-center uppercase text-slate-300",
            compact ? "py-2 text-[9px] tracking-[0.12em]" : "py-2 text-[10px] tracking-[0.16em]",
          )}
        >
            {actionLabel}
          </div>
      </div>
    </button>
  );
};
