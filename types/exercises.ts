export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'calves'
  | 'forearms'
  | 'cardio';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'smith';

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  nameDE: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  category: ExerciseCategory;
  instructions?: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number; // kg, 0 = bodyweight
}
