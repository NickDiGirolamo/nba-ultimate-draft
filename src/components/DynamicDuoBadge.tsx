import clsx from "clsx";
import { Users } from "lucide-react";
import {
  getPlayerDynamicDuos,
  isDynamicDuoActiveForPlayer,
  isDynamicDuoPreviewActiveForPlayer,
} from "../lib/dynamicDuos";
import { HoverTooltip } from "./HoverTooltip";

interface DynamicDuoBadgeProps {
  playerId: string;
  draftedPlayerIds: string[];
  compact?: boolean;
  dense?: boolean;
  featured?: boolean;
  className?: string;
  previewEligible?: boolean;
}

export const DynamicDuoBadge = ({
  playerId,
  draftedPlayerIds,
  compact = false,
  dense = false,
  featured = false,
  className,
  previewEligible = true,
}: DynamicDuoBadgeProps) => {
  const duos = getPlayerDynamicDuos(playerId);
  if (duos.length === 0) return null;

  const active = isDynamicDuoActiveForPlayer(playerId, draftedPlayerIds);
  const previewActive = isDynamicDuoPreviewActiveForPlayer(playerId, draftedPlayerIds);
  const partnerNames = [...new Set(
    duos.flatMap((duo) => duo.players.filter((memberId) => memberId !== playerId)),
  )]
    .map((playerId) =>
      playerId
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(" or ");
  const tooltipText =
    duos.length > 1
      ? active
        ? `Dynamic Duo active: ${partnerNames}`
        : `Dynamic Duo available with: ${partnerNames}`
      : active
        ? `${duos[0].title} active`
        : `${duos[0].title} available`;
  const highlighted = active || (previewEligible && previewActive);

  return (
    <HoverTooltip content={tooltipText} className="inline-flex">
      <div
        className={clsx(
          "inline-flex cursor-help items-center justify-center rounded-full border transition-all duration-300",
          compact
            ? "h-7 min-w-7 gap-1 px-2"
            : featured
              ? "h-10 min-w-10 gap-2 px-3.5"
              : dense
                ? "h-7 min-w-7 gap-1.5 px-2.5"
                : "h-8 min-w-8 gap-1.5 px-2.5",
          highlighted
            ? "border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
            : "border-white/12 bg-black/30 text-slate-500",
          className,
        )}
      >
          <Users size={compact ? 13 : featured ? 17 : 15} strokeWidth={2.2} />
          {!compact ? (
            <span
              className={clsx(
                "uppercase",
                featured
                  ? "text-[12px] font-semibold tracking-[0.12em]"
                  : dense
                    ? "text-[9px] tracking-[0.04em]"
                    : "text-[11px] tracking-[0.08em]",
              )}
            >
              Duo
            </span>
          ) : null}
      </div>
    </HoverTooltip>
  );
};
