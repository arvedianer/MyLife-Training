import type { WorkoutSession } from '@/types/workout';
import { getExerciseById } from '@/constants/exercises';
import { subDays, parseISO, isAfter } from 'date-fns';

export interface MuscleStatus {
  muscleId: string;
  labelDE: string;
  setsThisWeek: number;
  targetSets: number;
  isAdequate: boolean;
}

export const MUSCLE_LABELS_DE: Record<string, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  quads: 'Beinvorderseite',
  hamstrings: 'Hamstrings',
  glutes: 'Gesäß',
  calves: 'Waden',
  core: 'Core',
};

export function getWeeklyMuscleStatus(sessions: WorkoutSession[]): MuscleStatus[] {
  const oneWeekAgo = subDays(new Date(), 7);
  const thisWeekSessions = sessions.filter((s) => isAfter(parseISO(s.date), oneWeekAgo));

  const setsPerMuscle: Record<string, number> = {};

  for (const session of thisWeekSessions) {
    for (const ex of session.exercises) {
      // Fall back to session-level primaryMuscle for custom exercises not in the static DB
      const exercise = getExerciseById(ex.exercise.id);
      const primaryMuscle = exercise?.primaryMuscle ?? ex.exercise.primaryMuscle;
      if (!primaryMuscle) continue;

      const workedSets = ex.sets.filter((s) => s.isCompleted && s.type !== 'warmup').length;
      setsPerMuscle[primaryMuscle] = (setsPerMuscle[primaryMuscle] ?? 0) + workedSets;

      // Count secondary muscles at half weight
      for (const sec of exercise?.secondaryMuscles ?? []) {
        setsPerMuscle[sec] = (setsPerMuscle[sec] ?? 0) + Math.floor(workedSets / 2);
      }
    }
  }

  const MIN_SETS_PER_WEEK = 6;
  return Object.keys(MUSCLE_LABELS_DE).map((muscleId) => ({
    muscleId,
    labelDE: MUSCLE_LABELS_DE[muscleId],
    setsThisWeek: setsPerMuscle[muscleId] ?? 0,
    targetSets: MIN_SETS_PER_WEEK,
    isAdequate: (setsPerMuscle[muscleId] ?? 0) >= MIN_SETS_PER_WEEK,
  }));
}

export function getMissingMuscles(sessions: WorkoutSession[], activeSplitMuscles: string[]): string[] {
  const status = getWeeklyMuscleStatus(sessions);
  return activeSplitMuscles.filter((m) => {
    const s = status.find((st) => st.muscleId === m);
    return !s || !s.isAdequate;
  });
}

export function getRemainingWeekDays(): number {
  const today = new Date().getDay(); // 0=Sun, 6=Sat
  // Weekend = no training days left this week
  if (today === 0 || today === 6) return 0;
  return 6 - today; // Mon(1)→5, Tue(2)→4, ..., Fri(5)→1
}
