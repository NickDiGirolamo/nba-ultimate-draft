import clsx from "clsx";
import { Sparkles, Star } from "lucide-react";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { DraftChemistrySnapshot, Player, RosterSlot } from "../types";

interface RosterSidebarProps {
  roster: RosterSlot[];
  teamAverage: number;
  draftChemistry: DraftChemistrySnapshot;
  lastFilledSlot: string | null;
  selectedSlotIndex: number | null;
  bonusPickActive?: boolean;
  onSlotClick: (index: number) => void;
}

const findBestPlayer = (roster: RosterSlot[]) => {
  const players = roster.map((slot) => slot.player).filter(Boolean) as Player[];
  return players.slice().sort((a, b) => b.overall - a.overall)[0] ?? null;
};

export const RosterSidebar = ({
  roster,
  teamAverage,
  draftChemistry,
  lastFilledSlot,
  selectedSlotIndex,
  bonusPickActive = false,
  onSlotClick,
}: RosterSidebarProps) => {
  const bestPlayer = findBestPlayer(roster);
  const draftedPlayerIds = roster
    .map((slot) => slot.player?.id)
    .filter((playerId): playerId is string => Boolean(playerId));
  const positions = roster
    .map((slot) => slot.player?.primaryPosition)
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, position) => {
      acc[position!] = (acc[position!] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <aside className="glass-panel rounded-[24px] p-4 shadow-card sm:rounded-[28px] sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Current Roster</p>
          <h3 className="mt-2 font-display text-2xl text-white">Lineup Board</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 xl:min-w-[210px]">
          <div className="rounded-2xl border border-white/12 bg-white/6 px-3 py-3 text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Avg OVR</div>
            <div className="mt-1 font-display text-[1.7rem] leading-none text-white">{teamAverage || "--"}</div>
          </div>
          <div className="rounded-2xl border border-emerald-300/16 bg-emerald-300/10 px-3 py-3 text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100/75">
              <Sparkles size={12} />
              Chemistry
            </div>
            <div className="mt-1 font-display text-[1.7rem] leading-none text-white">{draftChemistry.score}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-emerald-100/70">
              Starts at 0
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {roster.map((slot, index) => (
          <RosterSlotButton
            key={`${slot.label}-${index}`}
            slot={slot}
            index={index}
            lastFilledSlot={lastFilledSlot}
            selectedSlotIndex={selectedSlotIndex}
            onSlotClick={onSlotClick}
            draftedPlayerIds={draftedPlayerIds}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-2xl border border-emerald-300/16 bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(2,6,23,0.18))] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-emerald-100/75">
            <Sparkles size={14} />
            Live Chemistry
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full border border-white/10 bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-lime-200 to-cyan-300 transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, draftChemistry.score))}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/8 bg-black/18 px-2 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Badges</div>
              <div className="mt-1 text-base font-semibold text-white">{draftChemistry.activeBadgeCount}</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/18 px-2 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Slot Fit</div>
              <div className="mt-1 text-base font-semibold text-white">{draftChemistry.slotFitRate}%</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-black/18 px-2 py-2">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Natural</div>
              <div className="mt-1 text-base font-semibold text-white">
                {draftChemistry.draftedCount > 0
                  ? `${draftChemistry.naturalSlotMatches}/${draftChemistry.draftedCount}`
                  : "--"}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs leading-5 text-slate-300">
            Chemistry rises as you draft players into sensible roles, activate badge links, and keep a balanced mix of player types.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-400">
            <Star size={14} />
            Best Player
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{bestPlayer?.name ?? "Not drafted yet"}</div>
          <div className="text-sm text-slate-300">{bestPlayer ? `${bestPlayer.primaryPosition} • ${bestPlayer.overall} OVR` : "Make your first pick"}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Position Mix</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(positions).length > 0 ? (
              Object.entries(positions).map(([position, count]) => (
                <span key={position} className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-slate-200">
                  {position} x{count}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">No distribution yet</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Lineup Control</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {bonusPickActive
              ? "Select the roster slot you want to replace, then choose one of the 5 bonus players from the extra board."
              : "Tap any drafted player, then tap any other slot to move or swap them. You can place any drafted player anywhere before the sim."}
          </div>
        </div>
      </div>
    </aside>
  );
};

interface RosterSlotButtonProps {
  slot: RosterSlot;
  index: number;
  lastFilledSlot: string | null;
  selectedSlotIndex: number | null;
  onSlotClick: (index: number) => void;
  draftedPlayerIds: string[];
}

const RosterSlotButton = ({
  slot,
  index,
  lastFilledSlot,
  selectedSlotIndex,
  onSlotClick,
  draftedPlayerIds,
}: RosterSlotButtonProps) => {
  return (
    <button
      type="button"
      onClick={() => onSlotClick(index)}
      className={clsx(
        "w-full rounded-2xl border p-3 text-left transition duration-300 sm:p-3.5",
        slot.player
          ? "border-amber-200/16 bg-[linear-gradient(180deg,rgba(104,60,24,0.38),rgba(38,22,13,0.78))]"
          : "border-dashed border-white/12 bg-black/12",
        lastFilledSlot === slot.slot && "border-sky-300/50 bg-sky-400/10 shadow-glow",
        selectedSlotIndex === index &&
          "border-amber-300/60 bg-amber-300/10 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {slot.player ? (
            <RosterThumbnail player={slot.player} />
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-xl border border-dashed border-white/12 bg-black/18" />
          )}

          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              {slot.slot}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="min-w-0 text-sm font-medium leading-5 text-white">
                {slot.player?.name ?? slot.label}
              </div>
              {slot.player ? (
                <PlayerSynergyBadges
                  playerId={slot.player.id}
                  draftedPlayerIds={draftedPlayerIds}
                  compact
                  align="start"
                  className="shrink-0"
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs text-slate-400">
            {slot.player?.primaryPosition ?? "Open"}
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            {slot.player?.overall ?? "--"}
          </div>
        </div>
      </div>
    </button>
  );
};

const RosterThumbnail = ({ player }: { player: Player }) => {
  const imageUrl = usePlayerImage(player);

  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/14 bg-black/20">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={player.name}
          className="h-full w-full object-cover object-top"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-200">
          {player.name
            .split(" ")
            .slice(0, 2)
            .map((part) => part[0])
            .join("")}
        </div>
      )}
    </div>
  );
};
