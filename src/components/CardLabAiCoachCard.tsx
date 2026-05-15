import { Handshake } from "lucide-react";
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
      src={`/ai-card-art/coaches/ai-generated/${coach.id}.png`}
      alt={`${coach.label} AI coach card`}
      className="h-full w-full object-cover"
      loading="lazy"
      draggable={false}
    />
    <div
      aria-hidden="true"
      className="absolute left-[3.3%] top-[21.3%] h-[10.8%] w-[14.8%] rounded-[10px] bg-[radial-gradient(circle_at_50%_30%,rgba(8,18,24,0.96),rgba(2,6,12,0.98)_72%)] shadow-[inset_0_0_28px_rgba(0,0,0,0.74)]"
    />
    <div
      aria-hidden="true"
      className="absolute inset-x-[4.4%] bottom-[2.1%] h-[12.8%] rounded-[12px] bg-[linear-gradient(180deg,rgba(4,12,18,0.97),rgba(1,5,9,0.99))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    />
    <div
      aria-label={`${coach.label} coach link icon`}
      title="Coach Link"
      className="absolute bottom-[3.4%] left-1/2 flex aspect-square w-[10.8%] -translate-x-1/2 items-center justify-center rounded-full border-[2px] border-[#d6a642] bg-[radial-gradient(circle_at_50%_35%,rgba(128,255,82,0.24),rgba(5,18,13,0.94)_58%,rgba(1,6,8,0.98))] text-[#dfffbc] shadow-[0_0_24px_rgba(132,255,80,0.34),inset_0_0_18px_rgba(246,211,109,0.16)]"
    >
      <Handshake className="h-[58%] w-[58%] drop-shadow-[0_0_8px_rgba(132,255,80,0.76)]" strokeWidth={2.25} />
    </div>
  </div>
);
