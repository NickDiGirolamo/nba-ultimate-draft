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
  history: Array<{
    id: string;
    teamName: string;
    record: string;
    playoffFinish: SimulationResult["playoffFinish"];
    grade: string;
    createdAt: string;
  }>;
  seed: number;
}
