import clsx from "clsx";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { usePlayerImage } from "../hooks/usePlayerImage";
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
}

export const DraftPlayerCard = ({
  player,
  onSelect,
  selected,
  disabled,
  compact = false,
  draftedPlayerIds = [],
}: DraftPlayerCardProps) => {
  const visual = getPlayerVisual(player);
  const imageUrl = usePlayerImage(player);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(player)}
      disabled={disabled}
      className={clsx(
        "tier-shine group relative flex h-full w-full flex-col overflow-hidden rounded-[26px] border bg-gradient-to-br p-5 text-left transition duration-300",
        compact ? "min-h-[220px]" : "min-h-[390px]",
        tierStyles[player.hallOfFameTier],
        disabled ? "cursor-default opacity-70" : "hover:-translate-y-2 hover:scale-[1.01]",
        selected && "scale-[1.02] ring-2 ring-glow",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%)]" />

      <div className="relative mb-4 rounded-[22px] border border-white/12 bg-black/20 px-4 py-3 text-center">
        <div className="text-[10px] uppercase tracking-[0.28em] text-slate-300">
          Player Score
        </div>
        <div className="mt-2 font-display text-[2.6rem] font-semibold leading-none text-white">
          {player.overall}
        </div>
      </div>

      <div
        className={clsx(
          "relative mb-4 overflow-hidden rounded-[22px] border border-white/10 bg-gradient-to-br",
          visual.bg,
          compact ? "h-[140px]" : "h-[244px]",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%)]" />

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={player.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <>
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
        <h3 className="font-display text-[1.65rem] font-semibold leading-tight text-white">
          {player.name}
        </h3>
      </div>

      <div className="relative mt-auto pt-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-300">
          Tap to draft
        </div>
        <PlayerSynergyBadges
          playerId={player.id}
          draftedPlayerIds={draftedPlayerIds}
          className="mt-3"
        />
      </div>
    </button>
  );
};
