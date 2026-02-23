import type { Exercise } from './exercises';

export interface SetEntry {
  id: string;
  weight: number;   // kg
  reps: number;
  isCompleted: boolean;
  isPR: boolean;
  rpe?: number;     // 1-10, optional
  note?: string;
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: SetEntry[];
  note?: string;
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
}

export type WorkoutGoal =
  | 'muskelaufbau'
  | 'kraft'
  | 'abnehmen'
  | 'fitness'
  | 'ausdauer';

export type TrainingLevel = 'anfaenger' | 'fortgeschritten' | 'profi';

export type TrainingDays = 2 | 3 | 4 | 5 | 6;

export type EquipmentType =
  | 'vollausgestattet'
  | 'kurzhanteln'
  | 'eigengewicht'
  | 'minimalistisch';
