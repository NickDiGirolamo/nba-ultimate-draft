import { Shield } from "lucide-react";
import { getNbaTeamByName } from "../data/nbaTeams";
import { CardHoloOverlay, type CardHoloVariant } from "./CardHoloOverlay";
import { COACH_CARD_BACKGROUND_IMAGE_URL, getCardLabCoachImageUrl } from "./CardLabCoachCard";

const COACH_RUN_ROSTER_CARD_SCALE = 1.5;
const COACH_RUN_ROSTER_CARD_BASE_HEIGHT = 40;

interface CardLabCoachRunRosterCardProps {
  coach: {
    id: string;
    label: string;
    teamName: string;
    conference: "east" | "west";
  };
  boostedCount?: number;
  rosterCount?: number;
  holoOverlay?: boolean;
  holoVariant?: CardHoloVariant;
}

export const CardLabCoachRunRosterCard = ({
  coach,
  boostedCount,
  rosterCount,
  holoOverlay = false,
  holoVariant = "prism",
}: CardLabCoachRunRosterCardProps) => {
  const team = getNbaTeamByName(coach.teamName);
  const coachImageUrl = getCardLabCoachImageUrl(coach.id);
  const initials = coach.label
    .split(" ")
    .map((segment) => segment.replace(/[^A-Za-z]/g, "").charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="block w-full max-w-full overflow-hidden"
      style={{ height: `${COACH_RUN_ROSTER_CARD_BASE_HEIGHT * COACH_RUN_ROSTER_CARD_SCALE}px` }}
    >
      <div
        style={{
          width: `${100 / COACH_RUN_ROSTER_CARD_SCALE}%`,
          transform: `scale(${COACH_RUN_ROSTER_CARD_SCALE})`,
          transformOrigin: "top left",
        }}
      >
        <div className="block w-full max-w-full overflow-hidden rounded-[18px] border border-dashed border-white/35 p-0.5">
      <div className="relative min-h-[36px] overflow-hidden rounded-[15px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,24,34,0.96),rgba(8,12,20,0.98))] px-2 py-1 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
        <img
          src={COACH_CARD_BACKGROUND_IMAGE_URL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.62] saturate-[0.88] contrast-[1.08]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.62),rgba(3,7,18,0.28)_48%,rgba(3,7,18,0.66)),linear-gradient(180deg,rgba(3,7,18,0.24),rgba(3,7,18,0.58))]" />

        <div className="relative flex min-w-0 items-center gap-2">
          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/16 bg-black/28 shadow-[0_8px_16px_rgba(0,0,0,0.22)]">
            {coachImageUrl ? (
              <img
                src={coachImageUrl}
                alt={coach.label}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-100">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 truncate font-display text-[12px] font-semibold leading-none tracking-normal text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.62)] sm:text-[13px]">
            {coach.label}
          </div>

          {team?.logo ? (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/24 p-1 shadow-[0_8px_16px_rgba(0,0,0,0.2)] backdrop-blur-[3px]">
              <img
                src={team.logo}
                alt={`${team.name} logo`}
                className="h-full w-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/12 bg-black/24 shadow-[0_8px_16px_rgba(0,0,0,0.2)] backdrop-blur-[3px]">
              <Shield size={12} className="text-white/80" />
            </div>
          )}

          {typeof boostedCount === "number" && typeof rosterCount === "number" ? (
            <div className="shrink-0 whitespace-nowrap rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2 py-1 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-emerald-50">
              {boostedCount}/{rosterCount} boosted
            </div>
          ) : null}
        </div>

        <CardHoloOverlay enabled={holoOverlay} variant={holoVariant} className="opacity-[0.32]" />
      </div>
        </div>
      </div>
    </div>
  );
};
