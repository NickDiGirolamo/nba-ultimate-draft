import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Crown,
  GripHorizontal,
  Package2,
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
import {
  buildRoguelikeOpponentLineup,
  buildOpeningDraftPool,
  buildRoguelikeStarterLineup,
  buildStarterPool,
  drawRoguelikeStarterRevealPlayers,
  drawRoguelikeChoices,
  getRoguelikeAdjustedDefenseForSlot,
  getRoguelikeAdjustedOffenseForSlot,
  evaluateRoguelikeLineup,
  evaluateRoguelikeRoster,
  getRoguelikeAdjustedOverallForSlot,
  getRoguelikeSlotPenalty,
  generateActOneFaceoffOpponentPlayerIds,
  getBundle,
  RoguelikeFaceoffMatchup,
  RoguelikeFaceoffResult,
  RoguelikeNode,
  RoguelikeStarterPackageId,
  roguelikeNodes,
  roguelikeStarterPackages,
  resolveRoguelikeNode,
  unlockBundlePlayers,
} from "../lib/roguelike";
import { Player, PlayerTier, RosterSlot } from "../types";

type RoguelikeStage =
  | "package-select"
  | "starter-reveal"
  | "ladder-overview"
  | "initial-draft"
  | "challenge-setup"
  | "training-select"
  | "trade-offer"
  | "trade-select"
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
  lives: number;
  floorIndex: number;
  initialPicks: number;
  unlockedBundleIds: string[];
  trainedPlayerIds: string[];
  failureReviewStage?: RoguelikeStage | null;
  stage: RoguelikeStage;
  activeNode: RoguelikeNode | null;
  activeOpponentPlayerIds: string[] | null;
  nodeResult: {
    title: string;
    detail: string;
    passed?: boolean;
    faceoffResult?: RoguelikeFaceoffResult | null;
  } | null;
}

interface RoguelikeModeProps {
  onBackToHome: () => void;
}

const ROGUELIKE_STORAGE_KEY = "legends-draft-roguelike-run-v1";

const createSeed = () => Math.floor(Date.now() % 1_000_000) + Math.floor(Math.random() * 1000);

const nextChoiceSeed = (seed: number, step: number) => seed + step * 97 + 13;

