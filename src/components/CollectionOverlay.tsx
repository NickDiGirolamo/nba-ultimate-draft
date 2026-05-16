import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Search, X } from "lucide-react";
import { allPlayers } from "../data/players";
import { getNbaTeamByName, nbaTeams } from "../data/nbaTeams";
import { getPlayerTier } from "../lib/playerTier";
import { DraftPlayerCard } from "./DraftPlayerCard";
import type { Player, PlayerTier, Position } from "../types";

interface CollectionOverlayProps {
  ownedPlayerIds: string[];
  onClose: () => void;
  starterSlotSelection?: {
    slotNumber: number;
    selectedPlayerIds: string[];
    onConfirm: (playerId: string) => void;
  };
  exchangeSlotSelection?: {
    slotNumber: number;
    selectedPlayerIds: string[];
    onConfirm: (playerId: string) => void;
  };
}

const tierOptions: Array<PlayerTier | "all"> = [
  "all",
  "Emerald",
  "Sapphire",
  "Ruby",
  "Amethyst",
  "Galaxy",
];

const positionOptions: Array<Position | "all"> = ["all", "PG", "SG", "SF", "PF", "C"];
const tierRank: Record<PlayerTier, number> = {
  Emerald: 1,
  Sapphire: 2,
  Ruby: 3,
  Amethyst: 4,
  Galaxy: 5,
};

const getPlayerTeamName = (player: Player) => getNbaTeamByName(player.teamLabel)?.name ?? player.teamLabel;

