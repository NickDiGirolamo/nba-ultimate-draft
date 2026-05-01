import { ArrowLeft, CheckCircle2, Crown, Gift, Medal, Sparkles, Swords, Target, Trophy, Users2, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MetaProgress, Player, PrestigeChallengeDefinition, RunHistoryEntry } from "../types";
import {
  draftChallenges,
  getCategoryChallengeById,
  getRareEventById,
  getPrestigeTitleForLevel,
  prestigeChallengeDefinitions,
  prestigeRewardDefinitions,
  standardRareEvent,
} from "../lib/meta";
import { getCategoryChallengeTarget } from "../lib/simulate";
import { allPlayers } from "../data/players";
import { bigThrees, dynamicDuos, rivalBadges, teamChemistryGroups } from "../lib/dynamicDuos";
import { usePlayerImage } from "../hooks/usePlayerImage";

type PrestigeView = "overview" | "challenges" | "rewards" | "collection";
type CollectionFamilyId = "dynamic-duos" | "big-threes" | "rivals" | "team-chemistry";
type ChallengeDifficultyTab = "rookie" | "role-player" | "starter" | "all-star" | "superstar" | "goat";

interface CollectionFamilyDefinition {
  id: CollectionFamilyId;
  title: string;
  description: string;
  rewardText: string;
  toneClass: string;
}

interface CollectionEntry {
  id: string;
  title: string;
  playerIds: string[];
  requiredCount?: number;
}

const challengeDifficultyTabs: Array<{
  id: ChallengeDifficultyTab;
  label: string;
  description: string;
  toneClass: string;
}> = [
  {
    id: "rookie",
    label: "Rookie",
    description: "Best place to start. Clean setup routes with the lowest pressure and the lightest rewards.",
    toneClass: "bg-emerald-300/14 text-emerald-100",
  },
  {
    id: "role-player",
    label: "Team Builder",
    description: "Slightly trickier environment twists that reward cleaner roster identity and chemistry.",
    toneClass: "bg-sky-300/14 text-sky-100",
  },
  {
    id: "starter",
    label: "Starter",
    description: "Now the route itself starts asking for stronger identity and cleaner roster-building.",
    toneClass: "bg-indigo-300/14 text-indigo-100",
  },
  {
    id: "all-star",
    label: "All-Star",
    description: "Real challenge pressure. Stronger route rules, stronger reward payouts.",
    toneClass: "bg-fuchsia-300/14 text-fuchsia-100",
  },
  {
    id: "superstar",
    label: "Superstar",
    description: "These routes expect discipline, restraint, and much sharper execution.",
    toneClass: "bg-amber-300/14 text-amber-100",
  },
  {
    id: "goat",
    label: "GOAT",
    description: "The highest-tier challenge routes. Hardest asks, biggest one-time Prestige rewards.",
    toneClass: "bg-rose-300/14 text-rose-100",
  },
];

const playersById = new Map(allPlayers.map((player) => [player.id, player]));

const collectionFamilies: CollectionFamilyDefinition[] = [
  {
    id: "dynamic-duos",
    title: "Dynamic Duos Trophy",
    description: "Collect every Dynamic Duo in the game by drafting both players together in the same run.",
    rewardText: "Unlocks once every Dynamic Duo has been collected.",
    toneClass: "border-sky-300/20 bg-sky-300/10",
  },
  {
    id: "big-threes",
    title: "Big 3 Trophy",
    description: "Complete every Big 3 trio across all eras and franchise cores.",
    rewardText: "Unlocks once every Big 3 has been collected.",
    toneClass: "border-fuchsia-300/20 bg-fuchsia-300/10",
  },
  {
    id: "rivals",
    title: "Rivals Trophy",
    description: "Draft every rivalry pairing together and finish the set.",
    rewardText: "Unlocks once every Rival pairing has been collected.",
    toneClass: "border-rose-300/20 bg-rose-300/10",
  },
  {
    id: "team-chemistry",
    title: "Team Chemistry Trophy",
    description: "Activate every historical Team Chemistry group by drafting at least two members from each group.",
    rewardText: "Unlocks once every Team Chemistry group has been activated.",
    toneClass: "border-amber-300/20 bg-amber-300/10",
  },
];

