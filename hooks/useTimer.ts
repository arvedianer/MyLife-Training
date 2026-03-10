'use client';

import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { startSilentAudioLoop, stopSilentAudioLoop, playTimerCompleteBeep } from '@/utils/audio';
import { sendLocalNotification, getRandomBroskiQuote } from '@/utils/notifications';

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
    let internalSeconds = restTimerSeconds;

    if (restTimerActive) {
      startSilentAudioLoop();

      intervalRef.current = setInterval(() => {
        internalSeconds -= 1;
        if (internalSeconds <= 0) {
          playTimerCompleteBeep();
          stopSilentAudioLoop();

          // Fire Broski Push Notification
          sendLocalNotification(getRandomBroskiQuote(), {
            body: 'Dein Timer ist abgelaufen. Zurück ans Eisen!',
            tag: 'rest-timer',
            requireInteraction: true // Keeps the notification visible until interacted with
          });
        }
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
      stopSilentAudioLoop();
    };
  }, [restTimerActive]); // Only restart when timer starts/stops — restTimerSeconds intentionally excluded (internalSeconds tracks countdown locally)

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