export const CollectionOverlay = ({
  ownedPlayerIds,
  onClose,
  starterSlotSelection,
  exchangeSlotSelection,
}: CollectionOverlayProps) => {
  const [tierFilter, setTierFilter] = useState<PlayerTier | "all">("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState<Position | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const starterMode = Boolean(starterSlotSelection);
  const exchangeMode = Boolean(exchangeSlotSelection);
  const selectionMode = starterMode || exchangeMode;
  const selectionSlotNumber = starterSlotSelection?.slotNumber ?? exchangeSlotSelection?.slotNumber ?? null;
  const selectedPlayerIdsForMode = starterSlotSelection?.selectedPlayerIds ?? exchangeSlotSelection?.selectedPlayerIds ?? [];
  const selectionConfirm = starterSlotSelection?.onConfirm ?? exchangeSlotSelection?.onConfirm;
  const headerKicker = starterMode
    ? `Starter Slot ${selectionSlotNumber}`
    : exchangeMode
      ? `Exchange Slot ${selectionSlotNumber}`
      : "Collection";
  const headerTitle = starterMode ? "Choose From Collection" : exchangeMode ? "Choose Exchange Card" : "Owned Card Wall";
  const headerDescription = starterMode
    ? "Pick one permanent card you own forever, then add it to this Rogue starter slot."
    : exchangeMode
      ? "Pick one permanent collection card to trade into this exchange recipe."
      : "Permanent cards you own forever from store purchases, packs, and permanent rewards appear here.";
  const closeLabel = starterMode ? "Back to Rogue Starter Page" : exchangeMode ? "Back to Exchange" : "Close";
  const footerKicker = starterMode ? `Starter Slot ${selectionSlotNumber}` : `Exchange Slot ${selectionSlotNumber}`;
  const confirmLabel = starterMode ? "Add to Starter Slot" : "Add to Exchange";
  const unavailableLabel = starterMode ? "Already slotted" : "Already selected";

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    setSelectedPlayerId(null);
  }, [selectionSlotNumber]);

  const ownedPlayerIdSet = useMemo(() => new Set(ownedPlayerIds), [ownedPlayerIds]);
  const ownedPlayers = useMemo(
    () =>
      allPlayers
        .filter((player) => ownedPlayerIdSet.has(player.id))
        .sort(
          (left, right) =>
            tierRank[getPlayerTier(right)] - tierRank[getPlayerTier(left)] ||
            right.overall - left.overall ||
            left.name.localeCompare(right.name),
        ),
    [ownedPlayerIdSet],
  );

  const teamOptions = useMemo(() => {
    const ownedTeams = new Set(ownedPlayers.map(getPlayerTeamName));
    return nbaTeams.filter((team) => ownedTeams.has(team.name));
  }, [ownedPlayers]);

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return ownedPlayers.filter((player) => {
      if (tierFilter !== "all" && getPlayerTier(player) !== tierFilter) return false;
      if (teamFilter !== "all" && getPlayerTeamName(player) !== teamFilter) return false;
      if (
        positionFilter !== "all" &&
        player.primaryPosition !== positionFilter &&
        !player.secondaryPositions.includes(positionFilter)
      ) {
        return false;
      }
      if (
        normalizedSearch &&
        !player.name.toLowerCase().includes(normalizedSearch) &&
        !player.teamLabel.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [ownedPlayers, positionFilter, searchTerm, teamFilter, tierFilter]);

  const completionPercent =
    allPlayers.length > 0 ? Math.round((ownedPlayers.length / allPlayers.length) * 100) : 0;
  const selectedPlayer = selectedPlayerId ? ownedPlayers.find((player) => player.id === selectedPlayerId) ?? null : null;
  const unavailableSelectionPlayerIds = new Set(selectedPlayerIdsForMode);

  const overlay = (
    <div data-tutorial-id="collection-overlay" className="fixed inset-0 z-[1000] overflow-y-auto bg-[#030711]/94 px-4 py-5 text-white backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[30px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_34%),linear-gradient(180deg,rgba(12,17,28,0.98),rgba(5,9,17,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">
                {headerKicker}
              </div>
              <h2 className="mt-2 font-display text-4xl text-white">
                {headerTitle}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                {headerDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              <X size={16} />
              {closeLabel}
            </button>
          </div>

          <div data-tutorial-id="collection-summary" className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-cyan-200/16 bg-cyan-300/8 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/68">Cards Owned</div>
              <div className="mt-2 text-3xl font-semibold text-white">{ownedPlayers.length}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Collection Total</div>
              <div className="mt-2 text-3xl font-semibold text-white">{allPlayers.length}</div>
            </div>
            <div className="rounded-[22px] border border-emerald-200/16 bg-emerald-300/8 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/68">Completion</div>
              <div className="mt-2 text-3xl font-semibold text-white">{completionPercent}%</div>
            </div>
          </div>

          <div data-tutorial-id="collection-filters" className="mt-6 rounded-[26px] border border-white/10 bg-black/18 p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(180px,1.15fr)_minmax(160px,0.8fr)_minmax(160px,0.8fr)_minmax(160px,0.8fr)]">
              <label className="relative block">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search cards"
                  className="h-11 w-full rounded-full border border-white/10 bg-white/6 pl-9 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/34 focus:bg-white/10"
                />
              </label>
              <select
                value={tierFilter}
                onChange={(event) => setTierFilter(event.target.value as PlayerTier | "all")}
                className="h-11 rounded-full border border-white/10 bg-[#080d18] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-200/34"
              >
                {tierOptions.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier === "all" ? "All tiers" : tier}
                  </option>
                ))}
              </select>
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="h-11 rounded-full border border-white/10 bg-[#080d18] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-200/34"
              >
                <option value="all">All teams</option>
                {teamOptions.map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
              <select
                value={positionFilter}
                onChange={(event) => setPositionFilter(event.target.value as Position | "all")}
                className="h-11 rounded-full border border-white/10 bg-[#080d18] px-4 text-sm font-semibold text-white outline-none focus:border-cyan-200/34"
              >
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position === "all" ? "All positions" : position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div data-tutorial-id="collection-grid" className="mt-6 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                Showing {filteredPlayers.length} / {ownedPlayers.length}
              </div>
              <button
                type="button"
                onClick={() => {
                  setTierFilter("all");
                  setTeamFilter("all");
                  setPositionFilter("all");
                  setSearchTerm("");
                }}
                className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
              >
                Clear Filters
              </button>
            </div>

            {filteredPlayers.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 justify-items-center gap-x-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredPlayers.map((player) => {
                  const selectedForMode = player.id === selectedPlayerId;
                  const unavailableForMode = selectionMode && unavailableSelectionPlayerIds.has(player.id);

                  return (
                    <div
                      key={player.id}
                      className={clsx(
                        "rounded-[24px] border bg-black/16 p-2 transition",
                        selectedForMode
                          ? "border-amber-200/80 shadow-[0_0_0_1px_rgba(251,191,36,0.55),0_22px_58px_rgba(251,191,36,0.14)]"
                          : unavailableForMode
                            ? "border-white/8 opacity-50"
                            : "border-white/8",
                      )}
                    >
                      <DraftPlayerCard
                        player={player}
                        compact
                        compactScale={0.42}
                        draftedPlayerIds={ownedPlayerIds}
                        actionLabel={selectionMode ? "Select" : "Owned"}
                        selected={selectedForMode}
                        disabled={unavailableForMode}
                        onSelect={selectionMode && !unavailableForMode ? () => setSelectedPlayerId(player.id) : undefined}
                      />
                      {selectionMode ? (
                        <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em]">
                          {unavailableForMode ? (
                            <span className="text-slate-500">{unavailableLabel}</span>
                          ) : selectedForMode ? (
                            <span className="text-amber-100">Selected</span>
                          ) : (
                            <span className="text-slate-400">Click to choose</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={clsx("mt-5 rounded-[24px] border border-white/10 bg-black/20 p-8 text-center")}>
                <div className="font-display text-2xl text-white">No cards match these filters</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Clear a filter or earn more permanent cards to fill this wall.
                </p>
              </div>
            )}

            {selectionMode ? (
              <div className="sticky bottom-4 z-10 mt-6 rounded-[24px] border border-amber-200/24 bg-[linear-gradient(135deg,rgba(35,25,10,0.96),rgba(7,12,22,0.96))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/70">
                      {footerKicker}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">
                      {selectedPlayer ? selectedPlayer.name : "Choose a card above"}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {selectedPlayer ? `${selectedPlayer.overall} OVR / ${getPlayerTier(selectedPlayer)}` : "Select an owned card to unlock the add option."}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!selectedPlayerId}
                    onClick={() => {
                      if (!selectedPlayerId || !selectionConfirm) return;
                      selectionConfirm(selectedPlayerId);
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return overlay;
  }

  return createPortal(overlay, document.body);
};
