export type Direction = "n" | "f" | "b" | "u" | "d" | "df" | "db" | "uf" | "ub";
export type CharacterId = "kazuya" | "reina";
export type AttackButton = "1" | "2" | "3" | "4";
export type MoveCategory = "Core" | "Punish" | "Crouch dash" | "Launch" | "Heat" | "Defense";
export type Difficulty = "Starter" | "Intermediate" | "Advanced" | "Just frame";
export type HitLevel = "High" | "Mid" | "Low" | "Throw" | "Special" | "Mixed";
export type CombatState = "neutral" | "heat" | "rage";

export interface CommandStep {
  /** Omitted for string follow-ups, where the held direction does not matter. */
  direction?: Direction;
  buttons?: AttackButton[];
  label: string;
  /** Tekken's ':' notation: the direction and attack must land on the same frame. */
  justFrame?: boolean;
  /** The target is specifically the non-just-frame version of the command. */
  rejectSameFrame?: boolean;
  /** Maximum time after the previous command for the documented string window. */
  maxGapFrames?: number;
}

export interface FrameData {
  startup: string;
  onBlock: string;
  onHit: string;
  onCounter?: string;
  damage: string;
  hitLevel: HitLevel;
}

export type FighterAnimation =
  | "electric"
  | "punch"
  | "kick"
  | "low"
  | "dash"
  | "heat"
  | "throw";

export interface MoveDefinition {
  id: string;
  characterId: CharacterId;
  name: string;
  notation: string;
  category: MoveCategory;
  difficulty: Difficulty;
  steps: CommandStep[];
  frames: FrameData;
  tags: string[];
  summary: string;
  coach: string;
  notes?: string;
  animation: FighterAnimation;
  sourcePath?: string;
  internal?: boolean;
  state?: CombatState;
}

export interface ComboRouteStep {
  label: string;
  notation: string;
  /** Links the route fragment to the direct-input trainer when that fragment is independently detectable. */
  moveId?: string;
  cue?: string;
}

export interface ComboDefinition {
  id: string;
  rank: number;
  name: string;
  notation: string;
  starter: string;
  damage: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  context: string;
  summary: string;
  steps: ComboRouteStep[];
  sourceUrl: string;
  sourceVersion: string;
}

export interface BeginnerApproach {
  id: string;
  rank: number;
  name: string;
  moveId: string;
  goal: string;
  why: string;
  checkpoint: string;
}

export interface InputToken {
  id: number;
  direction: Direction;
  buttons: AttackButton[];
  at: number;
  frame: number;
  /** Milliseconds between the last direction transition and the attack press. */
  simultaneousMs?: number;
  /** Milliseconds between the first and last attack button in a chord. */
  chordSpreadMs?: number;
}

export interface Evaluation {
  status: "ready" | "progress" | "success" | "miss";
  progress: number;
  total: number;
  reason: string;
  /** Measured time from the command's first input to its final input. */
  executionFrames?: number;
  precisionFrames?: number;
}

export interface LabStats {
  attempts: number;
  successes: number;
  streak: number;
  bestStreak: number;
  moveSuccesses: Record<string, number>;
}
