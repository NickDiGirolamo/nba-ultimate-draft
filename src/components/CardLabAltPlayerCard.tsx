import clsx from "clsx";
import { Shield } from "lucide-react";
import { CardHoloOverlay, type CardHoloVariant } from "./CardHoloOverlay";
import { getPlayerBadgeStates } from "../lib/dynamicDuos";
import { DynamicDuoBadge } from "./DynamicDuoBadge";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { PlayerTypeBadges } from "./PlayerTypeBadges";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { getNbaTeamByName } from "../data/nbaTeams";
import { isCurrentSeasonCard } from "../lib/playerCardLine";
import { getPlayerTierLabelFromTier, normalizePlayerTier, playerTierCardStyles } from "../lib/playerTier";
import type { PlayerTypeBadgeDefinition } from "../lib/playerTypeBadges";
import { LegacyPlayerTier, Player, PlayerTier } from "../types";

type LabRarity = PlayerTier | LegacyPlayerTier | "Pink Smoke" | "Neon Paint" | "Black/Gold Marble";

const tierSurfaceStyles: Record<LabRarity, string> = {
  S: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.3),transparent_34%),linear-gradient(135deg,rgba(251,191,36,0.12),transparent_42%,rgba(249,115,22,0.14))]",
  A: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.24),transparent_34%),linear-gradient(135deg,rgba(56,189,248,0.1),transparent_42%,rgba(59,130,246,0.14))]",
  B: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),transparent_34%),linear-gradient(135deg,rgba(168,85,247,0.1),transparent_42%,rgba(79,70,229,0.14))]",
  C: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.22),transparent_34%),linear-gradient(135deg,rgba(16,185,129,0.1),transparent_42%,rgba(6,182,212,0.12))]",
  D: "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.2),transparent_32%),linear-gradient(135deg,rgba(127,29,29,0.2),transparent_46%,rgba(68,64,60,0.18))]",
  Galaxy:
    "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.72)),url('https://4kwallpapers.com/images/wallpapers/galaxy-milky-way-stars-deep-space-colorful-astronomy-nebula-2880x1800-5366.jpg')] before:bg-cover before:bg-center",
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

const getLabRarityShellClass = (rarity: LabRarity) =>
  rarity === "Galaxy"
    ? "border-fuchsia-200/35 shadow-[0_22px_50px_rgba(168,85,247,0.24)]"
    : rarity === "Pink Smoke"
      ? "border-pink-200/35 shadow-[0_22px_50px_rgba(244,114,182,0.24)]"
      : rarity === "Neon Paint"
        ? "border-cyan-200/35 shadow-[0_22px_50px_rgba(34,211,238,0.28)]"
        : rarity === "Black/Gold Marble"
          ? "border-amber-200/38 shadow-[0_22px_50px_rgba(251,191,36,0.26)]"
          : rarity === "Amethyst"
            ? "border-violet-200/38 shadow-[0_22px_50px_rgba(192,132,252,0.26)]"
            : rarity === "Emerald"
              ? "border-emerald-200/38 shadow-[0_22px_50px_rgba(52,211,153,0.26)]"
              : rarity === "Ruby"
                ? "border-rose-200/38 shadow-[0_22px_50px_rgba(251,113,133,0.26)]"
                : rarity === "Sapphire"
                  ? "border-sky-200/38 shadow-[0_22px_50px_rgba(56,189,248,0.26)]"
    : playerTierCardStyles[normalizePlayerTier(rarity)];

const getLabRarityLabel = (rarity: LabRarity) =>
  rarity === "Pink Smoke" || rarity === "Neon Paint" || rarity === "Black/Gold Marble"
    ? rarity
    : getPlayerTierLabelFromTier(rarity);

interface CardLabAltPlayerCardProps {
  player: Player;
  selected?: boolean;
  upgraded?: boolean;
  compact?: boolean;
  rarityOverride: LabRarity;
  draftedPlayerIds?: string[];
  playerTypeBadgesOverride?: PlayerTypeBadgeDefinition[];
  playerTypeBadgeCountOverride?: number;
  holoOverlay?: boolean;
  holoVariant?: CardHoloVariant;
}

