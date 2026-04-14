import clsx from "clsx";
import { Users } from "lucide-react";
import {
  getPlayerDynamicDuo,
  isDynamicDuoActiveForPlayer,
  isDynamicDuoPreviewActiveForPlayer,
} from "../lib/dynamicDuos";

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
  const previewActive = isDynamicDuoPreviewActiveForPlayer(playerId, draftedPlayerIds);
  const tooltipText = active ? `${duo.title} active` : `${duo.title} available`;

  return (
    <div className="group/duo relative inline-flex">
      <div
        title={tooltipText}
        className={clsx(
          "inline-flex cursor-help items-center justify-center rounded-full border transition-all duration-300",
          compact ? "h-7 min-w-7 gap-1 px-2" : "h-8 min-w-8 gap-1.5 px-2.5",
          previewActive
            ? "border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
            : "border-white/12 bg-black/30 text-slate-500",
          className,
        )}
        >
          <Users size={compact ? 13 : 15} strokeWidth={2.2} />
          {!compact ? <span className="text-[11px] uppercase tracking-[0.08em]">Duo</span> : null}
        </div>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-[11px] font-medium text-slate-100 opacity-0 shadow-[0_18px_40px_rgba(2,6,23,0.6)] transition duration-150 group-hover/duo:block group-hover/duo:opacity-100">
        {tooltipText}
      </div>
    </div>
  );
};
