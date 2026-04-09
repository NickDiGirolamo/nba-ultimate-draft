import clsx from "clsx";
import { Users } from "lucide-react";
import { PlayerBadgeType, getPlayerBadgeStates } from "../lib/dynamicDuos";

interface PlayerSynergyBadgesProps {
  playerId: string;
  draftedPlayerIds: string[];
  compact?: boolean;
  align?: "start" | "center";
  className?: string;
}

const RivalIcon = ({ compact = false }: { compact?: boolean }) => (
  <div className={clsx("relative", compact ? "h-3 w-5" : "h-3.5 w-6")}>
    <span
      className={clsx(
        "absolute left-0 top-0.5 block border-b-[2px] border-l-[1px] border-current",
        compact ? "h-2 w-2.5 skew-y-[18deg]" : "h-2.5 w-3 skew-y-[18deg]",
      )}
    />
    <span
      className={clsx(
        "absolute right-0 top-0.5 block border-b-[2px] border-r-[1px] border-current",
        compact ? "h-2 w-2.5 -skew-y-[18deg]" : "h-2.5 w-3 -skew-y-[18deg]",
      )}
    />
    <span className="absolute inset-x-[32%] top-0 h-px bg-current/55" />
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

const badgeContent = (type: PlayerBadgeType, compact: boolean) => {
  switch (type) {
    case "dynamic-duo":
      return <Users size={compact ? 13 : 15} strokeWidth={2.2} />;
    case "big-3":
      return <BigThreeIcon compact={compact} />;
    case "rival":
      return <RivalIcon compact={compact} />;
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

  return active ? `${title} active` : `${title} available`;
};

export const PlayerSynergyBadges = ({
  playerId,
  draftedPlayerIds,
  compact = false,
  align = "center",
  className,
}: PlayerSynergyBadgesProps) => {
  const badges = getPlayerBadgeStates(playerId, draftedPlayerIds);
  if (badges.length === 0) return null;

  return (
    <div
      className={clsx(
        "flex flex-wrap gap-2",
        align === "center" ? "justify-center" : "justify-start",
        className,
      )}
    >
      {badges.map(({ definition, active }) => (
        <div
          key={definition.id}
          title={badgeTooltip(definition.type, definition.title, definition.players, active)}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300",
            compact ? "h-7 text-[10px]" : "h-8 text-[11px]",
            active
              ? "border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
              : "border-white/12 bg-black/30 text-slate-500",
          )}
        >
          {badgeContent(definition.type, compact)}
          {!compact ? <span className="uppercase tracking-[0.16em]">{badgeLabel(definition.type)}</span> : null}
        </div>
      ))}
    </div>
  );
};
