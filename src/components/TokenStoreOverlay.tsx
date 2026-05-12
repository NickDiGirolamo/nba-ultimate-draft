import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, Coins, CreditCard, Handshake, Medal, Package2, RefreshCcw, ShieldPlus, Sparkles, Ticket, Trophy, Users2, WalletCards, X } from "lucide-react";
import { MetaProgress, Player, PlayerTier } from "../types";
import { allPlayers } from "../data/players";
import { getNbaTeamByName } from "../data/nbaTeams";
import { createTokenPackCheckoutSession, fetchActiveTokenPacks } from "../lib/cloudSave";
import {
  STARTER_VAULT_TIERS,
  getStarterVaultRotation,
  getTokenStorePlayerOrder,
  getTokenStorePlayerPrice,
  getTokenStorePlayerPriceMap,
  getTokenStoreSPlayers,
  getRoguePackPlayerPool,
  getWeeklyStarterVaultCards,
  ROGUE_TOKEN_STORE_PACKS,
  tokenStoreUtilityItems,
  type RogueTokenStorePack,
  type StarterVaultPlayerEntry,
  type StarterVaultTier,
} from "../lib/tokenStore";
import { defaultTokenPackProducts, type TokenPackProduct } from "../lib/tokenPacks";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { PlayerTypeBadges } from "./PlayerTypeBadges";
import { DraftPlayerCard } from "./DraftPlayerCard";
import {
  COLLECTION_REWARD_TOKENS,
  buildCollectionProgress,
  type CollectionFamilyId,
} from "../lib/collections";
import { ROGUE_CHALLENGES } from "../lib/rogueChallenges";
import { getRoguelikeCoachById } from "../lib/roguelike";
import { trackAnalyticsEventSoon } from "../lib/analytics";

const PENDING_ROGUE_PACK_PULL_STORAGE_KEY = "nba-ultimate-draft-pending-rogue-pack-pull-v1";

type RoguePackPull = {
  pack: RogueTokenStorePack;
  player: Player;
};

const readPendingRoguePackPull = (): RoguePackPull | null => {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(PENDING_ROGUE_PACK_PULL_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as { packId?: unknown; playerId?: unknown };
    if (typeof parsed.packId !== "string" || typeof parsed.playerId !== "string") return null;

    const pack = ROGUE_TOKEN_STORE_PACKS.find((candidate) => candidate.id === parsed.packId);
    const player = allPlayers.find((candidate) => candidate.id === parsed.playerId);
    if (!pack || !player) return null;

    return { pack, player };
  } catch {
    return null;
  }
};

const savePendingRoguePackPull = ({ pack, player }: RoguePackPull) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    PENDING_ROGUE_PACK_PULL_STORAGE_KEY,
    JSON.stringify({ packId: pack.id, playerId: player.id }),
  );
};

const clearPendingRoguePackPull = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(PENDING_ROGUE_PACK_PULL_STORAGE_KEY);
};

interface TokenStoreOverlayProps {
  meta: MetaProgress;
  ownedTrainingCampTickets: number;
  ownedTradePhones: number;
  ownedSilverStarterPacks: number;
  ownedGoldStarterPacks: number;
  ownedPlatinumStarterPacks: number;
  ownedCoachRecruitment: number;
  ownedOpeningLockerCashTier: number;
  ownedExtraDraftShuffle: number;
  ownedStarterPackChoicePlus: number;
  ownedRogueStarIds: string[];
  ownedCollectionPlayerIds: string[];
  activeRogueStarId: string | null;
  rogueCollectedCollectionEntryIds: string[];
  claimedCollectionRewardIds: string[];
  completedRogueChallengeIds: string[];
  claimedRogueChallengeIds: string[];
  initialView?: TokenStoreView;
  onBuyTrainingCampTicket: () => boolean | void;
  onBuyTradePhone: () => boolean | void;
  onBuySilverStarterPack: () => boolean | void;
  onBuyGoldStarterPack: () => boolean | void;
  onBuyPlatinumStarterPack: () => boolean | void;
  onBuyCoachRecruitment: () => boolean | void;
  onBuyOpeningLockerCashUpgrade: (tier: number, price: number) => boolean | void;
  onBuyExtraDraftShuffle: () => boolean | void;
  onBuyStarterPackChoicePlus: () => boolean | void;
  onBuyRogueStar: (playerId: string, price: number) => boolean | void;
  onBuyRoguePack: (tier: PlayerTier, price: number) => Player | null;
  onEnsureRoguePackPullOwned: (playerId: string) => void;
  onSetActiveRogueStar: (playerId: string | null) => void;
  onClaimCollectionReward: (familyId: CollectionFamilyId) => boolean;
  onClaimRogueChallengeReward: (challengeId: string) => boolean;
  onRunRogueChallenge: (challengeId: string) => void;
  onClose: () => void;
}

type TokenStoreView = "store" | "vault" | "tokens" | "collections" | "challenges";

const formatNumber = (value: number | string) => {
  const normalized = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(normalized)) return "0";
  return normalized.toLocaleString("en-US");
};
const formatCurrency = (usdCents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(usdCents / 100);
const playersById = new Map(allPlayers.map((player) => [player.id, player]));
const BEST_FIRST_PURCHASE_ID = "training-camp-ticket";

const vaultTierStyles: Record<
  StarterVaultTier,
  { iconClass: string; cardClass: string; badgeClass: string; glowClass: string }
> = {
  Emerald: {
    iconClass: "text-emerald-100",
    cardClass:
      "border-emerald-200/18 bg-[linear-gradient(160deg,rgba(6,78,59,0.42),rgba(8,13,24,0.96))]",
    badgeClass: "border-emerald-200/24 bg-emerald-300/12 text-emerald-100",
    glowClass: "from-emerald-300/24",
  },
  Sapphire: {
    iconClass: "text-sky-100",
    cardClass:
      "border-sky-200/18 bg-[linear-gradient(160deg,rgba(12,74,110,0.42),rgba(8,13,24,0.96))]",
    badgeClass: "border-sky-200/24 bg-sky-300/12 text-sky-100",
    glowClass: "from-sky-300/24",
  },
  Ruby: {
    iconClass: "text-rose-100",
    cardClass:
      "border-rose-200/18 bg-[linear-gradient(160deg,rgba(127,29,29,0.42),rgba(8,13,24,0.96))]",
    badgeClass: "border-rose-200/24 bg-rose-300/12 text-rose-100",
    glowClass: "from-rose-300/24",
  },
  Amethyst: {
    iconClass: "text-violet-100",
    cardClass:
      "border-violet-200/18 bg-[linear-gradient(160deg,rgba(91,33,182,0.42),rgba(8,13,24,0.96))]",
    badgeClass: "border-violet-200/24 bg-violet-300/12 text-violet-100",
    glowClass: "from-violet-300/24",
  },
};

const formatVaultCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1_000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const twoDigit = (value: number) => value.toString().padStart(2, "0");

  return `${days}d:${twoDigit(hours)}h:${twoDigit(minutes)}m:${twoDigit(seconds)}s`;
};

