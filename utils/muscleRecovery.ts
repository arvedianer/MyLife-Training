import { differenceInHours, parseISO } from 'date-fns';
import type { WorkoutSession } from '@/types/workout';
import { MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';

export type RecoveryStatus = 'recovered' | 'recovering' | 'fatigued';

export interface MuscleRecovery {
  muscle: string;
  label: string;
  status: RecoveryStatus;
  hoursAgo: number;
  recoveryRatio: number;   // 0.0 = just trained · 1.0 = fully recovered (clamped, never exceeds 1.0)
}

const HEAVY_MUSCLES = new Set(['chest', 'back', 'quads', 'glutes', 'hamstrings', 'legs']);
const MAJOR_MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'core', 'legs'];

export function computeMuscleRecovery(sessions: WorkoutSession[], now: Date = new Date()): MuscleRecovery[] {
  const lastTrained = new Map<string, string>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const muscle = ex.exercise?.primaryMuscle ?? (ex as unknown as Record<string, unknown>).primaryMuscle as string | undefined;
      if (!muscle || muscle === 'cardio') continue;
      const existing = lastTrained.get(muscle);
      if (!existing || session.date > existing) lastTrained.set(muscle, session.date);
    }
  }

  return MAJOR_MUSCLES
    .filter(m => lastTrained.has(m))
    .map(muscle => {
      const lastDate = lastTrained.get(muscle)!;
      const hoursAgo = differenceInHours(now, parseISO(lastDate));
      const recoveryHours = HEAVY_MUSCLES.has(muscle) ? 48 : 24;
      const ratio = hoursAgo / recoveryHours;
      const status: RecoveryStatus = ratio >= 1 ? 'recovered' : ratio >= 0.5 ? 'recovering' : 'fatigued';
      return {
        muscle,
        label: (MUSCLE_LABELS_DE as Record<string, string>)[muscle] ?? muscle,
        status,
        hoursAgo,
        recoveryRatio: Math.min(ratio, 1),
      };
    })
    .sort((a, b) => {
      const order: Record<RecoveryStatus, number> = { fatigued: 0, recovering: 1, recovered: 2 };
      return order[a.status] - order[b.status];
    });
}

export const RECOVERY_CONFIG: Record<RecoveryStatus, { icon: string; color: string }> = {
  fatigued:   { icon: '🔴', color: '#FF3B30' },
  recovering: { icon: '🟡', color: '#FF9F0A' },
  recovered:  { icon: '✅', color: '#34C759' },
};
