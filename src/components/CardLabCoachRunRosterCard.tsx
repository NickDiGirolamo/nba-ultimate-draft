import { CardHoloOverlay, type CardHoloVariant } from "./CardHoloOverlay";

const COACH_RUN_ROSTER_CARD_WIDTH = 1536;
const COACH_RUN_ROSTER_CARD_HEIGHT = 192;

const getAiCoachRunRosterImageUrl = (coachId: string) => `/ai-card-art/coaches/run-roster/${coachId}.png`;

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
  const coachRunRosterImageUrl = getAiCoachRunRosterImageUrl(coach.id);
  const boostLabel =
    typeof boostedCount === "number" && typeof rosterCount === "number"
      ? `${boostedCount}/${rosterCount} boosted`
      : "Team Boost";

  return (
    <div
      className="relative block w-full max-w-full overflow-hidden rounded-[20px] bg-black shadow-[0_16px_34px_rgba(0,0,0,0.34)]"
      style={{ aspectRatio: `${COACH_RUN_ROSTER_CARD_WIDTH} / ${COACH_RUN_ROSTER_CARD_HEIGHT}` }}
    >
      <div className="absolute inset-0 origin-center scale-[0.972]">
        <img
          src={coachRunRosterImageUrl}
          alt={`${coach.label} run roster coach card`}
          className="absolute inset-0 h-full w-full object-contain"
          loading="lazy"
          draggable={false}
        />
        <div className="absolute right-[4.8%] top-[27%] flex h-[42%] w-[18.8%] items-center justify-center px-[1.2%] text-center text-[clamp(0.48rem,1.55vw,1.08rem)] font-black uppercase leading-[0.96] tracking-[0.08em] text-emerald-50 drop-shadow-[0_2px_8px_rgba(0,0,0,0.72)]">
          {boostLabel}
        </div>
        <CardHoloOverlay enabled={holoOverlay} variant={holoVariant} className="opacity-[0.28]" />
      </div>
    </div>
  );
};
