import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, Coins, Crown, Handshake, Medal, Package2, ShieldPlus, Sparkles, Ticket, Users2, X } from "lucide-react";
import { MetaProgress, Player } from "../types";
import { allPlayers } from "../data/players";
import { getTokenStorePlayerPrice, getTokenStorePlayerPriceMap, getTokenStoreSPlayers, tokenStoreUtilityItems } from "../lib/tokenStore";
import { usePlayerImage } from "../hooks/usePlayerImage";
import {
  COLLECTION_REWARD_TOKENS,
  buildCollectionProgress,
  type CollectionFamilyId,
} from "../lib/collections";

interface TokenStoreOverlayProps {
  meta: MetaProgress;
  ownedTrainingCampTickets: number;
  ownedTradePhones: number;
  ownedSilverStarterPacks: number;
  ownedGoldStarterPacks: number;
  ownedPlatinumStarterPacks: number;
  ownedCoachRecruitment: number;
  ownedRogueStarIds: string[];
  activeRogueStarId: string | null;
  rogueCollectedCollectionEntryIds: string[];
  claimedCollectionRewardIds: string[];
  onBuyTrainingCampTicket: () => void;
  onBuyTradePhone: () => void;
  onBuySilverStarterPack: () => void;
  onBuyGoldStarterPack: () => void;
  onBuyPlatinumStarterPack: () => void;
  onBuyCoachRecruitment: () => void;
  onBuyRogueStar: (playerId: string, price: number) => void;
  onSetActiveRogueStar: (playerId: string | null) => void;
  onClaimCollectionReward: (familyId: CollectionFamilyId) => boolean;
  onClose: () => void;
}

const formatNumber = (value: number) => value.toLocaleString();
const playersById = new Map(allPlayers.map((player) => [player.id, player]));

