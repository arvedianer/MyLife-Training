export interface WorkoutScore {
  total: number;           // 0-100 final weighted score
  volume: number;          // 0-100: session volume vs personal average
  completionRate: number;  // 0-100: completed sets / planned sets
  intensity: number;       // 0-100: avg weight vs last 4 sessions
  label: string;           // "Stark 💪" | "Gut" | "Ok" | "Leicht"
  // Legacy fields kept optional so stored sessions & PDF export don't crash
  tips?: string[];
  percentileBetter?: number;
}

export interface WeakPoint {
  muscle: string;             // e.g. "Trizeps"
  subMuscle?: string;         // e.g. "Long Head"
  message: string;            // e.g. "Trizeps Long Head nicht trainiert"
  suggestedExercise?: string; // e.g. "Overhead Tricep Extension"
}

export interface MuscleSubGroup {
  muscle: string;      // primary muscle ID e.g. "triceps"
  subGroup: string;    // e.g. "long-head"
  labelDE: string;     // e.g. "Langer Kopf"
  trainedBy: string[]; // exercise IDs that train this sub-group
}
