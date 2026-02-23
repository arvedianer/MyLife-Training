'use client';

import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';

/**
 * Rest-Timer Hook — läuft im Store, überlebt Navigation.
 * Tick-Intervall wird beim Mount registriert.
 */
export function useRestTimer() {
  const restTimerActive = useWorkoutStore((s) => s.restTimerActive);
  const restTimerSeconds = useWorkoutStore((s) => s.restTimerSeconds);
  const restTimerTotal = useWorkoutStore((s) => s.restTimerTotal);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const stopRestTimer = useWorkoutStore((s) => s.stopRestTimer);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (restTimerActive) {
      intervalRef.current = setInterval(() => {
        // Imperativ — kein stale closure, kein doppeltes Intervall
        useWorkoutStore.getState().tickRestTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [restTimerActive]); // tickRestTimer bewusst nicht in deps

  const progress = restTimerTotal > 0 ? restTimerSeconds / restTimerTotal : 0;

  return {
    active: restTimerActive,
    seconds: restTimerSeconds,
    total: restTimerTotal,
    progress,
    start: startRestTimer,
    stop: stopRestTimer,
  };
}

/**
 * Workout-Dauer Hook — berechnet elapsed time aus startedAt
 */
export function useWorkoutTimer() {
  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const startedAt = activeWorkout?.startedAt;

  // Elapsed wird clientseitig berechnet (kein Store-State nötig)
  // Die Komponente muss selbst re-rendern (z.B. mit useState + setInterval)

  function getElapsed(): number {
    if (!startedAt) return 0;
    return Math.floor((Date.now() - startedAt) / 1000);
  }

  return { getElapsed, startedAt };
}
