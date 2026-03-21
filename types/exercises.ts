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
  | 'smith'
  | 'cardio_machine';

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio' | 'functional' | 'stretching';

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
  isPublic?: boolean;
  createdBy?: string;
  isCardio?: boolean;  // If true: track km + duration instead of weight/reps
  popularity?: number;      // 1–100 (based on real-world usage data)
  variationOf?: string;     // parent exercise ID (e.g. 'bench-press')
  variationLabel?: string;  // e.g. 'Kurzhantel', 'Kabel', 'Maschine'
  tags?: string[];          // e.g. ['compound', 'beginner-friendly', 'home']
}
