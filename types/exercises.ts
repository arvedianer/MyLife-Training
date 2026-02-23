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
  | 'forearms';

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
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number; // kg, 0 = bodyweight
  // Science-based training data
  repRange: { min: number; max: number };  // Target rep range for this exercise
  restSeconds: number;                      // Recommended rest between sets (seconds)
  scienceNote: string;                      // Form cue + evidence-based rationale
}
