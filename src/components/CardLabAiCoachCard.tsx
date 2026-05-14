import type { CardLabCoachPreviewCard } from "../lib/cardLab";

export const AI_COACH_CARD_WIDTH = 1024;
export const AI_COACH_CARD_HEIGHT = 1536;

interface CardLabAiCoachCardProps {
  coach: CardLabCoachPreviewCard;
  scale?: number;
}

export const CardLabAiCoachCard = ({ coach, scale = 1 }: CardLabAiCoachCardProps) => (
  <div
    className="relative overflow-hidden rounded-[22px] bg-black shadow-[0_24px_54px_rgba(0,0,0,0.48)]"
    style={{
      width: `${AI_COACH_CARD_WIDTH * scale}px`,
      height: `${AI_COACH_CARD_HEIGHT * scale}px`,
    }}
  >
    <img
      src={`/ai-card-art/coaches/generated/${coach.id}.png`}
      alt={`${coach.label} AI coach card`}
      className="h-full w-full object-cover"
      loading="lazy"
      draggable={false}
    />
  </div>
);
