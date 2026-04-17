export type Position = "PG" | "SG" | "SF" | "PF" | "C";

export type RosterSlotType =
  | "PG"
  | "SG"
  | "SF"
  | "PF"
  | "C"
  | "G"
  | "G/F"
  | "F/C"
  | "UTIL"
  | "UTIL";

export type PlayerTier = "S" | "A" | "B" | "C";

export type Screen = "landing" | "briefing" | "draft" | "lineup" | "simulating" | "results";
export type SimulationMode = "season" | "category-focus";

export interface DraftChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
}

export interface RareEvent {
  id: string;
  title: string;
  description: string;
  impact: string;
}

export interface CategoryChallenge {
  id: string;
  title: string;
  description: string;
  metric: keyof TeamMetrics;
  metricLabel: string;
}

export type DraftChallengeSelection =
  | "none"
  | "random"
  | DraftChallenge["id"];

export type RareEventSelection =
  | "disabled"
  | "random"
  | RareEvent["id"];

export type CategoryChallengeSelection =
  | "disabled"
  | "random"
  | CategoryChallenge["id"];

export interface ChemistryBonus {
  id: string;
  title: string;
  players: string[];
  summary: string;
  bonusScore: number;
}

export interface Player {
  id: string;
  name: string;
  era: string;
  teamLabel: string;
  primaryPosition: Position;
  secondaryPositions: Position[];
  overall: number;
  offense: number;
  defense: number;
  playmaking: number;
  shooting: number;
  rebounding: number;
  athleticism: number;
  intangibles: number;
  durability: number;
  archetype: string;
  hallOfFameTier: PlayerTier;
  shortDescription: string;
  badges: string[];
  ballDominance: number;
  interiorDefense: number;
  perimeterDefense: number;
}

export interface RosterSlot {
  slot: RosterSlotType;
  label: string;
  allowedPositions: Position[];
  player: Player | null;
}

export interface TeamMetrics {
  overall: number;
  offense: number;
  defense: number;
  playmaking: number;
  shooting: number;
  rebounding: number;
  athleticism: number;
  depth: number;
  starPower: number;
  chemistry: number;
  variance: number;
  spacing: number;
  rimProtection: number;
  wingDefense: number;
  benchScoring: number;
}

export interface DraftChemistrySnapshot {
  score: number;
  draftedCount: number;
  naturalSlotMatches: number;
  activeBadgeCount: number;
  badgeBonus: number;
  slotFitRate: number;
}

export interface TeamStrengths {
  strengths: string[];
  weaknesses: string[];
  reason: string;
  mvp: Player;
  xFactor: Player;
}

export interface LeagueContenderProfile {
  teamName: string;
  seed: number;
  conference: "East" | "West";
  projectedWins: number;
  power: number;
  style: string;
  summary: string;
  stars: Player[];
  isUserTeam?: boolean;
}

export interface OpponentStory {
  teamName: string;
  seed: number;
  conference: "East" | "West";
  projectedWins: number;
  power: number;
  style: string;
  summary: string;
  stars: Player[];
  matchupReason: string;
}

export interface BracketMatchup {
  id: string;
  round: string;
  home: LeagueContenderProfile;
  away: LeagueContenderProfile;
  winnerTeamName: string;
}

export interface ConferenceBracket {
  teams: LeagueContenderProfile[];
  quarterfinals: BracketMatchup[];
  semifinals: BracketMatchup[];
  conferenceFinal: BracketMatchup | null;
  champion: LeagueContenderProfile | null;
}

export interface PlayoffBracket {
  east: ConferenceBracket;
  west: ConferenceBracket;
  finals: BracketMatchup | null;
  champion: LeagueContenderProfile | null;
}

export interface SimulationResult {
  mode: SimulationMode;
  prestigeChallengeId?: string | null;
  prestigeChallengeTitle?: string | null;
  prestigeChallengeGoal?: string | null;
  prestigeChallengeCleared?: boolean;
  prestigeChallengeSource?: "loaded" | "surprise" | null;
  prestigeChallengeNewlyCleared?: boolean;
  prestigeChallengeReward?: number;
  prestigeXpAward?: number;
  tokenReward?: number;
  prestigeLevelUp?: PrestigeLevelUpEvent | null;
  metrics: TeamMetrics;
  categoryChallenge: CategoryChallenge | null;
  focusScore: number | null;
  record: {
    wins: number;
    losses: number;
  };
  seed: number;
  conference: "East" | "West";
  playoffFinish:
    | "Missed Playoffs"
    | "Lost in Play-In"
    | "First Round Exit"
    | "Conference Semifinals"
    | "Conference Finals"
    | "NBA Finals Loss"
    | "NBA Champion";
  titleOdds: number;
  summary: string;
  reason: string;
  mvp: Player;
  xFactor: Player;
  strengths: string[];
  weaknesses: string[];
  ratingLabel: string;
  offenseLabel: string;
  defenseLabel: string;
  draftGrade: string;
  teamName: string;
  legacyScore: number;
  challenge: DraftChallenge;
  challengeCompleted: boolean;
  challengeReward: number;
  rareEvent: RareEvent;
  rareEventBonus: {
    offense: number;
    defense: number;
    chemistryStructure: number;
    chemistry: number;
    summary: string;
  };
  chemistryBonuses: ChemistryBonus[];
  chemistryScore: number;
  leagueContext: string;
  leagueLandscape: LeagueContenderProfile[];
  playoffBracket: PlayoffBracket | null;
  eliminatedBy: OpponentStory | null;
  signatureWin: OpponentStory | null;
  newPersonalBests?: string[];
}

