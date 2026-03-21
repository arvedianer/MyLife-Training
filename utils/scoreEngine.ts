import type { WorkoutSession } from '@/types/workout';
import type { WorkoutScore } from '@/types/score';

/**
 * Intelligent Workout Score (0–100)
 *
 * Three meaningful metrics compared against the user's own history:
 *   1. Completion rate   (0–35 pts) — planned sets actually done
 *   2. Volume vs average (0–35 pts) — today's total tonnage vs last 8 sessions
 *   3. Intensity         (0–20 pts) — avg weight vs last 4 sessions
 *   4. Consistency bonus (0–10 pts) — diverse muscle group coverage
 *
 * Result: label ("Schwach"…"Exzellent") + explanation sentence.
 */
export function calculateWorkoutScore(
  session: WorkoutSession,
  previousSessions: WorkoutSession[]
): WorkoutScore {
  const completedSets = session.exercises.flatMap((e) =>
    e.sets.filter((s) => s.isCompleted)
  );
  const allSets = session.exercises.flatMap((e) => e.sets);

  // --- 1. COMPLETION RATE (0-35 points) ---
  const completionRatio =
    allSets.length > 0 ? completedSets.length / allSets.length : 1;
  const completionScore = Math.round(completionRatio * 35);

  // --- 2. VOLUME vs PERSONAL AVERAGE (0-35 points) ---
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

  let volumeScore = 25; // default when no history available
  if (prevVolumes.length >= 2) {
    const avgVolume = prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length;
    if (avgVolume > 0) {
      const ratio = sessionVolume / avgVolume;
      // 0.5x avg → ~14 pts, 1x avg → 27 pts, 1.3x avg → 35 pts
      volumeScore = Math.min(35, Math.max(0, Math.round(ratio * 27)));
    }
  } else {
    // No history yet — score based purely on session volume and completed sets
    const hasGoodVolume = sessionVolume > 500; // 500 kg total = decent session
    volumeScore =
      completedSets.length >= 9 ? 28    // 3 exercises × 3 sets = great
      : completedSets.length >= 6 ? 22
      : completedSets.length >= 3 ? 15
      : 8;
    if (hasGoodVolume) volumeScore = Math.min(35, volumeScore + 5);
  }

  // --- 3. INTENSITY (0-20 points) ---
  const avgWeightNow =
    completedSets.length > 0
      ? completedSets.reduce((sum, s) => sum + s.weight, 0) / completedSets.length
      : 0;
  const prevSets = previousSessions
    .slice(0, 4)
    .flatMap((ps) => ps.exercises.flatMap((e) => e.sets.filter((s) => s.isCompleted)));
  const avgWeightPrev =
    prevSets.length > 0
      ? prevSets.reduce((sum, s) => sum + s.weight, 0) / prevSets.length
      : avgWeightNow;

  let intensityScore = 14; // default
  if (avgWeightPrev > 0 && completedSets.length > 0) {
    const ratio = avgWeightNow / avgWeightPrev;
    // 0.7x → ~10 pts, 1x → 14 pts, 1.1x → ~15 pts, 1.4x+ → 20 pts
    intensityScore = Math.min(20, Math.max(0, Math.round(ratio * 14)));
  }

  // --- 4. CONSISTENCY BONUS (0-10 points) ---
  const trainedMuscles = new Set(
    session.exercises.map((e) => e.exercise.primaryMuscle)
  );
  const consistencyBonus = Math.min(10, trainedMuscles.size * 3);

  // --- TOTAL ---
  const total = Math.min(
    100,
    completionScore + volumeScore + intensityScore + consistencyBonus
  );

  // --- LABEL ---
  const label =
    total >= 88
      ? 'Exzellent 🔥'
      : total >= 75
      ? 'Stark 💪'
      : total >= 62
      ? 'Gut'
      : total >= 48
      ? 'Ok'
      : total >= 32
      ? 'Mäßig'
      : 'Schwach';

  // --- EXPLANATION ---
  const parts: string[] = [];

  if (completionRatio < 0.7) {
    parts.push(`Nur ${Math.round(completionRatio * 100)}% der Sets abgeschlossen`);
  } else if (completionRatio >= 1) {
    parts.push('Alle Sets durchgezogen');
  }

  if (prevVolumes.length >= 2) {
    const avgVol = prevVolumes.reduce((a, b) => a + b, 0) / prevVolumes.length;
    const pct = Math.round((sessionVolume / Math.max(avgVol, 1)) * 100);
    if (pct >= 120) {
      parts.push(`${pct}% deines üblichen Volumens`);
    } else if (pct < 80) {
      parts.push(`Nur ${pct}% deines üblichen Volumens`);
    }
  } else {
    parts.push('Erster Datenpunkt — Score wird mit mehr History präziser');
  }

  if (trainedMuscles.size >= 3) {
    parts.push(`${trainedMuscles.size} Muskelgruppen`);
  }

  const explanation =
    parts.length > 0 ? parts.join(' · ') : 'Workout abgeschlossen';

  return {
    total,
    label,
    completionRate: Math.round(completionRatio * 100),
    volumeScore,
    intensityScore,
    consistencyBonus,
    explanation,
    // Legacy: keep tips as empty array so stored sessions & PDF don't crash
    tips: [],
    percentileBetter: 0,
  };
}
