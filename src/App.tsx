import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Coins, Crown, Flag, Images, Info, LifeBuoy, LogOut, Sparkles, Swords, Target, UserRound } from "lucide-react";
import { CollectionOverlay } from "./components/CollectionOverlay";
import { DraftBriefing } from "./components/DraftBriefing";
import { DraftPlayerCard } from "./components/DraftPlayerCard";
import { GuidedTutorialOverlay, type GuidedTutorialStep } from "./components/GuidedTutorialOverlay";
import { LandingHub } from "./components/LandingHub";
import { LearnOverlay } from "./components/LearnOverlay";
import { LineupReorderScreen } from "./components/LineupReorderScreen";
import { LoginPage } from "./components/LoginPage";
import { PrestigeLevelUpModal } from "./components/PrestigeLevelUpModal";
import { PrestigeOverlay } from "./components/PrestigeOverlay";
import { ProgressHeader } from "./components/ProgressHeader";
import { ResultsShowcase } from "./components/ResultsShowcase";
import { RogueChallengesOverlay } from "./components/RogueChallengesOverlay";
import { RoguelikeMode } from "./components/RoguelikeMode";
import { RosterSidebar } from "./components/RosterSidebar";
import { SimulationScreen } from "./components/SimulationScreen";
import { TokenStoreOverlay } from "./components/TokenStoreOverlay";
import { getStoreUnlockQuantitiesForState, useDraftGame } from "./hooks/useDraftGame";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import {
  deleteActiveRogueRun,
  fetchActiveRogueRun,
  fetchUserCollectionCards,
  fetchUserStoreUnlocks,
  fetchTokenBalance,
  syncTokenBalance,
  upsertActiveRogueRun,
  upsertUserCollectionCards,
  upsertUserStoreUnlocks,
} from "./lib/cloudSave";
import { ROGUE_CHALLENGES, getRogueChallengeRunSettingsPreset } from "./lib/rogueChallenges";
import type { RoguelikeRunSettings } from "./lib/roguelike";
import { getCategoryChallengeTarget } from "./lib/simulate";
import { tokenStoreUtilityItems, type TokenStoreUtilityItem } from "./lib/tokenStore";
import { trackAnalyticsEventSoon } from "./lib/analytics";
import { ULTIMATE_DRAFT_LOGO_SRC } from "./lib/brand";

const ROGUELIKE_UI_STORAGE_KEY = "legends-draft-roguelike-ui-v1";
const ROGUELIKE_RUN_STORAGE_KEY = "legends-draft-roguelike-run-v1";
const ROGUELIKE_PARKED_STORAGE_KEY = "legends-draft-roguelike-parked-v1";
const FIRST_RUN_TUTORIAL_STORAGE_KEY = "nba-ultimate-draft-first-run-tutorial-v1";
const FEEDBACK_SUPPORT_EMAIL = "support@nbaultimatedraft.com";

type TutorialMode = "first-run" | "context";

const getTokenStoreUtilityPrice = (id: TokenStoreUtilityItem["id"]) =>
  tokenStoreUtilityItems.find((item) => item.id === id)?.price ?? 0;

