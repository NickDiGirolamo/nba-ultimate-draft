import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Package2, Plus, Sparkles, X } from "lucide-react";
import { allPlayers } from "../data/players";
import { getPlayerTier } from "../lib/playerTier";
import { ROGUE_TOKEN_STORE_PACKS, type RogueTokenStorePack } from "../lib/tokenStore";
import { CollectionOverlay } from "./CollectionOverlay";
import { DraftPlayerCard } from "./DraftPlayerCard";
import type { Player, PlayerTier } from "../types";

interface ExchangeOverlayProps {
  ownedPlayerIds: string[];
  onCompleteExchange: (playerIds: string[], rewardTier: PlayerTier) => Player | null;
  onClose: () => void;
}

const EXCHANGE_SLOT_COUNT = 3;
const EXCHANGE_REWARD_TIER: PlayerTier = "Sapphire";
const PACK_OPENING_FINISH_DELAY_MS = 5_650;
const packWidth = 318;
const packHeight = 636;

type ExchangePackStage = "ready" | "opening";

const formatPlayerMeta = (player: Player) =>
  `${player.overall} OVR / ${getPlayerTier(player)} / ${player.primaryPosition}${
    player.secondaryPositions.length ? `-${player.secondaryPositions.join("-")}` : ""
  }`;

