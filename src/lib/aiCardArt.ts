import type { Player } from "../types";
import { getCachedPlayerImage } from "./playerImages";

export type AiCardArtStatus =
  | "needs-reference"
  | "ready-to-generate"
  | "generated-needs-review"
  | "approved"
  | "needs-regeneration";

export interface AiCardArtRecord {
  playerId: string;
  generatedCutoutUrl?: string;
  status: AiCardArtStatus;
  notes?: string;
}

export const aiCardArtRecords: Record<string, AiCardArtRecord> = {
  "andre-jackson-jr-2025-26": {
    playerId: "andre-jackson-jr-2025-26",
    generatedCutoutUrl: "/ai-card-art/players/andre-jackson-jr-cutout.png",
    status: "generated-needs-review",
    notes: "Reference-driven emerald full-body art. Needs final likeness and uniform review before approval.",
  },
  "adem-bona-2025-26": {
    playerId: "adem-bona-2025-26",
    generatedCutoutUrl: "/ai-card-art/players/adem-bona-cutout.png",
    status: "generated-needs-review",
    notes: "First-pass generated cutout from current player-card reference.",
  },
  "al-horford-2025-26": {
    playerId: "al-horford-2025-26",
    generatedCutoutUrl: "/ai-card-art/players/al-horford-cutout.png",
    status: "generated-needs-review",
    notes: "First-pass generated cutout from current player-card reference.",
  },
  "ben-sheppard-2025-26": {
    playerId: "ben-sheppard-2025-26",
    generatedCutoutUrl: "/ai-card-art/players/ben-sheppard-cutout.png",
    status: "generated-needs-review",
    notes: "First-pass generated cutout from current player-card reference.",
  },
  "bogdan-bogdanovic-2025-26": {
    playerId: "bogdan-bogdanovic-2025-26",
    generatedCutoutUrl: "/ai-card-art/players/bogdan-bogdanovic-cutout.png",
    status: "generated-needs-review",
    notes: "First-pass generated cutout from current player-card reference.",
  },
};

export const aiCardArtStatusLabels: Record<AiCardArtStatus, string> = {
  "needs-reference": "Needs Reference",
  "ready-to-generate": "Ready To Generate",
  "generated-needs-review": "Needs Review",
  approved: "Approved",
  "needs-regeneration": "Needs Regeneration",
};

export const aiCardArtStatusDetails: Record<AiCardArtStatus, string> = {
  "needs-reference": "No usable existing player-card image is available yet.",
  "ready-to-generate": "Existing player-card image is available as the AI likeness reference.",
  "generated-needs-review": "Generated cutout exists and needs likeness, jersey, and card-fit review.",
  approved: "Generated cutout has passed likeness, jersey, and card-fit review.",
  "needs-regeneration": "Generated cutout exists but should be regenerated before use.",
};

export const getAiCardArtRecord = (player: Player): AiCardArtRecord | null =>
  aiCardArtRecords[player.id] ?? null;

export const getAiCardReferenceImage = (player: Player) => getCachedPlayerImage(player);

export const getAiCardGeneratedCutout = (player: Player) =>
  getAiCardArtRecord(player)?.generatedCutoutUrl ?? null;

export const getAiCardArtStatus = (player: Player): AiCardArtStatus => {
  const record = getAiCardArtRecord(player);
  if (record) return record.status;
  return getAiCardReferenceImage(player) ? "ready-to-generate" : "needs-reference";
};
