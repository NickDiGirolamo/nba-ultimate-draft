import clsx from "clsx";
import { Player } from "../types";
import { HoverTooltip } from "./HoverTooltip";
import { PlayerTypeBadge, getPlayerTypeBadges } from "../lib/playerTypeBadges";
import type { PlayerTypeBadgeDefinition } from "../lib/playerTypeBadges";

interface PlayerTypeBadgesProps {
  player: Player;
  compact?: boolean;
  iconOnly?: boolean;
  align?: "start" | "center";
  className?: string;
  badgesOverride?: PlayerTypeBadgeDefinition[];
  limit?: number;
}

export const playerTypeBadgeStyleClass: Record<PlayerTypeBadge, string> = {
  slasher: "border-rose-300/35 bg-rose-300/10 text-rose-100 shadow-[0_0_0_1px_rgba(251,113,133,0.06)]",
  sniper: "border-sky-300/35 bg-sky-300/10 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.06)]",
  playmaker: "border-violet-300/35 bg-violet-300/10 text-violet-100 shadow-[0_0_0_1px_rgba(196,181,253,0.06)]",
  "board-man": "border-amber-300/35 bg-amber-300/10 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.06)]",
  lockdown: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100 shadow-[0_0_0_1px_rgba(110,231,183,0.06)]",
};

export const renderPlayerTypeBadgeIcon = (type: PlayerTypeBadge, compact: boolean) => {
  const size = compact ? 14 : 16;
  const strokeWidth = compact ? 2.1 : 2.2;
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: "shrink-0",
  } as const;

  switch (type) {
    case "slasher":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
          <path d="M8 17L16 7" stroke="currentColor" strokeWidth={strokeWidth + 0.3} strokeLinecap="round" />
        </svg>
      );
    case "sniper":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
          <circle cx="12" cy="12" r="5.1" stroke="currentColor" strokeWidth={strokeWidth} />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        </svg>
      );
    case "playmaker":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
          <path
            d="M7 12H15.4M12.7 8.8L16.5 12L12.7 15.2"
            stroke="currentColor"
            strokeWidth={strokeWidth + 0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "board-man":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
          <circle cx="12" cy="7.2" r="3.1" fill="currentColor" />
          <path
            d="M7.8 10.6V14.7C7.8 17.2 9.7 19.2 12 19.2C14.3 19.2 16.2 17.2 16.2 14.7V10.6"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path d="M12 14.3V19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );
    case "lockdown":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
          <path
            d="M12 5.5L16.8 7.5V11.6C16.8 14.8 14.9 17.6 12 18.9C9.1 17.6 7.2 14.8 7.2 11.6V7.5L12 5.5Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
};

export const PlayerTypeBadges = ({
  player,
  compact = false,
  iconOnly = false,
  align = "start",
  className,
  badgesOverride,
  limit,
}: PlayerTypeBadgesProps) => {
  const badges = (badgesOverride ?? getPlayerTypeBadges(player)).slice(0, limit);
  if (badges.length === 0) return null;

  return (
    <div
      className={clsx(
        "flex flex-wrap gap-2",
        align === "center" ? "justify-center" : "justify-start",
        className,
      )}
    >
      {badges.map((badge) => (
        <HoverTooltip key={badge.type} content={badge.description} className="inline-flex">
          <div
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm",
              iconOnly
                ? compact
                  ? "h-7 w-7 justify-center p-0 text-[9px]"
                  : "h-8 w-8 justify-center p-0 text-[10px]"
                : compact
                  ? "px-2.5 py-1 text-[9px]"
                  : "px-3 py-1.5 text-[10px]",
              compact ? "tracking-[0.12em]" : "tracking-[0.16em]",
              playerTypeBadgeStyleClass[badge.type],
            )}
          >
            {renderPlayerTypeBadgeIcon(badge.type, compact)}
            {iconOnly ? null : <span className="font-semibold uppercase leading-none">{badge.label}</span>}
          </div>
        </HoverTooltip>
      ))}
    </div>
  );
};