const getTokenPackUseCase = (pack: TokenPackProduct) => {
  const useCases: Record<string, string> = {
    "rookie-token-pack": "Good for: a first utility item or early upgrade progress.",
    "rotation-token-pack": "Good for: your first permanent Rogue upgrade.",
    "playoff-token-pack": "Good for: starter upgrades, coach recruitment, and run tools.",
    "finals-token-pack": "Good for: multiple permanent upgrades across future runs.",
    "galaxy-token-pack": "Good for: high-end permanent pack-card chase progress.",
  };

  return useCases[pack.slug] ?? "Good for: upgrading Rogue power before your next climb.";
};

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
  canAfford,
  onBuy,
}: {
  playerId: string;
  price: number;
  owned: boolean;
  canAfford: boolean;
  onBuy: () => void;
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
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/74">Galaxy Starter Card</div>
          <div className="mt-1 text-xl font-semibold text-white sm:text-2xl">{player.name}</div>
          <div className="mt-3 w-fit rounded-full border border-amber-100/18 bg-black/22 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
            Permanent Star
          </div>
        </div>
        <div className="w-fit rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
          {player.overall} OVR
        </div>
      </div>
      <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Player Type</div>
        <PlayerTypeBadges
          player={player}
          compact
          iconOnly
          noWrap
          className="justify-start overflow-hidden"
        />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Price</div>
          <div className="mt-1 text-xl font-semibold text-white">{formatNumber(price)}</div>
        </div>
        {owned ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-full border border-emerald-200/24 bg-emerald-300/12 px-5 py-3 text-sm font-semibold text-emerald-100 sm:w-auto sm:py-2.5"
          >
            Owned Forever
          </button>
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

const StarterVaultPlayerCard = ({
  entry,
  owned,
  canAfford,
  onBuy,
}: {
  entry: StarterVaultPlayerEntry;
  owned: boolean;
  canAfford: boolean;
  onBuy: () => void;
}) => {
  const { player, tier, price } = entry;
  const imageUrl = usePlayerImage(player);
  const tierStyle = vaultTierStyles[tier];

  return (
    <div className={`relative overflow-hidden rounded-[24px] border p-4 shadow-[0_18px_42px_rgba(0,0,0,0.28)] ${tierStyle.cardClass}`}>
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${tierStyle.glowClass} to-transparent`} />
      <div className="relative overflow-hidden rounded-[20px] border border-white/12 bg-black/24">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={player.name}
            className="h-[152px] w-full object-cover object-top sm:h-[176px]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-[152px] items-center justify-center bg-slate-900 text-4xl text-white/70 sm:h-[176px]">
            {player.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="relative mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tierStyle.badgeClass}`}>
            {tier} Vault
          </div>
          <div className="mt-2 text-lg font-semibold leading-tight text-white">{player.name}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
            {player.primaryPosition} / {player.teamLabel}
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-white">
          {player.overall} OVR
        </div>
      </div>
      <div className="relative mt-3 rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Player Type</div>
        <PlayerTypeBadges
          player={player}
          compact
          iconOnly
          noWrap
          className="justify-start overflow-hidden"
        />
      </div>
      <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Price</div>
          <div className="mt-1 text-xl font-semibold text-white">{formatNumber(price)}</div>
        </div>
        <button
          type="button"
          onClick={onBuy}
          disabled={owned || !canAfford}
          className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48 sm:w-auto sm:py-2.5"
        >
          {owned ? "Owned Forever" : canAfford ? "Buy Card" : "Need Tokens"}
        </button>
      </div>
    </div>
  );
};

const TokenPackCard = ({
  pack,
  busy,
  onCheckout,
}: {
  pack: TokenPackProduct;
  busy: boolean;
  onCheckout: () => void;
}) => {
  const popular = pack.metadata.popular === true;
  const checkoutReady = Boolean(pack.stripePriceId);

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_44px_rgba(0,0,0,0.3)] ${
        popular
          ? "border-amber-200/34 bg-[linear-gradient(135deg,rgba(251,191,36,0.2),rgba(88,28,135,0.18),rgba(7,11,20,0.96))]"
          : "border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(7,11,20,0.96))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_30%_0%,rgba(254,243,199,0.22),transparent_58%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-100/20 bg-amber-300/12 text-amber-100">
          <Coins size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/72">Token Bundle</div>
            {popular ? (
              <div className="rounded-full border border-amber-100/24 bg-amber-200/14 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                Popular
              </div>
            ) : null}
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">{pack.name}</div>
          <p className="mt-3 text-sm leading-7 text-slate-200/88">{pack.description}</p>
          <div className="mt-3 rounded-2xl border border-amber-100/14 bg-amber-200/8 px-3 py-2 text-xs font-semibold leading-5 text-amber-50">
            {getTokenPackUseCase(pack)}
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-black/22 p-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Tokens</div>
          <div className="mt-2 text-3xl font-semibold text-white">{formatNumber(pack.tokenAmount)}</div>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-black/22 p-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Price</div>
          <div className="mt-2 text-3xl font-semibold text-white">{formatCurrency(pack.usdCents, pack.currency)}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={!checkoutReady || busy}
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48"
        title={checkoutReady ? "Open Stripe Checkout for this token bundle." : "Add a Stripe Price ID before this bundle can be sold."}
      >
        <CreditCard size={16} />
        {!checkoutReady ? "Stripe Setup Needed" : busy ? "Opening Checkout..." : "Buy With Stripe"}
      </button>
    </div>
  );
};

const packWidth = 318;
const packHeight = 636;

