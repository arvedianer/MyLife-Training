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

    // Auto-complete sets that have data entered (weight > 0 AND reps > 0) but weren't
    // explicitly ticked — covers the "Discard Incomplete" path and quick finishes.
    const exercisesWithAutoComplete = activeWorkout.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        isCompleted: s.isCompleted || (s.weight > 0 && s.reps > 0),
      })),
    }));

    // PR-Erkennung
    const newPRs: string[] = [];
    for (const workoutExercise of exercisesWithAutoComplete) {
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
    for (const workoutExercise of exercisesWithAutoComplete) {
      for (const set of workoutExercise.sets) {
        if (!set.isCompleted) continue;
        totalVolume += calculateSetVolume(set.weight, set.reps);
        totalSets++;
      }
    }

    // Übungen ohne abgeschlossene Sätze herausfiltern
    const validExercises = exercisesWithAutoComplete.filter((ex) =>
      ex.sets.some((s) => s.isCompleted)
    );

    const session: WorkoutSession = {
      id: activeWorkout.id,
      date: new Date().toISOString().split('T')[0],
      startedAt: activeWorkout.startedAt,
      finishedAt: now,
      durationSeconds,
      exercises: validExercises,
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

  function moveExercise(exerciseId: string, direction: 'up' | 'down') {
    if (!activeWorkout) return;
    const exercises = [...activeWorkout.exercises];
    const index = exercises.findIndex((e) => e.id === exerciseId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = exercises[index - 1];
      exercises[index - 1] = exercises[index];
      exercises[index] = temp;
      store.reorderExercises(exercises);
    } else if (direction === 'down' && index < exercises.length - 1) {
      const temp = exercises[index + 1];
      exercises[index + 1] = exercises[index];
      exercises[index] = temp;
      store.reorderExercises(exercises);
    }
  }

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
    moveExercise,
    addExercise: store.addExercise,
    removeExercise: store.removeExercise,
    replaceExercise: store.replaceExercise,
    addSet: store.addSet,
    updateSet: store.updateSet,
    removeSet: store.removeSet,
    toggleSetComplete: store.toggleSetComplete,
    cancelWorkout: store.cancelWorkout,
    startRestTimer: store.startRestTimer,
    undoLastSet: store.undoLastSet,
    undoStack: store.undoStack,
    toggleUnilateral: store.toggleUnilateral,
    changeSetType: store.changeSetType,
    reorderExercises: store.reorderExercises,
  };
}
