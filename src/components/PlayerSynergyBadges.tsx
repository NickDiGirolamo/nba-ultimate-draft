import clsx from "clsx";
import { Users } from "lucide-react";
import {
  PlayerBadgeType,
  getPlayerBadgeStates,
  getTeamChemistryGroupById,
} from "../lib/dynamicDuos";
import { HoverTooltip } from "./HoverTooltip";

interface PlayerSynergyBadgesProps {
  playerId: string;
  draftedPlayerIds: string[];
  compact?: boolean;
  dense?: boolean;
  featured?: boolean;
  align?: "start" | "center";
  className?: string;
  excludeTypes?: PlayerBadgeType[];
  previewEligible?: boolean;
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

const TeamChemistryIcon = ({ compact = false }: { compact?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={clsx(compact ? "h-4 w-4" : "h-5 w-5")}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9.2" />
    <path d="M7.2 8.2 12 5.8l4.8 2.4m-9.6 0 4.8 3.4 4.8-3.4M12 11.6v6.1m-4.8-9.5v7.1m9.6-7.1v7.1M7.2 15.3l4.8 2.4 4.8-2.4" />
    <circle cx="12" cy="5.8" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="7.2" cy="8.2" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="16.8" cy="8.2" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="7.2" cy="15.3" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="16.8" cy="15.3" r="1.35" fill="currentColor" stroke="none" />
  </svg>
);

const badgeContent = (type: PlayerBadgeType, compact: boolean) => {
  switch (type) {
    case "dynamic-duo":
      return <Users size={compact ? 13 : 15} strokeWidth={2.2} />;
    case "big-3":
      return <BigThreeIcon compact={compact} />;
    case "rival":
      return <RivalIcon compact={compact} />;
    case "role-player":
      return <HexChessIcon piece="P" compact={compact} />;
    case "centerpiece":
      return <HexChessIcon piece="K" compact={compact} />;
    case "team-chemistry":
      return <TeamChemistryIcon compact={compact} />;
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
    case "team-chemistry":
      return "Team Chem";
    default:
      return "Badge";
  }
};

const badgeTooltip = (
  badgeId: string,
  type: PlayerBadgeType,
  title: string,
  players: string[],
  active: boolean,
) => {
  const formatPlayerName = (playerId: string) =>
    playerId
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  if (type === "big-3") {
    const playerList = players.map(formatPlayerName).join(" + ");
    return active
      ? `${title} active: ${playerList}`
      : `${title} requires: ${playerList}`;
  }

  if (type === "role-player" || type === "centerpiece") {
    const playerList = players.map(formatPlayerName).join(" - ");

    if (type === "centerpiece") {
      return `Centerpiece: Role Players - ${playerList}`;
    }

    const centerpieceName = players[1] ? formatPlayerName(players[1]) : "Centerpiece";
    return `Role Player: Linked to ${centerpieceName}`;
  }

  if (type === "dynamic-duo") {
    const playerList = players.map(formatPlayerName).join(" or ");
    return active
      ? `Dynamic Duo active: ${playerList}`
      : `Dynamic Duo available with: ${playerList}`;
  }

  if (type === "team-chemistry") {
    const group = getTeamChemistryGroupById(badgeId);
    const playerList = players.map(formatPlayerName).join(" + ");

    if (!group) {
      return active ? `${title} active` : `${title} available`;
    }

    return active
      ? `${group.nickname} active: ${playerList}. All matching group members gain +${group.bonusValue} overall.`
      : `${group.nickname}: add one more ${group.teamName} (${group.season}) core player to activate +${group.bonusValue} overall for this group.`;
  }

  return active ? `${title} active` : `${title} available`;
};

export const PlayerSynergyBadges = ({
  playerId,
  draftedPlayerIds,
  compact = false,
  dense = false,
  featured = false,
  align = "center",
  className,
  excludeTypes = [],
  previewEligible = true,
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
        <HoverTooltip
          key={definition.id}
          content={badgeTooltip(definition.id, definition.type, definition.title, tooltipPlayers, active)}
          className="inline-flex"
        >
          <div
            className={clsx(
              "inline-flex cursor-help items-center gap-1.5 rounded-full border px-2.5 transition-all duration-300",
              compact
                ? "h-7 text-[10px]"
                : featured
                  ? "min-h-10 px-3.5 text-[12px]"
                  : dense
                    ? "h-7 text-[9px]"
                    : "h-8 text-[11px]",
              active || (previewEligible && previewActive)
                ? "border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
                : "border-white/12 bg-black/30 text-slate-500",
            )}
          >
            {badgeContent(definition.type, compact)}
            {!compact ? (
              <span
                className={clsx(
                  "uppercase",
                  featured
                    ? "font-semibold tracking-[0.12em]"
                    : dense
                      ? "tracking-[0.1em]"
                      : "tracking-[0.16em]",
                )}
              >
                {badgeLabel(definition.type)}
              </span>
            ) : null}
          </div>
        </HoverTooltip>
      ))}
    </div>
  );
};
