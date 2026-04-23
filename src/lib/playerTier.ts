import { LegacyPlayerTier, Player, PlayerTier, StoredPlayerTier } from "../types";

export const legacyTierToPlayerTier: Record<LegacyPlayerTier, PlayerTier> = {
  S: "Galaxy",
  A: "Amethyst",
  B: "Ruby",
  C: "Sapphire",
  D: "Emerald",
};

export const playerTierToLegacyTier: Record<PlayerTier, LegacyPlayerTier> = {
  Galaxy: "S",
  Amethyst: "A",
  Ruby: "B",
  Sapphire: "C",
  Emerald: "D",
};

export const playerTierOrder: PlayerTier[] = [
  "Galaxy",
  "Amethyst",
  "Ruby",
  "Sapphire",
  "Emerald",
];

export const isLegacyPlayerTier = (tier: string): tier is LegacyPlayerTier =>
  tier in legacyTierToPlayerTier;

export const normalizePlayerTier = (tier: StoredPlayerTier): PlayerTier =>
  isLegacyPlayerTier(tier) ? legacyTierToPlayerTier[tier] : tier;

export const getTierFromOverall = (overall: number): PlayerTier => {
  if (overall >= 96) return "Galaxy";
  if (overall >= 91) return "Amethyst";
  if (overall >= 86) return "Ruby";
  if (overall >= 80) return "Sapphire";
  return "Emerald";
};

export const getPlayerTier = (player: Pick<Player, "overall" | "hallOfFameTier">): PlayerTier =>
  normalizePlayerTier(player.hallOfFameTier ?? getTierFromOverall(player.overall));

export const getPlayerTierLabelFromTier = (tier: StoredPlayerTier) =>
  normalizePlayerTier(tier);

export const getPlayerTierLabel = (player: Pick<Player, "overall" | "hallOfFameTier">) =>
  getPlayerTierLabelFromTier(getPlayerTier(player));

export const playerTierCardStyles: Record<PlayerTier, string> = {
  Galaxy:
    "border-fuchsia-200/35 shadow-[0_22px_50px_rgba(168,85,247,0.24)]",
  Amethyst:
    "border-violet-200/38 shadow-[0_22px_50px_rgba(192,132,252,0.26)]",
  Ruby:
    "border-rose-200/38 shadow-[0_22px_50px_rgba(251,113,133,0.26)]",
  Sapphire:
    "border-sky-200/38 shadow-[0_22px_50px_rgba(56,189,248,0.26)]",
  Emerald:
    "border-emerald-200/38 shadow-[0_22px_50px_rgba(52,211,153,0.26)]",
};

export const playerTierSurfaceStyles: Record<PlayerTier, string> = {
  Galaxy:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.72)),url('https://4kwallpapers.com/images/wallpapers/galaxy-milky-way-stars-deep-space-colorful-astronomy-nebula-2880x1800-5366.jpg')] before:bg-cover before:bg-center",
  Amethyst:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(18,6,34,0.12),rgba(18,6,34,0.64)),url('https://wallpapercat.com/w/full/0/9/a/2306286-2500x1149-desktop-dual-monitors-amethyst-wallpaper.jpg')] before:bg-cover before:bg-center",
  Ruby:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(34,6,10,0.12),rgba(34,6,10,0.64)),url('https://images2.alphacoders.com/134/1340326.png')] before:bg-cover before:bg-center",
  Sapphire:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(5,16,36,0.12),rgba(5,16,36,0.64)),url('https://img.freepik.com/free-photo/close-up-glitter-decoration-detail_23-2149048284.jpg')] before:bg-cover before:bg-center",
  Emerald:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(4,20,14,0.12),rgba(4,20,14,0.64)),url('https://img.pikbest.com/origin/10/12/95/17TpIkbEsTGgn.jpg!w700wp')] before:bg-cover before:bg-center",
};

export const playerTierRunRosterSurfaceStyles: Record<PlayerTier, string> = {
  Galaxy:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.7)),url('https://4kwallpapers.com/images/wallpapers/galaxy-milky-way-stars-deep-space-colorful-astronomy-nebula-2880x1800-5366.jpg')] before:bg-cover before:bg-center",
  Amethyst:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(18,6,34,0.12),rgba(18,6,34,0.64)),url('https://wallpapercat.com/w/full/0/9/a/2306286-2500x1149-desktop-dual-monitors-amethyst-wallpaper.jpg')] before:bg-cover before:bg-center",
  Ruby:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(34,6,10,0.12),rgba(34,6,10,0.64)),url('https://images2.alphacoders.com/134/1340326.png')] before:bg-cover before:bg-center",
  Sapphire:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(5,16,36,0.12),rgba(5,16,36,0.64)),url('https://img.freepik.com/free-photo/close-up-glitter-decoration-detail_23-2149048284.jpg')] before:bg-cover before:bg-center",
  Emerald:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(4,20,14,0.12),rgba(4,20,14,0.64)),url('https://img.pikbest.com/origin/10/12/95/17TpIkbEsTGgn.jpg!w700wp')] before:bg-cover before:bg-center",
};
