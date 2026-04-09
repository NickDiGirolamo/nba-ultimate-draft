import clsx from "clsx";
import { Users } from "lucide-react";
import { getPlayerDynamicDuo, isDynamicDuoActiveForPlayer } from "../lib/dynamicDuos";

interface DynamicDuoBadgeProps {
  playerId: string;
  draftedPlayerIds: string[];
  compact?: boolean;
  className?: string;
}

export const DynamicDuoBadge = ({
  playerId,
  draftedPlayerIds,
  compact = false,
  className,
}: DynamicDuoBadgeProps) => {
  const duo = getPlayerDynamicDuo(playerId);
  if (!duo) return null;

  const active = isDynamicDuoActiveForPlayer(playerId, draftedPlayerIds);

  return (
    <div
      title={active ? `${duo.title} active` : `${duo.title} available`}
      className={clsx(
        "inline-flex items-center justify-center rounded-full border transition-all duration-300",
        compact ? "h-7 min-w-7 px-2" : "h-8 min-w-8 px-2.5",
        active
          ? "border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
          : "border-white/12 bg-black/30 text-slate-500",
        className,
      )}
    >
      <Users size={compact ? 13 : 15} strokeWidth={2.2} />
    </div>
  );
};
