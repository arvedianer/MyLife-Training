'use client';

import { useWorkoutStore } from '@/store/workoutStore';
import { useHistoryStore } from '@/store/historyStore';
import { isPRSet, calculateSetVolume } from '@/utils/overload';
import type { WorkoutSession } from '@/types/workout';

export function useWorkout() {
  const store = useWorkoutStore();
  const { sessions, addSession } = useHistoryStore();

  /**
   * Workout abschließen und als Session in History speichern
   */
  function completeWorkout(): WorkoutSession | null {
    const { activeWorkout } = store;
    if (!activeWorkout) return null;

    const now = Date.now();
    const durationSeconds = Math.floor((now - activeWorkout.startedAt) / 1000);

    // PR-Erkennung
    const newPRs: string[] = [];
    for (const workoutExercise of activeWorkout.exercises) {
      for (const set of workoutExercise.sets) {
        if (!set.isCompleted) continue;
        if (isPRSet(workoutExercise.exercise.id, set.weight, set.reps, sessions)) {
          if (!newPRs.includes(workoutExercise.exercise.id)) {
            newPRs.push(workoutExercise.exercise.id);
          }
        }
      }
    }

    // Volumen & Sets berechnen
    let totalVolume = 0;
    let totalSets = 0;
    for (const workoutExercise of activeWorkout.exercises) {
      for (const set of workoutExercise.sets) {
        if (!set.isCompleted) continue;
        totalVolume += calculateSetVolume(set.weight, set.reps);
        totalSets++;
      }
    }

    const session: WorkoutSession = {
      id: activeWorkout.id,
      date: new Date().toISOString().split('T')[0],
      startedAt: activeWorkout.startedAt,
      finishedAt: now,
      durationSeconds,
      exercises: activeWorkout.exercises,
      totalVolume,
      totalSets,
      newPRs,
      splitName: activeWorkout.plannedSplit,
    };

    addSession(session);
    store.finishWorkout();

    return session;
  }

  /**
   * Prüft ob ein Set beim Abhaken ein neuer PR ist
   */
  function checkSetForPR(exerciseId: string, weight: number, reps: number): boolean {
    return isPRSet(exerciseId, weight, reps, sessions);
  }

  const { activeWorkout } = store;

  const completedSetsCount = activeWorkout
    ? activeWorkout.exercises.reduce(
        (sum, e) => sum + e.sets.filter((s) => s.isCompleted).length,
        0
      )
    : 0;

  const totalSetsCount = activeWorkout
    ? activeWorkout.exercises.reduce((sum, e) => sum + e.sets.length, 0)
    : 0;

  return {
    activeWorkout,
    completedSetsCount,
    totalSetsCount,
    completeWorkout,
    checkSetForPR,
    addExercise: store.addExercise,
    removeExercise: store.removeExercise,
    addSet: store.addSet,
    updateSet: store.updateSet,
    removeSet: store.removeSet,
    toggleSetComplete: store.toggleSetComplete,
    cancelWorkout: store.cancelWorkout,
    startRestTimer: store.startRestTimer,
  };
}
