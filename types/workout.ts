import type { Exercise } from './exercises';
import type { WorkoutScore } from './score';

export type ExerciseEquipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'other';

export interface SetEntry {
  id: string;
  weight: number;   // kg or km for cardio
  reps: number;     // reps or minutes for cardio
  isCompleted: boolean;
  isPR: boolean;
  type?: 'normal' | 'warmup' | 'dropset' | 'superset' | 'fail';
  side?: 'both' | 'left' | 'right';
  rpe?: number;     // 1-10, optional
  note?: string;
  variationKey?: string;
  repsL?: number;   // unilateral: left side reps
  repsR?: number;   // unilateral: right side reps
  weightL?: number; // unilateral left side weight
  weightR?: number; // unilateral right side weight
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: SetEntry[];
  isUnilateral: boolean;
  unilateralSync: boolean; // if true, weight/reps are kept in sync between L/R
  restSecondsCustom?: number;
  note?: string;
  equipment?: ExerciseEquipment;
  gymId?: string;
  warmupSetsCount?: number;
  warmupEnabled?: boolean;
}

export interface PRRecord {
  variationKey: string;    // "{exerciseId}::{equipment}::{gymId}"
  weight: number;
  reps: number;
  estimated1RM: number;    // Epley: weight * (1 + reps/30)
  date: string;
  sessionId: string;
}

export interface ActiveWorkout {
  id: string;
  startedAt: number;       // Unix timestamp (ms)
  exercises: WorkoutExercise[];
  timerActive: boolean;
  timerSeconds: number;    // current rest timer countdown
  plannedSplit?: string;   // split name if started from plan
}

export interface WorkoutSession {
  id: string;
  date: string;            // ISO date string
  startedAt: number;
  finishedAt: number;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolume: number;     // kg total (weight × reps sum)
  totalSets: number;
  newPRs: string[];        // exercise IDs with new PRs
  splitName?: string;
  note?: string;
  score?: WorkoutScore;
  rpe?: number;
  shareToken?: string;
}

export type WorkoutGoal =
  | 'muskelaufbau'
  | 'kraft'
  | 'abnehmen'
  | 'fitness'
  | 'ausdauer'
  | 'alles';

export type TrainingLevel = 'anfaenger' | 'fortgeschritten' | 'profi' | 'experte';

export type TrainingDays = 2 | 3 | 4 | 5 | 6;

export type EquipmentType =
  | 'vollausgestattet'
  | 'kurzhanteln'
  | 'eigengewicht'
  | 'minimalistisch';
