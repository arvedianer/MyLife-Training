export interface WorkoutScore {
  total: number;            // 0-100 final score
  label: string;            // "Exzellent" | "Stark" | "Gut" | "Ok" | "Mäßig" | "Schwach"
  completionRate: number;   // 0-100: completed sets / planned sets (percentage)
  volumeScore: number;      // 0-35: this session volume vs personal average
  intensityScore: number;   // 0-20: avg weight vs personal average
  consistencyBonus: number; // 0-10: bonus for training multiple muscle groups
  explanation: string;      // short German text explaining the score
  // Legacy fields kept optional for PDF export and stored sessions
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
