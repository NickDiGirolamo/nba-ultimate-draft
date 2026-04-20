import { Player, PlayerTier } from "../types";

export const getTierFromOverall = (overall: number): PlayerTier => {
  if (overall >= 96) return "S";
  if (overall >= 91) return "A";
  if (overall >= 86) return "B";
  if (overall >= 80) return "C";
  return "D";
};

export const getPlayerTier = (player: Pick<Player, "overall" | "hallOfFameTier">): PlayerTier =>
  getTierFromOverall(player.overall);

export const getPlayerTierLabel = (player: Pick<Player, "overall" | "hallOfFameTier">) =>
  `${getPlayerTier(player)}-Tier`;

export const playerTierCardStyles: Record<PlayerTier, string> = {
  S: "from-amber-300/34 via-yellow-100/12 to-orange-500/30 border-amber-300/45 shadow-[0_22px_50px_rgba(251,191,36,0.2)]",
  A: "from-sky-300/28 via-cyan-100/10 to-blue-500/26 border-sky-300/35 shadow-[0_22px_50px_rgba(56,189,248,0.16)]",
  B: "from-violet-300/24 via-fuchsia-100/8 to-indigo-500/22 border-violet-300/28 shadow-[0_22px_50px_rgba(139,92,246,0.14)]",
  C: "from-emerald-300/20 via-teal-100/8 to-cyan-500/18 border-emerald-200/22 shadow-[0_20px_44px_rgba(16,185,129,0.12)]",
  D: "from-rose-950 via-stone-950/96 to-zinc-950 border-rose-200/14 shadow-[0_18px_40px_rgba(15,23,42,0.24)]",
};
