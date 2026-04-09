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
    <span className="absolute left-0 top-0.5 h-2.5 w-2.5 rounded-t-full rounded-bl-full border-2 border-current border-r-0" />
    <span className="absolute right-0 top-0.5 h-2.5 w-2.5 rounded-t-full rounded-br-full border-2 border-current border-l-0" />
  </div>
);

const BigThreeIcon = ({ compact = false }: { compact?: boolean }) => (
  <div className={clsx("flex items-end gap-0.5 font-black leading-none", compact ? "text-[8px]" : "text-[9px]")}>
    <span className="tracking-[0.18em]">BIG</span>
    <span className={compact ? "text-[11px]" : "text-[12px]"}>3</span>
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
          title={active ? `${definition.title} active` : `${definition.title} available`}
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