const getCollectionEntries = (familyId: CollectionFamilyId): CollectionEntry[] => {
  switch (familyId) {
    case "dynamic-duos":
      return dynamicDuos.map((entry) => ({
        id: entry.id,
        title: entry.title.replace("Dynamic Duos: ", ""),
        playerIds: entry.players,
      }));
    case "big-threes":
      return bigThrees.map((entry) => ({
        id: entry.id,
        title: entry.title.replace("Big 3: ", ""),
        playerIds: entry.players,
      }));
    case "rivals":
      return rivalBadges.map((entry) => ({
        id: entry.id,
        title: entry.title.replace("Rivals: ", ""),
        playerIds: entry.players,
      }));
    case "team-chemistry":
      return teamChemistryGroups.map((entry) => ({
        id: entry.id,
        title: `${entry.nickname} (${entry.teamName})`,
        playerIds: entry.eligiblePlayers,
        requiredCount: 2,
      }));
  }
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

interface PrestigeOverlayProps {
  meta: MetaProgress;
  history: RunHistoryEntry[];
  initialView?: PrestigeView;
  onApplyChallengePreset: (challengePreset: PrestigeChallengeDefinition) => void;
  onClose: () => void;
}

export const PrestigeOverlay = ({
  meta,
  history,
  initialView = "overview",
  onApplyChallengePreset,
  onClose,
}: PrestigeOverlayProps) => {
  const [view, setView] = useState<PrestigeView>(initialView);
  const [challengeFilter, setChallengeFilter] = useState<"open" | "completed">("open");
  const [challengeDifficulty, setChallengeDifficulty] = useState<ChallengeDifficultyTab>("rookie");
  const [selectedCollectionFamily, setSelectedCollectionFamily] = useState<CollectionFamilyId | null>(null);
  const recentRuns = history.slice(0, 5);
  const prestigeChallenges = draftChallenges.filter((challenge) => challenge.id !== "classic");
  const completedChallengeTitles = new Set(
    history.filter((run) => run.challengeCompleted).map((run) => run.challengeTitle),
  );
  const completedChallenges = prestigeChallenges.filter((challenge) =>
    completedChallengeTitles.has(challenge.title),
  );
  const openChallenges = prestigeChallenges.filter(
    (challenge) => !completedChallengeTitles.has(challenge.title),
  );
  const completedRouteIds = new Set(
    history
      .filter((run) => run.prestigeChallengeCleared)
      .map((run) => run.prestigeChallengeId)
      .filter((value): value is string => Boolean(value)),
  );
  const filteredChallenges = useMemo(
    () =>
      prestigeChallengeDefinitions
        .filter((item) => item.difficulty === challengeDifficulty)
        .filter((item) =>
          challengeFilter === "open" ? !completedRouteIds.has(item.id) : completedRouteIds.has(item.id),
        )
        .sort((a, b) => a.order - b.order),
    [challengeDifficulty, challengeFilter, completedRouteIds],
  );
  const visibleChallengeCount = filteredChallenges.length;
  const rewardTrack = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => {
        const level = index + 1;
        const reward = prestigeRewardDefinitions.find((item) => item.level === level) ?? null;
        return {
          level,
          title: getPrestigeTitleForLevel(level),
          reward,
          unlocked: meta.prestige.level >= level,
        };
      }),
    [meta.prestige.level],
  );
  const rosterHistorySets = useMemo(
    () =>
      history.map((run) => new Set(run.rosterPlayerIds ?? [])),
    [history],
  );
  const collectionProgress = useMemo(
    () =>
      collectionFamilies.map((family) => {
        const entries = getCollectionEntries(family.id);
        const items = entries.map((entry) => {
          const requiredCount = entry.requiredCount ?? entry.playerIds.length;
          const collected = rosterHistorySets.some((runSet) =>
            entry.playerIds.filter((playerId) => runSet.has(playerId)).length >= requiredCount,
          );

          return { ...entry, collected };
        });

        return {
          family,
          items,
          collectedCount: items.filter((entry) => entry.collected).length,
          totalCount: items.length,
          unlocked: items.length > 0 && items.every((entry) => entry.collected),
        };
      }),
    [rosterHistorySets],
  );
  const selectedCollection = selectedCollectionFamily
    ? collectionProgress.find((entry) => entry.family.id === selectedCollectionFamily) ?? null
    : null;
  const getRouteGoalLabel = (challenge: PrestigeChallengeDefinition) => {
    if (!challenge.categoryChallengeId) return challenge.goal;
    const category = getCategoryChallengeById(challenge.categoryChallengeId);
    if (!category) return challenge.goal;
    return `Post a ${getCategoryChallengeTarget(category.metric)}+ ${category.metricLabel.toLowerCase()} score.`;
  };
  const activeDifficultyTab =
    challengeDifficultyTabs.find((tab) => tab.id === challengeDifficulty) ?? challengeDifficultyTabs[0];

  const overlay = (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/82 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-[1180px] rounded-[34px] border border-white/10 bg-[#070b12] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-slate-400">
              <Crown size={14} className="text-amber-200" />
              Prestige Profile
            </div>
            <h2 className="mt-3 font-display text-4xl text-white">
              Level {meta.prestige.level} - {meta.prestige.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Prestige is your long-term front-office reputation. The main way to level it up is by
              clearing challenge routes across different run setups, with titles, deep playoff runs,
              collection growth, and team quality acting as supporting bonuses.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setView("overview")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  view === "overview"
                    ? "bg-amber-300/14 text-amber-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setView("challenges")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  view === "challenges"
                    ? "bg-sky-300/14 text-sky-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Challenges
              </button>
              <button
                type="button"
                onClick={() => setView("rewards")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  view === "rewards"
                    ? "bg-fuchsia-300/14 text-fuchsia-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Prestige Rewards
              </button>
              <button
                type="button"
                onClick={() => setView("collection")}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  view === "collection"
                    ? "bg-emerald-300/14 text-emerald-100"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Collection
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/10 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Prestige Score</div>
            <div className="mt-2 text-4xl font-semibold text-white">{meta.prestige.score}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Current Level Floor</div>
            <div className="mt-2 text-4xl font-semibold text-white">{meta.prestige.currentLevelFloor}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Next Level</div>
            <div className="mt-2 text-4xl font-semibold text-white">{meta.prestige.nextLevelScore}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Progress</div>
            <div className="mt-2 text-4xl font-semibold text-white">
              {Math.round(meta.prestige.progressToNextLevel * 100)}%
            </div>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300"
            style={{ width: `${Math.max(6, Math.round(meta.prestige.progressToNextLevel * 100))}%` }}
          />
        </div>

        {view === "overview" ? (
        <div className="mt-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-300/14 p-3 text-amber-200">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Prestige Breakdown
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    How You Earned It
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {meta.prestige.breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{item.label}</div>
                        <div className="mt-1 text-sm leading-6 text-slate-300">
                          {item.description}
                        </div>
                      </div>
                      <div className="shrink-0 text-2xl font-semibold text-amber-100">
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-300/14 p-3 text-emerald-200">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Challenge Ladder
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    Completed And Open
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">
                    Completed
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {completedChallenges.length}
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    Challenges you have already cleared at least once.
                  </div>

                  <div className="mt-4 space-y-2">
                    {completedChallenges.length > 0 ? (
                      completedChallenges.map((challenge) => (
                        <div
                          key={challenge.id}
                          className="rounded-2xl border border-emerald-300/18 bg-black/20 px-4 py-3 text-sm text-white"
                        >
                          {challenge.title}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                        No challenge clears yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                    Open Challenges
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-white">
                    {openChallenges.length}
                  </div>
                  <div className="mt-2 text-sm text-slate-200">
                    These are still available ways to raise Prestige.
                  </div>

                  <div className="mt-4 space-y-2">
                    {openChallenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-white">{challenge.title}</div>
                          <div className="text-sm text-amber-100">+{challenge.reward}</div>
                        </div>
                        <div className="mt-1 text-sm leading-6 text-slate-300">
                          {challenge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-300/14 p-3 text-sky-200">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Fastest Ways To Climb
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    What To Chase Next
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Clear new challenge routes first, because that is now the fastest way to gain Prestige.",
                  "Use the Challenges page to hunt untouched setup combinations instead of replaying the same easy path.",
                  "Treat titles and deep runs as bonus XP on top of challenge progress, not the core leveling strategy.",
                  "Keep expanding your collection of unique drafted legends for a small passive Prestige boost.",
                  "Use unfinished challenge routes as your clearest path to the next prestige jump.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Recent Franchises
              </div>
              <h3 className="mt-1 font-display text-2xl text-white">
                Recent Prestige Drivers
              </h3>

              <div className="mt-6 space-y-3">
                {recentRuns.length > 0 ? (
                  recentRuns.map((run) => (
                    <div key={run.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{run.teamName}</div>
                          <div className="mt-1 text-sm text-slate-300">
                            {run.mode === "category-focus"
                              ? `${run.categoryFocusTitle ?? "Category Focus"} - ${run.focusScore ?? "--"}`
                              : `${run.record} - ${run.playoffFinish}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{run.legacyScore}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            legacy
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                    Finish a few runs and this page will start showing which franchises built your prestige profile.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : view === "rewards" ? (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-fuchsia-300/14 bg-fuchsia-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-fuchsia-100/70">Current Level</div>
                <div className="mt-2 text-3xl font-semibold text-white">{meta.prestige.level}</div>
                <div className="mt-2 text-sm text-slate-200">{meta.prestige.title}</div>
              </div>
              <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Rewards Unlocked</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {prestigeRewardDefinitions.filter((reward) => meta.prestige.level >= reward.level).length}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Gameplay rewards already active on your profile.
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Next Reward</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {prestigeRewardDefinitions.find((reward) => reward.level > meta.prestige.level)?.title ?? "All current rewards unlocked"}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {prestigeRewardDefinitions.find((reward) => reward.level > meta.prestige.level)
                    ? `Unlocks at level ${prestigeRewardDefinitions.find((reward) => reward.level > meta.prestige.level)?.level}.`
                    : "You have unlocked every currently implemented prestige reward."}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-fuchsia-300/14 p-3 text-fuchsia-200">
                  <Gift size={18} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Reward Track
                  </div>
                  <h3 className="mt-1 font-display text-2xl text-white">
                    What Every Level Unlocks
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {rewardTrack.map((entry) => (
                  <div
                    key={entry.level}
                    className={`rounded-[22px] border p-4 ${
                      entry.reward
                        ? entry.unlocked
                          ? "border-fuchsia-300/20 bg-fuchsia-300/10"
                          : "border-white/10 bg-black/20"
                        : "border-white/8 bg-black/12"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                            Level {entry.level}
                          </div>
                          <div className="text-sm font-semibold text-white">{entry.title}</div>
                          <div className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                            entry.unlocked
                              ? "border border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                              : "border border-white/10 bg-white/6 text-slate-400"
                          }`}>
                            {entry.unlocked ? "Unlocked" : "Locked"}
                          </div>
                        </div>
                        <div className="mt-2 text-sm leading-7 text-slate-300">
                          {entry.reward
                            ? entry.reward.description
                            : "No gameplay reward unlock at this exact level yet. Keep climbing to reach the next reward threshold."}
                        </div>
                      </div>
                      {entry.reward ? (
                        <div className="rounded-2xl border border-fuchsia-300/18 bg-black/20 px-4 py-3 text-sm text-fuchsia-100">
                          {entry.reward.title}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : view === "collection" ? (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Collection Trophies</div>
                <div className="mt-2 text-3xl font-semibold text-white">{collectionProgress.length}</div>
                <div className="mt-2 text-sm text-slate-200">
                  Each trophy tracks one badge family and unlocks when you finish the full set.
                </div>
              </div>
              <div className="rounded-[24px] border border-sky-300/14 bg-sky-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-sky-100/70">Trophies Unlocked</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {collectionProgress.filter((entry) => entry.unlocked).length}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Fully completed side-quest sets already banked on your profile.
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Entries Collected</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {collectionProgress.reduce((sum, entry) => sum + entry.collectedCount, 0)} / {collectionProgress.reduce((sum, entry) => sum + entry.totalCount, 0)}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Draft a combo together in the same run and it immediately counts as collected.
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
                      Back To Trophies
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
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-200/80">Trophy Status</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {selectedCollection.unlocked ? "Unlocked" : "In Progress"}
                    </div>
                    <div className="mt-1 text-sm text-slate-200/90">{selectedCollection.family.rewardText}</div>
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
                {collectionProgress.map((entry) => (
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
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-300/80">Collection Trophy</div>
                            <div className="mt-1 text-2xl font-semibold text-white">{entry.family.title}</div>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-100/88">{entry.family.description}</p>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                        entry.unlocked
                          ? "border border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                          : "border border-white/10 bg-black/20 text-slate-300"
                      }`}>
                        {entry.unlocked ? "Unlocked" : "Locked"}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Progress</div>
                        <div className="mt-2 text-3xl font-semibold text-white">
                          {entry.collectedCount} / {entry.totalCount}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        Open Trophy
                        <Users2 size={14} />
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
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-sky-300/14 bg-sky-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-sky-100/70">Total Challenge Routes</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {meta.prestige.totalChallengeRoutes}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Every valid combination of primary challenge, environment, and category focus.
                </div>
              </div>
              <div className="rounded-[24px] border border-emerald-300/14 bg-emerald-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">Routes Cleared</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {meta.prestige.completedChallengeRoutes}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  One-time clears you have already banked toward your Prestige profile.
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200/14 bg-amber-300/8 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Still Available</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {meta.prestige.totalChallengeRoutes - meta.prestige.completedChallengeRoutes}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  Each uncleared route has its own one-time prestige payout waiting for you.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Challenge Tier</div>
                <div className="mt-2 text-sm text-slate-200">
                  {activeDifficultyTab.description}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => setChallengeFilter("open")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      challengeFilter === "open"
                        ? "bg-amber-300/14 text-amber-100"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => setChallengeFilter("completed")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      challengeFilter === "completed"
                        ? "bg-emerald-300/14 text-emerald-100"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Completed
                  </button>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {visibleChallengeCount} visible
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {challengeDifficultyTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChallengeDifficulty(tab.id)}
                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                    challengeDifficulty === tab.id
                      ? "border-white/20 bg-white/10"
                      : "border-white/10 bg-black/20 hover:border-white/16 hover:bg-white/6"
                  }`}
                >
                  <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tab.toneClass}`}>
                    {tab.label}
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-300">{tab.description}</div>
                </button>
              ))}
            </div>
            <div className="space-y-6">
              {filteredChallenges.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredChallenges.map((item) => {
                    const completed = completedRouteIds.has(item.id);
                    const challenge = draftChallenges.find((entry) => entry.id === item.draftChallengeId);
                    const category = item.categoryChallengeId ? getCategoryChallengeById(item.categoryChallengeId) : null;
                    const rareEvent = getRareEventById(item.rareEventId);
                    const difficultyTab =
                      challengeDifficultyTabs.find((tab) => tab.id === item.difficulty) ?? activeDifficultyTab;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-[24px] border p-5 ${
                          completed
                            ? "border-emerald-300/18 bg-emerald-300/8"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="rounded-full border border-amber-200/18 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                                #{item.order}
                              </div>
                              <div
                                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${difficultyTab.toneClass}`}
                              >
                                {difficultyTab.label}
                              </div>
                            </div>
                            <div className="mt-3 text-lg font-semibold text-white">{item.title}</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                                <Swords size={12} />
                                {challenge?.title ?? "Challenge"}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                                <Zap size={12} />
                                {rareEvent.id === standardRareEvent.id ? "Standard" : rareEvent.title}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                                <Target size={12} />
                                {category ? category.metricLabel : "No Focus"}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Reward</div>
                            <div className="mt-1 text-2xl font-semibold text-amber-100">+{item.reward}</div>
                          </div>
                        </div>

                        <div className="mt-4 text-sm leading-7 text-slate-300">{item.description}</div>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                          Clear goal: {getRouteGoalLabel(item)}
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div
                            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                              completed
                                ? "border border-emerald-300/18 bg-emerald-300/12 text-emerald-100"
                                : "border border-amber-200/18 bg-amber-300/10 text-amber-100"
                            }`}
                          >
                            {completed ? "Cleared" : "Open"}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onApplyChallengePreset(item);
                              onClose();
                            }}
                            className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-sky-300/24 hover:bg-sky-300/10"
                          >
                            {completed ? "Replay Setup" : "Load Setup"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/5 p-8 text-sm leading-7 text-slate-300">
                  {challengeFilter === "open"
                    ? `You have already cleared every ${activeDifficultyTab.label.toLowerCase()} challenge route in the current catalog. Switch tiers or open Completed to review your mastery board.`
                    : `No ${activeDifficultyTab.label.toLowerCase()} challenge clears yet. Finish one of these routes and it will appear here.`}
                </div>
              )}
	            </div>
	            </div>
	        )}
	      </div>
	    </div>
  );

  if (typeof document === "undefined") {
    return overlay;
  }

  return createPortal(overlay, document.body);
};

