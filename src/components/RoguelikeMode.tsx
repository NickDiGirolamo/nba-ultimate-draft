import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Coins,
  Crown,
  GripHorizontal,
  Package2,
  RefreshCcw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { DraftPlayerCard } from "./DraftPlayerCard";
import { DynamicDuoBadge } from "./DynamicDuoBadge";
import { PlayerSynergyBadges } from "./PlayerSynergyBadges";
import { usePlayerImage } from "../hooks/usePlayerImage";
import { allPlayers } from "../data/players";
import { assignPlayerToRoster } from "../lib/draft";
import { getPlayerDisplayLines } from "../lib/playerDisplay";
import { getPlayerTier, getPlayerTierLabel } from "../lib/playerTier";
import {
  buildRoguelikeOpponentLineup,
  buildOpeningDraftPool,
  doesRoguelikeNodeAwardClearRewards,
  getRoguelikeClearRewards,
  getRoguelikeFailureRewards,
  buildRoguelikeStarterLineup,
  buildStarterPool,
  drawRoguelikeStarterRevealPlayers,
  drawRoguelikeChoices,
  getRoguelikeAdjustedDefenseForSlot,
  getRoguelikeEvolutionOptions,
  getRoguelikeEvolutionRewardPool,
  getRoguelikeAdjustedOffenseForSlot,
  getRoguelikeAdjustedReboundingForSlot,
  evaluateRoguelikeLineup,
  evaluateRoguelikeRoster,
  buildPreviewRoster,
  getRoguelikeAdjustedOverallForSlot,
  getRoguelikeSlotPenalty,
  generateFaceoffOpponentPlayerIds,
  getBundle,
  RoguelikeClearRewards,
  RoguelikeFaceoffMatchup,
  RoguelikeFaceoffResult,
  RoguelikeFailureRewards,
  RoguelikeNode,
  RoguelikeStarterPackageId,
  roguelikeNodes,
  roguelikeStarterPackages,
  resolveRoguelikeNode,
  unlockBundlePlayers,
} from "../lib/roguelike";
import { Player, PlayerTier, Position, RosterSlot } from "../types";
import type { RoguePersonalBests } from "../types";

type RoguelikeStage =
  | "package-select"
  | "starter-reveal"
  | "ladder-overview"
  | "initial-draft"
  | "challenge-setup"
  | "add-position-select"
  | "all-star-select"
  | "roster-cut-select"
  | "training-select"
  | "trade-offer"
  | "trade-select"
  | "reward-replace-select"
  | "evolution-select"
  | "faceoff-setup"
  | "faceoff-game"
  | "node-preview"
  | "reward-draft"
  | "node-result"
  | "run-over"
  | "run-cleared";

interface RoguelikeRun {
  seed: number;
  packageId: RoguelikeStarterPackageId;
  roster: Player[];
  lineup: RosterSlot[];
  availablePool: Player[];
  seenChoicePlayerIds: string[];
  choices: Player[];
  starterRevealPlayers: Player[];
  revealedStarterIds: string[];
  pendingRewardPlayer?: Player | null;
  lives: number;
  floorIndex: number;
  initialPicks: number;
  draftShuffleTickets: number;
  unlockedBundleIds: string[];
  trainedPlayerIds: string[];
  selectedCutPlayerIds: string[];
  selectedNaturalPositionPlayerId: string | null;
  selectedNaturalPosition: Position | null;
  allStarAssignments: {
    dunkContest: string | null;
    threePointContest: string | null;
    skillsChallenge: string | null;
  };
  utilityReturnState?: {
    stage: RoguelikeStage;
    activeNode: RoguelikeNode | null;
    activeOpponentPlayerIds: string[] | null;
    nodeResult: RoguelikeRun["nodeResult"] | null;
  } | null;
  failureReviewStage?: RoguelikeStage | null;
  stage: RoguelikeStage;
  activeNode: RoguelikeNode | null;
  activeOpponentPlayerIds: string[] | null;
  nodeResult: {
    title: string;
    detail: string;
    passed?: boolean;
    faceoffResult?: RoguelikeFaceoffResult | null;
    failureRewards?: RoguelikeFailureRewards | null;
  } | null;
}

interface RoguelikeModeProps {
  activeRogueStarId: string | null;
  ownedTrainingCampTickets: number;
  ownedTradePhones: number;
  ownedSilverStarterPacks: number;
  ownedGoldStarterPacks: number;
  ownedPlatinumStarterPacks: number;
  onLeaveRun: () => void;
  onBackToHome: () => void;
  onAwardFailureRewards: (prestigeXpAward: number) => void;
  onUpdatePersonalBests: (nextValues: Partial<RoguePersonalBests>) => void;
  onUseTrainingCampTicket: () => boolean;
  onUseTradePhone: () => boolean;
  onUseSilverStarterPack: () => boolean;
  onUseGoldStarterPack: () => boolean;
  onUsePlatinumStarterPack: () => boolean;
}

const ROGUELIKE_STORAGE_KEY = "legends-draft-roguelike-run-v1";
const ROGUELIKE_PARKED_STORAGE_KEY = "legends-draft-roguelike-parked-v1";

const createSeed = () => Math.floor(Date.now() % 1_000_000) + Math.floor(Math.random() * 1000);

const nextChoiceSeed = (seed: number, step: number) => seed + step * 97 + 13;

const STORE_TRAINING_NODE: RoguelikeNode = {
  id: "store-training-camp",
  floor: 0,
  act: 0,
  type: "training",
  title: "Training Camp Ticket",
  description: "Send one player from your Rogue roster to training camp for a +1 OVR boost for the rest of the run.",
  rewardBundleId: "elite-closers",
  rewardChoices: 0,
  targetLabel: "Select 1 player to gain +1 OVR for the rest of the run",
};

const STORE_TRADE_NODE: RoguelikeNode = {
  id: "store-trade-phone",
  floor: 0,
  act: 0,
  type: "trade",
  title: "Trade Phone",
  description: "Trade away one player from your Rogue roster and choose 1 replacement from a fresh 1-of-5 board.",
  rewardBundleId: "elite-closers",
  rewardChoices: 5,
  targetLabel: "Trade 1 player, then draft 1 replacement from 5 options",
};

const getPlayerById = (playerId: string | null) =>
  (playerId ? allPlayers.find((player) => player.id === playerId) ?? null : null);

const injectActiveRogueStarIntoReveal = (starterRevealPlayers: Player[], activeRogueStar: Player | null) => {
  if (!activeRogueStar) return starterRevealPlayers;
  if (starterRevealPlayers.some((player) => player.id === activeRogueStar.id)) {
    return starterRevealPlayers;
  }

  const nextRevealPlayers = [...starterRevealPlayers];
  const replaceIndex = nextRevealPlayers.reduce(
    (lowestIndex, player, index, players) =>
      player.overall < players[lowestIndex].overall ? index : lowestIndex,
    0,
  );
  nextRevealPlayers[replaceIndex] = activeRogueStar;
  return nextRevealPlayers;
};

const getStarterPackAverageForUpgrade = (upgrade: "standard" | "silver" | "gold" | "platinum") => {
  if (upgrade === "silver") return 84;
  if (upgrade === "gold") return 85;
  if (upgrade === "platinum") return 86;
  return 80;
};

const getRevealedStarterPlayers = (run: RoguelikeRun) => {
  const revealedPlayers = run.starterRevealPlayers.filter((player) =>
    run.revealedStarterIds.includes(player.id),
  );
  return revealedPlayers.length > 0 ? revealedPlayers : run.starterRevealPlayers;
};

const buildRevealedStarterRosterState = (run: RoguelikeRun, revealedStarterIds: string[]) => {
  const revealedPlayers = run.starterRevealPlayers.filter((player) => revealedStarterIds.includes(player.id));
  return {
    roster: revealedPlayers,
    lineup: buildRoguelikeStarterLineup(revealedPlayers),
  };
};

const getRunOwnedPlayers = (run: RoguelikeRun) => {
  const ownedPlayers = [...run.roster, ...run.lineup.map((slot) => slot.player).filter((player): player is Player => Boolean(player))];
  const seen = new Set<string>();

  return ownedPlayers.filter((player) => {
    if (seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
};

const getTrainingCountForPlayer = (playerId: string, trainedPlayerIds: string[] = []) =>
  trainedPlayerIds.filter((trainedPlayerId) => trainedPlayerId === playerId).length;

const getRunDisplayPlayer = (player: Player, trainedPlayerIds: string[] = []) => {
  const trainingCount = getTrainingCountForPlayer(player.id, trainedPlayerIds);
  if (trainingCount === 0) return player;

  return {
    ...player,
    overall: player.overall + trainingCount,
    offense: player.offense + trainingCount,
    defense: player.defense + trainingCount,
    playmaking: player.playmaking + trainingCount,
    shooting: player.shooting + trainingCount,
    rebounding: player.rebounding + trainingCount,
    athleticism: player.athleticism + trainingCount,
    intangibles: player.intangibles + trainingCount,
    ballDominance: player.ballDominance + trainingCount,
    interiorDefense: player.interiorDefense + trainingCount,
    perimeterDefense: player.perimeterDefense + trainingCount,
  };
};

const getEarlyRunRosterState = (run: RoguelikeRun) => {
  const starterPlayers = getRevealedStarterPlayers(run);
  const draftedPlayers = run.roster.filter(
    (player) => !starterPlayers.some((starter) => starter.id === player.id),
  );
  const ownedPlayers = [...starterPlayers, ...draftedPlayers];

  return {
    ownedPlayers,
    lineup: buildRoguelikeStarterLineup(ownedPlayers),
  };
};

const compactBenchSlots = (lineup: RosterSlot[]) => {
  if (lineup.length <= 5) return lineup;

  const starters: RosterSlot[] = lineup.slice(0, 5).map((slot) => ({ ...slot }));
  const benchTemplate: RosterSlot[] = lineup.slice(5).map((slot) => ({ ...slot, player: null }));
  const benchPlayers = lineup.slice(5)
    .map((slot) => slot.player)
    .filter((player): player is Player => Boolean(player));

  benchPlayers.forEach((player, index) => {
    if (benchTemplate[index]) {
      benchTemplate[index] = { ...benchTemplate[index], player };
    }
  });

  return [...starters, ...benchTemplate];
};

const hydrateRunLineup = (run: RoguelikeRun, ownedPlayers: Player[]) => {
  const playerById = new Map(ownedPlayers.map((player) => [player.id, player]));
  const hasPlacedPlayers = run.lineup.some((slot) => Boolean(slot.player));

  if (!hasPlacedPlayers) {
    const hydratedLineup = ownedPlayers.length <= 5
      ? buildRoguelikeStarterLineup(ownedPlayers)
      : ownedPlayers.reduce(
          (currentLineup, player) => assignPlayerToRoster(currentLineup, player).roster,
          buildRoguelikeStarterLineup(ownedPlayers),
        );
    return compactBenchSlots(hydratedLineup);
  }

  const placedPlayerIds = new Set<string>();
  const syncedLineup = run.lineup.map((slot) => {
    const hydratedPlayer = slot.player ? playerById.get(slot.player.id) ?? null : null;
    if (hydratedPlayer) {
      placedPlayerIds.add(hydratedPlayer.id);
    }

    return {
      ...slot,
      player: hydratedPlayer,
    };
  });

  const unplacedPlayers = ownedPlayers.filter((player) => !placedPlayerIds.has(player.id));
  const hydratedLineup = unplacedPlayers.reduce(
    (currentLineup, player) => assignPlayerToRoster(currentLineup, player).roster,
    syncedLineup,
  );
  return compactBenchSlots(hydratedLineup);
};

const getHydratedRun = (run: RoguelikeRun) => {
  const normalizedRun =
    run.stage === "node-preview"
      ? {
          ...run,
          stage: "ladder-overview" as RoguelikeStage,
          activeNode: null,
          activeOpponentPlayerIds: null,
        }
      : run;
  const shouldHydrateEarlyRunDisplay =
    !normalizedRun.unlockedBundleIds.includes("synergy-hunters") &&
    ["ladder-overview", "initial-draft", "faceoff-setup", "faceoff-game"].includes(normalizedRun.stage);

  const hydratedOwnedPlayers = shouldHydrateEarlyRunDisplay
    ? normalizedRun.roster.length > 0
      ? normalizedRun.roster
      : getEarlyRunRosterState(normalizedRun).ownedPlayers
    : normalizedRun.roster;

  if (hydratedOwnedPlayers.length === 0) {
    return normalizedRun;
  }

  return {
    ...normalizedRun,
    roster: hydratedOwnedPlayers,
    lineup: hydrateRunLineup(normalizedRun, hydratedOwnedPlayers),
  };
};

const restoreUtilityReturnState = (run: RoguelikeRun, fallbackStage: RoguelikeStage = "ladder-overview") => {
  if (!run.utilityReturnState) {
    return {
      ...run,
      stage: fallbackStage,
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
      utilityReturnState: null,
    };
  }

  return {
    ...run,
    stage: run.utilityReturnState.stage,
    activeNode: run.utilityReturnState.activeNode,
    activeOpponentPlayerIds: run.utilityReturnState.activeOpponentPlayerIds,
    nodeResult: run.utilityReturnState.nodeResult,
    utilityReturnState: null,
  };
};

const getNodeChoiceTiers = (node: RoguelikeNode) => {
  return node.allowedRewardTiers;
};

const getNodePlayerPool = (node: RoguelikeNode | null, pool: Player[]) => {
  const applyNodeFilters = (source: Player[]) =>
    source
      .filter((player) => (node?.playerPoolMode === "current-season" ? player.era === "2025-26" : true))
      .filter((player) =>
        node?.allowedRewardTiers?.length ? node.allowedRewardTiers.includes(getPlayerTier(player)) : true,
      );

  const filteredPool = applyNodeFilters(pool);
  if (!node) return filteredPool;

  const fallbackPool = applyNodeFilters(allPlayers);
  const seenIds = new Set<string>();

  return [...filteredPool, ...fallbackPool].filter((player) => {
    if (seenIds.has(player.id)) return false;
    seenIds.add(player.id);
    return true;
  });
};

const shouldStrictlyUseNodePool = (node: RoguelikeNode | null) =>
  node?.playerPoolMode === "current-season";

const getActHeading = (act: number) => {
  if (act === 1) return "Act 1 Climb";
  if (act === 2) return "Act 2 Push";
  if (act === 3) return "Act 3 Pressure";
  return "Act 4 Finals";
};

const getActDescription = (act: number) => {
  if (act === 1) {
    return "Build the first real version of your team, survive the early checks, and reach the opening playoff gate.";
  }
  if (act === 2) {
    return "The roster starts widening here. Rebounding, training, and cleaner rotation decisions begin to matter more.";
  }
  if (act === 3) {
    return "This is the tightening phase. Defensive structure, evolution upgrades, and sharper lineup choices decide whether the run can contend.";
  }
  return "Only the strongest builds survive the finals stretch. Every node now needs to feel worthy of a championship run.";
};

const getActLadderTheme = (act: number) => {
  if (act === 1) {
    return {
      accent: "bg-fuchsia-300",
      shell: "border-fuchsia-200/14 bg-[linear-gradient(135deg,rgba(58,29,77,0.26),rgba(24,20,35,0.94),rgba(10,10,16,0.98))]",
      current: "border-fuchsia-200/26 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(58,29,77,0.94),rgba(14,10,22,0.98))] shadow-[0_18px_40px_rgba(192,132,252,0.12)]",
      eyebrow: "text-fuchsia-100/82",
      target: "border-fuchsia-200/22 bg-[linear-gradient(135deg,rgba(192,132,252,0.16),rgba(15,23,42,0.84),rgba(88,28,135,0.14))] text-fuchsia-50",
      reward: "border-fuchsia-200/14 bg-fuchsia-300/8 text-fuchsia-50/92",
    };
  }
  if (act === 2) {
    return {
      accent: "bg-sky-300",
      shell: "border-sky-200/14 bg-[linear-gradient(135deg,rgba(16,55,90,0.26),rgba(20,24,35,0.94),rgba(10,10,16,0.98))]",
      current: "border-sky-200/26 bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(16,55,90,0.94),rgba(10,16,26,0.98))] shadow-[0_18px_40px_rgba(56,189,248,0.12)]",
      eyebrow: "text-sky-100/82",
      target: "border-sky-200/22 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(15,23,42,0.84),rgba(14,116,144,0.14))] text-sky-50",
      reward: "border-sky-200/14 bg-sky-300/8 text-sky-50/92",
    };
  }
  if (act === 3) {
    return {
      accent: "bg-amber-300",
      shell: "border-amber-200/14 bg-[linear-gradient(135deg,rgba(97,54,14,0.24),rgba(24,22,19,0.94),rgba(10,10,16,0.98))]",
      current: "border-amber-200/26 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(97,54,14,0.92),rgba(20,14,10,0.98))] shadow-[0_18px_40px_rgba(245,158,11,0.12)]",
      eyebrow: "text-amber-100/82",
      target: "border-amber-200/22 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(15,23,42,0.84),rgba(146,64,14,0.14))] text-amber-50",
      reward: "border-amber-200/14 bg-amber-300/8 text-amber-50/92",
    };
  }
  return {
    accent: "bg-emerald-300",
    shell: "border-emerald-200/14 bg-[linear-gradient(135deg,rgba(10,84,68,0.24),rgba(18,24,24,0.94),rgba(10,10,16,0.98))]",
    current: "border-emerald-200/26 bg-[linear-gradient(135deg,rgba(52,211,153,0.18),rgba(10,84,68,0.92),rgba(10,18,16,0.98))] shadow-[0_18px_40px_rgba(16,185,129,0.12)]",
    eyebrow: "text-emerald-100/82",
    target: "border-emerald-200/22 bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(15,23,42,0.84),rgba(6,78,59,0.14))] text-emerald-50",
    reward: "border-emerald-200/14 bg-emerald-300/8 text-emerald-50/92",
  };
};

const drawRunChoices = (
  run: RoguelikeRun,
  pool: Player[],
  roster: Player[],
  count: number,
  seed: number,
  allowedTiers?: PlayerTier[],
  strictPool = false,
) => {
  const seenChoicePlayerIds = run.seenChoicePlayerIds ?? [];
  let choices = drawRoguelikeChoices(
    pool,
    roster,
    count,
    seed,
    allowedTiers,
    seenChoicePlayerIds,
    strictPool ? pool : undefined,
  );

  // Never strand a run on an empty reward board. Prefer the intended tier band first,
  // then relax repeat restrictions before finally broadening the tier filter.
  if (choices.length < count && allowedTiers) {
    choices = drawRoguelikeChoices(
      pool,
      roster,
      count,
      seed + 1,
      allowedTiers,
      [],
      strictPool ? pool : undefined,
    );
  }

  if (choices.length < count) {
    choices = drawRoguelikeChoices(
      pool,
      roster,
      count,
      seed + 2,
      undefined,
      seenChoicePlayerIds,
      strictPool ? pool : undefined,
    );
  }

  if (choices.length < count) {
    choices = drawRoguelikeChoices(
      pool,
      roster,
      count,
      seed + 3,
      undefined,
      [],
      strictPool ? pool : undefined,
    );
  }

  return {
    choices,
    seenChoicePlayerIds: Array.from(new Set([...seenChoicePlayerIds, ...choices.map((player) => player.id)])),
  };
};

const getRewardDraftPool = (run: RoguelikeRun, node: RoguelikeNode, expandedPool: Player[]) => {
  if (node.id === "act-one-boss" || node.id === "act-one-boss-current") {
    return getRoguelikeEvolutionRewardPool().filter(
      (player) =>
        getPlayerTier(player) === "B" &&
        (node.playerPoolMode !== "current-season" || player.era === "2025-26"),
    );
  }

  return getNodePlayerPool(node, expandedPool);
};

const getNodeCompletionRewardCopy = (node: RoguelikeNode) => {
  const nodeChoiceTiers = getNodeChoiceTiers(node);
  const tierLabel =
    nodeChoiceTiers?.length === 2
      ? `${nodeChoiceTiers[0]} or ${nodeChoiceTiers[1]} tier`
      : nodeChoiceTiers?.length === 1
        ? `${nodeChoiceTiers[0]}-tier`
        : "reward";

  if (node.type === "training") {
    return {
      title: "Training boost",
      description: "Choose 1 player from your run roster to gain +1 OVR for the rest of the run.",
    };
  }

  if (node.type === "trade") {
    return {
      title: "Trade opportunity",
      description: "You may trade away 1 player and then choose 1 replacement from a fresh 5-player board.",
    };
  }

  if (node.type === "evolution") {
    return {
      title: "Evolution upgrade",
      description:
        "Upgrade 1 eligible version player on your roster into their next stronger version. If none are eligible, this converts into 1 Draft Shuffle ticket.",
    };
  }

  if ((node.draftShuffleReward ?? 0) > 0 && node.rewardChoices === 0) {
    return {
      title: "Draft Shuffle ticket",
      description: `Earn ${node.draftShuffleReward} Draft Shuffle ticket${(node.draftShuffleReward ?? 0) > 1 ? "s" : ""} to reroll a live 5-player draft board later in this run.`,
    };
  }

  if (node.id === "act-one-faceoff" || node.id === "act-one-faceoff-current") {
    return {
      title: "Bench unlock + reward draft",
      description:
        "Open the Bench 1 slot, add Synergy Hunters to your run pool, and choose 1 of 5 B-tier players for your run roster.",
    };
  }

  if (node.id === "act-one-boss" || node.id === "act-one-boss-current") {
    return {
      title: "Version player reward",
      description:
        "Choose 1 of 3 B-tier version players, each being the lower version of a player that can evolve into a stronger version later in the run.",
    };
  }

  if (node.rewardChoices > 0) {
    return {
      title: "Reward draft",
      description: `Add ${getBundle(node.rewardBundleId).title} to your run pool and choose 1 of ${node.rewardChoices} ${tierLabel} players for your run roster.`,
    };
  }

  return {
    title: getBundle(node.rewardBundleId).title,
    description: getBundle(node.rewardBundleId).description,
  };
};

const BackToRunLadderButton = ({ onClick, className = "mt-6" }: { onClick: () => void; className?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      className,
      "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10",
    )}
  >
    Back to Run Ladder
  </button>
);

const getRogueSlotLabel = (slot: RosterSlot, index: number) => {
  if (slot.slot === "UTIL") return index === 8 ? "Util 1" : "Util 2";
  if (index === 5) return "Bench 1";
  if (index === 6) return "Backup G/F";
  if (index === 7) return "Backup F/C";
  return slot.slot;
};

const getChallengeMetricLabel = (metric: "overall" | "offense" | "defense" | "chemistry" | "rebounding") => {
  if (metric === "overall") return "OVR";
  if (metric === "offense") return "OFF";
  if (metric === "defense") return "DEF";
  if (metric === "rebounding") return "REB";
  return "CHEM";
};

const getAverageAdjustedOffense = (
  lineup: RosterSlot[],
  ownedPlayerIds: string[],
  trainedPlayerIds: string[],
) => {
  const filledSlots = lineup.filter((slot) => Boolean(slot.player));
  if (filledSlots.length === 0) return 0;

  return (
    Math.round(
      (filledSlots.reduce(
        (sum, slot) => sum + getRoguelikeAdjustedOffenseForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds),
        0,
      ) /
        filledSlots.length) *
        10,
    ) / 10
  );
};

const getAverageAdjustedRebounding = (
  lineup: RosterSlot[],
  ownedPlayerIds: string[],
  trainedPlayerIds: string[],
) => {
  const filledSlots = lineup.filter((slot) => Boolean(slot.player));
  if (filledSlots.length === 0) return 0;

  return (
    Math.round(
      (filledSlots.reduce(
        (sum, slot) => sum + getRoguelikeAdjustedReboundingForSlot(slot.player, slot, ownedPlayerIds, trainedPlayerIds),
        0,
      ) /
        filledSlots.length) *
        10,
    ) / 10
  );
};

const getFaceoffFinalScore = (faceoffResult: RoguelikeFaceoffResult) => {
  const averageEdge =
    Math.abs(faceoffResult.userTeamWinProbability - faceoffResult.opponentTeamWinProbability) / 5;
  const scoreMargin = Math.max(3, Math.min(22, Math.round(averageEdge / 3) + 3));
  const paceScore = Math.max(
    92,
    Math.min(
      118,
      Math.round(
        101 +
          (faceoffResult.userTeamWinProbability + faceoffResult.opponentTeamWinProbability - 500) /
            18,
      ),
    ),
  );

  if (faceoffResult.userTeamWinProbability >= faceoffResult.opponentTeamWinProbability) {
    return {
      userScore: Math.min(132, paceScore + Math.ceil(scoreMargin / 2)),
      opponentScore: Math.max(78, paceScore - Math.floor(scoreMargin / 2)),
    };
  }

  return {
    userScore: Math.max(78, paceScore - Math.floor(scoreMargin / 2)),
    opponentScore: Math.min(132, paceScore + Math.ceil(scoreMargin / 2)),
  };
};

const hasEarnedNodeReward = (
  run: RoguelikeRun,
  nodeIndex: number,
  nodeResult?: RoguelikeRun["nodeResult"] | null,
) => {
  if (run.stage === "run-cleared") return true;
  if (nodeIndex < run.floorIndex) return true;

  return (
    nodeIndex === run.floorIndex &&
    (run.stage === "reward-draft" || run.stage === "node-result") &&
    nodeResult?.passed !== false
  );
};

const RogueNodeRewardsRail = ({
  rewards,
  earned,
}: {
  rewards: RoguelikeClearRewards;
  earned: boolean;
}) => {
  const hasRewards = rewards.tokenReward > 0 || rewards.prestigeXpAward > 0;

  return (
    <div
      className={clsx(
        "rounded-[22px] border px-4 py-4 transition",
        earned && hasRewards
          ? "border-emerald-300/34 bg-[linear-gradient(180deg,rgba(6,78,59,0.34),rgba(16,185,129,0.14),rgba(5,46,22,0.34))] shadow-[0_0_0_1px_rgba(52,211,153,0.14),0_0_26px_rgba(16,185,129,0.14)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={clsx(
          "text-[10px] uppercase tracking-[0.22em]",
          earned && hasRewards ? "text-emerald-100/86" : "text-slate-400",
        )}>
          Rewards
        </div>
        {earned && hasRewards ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/28 bg-emerald-300/14 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-50">
            <CheckCircle2 size={11} />
            Earned
          </span>
        ) : null}
      </div>
      {hasRewards ? (
        <div className="mt-3 space-y-2.5">
          <div
            className={clsx(
              "flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2.5",
              earned ? "border-amber-200/18 bg-amber-300/10" : "border-white/8 bg-black/14",
            )}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-white/84">
              <Coins size={14} className={earned ? "text-amber-200" : "text-slate-400"} />
              Tokens
            </span>
            <span className="text-sm font-semibold text-white">+{rewards.tokenReward}</span>
          </div>
          <div
            className={clsx(
              "flex items-center justify-between gap-3 rounded-[16px] border px-3 py-2.5",
              earned ? "border-sky-200/18 bg-sky-300/10" : "border-white/8 bg-black/14",
            )}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-white/84">
              <Sparkles size={14} className={earned ? "text-sky-200" : "text-slate-400"} />
              Prestige XP
            </span>
            <span className="text-sm font-semibold text-white">+{rewards.prestigeXpAward}</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-[16px] border border-white/8 bg-black/14 px-3 py-4 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
          No completion rewards
        </div>
      )}
    </div>
  );
};

