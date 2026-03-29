import type { WorkoutSession } from '@/types/workout';
import type { WorkoutScore } from '@/types/score';

/**
 * Workout Score (0–100)
 *
 * Three metrics compared against the user's own history:
 *   1. Volume (40%)        — session tonnage vs avg of last 8 sessions
 *   2. Completion Rate (35%) — completed sets / planned sets
 *   3. Intensity (25%)     — avg weight vs avg of last 4 sessions
 */
export function calculateWorkoutScore(
  session: WorkoutSession,
  previousSessions: WorkoutSession[]
): WorkoutScore {
  const completedSets = session.exercises.flatMap((e) =>
    e.sets.filter((s) => s.isCompleted)
  );
  const plannedSets = session.exercises.flatMap((e) => e.sets);

  // --- 1. COMPLETION RATE (0-100) ---
  const completionRate =
    plannedSets.length > 0
      ? Math.round((completedSets.length / plannedSets.length) * 100)
      : 100;

  // --- 2. VOLUME vs PERSONAL AVERAGE (0-100) ---
  const sessionVolume = completedSets.reduce(
    (sum, s) => sum + s.weight * s.reps,
    0
  );
  const prevVolumes = previousSessions
    .slice(0, 8)
    .map((ps) =>
      ps.exercises
        .flatMap((e) => e.sets.filter((s) => s.isCompleted))
        .reduce((sum, s) => sum + s.weight * s.reps, 0)
    )
    .filter((v) => v > 0);
  const avgVolume =
    prevVolumes.length > 0
      ? prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length
      : sessionVolume;
  const volume = Math.min(
    100,
    Math.round((sessionVolume / Math.max(avgVolume, 1)) * 80)
  );

  // --- 3. INTENSITY (0-100) ---
  const avgWeightNow =
    completedSets.length > 0
      ? completedSets.reduce((sum, s) => sum + s.weight, 0) / completedSets.length
      : 0;
  const prevSets = previousSessions
    .slice(0, 4)
    .flatMap((ps) =>
      ps.exercises.flatMap((e) => e.sets.filter((s) => s.isCompleted))
    );
  const avgWeightPrev =
    prevSets.length > 0
      ? prevSets.reduce((sum, s) => sum + s.weight, 0) / prevSets.length
      : avgWeightNow;
  const intensity =
    avgWeightPrev > 0
      ? Math.min(100, Math.round((avgWeightNow / avgWeightPrev) * 90))
      : 80;

  // --- TOTAL (weighted average) ---
  const total = Math.round(volume * 0.4 + completionRate * 0.35 + intensity * 0.25);

  // --- LABEL ---
  const label =
    total >= 85
      ? 'Stark 💪'
      : total >= 70
      ? 'Gut'
      : total >= 50
      ? 'Ok'
      : 'Leicht';

  return { total, volume, completionRate, intensity, label };
}
