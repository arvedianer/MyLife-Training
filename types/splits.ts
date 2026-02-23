import type { MuscleGroup } from './exercises';

export type SplitType =
  | 'ppl'           // Push/Pull/Legs
  | 'arnold'        // Arnold Split
  | 'upper-lower'   // Upper/Lower
  | 'full-body'     // Full Body
  | 'bro-split'     // Bro Split
  | 'phul'          // Power Hypertrophy Upper Lower
  | 'custom';       // User-defined

export type RepScheme = 'strength' | 'hypertrophy' | 'endurance';

export interface SplitDay {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  exerciseIds: string[];
  restDay: boolean;
  repScheme: RepScheme;       // Training focus for this day
  scienceNote?: string;       // Why this day is structured this way
}

export interface TrainingSplit {
  id: string;
  name: string;
  type: SplitType;
  description: string;
  scienceNote: string;        // Evidence-based rationale for this split
  days: SplitDay[];
  daysPerWeek: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  createdAt: number;
}
