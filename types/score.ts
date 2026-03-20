export interface WorkoutScore {
  total: number;           // 0–100
  volumeScore: number;     // 0–100
  intensityScore: number;  // 0–100
  coverageScore: number;   // 0–100
  durationScore: number;   // 0–100
  rpeScore: number | null; // 0–100, null if no RPE given
  percentileBetter: number; // 0–100, better than X% of own sessions
  weakPoints: WeakPoint[];
  tips: string[];
}

export interface WeakPoint {
  muscle: string;           // e.g. "Trizeps"
  subMuscle?: string;       // e.g. "Long Head"
  message: string;          // e.g. "Trizeps Long Head nicht trainiert"
  suggestedExercise?: string; // e.g. "Overhead Tricep Extension"
}

export interface MuscleSubGroup {
  muscle: string;      // primary muscle ID e.g. "triceps"
  subGroup: string;    // e.g. "long-head"
  labelDE: string;     // e.g. "Langer Kopf"
  trainedBy: string[]; // exercise IDs that train this sub-group
}