export const CardLabAltPlayerCardV3 = ({
  player,
  selected = false,
  upgraded = false,
  compact = false,
  rarityOverride,
  draftedPlayerIds = [],
  playerTypeBadgesOverride,
  playerTypeBadgeCountOverride,
  holoOverlay = false,
  holoVariant = "prism",
}: CardLabAltPlayerCardProps) => {
  const imageUrl = usePlayerImage(player);
  const team = getNbaTeamByName(player.teamLabel);
  const naturalPositions = [player.primaryPosition, ...player.secondaryPositions].join(" / ");
  const fullName = player.name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const fullNameLength = fullName.length;
  const currentSeasonCard = isCurrentSeasonCard(player);
  const hasChemistryBadges = getPlayerBadgeStates(player.id, draftedPlayerIds).length > 0;
  const boostedHoloBorders = holoOverlay && holoVariant === "frame-soft";
  const nameClassName = compact
    ? fullNameLength >= 24
      ? "text-[0.78rem]"
      : fullNameLength >= 20
        ? "text-[0.88rem]"
        : fullNameLength >= 16
          ? "text-[1rem]"
          : "text-[1.18rem]"
    : fullNameLength >= 24
      ? "text-[1rem]"
      : fullNameLength >= 20
        ? "text-[1.16rem]"
        : fullNameLength >= 16
          ? "text-[1.36rem]"
          : "text-[1.7rem]";

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(3,7,18,0.98))] text-white shadow-[0_24px_56px_rgba(0,0,0,0.34)]",
        compact ? "min-h-[420px] p-4" : "p-5",
        getLabRarityShellClass(rarityOverride),
        tierSurfaceStyles[rarityOverride],
        boostedHoloBorders &&
          "border-white/65 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_18px_50px_rgba(0,0,0,0.34),0_0_24px_rgba(255,0,170,0.16),0_0_32px_rgba(56,189,248,0.14)]",
        selected && "ring-2 ring-sky-300/80",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.48)_60%,rgba(2,6,23,0.92))]" />
      <div
        className={clsx(
          "absolute inset-[1px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_22%,rgba(255,255,255,0.02)_76%,rgba(2,6,23,0.3))]",
          boostedHoloBorders && "border-white/26 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]",
        )}
      />

      <div className="relative flex h-full flex-col">
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
          <div
            className={clsx(
              "rounded-[24px] border border-white/12 bg-slate-950/82 px-4 py-3 shadow-[0_12px_28px_rgba(2,6,23,0.32)]",
              boostedHoloBorders && "border-white/28 shadow-[0_12px_28px_rgba(2,6,23,0.32),0_0_0_1px_rgba(255,255,255,0.08)]",
            )}
          >
            <div className={clsx("font-display font-semibold leading-none text-white", compact ? "text-[2.1rem]" : "text-[3rem]")}>
              {player.overall}
            </div>
            <div className={clsx("mt-2 font-semibold uppercase tracking-[0.22em] text-slate-300", compact ? "text-[10px]" : "text-[11px]")}>
              {naturalPositions}
            </div>
          </div>

          <div className="flex justify-center pt-1">
            {team?.logo ? (
              <div
                className={clsx(
                  "flex items-center justify-center rounded-[22px] border border-white/12 bg-black/45 shadow-[0_12px_28px_rgba(0,0,0,0.16)]",
                  compact ? "h-16 w-16 p-3" : "h-24 w-24 p-4",
                  boostedHoloBorders && "border-white/28 shadow-[0_12px_28px_rgba(0,0,0,0.16),0_0_0_1px_rgba(255,255,255,0.08)]",
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
            <div className={clsx(
              "rounded-full border border-white/12 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200",
              boostedHoloBorders && "border-white/28 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
            )}>
              {getLabRarityLabel(rarityOverride)}
            </div>
            {currentSeasonCard ? (
              <div className={clsx(
                "rounded-full border border-white/12 bg-black/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200",
                boostedHoloBorders && "border-white/28 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
              )}>
                Current
              </div>
            ) : null}
            {selected ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/28 bg-sky-300/14 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100">
                <Shield size={12} />
                Selected
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={clsx(
            "relative mt-4 overflow-hidden rounded-[30px] border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.55),rgba(2,6,23,0.88))]",
            compact ? "h-[190px]" : "h-[360px]",
            boostedHoloBorders && "border-white/26 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
          )}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={player.name}
              className={clsx(
                "absolute inset-0 h-full w-full origin-top",
                compact ? "object-cover object-top scale-[1.05]" : "object-cover object-top scale-[1.03]",
              )}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.08),transparent_38%,rgba(2,6,23,0.56)_84%)]" />
          <div className={clsx("absolute inset-x-0 bottom-0 z-10 text-center", compact ? "px-3 pb-3" : "px-4 pb-4")}>
            <div className="inline-flex justify-center">
              <div className={clsx("relative inline-flex items-center justify-center", compact ? "px-4 py-2" : "px-5 py-2.5")}>
                <div
                  className={clsx(
                    "pointer-events-none absolute left-[-16px] right-[-16px] rounded-[28px]",
                    compact
                      ? "top-[-18px] bottom-[-10px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.14)_28%,rgba(0,0,0,0.42)_58%,rgba(0,0,0,0.72)_100%)]"
                      : "top-[-24px] bottom-[-12px] bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.18)_24%,rgba(0,0,0,0.5)_56%,rgba(0,0,0,0.82)_100%)]",
                  )}
                />
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
          <PlayerTypeBadges
            player={player}
            compact
            iconOnly
            className="justify-center"
            align="center"
            badgesOverride={playerTypeBadgesOverride}
            limit={playerTypeBadgeCountOverride}
          />
          {hasChemistryBadges ? (
            compact ? (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <DynamicDuoBadge playerId={player.id} draftedPlayerIds={draftedPlayerIds} compact dense />
                <PlayerSynergyBadges
                  playerId={player.id}
                  draftedPlayerIds={draftedPlayerIds}
                  compact
                  dense
                  align="center"
                  excludeTypes={["dynamic-duo"]}
                />
              </div>
            ) : (
              <div className="mt-4 flex justify-center">
                <div
                  className={clsx(
                    "w-full rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.72),rgba(4,8,18,0.9))] px-4 py-4 shadow-[0_16px_32px_rgba(0,0,0,0.28)] backdrop-blur-[5px]",
                    boostedHoloBorders && "border-white/26 shadow-[0_16px_32px_rgba(0,0,0,0.28),0_0_0_1px_rgba(255,255,255,0.08)]",
                  )}
                >
                  <div className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Chemistry
                  </div>
                  <div className="mt-3 flex min-h-[74px] flex-wrap items-center justify-center gap-3">
                    <DynamicDuoBadge playerId={player.id} draftedPlayerIds={draftedPlayerIds} featured />
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
            )
          ) : null}
        </div>
      </div>
      <CardHoloOverlay enabled={holoOverlay} variant={holoVariant} />
    </div>
  );
};