export interface RunHistoryEntry {
  id: string;
  mode: SimulationMode;
  teamName: string;
  rosterPlayerIds: string[];
  record: string;
  wins: number;
  losses: number;
  seed: number;
  conference: "East" | "West";
  playoffFinish: SimulationResult["playoffFinish"];
  grade: string;
  legacyScore: number;
  createdAt: string;
  createdAtStamp: number;
  challengeId?: string | null;
  challengeTitle: string;
  challengeCompleted: boolean;
  rareEventId?: string | null;
  rareEventTitle: string;
  categoryFocusId?: string | null;
  categoryFocusTitle?: string | null;
  prestigeChallengeId?: string | null;
  prestigeChallengeTitle?: string | null;
  prestigeChallengeGoal?: string | null;
  prestigeChallengeCleared?: boolean;
  prestigeChallengeSource?: "loaded" | "surprise" | null;
  prestigeChallengeReward?: number | null;
  prestigeXpAward?: number | null;
  tokenReward?: number | null;
  focusScore?: number | null;
  titleOdds: number;
  metrics: TeamMetrics;
}

export interface PrestigeChallengeDefinition {
  id: string;
  order: number;
  title: string;
  description: string;
  goal: string;
  reward: number;
  difficulty: "rookie" | "role-player" | "starter" | "all-star" | "superstar" | "goat";
  draftChallengeId: string;
  rareEventId: string;
  categoryChallengeId: string | null;
}

export interface PrestigeRewardDefinition {
  id: string;
  level: number;
  title: string;
  description: string;
}

export interface PrestigeLevelUpEvent {
  previousLevel: number;
  newLevel: number;
  previousScore: number;
  newScore: number;
  unlockedRewards: PrestigeRewardDefinition[];
}

export interface PersonalBests {
  wins: number;
  overall: number;
  offense: number;
  defense: number;
  playmaking: number;
  shooting: number;
  rebounding: number;
  depth: number;
  chemistry: number;
  starPower: number;
  spacing: number;
  rimProtection: number;
  legacyScore: number;
  titleOdds: number;
  playoffFinish: SimulationResult["playoffFinish"];
}

export interface RoguePersonalBests {
  furthestFloor: number;
  overall: number;
  offense: number;
  defense: number;
  chemistry: number;
}

export interface LeaderboardEntry {
  label: string;
  value: string;
  teamName: string;
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface Streaks {
  playoff: number;
  titles: number;
  fiftyWin: number;
}

export interface CollectionGoals {
  draftedPlayers: number;
  totalPlayers: number;
  percentage: number;
  milestones: Array<{
    label: string;
    reached: boolean;
  }>;
}

export interface PrestigeProgress {
  score: number;
  level: number;
  title: string;
  progressToNextLevel: number;
  nextLevelScore: number;
  currentLevelFloor: number;
  completedChallengeRoutes: number;
  totalChallengeRoutes: number;
  breakdown: Array<{
    label: string;
    value: number;
    description: string;
  }>;
}

export interface TokenProgress {
  balance: number;
  lifetimeEarned: number;
}

export interface MetaProgress {
  prestige: PrestigeProgress;
  tokens: TokenProgress;
  personalBests: PersonalBests;
  roguePersonalBests: RoguePersonalBests;
  leaderboards: LeaderboardEntry[];
  trophies: Trophy[];
  streaks: Streaks;
  collection: CollectionGoals;
}

export interface DraftState {
  screen: Screen;
  roster: RosterSlot[];
  currentChoices: Player[];
  availablePlayers: Player[];
  draftedPlayerIds: string[];
  pickNumber: number;
  selectedPlayerId: string | null;
  lastFilledSlot: RosterSlotType | null;
  simulationResult: SimulationResult | null;
  selectedSlotIndex: number | null;
  history: RunHistoryEntry[];
  unlockedPlayerIds: string[];
  draftChallengeSelection: DraftChallengeSelection;
  currentChallenge: DraftChallenge;
  rareEventSelection: RareEventSelection;
  currentRareEvent: RareEvent;
  rareEventsEnabled: boolean;
  categoryChallengesEnabled: boolean;
  categoryChallengeSelection: CategoryChallengeSelection;
  currentCategoryChallenge: CategoryChallenge | null;
  activePrestigeChallengeId: string | null;
  activePrestigeChallengeTitle: string | null;
  activePrestigeChallengeGoal: string | null;
  activePrestigeChallengeReward: number;
  bonusPickAvailable: boolean;
  bonusPickUsed: boolean;
  bonusPickActive: boolean;
  rogueBonusPrestigeXp: number;
  roguePersonalBests: RoguePersonalBests;
  spentTokens: number;
  ownedTrainingCampTickets: number;
  ownedTradePhones: number;
  ownedSilverStarterPacks: number;
  ownedGoldStarterPacks: number;
  ownedPlatinumStarterPacks: number;
  ownedRogueStarIds: string[];
  activeRogueStarId: string | null;
  seed: number;
}
