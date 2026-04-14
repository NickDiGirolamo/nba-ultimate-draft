import clsx from "clsx";
import { Users } from "lucide-react";
import { PlayerBadgeType, getPlayerBadgeStates } from "../lib/dynamicDuos";

interface PlayerSynergyBadgesProps {
  playerId: string;
  draftedPlayerIds: string[];
  compact?: boolean;
  align?: "start" | "center";
  className?: string;
  excludeTypes?: PlayerBadgeType[];
}

const RivalIcon = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={clsx(
      "flex items-center justify-center rounded-full border border-current font-black leading-none",
      compact ? "h-4 w-4 text-[9px]" : "h-5 w-5 text-[11px]",
    )}
  >
    R
  </div>
);

const BigThreeIcon = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={clsx(
      "flex items-center justify-center rounded-full border border-current font-black leading-none",
      compact ? "h-4 w-4 text-[9px]" : "h-5 w-5 text-[11px]",
    )}
  >
    3
  </div>
);

const HexChessIcon = ({
  piece,
  compact = false,
}: {
  piece: string;
  compact?: boolean;
}) => {
  const size = compact ? 16 : 20;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M7 3.5h10L22 12l-5 8.5H7L2 12 7 3.5Z" />
      </svg>
      <span
        className={clsx(
          "relative font-black leading-none",
          compact ? "text-[9px]" : "text-[11px]",
        )}
      >
        {piece}
      </span>
    </div>
  );
};

const badgeContent = (type: PlayerBadgeType, compact: boolean) => {
  switch (type) {
    case "dynamic-duo":
      return <Users size={compact ? 13 : 15} strokeWidth={2.2} />;
    case "big-3":
      return <BigThreeIcon compact={compact} />;
    case "rival":
      return <RivalIcon compact={compact} />;
    case "role-player":
      return <HexChessIcon piece="♟" compact={compact} />;
    case "centerpiece":
      return <HexChessIcon piece="♚" compact={compact} />;
    default:
      return null;
  }
};

const badgeLabel = (type: PlayerBadgeType) => {
  switch (type) {
    case "dynamic-duo":
      return "Dynamic Duo";
    case "big-3":
      return "Big 3";
    case "rival":
      return "Rival";
    case "role-player":
      return "Role Player";
    case "centerpiece":
      return "Centerpiece";
    default:
      return "Badge";
  }
};

const badgeTooltip = (
  type: PlayerBadgeType,
  title: string,
  players: string[],
  active: boolean,
) => {
  if (type === "big-3") {
    const playerList = players
      .map((playerId) =>
        playerId
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      )
      .join(" + ");

    return active
      ? `${title} active: ${playerList}`
      : `${title} requires: ${playerList}`;
  }

  if (type === "role-player" || type === "centerpiece") {
    const playerList = players
      .map((playerId) =>
        playerId
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      )
      .join(" - ");

    if (type === "centerpiece") {
      return `Centerpiece: Role Players - ${playerList}`;
    }

    return active
      ? `${title} active: ${playerList}`
      : `${title} available with: ${playerList}`;
  }

  return active ? `${title} active` : `${title} available`;
};

export const PlayerSynergyBadges = ({
  playerId,
  draftedPlayerIds,
  compact = false,
  align = "center",
  className,
  excludeTypes = [],
}: PlayerSynergyBadgesProps) => {
  const badges = getPlayerBadgeStates(playerId, draftedPlayerIds).filter(
    ({ definition }) => !excludeTypes.includes(definition.type),
  );
  if (badges.length === 0) return null;

  return (
    <div
      className={clsx(
        "flex flex-wrap gap-2",
        align === "center" ? "justify-center" : "justify-start",
        className,
      )}
    >
      {badges.map(({ definition, active, previewActive, tooltipPlayers }) => (
        <div
          key={definition.id}
          className="group/badge relative inline-flex"
        >
          <div
            title={badgeTooltip(definition.type, definition.title, tooltipPlayers, active)}
            className={clsx(
              "inline-flex cursor-help items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300",
              compact ? "h-7 text-[10px]" : "h-8 text-[11px]",
              previewActive
                ? "border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
                : "border-white/12 bg-black/30 text-slate-500",
            )}
          >
            {badgeContent(definition.type, compact)}
            {!compact ? <span className="uppercase tracking-[0.16em]">{badgeLabel(definition.type)}</span> : null}
          </div>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-[240px] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-[11px] font-medium text-slate-100 opacity-0 shadow-[0_18px_40px_rgba(2,6,23,0.6)] transition duration-150 group-hover/badge:block group-hover/badge:opacity-100">
            {badgeTooltip(definition.type, definition.title, tooltipPlayers, active)}
          </div>
        </div>
      ))}
    </div>
  );
};
