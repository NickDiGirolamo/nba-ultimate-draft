import clsx from "clsx";
import { Shield } from "lucide-react";
import { getPlayerBadgeStates } from "../lib/dynamicDuos";
import { DynamicDuoBadge } from "./DynamicDuoBadge";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { PlayerTypeBadges } from "./PlayerTypeBadges";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { getNbaTeamByName } from "../data/nbaTeams";
import { isSameTeamChemistryPreviewActiveForPlayer } from "../lib/teamChemistry";
import {
  getPlayerTier,
  getPlayerTierLabelFromTier,
  normalizePlayerTier,
  playerTierCardStyles,
  playerTierSurfaceStyles,
} from "../lib/playerTier";
import { LegacyPlayerTier, Player, PlayerTier } from "../types";
import type { PlayerTypeBadgeDefinition } from "../lib/playerTypeBadges";

type CustomLabRarity =
  | "Pink Smoke"
  | "Neon Paint"
  | "Black/Gold Marble";

type LabRarity = PlayerTier | LegacyPlayerTier | CustomLabRarity;

const customLabShellStyles: Record<CustomLabRarity, string> = {
  "Pink Smoke": "border-pink-200/35 shadow-[0_22px_50px_rgba(244,114,182,0.24)]",
  "Neon Paint": "border-cyan-200/35 shadow-[0_22px_50px_rgba(34,211,238,0.28)]",
  "Black/Gold Marble": "border-amber-200/38 shadow-[0_22px_50px_rgba(251,191,36,0.26)]",
};

const customLabSurfaceStyles: Record<CustomLabRarity, string> = {
  "Pink Smoke":
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(24,4,22,0.16),rgba(24,4,22,0.64)),url('https://california-wallpaper.com/cdn/shop/products/il_fullxfull.3329965225_tq31.jpg?v=1657242849&width=1080')] before:bg-cover before:bg-center",
  "Neon Paint":
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(4,10,24,0.12),rgba(4,10,24,0.62)),url('https://4kwallpapers.com/images/wallpapers/abstract-art-3840x2160-23159.jpg')] before:bg-cover before:bg-center",
  "Black/Gold Marble":
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(8,6,2,0.12),rgba(8,6,2,0.66)),url('https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI1LTA3L3Jhd3BpeGVsb2ZmaWNlOF9ibGFja19tYXJibGVfdGV4dHVyZV93YWxscGFwZXJfZGFya192ZWluZWRfc3Rvbl83ODVlZTg4NC02MDQ4LTQ5NDYtYWY0My1mODljZGU2YmYwZTlfMS5qcGc.jpg')] before:bg-cover before:bg-center",
};

const isCustomLabRarity = (rarity: LabRarity): rarity is CustomLabRarity =>
  rarity === "Pink Smoke" || rarity === "Neon Paint" || rarity === "Black/Gold Marble";

const getRarityShellClass = (rarity: LabRarity) =>
  isCustomLabRarity(rarity)
    ? customLabShellStyles[rarity]
    : playerTierCardStyles[normalizePlayerTier(rarity)];

const getRaritySurfaceClass = (rarity: LabRarity) =>
  isCustomLabRarity(rarity)
    ? customLabSurfaceStyles[rarity]
    : playerTierSurfaceStyles[normalizePlayerTier(rarity)];

const getRarityLabel = (rarity: LabRarity) =>
  isCustomLabRarity(rarity) ? rarity : getPlayerTierLabelFromTier(rarity);

const BASE_CARD_WIDTH = 380;
const BASE_CARD_HEIGHT = 920;
const activeTeamChemLogoClassName =
  "border-emerald-200/90 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.4),rgba(16,185,129,0.26)_52%,rgba(6,78,59,0.9)_100%)] shadow-[0_0_0_1px_rgba(74,222,128,0.55),0_0_22px_rgba(52,211,153,0.46),0_0_44px_rgba(16,185,129,0.28)]";

interface DraftPlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  compactScale?: number;
  draftedPlayerIds?: string[];
  actionLabel?: string;
  upgraded?: boolean;
  rarityOverride?: LabRarity;
  playerTypeBadgesOverride?: PlayerTypeBadgeDefinition[];
  playerTypeBadgeCountOverride?: number;
  enableTeamChemistryPreview?: boolean;
}

