import clsx from "clsx";
import { GripHorizontal } from "lucide-react";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { PlayerTypeBadges } from "./PlayerTypeBadges";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import type { PlayerTypeBadgeDefinition } from "../lib/playerTypeBadges";
import { LegacyPlayerTier, Player, PlayerTier } from "../types";

type LabRarity = PlayerTier | LegacyPlayerTier | "Pink Smoke" | "Neon Paint" | "Black/Gold Marble";

const runRosterSurfaceStyles: Record<LabRarity, string> = {
  S: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.24),transparent_34%),linear-gradient(135deg,rgba(251,191,36,0.1),transparent_46%,rgba(249,115,22,0.12))]",
  A: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_34%),linear-gradient(135deg,rgba(56,189,248,0.08),transparent_46%,rgba(59,130,246,0.12))]",
  B: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.2),transparent_34%),linear-gradient(135deg,rgba(168,85,247,0.08),transparent_46%,rgba(79,70,229,0.12))]",
  C: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_34%),linear-gradient(135deg,rgba(16,185,129,0.08),transparent_46%,rgba(6,182,212,0.1))]",
  D: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.18),transparent_32%),linear-gradient(135deg,rgba(127,29,29,0.16),transparent_46%,rgba(68,64,60,0.16))]",
  Galaxy:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.7)),url('https://4kwallpapers.com/images/wallpapers/galaxy-milky-way-stars-deep-space-colorful-astronomy-nebula-2880x1800-5366.jpg')] before:bg-cover before:bg-center",
  "Pink Smoke":
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(24,4,22,0.16),rgba(24,4,22,0.64)),url('https://california-wallpaper.com/cdn/shop/products/il_fullxfull.3329965225_tq31.jpg?v=1657242849&width=1080')] before:bg-cover before:bg-center",
  "Neon Paint":
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(4,10,24,0.12),rgba(4,10,24,0.62)),url('https://4kwallpapers.com/images/wallpapers/abstract-art-3840x2160-23159.jpg')] before:bg-cover before:bg-center",
  "Black/Gold Marble":
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(8,6,2,0.12),rgba(8,6,2,0.66)),url('https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI1LTA3L3Jhd3BpeGVsb2ZmaWNlOF9ibGFja19tYXJibGVfdGV4dHVyZV93YWxscGFwZXJfZGFya192ZWluZWRfc3Rvbl83ODVlZTg4NC02MDQ4LTQ5NDYtYWY0My1mODljZGU2YmYwZTlfMS5qcGc.jpg')] before:bg-cover before:bg-center",
  Amethyst:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(18,6,34,0.12),rgba(18,6,34,0.64)),url('https://wallpapercat.com/w/full/0/9/a/2306286-2500x1149-desktop-dual-monitors-amethyst-wallpaper.jpg')] before:bg-cover before:bg-center",
  Emerald:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(4,20,14,0.12),rgba(4,20,14,0.64)),url('https://img.pikbest.com/origin/10/12/95/17TpIkbEsTGgn.jpg!w700wp')] before:bg-cover before:bg-center",
  Ruby:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(34,6,10,0.12),rgba(34,6,10,0.64)),url('https://images2.alphacoders.com/134/1340326.png')] before:bg-cover before:bg-center",
  Sapphire:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(5,16,36,0.12),rgba(5,16,36,0.64)),url('https://img.freepik.com/free-photo/close-up-glitter-decoration-detail_23-2149048284.jpg')] before:bg-cover before:bg-center",
};

interface CardLabRunRosterCardProps {
  player: Player;
  rarityOverride: LabRarity;
  draftedPlayerIds?: string[];
  playerTypeBadgesOverride?: PlayerTypeBadgeDefinition[];
  playerTypeBadgeCountOverride?: number;
}

export const CardLabRunRosterCard = ({
  player,
  rarityOverride,
  draftedPlayerIds = [],
  playerTypeBadgesOverride,
  playerTypeBadgeCountOverride,
}: CardLabRunRosterCardProps) => {
  const imageUrl = usePlayerImage(player);
  const naturalPositions = [player.primaryPosition, ...player.secondaryPositions].join(" / ");

  return (
    <div className="inline-block w-fit max-w-full rounded-[30px] border border-dashed border-white/45 p-1">
      <div
        className={clsx(
          "relative overflow-hidden rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(28,30,36,0.96),rgba(22,24,31,0.98))] px-2.5 py-2.5 shadow-[0_20px_48px_rgba(0,0,0,0.28)]",
          runRosterSurfaceStyles[rarityOverride],
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.14)_60%,rgba(2,6,23,0.36))]" />
        <div className="relative flex items-center gap-2.5">
          <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-black/25">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={player.name}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-200">
                {player.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex flex-col rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.68),rgba(4,8,18,0.84))] px-3 py-2 shadow-[0_12px_26px_rgba(0,0,0,0.28)] backdrop-blur-[4px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {player.primaryPosition}
            </div>
            <div
              className={clsx(
                "mt-0.5 truncate font-display font-semibold leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]",
                player.name.length >= 28
                  ? "text-[1.05rem]"
                  : player.name.length >= 22
                    ? "text-[1.18rem]"
                    : "text-[1.36rem]",
              )}
            >
              {player.name}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
              {naturalPositions}
            </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex min-w-[142px] flex-col items-start justify-center gap-1 rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.66),rgba(4,8,18,0.82))] px-2.5 py-2 shadow-[0_12px_26px_rgba(0,0,0,0.26)] backdrop-blur-[4px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <PlayerTypeBadges
                  player={player}
                  compact
                  iconOnly
                  className="justify-start"
                  align="center"
                  badgesOverride={playerTypeBadgesOverride}
                  limit={Math.max(1, playerTypeBadgeCountOverride ?? 1)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <PlayerSynergyBadges
                  playerId={player.id}
                  draftedPlayerIds={draftedPlayerIds}
                  compact
                  dense
                  align="center"
                  excludeTypes={["dynamic-duo"]}
                />
              </div>
            </div>

            <div className="flex min-w-[60px] flex-col items-center justify-center rounded-[18px] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.68),rgba(4,8,18,0.84))] px-2.5 py-2 text-center shadow-[0_12px_26px_rgba(0,0,0,0.26)] backdrop-blur-[4px]">
              <div className="font-display text-[1.75rem] font-semibold leading-none text-white">{player.overall}</div>
              <div className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">OVR</div>
            </div>

            <div className="flex h-7 w-7 items-center justify-center">
              <GripHorizontal size={16} className="text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