const RoguePackVisual = ({ pack, scale = 0.62 }: { pack: RogueTokenStorePack; scale?: number }) => (
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

const RoguePackStoreCard = ({
  pack,
  remaining,
  canAfford,
  onOpen,
  onAbout,
}: {
  pack: RogueTokenStorePack;
  remaining: number;
  canAfford: boolean;
  onOpen: () => void;
  onAbout: () => void;
}) => {
  const soldOut = remaining <= 0;

  return (
    <div className="flex min-h-full flex-col rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(7,11,20,0.96))] p-4 shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
      <div className="relative overflow-hidden rounded-[22px]">
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${pack.tintClass} opacity-80`} />
        <div className="pointer-events-none relative">
          <RoguePackVisual pack={pack} />
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{pack.tier} Tier</div>
          <h3 className="mt-1 text-2xl font-semibold text-white">{pack.name}</h3>
        </div>
        <div className="shrink-0 rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200">{remaining} left</div>
      </div>

      <div className="mt-auto pt-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Price</div>
          <div className="mt-1 text-2xl font-semibold text-white">{formatNumber(pack.price)}</div>
        </div>
        <button
          type="button"
          data-testid={`buy-${pack.id}`}
          onPointerUp={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpen();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            onOpen();
          }}
          disabled={soldOut || !canAfford}
          className="pointer-events-auto mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-100/36 bg-[linear-gradient(135deg,#fff6bf,#f8c85c_48%,#b77716)] px-5 py-3.5 text-sm font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_16px_34px_rgba(245,158,11,0.22)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-none disabled:bg-white/20 disabled:text-white/48 disabled:shadow-none"
        >
          <Package2 size={16} />
          {soldOut ? "Tier Complete" : canAfford ? "Buy Pack" : "Need Tokens"}
        </button>
        <button
          type="button"
          data-testid={`about-${pack.id}`}
          onPointerUp={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAbout();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            onAbout();
          }}
          className="pointer-events-auto mt-2 inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:scale-[1.01] hover:bg-slate-100"
        >
          About This Pack
        </button>
      </div>
    </div>
  );
};

const PackOpeningOverlay = ({
  pack,
  player,
  onClose,
}: {
  pack: RogueTokenStorePack;
  player: Player;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[220] overflow-hidden bg-slate-950/94 px-3 py-3 text-white backdrop-blur-lg">
    <div className="relative mx-auto flex h-[calc(100vh-24px)] w-full max-w-5xl items-center justify-center overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(7,11,20,0.98),rgba(15,23,42,0.96))] shadow-[0_34px_110px_rgba(0,0,0,0.72)]">

      <div className="pack-reveal-stage relative h-full w-full">
        <div
          className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2"
          style={{
            width: `${packWidth * 0.52}px`,
            height: `${packHeight * 0.52}px`,
          }}
        >
          <div className="pack-rip-wrap h-full w-full">
            <div className="pack-rip-half pack-rip-left">
              <RoguePackVisual pack={pack} scale={0.52} />
            </div>
            <div className="pack-rip-half pack-rip-right">
              <div style={{ transform: `translateX(-${(packWidth * 0.52) / 2}px)` }}>
                <RoguePackVisual pack={pack} scale={0.52} />
              </div>
            </div>
            <div className="pack-rip-flash" />
          </div>
        </div>

        <div className="pack-card-illumination pointer-events-none absolute left-1/2 top-[45%]" />
        <div className="pack-revealed-card-anchor absolute left-1/2 top-[45%] z-[6] w-fit">
          <div className="pack-revealed-card">
            <DraftPlayerCard
              player={player}
              compact
              compactScale={0.56}
              actionLabel="Pulled"
            />
          </div>
        </div>

        <div className="absolute left-1/2 top-[calc(45%+320px)] w-[min(320px,calc(100%-32px))] -translate-x-1/2">
          <button
            type="button"
            onClick={onClose}
            className="pack-send-collection inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-slate-950 shadow-[0_18px_42px_rgba(255,255,255,0.16)] transition hover:scale-[1.02]"
          >
            <CheckCircle2 size={16} />
            Send to Collection
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PurchasedPackOverlay = ({
  pack,
  onOpen,
}: {
  pack: RogueTokenStorePack;
  onOpen: () => void;
}) => (
  <div className="fixed inset-0 z-[215] flex items-center justify-center overflow-y-auto bg-slate-950/88 px-3 py-3 backdrop-blur-lg">
    <div className="relative max-h-[calc(100vh-24px)] w-full max-w-xl overflow-hidden rounded-[30px] border border-amber-100/18 bg-[radial-gradient(circle_at_50%_34%,rgba(253,224,71,0.44),transparent_24%),radial-gradient(circle_at_50%_46%,rgba(245,158,11,0.22),transparent_48%),linear-gradient(135deg,rgba(8,13,24,0.98),rgba(15,23,42,0.96))] p-5 text-center text-white shadow-[0_34px_120px_rgba(0,0,0,0.76)]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(254,249,195,0.36),rgba(250,204,21,0.12)_38%,transparent_68%)] blur-sm" />
      <div className="pointer-events-none absolute left-1/2 top-[44%] h-[520px] w-20 -translate-x-1/2 -translate-y-1/2 rotate-12 bg-white/18 blur-2xl" />
      <div className="relative">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/76">Pack Purchased</div>
        <h3 className="mt-2 font-display text-3xl text-white">{pack.name}</h3>
        <div className="mx-auto mt-4 w-fit drop-shadow-[0_28px_70px_rgba(250,204,21,0.36)]">
          <RoguePackVisual pack={pack} scale={0.48} />
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-5 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-amber-100/36 bg-[linear-gradient(135deg,#fff6bf,#f8c85c_48%,#b77716)] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_18px_42px_rgba(245,158,11,0.28)] transition hover:scale-[1.02]"
        >
          <Package2 size={16} />
          Open Pack
        </button>
      </div>
    </div>
  </div>
);

const PackPurchaseConfirmOverlay = ({
  pack,
  tokenBalance,
  remaining,
  confirming,
  onCancel,
  onConfirm,
}: {
  pack: RogueTokenStorePack;
  tokenBalance: number;
  remaining: number;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const balanceAfter = Math.max(0, tokenBalance - pack.price);

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-slate-950/86 px-3 py-3 backdrop-blur-lg">
      <div className="relative max-h-[calc(100vh-24px)] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/14 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_34%),linear-gradient(135deg,rgba(8,13,24,0.98),rgba(15,23,42,0.96))] p-4 text-white shadow-[0_34px_110px_rgba(0,0,0,0.72)] sm:p-5">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-200 transition hover:bg-white/12 hover:text-white"
          aria-label="Cancel pack purchase"
        >
          <X size={18} />
        </button>

        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-100/18 bg-amber-300/12 text-amber-100">
          <Package2 size={19} />
        </div>
        <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-100/72">
          Confirm Token Spend
        </div>
        <h3 className="mt-2 font-display text-3xl text-white">Open {pack.name}?</h3>
        <p className="mt-3 text-sm leading-6 text-slate-200/88">
          Confirm you want to spend {formatNumber(pack.price)} tokens to buy one {pack.tier} pack. This purchase is final and non-refundable. After purchase, you will open the pack for one random unowned {pack.tier} player card.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Cost</div>
            <div className="mt-1 text-xl font-semibold text-white">{formatNumber(pack.price)}</div>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Balance After</div>
            <div className="mt-1 text-xl font-semibold text-white">{formatNumber(balanceAfter)}</div>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Cards Left</div>
            <div className="mt-1 text-xl font-semibold text-white">{formatNumber(remaining)}</div>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-amber-100/14 bg-amber-300/8 px-4 py-2.5 text-sm leading-6 text-amber-50/88">
          The revealed card is added to your permanent collection and can be used in starter slots before future Rogue runs.
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-wait disabled:bg-white/40 disabled:text-white/58"
          >
            <Coins size={16} />
            {confirming ? "Buying Pack..." : `Spend ${formatNumber(pack.price)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const PackDetailsOverlay = ({
  pack,
  possiblePlayers,
  totalTierPlayers,
  ownedCount,
  onClose,
}: {
  pack: RogueTokenStorePack;
  possiblePlayers: Player[];
  totalTierPlayers: number;
  ownedCount: number;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto bg-slate-950/88 px-3 py-3 text-white backdrop-blur-lg">
    <div className="max-h-[calc(100vh-24px)] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_32%),linear-gradient(135deg,rgba(8,13,24,0.98),rgba(15,23,42,0.96))] p-4 shadow-[0_34px_110px_rgba(0,0,0,0.72)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-full max-w-[170px] shrink-0">
            <RoguePackVisual pack={pack} scale={0.38} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-100/72">
              About This Pack
            </div>
            <h3 className="mt-2 font-display text-3xl text-white">{pack.name}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200/88">
              This pack contains one random permanent {pack.tier} player card. Cards you already own in this tier are removed from the pull pool, so every successful purchase adds a new card to your collection.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full border border-white/10 bg-white/8 text-slate-200 transition hover:bg-white/12 hover:text-white lg:self-start"
          aria-label="Close pack details"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <div className="rounded-[18px] border border-amber-100/14 bg-amber-300/8 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/70">Price</div>
          <div className="mt-1 text-xl font-semibold text-white">{formatNumber(pack.price)}</div>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Card Count</div>
          <div className="mt-1 text-xl font-semibold text-white">{pack.cardCount}</div>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Possible Now</div>
          <div className="mt-1 text-xl font-semibold text-white">{formatNumber(possiblePlayers.length)}</div>
        </div>
        <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Owned In Tier</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {formatNumber(ownedCount)} / {formatNumber(totalTierPlayers)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Possible Pulls Right Now</div>
            <div className="mt-1 text-lg font-semibold text-white">{pack.tier} player cards not already owned</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
            Random Pull
          </div>
        </div>

        {possiblePlayers.length > 0 ? (
          <div className="mt-3 grid max-h-[38vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {possiblePlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-white/[0.045] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{player.name}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                    {player.teamLabel} / {player.primaryPosition}
                    {player.secondaryPositions.length ? `-${player.secondaryPositions.join("-")}` : ""}
                  </div>
                </div>
                <div className="shrink-0 rounded-full border border-white/10 bg-black/22 px-3 py-1 text-xs font-semibold text-white">
                  {player.overall} OVR
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[20px] border border-emerald-300/18 bg-emerald-300/10 px-4 py-5 text-sm font-semibold text-emerald-50">
            You already own every {pack.tier} card currently available in this pack.
          </div>
        )}
      </div>
    </div>
  </div>
);

export const TokenStoreOverlay = ({
  meta,
  ownedTrainingCampTickets,
  ownedTradePhones,
  ownedSilverStarterPacks,
  ownedGoldStarterPacks,
  ownedPlatinumStarterPacks,
  ownedCoachRecruitment,
  ownedOpeningLockerCashTier,
  ownedExtraDraftShuffle,
  ownedStarterPackChoicePlus,
  ownedRogueStarIds,
  ownedCollectionPlayerIds,
  rogueCollectedCollectionEntryIds,
  claimedCollectionRewardIds,
  completedRogueChallengeIds,
  claimedRogueChallengeIds,
  initialView = "store",
  onBuyTrainingCampTicket,
  onBuyTradePhone,
  onBuySilverStarterPack,
  onBuyGoldStarterPack,
  onBuyPlatinumStarterPack,
  onBuyCoachRecruitment,
  onBuyOpeningLockerCashUpgrade,
  onBuyExtraDraftShuffle,
  onBuyStarterPackChoicePlus,
  onBuyRogueStar,
  onBuyRoguePack,
  onEnsureRoguePackPullOwned,
  onClaimCollectionReward,
  onClaimRogueChallengeReward,
  onRunRogueChallenge,
  onClose,
}: TokenStoreOverlayProps) => {
  const [view, setView] = useState<TokenStoreView>(initialView);
  const [selectedCollectionFamily, setSelectedCollectionFamily] = useState<CollectionFamilyId | null>(null);
  const [tokenPacks, setTokenPacks] = useState<TokenPackProduct[]>(defaultTokenPackProducts);
  const [checkoutBusySlug, setCheckoutBusySlug] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [packReveal, setPackReveal] = useState<RoguePackPull | null>(null);
  const [purchasedPack, setPurchasedPack] = useState<RoguePackPull | null>(() => readPendingRoguePackPull());
  const [pendingPackPurchase, setPendingPackPurchase] = useState<RogueTokenStorePack | null>(null);
  const [packDetails, setPackDetails] = useState<RogueTokenStorePack | null>(null);
  const [packPurchaseBusy, setPackPurchaseBusy] = useState(false);
  const [packPurchaseMessage, setPackPurchaseMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const sTierPlayers = useMemo(() => getTokenStoreSPlayers(), []);
  const playerPriceMap = useMemo(() => getTokenStorePlayerPriceMap(), []);
  const starterVaultRotation = useMemo(() => getStarterVaultRotation(nowMs), [nowMs]);
  const ownedPackPlayerIds = useMemo(
    () => Array.from(new Set([...ownedRogueStarIds, ...ownedCollectionPlayerIds])),
    [ownedCollectionPlayerIds, ownedRogueStarIds],
  );
  const starterVaultCards = useMemo(() => getWeeklyStarterVaultCards(nowMs), [nowMs]);
  const starterVaultCountdown = formatVaultCountdown(starterVaultRotation.endsAt - nowMs);
  const collectionProgress = useMemo(
    () => buildCollectionProgress(rogueCollectedCollectionEntryIds),
    [rogueCollectedCollectionEntryIds],
  );
  const claimedRewardIds = useMemo(
    () => new Set(claimedCollectionRewardIds),
    [claimedCollectionRewardIds],
  );
  const completedChallengeIds = useMemo(
    () => new Set(completedRogueChallengeIds),
    [completedRogueChallengeIds],
  );
  const claimedChallengeIds = useMemo(
    () => new Set(claimedRogueChallengeIds),
    [claimedRogueChallengeIds],
  );
  const selectedCollection = selectedCollectionFamily
    ? collectionProgress.find((entry) => entry.family.id === selectedCollectionFamily) ?? null
    : null;
  const tokenStoreItemById = useMemo(
    () => new Map(tokenStoreUtilityItems.map((item) => [item.id, item])),
    [],
  );

  const startTokenPackCheckout = async (pack: TokenPackProduct) => {
    setCheckoutMessage(null);
    setCheckoutBusySlug(pack.slug);
    trackAnalyticsEventSoon("token_pack_clicked", {
      payload: {
        packSlug: pack.slug,
        packName: pack.name,
        tokenAmount: pack.tokenAmount,
        usdCents: pack.usdCents,
        checkoutReady: Boolean(pack.stripePriceId),
      },
    });
    trackAnalyticsEventSoon("checkout_started", {
      payload: {
        packSlug: pack.slug,
        tokenAmount: pack.tokenAmount,
        usdCents: pack.usdCents,
      },
    });

    const { checkoutUrl, error } = await createTokenPackCheckoutSession(pack.slug);

    if (checkoutUrl) {
      window.location.assign(checkoutUrl);
      return;
    }

    setCheckoutBusySlug(null);
    setCheckoutMessage(error ?? "Unable to open Stripe Checkout.");
  };

  useEffect(() => {
    setView(initialView);
    if (initialView !== "collections") {
      setSelectedCollectionFamily(null);
    }
  }, [initialView]);

  useEffect(() => {
    let cancelled = false;

    fetchActiveTokenPacks().then((packs) => {
      if (!cancelled) {
        setTokenPacks(packs);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!purchasedPack) return;
    onEnsureRoguePackPullOwned(purchasedPack.player.id);
  }, [onEnsureRoguePackPullOwned, purchasedPack]);

  const buyStoreItem = (
    itemId: string,
    price: number,
    buy: () => boolean | void,
    extraPayload: Record<string, unknown> = {},
  ) => {
    const purchased = buy();
    if (purchased === false) return;

    trackAnalyticsEventSoon("store_item_purchased", {
      payload: {
        itemId,
        price,
        tokenBalanceBefore: meta.tokens.balance,
        ...extraPayload,
      },
    });
  };

  const openRoguePack = (pack: RogueTokenStorePack) => {
    if (packPurchaseBusy) return;

    setPackPurchaseBusy(true);
    setPackPurchaseMessage(null);
    const player = onBuyRoguePack(pack.tier, pack.price);
    if (!player) {
      setPackPurchaseMessage(`Unable to open ${pack.name}. Check your token balance or try another tier.`);
      setPackPurchaseBusy(false);
      return;
    }

    const nextPackPull = { pack, player };
    savePendingRoguePackPull(nextPackPull);
    setPendingPackPurchase(null);
    setPurchasedPack(nextPackPull);
    setPackPurchaseBusy(false);
    trackAnalyticsEventSoon("store_item_purchased", {
      payload: {
        itemId: pack.id,
        price: pack.price,
        tier: pack.tier,
        playerId: player.id,
        playerName: player.name,
        tokenBalanceBefore: meta.tokens.balance,
      },
    });
  };

  const claimStoreReward = (
    rewardType: "collection" | "rogue_challenge",
    rewardId: string,
    claim: () => boolean,
  ) => {
    const claimed = claim();
    if (!claimed) return;

    trackAnalyticsEventSoon("store_reward_claimed", {
      payload: {
        rewardType,
        rewardId,
        tokenBalanceBefore: meta.tokens.balance,
      },
    });
  };

  const utilityCards = [
    {
      item: tokenStoreUtilityItems[0],
      owned: ownedTrainingCampTickets,
      onBuy: () => buyStoreItem(tokenStoreUtilityItems[0].id, tokenStoreUtilityItems[0].price, onBuyTrainingCampTicket),
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
      onBuy: () => buyStoreItem(tokenStoreUtilityItems[1].id, tokenStoreUtilityItems[1].price, onBuyTradePhone),
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
      onBuy: () => buyStoreItem(tokenStoreUtilityItems[2].id, tokenStoreUtilityItems[2].price, onBuySilverStarterPack),
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
      onBuy: () => buyStoreItem(tokenStoreUtilityItems[3].id, tokenStoreUtilityItems[3].price, onBuyGoldStarterPack),
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
      onBuy: () => buyStoreItem(tokenStoreUtilityItems[4].id, tokenStoreUtilityItems[4].price, onBuyPlatinumStarterPack),
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
      item: tokenStoreItemById.get("coach-recruitment")!,
      owned: ownedCoachRecruitment,
      onBuy: () => {
        const item = tokenStoreItemById.get("coach-recruitment")!;
        buyStoreItem(item.id, item.price, onBuyCoachRecruitment);
      },
      icon: Handshake,
      cardClass:
        "border-emerald-200/18 bg-[linear-gradient(135deg,rgba(21,94,72,0.3),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-emerald-200/20 bg-emerald-300/10 text-emerald-100",
      iconClass: "text-emerald-200",
      uplift: "Coach-Team Floor",
    },
    {
      item: tokenStoreItemById.get("opening-locker-cash-1")!,
      owned: ownedOpeningLockerCashTier,
      requiredTier: 1,
      onBuy: () => {
        const item = tokenStoreItemById.get("opening-locker-cash-1")!;
        buyStoreItem(item.id, item.price, () => onBuyOpeningLockerCashUpgrade(1, item.price), { tier: 1 });
      },
      icon: WalletCards,
      cardClass:
        "border-lime-200/18 bg-[linear-gradient(135deg,rgba(63,98,18,0.3),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-lime-200/20 bg-lime-300/10 text-lime-100",
      iconClass: "text-lime-200",
      uplift: "+3 Starting Cash",
    },
    {
      item: tokenStoreItemById.get("opening-locker-cash-2")!,
      owned: ownedOpeningLockerCashTier,
      requiredTier: 2,
      onBuy: () => {
        const item = tokenStoreItemById.get("opening-locker-cash-2")!;
        buyStoreItem(item.id, item.price, () => onBuyOpeningLockerCashUpgrade(2, item.price), { tier: 2 });
      },
      icon: WalletCards,
      cardClass:
        "border-lime-200/18 bg-[linear-gradient(135deg,rgba(77,124,15,0.34),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-lime-200/20 bg-lime-300/10 text-lime-100",
      iconClass: "text-lime-200",
      uplift: "+6 Starting Cash",
    },
    {
      item: tokenStoreItemById.get("opening-locker-cash-3")!,
      owned: ownedOpeningLockerCashTier,
      requiredTier: 3,
      onBuy: () => {
        const item = tokenStoreItemById.get("opening-locker-cash-3")!;
        buyStoreItem(item.id, item.price, () => onBuyOpeningLockerCashUpgrade(3, item.price), { tier: 3 });
      },
      icon: WalletCards,
      cardClass:
        "border-lime-200/18 bg-[linear-gradient(135deg,rgba(101,163,13,0.34),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-lime-200/20 bg-lime-300/10 text-lime-100",
      iconClass: "text-lime-200",
      uplift: "+10 Starting Cash",
    },
    {
      item: tokenStoreItemById.get("extra-draft-shuffle")!,
      owned: ownedExtraDraftShuffle,
      onBuy: () => {
        const item = tokenStoreItemById.get("extra-draft-shuffle")!;
        buyStoreItem(item.id, item.price, onBuyExtraDraftShuffle);
      },
      icon: RefreshCcw,
      cardClass:
        "border-violet-200/18 bg-[linear-gradient(135deg,rgba(91,33,182,0.3),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-violet-200/20 bg-violet-300/10 text-violet-100",
      iconClass: "text-violet-200",
      uplift: "+1 Run Shuffle",
    },
    {
      item: tokenStoreItemById.get("starter-pack-choice-plus")!,
      owned: ownedStarterPackChoicePlus,
      onBuy: () => {
        const item = tokenStoreItemById.get("starter-pack-choice-plus")!;
        buyStoreItem(item.id, item.price, onBuyStarterPackChoicePlus);
      },
      icon: Package2,
      cardClass:
        "border-amber-200/18 bg-[linear-gradient(135deg,rgba(146,64,14,0.32),rgba(9,13,24,0.92))]",
      badgeClass:
        "border-amber-200/20 bg-amber-300/10 text-amber-100",
      iconClass: "text-amber-200",
      uplift: "Reveal 4, Keep 3",
    },
  ];
  const orderedStarPlayers = useMemo(
    () =>
      [...sTierPlayers].sort((a, b) => {
        const orderDelta = getTokenStorePlayerOrder(a) - getTokenStorePlayerOrder(b);
        if (orderDelta !== 0) return orderDelta;
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
              Tokens turn progress into stronger Rogue runs. Buy run-only tools for the climb in front of you, unlock permanent upgrades for every future run, or open tier packs for permanent player cards.
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
            <div className="text-[10px] uppercase tracking-[0.22em] text-fuchsia-100/72">Owned Pack Cards</div>
            <div className="mt-2 text-4xl font-semibold text-white">{ownedCollectionPlayerIds.length}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[26px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(14,20,34,0.86))] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">What Tokens Buy</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Run-only tools", "Utility items you spend during one Rogue run."],
                ["Permanent power", "Upgrades that unlock once and help future runs."],
                ["Better openings", "Starter pack upgrades that improve your first cards."],
                ["Card packs", "Open tier packs for permanent player cards."],
              ].map(([title, detail]) => (
                <div key={title} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-300">{detail}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[26px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(8,13,24,0.9))] p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100/74">Best First Buy</div>
            <div className="mt-2 text-2xl font-semibold text-white">Training Camp Ticket</div>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Cheap, flexible, and useful in almost every run. Use it to turn one core player into a stronger boss-game answer.
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-[28px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(15,23,42,0.42),rgba(5,8,14,0.72))] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <button
              type="button"
              onClick={() => {
                setView("store");
                setSelectedCollectionFamily(null);
              }}
              className={`group grid min-h-[116px] min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[1fr_auto] items-center gap-x-4 gap-y-3 overflow-hidden rounded-[22px] border px-5 py-4 text-left transition ${
                view === "store"
                  ? "border-amber-100/38 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(120,53,15,0.28),rgba(15,23,42,0.72))] shadow-[0_14px_34px_rgba(245,158,11,0.14),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-white/8 bg-black/20 hover:border-amber-100/24 hover:bg-amber-300/8"
              }`}
            >
              <span className={`row-span-2 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${
                  view === "store"
                    ? "border-amber-100/30 bg-amber-200/16 text-amber-100"
                    : "border-white/10 bg-white/6 text-slate-300 group-hover:text-amber-100"
                }`}>
                  <Package2 size={20} />
              </span>
              <span className="min-w-0 self-end">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Spend Tokens</span>
                  <span className="mt-1 block text-2xl font-semibold leading-tight text-white">Rogue Power</span>
              </span>
              <span className={`w-fit max-w-full shrink-0 self-start rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                view === "store"
                  ? "border-amber-100/30 bg-amber-200/14 text-amber-100"
                  : "border-white/10 bg-white/6 text-slate-400"
              }`}>
                {view === "store" ? "Active" : "Open"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setView("vault");
                setSelectedCollectionFamily(null);
              }}
              className={`group grid min-h-[116px] min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[1fr_auto] items-center gap-x-4 gap-y-3 overflow-hidden rounded-[22px] border px-5 py-4 text-left transition ${
                view === "vault"
                  ? "border-violet-100/38 bg-[linear-gradient(135deg,rgba(167,139,250,0.22),rgba(56,189,248,0.18),rgba(15,23,42,0.72))] shadow-[0_14px_34px_rgba(139,92,246,0.14),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-white/8 bg-black/20 hover:border-violet-100/24 hover:bg-violet-300/8"
              }`}
            >
              <span className={`row-span-2 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${
                  view === "vault"
                    ? "border-violet-100/30 bg-violet-200/16 text-violet-100"
                    : "border-white/10 bg-white/6 text-slate-300 group-hover:text-violet-100"
                }`}>
                  <Sparkles size={20} />
              </span>
              <span className="min-w-0 self-end">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Player Packs</span>
                  <span className="mt-1 block text-2xl font-semibold leading-tight text-white">Card Packs</span>
              </span>
              <span className={`w-fit max-w-full shrink-0 self-start rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                view === "vault"
                  ? "border-violet-100/30 bg-violet-200/14 text-violet-100"
                  : "border-white/10 bg-white/6 text-slate-400"
              }`}>
                {view === "vault" ? "Active" : "Open"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setView("tokens");
                setSelectedCollectionFamily(null);
              }}
              className={`group grid min-h-[116px] min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[1fr_auto] items-center gap-x-4 gap-y-3 overflow-hidden rounded-[22px] border px-5 py-4 text-left transition ${
                view === "tokens"
                  ? "border-yellow-100/42 bg-[linear-gradient(135deg,rgba(250,204,21,0.24),rgba(21,94,117,0.22),rgba(15,23,42,0.72))] shadow-[0_14px_34px_rgba(250,204,21,0.14),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-white/8 bg-black/20 hover:border-yellow-100/24 hover:bg-yellow-300/8"
              }`}
            >
              <span className={`row-span-2 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${
                  view === "tokens"
                    ? "border-yellow-100/30 bg-yellow-200/16 text-yellow-100"
                    : "border-white/10 bg-white/6 text-slate-300 group-hover:text-yellow-100"
                }`}>
                  <CreditCard size={20} />
              </span>
              <span className="min-w-0 self-end">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Buy Tokens</span>
                  <span className="mt-1 block text-2xl font-semibold leading-tight text-white">Token Bundles</span>
              </span>
              <span className={`w-fit max-w-full shrink-0 self-start rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                view === "tokens"
                  ? "border-yellow-100/30 bg-yellow-200/14 text-yellow-100"
                  : "border-white/10 bg-white/6 text-slate-400"
              }`}>
                {view === "tokens" ? "Active" : "Open"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setView("collections")}
              className={`group grid min-h-[116px] min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[1fr_auto] items-center gap-x-4 gap-y-3 overflow-hidden rounded-[22px] border px-5 py-4 text-left transition ${
                view === "collections"
                  ? "border-emerald-100/38 bg-[linear-gradient(135deg,rgba(52,211,153,0.22),rgba(6,78,59,0.3),rgba(15,23,42,0.72))] shadow-[0_14px_34px_rgba(16,185,129,0.14),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-white/8 bg-black/20 hover:border-emerald-100/24 hover:bg-emerald-300/8"
              }`}
            >
              <span className={`row-span-2 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${
                  view === "collections"
                    ? "border-emerald-100/30 bg-emerald-200/16 text-emerald-100"
                    : "border-white/10 bg-white/6 text-slate-300 group-hover:text-emerald-100"
                }`}>
                  <Medal size={20} />
              </span>
              <span className="min-w-0 self-end">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Earn Tokens</span>
                  <span className="mt-1 block text-2xl font-semibold leading-tight text-white">Collections</span>
              </span>
              <span className={`w-fit max-w-full shrink-0 self-start rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                view === "collections"
                  ? "border-emerald-100/30 bg-emerald-200/14 text-emerald-100"
                  : "border-white/10 bg-white/6 text-slate-400"
              }`}>
                {view === "collections" ? "Active" : "Open"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setView("challenges");
                setSelectedCollectionFamily(null);
              }}
              className={`group grid min-h-[116px] min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[1fr_auto] items-center gap-x-4 gap-y-3 overflow-hidden rounded-[22px] border px-5 py-4 text-left transition ${
                view === "challenges"
                  ? "border-sky-100/38 bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(30,64,175,0.26),rgba(15,23,42,0.72))] shadow-[0_14px_34px_rgba(56,189,248,0.13),inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border-white/8 bg-black/20 hover:border-sky-100/24 hover:bg-sky-300/8"
              }`}
            >
              <span className={`row-span-2 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border ${
                  view === "challenges"
                    ? "border-sky-100/30 bg-sky-200/16 text-sky-100"
                    : "border-white/10 bg-white/6 text-slate-300 group-hover:text-sky-100"
                }`}>
                  <Trophy size={20} />
              </span>
              <span className="min-w-0 self-end">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Token Goals</span>
                  <span className="mt-1 block text-2xl font-semibold leading-tight text-white">Challenges</span>
              </span>
              <span className={`w-fit max-w-full shrink-0 self-start rounded-full border px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                view === "challenges"
                  ? "border-sky-100/30 bg-sky-200/14 text-sky-100"
                  : "border-white/10 bg-white/6 text-slate-400"
              }`}>
                {view === "challenges" ? "Active" : "Open"}
              </span>
            </button>
          </div>
        </div>

        {view === "store" ? (
          <>
        <div className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                <Sparkles size={14} className="text-sky-200" />
                Run-Only Items
              </div>
              <div className="mt-2 text-sm leading-7 text-slate-300">
                Bought with tokens, then spent during a single Rogue run when the matchup demands it.
              </div>
            </div>
            <div className="w-fit rounded-full border border-sky-200/16 bg-sky-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
              Best for right now
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {utilityCards.map(({ item, owned, onBuy, icon: Icon, cardClass, badgeClass, iconClass }) => (
              <div key={item.id} className={`rounded-[28px] border p-5 ${cardClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xl font-semibold text-white">
                      <Icon size={18} className={iconClass} />
                      {item.title}
                      {item.id === BEST_FIRST_PURCHASE_ID ? (
                        <span className="rounded-full border border-emerald-200/20 bg-emerald-300/12 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                          Best First Buy
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-300">{item.description}</div>
                    <div className="mt-3 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                      Run-only
                    </div>
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
            Unlock once, then every future Rogue run starts with more agency, more cash, or more control.
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rogueUpgradeCards.map(({ item, owned, requiredTier, onBuy, icon: Icon, cardClass, badgeClass, iconClass, uplift }) => {
              const unlocked = typeof requiredTier === "number" ? owned >= requiredTier : owned > 0;
              const prerequisiteLocked = typeof requiredTier === "number" && owned !== requiredTier - 1 && !unlocked;

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
                      <div className="mt-3 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                        Permanent
                      </div>
                    </div>
                  <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClass}`}>
                      {unlocked ? "Owned" : prerequisiteLocked ? "Tier Locked" : "Locked"}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-2xl font-semibold text-white">{formatNumber(item.price)}</div>
                    <button
                      type="button"
                      onClick={onBuy}
                      disabled={unlocked || prerequisiteLocked || meta.tokens.balance < item.price}
                      className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/48 sm:w-auto sm:py-2.5"
                    >
                      {unlocked ? "Owned" : prerequisiteLocked ? "Unlock Previous Tier" : "Unlock"}
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
            Unlock once to improve the opening cards offered at the start of future Rogue runs.
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
                    <div className="mt-3 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                      Permanent Opening
                    </div>
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
          </>
        ) : view === "vault" ? (
          <div className="mt-8 space-y-7">
            <div className="overflow-hidden rounded-[30px] border border-violet-200/18 bg-[linear-gradient(135deg,rgba(88,28,135,0.24),rgba(14,116,144,0.14),rgba(8,13,24,0.94))] p-6 shadow-[0_22px_54px_rgba(0,0,0,0.3)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-violet-100/78">
                    <Package2 size={15} />
                    Rogue Card Packs
                  </div>
                  <h3 className="mt-3 font-display text-3xl text-white">Open one permanent player card from the named tier</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200/88">
                    Each pack opens immediately. The pull is random, duplicate-protected, and limited to the exact pack tier.
                  </p>
                </div>
                <div className="grid gap-3 lg:min-w-[360px] xl:min-w-[460px] xl:grid-cols-2">
                  <div className="min-w-0 overflow-hidden rounded-[22px] border border-white/10 bg-black/24 px-5 py-4">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Pack Types</div>
                    <div className="mt-1 text-3xl font-semibold text-white">{ROGUE_TOKEN_STORE_PACKS.length}</div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-black/24 px-5 py-4">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Each Pack</div>
                    <div className="mt-1 text-3xl font-semibold text-white">1 Card</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {packPurchaseMessage ? (
                <div className="sm:col-span-2 xl:col-span-3 2xl:col-span-5 rounded-[22px] border border-rose-300/18 bg-rose-300/10 px-4 py-3 text-sm font-semibold text-rose-100">
                  {packPurchaseMessage}
                </div>
              ) : null}
              {ROGUE_TOKEN_STORE_PACKS.map((pack) => {
                const remaining = getRoguePackPlayerPool(pack.tier, ownedPackPlayerIds).length;

                return (
                  <RoguePackStoreCard
                    key={pack.id}
                    pack={pack}
                    remaining={remaining}
                    canAfford={meta.tokens.balance >= pack.price}
                    onOpen={() => {
                      setPackPurchaseMessage(null);
                      setPackPurchaseBusy(false);
                      setPendingPackPurchase(pack);
                    }}
                    onAbout={() => setPackDetails(pack)}
                  />
                );
              })}
            </div>
          </div>
        ) : view === "tokens" ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-[28px] border border-yellow-200/18 bg-[linear-gradient(135deg,rgba(250,204,21,0.14),rgba(8,13,24,0.94))] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-yellow-100/74">
                    <CreditCard size={15} />
                    Buy Tokens
                  </div>
                  <h3 className="mt-3 font-display text-3xl text-white">Add tokens when you want faster Rogue progress</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200/88">
                    Buy token bundles to unlock permanent Rogue upgrades, stack run-only tools, or open tier packs for permanent player cards. Stripe handles checkout, and tokens are credited after the purchase is confirmed.
                  </p>
                  {checkoutMessage ? (
                    <div className="mt-4 rounded-2xl border border-rose-300/18 bg-rose-300/10 px-4 py-3 text-sm font-semibold text-rose-100">
                      {checkoutMessage}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/24 px-5 py-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Available Bundles</div>
                  <div className="mt-1 text-3xl font-semibold text-white">{tokenPacks.length}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tokenPacks.map((pack) => (
                <TokenPackCard
                  key={pack.slug}
                  pack={pack}
                  busy={checkoutBusySlug === pack.slug}
                  onCheckout={() => void startTokenPackCheckout(pack)}
                />
              ))}
            </div>
          </div>
        ) : view === "collections" ? (
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
                              claimStoreReward("collection", entry.family.id, () => onClaimCollectionReward(entry.family.id));
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
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-sky-300/14 bg-sky-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-sky-100/70">Rogue Challenges</div>
                <div className="mt-2 text-3xl font-semibold text-white">{ROGUE_CHALLENGES.length}</div>
                <div className="mt-2 text-sm text-slate-200">
                  One-time Rogue achievements that can be completed naturally during runs.
                </div>
              </div>
              <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Completed</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {completedChallengeIds.size} / {ROGUE_CHALLENGES.length}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Completed challenges stay ready until their reward is claimed.
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Claimed Rewards</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {claimedChallengeIds.size} / {ROGUE_CHALLENGES.length}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Claimed challenge rewards are permanent token-bank and coach-card bonuses.
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {ROGUE_CHALLENGES.map((challenge) => {
                const completed = completedChallengeIds.has(challenge.id);
                const claimed = claimedChallengeIds.has(challenge.id);
                const canClaim = completed && !claimed;
                const rewardCoach = getRoguelikeCoachById(challenge.rewardCoachId);
                const challengeTeam = challenge.requiredTeamName
                  ? getNbaTeamByName(challenge.requiredTeamName)
                  : null;

                return (
                  <div
                    key={challenge.id}
                    className={`rounded-[28px] border p-6 ${
                      claimed
                        ? "border-emerald-300/18 bg-emerald-300/8"
                        : completed
                          ? "border-amber-200/24 bg-amber-300/10 shadow-[0_16px_42px_rgba(245,158,11,0.12)]"
                          : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-2xl border p-3 ${
                          completed
                            ? "border-amber-200/24 bg-amber-300/12 text-amber-100"
                            : "border-white/12 bg-black/20 text-slate-300"
                        }`}>
                          {challengeTeam?.logo ? (
                            <img
                              src={challengeTeam.logo}
                              alt=""
                              className="h-[22px] w-[22px] object-contain"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Trophy size={22} />
                          )}
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Rogue Challenge</div>
                          <div className="mt-1 text-2xl font-semibold text-white">{challenge.title}</div>
                        </div>
                      </div>
                      <div className={`shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                        claimed
                          ? "border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                          : completed
                            ? "border-amber-200/24 bg-amber-300/12 text-amber-100"
                            : "border-white/10 bg-black/20 text-slate-300"
                      }`}>
                        {claimed ? "Claimed" : completed ? "Complete" : "Locked"}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-100/88">{challenge.description}</p>
                    <div className="mt-4 rounded-[20px] border border-white/10 bg-black/18 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Requirement</div>
                      <div className="mt-1 text-sm font-semibold text-white">{challenge.requirement}</div>
                      {rewardCoach ? (
                        <div className="mt-2 text-sm font-semibold text-sky-100">
                          Coach reward: {rewardCoach.name}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Reward</div>
                        <div className="mt-1 text-3xl font-semibold text-white">{formatNumber(challenge.reward)}</div>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <button
                          type="button"
                          onClick={() => onRunRogueChallenge(challenge.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200/28 bg-sky-300/12 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-50 transition hover:scale-[1.02] hover:bg-sky-300/18"
                        >
                          Run Challenge
                          <ArrowLeft size={14} className="rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => claimStoreReward("rogue_challenge", challenge.id, () => onClaimRogueChallengeReward(challenge.id))}
                          disabled={!canClaim}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/18 disabled:text-white/46"
                        >
                          {claimed ? (
                            <>
                              <CheckCircle2 size={14} />
                              Claimed
                            </>
                          ) : canClaim ? (
                            `Claim ${formatNumber(challenge.reward)}`
                          ) : (
                            "Locked"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const packModals = (
    <>
      {packReveal ? (
        <PackOpeningOverlay
          pack={packReveal.pack}
          player={packReveal.player}
          onClose={() => {
            clearPendingRoguePackPull();
            setPackReveal(null);
          }}
        />
      ) : null}
      {purchasedPack ? (
        <PurchasedPackOverlay
          pack={purchasedPack.pack}
          onOpen={() => {
            setPackReveal(purchasedPack);
            setPurchasedPack(null);
          }}
        />
      ) : null}
      {pendingPackPurchase ? (
        <PackPurchaseConfirmOverlay
          pack={pendingPackPurchase}
          tokenBalance={meta.tokens.balance}
          remaining={getRoguePackPlayerPool(pendingPackPurchase.tier, ownedPackPlayerIds).length}
          confirming={packPurchaseBusy}
          onCancel={() => {
            if (packPurchaseBusy) return;
            setPendingPackPurchase(null);
          }}
          onConfirm={() => openRoguePack(pendingPackPurchase)}
        />
      ) : null}
      {packDetails ? (
        <PackDetailsOverlay
          pack={packDetails}
          possiblePlayers={getRoguePackPlayerPool(packDetails.tier, ownedPackPlayerIds)}
          totalTierPlayers={getRoguePackPlayerPool(packDetails.tier).length}
          ownedCount={getRoguePackPlayerPool(packDetails.tier).length - getRoguePackPlayerPool(packDetails.tier, ownedPackPlayerIds).length}
          onClose={() => setPackDetails(null)}
        />
      ) : null}
    </>
  );

  return createPortal(
    <>
      {overlay}
      {packModals}
    </>,
    document.body,
  );
};