const RogueRosterSlotCard = ({
  slot,
  index,
  ownedPlayerIds,
  trainedPlayerIds,
  focusMetrics = [],
  dragged,
}: {
  slot: RosterSlot;
  index: number;
  ownedPlayerIds: string[];
  trainedPlayerIds: string[];
  focusMetrics?: Array<"overall" | "offense" | "defense" | "chemistry" | "rebounding">;
  dragged: boolean;
}) => {
  const player = slot.player;
  const imageUrl = player ? usePlayerImage(player) : null;
  const naturalPositions = player
    ? [player.primaryPosition, ...player.secondaryPositions].join(" / ")
    : "Open";
  const slotPenalty = player ? getRoguelikeSlotPenalty(player, slot) : 0;
  const adjustedOverall = player ? getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) : 0;
  const outOfPosition = slotPenalty > 0;
  const overallDelta = player ? adjustedOverall - player.overall : 0;
  const boosted = overallDelta > 0;
  const playerNameLength = player?.name.length ?? 0;
  const metricChips = player
    ? focusMetrics
        .filter((metric) => metric !== "overall" && metric !== "chemistry")
        .map((metric) => {
          const value =
            metric === "offense"
              ? Math.round(getRoguelikeAdjustedOffenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10
              : metric === "defense"
                ? Math.round(getRoguelikeAdjustedDefenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10
                : Math.round(getRoguelikeAdjustedReboundingForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10;

          return {
            metric,
            label: getChallengeMetricLabel(metric),
            value,
          };
        })
    : [];

  return (
    <div
      className={clsx(
        "rounded-[20px] border border-white/10 bg-white/5 px-3 py-2 transition",
        dragged && "scale-[0.98] opacity-55",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-[52px] w-[52px] flex-none overflow-hidden rounded-[14px] border border-white/10 bg-black/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={player?.name ?? getRogueSlotLabel(slot, index)}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-white/70">
              {player?.name.charAt(0) ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className={clsx(
                "text-[10px] uppercase tracking-[0.18em]",
                outOfPosition ? "text-rose-300" : "text-slate-400",
              )}>
                {getRogueSlotLabel(slot, index)}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <div
                  className={clsx(
                    "break-words font-semibold text-white",
                    playerNameLength >= 24
                      ? "text-[0.82rem] leading-4"
                      : playerNameLength >= 18
                        ? "text-[0.9rem] leading-5"
                        : "text-[0.98rem] leading-5",
                  )}
                >
                  {player?.name ?? "Open Slot"}
                </div>
                {player ? (
                  <div className="flex flex-none flex-wrap items-center gap-1">
                    <DynamicDuoBadge
                      playerId={player.id}
                      draftedPlayerIds={ownedPlayerIds}
                      compact
                      dense
                      previewEligible={false}
                    />
                    <PlayerSynergyBadges
                      playerId={player.id}
                      draftedPlayerIds={ownedPlayerIds}
                      compact
                      dense
                      align="start"
                      className="gap-1"
                      excludeTypes={["dynamic-duo"]}
                      previewEligible={false}
                    />
                  </div>
                ) : null}
              </div>
              <div className={clsx(
                "mt-0.5 truncate text-[10px] uppercase tracking-[0.16em]",
                outOfPosition ? "text-rose-300" : "text-slate-400",
              )}>
                {player ? naturalPositions : "Draft or earn a player to fill this slot"}
              </div>
            </div>
            <div className="flex items-center gap-2 pl-2 self-start">
              {metricChips.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {metricChips.map((chip) => (
                    <div
                      key={chip.metric}
                      className="rounded-full border border-sky-200/14 bg-sky-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-100"
                    >
                      {chip.value} {chip.label}
                    </div>
                  ))}
                </div>
              ) : null}
              {player ? (
                <div className={clsx(
                  "whitespace-nowrap text-xs font-semibold",
                  overallDelta < 0 ? "text-rose-300" : boosted ? "text-lime-300" : "text-amber-100",
                )}>
                  {overallDelta < 0 ? <ChevronDown size={12} className="mr-1 inline-block align-[-1px]" /> : null}
                  {boosted ? <ArrowUpRight size={12} className="mr-1 inline-block align-[-1px] text-lime-300" /> : null}
                  {adjustedOverall}{" "}
                  <span className={clsx(
                    "text-[9px] uppercase tracking-[0.14em]",
                    overallDelta < 0 ? "text-rose-300/80" : boosted ? "text-lime-300/80" : "text-amber-100/75",
                  )}>
                    OVR
                  </span>
                </div>
              ) : null}
              <GripHorizontal size={14} className="text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FaceoffStarterCard = ({
  player,
  slot,
  slotLabel,
  ownedPlayerIds = [],
  trainedPlayerIds = [],
  align = "left",
}: {
  player: Player | null;
  slot: RosterSlot;
  slotLabel: string;
  ownedPlayerIds?: string[];
  trainedPlayerIds?: string[];
  align?: "left" | "right";
}) => {
  const imageUrl = player ? usePlayerImage(player) : null;
  const slotPenalty = player ? getRoguelikeSlotPenalty(player, slot) : 0;
  const adjustedOverall = player
    ? getRoguelikeAdjustedOverallForSlot(player, slot, ownedPlayerIds, trainedPlayerIds)
    : 0;
  const outOfPosition = slotPenalty > 0;
  const playerNameLength = player?.name.length ?? 0;

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-3">
      <div className={clsx("text-[10px] uppercase tracking-[0.18em] text-slate-400", align === "right" && "text-right")}>
        {slotLabel}
      </div>
      <div className={clsx("mt-2 flex items-center gap-3", align === "right" && "flex-row-reverse text-right")}>
        <div className="h-[56px] w-[56px] flex-none overflow-hidden rounded-[16px] border border-white/10 bg-black/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={player?.name ?? slotLabel}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-white/60">
              {player?.name.charAt(0) ?? "?"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={clsx(
              "break-words font-semibold text-white",
              playerNameLength >= 24
                ? "text-[0.86rem] leading-4"
                : playerNameLength >= 18
                  ? "text-[0.94rem] leading-5"
                  : "text-base",
            )}
          >
            {player?.name ?? "Open Slot"}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            {player ? `${player.primaryPosition} / ${player.secondaryPositions.join(" / ")}` : "Missing starter"}
          </div>
          {player ? (
            <div className={clsx("mt-1 text-xs", outOfPosition ? "text-rose-300" : "text-amber-100")}>
              {outOfPosition ? <ChevronDown size={12} className="mr-1 inline-block align-[-1px]" /> : null}
              {adjustedOverall} OVR
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const FaceoffMatchupRow = ({
  matchup,
}: {
  matchup: RoguelikeFaceoffMatchup;
}) => (
  <div className="rounded-[26px] border border-white/10 bg-black/18 p-4">
    <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
      <FaceoffStarterCard
        player={matchup.opponentPlayer}
        slot={{
          slot: matchup.slot,
          label: matchup.slot,
          allowedPositions: [matchup.slot as Player["primaryPosition"]],
          player: matchup.opponentPlayer,
        }}
        slotLabel={`Boss ${matchup.slot}`}
        align="right"
      />
      <div className="rounded-[22px] border border-fuchsia-200/16 bg-fuchsia-300/8 px-4 py-4 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-100/80">
          {matchup.slot} Matchup
        </div>
        <div className="mt-3 text-2xl font-semibold text-white">
          {matchup.userWinProbability}%
        </div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
          Your win chance
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-xs">
          <span className="rounded-full border border-rose-200/18 bg-rose-300/10 px-3 py-1 text-rose-100">
            Boss {matchup.opponentRating}
          </span>
          <span className="text-slate-500">vs</span>
          <span className="rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-1 text-emerald-100">
            You {matchup.userRating}
          </span>
        </div>
        <div className={clsx(
          "mt-3 text-sm",
          matchup.ratingDelta >= 0 ? "text-emerald-100" : "text-rose-100",
        )}>
          {matchup.ratingDelta >= 0 ? "+" : ""}{matchup.ratingDelta} matchup edge
        </div>
      </div>
      <FaceoffStarterCard
        player={matchup.userPlayer}
        slot={{
          slot: matchup.slot,
          label: matchup.slot,
          allowedPositions: [matchup.slot as Player["primaryPosition"]],
          player: matchup.userPlayer,
        }}
        slotLabel={`Your ${matchup.slot}`}
      />
    </div>
  </div>
);

const StarterRevealCard = ({
  player,
  index,
  revealed,
  onReveal,
}: {
  player: Player;
  index: number;
  revealed: boolean;
  onReveal: () => void;
}) => {
  const imageUrl = usePlayerImage(player);
  const { firstNameLine, lastNameLine, versionLine } = getPlayerDisplayLines(player);

  return (
    <button
      type="button"
      onClick={onReveal}
      disabled={revealed}
      className="group relative h-[420px] overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,12,20,0.94),rgba(16,24,36,0.96))] text-left transition duration-300 hover:-translate-y-1 hover:border-amber-200/24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />
      <div className="relative flex h-full flex-col justify-between p-6">
        <div className={revealed ? "text-[11px] uppercase tracking-[0.28em] text-emerald-100/80" : "text-[11px] uppercase tracking-[0.28em] text-slate-400"}>
          {revealed ? "Revealed" : `Starter Card ${index + 1}`}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center">
          {!revealed ? (
            <div className="mb-3 text-[11px] uppercase tracking-[0.32em] text-amber-100/84">
              Click To Reveal
            </div>
          ) : (
            <div className="mb-3 text-[11px] uppercase tracking-[0.32em] text-transparent">
              Revealed
            </div>
          )}
          <div className="w-full [perspective:1400px]">
            <div
              className={clsx(
                "relative w-full transition-transform duration-700 [transform-style:preserve-3d]",
                revealed ? "[transform:rotateY(180deg)]" : "",
              )}
            >
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <div className="w-full rounded-[26px] border border-white/12 bg-[linear-gradient(145deg,rgba(37,45,60,0.96),rgba(12,18,28,0.98))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(160deg,rgba(61,52,35,0.22),rgba(23,29,41,0.96),rgba(14,18,28,0.98))] px-6 py-5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_32%)]" />
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/8 blur-3xl" />
                    <div className="relative flex-1 overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(33,39,52,0.92),rgba(11,15,24,0.98))]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_26%)]" />
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_38%,rgba(255,255,255,0.08)_50%,transparent_62%,transparent_100%)] opacity-80" />
                      <div className="absolute left-1/2 top-1/2 h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_58%,transparent_72%)]" />
                      <div className="absolute left-1/2 top-1/2 h-[108px] w-[108px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-amber-100/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] shadow-[0_0_40px_rgba(245,158,11,0.12)]" />
                      <div className="absolute inset-5 rounded-[18px] border border-dashed border-white/12" />
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/85 to-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="relative flex h-full flex-col">
                  <div className="overflow-hidden rounded-[26px] border border-white/12 bg-black/18">
                    <div className="h-[240px] overflow-hidden rounded-[24px]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={player.name}
                          className="h-full w-full object-cover object-top"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-6xl text-white/70">
                          {player.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 font-display text-3xl leading-tight text-white">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap tracking-tight">{firstNameLine}</div>
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap tracking-tight">{lastNameLine}</div>
                    {versionLine ? <div className="text-[0.72em] tracking-tight text-slate-200/90">{versionLine}</div> : null}
                  </div>
                  <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    {getPlayerTierLabel(player)} | {player.overall} OVR | {player.primaryPosition}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-slate-300 transition group-hover:text-white">
          Reveal this starter to see who is joining your opening arsenal.
        </div>
      </div>
    </button>
  );
};

export const RoguelikeMode = ({
  activeRogueStarId,
  ownedTrainingCampTickets,
  ownedTradePhones,
  ownedSilverStarterPacks,
  ownedGoldStarterPacks,
  ownedPlatinumStarterPacks,
  onLeaveRun,
  onBackToHome,
  onAwardFailureRewards,
  onUpdatePersonalBests,
  onUseTrainingCampTicket,
  onUseTradePhone,
  onUseSilverStarterPack,
  onUseGoldStarterPack,
  onUsePlatinumStarterPack,
}: RoguelikeModeProps) => {
  const [run, setRun] = useState<RoguelikeRun | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem(ROGUELIKE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<RoguelikeRun>;
      return {
        ...parsed,
        seenChoicePlayerIds: parsed.seenChoicePlayerIds ?? [],
        revealedStarterIds: parsed.revealedStarterIds ?? [],
        draftShuffleTickets: parsed.draftShuffleTickets ?? 0,
        unlockedBundleIds: parsed.unlockedBundleIds ?? [],
        trainedPlayerIds: parsed.trainedPlayerIds ?? [],
        selectedCutPlayerIds: parsed.selectedCutPlayerIds ?? [],
        selectedNaturalPositionPlayerId: parsed.selectedNaturalPositionPlayerId ?? null,
        selectedNaturalPosition: parsed.selectedNaturalPosition ?? null,
        allStarAssignments: parsed.allStarAssignments ?? {
          dunkContest: null,
          threePointContest: null,
          skillsChallenge: null,
        },
        utilityReturnState: parsed.utilityReturnState ?? null,
        failureReviewStage: parsed.failureReviewStage ?? null,
        nodeResult: parsed.nodeResult
          ? {
              ...parsed.nodeResult,
              failureRewards: parsed.nodeResult.failureRewards ?? null,
            }
          : null,
      } as RoguelikeRun;
    } catch {
      return null;
    }
  });
  const [showPackSelectionHub, setShowPackSelectionHub] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(ROGUELIKE_PARKED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [showOutcomeOverlay, setShowOutcomeOverlay] = useState(false);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [selectedStarterPackUpgrade, setSelectedStarterPackUpgrade] = useState<"standard" | "silver" | "gold" | "platinum">("standard");
  const currentLadderNodeRef = useRef<HTMLDivElement | null>(null);
  const [dragPointer, setDragPointer] = useState<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const metrics = useMemo(() => {
    if (!run) return evaluateRoguelikeRoster([]);
    const ownedPlayerIds = getRunOwnedPlayers(run).map((player) => player.id);
    if (run.stage !== "starter-reveal") {
      return evaluateRoguelikeLineup(run.lineup, ownedPlayerIds, run.trainedPlayerIds ?? []);
    }

    const revealedStarterPlayers = run.starterRevealPlayers.filter((player) =>
      run.revealedStarterIds.includes(player.id),
    );
    return evaluateRoguelikeLineup(
      buildRoguelikeStarterLineup(revealedStarterPlayers),
      revealedStarterPlayers.map((player) => player.id),
      run.trainedPlayerIds ?? [],
    );
  }, [run]);

  useEffect(() => {
    if (!run) return;

    const furthestFloor =
      run.stage === "run-cleared"
        ? roguelikeNodes.length
        : Math.min(run.floorIndex + 1, roguelikeNodes.length);

    onUpdatePersonalBests({
      furthestFloor,
      overall: metrics.overall,
      offense: metrics.offense,
      defense: metrics.defense,
      chemistry: metrics.chemistry,
    });
  }, [
    run,
    metrics.overall,
    metrics.offense,
    metrics.defense,
    metrics.chemistry,
    onUpdatePersonalBests,
  ]);

  const setParkedRunState = (parked: boolean) => {
    if (typeof window === "undefined") return;

    if (parked) {
      window.localStorage.setItem(ROGUELIKE_PARKED_STORAGE_KEY, "true");
      return;
    }

    window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
  };

  const startRun = (packageId: RoguelikeStarterPackageId) => {
    const usingSilverStarterPack = selectedStarterPackUpgrade === "silver";
    const usingGoldStarterPack = selectedStarterPackUpgrade === "gold";
    const usingPlatinumStarterPack = selectedStarterPackUpgrade === "platinum";
    if (usingSilverStarterPack && !onUseSilverStarterPack()) return;
    if (usingGoldStarterPack && !onUseGoldStarterPack()) return;
    if (usingPlatinumStarterPack && !onUsePlatinumStarterPack()) return;

    const seed = createSeed();
    const activeRogueStar = getPlayerById(activeRogueStarId);
    const currentSeasonStarterSource = allPlayers.filter((player) => player.era === "2025-26");
    const starterRevealSource = currentSeasonStarterSource.filter((player) => player.id !== activeRogueStar?.id);
    const starterPool = buildStarterPool(packageId, currentSeasonStarterSource).filter(
      (player) => player.id !== activeRogueStar?.id,
    );
    const starterRevealPlayers = injectActiveRogueStarIntoReveal(
      drawRoguelikeStarterRevealPlayers(
        packageId,
        nextChoiceSeed(seed, 1),
        getStarterPackAverageForUpgrade(selectedStarterPackUpgrade),
        starterRevealSource,
      ),
      activeRogueStar,
    );
    const lineup = buildRoguelikeStarterLineup([]);
    setSelectedStarterPackUpgrade("standard");
    setShowPackSelectionHub(false);
    setParkedRunState(false);

    setRun({
      seed,
      packageId: packageId,
      roster: [],
      lineup,
      availablePool: starterPool,
      seenChoicePlayerIds: [],
      choices: [],
      starterRevealPlayers,
      revealedStarterIds: [],
      lives: 3,
      floorIndex: 0,
        initialPicks: 0,
        draftShuffleTickets: 0,
        unlockedBundleIds: [],
      selectedCutPlayerIds: [],
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      allStarAssignments: {
        dunkContest: null,
        threePointContest: null,
        skillsChallenge: null,
      },
      trainedPlayerIds: [],
      utilityReturnState: null,
      failureReviewStage: null,
      stage: "starter-reveal",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
    });
  };

  const buildFailureRewards = (floorIndex: number) => {
    const rewards = getRoguelikeFailureRewards(floorIndex);
    onAwardFailureRewards(rewards.prestigeXpAward);
    return rewards;
  };

  const buildClearRewards = (node: RoguelikeNode) => {
    const rewards = getRoguelikeClearRewards(node);
    if (rewards.prestigeXpAward > 0) {
      onAwardFailureRewards(rewards.prestigeXpAward);
    }
    return rewards;
  };

  const previewFailureRewards = (floorIndex: number) => getRoguelikeFailureRewards(floorIndex);

  const revealStarterCard = (playerId: string) => {
    if (!run || run.stage !== "starter-reveal" || run.revealedStarterIds.includes(playerId)) return;

    const nextRevealedStarterIds = [...run.revealedStarterIds, playerId];
    const revealedStarterRosterState = buildRevealedStarterRosterState(run, nextRevealedStarterIds);
    setRun({
      ...run,
      ...revealedStarterRosterState,
      revealedStarterIds: nextRevealedStarterIds,
    });
  };

  const proceedToRunLadder = () => {
    if (!run || run.stage !== "starter-reveal") return;
    const { ownedPlayers, lineup } = getEarlyRunRosterState(run);
    setShowPackSelectionHub(false);
    setParkedRunState(false);

    setRun({
      ...run,
      roster: ownedPlayers,
      lineup,
      stage: "ladder-overview",
      activeNode: null,
      activeOpponentPlayerIds: null,
    });
  };

  const completeRewardDraftSelection = (
    sourceRun: RoguelikeRun,
    nextRoster: Player[],
    nextLineup: RosterSlot[],
  ) => {
    if (sourceRun.activeNode?.id === STORE_TRADE_NODE.id) {
      setRun(
        restoreUtilityReturnState({
          ...sourceRun,
          roster: nextRoster,
          lineup: nextLineup,
          choices: [],
          nodeResult: null,
          pendingRewardPlayer: null,
        }),
      );
      return;
    }

    if (sourceRun.activeNode) {
      buildClearRewards(sourceRun.activeNode);
    }

    const nextFloorIndex = sourceRun.activeNode ? sourceRun.floorIndex + 1 : sourceRun.floorIndex;

    setRun({
      ...sourceRun,
      roster: nextRoster,
      lineup: nextLineup,
      choices: [],
      floorIndex: nextFloorIndex,
      stage: roguelikeNodes[nextFloorIndex] ? "ladder-overview" : "run-cleared",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
      pendingRewardPlayer: null,
    });
  };

  const startOpeningDraft = () => {
    if (!run || run.stage !== "ladder-overview") return;
    const currentNode = roguelikeNodes[run.floorIndex] ?? null;
    if (!currentNode) return;

    if (run.activeNode?.id === currentNode.id) {
      if (run.pendingRewardPlayer) {
        setRun({
          ...run,
          stage: "reward-replace-select",
        });
        return;
      }

      if (run.choices.length > 0) {
        setRun({
          ...run,
          stage: run.initialPicks === 0 ? "initial-draft" : "reward-draft",
        });
        return;
      }

      if (currentNode.type === "training") {
        setRun({ ...run, stage: "training-select" });
        return;
      }

      if (currentNode.type === "add-position") {
        setRun({ ...run, stage: "add-position-select" });
        return;
      }

      if (currentNode.type === "all-star") {
        setRun({ ...run, stage: "all-star-select" });
        return;
      }

      if (currentNode.type === "roster-cut") {
        setRun({ ...run, stage: "roster-cut-select" });
        return;
      }

      if (currentNode.type === "trade") {
        setRun({ ...run, stage: "trade-offer" });
        return;
      }

      if (currentNode.type === "evolution") {
        setRun({ ...run, stage: "evolution-select" });
        return;
      }

      if (currentNode.type === "challenge") {
        setRun({ ...run, stage: "challenge-setup" });
        return;
      }

      if (currentNode.battleMode === "starting-five-faceoff") {
        const hydratedRun = getHydratedRun(run);
        setRun({
          ...run,
          roster: hydratedRun.roster,
          lineup: hydratedRun.lineup,
          stage: "faceoff-setup",
        });
        return;
      }
    }

    if (currentNode.type === "draft") {
      const bundle = getBundle(currentNode.rewardBundleId);
      const nextRun =
        run.initialPicks === 0
          ? {
              ...run,
              ...getEarlyRunRosterState(run),
            }
          : run;
      const openingDraftPool = getNodePlayerPool(
        currentNode,
        run.initialPicks === 0 ? buildOpeningDraftPool() : nextRun.availablePool,
      );
      const draftedPlayers = getRunOwnedPlayers(nextRun);
      const nextChoicesState = drawRunChoices(
        nextRun,
        openingDraftPool,
        draftedPlayers,
        5,
        nextChoiceSeed(run.seed, 11 + run.floorIndex * 19),
        getNodeChoiceTiers(currentNode) ? [...getNodeChoiceTiers(currentNode)!] : undefined,
        shouldStrictlyUseNodePool(currentNode),
      );
      setRun({
        ...nextRun,
        activeNode: currentNode,
        stage: run.initialPicks === 0 ? "initial-draft" : "reward-draft",
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        nodeResult: {
          title: bundle.title,
          detail:
            currentNode.floor === 1
              ? "Starter Cache is open. Choose 1 of 5 current-season D-tier players to add to your run roster."
                : bundle.description,
            passed: true,
          },
      });
      return;
    }

    if (currentNode.type === "training") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "training-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "add-position") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        selectedNaturalPositionPlayerId: null,
        selectedNaturalPosition: null,
        stage: "add-position-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "all-star") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        allStarAssignments: {
          dunkContest: null,
          threePointContest: null,
          skillsChallenge: null,
        },
        stage: "all-star-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "roster-cut") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        selectedCutPlayerIds: [],
        stage: "roster-cut-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "trade") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "trade-offer",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "evolution") {
      const evolutionOptions = getRoguelikeEvolutionOptions(getRunOwnedPlayers(run));

      if (evolutionOptions.length === 0) {
        const nextFloorIndex = run.floorIndex + 1;
        buildClearRewards(currentNode);
        setRun({
          ...run,
          draftShuffleTickets: run.draftShuffleTickets + 1,
          floorIndex: nextFloorIndex,
          stage: "node-result",
          activeNode: null,
          activeOpponentPlayerIds: null,
          nodeResult: {
            title: `${currentNode.title} complete`,
            detail: "No eligible version player was on your roster, so this node converted into 1 Draft Shuffle ticket instead. You can use it later to reroll a live five-player board.",
            passed: true,
          },
        });
        return;
      }

      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "evolution-select",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.battleMode === "starting-five-faceoff") {
      const hydratedRun = getHydratedRun(run);
      setRun({
        ...run,
        roster: hydratedRun.roster,
        lineup: hydratedRun.lineup,
        activeNode: currentNode,
        activeOpponentPlayerIds:
          currentNode.opponentStarterPlayerIds ??
          currentNode.opponentPlayerIds ??
          generateFaceoffOpponentPlayerIds(
            getRunOwnedPlayers(run),
            nextChoiceSeed(run.seed, 200 + run.floorIndex * 17),
            currentNode.opponentAverageOverall,
            currentNode.playerPoolMode === "current-season"
              ? allPlayers.filter((player) => player.era === "2025-26")
              : undefined,
          ),
        stage: "faceoff-setup",
        nodeResult: null,
      });
      return;
    }

    if (currentNode.type === "challenge") {
      setRun({
        ...run,
        activeNode: currentNode,
        activeOpponentPlayerIds: null,
        stage: "challenge-setup",
        nodeResult: null,
      });
    }
  };

  const draftChoice = (player: Player) => {
    if (!run) return;

    if (
      run.stage === "reward-draft" &&
      run.activeNode?.id !== STORE_TRADE_NODE.id &&
      run.roster.length >= 10
    ) {
      setRun({
        ...run,
        stage: "reward-replace-select",
        pendingRewardPlayer: player,
        nodeResult: {
          title: "Choose 1 player to replace",
          detail: `${player.name} is ready to join your run, but your roster is already full. Select 1 current player to swap out, or skip this pick and keep your team intact.`,
          passed: true,
        },
      });
      return;
    }

    const nextRoster = [...run.roster, player];
    const nextLineup =
      run.stage === "initial-draft"
        ? buildRoguelikeStarterLineup(nextRoster)
        : run.stage === "reward-draft" &&
            run.unlockedBundleIds.includes("synergy-hunters") &&
            run.roster.length === 5
          ? run.lineup.map((slot, index) => (index === 5 ? { ...slot, player } : { ...slot }))
        : assignPlayerToRoster(run.lineup, player).roster;
    const nextInitialPicks = run.initialPicks + 1;

    if (run.stage === "initial-draft") {
      if (nextInitialPicks < 2) {
        const initialDraftNode = run.activeNode;
        if (!initialDraftNode) return;
        const openingDraftPool = getNodePlayerPool(initialDraftNode, buildOpeningDraftPool());
        const initialDraftChoiceTiers = getNodeChoiceTiers(initialDraftNode);
        const nextChoicesState = drawRunChoices(
          run,
          openingDraftPool,
          nextLineup
            .map((slot) => slot.player)
            .filter((owned): owned is Player => Boolean(owned)),
          5,
          nextChoiceSeed(run.seed, nextInitialPicks + 1),
          initialDraftChoiceTiers ? [...initialDraftChoiceTiers] : undefined,
          shouldStrictlyUseNodePool(initialDraftNode),
        );
        setRun({
          ...run,
          roster: nextRoster,
          lineup: nextLineup,
          initialPicks: nextInitialPicks,
          seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
          choices: nextChoicesState.choices,
        });
        return;
      }

      if (run.activeNode) {
        buildClearRewards(run.activeNode);
      }

      setRun({
        ...run,
        roster: nextRoster,
        lineup: nextLineup,
        initialPicks: nextInitialPicks,
        seenChoicePlayerIds: run.seenChoicePlayerIds ?? [],
        choices: [],
        stage: "ladder-overview",
        activeNode: null,
        activeOpponentPlayerIds: null,
        floorIndex: 1,
      });
      return;
    }

    if (run.stage === "reward-draft") {
      completeRewardDraftSelection(run, nextRoster, nextLineup);
    }
  };

  const skipRewardDraft = () => {
    if (!run || run.stage !== "reward-draft") return;
    completeRewardDraftSelection(run, run.roster, run.lineup);
  };

  const toggleRosterCutPlayer = (player: Player) => {
    if (!run || run.stage !== "roster-cut-select") return;

    const alreadySelected = run.selectedCutPlayerIds.includes(player.id);
    const nextSelectedCutPlayerIds = alreadySelected
      ? run.selectedCutPlayerIds.filter((playerId) => playerId !== player.id)
      : run.selectedCutPlayerIds.length < 2
        ? [...run.selectedCutPlayerIds, player.id]
        : run.selectedCutPlayerIds;

    setRun({
      ...run,
      selectedCutPlayerIds: nextSelectedCutPlayerIds,
    });
  };

  const confirmRosterCut = () => {
    if (!run || run.stage !== "roster-cut-select" || !run.activeNode) return;
    if (run.selectedCutPlayerIds.length !== 2) return;

    const cutPlayerIds = new Set(run.selectedCutPlayerIds);
    const nextRoster = run.roster.filter((player) => !cutPlayerIds.has(player.id));
    const nextFloorIndex = run.floorIndex + 1;

    setRun({
      ...run,
      roster: nextRoster,
      lineup: buildPreviewRoster(nextRoster),
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      selectedCutPlayerIds: [],
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: "You finalized your cuts and tightened the rotation for the next stop on the ladder.",
        passed: true,
      },
    });
  };

  const selectNaturalPositionPlayer = (player: Player) => {
    if (!run || run.stage !== "add-position-select") return;

    setRun({
      ...run,
      selectedNaturalPositionPlayerId: player.id,
      selectedNaturalPosition: null,
    });
  };

  const selectNaturalPosition = (position: Position) => {
    if (!run || run.stage !== "add-position-select") return;

    setRun({
      ...run,
      selectedNaturalPosition: position,
    });
  };

  const confirmNaturalPositionAdd = () => {
    if (!run || run.stage !== "add-position-select" || !run.activeNode) return;
    if (!run.selectedNaturalPositionPlayerId || !run.selectedNaturalPosition) return;
    const naturalPositionToAdd = run.selectedNaturalPosition;

    const nextRoster = run.roster.map((player) => {
      if (player.id !== run.selectedNaturalPositionPlayerId) return player;
      if (
        player.primaryPosition === naturalPositionToAdd ||
        player.secondaryPositions.includes(naturalPositionToAdd)
      ) {
        return player;
      }

      return {
        ...player,
        secondaryPositions: [...player.secondaryPositions, naturalPositionToAdd],
      };
    });
    const upgradedPlayer = nextRoster.find((player) => player.id === run.selectedNaturalPositionPlayerId);
    const nextFloorIndex = run.floorIndex + 1;

    setRun({
      ...run,
      roster: nextRoster,
      lineup: hydrateRunLineup(run, nextRoster),
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: upgradedPlayer
          ? `${upgradedPlayer.name} can now naturally play ${naturalPositionToAdd} for the rest of this run.`
          : "A new natural position was added for the rest of this run.",
        passed: true,
      },
    });
  };

  const assignAllStarPlayer = (
    slot: "dunkContest" | "threePointContest" | "skillsChallenge",
    player: Player,
  ) => {
    if (!run || run.stage !== "all-star-select") return;

    const nextAssignments = {
      ...run.allStarAssignments,
      [slot]: player.id,
    };

    const selectedIds = new Set(Object.values(nextAssignments).filter((value): value is string => Boolean(value)));
    if (selectedIds.size < Object.values(nextAssignments).filter(Boolean).length) {
      return;
    }

    setRun({
      ...run,
      allStarAssignments: nextAssignments,
    });
  };

  const runAllStarSaturday = () => {
    if (!run || run.stage !== "all-star-select" || !run.activeNode) return;
    const { dunkContest, threePointContest, skillsChallenge } = run.allStarAssignments;
    if (!dunkContest || !threePointContest || !skillsChallenge) return;

    const nextRoster = run.roster.map((player) => {
      if (player.id === dunkContest) {
        return { ...player, athleticism: player.athleticism + 5 };
      }
      if (player.id === threePointContest) {
        return { ...player, shooting: player.shooting + 5 };
      }
      if (player.id === skillsChallenge) {
        return { ...player, ballDominance: player.ballDominance + 5 };
      }
      return player;
    });
    const nextFloorIndex = run.floorIndex + 1;
    const dunkPlayer = nextRoster.find((player) => player.id === dunkContest);
    const threePointPlayer = nextRoster.find((player) => player.id === threePointContest);
    const skillsPlayer = nextRoster.find((player) => player.id === skillsChallenge);

    setRun({
      ...run,
      roster: nextRoster,
      lineup: hydrateRunLineup(run, nextRoster),
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      allStarAssignments: {
        dunkContest: null,
        threePointContest: null,
        skillsChallenge: null,
      },
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: `${dunkPlayer?.name ?? "Your dunk contestant"} gained +5 Athleticism, ${threePointPlayer?.name ?? "your 3PT contestant"} gained +5 Shooting, and ${skillsPlayer?.name ?? "your skills contestant"} gained +5 Ball Dominance for the rest of this run.`,
        passed: true,
      },
    });
  };

  const openNode = () => {
    if (!run?.activeNode) return;

    const node = run.activeNode;

    if (node.type === "draft") {
      const expandedPool = unlockBundlePlayers(
        run.availablePool,
        getRunOwnedPlayers(run),
        node.rewardBundleId,
      );
      const bundle = getBundle(node.rewardBundleId);
      const nodeChoiceTiers = getNodeChoiceTiers(node);
      const nextChoicesState = drawRunChoices(
        run,
        getNodePlayerPool(node, expandedPool),
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        nodeChoiceTiers ? [...nodeChoiceTiers] : undefined,
        shouldStrictlyUseNodePool(node),
      );
      setRun({
        ...run,
        availablePool: expandedPool,
        unlockedBundleIds: run.unlockedBundleIds.includes(node.rewardBundleId)
          ? run.unlockedBundleIds
          : [...run.unlockedBundleIds, node.rewardBundleId],
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        stage: "reward-draft",
        nodeResult: {
          title: bundle.title,
          detail: bundle.description,
          passed: true,
        },
      });
      return;
    }

    if (node.type === "training") {
      setRun({
        ...run,
        stage: "training-select",
        nodeResult: null,
      });
      return;
    }

    if (node.type === "add-position") {
      setRun({
        ...run,
        stage: "add-position-select",
        selectedNaturalPositionPlayerId: null,
        selectedNaturalPosition: null,
        nodeResult: null,
      });
      return;
    }

    if (node.type === "all-star") {
      setRun({
        ...run,
        stage: "all-star-select",
        allStarAssignments: {
          dunkContest: null,
          threePointContest: null,
          skillsChallenge: null,
        },
        nodeResult: null,
      });
      return;
    }

    if (node.type === "roster-cut") {
      setRun({
        ...run,
        stage: "roster-cut-select",
        selectedCutPlayerIds: [],
        nodeResult: null,
      });
      return;
    }

    if (node.type === "trade") {
      setRun({
        ...run,
        stage: "trade-offer",
        nodeResult: null,
      });
      return;
    }

    if (node.type === "evolution") {
      const evolutionOptions = getRoguelikeEvolutionOptions(getRunOwnedPlayers(run));

      if (evolutionOptions.length === 0) {
        const nextFloorIndex = run.floorIndex + 1;
        buildClearRewards(node);
        setRun({
          ...run,
          draftShuffleTickets: run.draftShuffleTickets + 1,
          floorIndex: nextFloorIndex,
          stage: "node-result",
          activeNode: null,
          activeOpponentPlayerIds: null,
          nodeResult: {
            title: `${node.title} complete`,
            detail: "No eligible version player was on your roster, so this node converted into 1 Draft Shuffle ticket instead. You can use it later to reroll a live five-player board.",
            passed: true,
          },
        });
        return;
      }

      setRun({
        ...run,
        stage: "evolution-select",
        nodeResult: null,
      });
      return;
    }

    if (node.battleMode === "starting-five-faceoff") {
      const hydratedRun = getHydratedRun(run);
      setRun({
        ...run,
        roster: hydratedRun.roster,
        lineup: hydratedRun.lineup,
        stage: "faceoff-setup",
        nodeResult: null,
      });
      return;
    }

    if (node.type === "challenge") {
      setRun({
        ...run,
        stage: "challenge-setup",
        nodeResult: null,
      });
      return;
    }

    const resolution = resolveRoguelikeNode(
      {
        ...node,
        opponentPlayerIds: run.activeOpponentPlayerIds ?? node.opponentPlayerIds,
      },
      getRunOwnedPlayers(run),
      run.lineup,
      run.trainedPlayerIds ?? [],
    );
    const remainingLives = resolution.passed
      ? run.lives
      : Math.max(0, run.lives - (node.livesPenalty ?? 1));

    if (!resolution.passed && remainingLives === 0) {
      const failureRewards = buildFailureRewards(run.floorIndex);
      setRun({
        ...run,
        lives: 0,
        stage: "run-over",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail:
            resolution.failedChecks.length > 0
              ? `You missed ${resolution.failedChecks.map((check) => `${check.metric} ${check.target}`).join(", ")} and the run collapsed.`
              : "The run ended here.",
          passed: false,
          failureRewards,
        },
      });
      return;
    }

    if (resolution.passed && node.type === "boss" && run.floorIndex === roguelikeNodes.length - 1) {
      buildClearRewards(node);
      setRun({
        ...run,
        stage: "run-cleared",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: "Run cleared",
          detail: "You survived the final gauntlet. This is the exact kind of run-based climb we can now build outward from.",
          passed: true,
        },
      });
      return;
    }

    if (resolution.passed) {
      buildClearRewards(node);
      const expandedPool = unlockBundlePlayers(
        run.availablePool,
        getRunOwnedPlayers(run),
        node.rewardBundleId,
      );
      const rewardDraftPool = getRewardDraftPool(run, node, expandedPool);
      const bundle = getBundle(node.rewardBundleId);
      const nextChoicesState = drawRunChoices(
        run,
        rewardDraftPool,
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        getNodeChoiceTiers(node) ? [...getNodeChoiceTiers(node)!] : undefined,
        shouldStrictlyUseNodePool(node),
      );
      setRun({
        ...run,
        availablePool: expandedPool,
        lives: remainingLives,
        unlockedBundleIds: run.unlockedBundleIds.includes(node.rewardBundleId)
          ? run.unlockedBundleIds
          : [...run.unlockedBundleIds, node.rewardBundleId],
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        stage: "reward-draft",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail:
            node.id === "act-one-faceoff" || node.id === "act-one-faceoff-current"
              ? `You beat ${node.opponentTeamName ?? "the challenge team"}. Bench 1 is now open, ${bundle.title} is added to your run pool, and you can choose 1 of 5 B-tier players for your run roster.`
              : node.id === "act-one-boss" || node.id === "act-one-boss-current"
                ? `You beat ${node.opponentTeamName ?? "the challenge team"}. Choose 1 of 3 B-tier version players now, each being the lowest version of a player who has a stronger version available later in the run.`
                : node.id === "frontcourt-wave" || node.id === "frontcourt-wave-current"
                  ? `Your selected starting five reached ${resolution.metrics.offense} Offense. ${bundle.title} is now added to your run pool, and you can choose 1 of 5 B-tier players for your run roster.`
                : resolution.opponentPlayers.length > 0
                  ? `You beat ${node.opponentTeamName ?? "the challenge team"}. ${bundle.title} is now added to your run pool, and you earn one reward pick.`
                  : resolution.failedChecks.length === 0
                  ? `${bundle.title} added to your run pool. Take one reward pick.`
                  : bundle.description,
          passed: true,
        },
      });
      return;
    }

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = roguelikeNodes[nextFloorIndex] ?? null;
    const failureRewards = nextNode ? null : buildFailureRewards(nextFloorIndex);
    setRun({
      ...run,
      lives: remainingLives,
      floorIndex: nextFloorIndex,
      stage: nextNode ? "ladder-overview" : "run-over",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${node.title} failed`,
        detail: resolution.opponentPlayers.length > 0
          ? `You lost to ${node.opponentTeamName ?? "the challenge team"} and dropped ${node.livesPenalty ?? 1} life${(node.livesPenalty ?? 1) > 1 ? "s" : ""}.`
          : resolution.failedChecks.length > 0
            ? `You lost ${node.livesPenalty ?? 1} life${(node.livesPenalty ?? 1) > 1 ? "s" : ""}. Missed checks: ${resolution.failedChecks
                .map((check) => `${check.metric} ${check.target}`)
                .join(", ")}.`
            : `You lost ${node.livesPenalty ?? 1} life.`,
        passed: false,
        failureRewards,
      },
    });
  };

  const startLineupChallenge = () => {
    if (!run?.activeNode) return;

    const node = run.activeNode;
    const challengeLineup = run.lineup.slice(0, 5).map((slot) => ({ ...slot }));
    const resolution = resolveRoguelikeNode(node, getRunOwnedPlayers(run), challengeLineup, run.trainedPlayerIds ?? []);
    const ownedPlayerIds = getRunOwnedPlayers(run).map((player) => player.id);
    const challengeMetric = node.checks?.[0]?.metric ?? "offense";
    const challengeMetricLabel = getChallengeMetricLabel(challengeMetric);
    const challengeScore =
      challengeMetric === "offense"
        ? getAverageAdjustedOffense(challengeLineup, ownedPlayerIds, run.trainedPlayerIds ?? [])
        : challengeMetric === "rebounding"
          ? getAverageAdjustedRebounding(challengeLineup, ownedPlayerIds, run.trainedPlayerIds ?? [])
          : resolution.metrics[challengeMetric];
    const passed = challengeScore >= (node.checks?.[0]?.target ?? 0);

    if (!passed) {
      const failureRewards = buildFailureRewards(run.floorIndex);
      setRun({
        ...run,
        lives: 0,
        stage: "run-over",
        activeNode: node,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail: `Your starting five posted ${challengeScore} ${challengeMetricLabel}, short of the ${node.checks?.[0]?.target ?? 0} target. The run ends here.`,
          passed: false,
          failureRewards,
        },
        failureReviewStage: "challenge-setup",
      });
      return;
    }

    if ((node.draftShuffleReward ?? 0) > 0) {
      const nextFloorIndex = run.floorIndex + 1;
      const rewardAmount = node.draftShuffleReward ?? 0;
      buildClearRewards(node);
      setRun({
        ...run,
        draftShuffleTickets: run.draftShuffleTickets + rewardAmount,
        floorIndex: nextFloorIndex,
        stage: "node-result",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail: `Your starting five reached ${challengeScore} ${challengeMetricLabel}. You earned ${rewardAmount} Draft Shuffle ticket${rewardAmount > 1 ? "s" : ""}, which let${rewardAmount > 1 ? "" : "s"} you reroll any visible five-player draft board later in this run.`,
          passed: true,
        },
        failureReviewStage: null,
      });
      return;
    }

    if (passed) {
      buildClearRewards(node);
      const expandedPool = unlockBundlePlayers(
        run.availablePool,
        getRunOwnedPlayers(run),
        node.rewardBundleId,
      );
      const rewardDraftPool = getRewardDraftPool(run, node, expandedPool);
      const bundle = getBundle(node.rewardBundleId);
      const nodeChoiceTiers = getNodeChoiceTiers(node);
      const nextChoicesState = drawRunChoices(
        run,
        rewardDraftPool,
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        nodeChoiceTiers ? [...nodeChoiceTiers] : undefined,
        shouldStrictlyUseNodePool(node),
      );
      const rewardTierLabel =
        nodeChoiceTiers?.length === 2
          ? `${nodeChoiceTiers[0]} or ${nodeChoiceTiers[1]} tier`
          : nodeChoiceTiers?.length === 1
            ? `${nodeChoiceTiers[0]}-tier`
            : "reward";
      setRun({
        ...run,
        availablePool: expandedPool,
        lives: run.lives,
        unlockedBundleIds: run.unlockedBundleIds.includes(node.rewardBundleId)
          ? run.unlockedBundleIds
          : [...run.unlockedBundleIds, node.rewardBundleId],
        seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
        choices: nextChoicesState.choices,
        stage: "reward-draft",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail: `Your selected starting five reached ${challengeScore} ${challengeMetricLabel}. ${bundle.title} is now added to your run pool, and you can choose 1 of ${node.rewardChoices} ${rewardTierLabel} players for your run roster.`,
          passed: true,
        },
        failureReviewStage: null,
      });
      return;
    }
  };

  const startFaceoffGame = () => {
    if (!run?.activeNode) return;

    const node = {
      ...run.activeNode,
      opponentPlayerIds: run.activeOpponentPlayerIds ?? run.activeNode.opponentPlayerIds,
    };
    const resolution = resolveRoguelikeNode(node, getRunOwnedPlayers(run), run.lineup, run.trainedPlayerIds ?? []);
    const faceoffResult = resolution.faceoffResult;
    if (!faceoffResult) return;

    const edge =
      Math.round((faceoffResult.userTeamWinProbability - faceoffResult.opponentTeamWinProbability) * 10) / 10;

    setRun({
      ...run,
      stage: "faceoff-game",
      nodeResult: {
        title: resolution.passed ? `${node.title} cleared` : `${node.title} failed`,
        detail: resolution.passed
          ? `Your starters posted a ${faceoffResult.userTeamWinProbability}% team edge against ${node.opponentTeamName ?? "the boss team"} and won the faceoff.`
          : `Your starters finished at ${faceoffResult.userTeamWinProbability}% against ${faceoffResult.opponentTeamWinProbability}% for ${node.opponentTeamName ?? "the boss team"}. ${edge < 0 ? "The boss lineup won the faceoff." : "The matchup was too close to swing your way."}`,
        passed: resolution.passed,
        faceoffResult,
        failureRewards:
          !resolution.passed && node.eliminationOnLoss
            ? previewFailureRewards(run.floorIndex)
            : null,
      },
    });
  };

  const continueAfterFaceoff = () => {
    if (!run?.activeNode || run.stage !== "faceoff-game" || !run.nodeResult) return;

    const node = run.activeNode;
    const passed = Boolean(run.nodeResult.passed);

    if (!passed) {
      if (node.eliminationOnLoss) {
        const failureRewards = run.nodeResult.failureRewards ?? buildFailureRewards(run.floorIndex);
        if (run.nodeResult.failureRewards) {
          onAwardFailureRewards(run.nodeResult.failureRewards.prestigeXpAward);
        }
        setRun({
          ...run,
          stage: "run-over",
          activeNode: null,
          activeOpponentPlayerIds: null,
          nodeResult: {
            title: `${node.title} failed`,
            detail: `You lost the faceoff to ${node.opponentTeamName ?? "the boss team"}, so the run ends here.`,
            passed: false,
            faceoffResult: run.nodeResult.faceoffResult ?? null,
            failureRewards,
          },
        });
        return;
      }

      const remainingLives = Math.max(0, run.lives - (node.livesPenalty ?? 1));
      const nextFloorIndex = run.floorIndex + 1;
      const nextNode = roguelikeNodes[nextFloorIndex] ?? null;
      const failureRewards = nextNode ? null : buildFailureRewards(nextFloorIndex);
      setRun({
        ...run,
        lives: remainingLives,
        floorIndex: nextFloorIndex,
        stage: nextNode ? "ladder-overview" : "run-over",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail: `You lost ${node.livesPenalty ?? 1} life${(node.livesPenalty ?? 1) > 1 ? "s" : ""} in the faceoff.`,
          passed: false,
          failureRewards,
        },
      });
      return;
    }

    if (node.id === "hall-of-fame-finals" || run.floorIndex === roguelikeNodes.length - 1) {
      buildClearRewards(node);
      setRun({
        ...run,
        stage: "run-cleared",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: "Run cleared",
          detail: "You beat the final Hall of Fame lineup and completed the full four-act Rogue climb.",
          passed: true,
          faceoffResult: run.nodeResult.faceoffResult ?? null,
        },
      });
      return;
    }

    if ((node.draftShuffleReward ?? 0) > 0 && node.rewardChoices === 0) {
      buildClearRewards(node);
      const rewardAmount = node.draftShuffleReward ?? 0;
      const nextFloorIndex = run.floorIndex + 1;
      setRun({
        ...run,
        draftShuffleTickets: run.draftShuffleTickets + rewardAmount,
        floorIndex: nextFloorIndex,
        stage: "node-result",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} cleared`,
          detail: `You beat ${node.opponentTeamName ?? "the boss team"} and earned ${rewardAmount} Draft Shuffle ticket${rewardAmount > 1 ? "s" : ""}. Your next node is ready.`,
          passed: true,
          faceoffResult: run.nodeResult.faceoffResult ?? null,
        },
      });
      return;
    }

    const expandedPool = unlockBundlePlayers(
      run.availablePool,
      getRunOwnedPlayers(run),
      node.rewardBundleId,
    );
    const rewardDraftPool = getRewardDraftPool(run, node, expandedPool);
    const bundle = getBundle(node.rewardBundleId);
    buildClearRewards(node);
    const nextChoicesState = drawRunChoices(
      run,
      rewardDraftPool,
      getRunOwnedPlayers(run),
      node.rewardChoices,
      nextChoiceSeed(run.seed, run.floorIndex + 30),
      getNodeChoiceTiers(node) ? [...getNodeChoiceTiers(node)!] : undefined,
      shouldStrictlyUseNodePool(node),
    );
    setRun({
      ...run,
      availablePool: expandedPool,
      unlockedBundleIds: run.unlockedBundleIds.includes(node.rewardBundleId)
        ? run.unlockedBundleIds
        : [...run.unlockedBundleIds, node.rewardBundleId],
      seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
      choices: nextChoicesState.choices,
      stage: "reward-draft",
      activeNode: node,
      activeOpponentPlayerIds: null,
      nodeResult: {
          title: `${node.title} cleared`,
          detail:
            node.id === "act-one-faceoff" || node.id === "act-one-faceoff-current"
              ? `You beat ${node.opponentTeamName ?? "the boss team"}. Bench 1 is now open, ${bundle.title} is added to your run pool, and you can choose 1 of 5 B-tier players for your run roster.`
              : node.id === "act-one-boss" || node.id === "act-one-boss-current"
                ? `You beat ${node.opponentTeamName ?? "the boss team"}. Choose 1 of 3 B-tier version players now, then look for a future evolution node to upgrade that player into a higher-rated version.`
              : `You beat ${node.opponentTeamName ?? "the boss team"}. ${bundle.title} is now added to your run pool, and you earn one reward pick.`,
          passed: true,
        },
    });
  };

  const continueAfterResult = () => {
    if (!run) return;
    const nextNode = roguelikeNodes[run.floorIndex] ?? null;

    setRun({
      ...run,
      stage: nextNode ? "ladder-overview" : "run-over",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
    });
  };

  const openStoreTrainingCamp = () => {
    if (!run || ownedTrainingCampTickets <= 0) return;

    const hydratedRun = getHydratedRun(run);
    setRun({
      ...hydratedRun,
      stage: "training-select",
      activeNode: STORE_TRAINING_NODE,
      nodeResult: null,
      utilityReturnState: {
        stage: hydratedRun.stage,
        activeNode: hydratedRun.activeNode,
        activeOpponentPlayerIds: hydratedRun.activeOpponentPlayerIds,
        nodeResult: hydratedRun.nodeResult,
      },
    });
  };

  const openStoreTradePhone = () => {
    if (!run || ownedTradePhones <= 0) return;

    const hydratedRun = getHydratedRun(run);
    setRun({
      ...hydratedRun,
      stage: "trade-offer",
      activeNode: STORE_TRADE_NODE,
      nodeResult: null,
      utilityReturnState: {
        stage: hydratedRun.stage,
        activeNode: hydratedRun.activeNode,
        activeOpponentPlayerIds: hydratedRun.activeOpponentPlayerIds,
        nodeResult: hydratedRun.nodeResult,
      },
    });
  };

  const sendPlayerToTraining = (player: Player) => {
    if (!run?.activeNode || run.stage !== "training-select") return;

    if (run.activeNode.id === STORE_TRAINING_NODE.id) {
      if (!onUseTrainingCampTicket()) return;

      const trainedPlayerIds = [...run.trainedPlayerIds, player.id];

      setRun(
        restoreUtilityReturnState({
          ...run,
          trainedPlayerIds,
        }),
      );
      return;
    }

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = roguelikeNodes[nextFloorIndex] ?? null;
    const trainedPlayerIds = [...run.trainedPlayerIds, player.id];
    const trainingCount = trainedPlayerIds.filter((trainedPlayerId) => trainedPlayerId === player.id).length;
    buildClearRewards(run.activeNode);

    setRun({
      ...run,
      trainedPlayerIds,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: "Training Day complete",
        detail: `${player.name} went to training and now has +${trainingCount} total training OVR applied for the rest of this run. ${nextNode ? "Your next node is ready." : ""}`,
        passed: true,
      },
    });
  };

  const evolveRunPlayer = (player: Player) => {
    if (!run?.activeNode || run.stage !== "evolution-select") return;

    const evolution = getRoguelikeEvolutionOptions(getRunOwnedPlayers(run)).find(
      (option) => option.currentPlayer.id === player.id,
    );
    if (!evolution) return;

    const nextRoster = run.roster.map((owned) =>
      owned.id === evolution.currentPlayer.id ? evolution.nextPlayer : owned,
    );
    const nextLineup = run.lineup.map((slot) =>
      slot.player?.id === evolution.currentPlayer.id
        ? { ...slot, player: evolution.nextPlayer }
        : { ...slot },
    );
    const nextFloorIndex = run.floorIndex + 1;
    buildClearRewards(run.activeNode);

    setRun({
      ...run,
      roster: nextRoster,
      lineup: nextLineup,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: `${evolution.currentPlayer.name} evolved into ${evolution.nextPlayer.name}. The upgraded version is now locked into your run for the rest of the climb.`,
        passed: true,
      },
    });
  };

  const declineTradeDeadline = () => {
    if (!run?.activeNode || run.stage !== "trade-offer") return;

    if (run.activeNode.id === STORE_TRADE_NODE.id) {
      setRun(restoreUtilityReturnState(run));
      return;
    }

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = roguelikeNodes[nextFloorIndex] ?? null;
    buildClearRewards(run.activeNode);

    setRun({
      ...run,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${run.activeNode.title} complete`,
        detail: `You stood pat at the deadline and kept your roster intact. ${nextNode ? "The next node is ready." : ""}`,
        passed: true,
      },
    });
  };

  const openTradeSelection = () => {
    if (!run?.activeNode || run.stage !== "trade-offer") return;

    setRun({
      ...run,
      stage: "trade-select",
      nodeResult: null,
    });
  };

  const useDraftShuffleTicket = () => {
    if (!run || run.draftShuffleTickets <= 0) return;
    if (run.stage !== "initial-draft" && run.stage !== "reward-draft") return;
    if (run.choices.length === 0) return;

    const sourceNode = run.activeNode ?? roguelikeNodes[run.floorIndex] ?? null;
    const rerollPool =
      run.stage === "initial-draft"
        ? getNodePlayerPool(sourceNode, buildOpeningDraftPool())
        : sourceNode
          ? getRewardDraftPool(run, sourceNode, run.availablePool)
          : run.availablePool;
    const rerollRoster =
      run.stage === "initial-draft"
        ? run.lineup.map((slot) => slot.player).filter((player): player is Player => Boolean(player))
        : getRunOwnedPlayers(run);
    const allowedTiers =
      run.stage === "initial-draft"
        ? sourceNode && getNodeChoiceTiers(sourceNode)
          ? [...getNodeChoiceTiers(sourceNode)!]
          : undefined
        : sourceNode && getNodeChoiceTiers(sourceNode)
          ? [...getNodeChoiceTiers(sourceNode)!]
          : undefined;
    const nextChoicesState = drawRunChoices(
      run,
      rerollPool,
      rerollRoster,
      5,
      nextChoiceSeed(run.seed, 600 + run.floorIndex * 31 + run.draftShuffleTickets * 7),
      allowedTiers,
      shouldStrictlyUseNodePool(sourceNode),
    );

    setRun({
      ...run,
      draftShuffleTickets: Math.max(0, run.draftShuffleTickets - 1),
      seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
      choices: nextChoicesState.choices,
    });
  };

  const tradePlayerForReplacement = (player: Player) => {
    if (!run?.activeNode || run.stage !== "trade-select") return;

    if (run.activeNode.id === STORE_TRADE_NODE.id && !onUseTradePhone()) return;

    const hydratedRun = getHydratedRun(run);
    const nextRoster = hydratedRun.roster.filter((owned) => owned.id !== player.id);
    const nextLineup = hydratedRun.lineup.map((slot) =>
      slot.player?.id === player.id
        ? { ...slot, player: null }
        : { ...slot },
    );
    const nextChoicesState = drawRunChoices(
      run,
      getNodePlayerPool(run.activeNode, run.availablePool),
      nextRoster,
      run.activeNode.rewardChoices,
      nextChoiceSeed(run.seed, run.floorIndex + 30),
      getNodeChoiceTiers(run.activeNode) ? [...getNodeChoiceTiers(run.activeNode)!] : undefined,
      shouldStrictlyUseNodePool(run.activeNode),
    );

    setRun({
      ...run,
      roster: nextRoster,
      lineup: nextLineup,
      seenChoicePlayerIds: nextChoicesState.seenChoicePlayerIds,
      choices: nextChoicesState.choices,
      stage: "reward-draft",
      nodeResult: {
        title: run.activeNode.title,
        detail: `${player.name} was moved at the deadline. Choose 1 of 5 possible replacement players to bring back into your run roster.`,
        passed: true,
      },
    });
  };

  const replaceRosterPlayerWithReward = (playerToReplace: Player) => {
    if (!run || run.stage !== "reward-replace-select" || !run.pendingRewardPlayer) return;

    const incomingPlayer = run.pendingRewardPlayer;
    const nextRoster = [...run.roster.filter((owned) => owned.id !== playerToReplace.id), incomingPlayer];
    const lineupWithoutOutgoing = run.lineup.map((slot) =>
      slot.player?.id === playerToReplace.id
        ? { ...slot, player: null }
        : { ...slot },
    );
    const outgoingSlotIndex = run.lineup.findIndex((slot) => slot.player?.id === playerToReplace.id);
    const nextLineup =
      outgoingSlotIndex >= 0
        ? lineupWithoutOutgoing.map((slot, index) =>
            index === outgoingSlotIndex ? { ...slot, player: incomingPlayer } : { ...slot },
          )
        : assignPlayerToRoster(lineupWithoutOutgoing, incomingPlayer).roster;

    completeRewardDraftSelection(run, nextRoster, nextLineup);
  };

  const skipRewardDraftReplacement = () => {
    if (!run || run.stage !== "reward-replace-select") return;
    completeRewardDraftSelection(run, run.roster, run.lineup);
  };

  const moveRunPlayer = (fromIndex: number, toIndex: number) => {
    setRun((currentRun) => {
      if (!currentRun || fromIndex === toIndex) return currentRun;

      const hydratedRun = getHydratedRun(currentRun);
      const nextLineup = hydratedRun.lineup.map((slot) => ({ ...slot }));
      [nextLineup[fromIndex].player, nextLineup[toIndex].player] = [
        nextLineup[toIndex].player,
        nextLineup[fromIndex].player,
      ];

      return {
        ...hydratedRun,
        lineup: nextLineup,
      };
    });
  };

  const handleRosterPointerDown = (
    index: number,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!run) return;
    const interactiveRun = getHydratedRun(run);
    if (!interactiveRun.lineup[index]?.player) return;
    event.preventDefault();

    const rect = event.currentTarget.getBoundingClientRect();
    setDraggingIndex(index);
    setDropTargetIndex(null);
    setDragPointer({
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!run) {
      window.localStorage.removeItem(ROGUELIKE_STORAGE_KEY);
      window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ROGUELIKE_STORAGE_KEY, JSON.stringify(run));
  }, [run]);

  useEffect(() => {
    const shouldOpen =
      run?.stage === "faceoff-game" ||
      run?.stage === "node-result" ||
      run?.stage === "run-over" ||
      run?.stage === "run-cleared";

    setShowOutcomeOverlay(Boolean(shouldOpen));
  }, [run?.stage, run?.nodeResult?.title, run?.nodeResult?.detail]);

  useEffect(() => {
    if (typeof window === "undefined" || !run) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [run?.stage, run?.floorIndex, run?.activeNode?.id, run?.nodeResult?.title]);

  useEffect(() => {
    if (typeof window === "undefined" || run?.stage !== "ladder-overview") return;
    if (!currentLadderNodeRef.current) return;

    const rafId = window.requestAnimationFrame(() => {
      const targetTop = currentLadderNodeRef.current?.getBoundingClientRect().top;
      if (targetTop === undefined) return;

      window.scrollTo({
        top: Math.max(0, targetTop + window.scrollY - 110),
        left: 0,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [run?.stage, run?.floorIndex]);

  useEffect(() => {
    if (!run || run.stage !== "reward-draft") return;

    const sourceNode = run.activeNode ?? roguelikeNodes[run.floorIndex] ?? null;
    if (!sourceNode) return;

    if (!run.activeNode) {
      setRun({
        ...run,
        activeNode: sourceNode,
      });
      return;
    }

    if (run.choices.length > 0 || sourceNode.rewardChoices <= 0) return;

    const repairedChoicesState = drawRunChoices(
      run,
      getRewardDraftPool(run, sourceNode, run.availablePool),
      getRunOwnedPlayers(run),
      sourceNode.rewardChoices,
      nextChoiceSeed(run.seed, 900 + run.floorIndex * 37),
      getNodeChoiceTiers(sourceNode) ? [...getNodeChoiceTiers(sourceNode)!] : undefined,
      shouldStrictlyUseNodePool(sourceNode),
    );

    if (repairedChoicesState.choices.length === 0) return;

    setRun({
      ...run,
      activeNode: sourceNode,
      seenChoicePlayerIds: repairedChoicesState.seenChoicePlayerIds,
      choices: repairedChoicesState.choices,
    });
  }, [run]);

  useEffect(() => {
    if (!run && showPackSelectionHub) {
      setShowPackSelectionHub(false);
      setParkedRunState(false);
    }
  }, [run, showPackSelectionHub]);

  useEffect(() => {
    if (draggingIndex === null || dragPointer === null) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousWebkitUserSelect = document.body.style.webkitUserSelect;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

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
        ?.closest("[data-rogue-slot-index]");
      const nextTarget = hovered?.getAttribute("data-rogue-slot-index");
      setDropTargetIndex(nextTarget ? Number(nextTarget) : null);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const hovered = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-rogue-slot-index]");
      const nextTarget = hovered?.getAttribute("data-rogue-slot-index");
      if (nextTarget) {
        const targetIndex = Number(nextTarget);
        if (targetIndex !== draggingIndex) {
          moveRunPlayer(draggingIndex, targetIndex);
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
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragPointer, draggingIndex]);

  const handleBackToHome = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ROGUELIKE_STORAGE_KEY);
      window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
    }
    setRun(null);
    setShowPackSelectionHub(false);
    onBackToHome();
  };

  const leaveRun = () => {
    if (!run) {
      onLeaveRun();
      return;
    }

    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setShowPackSelectionHub(true);
    setParkedRunState(true);
    onLeaveRun();
  };

  const resumeRun = () => {
    if (!run) return;

    setShowPackSelectionHub(false);
    setParkedRunState(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const abortRun = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ROGUELIKE_STORAGE_KEY);
      window.localStorage.removeItem(ROGUELIKE_PARKED_STORAGE_KEY);
    }
    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setShowPackSelectionHub(false);
    setRun(null);
  };

  const backToRunLadder = () => {
    if (!run) return;

    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setRun({
      ...run,
      stage: "ladder-overview",
      selectedCutPlayerIds: [],
      selectedNaturalPositionPlayerId: null,
      selectedNaturalPosition: null,
      allStarAssignments: {
        dunkContest: null,
        threePointContest: null,
        skillsChallenge: null,
      },
      utilityReturnState: null,
      failureReviewStage: null,
    });
  };

  const reviewFailedChallenge = () => {
    if (!run || run.stage !== "run-over" || run.failureReviewStage !== "challenge-setup") return;
    setShowOutcomeOverlay(false);
  };
  const activeRogueStar = getPlayerById(activeRogueStarId);

  if (!run || showPackSelectionHub) {
    return (
      <section className="space-y-8">
        <div className="glass-panel rounded-[34px] p-8 shadow-card lg:p-10">
          <div className="inline-flex rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-fuchsia-100">
            Roguelike Mode
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-5xl text-white lg:text-7xl">
            Start with Nothing. Build a Dynasty.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200/85">
            This new mode is run-based. You start with a small player pool, draft just a few cards, then survive a ladder of draft nodes, chemistry checks, and boss gates while unlocking stronger bundles into your run.
          </p>

          {run ? (
            <div className="mt-6 rounded-[24px] border border-emerald-200/18 bg-[linear-gradient(135deg,rgba(10,49,41,0.96),rgba(14,80,65,0.9),rgba(10,25,44,0.94))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/78">Saved Run</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Resume Rogue Run</div>
                  <div className="mt-2 max-w-3xl text-sm leading-7 text-emerald-50/82">
                    Your unfinished climb is still parked and ready. Jump back in where you left off, or start fresh with a new starter pack below.
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-emerald-100/78">
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                      Act {Math.min(run.activeNode?.act ?? roguelikeNodes[Math.min(run.floorIndex, roguelikeNodes.length - 1)]?.act ?? 1, 4)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                      Floor {Math.min(run.floorIndex + 1, roguelikeNodes.length)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2">
                      {getRunOwnedPlayers(run).length} Players Owned
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resumeRun}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
                >
                  Resume Rogue Run
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : null}

          {activeRogueStar ? (
            <div className="mt-6 inline-flex max-w-3xl flex-wrap items-center gap-3 rounded-[22px] border border-amber-200/18 bg-amber-300/10 px-5 py-4 text-sm text-amber-50">
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/78">Active Rogue Star</div>
              <div className="font-semibold text-white">{activeRogueStar.name}</div>
              <div className="text-amber-100/76">{activeRogueStar.overall} OVR will replace one starter-pack card in this run.</div>
            </div>
          ) : null}

          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Starter Pack Power-Up</div>
            <div className="mt-2 text-xl font-semibold text-white">Choose which starter pack quality to open this run</div>
            <div className="mt-3 text-sm leading-7 text-slate-300">
              Standard packs average 80 OVR. Token Store upgrades can be spent here to raise your 3-card starter pack quality before you choose Balanced, Defense, or Offense.
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { id: "standard", title: "Standard", detail: "80 avg", owned: null },
                { id: "silver", title: "Silver", detail: "84 avg", owned: ownedSilverStarterPacks },
                { id: "gold", title: "Gold", detail: "85 avg", owned: ownedGoldStarterPacks },
                { id: "platinum", title: "Platinum", detail: "86 avg", owned: ownedPlatinumStarterPacks },
              ].map((option) => {
                const selected = selectedStarterPackUpgrade === option.id;
                const available = option.owned === null || option.owned > 0;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => available && setSelectedStarterPackUpgrade(option.id as "standard" | "silver" | "gold" | "platinum")}
                    disabled={!available}
                    className={clsx(
                      "rounded-[20px] border px-4 py-4 text-left transition",
                      selected
                        ? "border-amber-200/32 bg-amber-300/12"
                        : "border-white/10 bg-white/5 hover:bg-white/8",
                      !available && "cursor-not-allowed opacity-45 hover:bg-white/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{option.title} Starter Pack</div>
                        <div className="mt-2 text-lg font-semibold text-white">{option.detail}</div>
                      </div>
                      {option.owned !== null ? (
                        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                          {option.owned} owned
                        </div>
                      ) : (
                        <div className="rounded-full border border-emerald-200/16 bg-emerald-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-100">
                          Default
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Small opening pool", "Runs begin constrained, so every early card matters much more than it does in the standard mode."],
              ["Unlock bundles mid-run", "Success expands your arsenal with themed packs like Synergy Hunters, Jumbo Wings, and Elite Closers."],
              ["Failure ends the climb", "Lose all your lives and the run is over. The tension should come from trying to snowball without breaking your structure."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="font-semibold text-white">{title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-6 shadow-card lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Starter Packs</div>
              <h2 className="mt-2 font-display text-3xl text-white">Pick 1 of 3 opening packs</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Each run begins with a themed starter pack. Your first choice shapes the opening player pool, the early chemistry angle, and the kind of climb you are setting yourself up for.
              </p>
              {run ? (
                <p className="mt-2 max-w-3xl text-sm leading-7 text-amber-100/78">
                  Opening a new starter pack now will replace your parked Rogue run.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleBackToHome}
              className="rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to Home
            </button>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {roguelikeStarterPackages.map((item, index) => {
              const accentClasses = [
                "from-[#d9b84f]/70 via-[#9b7a22]/55 to-[#e8cf73]/75 border-amber-200/24 shadow-[0_22px_50px_rgba(251,191,36,0.16)]",
                "from-[#79c4ff]/65 via-[#2450a7]/58 to-[#a7d9ff]/72 border-sky-200/24 shadow-[0_22px_50px_rgba(56,189,248,0.16)]",
                "from-[#f0b74a]/60 via-[#4d2d8f]/62 to-[#f4d37a]/72 border-fuchsia-200/24 shadow-[0_22px_50px_rgba(217,70,239,0.16)]",
              ][index] ?? "from-white/8 via-white/4 to-white/10 border-white/10";
              const simplifiedTitle =
                item.id === "balanced-foundation"
                  ? "Balanced Pack"
                  : item.id === "defense-lab"
                    ? "Defense Pack"
                    : item.id === "creator-camp"
                      ? "Offense Pack"
                      : item.title;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => startRun(item.id)}
                  className={clsx(
                    "group relative overflow-hidden rounded-[30px] border bg-gradient-to-b p-4 text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01]",
                    accentClasses,
                  )}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_28%)]" />
                  <div className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.06))]" />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(0deg,rgba(255,255,255,0.28),rgba(255,255,255,0.04))]" />
                  <div className="absolute inset-x-0 top-4 h-4 bg-white/12 blur-[2px]" />
                  <div className="absolute inset-x-0 bottom-4 h-4 bg-black/10 blur-[2px]" />
                  <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.24)_0.8px,transparent_0.8px)] [background-position:0_0] [background-size:14px_14px]" />
                  <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-[26px] border border-white/18 bg-[linear-gradient(180deg,rgba(43,83,198,0.9),rgba(26,48,118,0.92))] px-6 py-8 text-center shadow-[0_18px_40px_rgba(16,24,40,0.28),inset_0_1px_0_rgba(255,255,255,0.18)]">
                    <div className="text-[12px] uppercase tracking-[0.24em] text-white/82">Rogue Starter Pack</div>
                    <div className="mt-4 font-display text-[2rem] leading-tight text-white">
                      {simplifiedTitle}
                    </div>
                  </div>

                  <div className="relative flex h-full min-h-[500px] flex-col justify-end">
                    <div className="flex justify-end rounded-[22px] border border-white/14 bg-black/24 px-4 py-4 backdrop-blur-[2px]">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition group-hover:bg-amber-100">
                        Open Pack
                        <ArrowRight size={15} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </section>
    );
  }

  const activeNode = run.activeNode;
  const allStarterCardsRevealed = run.revealedStarterIds.length === run.starterRevealPlayers.length;
  const displayedRun = getHydratedRun(run);
  const runOwnedPlayers = getRunOwnedPlayers(displayedRun);
  const runOwnedDisplayPlayers = runOwnedPlayers.map((player) => getRunDisplayPlayer(player, run.trainedPlayerIds ?? []));
  const runOwnedDisplayPlayerById = new Map(runOwnedDisplayPlayers.map((player) => [player.id, player]));
  const runOwnedPlayerIds = runOwnedPlayers.map((player) => player.id);
  const currentLadderNode = roguelikeNodes[Math.min(run.floorIndex, roguelikeNodes.length - 1)] ?? null;
  const currentAct = activeNode?.act ?? currentLadderNode?.act ?? 1;
  const challengeFocusMetrics =
    run.stage === "challenge-setup" || run.stage === "node-preview" || run.failureReviewStage === "challenge-setup"
      ? activeNode?.checks?.map((check) => check.metric) ?? []
      : [];
  const startingFive = displayedRun.lineup.slice(0, 5);
  const startingFiveReady = startingFive.every((slot) => Boolean(slot.player));
  const startingFiveMetrics = evaluateRoguelikeLineup(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const shotCreationScore = getAverageAdjustedOffense(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const reboundingChallengeScore = getAverageAdjustedRebounding(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const challengeMetric = activeNode?.checks?.[0]?.metric ?? "offense";
  const activeChallengeScore =
    challengeMetric === "offense"
      ? shotCreationScore
      : challengeMetric === "rebounding"
        ? reboundingChallengeScore
        : startingFiveMetrics[challengeMetric];
  const canUseDraftShuffle =
    run.draftShuffleTickets > 0 &&
    (run.stage === "initial-draft" || run.stage === "reward-draft") &&
    run.choices.length > 0;
  const faceoffOpponentLineup =
    activeNode?.battleMode === "starting-five-faceoff" && run.activeOpponentPlayerIds
      ? buildRoguelikeOpponentLineup({
          ...activeNode,
          opponentPlayerIds: run.activeOpponentPlayerIds,
        }).slice(0, 5)
      : [];
  const faceoffFinalScore =
    run.stage === "faceoff-game" && run.nodeResult?.faceoffResult
      ? getFaceoffFinalScore(run.nodeResult.faceoffResult)
      : null;
  const completedNode =
    run.stage === "node-result" && run.floorIndex > 0
      ? roguelikeNodes[run.floorIndex - 1] ?? null
      : null;
  const nodeResultDisplayNode = activeNode ?? completedNode;
  const nodeResultFinalScore =
    run.stage === "node-result" && run.nodeResult?.faceoffResult
      ? getFaceoffFinalScore(run.nodeResult.faceoffResult)
      : null;
  const activeNodeClearRewards = activeNode ? getRoguelikeClearRewards(activeNode) : null;
  const activeNodeShowsClearRewards =
    Boolean(activeNodeClearRewards) &&
    ((activeNodeClearRewards?.tokenReward ?? 0) > 0 || (activeNodeClearRewards?.prestigeXpAward ?? 0) > 0);
  const nodeResultClearRewards = nodeResultDisplayNode ? getRoguelikeClearRewards(nodeResultDisplayNode) : null;
  const nodeResultShowsClearRewards =
    Boolean(nodeResultClearRewards) &&
    ((nodeResultClearRewards?.tokenReward ?? 0) > 0 || (nodeResultClearRewards?.prestigeXpAward ?? 0) > 0);
  const nodeResultRewardCopy = nodeResultDisplayNode ? getNodeCompletionRewardCopy(nodeResultDisplayNode) : null;
  const nodeResultReferencesDraftShuffle = (run.nodeResult?.detail ?? "").includes("Draft Shuffle");
  const nodeResultHasRewardChoices = run.stage === "node-result" && run.choices.length > 0;
  const nodeResultShowsRewardSummary =
    nodeResultHasRewardChoices || nodeResultReferencesDraftShuffle || nodeResultShowsClearRewards;
  const upcomingNodeAfterResult = run.stage === "node-result" ? roguelikeNodes[run.floorIndex] ?? null : null;
  const nodeResultNextStepDescription = nodeResultHasRewardChoices
    ? `Next up: choose 1 of ${run.choices.length} player${run.choices.length === 1 ? "" : "s"} to add to your run roster${upcomingNodeAfterResult ? ` before ${upcomingNodeAfterResult.title}.` : "."}`
    : upcomingNodeAfterResult
      ? `Next up: head back to the run ladder and get ready for ${upcomingNodeAfterResult.title}.`
      : "This node is complete. Continue when you're ready for the next step.";
  const firstBossCleared = run.unlockedBundleIds.includes("synergy-hunters");
  const furthestOccupiedSlotIndex = displayedRun.lineup.reduce(
    (furthestIndex, slot, index) => (slot.player ? index : furthestIndex),
    -1,
  );
  const visibleRosterSlotCount = Math.min(
    10,
    Math.max(5, runOwnedPlayers.length, furthestOccupiedSlotIndex + 1),
  );
  const visibleRunLineup = displayedRun.lineup.slice(0, visibleRosterSlotCount);
  const canUseStoreUtilities =
    !["starter-reveal", "initial-draft", "reward-draft", "training-select", "trade-offer", "trade-select", "evolution-select", "faceoff-game", "node-result", "run-over", "run-cleared"].includes(run.stage);
  const showDraftRosterRail =
        run.stage === "initial-draft" ||
        run.stage === "reward-draft" ||
        run.stage === "faceoff-setup" ||
        run.stage === "challenge-setup" ||
        run.stage === "add-position-select" ||
        run.stage === "all-star-select" ||
        run.stage === "roster-cut-select" ||
        run.stage === "training-select" ||
        run.stage === "trade-offer" ||
        run.stage === "trade-select" ||
        run.stage === "evolution-select" ||
        (run.stage === "run-over" && run.failureReviewStage === "challenge-setup" && !showOutcomeOverlay);
  const reviewingFailedChallenge =
    run.stage === "run-over" && run.failureReviewStage === "challenge-setup" && !showOutcomeOverlay;
  const shouldRenderOutcomeOverlay =
    showOutcomeOverlay &&
    run.stage === "faceoff-game" ||
    showOutcomeOverlay && run.stage === "node-result" ||
    showOutcomeOverlay && run.stage === "run-over" ||
    showOutcomeOverlay && run.stage === "run-cleared";
  const hideRightRail = run.stage === "training-select" || run.stage === "reward-replace-select";
  const outcomeTone =
    run.stage === "run-over" || (run.stage === "faceoff-game" && run.nodeResult?.passed === false)
      ? "failure"
      : "success";

  const runRosterPanel = (
    <div className="glass-panel rounded-[30px] p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Roster</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            {runOwnedPlayers.length > 5
              ? "Your run roster is expanding. Every new player added to the run opens the next roster slot, up to a full 10-player group."
              : "Early run focus: build and organize your starting five before the first boss faceoff."}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
          {Math.min(runOwnedPlayers.length, visibleRosterSlotCount)}/{visibleRosterSlotCount} Cards
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {visibleRunLineup.map((slot, index) => (
          <div key={`${slot.slot}-${index}`}>
            {index === 5 ? (
              <div className="mb-5 mt-7">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <div className="mt-2 text-center text-[10px] uppercase tracking-[0.24em] text-slate-500">
                  Bench Unit
                </div>
              </div>
            ) : null}
            <div
              data-rogue-slot-index={index}
              className={clsx(
                "rounded-[24px] border border-dashed p-1.5 transition",
                dropTargetIndex === index ? "border-amber-300/60 bg-amber-300/10" : "border-white/12 bg-black/12",
              )}
            >
              <div onPointerDown={(event) => handleRosterPointerDown(index, event)}>
                <RogueRosterSlotCard
                  slot={slot}
                  index={index}
                  ownedPlayerIds={runOwnedPlayerIds}
                  trainedPlayerIds={run.trainedPlayerIds ?? []}
                  focusMetrics={challengeFocusMetrics}
                  dragged={draggingIndex === index}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-[30px] p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-fuchsia-100/80">Roguelike Run</div>
            <h1 className="mt-2 font-display text-4xl text-white">{getActHeading(currentAct)}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              {getActDescription(currentAct)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={leaveRun}
              className="rounded-[22px] border border-white/12 bg-white/6 px-5 py-3 text-left text-slate-100 transition hover:scale-[1.02] hover:border-white/20 hover:bg-white/10"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300/82">
                Leave Run
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">Save & Exit</div>
            </button>
            <button
              type="button"
              onClick={abortRun}
              className="rounded-[22px] border border-rose-200/22 bg-[linear-gradient(135deg,rgba(127,29,29,0.95),rgba(153,27,27,0.92),rgba(69,10,10,0.96))] px-5 py-3 text-left text-rose-50 shadow-[0_16px_36px_rgba(127,29,29,0.24)] transition hover:scale-[1.02] hover:border-rose-100/30 hover:bg-[linear-gradient(135deg,rgba(153,27,27,0.98),rgba(185,28,28,0.94),rgba(87,13,13,0.98))]"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-rose-100/82">
                Abort Run
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">End Now</div>
            </button>
            <button
              type="button"
              onClick={useDraftShuffleTicket}
              disabled={!canUseDraftShuffle}
              className={clsx(
                "rounded-[22px] border px-5 py-3 text-left transition",
                canUseDraftShuffle
                  ? "border-indigo-200/22 bg-[linear-gradient(135deg,rgba(37,46,104,0.95),rgba(67,56,202,0.88),rgba(20,24,60,0.96))] text-indigo-50 shadow-[0_16px_36px_rgba(67,56,202,0.24)] hover:scale-[1.02] hover:border-indigo-100/30"
                  : "cursor-not-allowed border-white/10 bg-white/5 text-slate-300 opacity-70",
              )}
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-current">
                <RefreshCcw size={12} />
                Draft Shuffle
              </div>
              <div className="mt-2 text-xl font-semibold text-white">{run.draftShuffleTickets}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-current">
                {canUseDraftShuffle ? "Reroll current board" : "No live board to reroll"}
              </div>
            </button>
            {canUseStoreUtilities && ownedTrainingCampTickets > 0 ? (
              <button
                type="button"
                onClick={openStoreTrainingCamp}
                className="rounded-[22px] border border-sky-200/18 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(15,52,96,0.9),rgba(9,19,34,0.96))] px-5 py-3 text-left text-sky-50 shadow-[0_16px_36px_rgba(14,116,144,0.2)] transition hover:scale-[1.02] hover:border-sky-100/30"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-sky-100/82">
                  Training Camp Ticket
                </div>
                <div className="mt-2 text-xl font-semibold text-white">Use Ticket</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-sky-100/74">
                  {ownedTrainingCampTickets} owned
                </div>
              </button>
            ) : null}
            {canUseStoreUtilities && ownedTradePhones > 0 ? (
              <button
                type="button"
                onClick={openStoreTradePhone}
                className="rounded-[22px] border border-fuchsia-200/18 bg-[linear-gradient(135deg,rgba(54,18,76,0.95),rgba(91,33,182,0.84),rgba(25,12,48,0.96))] px-5 py-3 text-left text-fuchsia-50 shadow-[0_16px_36px_rgba(126,34,206,0.22)] transition hover:scale-[1.02] hover:border-fuchsia-100/30"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-100/82">
                  Trade Phone
                </div>
                <div className="mt-2 text-xl font-semibold text-white">Make A Trade</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-fuchsia-100/74">
                  {ownedTradePhones} owned
                </div>
              </button>
            ) : null}
            {[
              { label: "OVR", value: metrics.overall || "--", icon: Crown, tone: "text-amber-100 bg-amber-300/10 border-amber-200/16" },
              { label: "OFF", value: metrics.offense || "--", icon: Zap, tone: "text-orange-100 bg-orange-300/10 border-orange-200/16" },
              { label: "DEF", value: metrics.defense || "--", icon: Shield, tone: "text-sky-100 bg-sky-300/10 border-sky-200/16" },
              { label: "CHEM", value: metrics.chemistry || "--", icon: Sparkles, tone: "text-lime-100 bg-lime-300/10 border-lime-200/16" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-[22px] border px-4 py-3 ${stat.tone}`}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                  <stat.icon size={13} />
                  {stat.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "grid gap-6",
          run.stage === "starter-reveal" || run.stage === "ladder-overview" || hideRightRail
            ? "grid-cols-1"
            : "xl:grid-cols-[1.15fr_0.85fr]",
        )}
      >
        <div className="space-y-6">
          {run.stage === "starter-reveal" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Starter Reveal</div>
              <h2 className="mt-2 font-display text-3xl text-white">Open your first 3 cards</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Every run begins with three face-down starter cards. Reveal all three to see the kind of foundation this pack is giving you before you move onto the Run Ladder.
              </p>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {run.starterRevealPlayers.map((player, index) => {
                  const revealed = run.revealedStarterIds.includes(player.id);

                  return (
                    <StarterRevealCard
                      key={player.id}
                      player={player}
                      index={index}
                      revealed={revealed}
                      onReveal={() => revealStarterCard(player.id)}
                    />
                  );
                })}
              </div>

              {allStarterCardsRevealed ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={proceedToRunLadder}
                    className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                  >
                    Proceed to Run Ladder
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {run.stage === "ladder-overview" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Ladder</div>
              <h2 className="mt-2 font-display text-4xl text-white">Map the climb before it starts</h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
                This is the full run path. You will move through draft nodes, chemistry checks, and boss gates until you either survive the gauntlet or the run collapses. Study the ladder first, then begin your opening draft.
              </p>

              <div className="mt-8 hidden grid-cols-[minmax(0,1fr)_220px] items-end gap-4 pl-7 pr-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 xl:grid">
                <div>Nodes</div>
                <div className="text-right">Rewards</div>
              </div>
              <div className="relative mt-3 space-y-4 pl-7 before:absolute before:bottom-4 before:left-3 before:top-4 before:w-px before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06),rgba(255,255,255,0))]">
                {roguelikeNodes.map((node, index) => {
                  const isCurrent = index === run.floorIndex;
                  const isCleared = index < run.floorIndex;
                  const isLocked = index > run.floorIndex;
                  const rewards = getRoguelikeClearRewards(node);
                  const rewardsEarned =
                    doesRoguelikeNodeAwardClearRewards(node) &&
                    hasEarnedNodeReward(run, index, run.nodeResult);
                  const actTheme = getActLadderTheme(node.act);
                  const summary = node.targetLabel
                    ? { label: "Target", value: node.targetLabel }
                    : node.rewardBundleId
                      ? { label: "Reward", value: getBundle(node.rewardBundleId).title }
                      : { label: "Reward", value: "Training boost" };

                  return (
                    <div key={node.id} className="relative grid gap-4 pl-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-stretch">
                      <div
                        className={clsx(
                          "absolute left-[-1px] top-7 h-4 w-4 rounded-full border-4 border-[#090b12]",
                          isCleared ? "bg-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.45)]" : actTheme.accent,
                        )}
                      />
                      <div
                        ref={isCurrent ? currentLadderNodeRef : null}
                        className={clsx(
                          "rounded-[24px] border px-5 py-5 transition",
                          isCurrent
                            ? actTheme.current
                            : isCleared
                              ? "border-emerald-300/45 bg-[linear-gradient(135deg,rgba(6,78,59,0.42),rgba(16,185,129,0.16),rgba(5,46,22,0.5))] shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_34px_rgba(16,185,129,0.2)]"
                              : actTheme.shell,
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className={clsx("text-[10px] uppercase tracking-[0.2em]", isCleared ? "text-emerald-100/90" : actTheme.eyebrow)}>
                              Act {node.act} | Floor {node.floor}
                            </div>
                            <div className="mt-2 font-semibold text-white">{node.title}</div>
                          </div>
                          {isCurrent ? (
                            <button
                              type="button"
                              onClick={startOpeningDraft}
                              className="rounded-full bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:scale-[1.02]"
                            >
                              {node.battleMode === "starting-five-faceoff" ? "Set Lineup" : "Go"}
                            </button>
                          ) : (
                            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                              {isCleared ? "Cleared" : isLocked ? "Locked" : node.type}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-sm leading-6 text-slate-300">{node.description}</div>
                        <div
                          className={clsx(
                            "mt-4 rounded-[18px] border px-4 py-3.5",
                            isCleared ? "border-emerald-200/22 bg-emerald-300/10 text-emerald-50/94" : node.targetLabel ? actTheme.target : actTheme.reward,
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white">
                              <Target size={14} />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.22em] text-white/62">
                                {summary.label}
                              </div>
                              <div className="mt-1 text-sm font-semibold leading-6 text-current">
                                {summary.value}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="xl:pt-1">
                        <RogueNodeRewardsRail rewards={rewards} earned={rewardsEarned} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {run.stage === "initial-draft" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Opening Draft</div>
              <h2 className="mt-2 font-display text-3xl text-white">Complete your starting five</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Starter Cache is open. Make two picks from current-season D-tier boards to turn your three-card starter pack into a full opening lineup.
              </p>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {run.choices.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={draftChoice}
                    compact
                    draftedPlayerIds={runOwnedPlayerIds}
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "faceoff-setup" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Set Your Starting Five</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Drag your players into the exact PG, SG, SF, PF, and C starter slots you want before the faceoff. Each starter is matched directly with the boss player at the same position, and every matchup creates its own win probability.
              </p>
              <div className="mt-5 rounded-[22px] border border-fuchsia-200/14 bg-fuchsia-300/8 px-4 py-4 text-sm text-slate-100">
                Boss team: {activeNode.opponentTeamName ?? "Starting Five"}.
                The total of all five matchup win probabilities decides the winner.
              </div>
              <div className="mt-6 grid gap-4">
                {startingFive.map((slot, index) => (
                  <div key={`${slot.slot}-${index}`} className="rounded-[26px] border border-white/10 bg-black/18 p-4">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <FaceoffStarterCard
                        player={faceoffOpponentLineup[index]?.player ?? null}
                        slot={faceoffOpponentLineup[index] ?? slot}
                        slotLabel={`Boss ${slot.slot}`}
                        ownedPlayerIds={faceoffOpponentLineup.map((entry) => entry.player?.id).filter((id): id is string => Boolean(id))}
                        align="right"
                      />
                      <FaceoffStarterCard
                        player={slot.player}
                        slot={slot}
                        slotLabel={`Your ${slot.slot}`}
                        ownedPlayerIds={runOwnedPlayerIds}
                        trainedPlayerIds={run.trainedPlayerIds ?? []}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startFaceoffGame}
                  disabled={!startingFiveReady}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    startingFiveReady
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Start Faceoff Game
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

            {(run.stage === "challenge-setup" || reviewingFailedChallenge) && activeNode && (
              <div className="glass-panel rounded-[30px] p-6 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Set Your Starting Five</div>
                <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {challengeMetric === "rebounding"
                    ? "Drag your best five players into the starter slots. This challenge grades your Starting 5 Score as the average Rebounding rating of your five starters, so build for size, positioning, and control on the glass."
                    : "Drag your best five players into the starter slots. This challenge grades your Starting 5 Score as the average Offense rating of your five starters, so use your bench slot to sit your weakest offensive piece."}
                </p>
              <div className="mt-6 rounded-[24px] border border-white/12 bg-black/14 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Challenge Goal</div>
                    <div className="mt-2 text-lg font-semibold text-white">{activeNode.targetLabel}</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-white/12 bg-white/5 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Starting 5 Score</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{activeChallengeScore}</div>
                    </div>
                    <div className="rounded-[20px] border border-amber-200/18 bg-amber-300/8 px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/80">Target</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{activeNode.checks?.[0]?.target ?? "--"}</div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={startLineupChallenge}
                disabled={!startingFiveReady || reviewingFailedChallenge}
                className={clsx(
                  "mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                  startingFiveReady && !reviewingFailedChallenge
                    ? "bg-white text-slate-900 hover:scale-[1.02]"
                    : "cursor-not-allowed bg-white/10 text-slate-500",
                )}
              >
                {reviewingFailedChallenge ? "Run Failed" : "Run Challenge"}
                <ArrowRight size={16} />
              </button>
              {!reviewingFailedChallenge ? <BackToRunLadderButton onClick={backToRunLadder} /> : null}
            </div>
          )}

          {run.stage === "training-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Training Node</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Select 1 player from your run roster to send to training. This will increase that player&apos;s Overall Rating by +1 for the remainder of the run.
              </p>
              <div className="mt-5 rounded-[22px] border border-emerald-200/14 bg-emerald-300/8 px-4 py-4 text-sm text-slate-100">
                The training boost is permanent for the rest of this Rogue run and carries through the underlying lineup calculations too.
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {runOwnedDisplayPlayers.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={sendPlayerToTraining}
                    compact
                    draftedPlayerIds={runOwnedPlayerIds}
                    actionLabel="Send to training"
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "roster-cut-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Roster Cut</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Select exactly 2 players to cut from your run roster. Those players will be removed permanently, and the rest of your rotation will carry forward.
              </p>
              <div className="mt-5 rounded-[22px] border border-rose-200/14 bg-rose-300/8 px-4 py-4 text-sm text-slate-100">
                Cuts selected: {run.selectedCutPlayerIds.length}/2. Choose carefully. Once you confirm, those cards are gone for the rest of this Rogue run.
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {runOwnedDisplayPlayers.map((player) => {
                  const selected = run.selectedCutPlayerIds.includes(player.id);

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => toggleRosterCutPlayer(player)}
                      className={clsx(
                        "rounded-[24px] border px-5 py-4 text-left transition",
                        selected
                          ? "border-rose-300/50 bg-[linear-gradient(135deg,rgba(127,29,29,0.32),rgba(153,27,27,0.18),rgba(69,10,10,0.32))] shadow-[0_0_0_1px_rgba(252,165,165,0.14)]"
                          : "border-white/10 bg-black/18 hover:border-white/18 hover:bg-white/6",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            {player.primaryPosition}
                          </div>
                          <div className="mt-2 text-xl font-semibold text-white">{player.name}</div>
                          <div className="mt-2 text-sm text-slate-300">
                            {player.overall} OVR
                            {player.secondaryPositions.length > 0
                              ? ` | ${[player.primaryPosition, ...player.secondaryPositions].join(" / ")}`
                              : ""}
                          </div>
                        </div>
                        <div
                          className={clsx(
                            "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]",
                            selected
                              ? "border-rose-200/30 bg-rose-300/16 text-rose-50"
                              : "border-white/10 bg-white/6 text-slate-300",
                          )}
                        >
                          {selected ? "Cutting" : "Keep"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmRosterCut}
                  disabled={run.selectedCutPlayerIds.length !== 2}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    run.selectedCutPlayerIds.length === 2
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Confirm Cuts
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "add-position-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Add A Natural Position</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Choose 1 player from your run roster, then add 1 new natural position that player does not already have.
              </p>
              <div className="mt-5 rounded-[22px] border border-sky-200/14 bg-sky-300/8 px-4 py-4 text-sm text-slate-100">
                This new natural position lasts for the rest of the Rogue run and improves lineup flexibility anywhere that position matters.
              </div>

              <div className="mt-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Step 1</div>
                <div className="mt-2 text-sm font-semibold text-white">Select a player</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {runOwnedDisplayPlayers.map((player) => {
                    const selected = run.selectedNaturalPositionPlayerId === player.id;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => selectNaturalPositionPlayer(player)}
                        className={clsx(
                          "rounded-[24px] border px-5 py-4 text-left transition",
                          selected
                            ? "border-sky-300/50 bg-[linear-gradient(135deg,rgba(14,116,144,0.28),rgba(59,130,246,0.18),rgba(15,23,42,0.32))]"
                            : "border-white/10 bg-black/18 hover:border-white/18 hover:bg-white/6",
                        )}
                      >
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{player.primaryPosition}</div>
                        <div className="mt-2 text-xl font-semibold text-white">{player.name}</div>
                        <div className="mt-2 text-sm text-slate-300">
                          {[player.primaryPosition, ...player.secondaryPositions].join(" / ")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {run.selectedNaturalPositionPlayerId ? (
                <div className="mt-8">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Step 2</div>
                  <div className="mt-2 text-sm font-semibold text-white">Choose a new natural position</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(["PG", "SG", "SF", "PF", "C"] as Position[]).map((position) => {
                      const selectedPlayer = runOwnedDisplayPlayers.find(
                        (player) => player.id === run.selectedNaturalPositionPlayerId,
                      );
                      const alreadyNatural = selectedPlayer
                        ? selectedPlayer.primaryPosition === position ||
                          selectedPlayer.secondaryPositions.includes(position)
                        : false;

                      return (
                        <button
                          key={position}
                          type="button"
                          onClick={() => selectNaturalPosition(position)}
                          disabled={alreadyNatural}
                          className={clsx(
                            "rounded-full border px-5 py-3 text-sm font-semibold transition",
                            alreadyNatural
                              ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-500"
                              : run.selectedNaturalPosition === position
                                ? "border-sky-300/50 bg-sky-300/14 text-white"
                                : "border-white/12 bg-white/6 text-white hover:bg-white/10",
                          )}
                        >
                          {position}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmNaturalPositionAdd}
                  disabled={!run.selectedNaturalPositionPlayerId || !run.selectedNaturalPosition}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    run.selectedNaturalPositionPlayerId && run.selectedNaturalPosition
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Confirm New Position
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "all-star-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">All-Star Saturday</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Assign one player to each event. Dunk Contest gives +5 Athleticism, 3PT Contest gives +5 Shooting, and Skills Challenge gives +5 Ball Dominance for the rest of the run.
              </p>
              <div className="mt-6 grid gap-5 xl:grid-cols-3">
                {[
                  { key: "dunkContest" as const, title: "Dunk Contest", stat: "Athleticism +5" },
                  { key: "threePointContest" as const, title: "3PT Contest", stat: "Shooting +5" },
                  { key: "skillsChallenge" as const, title: "Skills Challenge", stat: "Ball Dominance +5" },
                ].map((eventCard) => (
                  <div key={eventCard.key} className="rounded-[24px] border border-white/10 bg-black/18 p-5">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{eventCard.title}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{eventCard.stat}</div>
                    <div className="mt-4 space-y-3">
                      {runOwnedDisplayPlayers.map((player) => {
                        const selected = run.allStarAssignments[eventCard.key] === player.id;
                        const alreadyUsedInAnotherEvent = Object.entries(run.allStarAssignments).some(
                          ([assignmentKey, playerId]) => assignmentKey !== eventCard.key && playerId === player.id,
                        );

                        return (
                          <button
                            key={`${eventCard.key}-${player.id}`}
                            type="button"
                            onClick={() => assignAllStarPlayer(eventCard.key, player)}
                            disabled={alreadyUsedInAnotherEvent}
                            className={clsx(
                              "w-full rounded-[18px] border px-4 py-3 text-left transition",
                              selected
                                ? "border-amber-300/40 bg-amber-300/12"
                                : alreadyUsedInAnotherEvent
                                  ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-500"
                                  : "border-white/10 bg-white/6 hover:bg-white/10",
                            )}
                          >
                            <div className="text-sm font-semibold text-white">{player.name}</div>
                            <div className="mt-1 text-xs text-slate-300">
                              {player.overall} OVR | {[player.primaryPosition, ...player.secondaryPositions].join(" / ")}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runAllStarSaturday}
                  disabled={
                    !run.allStarAssignments.dunkContest ||
                    !run.allStarAssignments.threePointContest ||
                    !run.allStarAssignments.skillsChallenge
                  }
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition",
                    run.allStarAssignments.dunkContest &&
                    run.allStarAssignments.threePointContest &&
                    run.allStarAssignments.skillsChallenge
                      ? "bg-white text-slate-900 hover:scale-[1.02]"
                      : "cursor-not-allowed bg-white/10 text-slate-500",
                  )}
                >
                  Run All-Star Saturday
                  <ArrowRight size={16} />
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "reward-replace-select" && run.pendingRewardPlayer && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Full Roster</div>
              <h2 className="mt-2 font-display text-3xl text-white">Choose 1 player to replace</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {run.pendingRewardPlayer.name} is ready to join your run, but your roster is already full. Select
                1 current player to swap out, or skip this reward and keep your team intact.
              </p>
              <div className="mt-5 rounded-[22px] border border-amber-200/14 bg-amber-300/8 px-4 py-4 text-sm text-slate-100">
                The incoming reward player replaces exactly 1 current player. Skipping this pick keeps your full roster unchanged and moves the run forward.
              </div>
              <div className="mt-5 rounded-[22px] border border-indigo-200/14 bg-indigo-300/8 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-100/80">Incoming Reward</div>
                <div className="mt-2 text-2xl font-semibold text-white">{run.pendingRewardPlayer.name}</div>
                <div className="mt-1 text-sm text-slate-200">
                  {run.pendingRewardPlayer.overall} OVR | {run.pendingRewardPlayer.primaryPosition}
                  {run.pendingRewardPlayer.secondaryPositions.length
                    ? ` / ${run.pendingRewardPlayer.secondaryPositions.join(" / ")}`
                    : ""}
                </div>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {runOwnedDisplayPlayers.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={replaceRosterPlayerWithReward}
                    compact
                    draftedPlayerIds={runOwnedPlayerIds}
                    actionLabel="Replace this player"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={skipRewardDraftReplacement}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Skip This Pick
                <ArrowRight size={16} />
              </button>
              <BackToRunLadderButton onClick={backToRunLadder} className="mt-4" />
            </div>
          )}

          {run.stage === "trade-offer" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Trade Node</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                It&apos;s Trade Deadline day. Would you like to trade 1 of your players? If yes, you will be given the opportunity to pick 1 out of 5 possible players.
              </p>
              <div className="mt-5 rounded-[22px] border border-amber-200/14 bg-amber-300/8 px-4 py-4 text-sm text-slate-100">
                Trading is optional. If you pass, you keep your current roster intact and continue deeper into the run.
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openTradeSelection}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  Explore Trades
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={declineTradeDeadline}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Keep My Team
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "trade-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Trade Node</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Select 1 player from your run roster to trade away. After that, you&apos;ll get to draft 1 replacement from 5 possible players.
              </p>
              <div className="mt-5 rounded-[22px] border border-rose-200/14 bg-rose-300/8 px-4 py-4 text-sm text-slate-100">
                The selected player leaves your run immediately, so this is a true swap instead of a free add.
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {runOwnedDisplayPlayers.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={tradePlayerForReplacement}
                    compact
                    draftedPlayerIds={runOwnedPlayerIds}
                    actionLabel="Trade this player"
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "evolution-select" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Evolution Node</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Select 1 eligible version player from your run roster to evolve. The player will be replaced by their next stronger version for the rest of this run.
              </p>
              <div className="mt-5 rounded-[22px] border border-cyan-200/14 bg-cyan-300/8 px-4 py-4 text-sm text-slate-100">
                Evolution only works on players who already have a stronger version in the pool. If you found a lower version earlier, this is where it pays off.
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {getRoguelikeEvolutionOptions(runOwnedPlayers).map((option) => (
                  <DraftPlayerCard
                    key={option.currentPlayer.id}
                    player={runOwnedDisplayPlayerById.get(option.currentPlayer.id) ?? option.currentPlayer}
                    onSelect={evolveRunPlayer}
                    compact
                    draftedPlayerIds={runOwnedPlayerIds}
                    actionLabel={`Evolve to ${option.nextPlayer.overall} OVR`}
                  />
                ))}
              </div>
              <BackToRunLadderButton onClick={backToRunLadder} />
            </div>
          )}

          {run.stage === "faceoff-game" && activeNode && run.nodeResult?.faceoffResult && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Faceoff Result</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult.detail}</p>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-200/16 bg-emerald-300/8 p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/80">Your Team Total</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {run.nodeResult.faceoffResult.userTeamWinProbability}%
                  </div>
                </div>
                <div className="rounded-[24px] border border-rose-200/16 bg-rose-300/8 p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-rose-100/80">Boss Team Total</div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {run.nodeResult.faceoffResult.opponentTeamWinProbability}%
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {run.nodeResult.faceoffResult.matchups.map((matchup) => (
                  <FaceoffMatchupRow
                    key={`${matchup.slot}-${matchup.userPlayer?.id ?? "empty"}-${matchup.opponentPlayer?.id ?? "boss"}`}
                    matchup={matchup}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={run.nodeResult?.passed ? continueAfterFaceoff : abortRun}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
              >
                {run.nodeResult?.passed ? "Continue" : "Try Again"}
                <ArrowRight size={16} />
              </button>
              {!run.nodeResult?.passed ? (
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white"
                >
                  Back to Home
                </button>
              ) : null}
            </div>
          )}

          {run.stage === "reward-draft" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Reward Draft</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult?.title ?? "Choose 1 reward"}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult?.detail}</p>
              <div
                className={clsx(
                  "mt-6 grid gap-5",
                  run.choices.length === 3
                    ? "mx-auto max-w-5xl md:grid-cols-2 xl:grid-cols-3"
                    : "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5",
                )}
              >
                {run.choices.map((player) => (
                  <DraftPlayerCard
                    key={player.id}
                    player={player}
                    onSelect={draftChoice}
                    compact
                    draftedPlayerIds={runOwnedPlayerIds}
                  />
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={skipRewardDraft}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Skip This Pick
                </button>
                <BackToRunLadderButton onClick={backToRunLadder} className="" />
              </div>
            </div>
          )}

          {run.stage === "node-result" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Update</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult?.title}</h2>
              {nodeResultReferencesDraftShuffle ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/18 bg-indigo-300/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-indigo-100">
                  <RefreshCcw size={14} />
                  Draft Shuffle Ticket
                </div>
              ) : null}
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult?.detail}</p>
              {run.nodeResult?.faceoffResult && nodeResultFinalScore ? (
                <>
                  <div className="mt-6 rounded-[26px] border border-emerald-100/16 bg-emerald-300/8 p-5">
                    <div className="text-center text-[10px] uppercase tracking-[0.24em] text-white/72">Final Score</div>
                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                      <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                          {nodeResultDisplayNode?.opponentTeamName ?? "Boss Team"}
                        </div>
                        <div className="mt-3 text-4xl font-semibold leading-none text-white">
                          {nodeResultFinalScore.opponentScore}
                        </div>
                      </div>
                      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/46">
                        vs
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">Your Team</div>
                        <div className="mt-3 text-4xl font-semibold leading-none text-white">
                          {nodeResultFinalScore.userScore}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-sm text-white/74">
                      You won the faceoff against {nodeResultDisplayNode?.opponentTeamName ?? "the boss team"}.
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {run.nodeResult.faceoffResult.matchups.map((matchup) => (
                      <FaceoffMatchupRow
                        key={`${matchup.slot}-${matchup.userPlayer?.id ?? "empty"}-${matchup.opponentPlayer?.id ?? "boss"}`}
                        matchup={matchup}
                      />
                    ))}
                  </div>
                </>
              ) : null}
              <button
                type="button"
                onClick={continueAfterResult}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {(run.stage === "run-over" || run.stage === "run-cleared") && !reviewingFailedChallenge && (
            <div
              className={clsx(
                "rounded-[30px] border p-6 shadow-card",
                run.stage === "run-cleared"
                  ? "border-emerald-200/24 bg-[linear-gradient(135deg,rgba(6,41,31,0.98),rgba(11,63,48,0.96),rgba(6,28,51,0.95))]"
                  : "border-rose-200/24 bg-[linear-gradient(135deg,rgba(60,14,24,0.98),rgba(84,22,36,0.96),rgba(36,12,32,0.95))]",
              )}
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-300">
                {run.stage === "run-cleared" ? <Trophy size={15} /> : <Swords size={15} />}
                {run.stage === "run-cleared" ? "Run Cleared" : "Run Over"}
              </div>
              <h2 className="mt-3 font-display text-4xl text-white">
                {run.stage === "run-cleared" ? "You survived the gauntlet" : "The climb ended here"}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-100/90">
                {run.nodeResult?.detail}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => startRun(run.packageId)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
                >
                  Run It Back
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={clsx("space-y-6", (run.stage === "starter-reveal" || run.stage === "ladder-overview" || hideRightRail) && "hidden")}>
          {showDraftRosterRail ? (
            runRosterPanel
          ) : (
            <>
              <div className="glass-panel rounded-[30px] p-6 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Ladder</div>
                <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_200px] items-end gap-3 pl-6 pr-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 xl:grid">
                  <div>Nodes</div>
                  <div className="text-right">Rewards</div>
                </div>
                <div className="relative mt-5 space-y-3 pl-6 before:absolute before:bottom-4 before:left-2.5 before:top-3 before:w-px before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06),rgba(255,255,255,0))]">
                  {roguelikeNodes.map((node, index) => {
                    const isCurrent = run.floorIndex === index && (
                      run.stage === "node-preview" ||
                      run.stage === "reward-draft" ||
                      run.stage === "node-result" ||
                      run.stage === "challenge-setup" ||
                      run.stage === "faceoff-setup" ||
                      run.stage === "faceoff-game"
                    );
                    const isCleared = run.floorIndex > index || run.stage === "run-cleared";
                    const rewards = getRoguelikeClearRewards(node);
                    const rewardsEarned =
                      doesRoguelikeNodeAwardClearRewards(node) &&
                      hasEarnedNodeReward(run, index, run.nodeResult);
                    const actTheme = getActLadderTheme(node.act);
                    const summary = node.targetLabel
                      ? { label: "Target", value: node.targetLabel }
                      : { label: "Reward", value: getBundle(node.rewardBundleId).title };
                    return (
                      <div key={node.id} className="relative grid gap-3 pl-4 xl:grid-cols-[minmax(0,1fr)_200px] xl:items-stretch">
                        <div
                          className={clsx(
                            "absolute left-[-1px] top-6 h-3.5 w-3.5 rounded-full border-4 border-[#090b12]",
                            isCleared ? "bg-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.4)]" : actTheme.accent,
                          )}
                        />
                        <div
                          className={clsx(
                            "rounded-[22px] border px-4 py-4 transition",
                            isCurrent
                              ? actTheme.current
                              : isCleared
                                ? "border-emerald-300/45 bg-[linear-gradient(135deg,rgba(6,78,59,0.42),rgba(16,185,129,0.16),rgba(5,46,22,0.5))] shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_34px_rgba(16,185,129,0.2)]"
                                : actTheme.shell,
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className={clsx(
                                "text-[10px] uppercase tracking-[0.2em]",
                                isCleared ? "text-emerald-100/90" : actTheme.eyebrow,
                              )}>
                                Act {node.act} | Floor {node.floor}
                              </div>
                              <div className="mt-1 font-semibold text-white">{node.title}</div>
                            </div>
                            <div
                              className={clsx(
                                "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]",
                                isCleared
                                  ? "border-emerald-200/35 bg-emerald-300/14 text-emerald-50"
                                  : "border-white/10 bg-black/20 text-slate-300",
                              )}
                            >
                              {isCleared ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <CheckCircle2 size={12} />
                                  Cleared
                                </span>
                              ) : (
                                node.type
                              )}
                            </div>
                          </div>
                          <div
                            className={clsx(
                              "mt-3 rounded-[18px] border px-4 py-3",
                              isCleared ? "border-emerald-200/22 bg-emerald-300/10 text-emerald-50/94" : node.targetLabel ? actTheme.target : actTheme.reward,
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white">
                                <Target size={13} />
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.22em] text-white/62">
                                  {summary.label}
                                </div>
                                <div className="mt-1 text-sm font-semibold leading-6 text-current">
                                  {summary.value}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <RogueNodeRewardsRail rewards={rewards} earned={rewardsEarned} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {runRosterPanel}

              <div className="glass-panel rounded-[30px] p-6 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Unlocked This Run</div>
                <div className="mt-5 space-y-3">
                  {run.unlockedBundleIds.length > 0 ? (
                    run.unlockedBundleIds.map((bundleId) => {
                      const bundle = getBundle(bundleId as never);
                      return (
                        <div key={bundleId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="font-semibold text-white">{bundle.title}</div>
                          <div className="mt-2 text-sm leading-6 text-slate-300">{bundle.description}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 p-5 text-sm leading-7 text-slate-300">
                      Bundle unlocks will appear here as you survive deeper into the run.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {draggingIndex !== null && dragPointer ? (
        <div
          className="pointer-events-none fixed z-[120] w-[420px] max-w-[calc(100vw-32px)]"
          style={{
            left: dragPointer.x - dragPointer.offsetX,
            top: dragPointer.y - dragPointer.offsetY,
            transform: "rotate(-2deg) scale(1.01)",
            filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.45))",
          }}
        >
          <RogueRosterSlotCard
            slot={displayedRun.lineup[draggingIndex]}
            index={draggingIndex}
            ownedPlayerIds={runOwnedPlayerIds}
            trainedPlayerIds={run.trainedPlayerIds ?? []}
            focusMetrics={challengeFocusMetrics}
            dragged={false}
          />
        </div>
      ) : null}
      {shouldRenderOutcomeOverlay ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(3,6,14,0.84)] px-4 py-8 backdrop-blur-md">
          <div
            className={clsx(
              "relative w-full max-w-5xl overflow-hidden rounded-[36px] border p-8 shadow-[0_28px_80px_rgba(0,0,0,0.46)] lg:p-10",
              outcomeTone === "failure"
                ? "border-rose-200/28 bg-[linear-gradient(135deg,rgba(95,14,30,0.99),rgba(150,24,41,0.97),rgba(63,8,24,0.99))]"
                : "border-emerald-200/24 bg-[linear-gradient(135deg,rgba(7,54,40,0.98),rgba(11,94,69,0.96),rgba(10,35,62,0.97))]",
            )}
          >
            <div
              className={clsx(
                "absolute inset-0",
                outcomeTone === "failure"
                  ? "bg-[radial-gradient(circle_at_top_right,rgba(254,202,202,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(248,113,113,0.18),transparent_35%)]"
                  : "bg-[radial-gradient(circle_at_top_right,rgba(187,247,208,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_38%)]",
              )}
            />
            <div className="relative">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/78">
                {outcomeTone === "failure" ? <Swords size={16} /> : <Trophy size={16} />}
                {run.stage === "run-over"
                  ? "Rogue Run Failed"
                  : run.stage === "run-cleared"
                    ? "Rogue Run Cleared"
                    : outcomeTone === "failure"
                      ? "Node Failed"
                      : "Node Cleared"}
              </div>
              <h2 className="mt-4 font-display text-[clamp(2.5rem,5vw,4.6rem)] leading-none text-white">
                {run.stage === "run-over"
                  ? "Run Failed"
                  : run.stage === "run-cleared"
                    ? "Run Cleared"
                    : run.nodeResult?.title}
              </h2>
              {!(run.stage === "faceoff-game" && run.nodeResult?.faceoffResult) ? (
                <p className="mt-5 max-w-4xl text-base leading-8 text-white/88 lg:text-lg">
                  {run.nodeResult?.detail}
                </p>
              ) : null}

              {run.stage === "faceoff-game" && run.nodeResult?.faceoffResult && faceoffFinalScore ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    <div className={clsx(
                      "rounded-[26px] border p-5",
                      outcomeTone === "failure"
                        ? "border-rose-100/22 bg-rose-950/18"
                        : "border-emerald-100/20 bg-emerald-950/18",
                    )}>
                      <div className="text-center text-[10px] uppercase tracking-[0.24em] text-white/72">Final Score</div>
                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                            {activeNode?.opponentTeamName ?? "Boss Team"}
                          </div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {faceoffFinalScore.opponentScore}
                          </div>
                        </div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/46">
                          vs
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                            Your Team
                          </div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {faceoffFinalScore.userScore}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center text-sm text-white/74">
                        You {run.nodeResult.passed ? "won" : "lost"} the faceoff against {activeNode?.opponentTeamName ?? "the boss team"}.
                      </div>
                    </div>
                  {run.nodeResult.passed ? (
                    <div className="rounded-[26px] border border-amber-100/18 bg-[linear-gradient(135deg,rgba(64,36,6,0.26),rgba(122,76,18,0.18),rgba(28,20,8,0.22))] p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/78">What You Earned</div>
                      <div className="mt-3 space-y-4">
                        <div className="rounded-[22px] border border-amber-100/16 bg-black/14 px-4 py-4">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/72">What Happens Next</div>
                          <div className="mt-2 text-2xl font-semibold text-white">
                            Claim your boss reward draft
                          </div>
                          <div className="mt-2 text-sm leading-7 text-white/76">
                            {activeNode?.id === "act-one-boss"
                              ? "Choose 1 of 3 B-tier version players and set up a future evolution upgrade."
                              : "Choose 1 reward player and strengthen your roster before the next node."}
                          </div>
                        </div>
                        {activeNodeShowsClearRewards && activeNodeClearRewards ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-amber-100/16 bg-amber-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-100/78">
                                <Coins size={14} />
                                Token Reward
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{activeNodeClearRewards.tokenReward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                                Tokens earned
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-sky-100/16 bg-sky-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-100/78">
                                <Sparkles size={14} />
                                Prestige XP
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{activeNodeClearRewards.prestigeXpAward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-100/72">
                                Progress earned
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-white/16 bg-black/18 p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/72">What Happens Next</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        Run ends on this loss
                      </div>
                      <div className="mt-2 text-sm leading-7 text-white/74">
                        You were eliminated by {activeNode?.opponentTeamName ?? "the boss team"}. Failure rewards are still paid out below so the next run starts with more momentum.
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {run.stage === "node-result" && run.nodeResult?.passed && nodeResultDisplayNode ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  {run.nodeResult.faceoffResult && nodeResultFinalScore ? (
                    <div className="rounded-[26px] border border-emerald-100/20 bg-emerald-950/18 p-5">
                      <div className="text-center text-[10px] uppercase tracking-[0.24em] text-white/72">Final Score</div>
                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">
                            {nodeResultDisplayNode.opponentTeamName ?? "Boss Team"}
                          </div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {nodeResultFinalScore.opponentScore}
                          </div>
                        </div>
                        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/46">
                          vs
                        </div>
                        <div className="rounded-[22px] border border-white/10 bg-black/18 px-4 py-4 text-center">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/58">Your Team</div>
                          <div className="mt-3 text-4xl font-semibold leading-none text-white">
                            {nodeResultFinalScore.userScore}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-center text-sm text-white/74">
                        You won the faceoff against {nodeResultDisplayNode.opponentTeamName ?? "the boss team"}.
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-emerald-100/20 bg-emerald-950/18 p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-100/78">What Happened</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        {run.nodeResult.title}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-white/76">
                        {run.nodeResult.detail}
                      </div>
                    </div>
                  )}
                  {nodeResultShowsRewardSummary ? (
                    <div className="rounded-[26px] border border-amber-100/18 bg-[linear-gradient(135deg,rgba(64,36,6,0.26),rgba(122,76,18,0.18),rgba(28,20,8,0.22))] p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-amber-100/78">What You Earned</div>
                      <div className="mt-3 space-y-4">
                        {nodeResultHasRewardChoices && nodeResultRewardCopy ? (
                          <div className="rounded-[22px] border border-amber-100/16 bg-black/14 px-4 py-4">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/72">Reward Draft</div>
                            <div className="mt-2 text-2xl font-semibold text-white">
                              {nodeResultRewardCopy.title}
                            </div>
                            <div className="mt-2 text-sm leading-7 text-white/76">
                              {nodeResultRewardCopy.description}
                            </div>
                          </div>
                        ) : null}
                        {nodeResultReferencesDraftShuffle ? (
                          <div className="rounded-[22px] border border-indigo-100/16 bg-indigo-300/10 px-4 py-4">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-indigo-100/78">
                              <RefreshCcw size={14} />
                              Draft Shuffle Reward
                            </div>
                            <div className="mt-2 text-3xl font-semibold text-white">
                              +{nodeResultDisplayNode.draftShuffleReward ?? 0}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-indigo-100/72">
                              Tickets earned
                            </div>
                          </div>
                        ) : null}
                        {nodeResultShowsClearRewards && nodeResultClearRewards ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[22px] border border-amber-100/16 bg-amber-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-100/78">
                                <Coins size={14} />
                                Token Reward
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{nodeResultClearRewards.tokenReward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                                Tokens earned
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-sky-100/16 bg-sky-300/10 px-4 py-4">
                              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-100/78">
                                <Sparkles size={14} />
                                Prestige XP
                              </div>
                              <div className="mt-2 text-3xl font-semibold text-white">
                                +{nodeResultClearRewards.prestigeXpAward}
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-100/72">
                                Progress earned
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[26px] border border-white/16 bg-black/18 p-5">
                      <div className="text-[10px] uppercase tracking-[0.22em] text-white/72">What Happens Next</div>
                      <div className="mt-2 text-2xl font-semibold text-white">
                        Return to the run ladder
                      </div>
                      <div className="mt-2 text-sm leading-7 text-white/74">
                        {nodeResultNextStepDescription}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {((run.stage === "run-over") || (run.stage === "faceoff-game" && !run.nodeResult?.passed)) && run.nodeResult?.failureRewards ? (
                <div className="mt-8 rounded-[28px] border border-amber-100/18 bg-[linear-gradient(135deg,rgba(20,8,16,0.36),rgba(84,36,18,0.22),rgba(16,10,20,0.28))] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.18)]">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-amber-100/78">
                    What You Keep
                  </div>
                  <div className="mt-2 max-w-3xl text-sm leading-7 text-white/84">
                    This run is over, but you still bank the progression you earned here for your next attempt.
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-amber-100/18 bg-amber-300/10 p-5">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-100/78">
                        <Coins size={14} />
                        Token Reward
                      </div>
                      <div className="mt-3 text-4xl font-semibold text-white">
                        +{run.nodeResult.failureRewards.tokenReward}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-100/72">
                        Tokens added
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-sky-100/18 bg-sky-300/10 p-5">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-sky-100/78">
                        <Sparkles size={14} />
                        Prestige XP
                      </div>
                      <div className="mt-3 text-4xl font-semibold text-white">
                        +{run.nodeResult.failureRewards.prestigeXpAward}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-100/72">
                        Progress saved
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {run.stage === "run-over" ? (
                    <>
                      {run.failureReviewStage === "challenge-setup" ? (
                        <button
                          type="button"
                          onClick={reviewFailedChallenge}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-rose-50"
                        >
                          See Results
                          <ArrowRight size={16} />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={abortRun}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-rose-50"
                      >
                        Try Again
                        <ArrowRight size={16} />
                      </button>
                    <button
                      type="button"
                      onClick={handleBackToHome}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                      Back to Home
                    </button>
                  </>
                ) : run.stage === "run-cleared" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => startRun(run.packageId)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Run It Back
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToHome}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                      Back to Home
                    </button>
                  </>
                ) : run.stage === "faceoff-game" ? (
                  run.nodeResult?.passed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowOutcomeOverlay(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        See Results
                        <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={continueAfterFaceoff}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        Claim Reward
                        <ArrowRight size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowOutcomeOverlay(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        See Results
                        <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={abortRun}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={handleBackToHome}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                      >
                        Back to Home
                      </button>
                    </>
                  )
                ) : run.stage === "node-result" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowOutcomeOverlay(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
                    >
                      See Results
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={continueAfterResult}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={continueAfterResult}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