const ExchangePackVisual = ({ pack, scale = 0.62 }: { pack: RogueTokenStorePack; scale?: number }) => (
  <div
    className="pointer-events-none relative mx-auto"
    style={{
      width: `${packWidth * scale}px`,
      height: `${packHeight * scale}px`,
    }}
  >
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <div className={`relative h-[636px] w-[318px] overflow-hidden rounded-[8px] ${pack.shadowClass}`}>
        <img
          src={pack.wrapperImage}
          alt={`${pack.name} foil wrapper base`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${pack.tintClass} mix-blend-color`} />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.12)_18%,transparent_34%,rgba(255,255,255,0.18)_52%,transparent_68%,rgba(255,255,255,0.1)_84%,transparent_100%)] opacity-75" />

        <img
          src={pack.playerImage}
          alt={`${pack.name} featured player art`}
          className={`absolute z-10 w-auto object-contain drop-shadow-[0_20px_24px_rgba(0,0,0,0.62)] ${pack.playerClass}`}
          draggable={false}
        />

        <div className="absolute right-5 top-[86px] z-20 min-w-[74px] rounded-[6px] border border-white/24 bg-black/62 px-3 py-2 text-center shadow-[0_12px_28px_rgba(0,0,0,0.36)] backdrop-blur-sm">
          <div className="font-display text-[34px] font-extrabold leading-none text-white">{pack.cardCount}</div>
          <div className="mt-1 text-[11px] font-black uppercase leading-none tracking-[0.08em]">
            {pack.cardCount === "1" ? "Card" : "Cards"}
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-[82px] z-20 rounded-[6px] border border-white/20 bg-black/74 px-4 py-3 shadow-[0_16px_30px_rgba(0,0,0,0.42)] backdrop-blur-sm">
          <div className="text-center font-display text-[30px] font-extrabold uppercase leading-none tracking-[0.02em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {pack.name}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ExchangeOverlay = ({ ownedPlayerIds, onCompleteExchange, onClose }: ExchangeOverlayProps) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(string | null)[]>(
    Array.from({ length: EXCHANGE_SLOT_COUNT }, () => null),
  );
  const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(null);
  const [confirmingExchange, setConfirmingExchange] = useState(false);
  const [exchangeRewardPlayer, setExchangeRewardPlayer] = useState<Player | null>(null);
  const [packStage, setPackStage] = useState<ExchangePackStage>("ready");
  const [packOpeningCanFinish, setPackOpeningCanFinish] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const ownedPlayerIdSet = useMemo(() => new Set(ownedPlayerIds), [ownedPlayerIds]);
  const selectedPlayers = useMemo(
    () =>
      selectedPlayerIds.map((playerId) =>
        playerId ? allPlayers.find((player) => player.id === playerId) ?? null : null,
      ),
    [selectedPlayerIds],
  );
  const filledPlayerIds = selectedPlayerIds.filter((playerId): playerId is string => Boolean(playerId));
  const readyToExchange = filledPlayerIds.length === EXCHANGE_SLOT_COUNT;
  const rewardPack = ROGUE_TOKEN_STORE_PACKS.find((pack) => pack.tier === EXCHANGE_REWARD_TIER);
  const rewardCloseLocked = Boolean(exchangeRewardPlayer && (packStage !== "opening" || !packOpeningCanFinish));

  useEffect(() => {
    if (packStage !== "opening") return;

    setPackOpeningCanFinish(false);
    const timeoutId = window.setTimeout(() => {
      setPackOpeningCanFinish(true);
    }, PACK_OPENING_FINISH_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [packStage]);

  const assignExchangeSlot = (playerId: string) => {
    if (selectingSlotIndex === null) return;
    setSelectedPlayerIds((currentSlots) => {
      const nextSlots = currentSlots.map((currentPlayerId) => (currentPlayerId === playerId ? null : currentPlayerId));
      nextSlots[selectingSlotIndex] = playerId;
      return nextSlots;
    });
    setSelectingSlotIndex(null);
  };

  const clearExchangeSlot = (slotIndex: number) => {
    setSelectedPlayerIds((currentSlots) => {
      const nextSlots = [...currentSlots];
      nextSlots[slotIndex] = null;
      return nextSlots;
    });
  };

  const confirmExchange = () => {
    if (!readyToExchange) return;
    const playerIds = [...filledPlayerIds];
    if (playerIds.some((playerId) => !ownedPlayerIdSet.has(playerId))) {
      setExchangeError("One of these cards is no longer in your collection. Choose three owned cards and try again.");
      setConfirmingExchange(false);
      return;
    }

    const rewardPlayer = onCompleteExchange(playerIds, EXCHANGE_REWARD_TIER);
    if (!rewardPlayer) {
      setExchangeError("This exchange could not be completed because no Sapphire reward card is available right now.");
      setConfirmingExchange(false);
      return;
    }

    setConfirmingExchange(false);
    setExchangeError(null);
    setPackStage("ready");
    setPackOpeningCanFinish(false);
    setExchangeRewardPlayer(rewardPlayer);
  };

  const openRewardPack = () => {
    setPackStage("opening");
  };

  const overlay = (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-slate-950/88 px-3 py-4 text-white backdrop-blur-lg sm:px-5 sm:py-6">
      <div className="mx-auto w-full max-w-6xl rounded-[32px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_34%),linear-gradient(180deg,rgba(8,13,24,0.98),rgba(3,7,18,0.99))] p-4 shadow-[0_34px_110px_rgba(0,0,0,0.68)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/18 bg-sky-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100/76">
              <Sparkles size={13} />
              Exchanges
            </div>
            <h2 className="mt-3 font-display text-4xl text-white sm:text-5xl">3x3 Exchange</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Trade any 3 permanent collection players for one Sapphire player pack. Pick carefully: cards used in an exchange leave your collection.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={rewardCloseLocked}
            className="self-end rounded-full border border-white/10 bg-white/8 p-3 text-slate-300 transition hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/8 disabled:hover:text-slate-300 sm:self-auto"
            aria-label="Close exchange"
          >
            <X size={18} />
          </button>
        </div>

        {exchangeRewardPlayer ? (
          packStage === "opening" && rewardPack ? (
            <div className="mt-6 overflow-hidden rounded-[28px] border border-sky-200/18 bg-[radial-gradient(circle_at_50%_30%,rgba(56,189,248,0.22),transparent_32%),linear-gradient(135deg,rgba(7,11,20,0.98),rgba(15,23,42,0.96))] shadow-[0_28px_90px_rgba(14,165,233,0.16)]">
              <div className="pack-reveal-stage relative h-[680px] min-h-[620px] overflow-hidden">
                <div className="absolute inset-x-0 top-6 z-[7] px-5 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-100/74">
                    Sapphire Pack Opening
                  </div>
                  <h3 className="mt-2 font-display text-3xl text-white">Revealing Your Exchange Reward</h3>
                </div>

                <div
                  className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: `${packWidth * 0.52}px`,
                    height: `${packHeight * 0.52}px`,
                  }}
                >
                  <div className="pack-rip-wrap h-full w-full">
                    <div className="pack-rip-half pack-rip-left">
                      <ExchangePackVisual pack={rewardPack} scale={0.52} />
                    </div>
                    <div className="pack-rip-half pack-rip-right">
                      <div style={{ transform: `translateX(-${(packWidth * 0.52) / 2}px)` }}>
                        <ExchangePackVisual pack={rewardPack} scale={0.52} />
                      </div>
                    </div>
                    <div className="pack-rip-flash" />
                  </div>
                </div>

                <div className="pack-card-illumination pointer-events-none absolute left-1/2 top-[48%]" />
                <div className="pack-revealed-card-anchor absolute left-1/2 top-[48%] z-[6] w-fit">
                  <div className="pack-revealed-card">
                    <DraftPlayerCard
                      player={exchangeRewardPlayer}
                      compact
                      compactScale={0.56}
                      draftedPlayerIds={[exchangeRewardPlayer.id]}
                      actionLabel="Pulled"
                      selected
                      disabled
                      rarityOverride={EXCHANGE_REWARD_TIER}
                    />
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-6 z-[8] px-5 text-center">
                  <div className="mx-auto mb-3 w-fit rounded-full border border-white/12 bg-black/36 px-4 py-2 text-xs font-semibold text-slate-100 shadow-[0_12px_34px_rgba(0,0,0,0.32)]">
                    {packOpeningCanFinish
                      ? `${exchangeRewardPlayer.name} was added to your collection.`
                      : "Opening pack..."}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={!packOpeningCanFinish}
                    className="pack-send-collection inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_18px_42px_rgba(255,255,255,0.16)] transition hover:scale-[1.02] disabled:cursor-wait disabled:bg-white/38 disabled:text-white/60 disabled:hover:scale-100"
                  >
                    <CheckCircle2 size={16} />
                    {packOpeningCanFinish ? "Done" : "Revealing..."}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[28px] border border-sky-200/20 bg-[radial-gradient(circle_at_50%_32%,rgba(250,204,21,0.34),transparent_26%),radial-gradient(circle_at_50%_46%,rgba(56,189,248,0.18),transparent_48%),linear-gradient(135deg,rgba(8,13,24,0.98),rgba(15,23,42,0.96))] p-5 text-center shadow-[0_28px_90px_rgba(14,165,233,0.16)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100/24 bg-sky-300/14 text-sky-100">
                <Package2 size={23} />
              </div>
              <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-sky-100/72">
                Exchange Complete
              </div>
              <h3 className="mt-2 font-display text-3xl text-white">Your Sapphire Pack Is Ready</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                The three exchanged players were removed from your collection. Open this pack to reveal the Sapphire reward card you earned.
              </p>
              {rewardPack ? (
                <div className="relative mx-auto mt-5 w-fit">
                  <div className="pointer-events-none absolute inset-6 rounded-full bg-sky-300/28 blur-3xl" />
                  <div className="relative drop-shadow-[0_30px_76px_rgba(56,189,248,0.28)]">
                    <ExchangePackVisual pack={rewardPack} scale={0.46} />
                  </div>
                </div>
              ) : (
                <div className="mx-auto mt-5 flex h-[230px] w-full max-w-[240px] items-center justify-center rounded-[24px] border border-sky-100/18 bg-black/24 text-sky-100">
                  <Package2 size={56} />
                </div>
              )}
              <button
                type="button"
                onClick={rewardPack ? openRewardPack : onClose}
                className="mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-amber-100/36 bg-[linear-gradient(135deg,#fff6bf,#f8c85c_48%,#b77716)] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_18px_42px_rgba(245,158,11,0.28)] transition hover:scale-[1.02]"
              >
                <Package2 size={16} />
                {rewardPack ? "Open Pack" : "Done"}
              </button>
            </div>
          )
        ) : (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Exchange Slots
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-white">
                      {filledPlayerIds.length} / {EXCHANGE_SLOT_COUNT} cards selected
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/24 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Any collection players
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {selectedPlayers.map((player, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="rounded-[24px] border border-white/10 bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectingSlotIndex(slotIndex)}
                        className="flex min-h-[310px] w-full flex-col items-center justify-center rounded-[20px] border border-dashed border-white/16 bg-white/[0.035] p-3 text-center transition hover:border-amber-100/34 hover:bg-amber-300/8"
                      >
                        {player ? (
                          <>
                            <DraftPlayerCard
                              player={player}
                              compact
                              compactScale={0.34}
                              draftedPlayerIds={ownedPlayerIds}
                              actionLabel="Selected"
                              selected
                              disabled
                              rarityOverride={getPlayerTier(player)}
                            />
                            <div className="mt-3 text-sm font-semibold text-white">{player.name}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                              {formatPlayerMeta(player)}
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/14 bg-white/7 text-slate-200">
                              <Plus size={24} />
                            </span>
                            <span className="mt-4 text-lg font-semibold text-white">Empty Slot</span>
                            <span className="mt-2 max-w-[180px] text-xs leading-5 text-slate-400">
                              Click to choose one player from your collection.
                            </span>
                          </>
                        )}
                      </button>
                      {player ? (
                        <button
                          type="button"
                          onClick={() => clearExchangeSlot(slotIndex)}
                          className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/6 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/10"
                        >
                          Clear Slot
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[28px] border border-sky-200/16 bg-[linear-gradient(180deg,rgba(14,37,62,0.62),rgba(6,10,18,0.96))] p-5 shadow-[0_20px_60px_rgba(14,165,233,0.1)]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100/72">Reward</div>
                <h3 className="mt-2 font-display text-3xl text-white">Sapphire Pack</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Completing 3x3 opens one random Sapphire player card and adds it to your collection.
                </p>
                {rewardPack ? (
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-sky-100/18 bg-black/24 p-3">
                    <img
                      src={rewardPack.wrapperImage}
                      alt=""
                      className="mx-auto h-[190px] w-full object-contain drop-shadow-[0_18px_34px_rgba(56,189,248,0.24)]"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex h-[190px] items-center justify-center rounded-[24px] border border-sky-100/18 bg-black/24 text-sky-100">
                    <Package2 size={48} />
                  </div>
                )}
                {exchangeError ? (
                  <div className="mt-4 rounded-[18px] border border-rose-200/20 bg-rose-500/12 px-4 py-3 text-sm leading-6 text-rose-50">
                    {exchangeError}
                  </div>
                ) : null}
                <button
                  type="button"
                  disabled={!readyToExchange}
                  onClick={() => setConfirmingExchange(true)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
                >
                  <Package2 size={16} />
                  Start Exchange
                </button>
              </aside>
            </div>

            {ownedPlayerIds.length < EXCHANGE_SLOT_COUNT ? (
              <div className="mt-4 rounded-[22px] border border-amber-100/18 bg-amber-300/8 px-4 py-3 text-sm leading-6 text-amber-50">
                You need at least 3 collection players to complete this exchange.
              </div>
            ) : null}
          </>
        )}
      </div>

      {selectingSlotIndex !== null ? (
        <CollectionOverlay
          ownedPlayerIds={ownedPlayerIds}
          onClose={() => setSelectingSlotIndex(null)}
          exchangeSlotSelection={{
            slotNumber: selectingSlotIndex + 1,
            selectedPlayerIds: filledPlayerIds,
            onConfirm: assignExchangeSlot,
          }}
        />
      ) : null}

      {confirmingExchange ? (
        <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-slate-950/84 px-4 py-5 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[28px] border border-amber-100/24 bg-[linear-gradient(135deg,rgba(30,20,8,0.98),rgba(7,11,20,0.98))] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.72)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100/24 bg-amber-300/12 text-amber-100">
              <AlertTriangle size={23} />
            </div>
            <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-100/74">
              Confirm Exchange
            </div>
            <h3 className="mt-2 font-display text-3xl text-white">These cards will be removed forever</h3>
            <p className="mt-3 text-sm leading-6 text-slate-200/88">
              By exchanging these 3 players, they will be removed from your permanent collection. This cannot be undone.
            </p>
            <div className="mt-4 rounded-[20px] border border-sky-100/18 bg-sky-300/8 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-100/70">Reward</div>
              <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
                <Package2 size={18} className="text-sky-100" />
                1 Sapphire Pack
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmingExchange(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmExchange}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black uppercase tracking-[0.1em] text-slate-950 transition hover:scale-[1.02]"
              >
                Confirm Exchange
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (typeof document === "undefined") {
    return overlay;
  }

  return createPortal(overlay, document.body);
};
