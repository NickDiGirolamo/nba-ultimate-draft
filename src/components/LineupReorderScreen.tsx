import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { GripHorizontal, RotateCcw, Trophy } from "lucide-react";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { getPlayerDisplayLines } from "../lib/playerDisplay";
import { Player, RosterSlot } from "../types";

interface LineupReorderScreenProps {
  roster: RosterSlot[];
  onMovePlayer: (fromIndex: number, toIndex: number) => void;
  onSimulate: () => void;
  onHome: () => void;
}

const starterSlotLayout = [
  { index: 0, top: "21%", left: "50%" },
  { index: 1, top: "39%", left: "84%" },
  { index: 2, top: "39%", left: "16%" },
  { index: 3, top: "77%", left: "69%" },
  { index: 4, top: "77%", left: "31%" },
];

const benchSlotLayout = [
  { index: 5, label: "Backup G" },
  { index: 6, label: "Backup G/F" },
  { index: 7, label: "Backup F/C" },
];

const utilitySlotLayout = [
  { index: 8, label: "Utility 1" },
  { index: 9, label: "Utility 2" },
];

const LineupCard = ({
  slot,
  dragged,
  compact = false,
}: {
  slot: RosterSlot;
  dragged: boolean;
  compact?: boolean;
}) => {
  const player = slot.player;
  const imageUrl = player ? usePlayerImage(player) : null;
  const { firstNameLine, lastNameLine, versionLine } = player
    ? getPlayerDisplayLines(player)
    : { firstNameLine: slot.label, lastNameLine: "", versionLine: "" };
  const naturalPositions = player
    ? [player.primaryPosition, ...player.secondaryPositions].join(" / ")
    : "Open";

  return (
    <div
      className={clsx(
        "relative flex h-full w-full select-none flex-col overflow-hidden rounded-[24px] border border-white/16 bg-[linear-gradient(180deg,rgba(34,24,12,0.88),rgba(12,10,10,0.94))] shadow-[0_18px_44px_rgba(0,0,0,0.38)] transition",
        dragged && "scale-[0.98] opacity-50",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.2),transparent_38%)]" />
      <div className="relative flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="text-sm font-semibold leading-none text-amber-100">
          {player?.overall ?? "--"} <span className="text-[10px] uppercase tracking-[0.18em] text-amber-100/80">OVR</span>
        </div>
        <GripHorizontal size={14} className="text-slate-400" />
      </div>
      <div className="relative flex flex-1 flex-col px-3 pb-3 pt-2">
        <div
          className={clsx(
            "relative overflow-hidden rounded-[18px] border border-white/10 bg-black",
            compact ? "h-20" : "h-28",
          )}
        >
          {player && imageUrl ? (
            <img
              src={imageUrl}
              alt={player.name}
              className={clsx(
                "h-full w-full",
                compact ? "object-contain object-center bg-black" : "object-cover object-top",
              )}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
              Open
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
              {player?.primaryPosition ?? slot.slot}
            </div>
          </div>
        </div>
        <div className={clsx("mt-3", compact ? "min-h-[44px]" : "min-h-[54px]")}>
          <div className={clsx("font-semibold text-white", compact ? "text-[0.82rem] leading-4" : "text-[0.95rem] leading-5")}>
            <div className="whitespace-nowrap">{firstNameLine}</div>
            {lastNameLine ? <div className="whitespace-nowrap">{lastNameLine}</div> : null}
            {versionLine ? <div className="whitespace-nowrap text-[0.8em] text-slate-300">{versionLine}</div> : null}
          </div>
          <div className={clsx("mt-1 text-slate-400", compact ? "text-[11px]" : "text-xs")}>
            {naturalPositions}
          </div>
        </div>
      </div>
    </div>
  );
};

const CourtDropSlot = ({
  slot,
  slotIndex,
  top,
  left,
  isDropTarget,
  isDragging,
  onPointerDown,
}: {
  slot: RosterSlot;
  slotIndex: number;
  top: string;
  left: string;
  isDropTarget: boolean;
  isDragging: boolean;
  onPointerDown: (
    index: number,
    compact: boolean,
    event: React.PointerEvent<HTMLDivElement>,
  ) => void;
}) => (
  <div
    className="absolute w-[20%] min-w-[125px] max-w-[170px] -translate-x-1/2 -translate-y-1/2"
    style={{ top, left }}
  >
    <div className="mb-1 pl-3 pt-2">
      <span className="inline-flex items-center rounded-full border border-white/18 bg-black/72 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[0_8px_18px_rgba(0,0,0,0.38)]">
        {slot.slot}
      </span>
    </div>
    <div
      data-slot-index={slotIndex}
      className={clsx(
        "rounded-[28px] border border-dashed p-2 transition",
        isDropTarget ? "border-amber-300/60 bg-amber-300/10" : "border-white/12 bg-black/15",
      )}
    >
      <div onPointerDown={(event) => onPointerDown(slotIndex, false, event)}>
        <LineupCard slot={slot} dragged={isDragging} />
      </div>
    </div>
  </div>
);

export const LineupReorderScreen = ({
  roster,
  onMovePlayer,
  onSimulate,
  onHome,
}: LineupReorderScreenProps) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dragPointer, setDragPointer] = useState<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    compact: boolean;
  } | null>(null);
  const rosterWithIndex = useMemo(() => roster, [roster]);

  const handlePointerDown = (
    index: number,
    compact: boolean,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!roster[index]?.player) return;
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    setDraggingIndex(index);
    setDropTargetIndex(null);
    setDragPointer({
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      compact,
    });
  };

  useEffect(() => {
    if (draggingIndex === null || dragPointer === null) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousWebkitUserSelect = document.body.style.webkitUserSelect;
    const previousOverflow = document.body.style.overflow;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.style.overflow = "hidden";

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      setDragPointer((current) =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
            }
          : current,
      );

      const hovered = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-slot-index]");
      const nextTarget = hovered?.getAttribute("data-slot-index");
      setDropTargetIndex(nextTarget ? Number(nextTarget) : null);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const hovered = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-slot-index]");
      const nextTarget = hovered?.getAttribute("data-slot-index");
      if (nextTarget) {
        const targetIndex = Number(nextTarget);
        if (targetIndex !== draggingIndex) {
          onMovePlayer(draggingIndex, targetIndex);
        }
      }

      setDraggingIndex(null);
      setDropTargetIndex(null);
      setDragPointer(null);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.webkitUserSelect = previousWebkitUserSelect;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragPointer, draggingIndex, onMovePlayer]);

  return (
    <section className="space-y-6 select-none">
      <div className="grid gap-4 lg:grid-cols-[0.12fr_0.38fr_0.5fr]">
        <button
          type="button"
          onClick={onHome}
          className="glass-panel inline-flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[28px] p-4 text-center shadow-card transition hover:border-amber-200/40 hover:text-amber-100"
        >
          <div className="rounded-full border border-white/12 bg-white/8 p-2">
            <Trophy size={16} className="text-amber-200" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-slate-200">Home</span>
        </button>

        <div className="glass-panel rounded-[28px] p-5 shadow-card">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Lineup Phase</div>
          <h1 className="mt-2 font-display text-3xl text-white">Set Your Rotation</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Drag players into the exact slots you want. Starter positions matter most, the three structured bench roles matter next, and the two utility spots matter least.
          </p>
        </div>

        <div className="glass-panel rounded-[28px] p-5 shadow-card">
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Starters</div>
                <div className="mt-2 text-lg font-semibold text-white">5 Slots</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Bench Core</div>
                <div className="mt-2 text-lg font-semibold text-white">G / G-F / F-C</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Utility</div>
                <div className="mt-2 text-lg font-semibold text-white">2 Flex Slots</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSimulate}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
            >
              <RotateCcw size={18} className="rotate-180" />
              Simulate Season
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-panel rounded-[34px] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Starting Five</div>
              <h2 className="mt-1 font-display text-2xl text-white">Half-Court Board</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">
              Drag cards to reorder
            </div>
          </div>

          <div
            className="lineup-court relative h-[760px] overflow-hidden rounded-[28px] border border-white/10 bg-[#6d3f22]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(7,10,14,0.18), rgba(7,10,14,0.42)), url('https://basketballgoalstore.com/wp-content/uploads/half-court.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_34%)]" />

            {starterSlotLayout.map(({ index, top, left }) => {
              const slot = rosterWithIndex[index];
              return (
                <CourtDropSlot
                  key={slot.label}
                  slot={slot}
                  slotIndex={index}
                  top={top}
                  left={left}
                  isDropTarget={dropTargetIndex === index}
                  isDragging={draggingIndex === index}
                  onPointerDown={handlePointerDown}
                />
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-rows-[1.4fr_0.7fr]">
          <div className="glass-panel rounded-[30px] p-5 shadow-card">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Bench Roles</div>
            <h3 className="mt-1 font-display text-2xl text-white">Primary Reserve Unit</h3>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {benchSlotLayout.map(({ index, label }) => {
                const slot = rosterWithIndex[index];
                return (
                  <div
                    key={label}
                    data-slot-index={index}
                    className={clsx(
                      "rounded-[22px] border border-dashed p-2.5 transition xl:min-h-[355px]",
                      dropTargetIndex === index ? "border-amber-300/60 bg-amber-300/10" : "border-white/12 bg-black/15",
                    )}
                  >
                    <div className="mb-2 text-[9px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
                    <div onPointerDown={(event) => handlePointerDown(index, false, event)}>
                      <LineupCard slot={slot} dragged={draggingIndex === index} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-[30px] p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Utility Slots</div>
                <h3 className="mt-1 font-display text-2xl text-white">Deep Rotation</h3>
              </div>
              <div className="text-xs text-slate-400">Lowest sim weight</div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {utilitySlotLayout.map(({ index, label }) => {
                const slot = rosterWithIndex[index];
                return (
                  <div
                    key={label}
                    data-slot-index={index}
                    className={clsx(
                      "rounded-[22px] border border-dashed p-2.5 transition",
                      dropTargetIndex === index ? "border-amber-300/60 bg-amber-300/10" : "border-white/12 bg-black/15",
                    )}
                  >
                    <div className="mb-2 text-[9px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
                    <div onPointerDown={(event) => handlePointerDown(index, true, event)}>
                      <LineupCard slot={slot} dragged={draggingIndex === index} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {draggingIndex !== null && dragPointer ? (
        <div
          className="pointer-events-none fixed z-[120] select-none touch-none"
          style={{
            left: dragPointer.x - dragPointer.offsetX,
            top: dragPointer.y - dragPointer.offsetY,
            width: dragPointer.compact ? 132 : 170,
            transform: "rotate(-4deg) scale(1.03)",
            filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.45))",
          }}
        >
          <LineupCard
            slot={rosterWithIndex[draggingIndex]}
            dragged={false}
            compact={dragPointer.compact}
          />
        </div>
      ) : null}
    </section>
  );
};