const openFeedbackSupportEmail = (email: string | null | undefined, guestMode: boolean) => {
  if (typeof window === "undefined") return;

  const subject = encodeURIComponent("NBA Ultimate Draft feedback/support");
  const body = encodeURIComponent(
    [
      "Tell us what happened, what you expected, and what screen you were on:",
      "",
      "",
      "Troubleshooting details:",
      `Account: ${guestMode ? "Guest Mode" : email ?? "Signed in"}`,
      `Page: ${window.location.href}`,
      `Browser: ${window.navigator.userAgent}`,
    ].join("\n"),
  );

  window.location.href = `mailto:${FEEDBACK_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
};

const challengeStrategyMap: Record<string, string> = {
  "classic": "Take the best long-term team, not the flashiest individual player.",
  "no-s-tier-shortcut": "Lean into chemistry, value, and synergy instead of chasing Galaxy ceiling.",
  "floor-spacers": "Protect spacing with shooters, creators, and at least one stable big.",
  "fortress-build": "Prioritize stoppers, rim protection, and versatile size.",
  "creator-collective": "Stack initiators so every lineup unit has an organizer.",
  "dynasty-depth": "Treat the middle of the rotation like real winning equity.",
  "title-or-bust": "Draft for playoff survivability with as few weak spots as possible.",
};

const rareEventStrategyMap: Record<string, string> = {
  "rare-events-disabled": "Draft the cleanest all-around roster you can.",
  "nineties-night": "90s cores, physical wings, and classic bigs get extra lift.",
  "pace-and-space": "Shooting and spacing matter more than usual here.",
  "defense-travels": "Stops, length, and versatility carry more weight.",
  "point-forward-era": "Big initiators and jumbo creators get a boost.",
  "tower-ball": "Size, rebounding, and paint control play better here.",
};

const categoryStrategyMap: Record<string, string> = {
  offense: "Prioritize scoring gravity, creators, and shot pressure.",
  defense: "Value stoppers, rim protection, and switchable size.",
  playmaking: "Stack passers, initiators, and connective decision-makers.",
  shooting: "Load up on elite spacing and avoid floor-cloggers.",
  rebounding: "Target size, strength, and multiple glass-crashers.",
  chemistry: "Chase badge synergies while keeping players in coherent positions and roles.",
};

const hasVisibleTutorialTarget = (step: GuidedTutorialStep) => {
  if (typeof document === "undefined" || typeof window === "undefined") return false;

  const targetId = step.spotlightTargetId ?? step.targetId;
  const element = document.querySelector<HTMLElement>(`[data-tutorial-id="${targetId}"]`);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
};

function App() {
  const auth = useSupabaseAuth();
  const {
    state,
    metaProgress,
    teamAverage,
    draftChemistry,
    completedRoster,
    startDraft,
    draftPlayer,
    beginSimulation,
    resetDraft,
    handleRosterSlotClick,
    moveRosterPlayer,
    skipBonusPick,
    setDraftChallengeSelection,
    setRareEventSelection,
    setCategoryChallengeSelection,
    beginDraftFromBriefing,
    awardRogueFailureRewards,
    updateRoguePersonalBests,
    recordRogueRunStarted,
    recordRogueRunDraftedPlayers,
    applyCloudAccountSnapshot,
    absorbCloudTokenBalance,
    absorbCloudCollectionPlayerIds,
    purchaseTrainingCampTicket,
    purchaseTradePhone,
    purchaseSilverStarterPack,
    purchaseGoldStarterPack,
    purchasePlatinumStarterPack,
    purchaseCoachRecruitment,
    purchaseOpeningLockerCashUpgrade,
    purchaseExtraDraftShuffle,
    purchaseStarterPackChoicePlus,
    purchaseRogueStar,
    purchaseRoguePack,
    ensureRoguePackPullOwned,
    setActiveRogueStar,
    recordRogueCollectionEntries,
    claimCollectionReward,
    recordRogueChallengeCompletions,
    claimRogueChallengeReward,
    useTrainingCampTicket,
    useTradePhone,
    useSilverStarterPack,
    useGoldStarterPack,
    usePlatinumStarterPack,
  } = useDraftGame();

  const choiceSignature = useMemo(
    () => state.currentChoices.map((player) => player.id).join("|"),
    [state.currentChoices],
  );
  const [visibleChoiceCount, setVisibleChoiceCount] = useState(
    state.currentChoices.length,
  );
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [prestigeInitialView, setPrestigeInitialView] = useState<"overview" | "rewards">("overview");
  const [learnOpen, setLearnOpen] = useState(false);
  const [challengesOpen, setChallengesOpen] = useState(false);
  const [tokenStoreOpen, setTokenStoreOpen] = useState(false);
  const [tokenStoreInitialView, setTokenStoreInitialView] = useState<"store" | "vault" | "tokens" | "collections">("store");
  const [guestMode, setGuestMode] = useState(false);
  const [rogueChallengeSetupRequest, setRogueChallengeSetupRequest] = useState<{
    challengeId: string;
    settings: Partial<RoguelikeRunSettings>;
    requestId: number;
  } | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.localStorage.getItem(FIRST_RUN_TUTORIAL_STORAGE_KEY) !== "complete";
  });
  const [tutorialMode, setTutorialMode] = useState<TutorialMode>("first-run");
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [activeContextTutorialSteps, setActiveContextTutorialSteps] = useState<GuidedTutorialStep[]>([]);
  const [cloudSavedRogueRun, setCloudSavedRogueRun] = useState<unknown | null>(null);
  const [cloudTokenBalanceLoaded, setCloudTokenBalanceLoaded] = useState(false);
  const [cloudCollectionLoaded, setCloudCollectionLoaded] = useState(false);
  const [cloudStoreUnlocksLoaded, setCloudStoreUnlocksLoaded] = useState(false);
  const [showPrestigeLevelUp, setShowPrestigeLevelUp] = useState(false);
  const [showExtraPickIntro, setShowExtraPickIntro] = useState(false);
  const homeViewedTrackedRef = useRef(false);
  const checkoutReturnTrackedRef = useRef(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );
  const ownedCollectionPlayerIds = useMemo(
    () => Array.from(new Set(state.ownedCollectionPlayerIds)),
    [state.ownedCollectionPlayerIds],
  );
  const readyRogueChallengeCount = useMemo(
    () =>
      state.completedRogueChallengeIds.filter(
        (challengeId) => !state.claimedRogueChallengeIds.includes(challengeId),
      ).length,
    [state.claimedRogueChallengeIds, state.completedRogueChallengeIds],
  );
  const [roguelikeOpen, setRoguelikeOpen] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      const openFlag = window.localStorage.getItem(ROGUELIKE_UI_STORAGE_KEY);
      const hasSavedRun = Boolean(window.localStorage.getItem(ROGUELIKE_RUN_STORAGE_KEY));
      const parkedRun = window.localStorage.getItem(ROGUELIKE_PARKED_STORAGE_KEY) === "true";
      return openFlag === "true" || (hasSavedRun && !parkedRun);
    } catch {
      return false;
    }
  });
  const firstRunTutorialSteps = useMemo<GuidedTutorialStep[]>(() => {
    const steps: GuidedTutorialStep[] = [
      {
        id: "tokens",
        targetId: "app-token-store",
        title: "Your account power lives here",
        body: "The Token Store holds permanent Rogue upgrades, utility items, rotating starter cards, token bundles, and rewards. You can come back here between runs.",
        placement: "bottom",
      },
      {
        id: "learn",
        targetId: "app-learn",
        title: "Use Learn whenever something feels unclear",
        body: "The Learn guide explains Rogue cards, badges, boss battles, locker room cash, and the main run systems without needing to leave the game.",
        placement: "bottom",
      },
      {
        id: "account",
        targetId: "app-account",
        title: "Manage your account here",
        body: "The account button opens profile actions like restarting this tutorial or logging out. Cloud tokens and Rogue saves are tied to your signed-in account.",
        placement: "bottom",
      },
      {
        id: "enter-rogue",
        targetId: "home-enter-rogue",
        title: "Start with NBA Rogue Mode",
        body: "This is the main experience. Click this button to enter the run setup and begin the guided path.",
        placement: "top",
        advanceOnTargetClick: true,
      },
      {
        id: "run-settings",
        targetId: "rogue-settings-continue",
        spotlightTargetId: "rogue-settings-screen",
        title: "Set the rules for the run",
        body: "These settings control the player pool, coaches, pack upgrades, and ladder shape. The defaults are safe, so continue when you are ready.",
        placement: "top",
        advanceOnTargetClick: true,
      },
      {
        id: "starter-pack",
        targetId: "rogue-starter-pack-choice",
        title: "Choose your opener",
        body: "Starter packs set the first three players of the run. Pick the direction that feels best for this climb.",
        placement: "top",
        advanceOnTargetClick: true,
      },
      {
        id: "starter-reveal",
        targetId: "rogue-starter-proceed",
        spotlightTargetId: "rogue-starter-reveal-cards",
        title: "Reveal your first core",
        body: "Once all three starter cards are flipped, use this button to move to the ladder.",
        waitingTitle: "Reveal the starter cards",
        waitingBody: "Click the three starter cards. When the proceed button appears, I will highlight it for you.",
        placement: "right",
        advanceOnTargetClick: true,
      },
      {
        id: "ladder-go",
        targetId: "rogue-ladder-go",
        title: "Press Go on the current floor",
        body: "The highlighted floor is your next decision. This button starts the floor and moves the run forward.",
        placement: "top",
        advanceOnTargetClick: true,
      },
    ];

    if (!isNarrowViewport) {
      steps.splice(2, 0, {
        id: "collection",
        targetId: "app-collection",
        title: "Track your owned cards",
        body: "Collection opens your permanent card wall. Cards you own forever from store purchases, packs, and permanent rewards appear here.",
        placement: "bottom",
      });
    }

    return steps;
  }, [isNarrowViewport]);

  const contextTutorialCandidates = useMemo<GuidedTutorialStep[]>(() => {
    const navigationSteps: GuidedTutorialStep[] = [
      {
        id: "nav-learn",
        targetId: "app-learn",
        title: "Learn Guide",
        body: "Open this when you want a rules refresher on Rogue cards, badges, bosses, locker room cash, and long-term progress.",
        placement: "bottom",
      },
      {
        id: "nav-challenges",
        targetId: "app-challenges",
        title: "Challenges",
        body: "Challenges are one-time Rogue goals. Completed goals can be filtered, claimed for rewards, or launched as preset challenge runs.",
        placement: "bottom",
      },
      {
        id: "nav-store",
        targetId: "app-token-store",
        title: "Token Store",
        body: "Spend tokens here on run tools, permanent upgrades, starter pack improvements, token bundles, and permanent player-card packs.",
        placement: "bottom",
      },
      {
        id: "nav-collection",
        targetId: "app-collection",
        title: "Collection",
        body: "Open your permanent card wall to review owned cards and collection progress.",
        placement: "bottom",
      },
      {
        id: "nav-account",
        targetId: "app-account",
        title: "Account",
        body: "This opens profile actions, including restarting the full onboarding tour and signing in or out.",
        placement: "bottom",
      },
    ];

    if (learnOpen) {
      return [
        {
          id: "learn-shell",
          targetId: "learn-overlay",
          title: "Learn Guide",
          body: "This modal is the in-game reference manual for the systems that matter most during a Rogue run.",
        },
        {
          id: "learn-tabs",
          targetId: "learn-tabs",
          title: "Topics",
          body: "Switch topics to jump between basics, card reading, badges, bosses, locker room cash, and progression.",
          placement: "right",
        },
        {
          id: "learn-content",
          targetId: "learn-content",
          title: "Current Lesson",
          body: "The main lesson cards explain what the selected system does and how it should affect your decisions.",
          placement: "top",
        },
        {
          id: "learn-reminders",
          targetId: "learn-reminders",
          title: "Practical Reminders",
          body: "These short notes call out the things most likely to matter while you are actually drafting or climbing.",
          placement: "top",
        },
      ];
    }

    if (challengesOpen) {
      return [
        {
          id: "challenges-shell",
          targetId: "rogue-challenges-overlay",
          title: "Challenge Tracker",
          body: "This is where Rogue goals, milestone progress, reward status, and preset challenge launches live.",
        },
        {
          id: "challenges-groups",
          targetId: "rogue-challenges-groups",
          title: "Challenge Groups",
          body: "Use these groups and subgroups to move between milestones, difficulty families, and team takeover goals.",
          placement: "right",
        },
        {
          id: "challenges-filters",
          targetId: "rogue-challenges-filters",
          title: "Status Filters",
          body: "Filter to hide completed goals, find open goals, focus on ready-to-claim rewards, or review claimed challenges.",
          placement: "top",
        },
        {
          id: "challenges-list",
          targetId: "rogue-challenges-list",
          title: "Challenge Rows",
          body: "Each row shows the requirement, saved progress, reward, and the actions to run the preset or claim the payout.",
          placement: "top",
        },
      ];
    }

    if (tokenStoreOpen) {
      return [
        {
          id: "store-shell",
          targetId: "token-store-overlay",
          title: "Token Store",
          body: "This store converts Rogue progress into better starts, stronger future runs, and permanent cards.",
        },
        {
          id: "store-summary",
          targetId: "token-store-summary",
          title: "Token Summary",
          body: "These cards show your spendable balance, lifetime token earnings, and how many permanent pack cards you own.",
          placement: "top",
        },
        {
          id: "store-tabs",
          targetId: "token-store-view-tabs",
          title: "Store Sections",
          body: "Swap between Rogue upgrades, card packs, token bundles, and collection reward sets.",
          placement: "top",
        },
        {
          id: "store-active-view",
          targetId: "token-store-active-view",
          title: "Active Store View",
          body: "The current section contains the purchases or rewards you can inspect, buy, open, or claim.",
          placement: "top",
        },
      ];
    }

    if (collectionOpen) {
      return [
        {
          id: "collection-shell",
          targetId: "collection-overlay",
          title: "Collection",
          body: "This is your permanent card wall. Cards earned from packs, purchases, and rewards stay here across runs.",
        },
        {
          id: "collection-summary",
          targetId: "collection-summary",
          title: "Collection Totals",
          body: "These counters show owned cards, the full player pool, and total completion percentage.",
          placement: "top",
        },
        {
          id: "collection-filters",
          targetId: "collection-filters",
          title: "Card Filters",
          body: "Search by player or team, then narrow the wall by tier, NBA team, or position.",
          placement: "top",
        },
        {
          id: "collection-grid",
          targetId: "collection-grid",
          title: "Owned Cards",
          body: "This grid displays the filtered permanent cards you own. In starter-pick flows, selecting a card enables the add action.",
          placement: "top",
        },
      ];
    }

    if (prestigeOpen) {
      return [
        {
          id: "prestige-shell",
          targetId: "prestige-overlay",
          title: "Prestige Profile",
          body: "Prestige is your long-term Rogue reputation and reward track.",
        },
        {
          id: "prestige-tabs",
          targetId: "prestige-tabs",
          title: "Prestige Views",
          body: "Switch between your progress overview and the level reward track.",
          placement: "top",
        },
        {
          id: "prestige-summary",
          targetId: "prestige-summary",
          title: "Level Progress",
          body: "These cards show your current score, level floor, next target, and progress toward the next level.",
          placement: "top",
        },
        {
          id: "prestige-active-panel",
          targetId: "prestige-active-panel",
          title: "Details",
          body: "This section explains where your Prestige came from or what future levels unlock.",
          placement: "top",
        },
      ];
    }

    if (showPrestigeLevelUp) {
      return [
        {
          id: "level-up-shell",
          targetId: "prestige-level-up-modal",
          title: "Level Up",
          body: "This modal confirms your new Prestige level after the run result is processed.",
        },
        {
          id: "level-up-rewards",
          targetId: "prestige-level-up-rewards",
          title: "Unlocked Rewards",
          body: "Any gameplay rewards unlocked at this level are listed here so you know what changed.",
          placement: "top",
        },
        {
          id: "level-up-continue",
          targetId: "prestige-level-up-continue",
          title: "Continue",
          body: "Close this when you are ready to return to the results screen.",
          placement: "top",
        },
      ];
    }

    if (roguelikeOpen) {
      return [
        {
          id: "rogue-coach-select-intro",
          targetId: "rogue-coach-select-intro",
          title: "Choose Your Coach",
          body: "Select 1 of the 5 coaches on this screen. Each coach is tied to an NBA team, and signing that coach gives every player you draft or add later from that same team a +1 overall boost for the rest of the run.",
          placement: "bottom",
        },
        {
          id: "rogue-coach-select-options",
          targetId: "rogue-coach-select-options",
          title: "Coach Team Boosts",
          body: "Look at the team shown on each coach card before you hire. The best choice is usually the team boost that matches players you already have or players you want to chase next.",
          placement: "top",
        },
        {
          id: "rogue-screen",
          targetId: "rogue-mode-screen",
          title: "NBA Rogue Mode",
          body: "This is the run-based mode. The current screen changes as you configure, draft, climb, shop, fight bosses, and review results.",
        },
        {
          id: "rogue-settings",
          targetId: "rogue-settings-screen",
          title: "Run Settings",
          body: "These controls shape the player pool, difficulty, enabled run systems, starter pack quality, and ladder length.",
          placement: "top",
        },
        {
          id: "rogue-settings-action",
          targetId: "rogue-settings-continue",
          title: "Continue",
          body: "Use this when the setup looks right and you are ready to choose a starter pack.",
          placement: "top",
        },
        {
          id: "rogue-starter-choice",
          targetId: "rogue-starter-pack-choice",
          title: "Starter Packs",
          body: "Pick the opening offer that best matches the kind of roster you want to build.",
          placement: "top",
        },
        {
          id: "rogue-starter-reveal",
          targetId: "rogue-starter-reveal-cards",
          title: "Starter Reveal",
          body: "Flip your starter cards to see the first core pieces of the run.",
          placement: "top",
        },
        {
          id: "rogue-starter-proceed",
          targetId: "rogue-starter-proceed",
          title: "Proceed",
          body: "Once the starter cards are revealed, this moves the run to the ladder.",
          placement: "top",
        },
        {
          id: "rogue-stage-panel",
          targetId: "rogue-mode-stage-panel",
          title: "Current Run Panel",
          body: "This is the main action area for the current floor, reward, store stop, lineup choice, or result.",
          placement: "top",
        },
        {
          id: "rogue-ladder",
          targetId: "rogue-ladder-map",
          title: "Run Ladder",
          body: "The ladder shows the floors ahead, the current decision, and the rewards or checks attached to each stop.",
          placement: "top",
        },
        {
          id: "rogue-ladder-go",
          targetId: "rogue-ladder-go",
          title: "Current Floor Action",
          body: "This starts the highlighted floor and moves the run forward.",
          placement: "top",
        },
        {
          id: "rogue-roster",
          targetId: "rogue-roster-rail",
          title: "Run Roster",
          body: "Your current roster and slot order live here. During roster decisions, this is where drag-and-drop matters.",
          placement: "top",
        },
      ];
    }

    if (state.screen === "briefing") {
      return [
        {
          id: "briefing-shell",
          targetId: "draft-briefing-screen",
          title: "Draft Briefing",
          body: "This pre-run screen locks in the rules, goals, and reward stakes before the draft starts.",
        },
        {
          id: "briefing-rule",
          targetId: "draft-briefing-rule",
          title: "Run Rule",
          body: "This card tells you the restriction or setup that changes how the roster should be built.",
          placement: "top",
        },
        {
          id: "briefing-goal",
          targetId: "draft-briefing-goal",
          title: "Goal",
          body: "This is the outcome you need for the run to count as cleared.",
          placement: "top",
        },
        {
          id: "briefing-start",
          targetId: "draft-briefing-start",
          title: "Start Drafting",
          body: "Begin the draft when the rule and goal are clear.",
          placement: "top",
        },
      ];
    }

    if (state.screen === "draft") {
      return [
        {
          id: "draft-progress",
          targetId: "draft-progress",
          title: "Draft Progress",
          body: "This header tracks which pick you are on and whether you are resolving a normal pick or a bonus pick.",
          placement: "top",
        },
        {
          id: "draft-action",
          targetId: "draft-simulate-action",
          title: state.bonusPickActive ? "Bonus Pick Action" : "Simulate Action",
          body: state.bonusPickActive
            ? "Skip the extra pick if the board does not improve your roster."
            : "This stays locked until your 10-player roster is complete, then starts the season simulation.",
          placement: "top",
        },
        {
          id: "draft-intel",
          targetId: "draft-run-intel",
          title: "Run Intel",
          body: "These notes summarize the active modifiers and suggest what kind of picks should play well.",
          placement: "top",
        },
        {
          id: "draft-choice-board",
          targetId: "draft-choice-board",
          title: "Choice Board",
          body: "Choose one player from each five-card board. In bonus-pick mode, select a roster slot first if required.",
          placement: "top",
        },
        {
          id: "draft-roster",
          targetId: "draft-roster-sidebar",
          title: "Roster Sidebar",
          body: "This tracks the team you are building, slot by slot, along with team average and chemistry.",
          placement: "top",
        },
      ];
    }

    if (state.screen === "lineup") {
      return [
        {
          id: "lineup-shell",
          targetId: "lineup-screen",
          title: "Lineup Phase",
          body: "This is where you order your 10 drafted players before the season simulation.",
        },
        {
          id: "lineup-starters",
          targetId: "lineup-starters",
          title: "Starting Five",
          body: "Drag your best five into the starter slots. These positions carry the most simulation weight.",
          placement: "top",
        },
        {
          id: "lineup-bench",
          targetId: "lineup-bench",
          title: "Bench Roles",
          body: "The structured bench roles matter after the starters, especially for roster balance and position fit.",
          placement: "top",
        },
        {
          id: "lineup-simulate",
          targetId: "lineup-simulate",
          title: "Simulate Season",
          body: "Start the simulation once the rotation order feels right.",
          placement: "top",
        },
      ];
    }

    if (state.screen === "simulating") {
      return [
        {
          id: "sim-shell",
          targetId: "simulation-screen",
          title: "Season Simulation",
          body: "The game is evaluating roster power, chemistry, depth, playoff volatility, and the active challenge context.",
        },
        {
          id: "sim-steps",
          targetId: "simulation-steps",
          title: "Simulation Steps",
          body: "These lines show the major pieces being processed before the results screen appears.",
          placement: "top",
        },
      ];
    }

    if (state.screen === "results") {
      return [
        {
          id: "results-actions",
          targetId: "results-actions",
          title: "Results Actions",
          body: "Use these buttons to draft again, return home, or jump back to challenge tracking when a challenge flow is active.",
          placement: "top",
        },
        {
          id: "results-tabs",
          targetId: "results-tabs",
          title: "Results Views",
          body: "Switch between the season outcome and the deeper team dashboard.",
          placement: "top",
        },
        {
          id: "results-main",
          targetId: "results-main-panel",
          title: "Result Summary",
          body: "This panel explains the run outcome, headline stats, grade, record, or category-focus score.",
          placement: "top",
        },
        {
          id: "results-analysis",
          targetId: "results-analysis-panel",
          title: "Analysis",
          body: "Use this section to understand what worked, what failed, and what the next draft should adjust.",
          placement: "top",
        },
      ];
    }

    return [
      {
        id: "home-hero",
        targetId: "home-enter-rogue",
        title: "Enter Rogue",
        body: "This launches NBA Rogue Mode, the main run-based experience.",
        placement: "top",
      },
      {
        id: "home-challenges",
        targetId: "home-challenge-panel",
        title: "Challenge Preview",
        body: "This panel surfaces ready rewards, open challenge goals, and quick launch or claim actions.",
        placement: "top",
      },
      ...navigationSteps,
    ];
  }, [
    challengesOpen,
    collectionOpen,
    learnOpen,
    prestigeOpen,
    roguelikeOpen,
    showPrestigeLevelUp,
    state.bonusPickActive,
    state.screen,
    tokenStoreOpen,
  ]);

  const activeTutorialSteps = tutorialMode === "context" ? activeContextTutorialSteps : firstRunTutorialSteps;

  const closeActiveTutorial = useCallback(() => {
    setTutorialOpen(false);
    setTutorialStepIndex(0);
    if (tutorialMode === "first-run" && typeof window !== "undefined") {
      window.localStorage.setItem(FIRST_RUN_TUTORIAL_STORAGE_KEY, "complete");
    }
  }, [tutorialMode]);

  const openContextTutorial = useCallback(() => {
    const visibleSteps = contextTutorialCandidates.filter(hasVisibleTutorialTarget);
    const hasSpecificRogueStep = visibleSteps.some((step) =>
      step.id.startsWith("rogue-") && step.id !== "rogue-screen",
    );
    const focusedVisibleSteps = hasSpecificRogueStep
      ? visibleSteps.filter((step) => step.id !== "rogue-screen")
      : visibleSteps;

    setProfileMenuOpen(false);
    setTutorialMode("context");
    setActiveContextTutorialSteps(focusedVisibleSteps.length > 0 ? focusedVisibleSteps : contextTutorialCandidates);
    setTutorialStepIndex(0);
    setTutorialOpen(true);
  }, [contextTutorialCandidates]);

  const restartTutorial = useCallback(() => {
    setProfileMenuOpen(false);
    setTokenStoreOpen(false);
    setPrestigeOpen(false);
    setCollectionOpen(false);
    setLearnOpen(false);
    setChallengesOpen(false);
    setTutorialMode("first-run");
    setActiveContextTutorialSteps([]);
    setTutorialStepIndex(0);
    setTutorialOpen(true);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FIRST_RUN_TUTORIAL_STORAGE_KEY);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);
  const continueAsGuest = useCallback(() => {
    setGuestMode(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);
  const exitGuestMode = useCallback(() => {
    setProfileMenuOpen(false);
    setGuestMode(false);
    setRoguelikeOpen(false);
    resetDraft();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [resetDraft]);

  const openRoguelike = useCallback((source: string) => {
    trackAnalyticsEventSoon("rogue_start_clicked", {
      payload: {
        source,
        isGuest: guestMode,
        isLoggedIn: Boolean(auth.user),
      },
    });
    setRoguelikeOpen(true);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [auth.user?.id, guestMode]);

  const openTokenStore = useCallback((initialView: "store" | "vault" | "tokens" | "collections", source: string) => {
    setTokenStoreInitialView(initialView);
    setChallengesOpen(false);
    setCollectionOpen(false);
    setLearnOpen(false);
    setTokenStoreOpen(true);
    trackAnalyticsEventSoon("token_store_opened", {
      payload: {
        initialView,
        source,
        isGuest: guestMode,
        isLoggedIn: Boolean(auth.user),
        tokenBalance: metaProgress.tokens.balance,
      },
    });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [auth.user?.id, guestMode, metaProgress.tokens.balance]);

  const openCollection = useCallback(() => {
    setProfileMenuOpen(false);
    setPrestigeOpen(false);
    setTokenStoreOpen(false);
    setChallengesOpen(false);
    setLearnOpen(false);
    setCollectionOpen(true);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  const runRogueChallenge = useCallback((challengeId: string) => {
    const preset = getRogueChallengeRunSettingsPreset(challengeId);

    setRogueChallengeSetupRequest({
      ...preset,
      requestId: Date.now(),
    });
    setTokenStoreOpen(false);
    setPrestigeOpen(false);
    setCollectionOpen(false);
    setLearnOpen(false);
    setChallengesOpen(false);
    openRoguelike("rogue_challenge");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [openRoguelike]);
  const openRogueChallenges = useCallback(() => {
    setProfileMenuOpen(false);
    setPrestigeOpen(false);
    setTokenStoreOpen(false);
    setCollectionOpen(false);
    setLearnOpen(false);
    setChallengesOpen(true);
    trackAnalyticsEventSoon("token_store_opened", {
      payload: {
        initialView: "challenges",
        source: "top_nav_or_home",
        isGuest: guestMode,
        isLoggedIn: Boolean(auth.user),
      },
    });
  }, [auth.user?.id, guestMode]);
  const draftIntel = useMemo(() => {
    const cards = [
      {
        id: "challenge",
        label: "Primary Challenge",
        title: state.currentChallenge.title,
        summary:
          state.currentChallenge.reward > 0
            ? `+${state.currentChallenge.reward} legacy`
            : "Standard season sim",
        strategy:
          challengeStrategyMap[state.currentChallenge.id] ??
          "Draft with the active objective in mind and let it break ties between similar players.",
        icon: Flag,
        wrapperClass:
          "rounded-xl border border-amber-300/18 bg-amber-300/10 p-3",
        iconClass: "rounded-lg bg-amber-300/16 p-2 text-amber-100",
        summaryClass: "text-amber-100",
      },
      {
        id: "event",
        label: state.rareEventsEnabled ? "Rare Event Active" : "Environment",
        title: state.currentRareEvent.title,
        summary: state.currentRareEvent.impact,
        strategy:
          rareEventStrategyMap[state.currentRareEvent.id] ??
          "Use the event as a tiebreaker whenever you are choosing between otherwise similar roster directions.",
        icon: Sparkles,
        wrapperClass: state.rareEventsEnabled
          ? "rounded-xl border border-sky-300/18 bg-sky-300/10 p-3"
          : "rounded-xl border border-white/10 bg-black/20 p-3",
        iconClass: state.rareEventsEnabled
          ? "rounded-lg bg-sky-300/16 p-2 text-sky-100"
          : "rounded-lg bg-white/8 p-2 text-slate-300",
        summaryClass: state.rareEventsEnabled ? "text-sky-100" : "text-slate-300",
      },
      {
        id: "category",
        label: "Category Focus",
        title:
          state.categoryChallengesEnabled && state.currentCategoryChallenge
            ? state.currentCategoryChallenge.metricLabel
            : "Disabled",
        summary:
          state.categoryChallengesEnabled && state.currentCategoryChallenge
            ? `Goal: maximize your final ${state.currentCategoryChallenge.metricLabel.toLowerCase()} score.`
            : "Goal: maximize total team quality instead of chasing one specific metric.",
        strategy:
          state.categoryChallengesEnabled && state.currentCategoryChallenge
            ? categoryStrategyMap[state.currentCategoryChallenge.metric] ??
              "Let the focus category break ties between players while still protecting overall roster balance."
            : "Use this flexibility to build the strongest balanced roster possible.",
        icon: Target,
        wrapperClass: state.categoryChallengesEnabled
          ? "rounded-xl border border-emerald-300/18 bg-emerald-300/10 p-3"
          : "rounded-xl border border-white/10 bg-black/20 p-3",
        iconClass: state.categoryChallengesEnabled
          ? "rounded-lg bg-emerald-300/16 p-2 text-emerald-100"
          : "rounded-lg bg-white/8 p-2 text-slate-300",
        summaryClass: state.categoryChallengesEnabled ? "text-emerald-100" : "text-slate-300",
      },
    ];

    return cards;
  }, [
    state.categoryChallengesEnabled,
    state.currentCategoryChallenge,
    state.currentChallenge,
    state.currentRareEvent,
    state.rareEventsEnabled,
  ]);
  const currentCategoryTarget = useMemo(
    () =>
      state.currentCategoryChallenge
        ? getCategoryChallengeTarget(state.currentCategoryChallenge.metric)
        : null,
    [state.currentCategoryChallenge],
  );

  useEffect(() => {
    if (homeViewedTrackedRef.current || auth.loading || roguelikeOpen || state.screen !== "landing") return;

    homeViewedTrackedRef.current = true;
    trackAnalyticsEventSoon("home_viewed", {
      payload: {
        isGuest: guestMode,
        isLoggedIn: Boolean(auth.user),
        tokenBalance: metaProgress.tokens.balance,
      },
    });
  }, [auth.loading, auth.user?.id, guestMode, metaProgress.tokens.balance, roguelikeOpen, state.screen]);

  useEffect(() => {
    if (checkoutReturnTrackedRef.current || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    if (checkoutStatus !== "success" && checkoutStatus !== "cancelled") return;

    checkoutReturnTrackedRef.current = true;
    trackAnalyticsEventSoon("purchase_returned", {
      payload: {
        checkoutStatus,
        isLoggedIn: Boolean(auth.user),
      },
    });
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user) {
      setCloudSavedRogueRun(null);
      return;
    }

    let cancelled = false;
    fetchActiveRogueRun(auth.user.id).then((runData) => {
      if (!cancelled) {
        setCloudSavedRogueRun(runData);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auth.user?.id]);

  useEffect(() => {
    if (!auth.user) {
      setCloudTokenBalanceLoaded(false);
      setCloudCollectionLoaded(false);
      setCloudStoreUnlocksLoaded(false);
      return;
    }

    setCloudTokenBalanceLoaded(false);
    setCloudCollectionLoaded(false);
    setCloudStoreUnlocksLoaded(false);

    let cancelled = false;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const returningFromCheckout = params?.get("checkout") === "success";
    const maxAttempts = returningFromCheckout ? 8 : 1;
    const userId = auth.user.id;
    const localBalanceBeforeSync = metaProgress.tokens.balance;
    const collectionCardsPromise = fetchUserCollectionCards(userId)
      .then((cloudCollectionPlayerIds) => ({ cloudCollectionPlayerIds, collectionLoaded: true }))
      .catch((error) => {
        console.warn("Unable to refresh cloud collection cards", error);
        return { cloudCollectionPlayerIds: undefined, collectionLoaded: false };
      });
    const storeUnlocksPromise = fetchUserStoreUnlocks(userId);
    let trackedTokenBalanceSync = false;

    const refreshAccountSnapshot = async () => {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const tokenBalancePromise = fetchTokenBalance(userId)
          .then((cloudBalance) => ({ cloudBalance, tokenBalanceLoaded: true }))
          .catch((error) => {
            console.warn("Unable to refresh cloud token balance", error);
            return { cloudBalance: undefined, tokenBalanceLoaded: false };
          });
        const [
          { cloudBalance, tokenBalanceLoaded },
          { cloudCollectionPlayerIds, collectionLoaded },
          cloudStoreUnlocks,
        ] = await Promise.all([
          tokenBalancePromise,
          collectionCardsPromise,
          storeUnlocksPromise,
        ]);
        if (cancelled) return;

        const shouldApplySnapshot =
          !returningFromCheckout ||
          tokenBalanceLoaded ||
          attempt === maxAttempts - 1;

        if (shouldApplySnapshot) {
          applyCloudAccountSnapshot(
            tokenBalanceLoaded ? cloudBalance : null,
            collectionLoaded ? cloudCollectionPlayerIds : undefined,
            cloudStoreUnlocks,
          );
          if (tokenBalanceLoaded) {
            setCloudTokenBalanceLoaded(true);
          }
          if (collectionLoaded) {
            setCloudCollectionLoaded(true);
          }
          setCloudStoreUnlocksLoaded(true);
        }

        if (!trackedTokenBalanceSync && tokenBalanceLoaded && cloudBalance !== null) {
          trackedTokenBalanceSync = true;
          trackAnalyticsEventSoon("token_balance_synced", {
            payload: {
              cloudBalance,
              returningFromCheckout,
              attempt: attempt + 1,
              localBalanceBeforeSync,
            },
          });
        }

        if (!returningFromCheckout || (tokenBalanceLoaded && cloudBalance !== null)) return;

        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
    };

    void refreshAccountSnapshot();

    return () => {
      cancelled = true;
    };
  }, [applyCloudAccountSnapshot, auth.user?.id]);

  useEffect(() => {
    if (!auth.user || !cloudTokenBalanceLoaded) return;

    let cancelled = false;
    const userId = auth.user.id;
    const refreshCloudTokenBalance = async () => {
      try {
        const cloudBalance = await fetchTokenBalance(userId);
        if (!cancelled && cloudBalance !== null) {
          absorbCloudTokenBalance(cloudBalance);
        }
      } catch (error) {
        console.warn("Unable to refresh cloud token balance", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCloudTokenBalance();
      }
    };

    window.addEventListener("focus", refreshCloudTokenBalance);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(refreshCloudTokenBalance, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshCloudTokenBalance);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [absorbCloudTokenBalance, auth.user?.id, cloudTokenBalanceLoaded]);

  useEffect(() => {
    if (!auth.user || !cloudCollectionLoaded) return;

    let cancelled = false;
    const userId = auth.user.id;
    const refreshCloudCollection = async () => {
      try {
        const cloudCollectionPlayerIds = await fetchUserCollectionCards(userId);
        if (!cancelled) {
          absorbCloudCollectionPlayerIds(cloudCollectionPlayerIds);
        }
      } catch (error) {
        console.warn("Unable to refresh cloud collection cards", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCloudCollection();
      }
    };

    window.addEventListener("focus", refreshCloudCollection);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(refreshCloudCollection, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshCloudCollection);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [absorbCloudCollectionPlayerIds, auth.user?.id, cloudCollectionLoaded]);

  useEffect(() => {
    if (!auth.user || !cloudTokenBalanceLoaded) return;
    void syncTokenBalance(auth.user.id, metaProgress.tokens.balance, {
      source: "local_balance_sync",
      description: "Synced token balance from local game progress.",
      metadata: {
        lifetimeEarned: metaProgress.tokens.lifetimeEarned,
        spentTokens: state.spentTokens,
        purchasedTokens: state.purchasedTokens,
      },
    });
  }, [
    auth.user?.id,
    cloudTokenBalanceLoaded,
    metaProgress.tokens.balance,
    metaProgress.tokens.lifetimeEarned,
    state.purchasedTokens,
    state.spentTokens,
  ]);

  useEffect(() => {
    if (!auth.user || !cloudCollectionLoaded || state.ownedCollectionPlayerIds.length === 0) return;

    void upsertUserCollectionCards(auth.user.id, state.ownedCollectionPlayerIds, {
      source: "local_collection_sync",
      metadata: {
        ownedCount: state.ownedCollectionPlayerIds.length,
      },
    });
  }, [auth.user?.id, cloudCollectionLoaded, state.ownedCollectionPlayerIds]);

  useEffect(() => {
    if (!auth.user || !cloudStoreUnlocksLoaded) return;

    void upsertUserStoreUnlocks(auth.user.id, getStoreUnlockQuantitiesForState(state), {
      source: "local_store_unlock_sync",
      metadata: {
        ownedSilverStarterPacks: state.ownedSilverStarterPacks,
        ownedGoldStarterPacks: state.ownedGoldStarterPacks,
        ownedPlatinumStarterPacks: state.ownedPlatinumStarterPacks,
        ownedOpeningLockerCashTier: state.ownedOpeningLockerCashTier,
      },
    });
  }, [
    auth.user?.id,
    cloudStoreUnlocksLoaded,
    state.ownedTrainingCampTickets,
    state.ownedTradePhones,
    state.ownedSilverStarterPacks,
    state.ownedGoldStarterPacks,
    state.ownedPlatinumStarterPacks,
    state.ownedCoachRecruitment,
    state.ownedOpeningLockerCashTier,
    state.ownedExtraDraftShuffle,
    state.ownedStarterPackChoicePlus,
  ]);

  const saveCloudRogueRun = useCallback((runData: unknown) => {
    if (!auth.user) return;
    void upsertActiveRogueRun(auth.user.id, runData);
  }, [auth.user?.id]);

  const deleteCloudRogueRun = useCallback(() => {
    if (!auth.user) return;
    setCloudSavedRogueRun(null);
    void deleteActiveRogueRun(auth.user.id);
  }, [auth.user?.id]);

  useEffect(() => {
    if (state.screen !== "draft") {
      setVisibleChoiceCount(state.currentChoices.length);
      return;
    }

    if (state.currentChoices.length === 0) {
      setVisibleChoiceCount(0);
      return;
    }

    setVisibleChoiceCount(0);
    const timers = state.currentChoices.map((_, index) =>
      window.setTimeout(() => {
        setVisibleChoiceCount((current) => Math.max(current, index + 1));
      }, 500 + index * 1700),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [choiceSignature, state.currentChoices, state.screen]);

  useEffect(() => {
    if (state.screen === "results" && state.simulationResult?.prestigeLevelUp) {
      setShowPrestigeLevelUp(true);
      return;
    }

    setShowPrestigeLevelUp(false);
  }, [state.screen, state.simulationResult?.prestigeLevelUp]);

  useEffect(() => {
    if (state.screen === "draft" && state.bonusPickActive) {
      setShowExtraPickIntro(true);
      return;
    }

    setShowExtraPickIntro(false);
  }, [state.screen, state.bonusPickActive]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ROGUELIKE_UI_STORAGE_KEY, roguelikeOpen ? "true" : "false");
  }, [roguelikeOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncViewport = () => setIsNarrowViewport(window.innerWidth < 640);
    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [state.screen, roguelikeOpen, prestigeOpen, collectionOpen, tokenStoreOpen, learnOpen, challengesOpen, showPrestigeLevelUp]);

  if (!auth.loading && !auth.user && !guestMode) {
    return (
      <LoginPage
        configured={auth.configured}
        loading={auth.loading}
        authError={auth.authError}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        onContinueAsGuest={continueAsGuest}
      />
    );
  }

  if (auth.loading) {
    return (
      <div className="arena-shell flex min-h-screen items-center justify-center px-5 text-white">
        <div className="rounded-[28px] border border-white/12 bg-black/36 px-7 py-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">NBA Ultimate Draft</div>
          <div className="mt-2 font-display text-3xl text-white">Checking your session...</div>
        </div>
      </div>
    );
  }

  const isLandingHome = !roguelikeOpen && state.screen === "landing";

  return (
    <div className={`arena-shell text-white ${isLandingHome ? "arena-shell--home" : ""}`}>
      <div className="arena-shell__content mx-auto max-w-[1720px] px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4">
        <div className="mb-4 grid grid-cols-[minmax(64px,0.7fr)_minmax(0,4.3fr)] items-stretch gap-2 lg:grid-cols-[160px_minmax(0,1fr)] lg:gap-3">
          <button
            type="button"
            onClick={() => {
              if (roguelikeOpen && typeof window !== "undefined") {
                window.localStorage.setItem(ROGUELIKE_PARKED_STORAGE_KEY, "true");
              }
              setRoguelikeOpen(false);
              resetDraft();
            }}
            aria-label="Home"
            className="group col-span-1 flex min-h-[30px] min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/18 p-1 transition hover:border-amber-200/22 hover:bg-black/24 lg:min-h-[64px] lg:max-w-none lg:p-1.5"
          >
            <img
              src={ULTIMATE_DRAFT_LOGO_SRC}
              alt="NBA Ultimate Draft"
              className="h-[26px] w-full rounded-xl object-contain drop-shadow-[0_8px_18px_rgba(251,191,36,0.2)] lg:h-[58px] lg:rounded-2xl"
              draggable={false}
            />
          </button>

          <div className="col-span-1 grid min-w-0 grid-cols-5 gap-2 lg:grid-cols-[minmax(132px,1.05fr)_minmax(126px,0.8fr)_minmax(142px,0.9fr)_minmax(150px,0.95fr)_64px] lg:gap-3">
            <button
              type="button"
              data-tutorial-id="app-learn"
              onClick={() => {
                setProfileMenuOpen(false);
                setTokenStoreOpen(false);
                setCollectionOpen(false);
                setChallengesOpen(false);
                setLearnOpen(true);
              }}
              className="glass-panel group min-h-[30px] w-full min-w-0 rounded-2xl border border-sky-200/12 bg-[linear-gradient(135deg,rgba(9,18,34,0.96),rgba(16,26,46,0.92))] px-1.5 py-1 text-left shadow-[0_16px_32px_rgba(0,0,0,0.24)] transition hover:border-sky-200/28 hover:bg-[linear-gradient(135deg,rgba(12,24,44,0.98),rgba(20,34,58,0.94))] hover:shadow-[0_18px_36px_rgba(56,189,248,0.14)] sm:min-w-0 lg:min-h-[64px] lg:px-3 lg:py-2"
            >
	              <div className="flex items-center justify-center gap-1 lg:justify-between lg:gap-3">
	                <div className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[0.1em] text-slate-200 lg:gap-2 lg:text-[11px] lg:tracking-[0.18em]">
                  <div className="rounded-full border border-sky-200/18 bg-sky-300/12 p-0.5 text-sky-200 transition group-hover:border-sky-200/28 group-hover:bg-sky-300/18 lg:p-1">
                    <BookOpen size={9} className="lg:hidden" />
                    <BookOpen size={12} className="hidden lg:block" />
                  </div>
                  <span className="hidden sm:inline lg:inline">Learn</span>
                  <span className="sm:hidden">Tips</span>
                </div>
                <span className="hidden rounded-full border border-white/10 bg-white/6 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-100 lg:inline-flex">
                  Open
                </span>
              </div>
	              <div className="mt-2 hidden text-[0.72rem] font-medium leading-4 text-slate-300 lg:block">
	                Learn Rogue cards, bosses, and run systems
	              </div>
            </button>
            <button
              type="button"
              data-tutorial-id="app-challenges"
              onClick={openRogueChallenges}
              className="glass-panel min-h-[30px] w-full min-w-0 rounded-2xl border border-sky-200/12 bg-[linear-gradient(135deg,rgba(8,18,34,0.96),rgba(13,30,52,0.92))] px-1.5 py-1 text-left shadow-[0_16px_32px_rgba(0,0,0,0.24)] transition hover:border-sky-200/28 hover:bg-[linear-gradient(135deg,rgba(12,28,52,0.98),rgba(16,39,68,0.94))] sm:min-w-0 lg:min-h-[64px] lg:px-3 lg:py-2"
            >
              <div className="flex items-center justify-center gap-1 text-[7px] uppercase tracking-[0.1em] text-slate-400 lg:justify-start lg:gap-1.5 lg:text-[10px] lg:tracking-[0.17em]">
                <Target size={9} className="text-sky-200 lg:hidden" />
                <Target size={12} className="hidden text-sky-200 lg:block" />
                Challenges
              </div>
              <div className="mt-0.5 flex flex-col items-center gap-0 lg:mt-1 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
                <div className="flex items-end gap-1 lg:gap-2">
                  <span className="hidden pb-0 text-[8px] uppercase tracking-[0.1em] text-sky-100/80 sm:inline lg:pb-0.5 lg:text-[9px] lg:tracking-[0.13em]">Ready</span>
                  <span className="text-[0.78rem] font-semibold leading-none text-white lg:text-[clamp(1rem,1.45vw,1.45rem)]">
                    {readyRogueChallengeCount}
                  </span>
                </div>
                <div className="hidden pb-0 text-center text-[8px] uppercase tracking-[0.1em] text-slate-400 lg:block lg:pb-0.5 lg:text-right lg:text-[9px] lg:tracking-[0.12em]">
                  Goals
                </div>
              </div>
              <div className="mt-0.5 h-0.5 overflow-hidden rounded-full border border-white/10 bg-slate-700/70 lg:mt-1 lg:h-1.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-200"
                  style={{
                    width: `${Math.max(
                      6,
                      Math.round((state.claimedRogueChallengeIds.length / Math.max(1, ROGUE_CHALLENGES.length)) * 100),
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-1 h-0.5" />
            </button>
            <button
              type="button"
              data-tutorial-id="app-token-store"
              onClick={() => openTokenStore("store", "top_nav")}
              className="glass-panel min-h-[30px] w-full min-w-0 rounded-2xl px-1.5 py-1 text-left transition hover:border-amber-200/24 hover:bg-white/10 sm:min-w-0 lg:min-h-[64px] lg:px-3 lg:py-2"
            >
              <div className="flex items-center justify-center gap-1 text-[7px] uppercase tracking-[0.1em] text-slate-400 lg:justify-start lg:gap-1.5 lg:text-[10px] lg:tracking-[0.17em]">
                <Coins size={9} className="text-amber-200 lg:hidden" />
                <Coins size={12} className="hidden text-amber-200 lg:block" />
                Tokens
              </div>
              <div className="mt-0.5 flex flex-col items-center gap-0 lg:mt-1 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
                <div className="text-[0.78rem] font-semibold leading-none text-white lg:text-[clamp(1rem,1.45vw,1.45rem)]">
                  {metaProgress.tokens.balance}
                </div>
                <div className="hidden pb-0 text-center text-[8px] uppercase tracking-[0.1em] text-slate-400 lg:block lg:pb-0.5 lg:text-right lg:text-[9px] lg:tracking-[0.12em]">
                  Spendable
                </div>
              </div>
              <div className="mt-0.5 h-0.5 lg:mt-1" />
            </button>
            <button
              type="button"
              data-tutorial-id="app-collection"
              onClick={openCollection}
              className="glass-panel min-h-[30px] w-full min-w-0 rounded-2xl px-1.5 py-1 text-left transition hover:border-cyan-200/24 hover:bg-white/10 sm:min-w-0 lg:min-h-[64px] lg:px-3 lg:py-2"
            >
              <div className="flex items-center justify-center gap-1 text-[7px] uppercase tracking-[0.1em] text-slate-400 lg:justify-start lg:gap-1.5 lg:text-[10px] lg:tracking-[0.17em]">
                <Images size={9} className="text-cyan-200 lg:hidden" />
                <Images size={12} className="hidden text-cyan-200 lg:block" />
                Collection
              </div>
              <div className="mt-0.5 flex flex-col items-center gap-0 lg:mt-1 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
                <div className="flex items-end gap-1 lg:gap-2">
                  <span className="hidden pb-0 text-[8px] uppercase tracking-[0.1em] text-cyan-100/80 sm:inline lg:pb-0.5 lg:text-[9px] lg:tracking-[0.13em]">Cards</span>
                  <span className="text-[0.78rem] font-semibold leading-none text-white lg:text-[clamp(1rem,1.45vw,1.45rem)]">
                    {ownedCollectionPlayerIds.length}
                  </span>
                </div>
                <div className="hidden pb-0 text-center text-[8px] uppercase tracking-[0.1em] text-slate-400 lg:block lg:pb-0.5 lg:text-right lg:text-[9px] lg:tracking-[0.12em]">
                  Owned forever
                </div>
              </div>
              <div className="mt-0.5 h-0.5 overflow-hidden rounded-full border border-white/10 bg-slate-700/70 lg:mt-1 lg:h-1.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300"
                  style={{
                    width: `${Math.max(
                      6,
                      Math.round((ownedCollectionPlayerIds.length / Math.max(1, metaProgress.collection.totalPlayers)) * 100),
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-1 h-0.5" />
            </button>
            <div className="relative flex justify-end lg:justify-center">
              <button
                type="button"
                data-tutorial-id="app-account"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-label="Open user profile menu"
                className="glass-panel grid h-[30px] w-[30px] place-items-center rounded-full border border-cyan-100/18 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.18),rgba(15,23,42,0.92))] text-cyan-50 shadow-[0_14px_30px_rgba(8,47,73,0.24)] transition hover:scale-[1.03] hover:border-cyan-100/34 hover:bg-cyan-300/12 lg:h-[64px] lg:w-[64px]"
              >
                <UserRound size={13} className="lg:hidden" />
                <UserRound size={24} className="hidden lg:block" />
              </button>
              {profileMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[min(320px,calc(100vw-24px))] rounded-2xl border border-white/12 bg-[#070b12]/98 p-4 text-left shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full border border-cyan-100/20 bg-cyan-300/12 text-cyan-100">
                      <UserRound size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Profile</div>
                      <div className="mt-1 truncate text-sm font-semibold text-white">
                        {guestMode ? "Guest Mode" : auth.user?.email ?? "Signed in"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-xs leading-5 text-slate-300">
                    {guestMode
                      ? "You are exploring without cloud progress save. Sign in to save tokens, unlocks, and Rogue runs to your account."
                      : "Profile editing is coming soon. Your account currently manages login, cloud tokens, and Rogue saves."}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openFeedbackSupportEmail(auth.user?.email, guestMode);
                    }}
                    className="mt-4 group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-amber-100/45 bg-[linear-gradient(135deg,rgba(251,191,36,0.98),rgba(250,204,21,0.9),rgba(16,185,129,0.78))] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_16px_34px_rgba(251,191,36,0.28),0_0_28px_rgba(52,211,153,0.12)] transition hover:scale-[1.02] hover:shadow-[0_18px_38px_rgba(251,191,36,0.36),0_0_34px_rgba(52,211,153,0.18)]"
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.32),transparent)] opacity-0 transition group-hover:opacity-100" />
                    <LifeBuoy size={16} className="relative" />
                    <span className="relative">Feedback / Support</span>
                  </button>
                  <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100/82">
                    Report issues or get troubleshooting help
                  </p>
                  <button
                    type="button"
                    onClick={restartTutorial}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-100/20 bg-amber-300/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-50 transition hover:bg-amber-300/16"
                  >
                    <BookOpen size={14} />
                    Restart Tutorial
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileMenuOpen(false);
                      if (guestMode) {
                        exitGuestMode();
                        return;
                      }
                      await auth.signOut();
                    }}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-100/20 bg-rose-400/12 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-50 transition hover:bg-rose-400/18"
                  >
                    <LogOut size={14} />
                    {guestMode ? "Sign In" : "Log Out"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {roguelikeOpen && (
          <RoguelikeMode
            activeRogueStarId={state.activeRogueStarId}
            ownedRogueStarIds={state.ownedRogueStarIds}
            ownedCollectionPlayerIds={ownedCollectionPlayerIds}
            ownedTrainingCampTickets={state.ownedTrainingCampTickets}
            ownedTradePhones={state.ownedTradePhones}
            ownedSilverStarterPacks={state.ownedSilverStarterPacks}
            ownedGoldStarterPacks={state.ownedGoldStarterPacks}
            ownedPlatinumStarterPacks={state.ownedPlatinumStarterPacks}
            ownedCoachRecruitment={state.ownedCoachRecruitment}
            ownedOpeningLockerCashTier={state.ownedOpeningLockerCashTier}
            ownedExtraDraftShuffle={state.ownedExtraDraftShuffle}
            ownedStarterPackChoicePlus={state.ownedStarterPackChoicePlus}
            onAwardFailureRewards={awardRogueFailureRewards}
            onUpdatePersonalBests={updateRoguePersonalBests}
            onRecordRunStarted={recordRogueRunStarted}
            onRecordRogueRunDraftedPlayers={recordRogueRunDraftedPlayers}
            onUseTrainingCampTicket={useTrainingCampTicket}
            onUseTradePhone={useTradePhone}
            onUseSilverStarterPack={useSilverStarterPack}
            onUseGoldStarterPack={useGoldStarterPack}
            onUsePlatinumStarterPack={usePlatinumStarterPack}
            onRecordCollectionEntries={recordRogueCollectionEntries}
            onRecordRogueChallengeCompletions={recordRogueChallengeCompletions}
            completedRogueChallengeIds={state.completedRogueChallengeIds}
            onOpenRogueChallenges={openRogueChallenges}
            challengeSetupRequest={rogueChallengeSetupRequest}
            cloudSavedRunData={cloudSavedRogueRun}
            onCloudSaveRun={saveCloudRogueRun}
            onCloudDeleteRun={deleteCloudRogueRun}
            onLeaveRun={() => {
              setRoguelikeOpen(false);
              resetDraft();
            }}
            onBackToHome={() => {
              setRoguelikeOpen(false);
              resetDraft();
            }}
          />
        )}

        {!roguelikeOpen && state.screen === "landing" && (
          <LandingHub
            onOpenPrestige={() => {
              setPrestigeInitialView("overview");
              setPrestigeOpen(true);
            }}
            onOpenRoguelike={() => openRoguelike("landing")}
            onOpenRogueChallenges={openRogueChallenges}
            onRunRogueChallenge={runRogueChallenge}
            onClaimRogueChallengeReward={claimRogueChallengeReward}
            onRestartTutorial={restartTutorial}
            history={state.history}
            meta={metaProgress}
            completedRogueChallengeIds={state.completedRogueChallengeIds}
            claimedRogueChallengeIds={state.claimedRogueChallengeIds}
          />
        )}

        {!roguelikeOpen && state.screen === "briefing" && (
          <DraftBriefing
            challenge={state.currentChallenge}
            rareEvent={state.currentRareEvent}
            rareEventsEnabled={state.rareEventsEnabled}
            categoryChallenge={state.currentCategoryChallenge}
            categoryChallengesEnabled={state.categoryChallengesEnabled}
            prestigeReward={state.activePrestigeChallengeReward}
            focusTargetScore={currentCategoryTarget}
            onBack={resetDraft}
            onBegin={beginDraftFromBriefing}
          />
        )}

        {!roguelikeOpen && state.screen === "draft" && (
          <section className="space-y-6">
            <div className="grid w-full gap-3 lg:grid-cols-[minmax(88px,0.1fr)_minmax(0,0.45fr)_minmax(0,0.45fr)] lg:items-stretch">
              <button
                type="button"
                onClick={resetDraft}
                className="glass-panel inline-flex min-h-[72px] min-w-0 flex-row items-center justify-center gap-3 rounded-[24px] px-4 py-3 text-center shadow-card transition hover:border-amber-200/40 hover:text-amber-100 lg:h-full lg:flex-col lg:gap-2 lg:rounded-[28px] lg:p-3"
              >
                <div className="flex h-8 w-[76px] items-center justify-center overflow-hidden rounded-full border border-white/12 bg-black/38 px-2 py-1 shadow-[0_10px_22px_rgba(251,191,36,0.12)]">
                  <img
                    src={ULTIMATE_DRAFT_LOGO_SRC}
                    alt="NBA Ultimate Draft"
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
                <span className="text-[9px] uppercase tracking-[0.18em] text-slate-200">Home</span>
              </button>

              <div data-tutorial-id="draft-progress" className="min-w-0">
                <ProgressHeader pickNumber={state.pickNumber} bonusPickActive={state.bonusPickActive} />
              </div>

              <div className="glass-panel min-w-0 rounded-[24px] p-4 shadow-card lg:rounded-[28px]">
                <div className="flex h-full min-w-0 flex-col justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                        Legends Draft
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Pick Window</span>
                      </div>
                    <h2 className="mt-2 font-display text-[clamp(1.2rem,5vw,2.3rem)] leading-tight text-white">
                      {state.bonusPickActive ? "Choose 1 bonus player" : "Choose 1 of 5"}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] uppercase tracking-[0.12em] text-slate-300">
                      <span className="rounded-full border border-amber-200/18 bg-amber-300/10 px-3 py-2 text-amber-100">
                        Challenge: {state.currentChallenge.title}
                      </span>
                      <span className={state.rareEventsEnabled
                        ? "rounded-full border border-sky-200/18 bg-sky-300/10 px-3 py-2 text-sky-100"
                        : "rounded-full border border-white/12 bg-white/8 px-3 py-2 text-slate-300"}>
                        Event: {state.currentRareEvent.title}
                      </span>
                      {state.categoryChallengesEnabled && state.currentCategoryChallenge ? (
                        <span className="rounded-full border border-emerald-200/18 bg-emerald-300/10 px-3 py-2 text-emerald-100">
                          Focus: {state.currentCategoryChallenge.metricLabel}
                        </span>
                      ) : null}
                      {state.bonusPickActive ? (
                        <span className="rounded-full border border-fuchsia-200/18 bg-fuchsia-300/10 px-3 py-2 text-fuchsia-100">
                          Prestige Reward: Extra Pick
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-xs sm:leading-5">
                      {state.bonusPickActive
                        ? state.selectedSlotIndex === null
                          ? "Select one current roster slot from the lineup board, then choose a bonus player to replace it."
                          : "Choose one of the 5 bonus players to replace the highlighted roster slot."
                        : "Build the strongest 10-player roster you can before heading to lineup re-order."}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-tutorial-id="draft-simulate-action"
                    onClick={state.bonusPickActive ? skipBonusPick : beginSimulation}
                    disabled={state.bonusPickActive ? false : !completedRoster}
                    className="self-stretch rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-slate-400 sm:self-start sm:px-4 sm:py-2 sm:text-xs"
                  >
                    {state.bonusPickActive ? "Skip Extra Pick" : "Simulate Season"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-5">
                {isNarrowViewport ? (
                  <div data-tutorial-id="draft-choice-board" className="grid grid-cols-5 gap-1.5">
                    {state.currentChoices.map((player, index) => {
                      const revealed = index < visibleChoiceCount;

                      return (
                        <div
                          key={player.id}
                          className="choice-slot"
                          style={{ animationDelay: `${index * 220}ms` }}
                        >
                          <div className={`choice-flip-card ${revealed ? "is-revealed" : ""}`}>
                            <div className="choice-face choice-face-back">
                              <div className="choice-card-back h-full rounded-[18px] border border-white/10">
                                <div className="choice-card-back__inner choice-card-back__inner--logo">
                                  <img
                                    src={ULTIMATE_DRAFT_LOGO_SRC}
                                    alt="NBA Ultimate Draft"
                                    className="choice-card-back__logo"
                                    draggable={false}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="choice-face choice-face-front">
                              <DraftPlayerCard
                                player={player}
                                onSelect={draftPlayer}
                                disabled={Boolean(state.selectedPlayerId) || (state.bonusPickActive && state.selectedSlotIndex === null)}
                                selected={state.selectedPlayerId === player.id}
                                draftedPlayerIds={state.draftedPlayerIds}
                                compact
                                compactScale={0.42}
                                fitToContainer
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div data-tutorial-id="draft-run-intel" className="glass-panel rounded-[20px] p-3 shadow-card">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Run Intel</div>
                    <div className="text-[11px] text-slate-500">Quick modifiers</div>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-3">
                    {draftIntel.map((item) => (
                      <div key={item.id} className={item.wrapperClass}>
                        <div className="flex items-start gap-3">
                          <div className={item.iconClass}>
                            <item.icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                              {item.label}
                            </div>
                            <h4 className="mt-0.5 font-display text-base text-white">{item.title}</h4>
                            <p className={`mt-1 text-[11px] leading-4 ${item.summaryClass}`}>{item.summary}</p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-300">{item.strategy}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-1">
                  <p className="text-center text-xs font-medium tracking-[0.14em] text-white/90">
                    {state.bonusPickActive ? "Choose 1 of 5 Bonus Players" : "Choose 1 of 5 Players"}
                  </p>
                </div>

                <div data-tutorial-id="draft-choice-board" className={`grid gap-1.5 sm:gap-3 ${isNarrowViewport ? "hidden" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-5"}`}>
                  {state.currentChoices.map((player, index) => {
                    const revealed = index < visibleChoiceCount;

                    return (
                      <div
                        key={player.id}
                        className="choice-slot"
                        style={{ animationDelay: `${index * 220}ms` }}
                      >
                        <div className={`choice-flip-card ${revealed ? "is-revealed" : ""}`}>
                          <div className="choice-face choice-face-back">
                            <div className="choice-card-back h-full min-h-[1040px] rounded-[26px] border border-white/10">
                              <div className="choice-card-back__inner choice-card-back__inner--logo">
                                <img
                                  src={ULTIMATE_DRAFT_LOGO_SRC}
                                  alt="NBA Ultimate Draft"
                                  className="choice-card-back__logo"
                                  draggable={false}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="choice-face choice-face-front">
                            <DraftPlayerCard
                              player={player}
                              onSelect={draftPlayer}
                              disabled={Boolean(state.selectedPlayerId) || (state.bonusPickActive && state.selectedSlotIndex === null)}
                              selected={state.selectedPlayerId === player.id}
                              draftedPlayerIds={state.draftedPlayerIds}
                              compact={isNarrowViewport}
                              compactScale={0.42}
                              fitToContainer={isNarrowViewport}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div data-tutorial-id="draft-roster-sidebar">
                  <RosterSidebar
                    roster={state.roster}
                    teamAverage={teamAverage}
                    draftChemistry={draftChemistry}
                    lastFilledSlot={state.lastFilledSlot}
                    selectedSlotIndex={state.selectedSlotIndex}
                    bonusPickActive={state.bonusPickActive}
                    onSlotClick={handleRosterSlotClick}
                  />
                </div>
                <div className="glass-panel rounded-[24px] p-4 shadow-card sm:p-5 sm:rounded-[28px]">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Team Snapshot</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Drafted Players</div>
                      <div className="mt-2 text-2xl font-semibold text-white">{state.draftedPlayerIds.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Best Path</div>
                      <div className="mt-2 text-sm leading-6 text-slate-200">
                        Build around creation, spacing, and at least one real interior defender.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Run Reset</div>
                      <button onClick={resetDraft} className="mt-2 text-sm font-medium text-rose-200 transition hover:text-white">
                        Start new draft
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {showExtraPickIntro && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/78 px-4 backdrop-blur-sm">
                <div className="w-full max-w-2xl rounded-[28px] border border-fuchsia-200/22 bg-[linear-gradient(135deg,rgba(36,16,54,0.98),rgba(15,23,42,0.98),rgba(28,18,52,0.96))] p-5 shadow-[0_0_0_1px_rgba(216,180,254,0.06),0_0_42px_rgba(192,132,252,0.24)] sm:rounded-[32px] sm:p-7 lg:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="rounded-[22px] border border-fuchsia-200/22 bg-fuchsia-300/14 p-3 text-fuchsia-100">
                      <Crown size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.28em] text-fuchsia-100/78">
                        Extra Pick
                      </div>
                      <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl lg:text-5xl">
                        Bonus Board Unlocked
                      </h2>
                      <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base sm:leading-8">
                        You can replace one player on your roster with one of these 5 extra-pick options, or skip the pick and keep your team exactly as it is.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-black/22 p-5">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                        <Target size={14} className="text-sky-200" />
                        How It Works
                      </div>
                      <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                        <p>1. Select one roster player to replace on the lineup board.</p>
                        <p>2. Choose one of the 5 extra-pick players.</p>
                        <p>3. If none help your team, skip the pick.</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-emerald-200/18 bg-emerald-300/10 p-5">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-emerald-100/80">
                        <Sparkles size={14} />
                        Best Use
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-100">
                        This is a great chance to upgrade your weakest roster spot or complete a synergy badge you already have in play.
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExtraPickIntro(false);
                        skipBonusPick();
                      }}
                      className="rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Skip Pick
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExtraPickIntro(false)}
                      className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100"
                    >
                      Choose Player To Replace
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {!roguelikeOpen && state.screen === "lineup" && (
          <LineupReorderScreen
            roster={state.roster}
            onMovePlayer={moveRosterPlayer}
            onSimulate={beginSimulation}
            onHome={resetDraft}
          />
        )}

        {!roguelikeOpen && state.screen === "simulating" && <SimulationScreen />}

        {!roguelikeOpen && state.screen === "results" && state.simulationResult && (
          <ResultsShowcase
            result={state.simulationResult}
            roster={state.roster}
            onDraftAgain={startDraft}
            onBackToHome={resetDraft}
            onBackToChallenges={() => {
              setPrestigeInitialView("overview");
              setPrestigeOpen(true);
            }}
            meta={metaProgress}
            history={state.history}
          />
        )}
      </div>

      {prestigeOpen && (
        <PrestigeOverlay
          meta={metaProgress}
          history={state.history}
          initialView={prestigeInitialView}
          onClose={() => setPrestigeOpen(false)}
        />
      )}

      {collectionOpen && (
        <CollectionOverlay
          ownedPlayerIds={ownedCollectionPlayerIds}
          onClose={() => setCollectionOpen(false)}
        />
      )}

      {tokenStoreOpen && (
        <TokenStoreOverlay
          meta={metaProgress}
          ownedTrainingCampTickets={state.ownedTrainingCampTickets}
          ownedTradePhones={state.ownedTradePhones}
          ownedSilverStarterPacks={state.ownedSilverStarterPacks}
          ownedGoldStarterPacks={state.ownedGoldStarterPacks}
          ownedPlatinumStarterPacks={state.ownedPlatinumStarterPacks}
          ownedCoachRecruitment={state.ownedCoachRecruitment}
          ownedOpeningLockerCashTier={state.ownedOpeningLockerCashTier}
          ownedExtraDraftShuffle={state.ownedExtraDraftShuffle}
          ownedStarterPackChoicePlus={state.ownedStarterPackChoicePlus}
          ownedRogueStarIds={state.ownedRogueStarIds}
          ownedCollectionPlayerIds={state.ownedCollectionPlayerIds}
          activeRogueStarId={state.activeRogueStarId}
          rogueCollectedCollectionEntryIds={state.rogueCollectedCollectionEntryIds}
          claimedCollectionRewardIds={state.claimedCollectionRewardIds}
          initialView={tokenStoreInitialView}
          onBuyTrainingCampTicket={() => purchaseTrainingCampTicket(getTokenStoreUtilityPrice("training-camp-ticket"))}
          onBuyTradePhone={() => purchaseTradePhone(getTokenStoreUtilityPrice("trade-phone"))}
          onBuySilverStarterPack={() => purchaseSilverStarterPack(getTokenStoreUtilityPrice("silver-starter-pack"))}
          onBuyGoldStarterPack={() => purchaseGoldStarterPack(getTokenStoreUtilityPrice("gold-starter-pack"))}
          onBuyPlatinumStarterPack={() => purchasePlatinumStarterPack(getTokenStoreUtilityPrice("platinum-starter-pack"))}
          onBuyCoachRecruitment={() => purchaseCoachRecruitment(getTokenStoreUtilityPrice("coach-recruitment"))}
          onBuyOpeningLockerCashUpgrade={(tier, price) => purchaseOpeningLockerCashUpgrade(price, tier)}
          onBuyExtraDraftShuffle={() => purchaseExtraDraftShuffle(getTokenStoreUtilityPrice("extra-draft-shuffle"))}
          onBuyStarterPackChoicePlus={() => purchaseStarterPackChoicePlus(getTokenStoreUtilityPrice("starter-pack-choice-plus"))}
          onBuyRogueStar={purchaseRogueStar}
          onBuyRoguePack={purchaseRoguePack}
          onEnsureRoguePackPullOwned={ensureRoguePackPullOwned}
          onSetActiveRogueStar={setActiveRogueStar}
          onClaimCollectionReward={claimCollectionReward}
          onClose={() => setTokenStoreOpen(false)}
        />
      )}

      {challengesOpen && (
        <RogueChallengesOverlay
          meta={metaProgress}
          completedRogueChallengeIds={state.completedRogueChallengeIds}
          claimedRogueChallengeIds={state.claimedRogueChallengeIds}
          onClaimRogueChallengeReward={claimRogueChallengeReward}
          onRunRogueChallenge={runRogueChallenge}
          onClose={() => setChallengesOpen(false)}
        />
      )}

      {learnOpen && <LearnOverlay onClose={() => setLearnOpen(false)} />}

      {showPrestigeLevelUp && state.simulationResult?.prestigeLevelUp && (
        <PrestigeLevelUpModal
          levelUp={state.simulationResult.prestigeLevelUp}
          onClose={() => setShowPrestigeLevelUp(false)}
        />
      )}

      {!tutorialOpen && !auth.loading && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              data-tutorial-id="screen-guide-button"
              onClick={openContextTutorial}
              className="fixed grid h-12 w-12 place-items-center rounded-full border-2 border-yellow-100 bg-[#f5b82e] text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.5),0_0_0_4px_rgba(48,28,4,1),0_0_26px_rgba(245,184,46,0.7),0_0_54px_rgba(245,158,11,0.34)] transition hover:scale-[1.05] hover:bg-[#ffd76a] hover:shadow-[0_20px_48px_rgba(0,0,0,0.52),0_0_0_4px_rgba(48,28,4,1),0_0_34px_rgba(251,191,36,0.86),0_0_72px_rgba(245,158,11,0.46)] focus:outline-none focus:ring-2 focus:ring-yellow-100 sm:h-[52px] sm:w-[52px]"
              style={{
                bottom: "max(28px, calc(env(safe-area-inset-bottom, 0px) + 18px))",
                right: "max(22px, calc(env(safe-area-inset-right, 0px) + 18px))",
                zIndex: 2147483647,
              }}
              aria-label="Open screen guide"
              title="Open screen guide"
            >
              <Info size={20} />
              <span className="sr-only">Open screen guide</span>
            </button>,
            document.body,
          )
        : null}

      {tutorialOpen && !auth.loading && activeTutorialSteps.length > 0 ? (
        <GuidedTutorialOverlay
          steps={activeTutorialSteps}
          activeStepIndex={tutorialStepIndex}
          onNext={() => setTutorialStepIndex((index) => Math.min(activeTutorialSteps.length - 1, index + 1))}
          onBack={() => setTutorialStepIndex((index) => Math.max(0, index - 1))}
          onSkip={closeActiveTutorial}
          onFinish={closeActiveTutorial}
        />
      ) : null}
    </div>
  );
}

export default App;
