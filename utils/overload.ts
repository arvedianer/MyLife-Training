import type { WorkoutSession } from '@/types/workout';

interface OverloadSuggestion {
  weight: number;
  reps: number;
  reason: string;
}

/**
 * Berechnet den nächsten Satz basierend auf Progressive Overload.
 * Strategie: Wenn alle Wiederholungen im Zielbereich → +2.5kg
 */
export function calculateOverloadSuggestion(
  exerciseId: string,
  sessions: WorkoutSession[],
  targetRepsMin = 8,
  targetRepsMax = 12
): OverloadSuggestion | null {
  // Letzte Sessions mit dieser Übung
  const relevantSessions = sessions
    .filter((s) => s.exercises.some((e) => e.exercise.id === exerciseId))
    .slice(0, 3);

  if (relevantSessions.length === 0) return null;

  const lastSession = relevantSessions[0];
  const lastExercise = lastSession.exercises.find(
    (e) => e.exercise.id === exerciseId
  );

  if (!lastExercise) return null;

  const completedSets = lastExercise.sets.filter((s) => s.isCompleted);
  if (completedSets.length === 0) return null;

  const lastWeight = completedSets[completedSets.length - 1].weight;
  const lastReps = completedSets[completedSets.length - 1].reps;
  const allAboveTarget = completedSets.every((s) => s.reps >= targetRepsMax);
  const allBelowMin = completedSets.every((s) => s.reps < targetRepsMin);

  if (allAboveTarget) {
    // Alle Wiederholungen im oberen Bereich → Gewicht erhöhen
    const increment = lastWeight >= 20 ? 2.5 : 1.25;
    return {
      weight: lastWeight + increment,
      reps: targetRepsMin,
      reason: `+${increment}kg da alle Sätze ≥${targetRepsMax} Wdh.`,
    };
  }

  if (allBelowMin) {
    // Unter Mindestwdh → Gewicht reduzieren
    const decrement = lastWeight >= 20 ? 2.5 : 1.25;
    return {
      weight: Math.max(0, lastWeight - decrement),
      reps: targetRepsMin,
      reason: `−${decrement}kg da Sätze unter ${targetRepsMin} Wdh.`,
    };
  }

  // Gleich bleiben
  return {
    weight: lastWeight,
    reps: lastReps,
    reason: 'Gewicht beibehalten',
  };
}

/**
 * Berechnet das Gesamtvolumen eines Sets (Gewicht × Wiederholungen)
 */
export function calculateSetVolume(weight: number, reps: number): number {
  return weight * reps;
}

/**
 * Prüft ob ein Satz ein neuer Personal Record ist
 */
export function isPRSet(
  exerciseId: string,
  weight: number,
  reps: number,
  sessions: WorkoutSession[]
): boolean {
  const newVolume = weight * reps;
  if (newVolume === 0) return false;

  // Only counts as PR if there's previous history with completed sets for this exercise
  const hasHistory = sessions.some((s) =>
    s.exercises.some(
      (e) =>
        e.exercise.id === exerciseId &&
        e.sets.some((set) => set.isCompleted && set.weight > 0)
    )
  );
  if (!hasHistory) return false;

  let maxHistoricalVolume = 0;
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.exercise.id !== exerciseId) continue;
      for (const set of exercise.sets) {
        if (!set.isCompleted) continue;
        const vol = set.weight * set.reps;
        if (vol > maxHistoricalVolume) maxHistoricalVolume = vol;
      }
    }
  }
  return maxHistoricalVolume > 0 && newVolume > maxHistoricalVolume;
}

/**
 * Bewertet Basis-Verhältnisse zwischen Übungen (z.B. Barbell zu Dumbbell)
 */
const EXERCISE_RATIOS: Record<string, Record<string, number>> = {
  'dumbbell-bench-press': { 'bench-press': 0.4 }, // Kurzhantel ist ca 40% des Langhantel-Gewichts
  'bench-press': { 'dumbbell-bench-press': 2.5 },
  'dumbbell-shoulder-press': { 'overhead-press': 0.4 },
  'overhead-press': { 'dumbbell-shoulder-press': 2.5 },
  'lat-pulldown': { 'pull-up': 1.1 }, // Etwas mehr als Körpergewicht beim Latzug
  'pull-up': { 'lat-pulldown': 0.9 },
  'dumbbell-row': { 'barbell-row': 0.45 },
  'barbell-row': { 'dumbbell-row': 2.2 },
  'goblet-squat': { 'squat': 0.35 },
  'squat': { 'goblet-squat': 2.8 },
  'romanian-deadlift': { 'deadlift': 0.8 },
  'deadlift': { 'romanian-deadlift': 1.25 },
};

/**
 * Sucht das intelligenteste Startgewicht für einen neuen Satz.
 * Prüft zuerst die exakte Übung. Wenn nicht vorhanden, sucht es nach Variationen
 * und wendet den Ratio-Faktor an.
 */
export function calculateIntelligentWeight(
  exerciseId: string,
  sessions: WorkoutSession[]
): { weight: number; reps: number } | null {
  if (!sessions || sessions.length === 0) return null;

  // 1. Suche exakte Übung in der Historie (neueste zuerst)
  for (const session of sessions) {
    const exercise = session.exercises.find((e) => e.exercise.id === exerciseId);
    if (exercise) {
      // Nimm den letzten abgeschlossenen Satz dieser Session
      const completedSets = exercise.sets.filter((s) => s.isCompleted && s.weight > 0);
      if (completedSets.length > 0) {
        const lastSet = completedSets[completedSets.length - 1];
        return { weight: lastSet.weight, reps: lastSet.reps };
      }
    }
  }

  // 2. Suche nach Variationen / Ratios
  const relatedRatios = EXERCISE_RATIOS[exerciseId];
  if (relatedRatios) {
    for (const [relatedId, ratio] of Object.entries(relatedRatios)) {
      for (const session of sessions) {
        const relEx = session.exercises.find((e) => e.exercise.id === relatedId);
        if (relEx) {
          const completedSets = relEx.sets.filter((s) => s.isCompleted && s.weight > 0);
          if (completedSets.length > 0) {
            const lastSet = completedSets[completedSets.length - 1];
            // Gewichte runden auf nächste 2.5kg oder 1kg Schritte
            let calculatedWeight = lastSet.weight * ratio;
            // Snapping to nearest 1 or 2.5
            calculatedWeight = calculatedWeight > 20
              ? Math.round(calculatedWeight / 2.5) * 2.5
              : Math.round(calculatedWeight);

            return { weight: calculatedWeight, reps: lastSet.reps };
          }
        }
      }
    }
  }

  return null;
}
