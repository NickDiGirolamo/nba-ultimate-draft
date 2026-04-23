import { useMemo } from "react";
import { createPortal } from "react-dom";
import { Coins, Crown, Package2, ShieldPlus, Sparkles, Ticket, X } from "lucide-react";
import { MetaProgress } from "../types";
import { getTokenStorePlayerPrice, getTokenStorePlayerPriceMap, getTokenStoreSPlayers, tokenStoreUtilityItems } from "../lib/tokenStore";
import { usePlayerImage } from "../hooks/usePlayerImage";

interface TokenStoreOverlayProps {
  meta: MetaProgress;
  ownedTrainingCampTickets: number;
  ownedTradePhones: number;
  ownedSilverStarterPacks: number;
  ownedGoldStarterPacks: number;
  ownedPlatinumStarterPacks: number;
  ownedRogueStarIds: string[];
  activeRogueStarId: string | null;
  onBuyTrainingCampTicket: () => void;
  onBuyTradePhone: () => void;
  onBuySilverStarterPack: () => void;
  onBuyGoldStarterPack: () => void;
  onBuyPlatinumStarterPack: () => void;
  onBuyRogueStar: (playerId: string, price: number) => void;
  onSetActiveRogueStar: (playerId: string | null) => void;
  onClose: () => void;
}

const formatNumber = (value: number) => value.toLocaleString();

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
    <div className="rounded-[28px] border border-amber-200/18 bg-[linear-gradient(180deg,rgba(53,35,8,0.68),rgba(17,20,30,0.94))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
      <div className="overflow-hidden rounded-[22px] border border-white/12 bg-black/20">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={player.name}
            className="h-[220px] w-full object-cover object-top"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-[220px] items-center justify-center bg-slate-900 text-5xl text-white/70">
            {player.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/74">Galaxy Rogue Star</div>
          <div className="mt-1 text-2xl font-semibold text-white">{player.name}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Use this player in place of one starter-pack card in Rogue runs.
          </div>
        </div>
        <div className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
          {player.overall} OVR
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Price</div>
          <div className="mt-1 text-xl font-semibold text-white">{formatNumber(price)}</div>
        </div>
        {owned ? (
          active ? (
            <button
              type="button"
              onClick={() => onSetActive()}
              className="rounded-full border border-emerald-200/24 bg-emerald-300/12 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/18"
            >
              Active In Rogue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSetActive()}
              className="rounded-full border border-white/14 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Set Active
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onBuy}
            disabled={!canAfford}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
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
  ownedRogueStarIds,
  activeRogueStarId,
  onBuyTrainingCampTicket,
  onBuyTradePhone,
  onBuySilverStarterPack,
  onBuyGoldStarterPack,
  onBuyPlatinumStarterPack,
  onBuyRogueStar,
  onSetActiveRogueStar,
  onClose,
}: TokenStoreOverlayProps) => {
  const sTierPlayers = useMemo(() => getTokenStoreSPlayers(), []);
  const playerPriceMap = useMemo(() => getTokenStorePlayerPriceMap(), []);
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
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/82 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-[1240px] rounded-[34px] border border-white/10 bg-[#070b12] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-400">
              <Coins size={14} className="text-amber-200" />
              Token Store
            </div>
            <h2 className="mt-3 font-display text-4xl text-white">Spend Tokens On Rogue Power</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Cash in your Tokens on Rogue-run utility items, Rogue starter pack upgrades, and premium starter stars. Utility items stack in your inventory, starter pack upgrades are spent before a run begins, and owned Galaxy stars can be set active for future Rogue runs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/6 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-2xl font-semibold text-white">{formatNumber(item.price)}</div>
                  <button
                    type="button"
                    onClick={onBuy}
                    disabled={meta.tokens.balance < item.price}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
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
            <Package2 size={14} className="text-amber-200" />
            Rogue Starter Pack Upgrades
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-300">
            Buy premium starter packs to raise the average strength of your 3-card Rogue opening before you pick Balanced, Defense, or Offense.
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {starterPackCards.map(({ item, owned, onBuy, cardClass, badgeClass, iconClass, uplift }) => (
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
                    Owned {owned}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-2xl font-semibold text-white">{formatNumber(item.price)}</div>
                  <button
                    type="button"
                    onClick={onBuy}
                    disabled={meta.tokens.balance < item.price}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
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
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
