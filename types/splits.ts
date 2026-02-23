import type { MuscleGroup } from './exercises';

export type SplitType =
  | 'ppl'           // Push/Pull/Legs
  | 'arnold'        // Arnold Split
  | 'upper-lower'   // Upper/Lower
  | 'full-body'     // Full Body
  | 'bro-split'     // Bro Split
  | 'phul'          // Power Hypertrophy Upper Lower
  | 'custom';       // User-defined

export interface SplitDay {
  id: string;
  name: string;         // z.B. "Push", "Beine", "Oberkörper"
  muscleGroups: MuscleGroup[];
  exerciseIds: string[]; // planned exercise IDs
  restDay: boolean;
}

export interface TrainingSplit {
  id: string;
  name: string;
  type: SplitType;
  description: string;
  days: SplitDay[];
  daysPerWeek: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
  createdAt: number;
}
