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

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.exercise.id !== exerciseId) continue;
      for (const set of exercise.sets) {
        if (!set.isCompleted) continue;
        if (set.weight * set.reps >= newVolume) return false;
      }
    }
  }

  return newVolume > 0;
}
