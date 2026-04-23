import type { CSSProperties } from "react";
import clsx from "clsx";
import { GripHorizontal } from "lucide-react";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { getPlayerTier, playerTierRunRosterSurfaceStyles } from "../lib/playerTier";
import { Player } from "../types";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { PlayerTypeBadges } from "./PlayerTypeBadges";

const runRosterScaleVar = "--run-roster-scale";
const emptyRunRosterSurfaceStyle =
  "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(38,42,50,0.92),rgba(18,21,28,0.98))]";

interface RunRosterMetricChip {
  label: string;
  value: number | string;
  toneClassName?: string;
}

interface RunRosterPlayerCardProps {
  player?: Player | null;
  displayPlayer?: Player | null;
  draftedPlayerIds?: string[];
  overallOverride?: number;
  eyebrow?: string;
  eyebrowToneClassName?: string;
  metaPills?: string[];
  metricChips?: RunRosterMetricChip[];
  showHandle?: boolean;
  className?: string;
  scale?: number;
}

export const RunRosterPlayerCard = ({
  player,
  displayPlayer,
  draftedPlayerIds = [],
  overallOverride,
  eyebrow,
  eyebrowToneClassName,
  metaPills = [],
  metricChips = [],
  showHandle = false,
  className,
  scale = 1,
}: RunRosterPlayerCardProps) => {
  const resolvedPlayer = displayPlayer ?? player ?? null;
  const imageUrl = player ? usePlayerImage(player) : null;
  const naturalPositions = resolvedPlayer
    ? [resolvedPlayer.primaryPosition, ...resolvedPlayer.secondaryPositions].join(" / ")
    : "";
  const tier = resolvedPlayer ? getPlayerTier(resolvedPlayer) : null;
  const name = resolvedPlayer?.name ?? "Open Slot";
  const overallValue = overallOverride ?? resolvedPlayer?.overall ?? "--";
  const nameClassName =
    name.length >= 28
      ? "text-[calc(13px*var(--run-roster-scale))]"
      : name.length >= 22
        ? "text-[calc(14.5px*var(--run-roster-scale))]"
        : "text-[calc(17px*var(--run-roster-scale))]";
  const cardStyle = {
    [runRosterScaleVar]: scale,
  } as CSSProperties;

  return (
    <div
      className={clsx(
        "block w-full max-w-full rounded-[calc(30px*var(--run-roster-scale))] border border-dashed border-white/45 p-[calc(4px*var(--run-roster-scale))]",
        className,
      )}
      style={cardStyle}
    >
      <div
        className={clsx(
          "relative overflow-hidden rounded-[calc(26px*var(--run-roster-scale))] border border-white/12 bg-[linear-gradient(180deg,rgba(28,30,36,0.96),rgba(22,24,31,0.98))] px-[calc(10px*var(--run-roster-scale))] py-[calc(10px*var(--run-roster-scale))] shadow-[0_20px_48px_rgba(0,0,0,0.28)]",
          tier ? playerTierRunRosterSurfaceStyles[tier] : emptyRunRosterSurfaceStyle,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,transparent,rgba(2,6,23,0.14)_60%,rgba(2,6,23,0.36))]" />
        <div className="relative flex w-full items-center gap-[calc(8px*var(--run-roster-scale))]">
          <div className="h-[calc(56px*var(--run-roster-scale))] w-[calc(56px*var(--run-roster-scale))] shrink-0 overflow-hidden rounded-[calc(16px*var(--run-roster-scale))] border border-white/10 bg-black/25">
            {player && imageUrl ? (
              <img
                src={imageUrl}
                alt={player.name}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[calc(14px*var(--run-roster-scale))] font-semibold text-slate-200">
                {resolvedPlayer?.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("") ?? "?"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex w-full min-w-0 flex-col rounded-[calc(18px*var(--run-roster-scale))] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.68),rgba(4,8,18,0.84))] px-[calc(10px*var(--run-roster-scale))] py-[calc(8px*var(--run-roster-scale))] shadow-[0_12px_26px_rgba(0,0,0,0.28)] backdrop-blur-[4px]">
              <div className="flex flex-wrap items-center gap-[calc(6px*var(--run-roster-scale))]">
                <div className={clsx("text-[calc(11px*var(--run-roster-scale))] font-semibold uppercase tracking-[0.24em] text-slate-400", eyebrowToneClassName)}>
                  {eyebrow ?? resolvedPlayer?.primaryPosition ?? "OPEN"}
                </div>
                {metaPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/10 bg-white/8 px-[calc(8px*var(--run-roster-scale))] py-[calc(2px*var(--run-roster-scale))] text-[calc(9px*var(--run-roster-scale))] font-semibold uppercase tracking-[0.16em] text-slate-200"
                  >
                    {pill}
                  </span>
                ))}
              </div>
              <div
                className={clsx(
                  "mt-1 truncate whitespace-nowrap font-display font-semibold leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]",
                  nameClassName,
                )}
              >
                {name}
              </div>
              {naturalPositions ? (
                <div className="mt-[calc(4px*var(--run-roster-scale))] text-[calc(10px*var(--run-roster-scale))] font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {naturalPositions}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-[calc(12px*var(--run-roster-scale))]">
            <div className="flex min-w-[calc(118px*var(--run-roster-scale))] flex-col items-start justify-center gap-[calc(4px*var(--run-roster-scale))] rounded-[calc(18px*var(--run-roster-scale))] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.66),rgba(4,8,18,0.82))] px-[calc(9px*var(--run-roster-scale))] py-[calc(8px*var(--run-roster-scale))] shadow-[0_12px_26px_rgba(0,0,0,0.26)] backdrop-blur-[4px]">
              {player ? (
                <>
                  <PlayerTypeBadges
                    player={resolvedPlayer ?? player}
                    compact
                    iconOnly
                    limit={1}
                    className="justify-start"
                    align="center"
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    <PlayerSynergyBadges
                      playerId={player.id}
                      draftedPlayerIds={draftedPlayerIds}
                      compact
                      dense
                      align="center"
                      excludeTypes={["dynamic-duo"]}
                      previewEligible={false}
                    />
                  </div>
                </>
              ) : (
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Empty
                </div>
              )}
            </div>

            {metricChips.length > 0 ? (
              <div className="flex max-w-[calc(190px*var(--run-roster-scale))] flex-wrap items-center justify-end gap-[calc(6px*var(--run-roster-scale))]">
                {metricChips.map((chip) => (
                  <div
                    key={`${chip.label}-${chip.value}`}
                    className={clsx(
                      "rounded-full border px-[calc(8px*var(--run-roster-scale))] py-[calc(4px*var(--run-roster-scale))] text-[calc(10px*var(--run-roster-scale))] font-semibold uppercase tracking-[0.14em]",
                      chip.toneClassName ?? "border-sky-200/14 bg-sky-300/10 text-sky-100",
                    )}
                  >
                    {chip.value} {chip.label}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex min-w-[calc(56px*var(--run-roster-scale))] flex-col items-center justify-center rounded-[calc(18px*var(--run-roster-scale))] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.68),rgba(4,8,18,0.84))] px-[calc(8px*var(--run-roster-scale))] py-[calc(8px*var(--run-roster-scale))] text-center shadow-[0_12px_26px_rgba(0,0,0,0.26)] backdrop-blur-[4px]">
              <div className="font-display text-[calc(28px*var(--run-roster-scale))] font-semibold leading-none text-white">{overallValue}</div>
              <div className="mt-[calc(-2px*var(--run-roster-scale))] text-[calc(10px*var(--run-roster-scale))] font-semibold uppercase tracking-[0.18em] text-slate-300">OVR</div>
            </div>

            {showHandle ? (
              <div className="flex h-[calc(28px*var(--run-roster-scale))] w-[calc(28px*var(--run-roster-scale))] items-center justify-center">
                <GripHorizontal size={16 * scale} className="text-slate-500" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