const getRevealedStarterPlayers = (run: RoguelikeRun) => {
  const revealedPlayers = run.starterRevealPlayers.filter((player) =>
    run.revealedStarterIds.includes(player.id),
  );
  return revealedPlayers.length > 0 ? revealedPlayers : run.starterRevealPlayers;
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

const hydrateRunLineup = (run: RoguelikeRun, ownedPlayers: Player[]) => {
  const playerById = new Map(ownedPlayers.map((player) => [player.id, player]));
  const hasPlacedPlayers = run.lineup.some((slot) => Boolean(slot.player));

  if (!hasPlacedPlayers) {
    return ownedPlayers.length <= 5
      ? buildRoguelikeStarterLineup(ownedPlayers)
      : ownedPlayers.reduce(
          (currentLineup, player) => assignPlayerToRoster(currentLineup, player).roster,
          buildRoguelikeStarterLineup(ownedPlayers),
        );
  }

  const placedPlayerIds = new Set<string>();
  const hydratedLineup = run.lineup.map((slot) => {
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
  return unplacedPlayers.reduce(
    (currentLineup, player) => assignPlayerToRoster(currentLineup, player).roster,
    hydratedLineup,
  );
};

const getHydratedRun = (run: RoguelikeRun) => {
  const shouldHydrateEarlyRunDisplay =
    !run.unlockedBundleIds.includes("synergy-hunters") &&
    ["ladder-overview", "initial-draft", "node-preview", "faceoff-setup", "faceoff-game"].includes(run.stage);

  const hydratedOwnedPlayers = shouldHydrateEarlyRunDisplay
    ? run.roster.length > 0
      ? run.roster
      : getEarlyRunRosterState(run).ownedPlayers
    : run.roster;

  if (hydratedOwnedPlayers.length === 0) {
    return run;
  }

  return {
    ...run,
    roster: hydratedOwnedPlayers,
    lineup: hydrateRunLineup(run, hydratedOwnedPlayers),
  };
};

const getNodeChoiceTiers = (node: RoguelikeNode) => {
  if (node.id === "starter-cache") {
    return ["B", "C"] as const;
  }

  if (node.id === "act-one-faceoff" || node.id === "frontcourt-wave") {
    return ["B"] as const;
  }

  if (node.id === "trade-deadline-1") {
    return ["B", "C"] as const;
  }

  return undefined;
};

const drawRunChoices = (
  run: RoguelikeRun,
  pool: Player[],
  roster: Player[],
  count: number,
  seed: number,
  allowedTiers?: PlayerTier[],
) => {
  const seenChoicePlayerIds = run.seenChoicePlayerIds ?? [];
  const choices = drawRoguelikeChoices(
    pool,
    roster,
    count,
    seed,
    allowedTiers,
    seenChoicePlayerIds,
  );

  return {
    choices,
    seenChoicePlayerIds: [...seenChoicePlayerIds, ...choices.map((player) => player.id)],
  };
};

const getRogueSlotLabel = (slot: RosterSlot, index: number) => {
  if (slot.slot === "UTIL") return index === 8 ? "Util 1" : "Util 2";
  if (index === 5) return "Bench 1";
  if (index === 6) return "Backup G/F";
  if (index === 7) return "Backup F/C";
  return slot.slot;
};

const getChallengeMetricLabel = (metric: "overall" | "offense" | "defense" | "chemistry") => {
  if (metric === "overall") return "OVR";
  if (metric === "offense") return "OFF";
  if (metric === "defense") return "DEF";
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
  focusMetrics?: Array<"overall" | "offense" | "defense" | "chemistry">;
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
  const metricChips = player
    ? focusMetrics
        .filter((metric) => metric !== "overall" && metric !== "chemistry")
        .map((metric) => {
          const value =
            metric === "offense"
              ? Math.round(getRoguelikeAdjustedOffenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10
              : Math.round(getRoguelikeAdjustedDefenseForSlot(player, slot, ownedPlayerIds, trainedPlayerIds) * 10) / 10;

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
                <div className="truncate text-[0.98rem] font-semibold leading-5 text-white">
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
                  {boosted ? <span className="mr-1 inline-block align-[-1px] text-lime-300">↗</span> : null}
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
          <div className="truncate text-base font-semibold text-white">
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

  return (
    <button
      type="button"
      onClick={onReveal}
      className="group relative h-[420px] overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,12,20,0.94),rgba(16,24,36,0.96))] text-left transition duration-300 hover:-translate-y-1 hover:border-amber-200/24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />
      {!revealed ? (
        <div className="relative flex h-full flex-col justify-between p-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
            Starter Card {index + 1}
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full rounded-[26px] border border-white/12 bg-[linear-gradient(145deg,rgba(31,41,55,0.94),rgba(12,18,28,0.98))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[20px] border border-dashed border-amber-200/24 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_42%)] px-6 text-center">
                <Package2 size={44} className="text-amber-100" />
                <div className="mt-5 text-[11px] uppercase tracking-[0.32em] text-amber-100/80">
                  Click To Reveal
                </div>
                <div className="mt-4 font-display text-3xl text-white">Face-Down Card</div>
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-300 transition group-hover:text-white">
            Reveal this starter to see who is joining your opening arsenal.
          </div>
        </div>
      ) : (
        <div className="relative flex h-full flex-col p-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-100/80">
            Revealed
          </div>
          <div className="mt-5 overflow-hidden rounded-[26px] border border-white/12 bg-black/18">
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
          <div className="mt-5 font-display text-3xl leading-tight text-white">{player.name}</div>
          <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-slate-400">
            {player.hallOfFameTier}-Tier • {player.overall} OVR • {player.primaryPosition}
          </div>
        </div>
      )}
    </button>
  );
};

export const RoguelikeMode = ({ onBackToHome }: RoguelikeModeProps) => {
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
        unlockedBundleIds: parsed.unlockedBundleIds ?? [],
        trainedPlayerIds: parsed.trainedPlayerIds ?? [],
        failureReviewStage: parsed.failureReviewStage ?? null,
      } as RoguelikeRun;
    } catch {
      return null;
    }
  });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [showOutcomeOverlay, setShowOutcomeOverlay] = useState(false);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
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

  const startRun = (packageId: RoguelikeStarterPackageId) => {
    const seed = createSeed();
    const starterPool = buildStarterPool(packageId);
    const starterRevealPlayers = drawRoguelikeStarterRevealPlayers(packageId, nextChoiceSeed(seed, 1));
    const lineup = buildRoguelikeStarterLineup(starterRevealPlayers);

    setRun({
      seed,
      packageId: packageId,
      roster: starterRevealPlayers,
      lineup,
      availablePool: starterPool,
      seenChoicePlayerIds: [],
      choices: [],
      starterRevealPlayers,
      revealedStarterIds: [],
      lives: 3,
      floorIndex: 0,
        initialPicks: 0,
        unlockedBundleIds: [],
        trainedPlayerIds: [],
        failureReviewStage: null,
        stage: "starter-reveal",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: null,
    });
  };

  const revealStarterCard = (playerId: string) => {
    if (!run || run.stage !== "starter-reveal" || run.revealedStarterIds.includes(playerId)) return;

    setRun({
      ...run,
      revealedStarterIds: [...run.revealedStarterIds, playerId],
    });
  };

  const proceedToRunLadder = () => {
    if (!run || run.stage !== "starter-reveal") return;
    const { ownedPlayers, lineup } = getEarlyRunRosterState(run);

    setRun({
      ...run,
      roster: ownedPlayers,
      lineup,
      stage: "ladder-overview",
      activeNode: null,
      activeOpponentPlayerIds: null,
    });
  };

  const startOpeningDraft = () => {
    if (!run || run.stage !== "ladder-overview") return;
    const currentNode = roguelikeNodes[run.floorIndex] ?? null;
    if (!currentNode) return;

    if (currentNode.type === "draft") {
      const bundle = getBundle(currentNode.rewardBundleId);
      const nextRun =
        run.initialPicks === 0
          ? {
              ...run,
              ...getEarlyRunRosterState(run),
            }
          : run;
      const openingDraftPool = run.initialPicks === 0 ? buildOpeningDraftPool() : nextRun.availablePool;
      const draftedPlayers = getRunOwnedPlayers(nextRun);
      const nextChoicesState = drawRunChoices(
        nextRun,
        openingDraftPool,
        draftedPlayers,
        5,
        nextChoiceSeed(run.seed, 11 + run.floorIndex * 19),
        getNodeChoiceTiers(currentNode) ? [...getNodeChoiceTiers(currentNode)!] : undefined,
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
            currentNode.id === "starter-cache"
              ? "Starter Cache is open. Choose 1 of 5 B-tier or C-tier players to add to your run roster."
              : bundle.description,
          passed: true,
        },
      });
      return;
    }

    setRun({
      ...run,
      activeNode: currentNode,
      activeOpponentPlayerIds:
        currentNode.battleMode === "starting-five-faceoff"
          ? generateActOneFaceoffOpponentPlayerIds(
              getRunOwnedPlayers(run),
              nextChoiceSeed(run.seed, 200 + run.floorIndex * 17),
            )
          : null,
      stage: "node-preview",
    });
  };

  const draftChoice = (player: Player) => {
    if (!run) return;

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
        const openingDraftPool = buildOpeningDraftPool();
        const nextChoicesState = drawRunChoices(
          run,
          openingDraftPool,
          nextLineup
            .map((slot) => slot.player)
            .filter((owned): owned is Player => Boolean(owned)),
          5,
          nextChoiceSeed(run.seed, nextInitialPicks + 1),
          ["B", "C"],
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
      const nextFloorIndex = run.floorIndex + 1;

      setRun({
        ...run,
        roster: nextRoster,
        lineup: nextLineup,
        choices: [],
        floorIndex: nextFloorIndex,
        stage: roguelikeNodes[nextFloorIndex] ? "ladder-overview" : "run-cleared",
        activeNode: null,
        activeOpponentPlayerIds: null,
        nodeResult: null,
      });
    }
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
      const nextChoicesState = drawRunChoices(
        run,
        expandedPool,
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
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

    if (node.type === "trade") {
      setRun({
        ...run,
        stage: "trade-offer",
        nodeResult: null,
      });
      return;
    }

    if (node.battleMode === "starting-five-faceoff") {
      setRun({
        ...run,
        lineup: buildRoguelikeStarterLineup(run.roster),
        stage: "faceoff-setup",
        nodeResult: null,
      });
      return;
    }

    if (node.id === "frontcourt-wave") {
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
        },
      });
      return;
    }

    if (resolution.passed && node.type === "boss" && run.floorIndex === roguelikeNodes.length - 1) {
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
      const expandedPool = unlockBundlePlayers(
        run.availablePool,
        getRunOwnedPlayers(run),
        node.rewardBundleId,
      );
      const bundle = getBundle(node.rewardBundleId);
      const nextChoicesState = drawRunChoices(
        run,
        expandedPool,
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        getNodeChoiceTiers(node) ? [...getNodeChoiceTiers(node)!] : undefined,
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
            node.id === "act-one-faceoff"
              ? `You beat ${node.opponentTeamName ?? "the challenge team"}. Bench 1 is now open, ${bundle.title} is added to your run pool, and you can choose 1 of 5 B-tier players for your run roster.`
              : node.id === "frontcourt-wave"
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
    setRun({
      ...run,
      lives: remainingLives,
      floorIndex: nextFloorIndex,
      stage: nextNode ? "node-preview" : "run-over",
      activeNode: nextNode,
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
      },
    });
  };

  const startLineupChallenge = () => {
    if (!run?.activeNode) return;

    const node = run.activeNode;
    const challengeLineup = run.lineup.slice(0, 5).map((slot) => ({ ...slot }));
    const resolution = resolveRoguelikeNode(node, getRunOwnedPlayers(run), challengeLineup, run.trainedPlayerIds ?? []);
    const ownedPlayerIds = getRunOwnedPlayers(run).map((player) => player.id);
    const challengeScore =
      node.id === "frontcourt-wave"
        ? getAverageAdjustedOffense(challengeLineup, ownedPlayerIds, run.trainedPlayerIds ?? [])
        : resolution.metrics.offense;
    const passed = challengeScore >= (node.checks?.[0]?.target ?? 0);

    if (!passed) {
      setRun({
        ...run,
        lives: 0,
        stage: "run-over",
        activeNode: node,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail: `Your starting five posted ${challengeScore} Offense, short of the ${node.checks?.[0]?.target ?? 0} target. The run ends here.`,
          passed: false,
        },
        failureReviewStage: "challenge-setup",
      });
      return;
    }

    if (passed) {
      const expandedPool = unlockBundlePlayers(
        run.availablePool,
        getRunOwnedPlayers(run),
        node.rewardBundleId,
      );
      const bundle = getBundle(node.rewardBundleId);
      const nextChoicesState = drawRunChoices(
        run,
        expandedPool,
        getRunOwnedPlayers(run),
        node.rewardChoices,
        nextChoiceSeed(run.seed, run.floorIndex + 30),
        getNodeChoiceTiers(node) ? [...getNodeChoiceTiers(node)!] : undefined,
      );
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
          detail: `Your selected starting five reached ${challengeScore} Offense. ${bundle.title} is now added to your run pool, and you can choose 1 of 5 B-tier players for your run roster.`,
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
      },
    });
  };

  const continueAfterFaceoff = () => {
    if (!run?.activeNode || run.stage !== "faceoff-game" || !run.nodeResult) return;

    const node = run.activeNode;
    const passed = Boolean(run.nodeResult.passed);

    if (!passed) {
      if (node.eliminationOnLoss) {
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
          },
        });
        return;
      }

      const remainingLives = Math.max(0, run.lives - (node.livesPenalty ?? 1));
      const nextFloorIndex = run.floorIndex + 1;
      const nextNode = roguelikeNodes[nextFloorIndex] ?? null;
      setRun({
        ...run,
        lives: remainingLives,
        floorIndex: nextFloorIndex,
        stage: nextNode ? "node-preview" : "run-over",
        activeNode: nextNode,
        activeOpponentPlayerIds: null,
        nodeResult: {
          title: `${node.title} failed`,
          detail: `You lost ${node.livesPenalty ?? 1} life${(node.livesPenalty ?? 1) > 1 ? "s" : ""} in the faceoff.`,
          passed: false,
        },
      });
      return;
    }

    const expandedPool = unlockBundlePlayers(
      run.availablePool,
      getRunOwnedPlayers(run),
      node.rewardBundleId,
    );
    const bundle = getBundle(node.rewardBundleId);
    const nextChoicesState = drawRunChoices(
      run,
      expandedPool,
      getRunOwnedPlayers(run),
      node.rewardChoices,
      nextChoiceSeed(run.seed, run.floorIndex + 30),
      getNodeChoiceTiers(node) ? [...getNodeChoiceTiers(node)!] : undefined,
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
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: `${node.title} cleared`,
        detail:
          node.id === "act-one-faceoff"
            ? `You beat ${node.opponentTeamName ?? "the boss team"}. Bench 1 is now open, ${bundle.title} is added to your run pool, and you can choose 1 of 5 B-tier players for your run roster.`
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

  const sendPlayerToTraining = (player: Player) => {
    if (!run?.activeNode || run.stage !== "training-select") return;

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = roguelikeNodes[nextFloorIndex] ?? null;
    const trainedPlayerIds = run.trainedPlayerIds.includes(player.id)
      ? run.trainedPlayerIds
      : [...run.trainedPlayerIds, player.id];

    setRun({
      ...run,
      trainedPlayerIds,
      floorIndex: nextFloorIndex,
      stage: "node-result",
      activeNode: null,
      activeOpponentPlayerIds: null,
      nodeResult: {
        title: "Training Day complete",
        detail: `${player.name} went to training and gains +1 OVR for the rest of this run. ${nextNode ? "Your next node is ready." : ""}`,
        passed: true,
      },
    });
  };

  const declineTradeDeadline = () => {
    if (!run?.activeNode || run.stage !== "trade-offer") return;

    const nextFloorIndex = run.floorIndex + 1;
    const nextNode = roguelikeNodes[nextFloorIndex] ?? null;

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

  const tradePlayerForReplacement = (player: Player) => {
    if (!run?.activeNode || run.stage !== "trade-select") return;

    const hydratedRun = getHydratedRun(run);
    const nextRoster = hydratedRun.roster.filter((owned) => owned.id !== player.id);
    const nextLineup = hydratedRun.lineup.map((slot) =>
      slot.player?.id === player.id
        ? { ...slot, player: null }
        : { ...slot },
    );
    const nextChoicesState = drawRunChoices(
      run,
      run.availablePool,
      nextRoster,
      run.activeNode.rewardChoices,
      nextChoiceSeed(run.seed, run.floorIndex + 30),
      getNodeChoiceTiers(run.activeNode) ? [...getNodeChoiceTiers(run.activeNode)!] : undefined,
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
    }
    setRun(null);
    onBackToHome();
  };

  const abortRun = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ROGUELIKE_STORAGE_KEY);
    }
    setShowOutcomeOverlay(false);
    setDraggingIndex(null);
    setDropTargetIndex(null);
    setDragPointer(null);
    setRun(null);
  };

  const reviewFailedChallenge = () => {
    if (!run || run.stage !== "run-over" || run.failureReviewStage !== "challenge-setup") return;
    setShowOutcomeOverlay(false);
  };

  if (!run) {
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
                      ? "Passing Pack"
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
  const runOwnedPlayerIds = runOwnedPlayers.map((player) => player.id);
  const challengeFocusMetrics =
    run.stage === "challenge-setup" || run.stage === "node-preview" || run.failureReviewStage === "challenge-setup"
      ? activeNode?.checks?.map((check) => check.metric) ?? []
      : [];
  const startingFive = displayedRun.lineup.slice(0, 5);
  const startingFiveReady = startingFive.every((slot) => Boolean(slot.player));
  const startingFiveMetrics = evaluateRoguelikeLineup(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const shotCreationScore = getAverageAdjustedOffense(startingFive, runOwnedPlayerIds, run.trainedPlayerIds ?? []);
  const activeChallengeScore = activeNode?.id === "frontcourt-wave" ? shotCreationScore : startingFiveMetrics.offense;
  const faceoffOpponentLineup =
    activeNode?.battleMode === "starting-five-faceoff" && run.activeOpponentPlayerIds
      ? buildRoguelikeOpponentLineup({
          ...activeNode,
          opponentPlayerIds: run.activeOpponentPlayerIds,
        }).slice(0, 5)
      : [];
  const firstBossCleared = run.unlockedBundleIds.includes("synergy-hunters");
  const visibleRosterSlotCount = !firstBossCleared ? 5 : Math.min(10, Math.max(6, runOwnedPlayers.length));
  const visibleRunLineup = displayedRun.lineup.slice(0, visibleRosterSlotCount);
  const showDraftRosterRail =
        run.stage === "initial-draft" ||
        run.stage === "reward-draft" ||
        run.stage === "faceoff-setup" ||
        run.stage === "challenge-setup" ||
        run.stage === "training-select" ||
        run.stage === "trade-offer" ||
        run.stage === "trade-select" ||
        (run.stage === "run-over" && run.failureReviewStage === "challenge-setup" && !showOutcomeOverlay);
  const reviewingFailedChallenge =
    run.stage === "run-over" && run.failureReviewStage === "challenge-setup" && !showOutcomeOverlay;
  const shouldRenderOutcomeOverlay =
    showOutcomeOverlay &&
    run.stage === "faceoff-game" ||
    showOutcomeOverlay && run.stage === "node-result" ||
    showOutcomeOverlay && run.stage === "run-over" ||
    showOutcomeOverlay && run.stage === "run-cleared";
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
            {firstBossCleared
              ? "Your run roster is expanding. New slots unlock as you survive deeper and add more cards."
              : "Early run focus: build and organize your starting five before the first boss faceoff."}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
          {Math.min(runOwnedPlayers.length, visibleRosterSlotCount)}/{visibleRosterSlotCount} Cards
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {visibleRunLineup.map((slot, index) => (
          <div
            key={`${slot.slot}-${index}`}
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
            <h1 className="mt-2 font-display text-4xl text-white">Act {Math.min(2, (run.floorIndex || 0) < 4 ? 1 : 2)} Climb</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              First playable scaffold: constrained start, bundle unlocks, node checks, and real fail states.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
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
          run.stage === "starter-reveal" || run.stage === "ladder-overview"
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

              <div className="mt-8 grid gap-4 xl:grid-cols-2">
                {roguelikeNodes.map((node, index) => {
                  const isCurrent = index === run.floorIndex;
                  const isCleared = index < run.floorIndex;
                  const isLocked = index > run.floorIndex;

                  return (
                    <div
                      key={node.id}
                      className={clsx(
                        "rounded-[24px] border px-5 py-5 transition",
                        isCurrent
                          ? "border-fuchsia-200/24 bg-fuchsia-300/10"
                          : isCleared
                            ? "border-emerald-200/18 bg-emerald-300/8"
                            : "border-white/10 bg-white/5 opacity-70",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                            Act {node.act} • Floor {node.floor}
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
                      <div className="mt-4 rounded-[18px] border border-fuchsia-200/12 bg-black/18 px-4 py-3 text-sm text-slate-100">
                        {node.targetLabel ? `Target: ${node.targetLabel}` : node.rewardBundleId ? `Reward: ${getBundle(node.rewardBundleId).title}` : "Reward: Training boost"}
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
                Starter Cache is open. Make two picks from B-tier and C-tier boards to turn your three-card starter pack into a full opening lineup.
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
              </div>
            </div>
          )}

          {(run.stage === "challenge-setup" || reviewingFailedChallenge) && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Set Your Starting Five</div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Drag your best five players into the starter slots. This challenge grades your Starting 5 Score as the average Offense rating of your five starters, so use your bench slot to sit your weakest offensive piece.
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
                {runOwnedPlayers.map((player) => (
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
                {runOwnedPlayers.map((player) => (
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
            </div>
          )}

          {run.stage === "node-preview" && activeNode && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                <span>Floor {activeNode.floor}</span>
                <span>•</span>
                <span>{activeNode.type === "boss" ? "Boss Gate" : activeNode.type === "training" ? "Training Node" : activeNode.type === "trade" ? "Trade Node" : activeNode.type}</span>
              </div>
              <h2 className="mt-2 font-display text-3xl text-white">{activeNode.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{activeNode.description}</p>
              {activeNode.targetLabel ? (
                <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-100">
                  Target: {activeNode.targetLabel}
                </div>
              ) : null}
              {(run.activeOpponentPlayerIds ?? activeNode.opponentPlayerIds)?.length ? (
                <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Challenge Team</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {activeNode.opponentTeamName ?? "Opponent Starting Five"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(run.activeOpponentPlayerIds ?? activeNode.opponentPlayerIds ?? []).map((playerId) => {
                      const opponent = allPlayers.find((player) => player.id === playerId);
                      return opponent ? (
                        <div
                          key={playerId}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                        >
                          {opponent.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ) : null}
              {activeNode.type !== "training" && activeNode.type !== "trade" && activeNode.rewardBundleId ? (
                <div className="mt-5 rounded-[22px] border border-fuchsia-200/14 bg-fuchsia-300/8 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-100/80">Reward Bundle</div>
                  <div className="mt-2 text-lg font-semibold text-white">{getBundle(activeNode.rewardBundleId).title}</div>
                  <div className="mt-1 text-sm text-slate-200">{getBundle(activeNode.rewardBundleId).description}</div>
                </div>
              ) : null}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={openNode}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
                >
                  Enter Node
                  <ArrowRight size={16} />
                </button>
              </div>
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
                onClick={run.nodeResult?.passed ? continueAfterFaceoff : () => startRun(run.packageId)}
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
            </div>
          )}

          {run.stage === "node-result" && (
            <div className="glass-panel rounded-[30px] p-6 shadow-card">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Update</div>
              <h2 className="mt-2 font-display text-3xl text-white">{run.nodeResult?.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{run.nodeResult?.detail}</p>
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

        <div className={clsx("space-y-6", (run.stage === "starter-reveal" || run.stage === "ladder-overview") && "hidden")}>
          {showDraftRosterRail ? (
            runRosterPanel
          ) : (
            <>
              <div className="glass-panel rounded-[30px] p-6 shadow-card">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Run Ladder</div>
                <div className="mt-5 space-y-3">
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
                    return (
                      <div
                        key={node.id}
                        className={clsx(
                          "rounded-[22px] border px-4 py-4 transition",
                          isCurrent
                            ? "border-fuchsia-200/24 bg-fuchsia-300/10"
                            : isCleared
                              ? "border-emerald-300/45 bg-[linear-gradient(135deg,rgba(6,78,59,0.42),rgba(16,185,129,0.16),rgba(5,46,22,0.5))] shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_34px_rgba(16,185,129,0.2)]"
                              : "border-white/10 bg-white/5",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className={clsx(
                              "text-[10px] uppercase tracking-[0.2em]",
                              isCleared ? "text-emerald-100/90" : "text-slate-400",
                            )}>
                              Floor {node.floor}
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
                        {node.targetLabel ? (
                          <div className={clsx("mt-2 text-sm", isCleared ? "text-emerald-50/88" : "text-slate-300")}>
                            {node.targetLabel}
                          </div>
                        ) : (
                          <div className={clsx("mt-2 text-sm", isCleared ? "text-emerald-50/88" : "text-slate-300")}>
                            {getBundle(node.rewardBundleId).title}
                          </div>
                        )}
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
              <p className="mt-5 max-w-4xl text-base leading-8 text-white/88 lg:text-lg">
                {run.nodeResult?.detail}
              </p>

              {run.stage === "faceoff-game" && run.nodeResult?.faceoffResult ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <div className={clsx(
                    "rounded-[26px] border p-5",
                    outcomeTone === "failure"
                      ? "border-rose-100/22 bg-rose-950/18"
                      : "border-emerald-100/20 bg-emerald-950/18",
                  )}>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/72">Your Team Total</div>
                    <div className="mt-2 text-4xl font-semibold text-white">
                      {run.nodeResult.faceoffResult.userTeamWinProbability}%
                    </div>
                  </div>
                  <div className="rounded-[26px] border border-white/16 bg-black/18 p-5">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-white/72">Boss Team Total</div>
                    <div className="mt-2 text-4xl font-semibold text-white">
                      {run.nodeResult.faceoffResult.opponentTeamWinProbability}%
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
                    <button
                      type="button"
                      onClick={continueAfterFaceoff}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Claim Reward
                      <ArrowRight size={16} />
                    </button>
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
                        onClick={() => startRun(run.packageId)}
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