const SmallCollectionPlayerCard = ({ player }: { player: Player }) => {
  const imageUrl = usePlayerImage(player);

  return (
    <div className="w-[84px] shrink-0 rounded-[16px] border border-white/10 bg-black/25 p-1.5">
      <div className="overflow-hidden rounded-[12px] border border-white/10 bg-black/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={player.name}
            className="h-[94px] w-full object-cover object-top"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-[94px] items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 font-display text-xl text-white/70">
            {player.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="mt-1.5 text-[10px] font-semibold leading-3 text-white">
        {player.name}
      </div>
    </div>
  );
};

const StorePlayerCard = ({
  playerId,
  price,
  owned,
  active,
  canAfford,
  onBuy,
  onSetActive,
}: {
  playerId: string;
  price: number;
  owned: boolean;
  active: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onSetActive: () => void;
}) => {
  const player = getTokenStoreSPlayers().find((entry) => entry.id === playerId)!;
  const imageUrl = usePlayerImage(player);

  return (
    <div className="rounded-[24px] border border-amber-200/18 bg-[linear-gradient(180deg,rgba(53,35,8,0.68),rgba(17,20,30,0.94))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] sm:rounded-[28px]">
      <div className="overflow-hidden rounded-[22px] border border-white/12 bg-black/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={player.name}
            className="h-[180px] w-full object-cover object-top sm:h-[220px]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-[180px] items-center justify-center bg-slate-900 text-5xl text-white/70 sm:h-[220px]">
            {player.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/74">Galaxy Rogue Star</div>
          <div className="mt-1 text-xl font-semibold text-white sm:text-2xl">{player.name}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Use this player in place of one starter-pack card in Rogue runs.
          </div>
        </div>
        <div className="w-fit rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
          {player.overall} OVR
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Price</div>
          <div className="mt-1 text-xl font-semibold text-white">{formatNumber(price)}</div>
        </div>
        {owned ? (
          active ? (
            <button
              type="button"
              onClick={() => onSetActive()}
              className="w-full rounded-full border border-emerald-200/24 bg-emerald-300/12 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/18 sm:w-auto sm:py-2.5"
            >
              Active In Rogue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSetActive()}
              className="w-full rounded-full border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12 sm:w-auto sm:py-2.5"
            >
              Set Active
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onBuy}
            disabled={!canAfford}
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48 sm:w-auto sm:py-2.5"
          >
            Buy
          </button>
        )}
      </div>
    </div>
  );
};

export const TokenStoreOverlay = ({
  meta,
  ownedTrainingCampTickets,
  ownedTradePhones,
  ownedSilverStarterPacks,
  ownedGoldStarterPacks,
  ownedPlatinumStarterPacks,
  ownedCoachRecruitment,
  ownedRogueStarIds,
  activeRogueStarId,
  rogueCollectedCollectionEntryIds,
  claimedCollectionRewardIds,
  onBuyTrainingCampTicket,
  onBuyTradePhone,
  onBuySilverStarterPack,
  onBuyGoldStarterPack,
  onBuyPlatinumStarterPack,
  onBuyCoachRecruitment,
  onBuyRogueStar,
  onSetActiveRogueStar,
  onClaimCollectionReward,
  onClose,
}: TokenStoreOverlayProps) => {
  const [view, setView] = useState<"store" | "collections">("store");
  const [selectedCollectionFamily, setSelectedCollectionFamily] = useState<CollectionFamilyId | null>(null);
  const sTierPlayers = useMemo(() => getTokenStoreSPlayers(), []);
  const playerPriceMap = useMemo(() => getTokenStorePlayerPriceMap(), []);
  const collectionProgress = useMemo(
    () => buildCollectionProgress(rogueCollectedCollectionEntryIds),
    [rogueCollectedCollectionEntryIds],
  );
  const claimedRewardIds = useMemo(
    () => new Set(claimedCollectionRewardIds),
    [claimedCollectionRewardIds],
  );
  const selectedCollection = selectedCollectionFamily
    ? collectionProgress.find((entry) => entry.family.id === selectedCollectionFamily) ?? null
    : null;
  const utilityCards = [
    {
      item: tokenStoreUtilityItems[0],
      owned: ownedTrainingCampTickets,
      onBuy: onBuyTrainingCampTicket,
      icon: ShieldPlus,
      cardClass:
        "border-sky-200/18 bg-[linear-gradient(135deg,rgba(19,45,83,0.34),rgba(9,17,31,0.92))]",
      badgeClass:
        "border-sky-200/20 bg-sky-300/10 text-sky-100",
      iconClass: "text-sky-200",
    },
    {
      item: tokenStoreUtilityItems[1],
      owned: ownedTradePhones,
      onBuy: onBuyTradePhone,
      icon: Ticket,
      cardClass:
        "border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(74,23,96,0.32),rgba(11,13,24,0.92))]",
      badgeClass:
        "border-fuchsia-200/20 bg-fuchsia-300/10 text-fuchsia-100",
      iconClass: "text-fuchsia-200",
    },
  ];
  const starterPackCards = [
    {
      item: tokenStoreUtilityItems[2],
      owned: ownedSilverStarterPacks,
      onBuy: onBuySilverStarterPack,
      cardClass:
        "border-slate-200/18 bg-[linear-gradient(135deg,rgba(75,85,99,0.34),rgba(10,15,24,0.92))]",
      badgeClass:
        "border-slate-200/20 bg-slate-200/10 text-slate-100",
      iconClass: "text-slate-100",
      uplift: "+1 Avg OVR",
    },
    {
      item: tokenStoreUtilityItems[3],
      owned: ownedGoldStarterPacks,
      onBuy: onBuyGoldStarterPack,
      cardClass:
        "border-amber-200/18 bg-[linear-gradient(135deg,rgba(92,67,12,0.34),rgba(15,14,22,0.92))]",
      badgeClass:
        "border-amber-200/20 bg-amber-300/10 text-amber-100",
      iconClass: "text-amber-200",
      uplift: "+2 Avg OVR",
    },
    {
      item: tokenStoreUtilityItems[4],
      owned: ownedPlatinumStarterPacks,
      onBuy: onBuyPlatinumStarterPack,
      cardClass:
        "border-cyan-200/18 bg-[linear-gradient(135deg,rgba(34,93,112,0.3),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-cyan-200/20 bg-cyan-300/10 text-cyan-100",
      iconClass: "text-cyan-200",
      uplift: "+3 Avg OVR",
    },
  ];
  const rogueUpgradeCards = [
    {
      item: tokenStoreUtilityItems[5],
      owned: ownedCoachRecruitment,
      onBuy: onBuyCoachRecruitment,
      icon: Handshake,
      cardClass:
        "border-emerald-200/18 bg-[linear-gradient(135deg,rgba(21,94,72,0.3),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-emerald-200/20 bg-emerald-300/10 text-emerald-100",
      iconClass: "text-emerald-200",
      uplift: "Coach-Team Node",
    },
  ];
  const orderedStarPlayers = useMemo(
    () =>
      [...sTierPlayers].sort((a, b) => {
        const priceDelta = getTokenStorePlayerPrice(a, playerPriceMap) - getTokenStorePlayerPrice(b, playerPriceMap);
        if (priceDelta !== 0) return priceDelta;
        return a.name.localeCompare(b.name);
      }),
    [playerPriceMap, sTierPlayers],
  );

  const overlay = (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/82 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-8">
      <div className="w-full max-w-[1240px] rounded-[28px] border border-white/10 bg-[#070b12] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:p-6 lg:rounded-[34px] lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-400">
              <Coins size={14} className="text-amber-200" />
              Token Store
            </div>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">Spend Tokens On Rogue Power</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Cash in your Tokens on Rogue-run utility items, permanent Rogue upgrades, and premium starter stars. Utility items stack in your inventory, Rogue upgrades unlock forever, and owned Galaxy stars can be set active for future Rogue runs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="self-end rounded-full border border-white/10 bg-white/6 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white sm:self-auto"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[26px] border border-amber-200/18 bg-amber-300/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/72">Spendable Tokens</div>
            <div className="mt-2 text-4xl font-semibold text-white">{formatNumber(meta.tokens.balance)}</div>
          </div>
          <div className="rounded-[26px] border border-white/12 bg-white/5 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Lifetime Earned</div>
            <div className="mt-2 text-4xl font-semibold text-white">{formatNumber(meta.tokens.lifetimeEarned)}</div>
          </div>
          <div className="rounded-[26px] border border-fuchsia-200/16 bg-fuchsia-300/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-fuchsia-100/72">Active Rogue Star</div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {activeRogueStarId
                ? sTierPlayers.find((player) => player.id === activeRogueStarId)?.name ?? "Selected"
                : "None Selected"}
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-[28px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(15,23,42,0.42),rgba(5,8,14,0.72))] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setView("store");
                setSelectedCollectionFamily(null);
              }}
              className={`group flex min-h-[86px] items-center justify-between gap-4 rounded-[22px] border px-5 py-4 text-left transition ${
                view === "store"
                  ? "border-amber-100/38 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(120,53,15,0.28),rgba(15,23,42,0.72))] shadow-[0_14px_34px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-white/8 bg-black/20 hover:border-amber-100/24 hover:bg-amber-300/8"
              }`}
            >
              <span className="flex items-center gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                  view === "store"
                    ? "border-amber-100/30 bg-amber-200/16 text-amber-100"
                    : "border-white/10 bg-white/6 text-slate-300 group-hover:text-amber-100"
                }`}>
                  <Package2 size={20} />
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Token Store</span>
                  <span className="mt-1 block text-2xl font-semibold text-white">Store</span>
                </span>
              </span>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                view === "store"
                  ? "border-amber-100/30 bg-amber-200/14 text-amber-100"
                  : "border-white/10 bg-white/6 text-slate-400"
              }`}>
                {view === "store" ? "Active" : "Open"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setView("collections")}
              className={`group flex min-h-[86px] items-center justify-between gap-4 rounded-[22px] border px-5 py-4 text-left transition ${
                view === "collections"
                  ? "border-emerald-100/38 bg-[linear-gradient(135deg,rgba(52,211,153,0.22),rgba(6,78,59,0.3),rgba(15,23,42,0.72))] shadow-[0_14px_34px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-white/8 bg-black/20 hover:border-emerald-100/24 hover:bg-emerald-300/8"
              }`}
            >
              <span className="flex items-center gap-4">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                  view === "collections"
                    ? "border-emerald-100/30 bg-emerald-200/16 text-emerald-100"
                    : "border-white/10 bg-white/6 text-slate-300 group-hover:text-emerald-100"
                }`}>
                  <Medal size={20} />
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Token Rewards</span>
                  <span className="mt-1 block text-2xl font-semibold text-white">Collections</span>
                </span>
              </span>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                view === "collections"
                  ? "border-emerald-100/30 bg-emerald-200/14 text-emerald-100"
                  : "border-white/10 bg-white/6 text-slate-400"
              }`}>
                {view === "collections" ? "Active" : "Open"}
              </span>
            </button>
          </div>
        </div>

        {view === "store" ? (
          <>
        <div className="mt-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            <Sparkles size={14} className="text-sky-200" />
            Utility Items
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {utilityCards.map(({ item, owned, onBuy, icon: Icon, cardClass, badgeClass, iconClass }) => (
              <div key={item.id} className={`rounded-[28px] border p-5 ${cardClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xl font-semibold text-white">
                      <Icon size={18} className={iconClass} />
                      {item.title}
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-300">{item.description}</div>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClass}`}>
                    Owned {owned}
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-2xl font-semibold text-white">{formatNumber(item.price)}</div>
                  <button
                    type="button"
                    onClick={onBuy}
                    disabled={meta.tokens.balance < item.price}
                    className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48 sm:w-auto sm:py-2.5"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            <Handshake size={14} className="text-emerald-200" />
            Permanent Rogue Upgrades
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-300">
            Unlock run-shaping systems that become available when a new Rogue run starts.
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rogueUpgradeCards.map(({ item, owned, onBuy, icon: Icon, cardClass, badgeClass, iconClass, uplift }) => {
              const unlocked = owned > 0;

              return (
                <div key={item.id} className={`rounded-[28px] border p-5 ${cardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xl font-semibold text-white">
                        <Icon size={18} className={iconClass} />
                        {item.title}
                      </div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/58">
                        {uplift}
                      </div>
                      <div className="mt-3 text-sm leading-7 text-slate-300">{item.description}</div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClass}`}>
                      {unlocked ? "Owned" : "Locked"}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-2xl font-semibold text-white">{formatNumber(item.price)}</div>
                    <button
                      type="button"
                      onClick={onBuy}
                      disabled={unlocked || meta.tokens.balance < item.price}
                      className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48 sm:w-auto sm:py-2.5"
                    >
                      {unlocked ? "Owned" : "Unlock"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            <Package2 size={14} className="text-amber-200" />
            Rogue Starter Pack Upgrades
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-300">
            Buy premium starter packs to raise the average strength of your 3-card Rogue opening before you pick Balanced, Defense, or Offense.
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {starterPackCards.map(({ item, owned, onBuy, cardClass, badgeClass, iconClass, uplift }) => {
              const unlocked = owned > 0;

              return (
              <div key={item.id} className={`rounded-[28px] border p-5 ${cardClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xl font-semibold text-white">
                      <Package2 size={18} className={iconClass} />
                      {item.title}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/58">
                      {uplift}
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-300">{item.description}</div>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClass}`}>
                    {unlocked ? "Owned" : "Locked"}
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-2xl font-semibold text-white">{formatNumber(item.price)}</div>
                  <button
                    type="button"
                    onClick={onBuy}
                    disabled={unlocked || meta.tokens.balance < item.price}
                    className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48 sm:w-auto sm:py-2.5"
                  >
                    {unlocked ? "Owned" : "Unlock"}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
            <Crown size={14} className="text-amber-200" />
            Galaxy Rogue Star Catalog
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-300">
            Every Galaxy player in the game can be purchased here. Michael Jordan sits alone at the top of the market, and the cheapest star in the store now starts at 600,000 tokens.
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {orderedStarPlayers.map((player) => {
              const price = getTokenStorePlayerPrice(player, playerPriceMap);
              const owned = ownedRogueStarIds.includes(player.id);
              const active = activeRogueStarId === player.id;

              return (
                <StorePlayerCard
                  key={player.id}
                  playerId={player.id}
                  price={price}
                  owned={owned}
                  active={active}
                  canAfford={meta.tokens.balance >= price}
                  onBuy={() => onBuyRogueStar(player.id, price)}
                  onSetActive={() => onSetActiveRogueStar(active ? null : player.id)}
                />
              );
            })}
          </div>
        </div>
          </>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Collection Sets</div>
                <div className="mt-2 text-3xl font-semibold text-white">{collectionProgress.length}</div>
                <div className="mt-2 text-sm text-slate-200">
                  Each completed Rogue collection can pay out {formatNumber(COLLECTION_REWARD_TOKENS)} Tokens.
                </div>
              </div>
              <div className="rounded-[24px] border border-sky-300/14 bg-sky-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-sky-100/70">Rewards Claimed</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {claimedRewardIds.size} / {collectionProgress.length}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Claimed rewards are permanent token-bank bonuses.
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Entries Collected</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {collectionProgress.reduce((sum, entry) => sum + entry.collectedCount, 0)} / {collectionProgress.reduce((sum, entry) => sum + entry.totalCount, 0)}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Draft a combo together in Rogue Mode and it immediately counts as collected.
                </div>
              </div>
            </div>

            {selectedCollection ? (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedCollectionFamily(null)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:text-white"
                    >
                      <ArrowLeft size={14} />
                      Back To Collections
                    </button>
                    <div className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                      {selectedCollection.family.title}
                    </div>
                    <h3 className="mt-2 font-display text-3xl text-white">
                      {selectedCollection.collectedCount} / {selectedCollection.totalCount} collected
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                      {selectedCollection.family.description}
                    </p>
                  </div>
                  <div className={`rounded-[22px] border px-5 py-4 ${selectedCollection.family.toneClass}`}>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-200/80">Reward Status</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {claimedRewardIds.has(selectedCollection.family.id)
                        ? "Claimed"
                        : selectedCollection.unlocked
                          ? "Ready To Claim"
                          : "In Progress"}
                    </div>
                    <div className="mt-1 text-sm text-slate-200/90">
                      {formatNumber(COLLECTION_REWARD_TOKENS)} Tokens
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {selectedCollection.items.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-[22px] border p-4 ${
                        entry.collected
                          ? "border-emerald-300/20 bg-emerald-300/10"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-base font-semibold leading-6 text-white">{entry.title}</div>
                        </div>
                        <div className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          entry.collected
                            ? "border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                            : "border-white/10 bg-white/6 text-slate-300"
                        }`}>
                          {entry.collected ? "Collected" : "Not Collected"}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.playerIds
                          .map((playerId) => playersById.get(playerId))
                          .filter((player): player is Player => Boolean(player))
                          .map((player) => (
                            <SmallCollectionPlayerCard key={player.id} player={player} />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {collectionProgress.map((entry) => {
                  const claimed = claimedRewardIds.has(entry.family.id);
                  const canClaim = entry.unlocked && !claimed;

                  return (
                    <button
                      key={entry.family.id}
                      type="button"
                      onClick={() => setSelectedCollectionFamily(entry.family.id)}
                      className={`rounded-[28px] border p-6 text-left transition hover:scale-[1.01] ${entry.family.toneClass}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-white/12 bg-black/20 p-3 text-white">
                              <Medal size={22} />
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-[0.22em] text-slate-300/80">Rogue Collection</div>
                              <div className="mt-1 text-2xl font-semibold text-white">{entry.family.title}</div>
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-100/88">{entry.family.description}</p>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                          claimed
                            ? "border border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                            : entry.unlocked
                              ? "border border-amber-200/24 bg-amber-300/12 text-amber-100"
                              : "border border-white/10 bg-black/20 text-slate-300"
                        }`}>
                          {claimed ? "Claimed" : entry.unlocked ? "Complete" : "Locked"}
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Progress</div>
                          <div className="mt-2 text-3xl font-semibold text-white">
                            {entry.collectedCount} / {entry.totalCount}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                            Open Set
                            <Users2 size={14} />
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onClaimCollectionReward(entry.family.id);
                            }}
                            disabled={!canClaim}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/18 disabled:text-white/46"
                          >
                            {claimed ? (
                              <>
                                <CheckCircle2 size={14} />
                                Claimed
                              </>
                            ) : canClaim ? (
                              `Claim ${formatNumber(COLLECTION_REWARD_TOKENS)}`
                            ) : (
                              "Locked"
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-amber-200"
                          style={{ width: `${entry.totalCount === 0 ? 0 : Math.max(6, Math.round((entry.collectedCount / entry.totalCount) * 100))}%` }}
                        />
                      </div>
                      <div className="mt-3 text-sm text-slate-200/90">{entry.family.rewardText}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
