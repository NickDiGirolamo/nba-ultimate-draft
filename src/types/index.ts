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

export type Screen = "landing" | "draft" | "simulating" | "results";

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
  fit: number;
  chemistry: number;
  variance: number;
  spacing: number;
  rimProtection: number;
  wingDefense: number;
  benchScoring: number;
}

export interface TeamStrengths {
  strengths: string[];
  weaknesses: string[];
  reason: string;
  mvp: Player;
  xFactor: Player;
}

export interface SimulationResult {
  metrics: TeamMetrics;
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
    fit: number;
    chemistry: number;
    summary: string;
  };
  chemistryBonuses: ChemistryBonus[];
  chemistryScore: number;
  newPersonalBests?: string[];
}

export interface RunHistoryEntry {
  id: string;
  teamName: string;
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
  challengeTitle: string;
  challengeCompleted: boolean;
  rareEventTitle: string;
  titleOdds: number;
  metrics: TeamMetrics;
}

export interface PersonalBests {
  wins: number;
  overall: number;
  offense: number;
  defense: number;
  fit: number;
  depth: number;
  legacyScore: number;
  titleOdds: number;
  playoffFinish: SimulationResult["playoffFinish"];
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

export interface MetaProgress {
  personalBests: PersonalBests;
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
  currentChallenge: DraftChallenge;
  currentRareEvent: RareEvent;
  seed: number;
}