export const DraftPlayerCard = ({
  player,
  onSelect,
  selected = false,
  disabled = false,
  compact = false,
  compactScale = 0.78,
  draftedPlayerIds = [],
  rarityOverride,
  playerTypeBadgesOverride,
  playerTypeBadgeCountOverride,
  enableTeamChemistryPreview = false,
}: DraftPlayerCardProps) => {
  const imageUrl = usePlayerImage(player);
  const team = getNbaTeamByName(player.teamLabel);
  const rarity = rarityOverride ?? getPlayerTier(player);
  const naturalPositions = [player.primaryPosition, ...player.secondaryPositions].join(" / ");
  const fullName = player.name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const fullNameLength = fullName.length;
  const cardScale = compact ? compactScale : 1;
  const shellWidth = Math.round(BASE_CARD_WIDTH * cardScale);
  const shellHeight = Math.round(BASE_CARD_HEIGHT * cardScale);
  const hasChemistryBadges = getPlayerBadgeStates(player.id, draftedPlayerIds).length > 0;
  const sameTeamChemistryActive =
    enableTeamChemistryPreview &&
    isSameTeamChemistryPreviewActiveForPlayer(player, draftedPlayerIds);
  const previewTeamChemistryBonus =
    sameTeamChemistryActive && !draftedPlayerIds.includes(player.id) ? 1 : 0;
  const displayOverall = player.overall + previewTeamChemistryBonus;
  const nameClassName =
    fullNameLength >= 24
      ? "text-[1rem]"
      : fullNameLength >= 20
        ? "text-[1.16rem]"
        : fullNameLength >= 16
          ? "text-[1.36rem]"
          : "text-[1.7rem]";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(player)}
      disabled={disabled}
      className={clsx(
        "group relative block text-left transition",
        compact ? "w-auto shrink-0" : "w-full",
        disabled ? "cursor-default opacity-70" : "hover:-translate-y-1 hover:scale-[1.01]",
      )}
    >
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: `${shellWidth}px`,
          height: `${shellHeight}px`,
        }}
      >
        <div
          className={clsx(
            "relative min-h-[920px] overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(3,7,18,0.98))] p-5 text-white shadow-[0_24px_56px_rgba(0,0,0,0.34)]",
            getRarityShellClass(rarity),
            getRaritySurfaceClass(rarity),
            selected && "ring-2 ring-sky-300/80",
            "origin-top-left",
          )}
          style={{
            width: `${BASE_CARD_WIDTH}px`,
            minHeight: `${BASE_CARD_HEIGHT}px`,
            transform: `scale(${cardScale})`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.48)_60%,rgba(2,6,23,0.92))]" />
          <div className="absolute inset-[1px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_22%,rgba(255,255,255,0.02)_76%,rgba(2,6,23,0.3))]" />

          <div className="relative flex h-full flex-col">
            <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
              <div className="rounded-[24px] border border-white/12 bg-black/45 px-5 py-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-[2px]">
                <div className="text-center font-display text-[3rem] font-semibold leading-none text-white">{displayOverall}</div>
                <div className="mt-2.5 text-center text-[13px] font-semibold uppercase leading-tight tracking-[0.18em] text-slate-50">
                  {naturalPositions}
                </div>
              </div>

              <div className="flex justify-center pt-1">
                {team?.logo ? (
                  <div
                    className={clsx(
                      "flex h-24 w-24 items-center justify-center rounded-[22px] border p-4 shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition",
                      sameTeamChemistryActive
                        ? activeTeamChemLogoClassName
                        : "border-white/12 bg-black/45",
                    )}
                  >
                    <img
                      src={team.logo}
                      alt={`${team.name} logo`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="rounded-full border border-white/12 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 whitespace-nowrap">
                  {getRarityLabel(rarity)}
                </div>
                {selected ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/28 bg-sky-300/14 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100">
                    <Shield size={12} />
                    Selected
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative mt-4 h-[360px] overflow-hidden rounded-[30px] border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.55),rgba(2,6,23,0.88))]">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={player.name}
                  className="absolute inset-0 h-full w-full origin-top object-cover object-top scale-[1.03]"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.08),transparent_38%,rgba(2,6,23,0.56)_84%)]" />
              <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 text-center">
                <div className="inline-flex justify-center">
                  <div className="relative inline-flex items-center justify-center px-5 py-2.5">
                    <div className="pointer-events-none absolute left-[-16px] right-[-16px] top-[-24px] bottom-[-12px] rounded-[28px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.18)_24%,rgba(0,0,0,0.5)_56%,rgba(0,0,0,0.82)_100%)]" />
                    <div
                      className={clsx(
                        "relative font-display font-semibold leading-none tracking-tight text-white whitespace-nowrap drop-shadow-[0_10px_22px_rgba(0,0,0,0.92)]",
                        nameClassName,
                      )}
                    >
                      {fullName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 px-2 py-2">
              <div className="flex justify-center">
                <div className="inline-flex items-center justify-center rounded-[22px] border border-white/14 bg-[linear-gradient(180deg,rgba(4,8,18,0.78),rgba(4,8,18,0.9))] px-4 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.32)] backdrop-blur-[5px]">
                  <div className="scale-[1.22]">
                    <PlayerTypeBadges
                      player={player}
                      iconOnly
                      className="justify-center"
                      align="center"
                      badgesOverride={playerTypeBadgesOverride}
                      limit={playerTypeBadgeCountOverride}
                    />
                  </div>
                </div>
              </div>
              {hasChemistryBadges ? (
                <div className="mt-4 flex justify-center">
                  <div className="w-full rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.72),rgba(4,8,18,0.9))] px-4 py-4 shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur-[5px]">
                    <div className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Chemistry
                    </div>
                    <div className="mt-3 flex min-h-[74px] flex-wrap items-center justify-center gap-3">
                      <DynamicDuoBadge
                        playerId={player.id}
                        draftedPlayerIds={draftedPlayerIds}
                        featured
                      />
                      <PlayerSynergyBadges
                        playerId={player.id}
                        draftedPlayerIds={draftedPlayerIds}
                        featured
                        align="center"
                        excludeTypes={["dynamic-duo"]}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
