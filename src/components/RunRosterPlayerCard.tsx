import type { CSSProperties } from "react";
import clsx from "clsx";
import { GripHorizontal, Handshake } from "lucide-react";
import { getNbaTeamByName } from "../data/nbaTeams";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { getPlayerDisplayLines } from "../lib/playerDisplay";
import type { PlayerTypeBadgeDefinition } from "../lib/playerTypeBadges";
import { getPlayerTier, playerTierRunRosterSurfaceStyles } from "../lib/playerTier";
import { isSameTeamChemistryActiveForPlayer } from "../lib/teamChemistry";
import { Player } from "../types";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { PlayerTypeBadges } from "./PlayerTypeBadges";

const runRosterScaleVar = "--run-roster-scale";
const emptyRunRosterSurfaceStyle =
  "before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(38,42,50,0.92),rgba(18,21,28,0.98))]";
const activeTeamChemLogoClassName =
  "border-emerald-200/90 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.4),rgba(16,185,129,0.26)_52%,rgba(6,78,59,0.9)_100%)] shadow-[0_0_0_1px_rgba(74,222,128,0.55),0_0_20px_rgba(52,211,153,0.45),0_0_40px_rgba(16,185,129,0.28)]";

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
  badgesOverride?: PlayerTypeBadgeDefinition[];
  showHandle?: boolean;
  className?: string;
  scale?: number;
  enableTeamChemistry?: boolean;
  coachConnectionActive?: boolean;
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
  badgesOverride,
  showHandle = false,
  className,
  scale = 1,
  enableTeamChemistry = false,
  coachConnectionActive = false,
}: RunRosterPlayerCardProps) => {
  const resolvedPlayer = displayPlayer ?? player ?? null;
  const imageUrl = player ? usePlayerImage(player) : null;
  const team = resolvedPlayer ? getNbaTeamByName(resolvedPlayer.teamLabel) : null;
  const naturalPositions = resolvedPlayer
    ? [resolvedPlayer.primaryPosition, ...resolvedPlayer.secondaryPositions].join(" / ")
    : "";
  const tier = resolvedPlayer ? getPlayerTier(resolvedPlayer) : null;
  const { firstNameLine, lastNameLine } = resolvedPlayer
    ? getPlayerDisplayLines(resolvedPlayer)
    : { firstNameLine: "", lastNameLine: "" };
  const name = resolvedPlayer ? [firstNameLine, lastNameLine].filter(Boolean).join(" ") : "Open Slot";
  const overallValue = overallOverride ?? resolvedPlayer?.overall ?? "--";
  const sameTeamChemistryActive =
    enableTeamChemistry && resolvedPlayer
      ? isSameTeamChemistryActiveForPlayer(resolvedPlayer, draftedPlayerIds)
      : false;
  const nameClassName =
    name.length >= 30
      ? "text-[calc(9px*var(--run-roster-scale))]"
      : name.length >= 26
        ? "text-[calc(10px*var(--run-roster-scale))]"
      : name.length >= 22
          ? "text-[calc(11.2px*var(--run-roster-scale))]"
        : name.length >= 18
          ? "text-[calc(12.8px*var(--run-roster-scale))]"
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
          <div className="h-[calc(64px*var(--run-roster-scale))] w-[calc(64px*var(--run-roster-scale))] shrink-0 overflow-hidden rounded-[calc(18px*var(--run-roster-scale))] border border-white/10 bg-black/25">
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

          <div className="min-w-[calc(120px*var(--run-roster-scale))] flex-[0_1_auto]">
            <div className="flex w-fit min-w-[calc(150px*var(--run-roster-scale))] max-w-[calc(300px*var(--run-roster-scale))] flex-col rounded-[calc(18px*var(--run-roster-scale))] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.68),rgba(4,8,18,0.84))] px-[calc(10px*var(--run-roster-scale))] py-[calc(8px*var(--run-roster-scale))] shadow-[0_12px_26px_rgba(0,0,0,0.28)] backdrop-blur-[4px]">
              <div className="flex min-w-0 flex-wrap items-center gap-[calc(6px*var(--run-roster-scale))]">
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
                  "mt-0.5 min-w-0 overflow-hidden whitespace-nowrap font-display font-semibold leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]",
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

          <div className="flex min-w-0 shrink items-center gap-[calc(8px*var(--run-roster-scale))]">
            {team?.logo ? (
              <div
                className={clsx(
                  "flex h-[calc(52px*var(--run-roster-scale))] w-[calc(52px*var(--run-roster-scale))] shrink-0 items-center justify-center rounded-[calc(16px*var(--run-roster-scale))] border p-[calc(8px*var(--run-roster-scale))] shadow-[0_12px_26px_rgba(0,0,0,0.24)] backdrop-blur-[4px]",
                  sameTeamChemistryActive
                    ? activeTeamChemLogoClassName
                    : "border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.66),rgba(4,8,18,0.82))]",
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

            <div className="flex min-w-[calc(116px*var(--run-roster-scale))] max-w-[calc(176px*var(--run-roster-scale))] shrink flex-col items-start justify-center gap-[calc(6px*var(--run-roster-scale))] rounded-[calc(18px*var(--run-roster-scale))] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.66),rgba(4,8,18,0.82))] px-[calc(8px*var(--run-roster-scale))] py-[calc(8px*var(--run-roster-scale))] shadow-[0_12px_26px_rgba(0,0,0,0.26)] backdrop-blur-[4px]">
              {player ? (
                <>
                  <div className="flex max-w-full flex-wrap items-center gap-[calc(6px*var(--run-roster-scale))]">
                    <PlayerTypeBadges
                      player={resolvedPlayer ?? player}
                      badgesOverride={badgesOverride}
                      compact
                      iconOnly
                      className="justify-start"
                      align="center"
                    />
                    <PlayerSynergyBadges
                      playerId={player.id}
                      draftedPlayerIds={draftedPlayerIds}
                      compact
                      dense
                      align="center"
                      className="justify-start"
                      previewEligible={false}
                    />
                    {coachConnectionActive ? (
                      <div
                        title="Coach Link active: player matches the coach's associated team"
                        className="inline-flex h-[calc(28px*var(--run-roster-scale))] w-[calc(28px*var(--run-roster-scale))] items-center justify-center rounded-full border border-lime-300/70 bg-lime-300/18 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.45)]"
                      >
                        <Handshake size={13 * scale} strokeWidth={2.3} />
                      </div>
                    ) : null}
                  </div>
                  {metricChips.length > 0 ? (
                    <div className="flex max-w-[calc(124px*var(--run-roster-scale))] flex-wrap items-center gap-[calc(6px*var(--run-roster-scale))]">
                      {metricChips.map((chip) => (
                        <div
                          key={`${chip.label}-${chip.value}`}
                          className={clsx(
                            "rounded-full border px-[calc(8px*var(--run-roster-scale))] py-[calc(3px*var(--run-roster-scale))] text-[calc(9px*var(--run-roster-scale))] font-semibold uppercase tracking-[0.14em]",
                            chip.toneClassName ?? "border-sky-200/14 bg-sky-300/10 text-sky-100",
                          )}
                        >
                          {chip.value} {chip.label}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Empty
                </div>
              )}
            </div>

            <div className="flex min-w-[calc(60px*var(--run-roster-scale))] flex-col items-center justify-center rounded-[calc(18px*var(--run-roster-scale))] border border-white/12 bg-[linear-gradient(180deg,rgba(4,8,18,0.68),rgba(4,8,18,0.84))] px-[calc(8px*var(--run-roster-scale))] py-[calc(8px*var(--run-roster-scale))] text-center shadow-[0_12px_26px_rgba(0,0,0,0.26)] backdrop-blur-[4px]">
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
