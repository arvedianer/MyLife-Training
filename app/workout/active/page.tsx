'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Check, Clock } from 'lucide-react';
import { colors } from '@/constants/tokens';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { Button } from '@/components/ui/Button';
import { RestTimerOverlay } from '@/components/overlays/RestTimerOverlay';
import { PRMomentOverlay } from '@/components/overlays/PRMomentOverlay';
import { CancelWorkoutOverlay } from '@/components/overlays/CancelWorkoutOverlay';
import { useWorkout } from '@/hooks/useWorkout';
import { useRestTimer } from '@/hooks/useTimer';
import { useUserStore } from '@/store/userStore';
import { useHistoryStore } from '@/store/historyStore';
import { calculateOverloadSuggestion } from '@/utils/overload';
import { formatDuration } from '@/utils/dates';
import { requestNotificationPermission } from '@/utils/notifications';
import styles from './page.module.css';

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const { restTimerDefault } = useUserStore();
  const {
    activeWorkout,
    completedSetsCount,
    totalSetsCount,
    completeWorkout,
    cancelWorkout,
    checkSetForPR,
    addSet,
    updateSet,
    removeSet,
    toggleSetComplete,
    removeExercise,
    moveExercise,
    startRestTimer,
  } = useWorkout();

  const restTimer = useRestTimer();
  const { sessions } = useHistoryStore();

  const [elapsed, setElapsed] = useState(0);
  const [showPR, setShowPR] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [prExerciseName, setPRExerciseName] = useState('');
  const [hasNotifPermission, setHasNotifPermission] = useState(true); // Default true to avoid flash

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishing = useRef(false); // prevents the "no workout" redirect from firing during completion

  useEffect(() => {
    if ('Notification' in window) {
      setHasNotifPermission(Notification.permission === 'granted');
    }
  }, []);

  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    setHasNotifPermission(granted);
    if (granted) {
      alert("Coach is ready! Du bekommst jetzt Timer-Benachrichtigungen.");
    }
  };

  // Workout-Timer — clear before set to prevent accumulation
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (activeWorkout) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeWorkout]);

  // Redirect wenn kein aktives Workout — aber nicht wenn wir gerade abschließen
  useEffect(() => {
    if (!activeWorkout && !isFinishing.current) {
      router.replace('/start');
    }
  }, [activeWorkout, router]);

  const handleClosePR = useCallback(() => setShowPR(false), []);

  // Finishing: blank screen while navigation happens (avoids redirect to /start)
  if (!activeWorkout) return null;

  const handleFinish = () => {
    isFinishing.current = true;
    const session = completeWorkout();
    if (session) {
      router.replace(`/workout/summary?session=${session.id}`);
    } else {
      isFinishing.current = false;
    }
  };

  const handleCancelClick = () => {
    setShowCancel(true);
  };

  const handleConfirmCancel = () => {
    isFinishing.current = true; // prevent useEffect double-redirect
    cancelWorkout();
    setShowCancel(false);
    router.replace('/start');
  };

  const handleApplySuggestion = (exerciseId: string, weight: number, reps: number) => {
    const workoutEx = activeWorkout.exercises.find((e) => e.id === exerciseId);
    const firstUncompleted = workoutEx?.sets.find((s) => !s.isCompleted);
    if (firstUncompleted) {
      updateSet(exerciseId, firstUncompleted.id, { weight, reps });
    }
  };

  const handleToggleSet = (exerciseId: string, setId: string) => {
    const workoutExercise = activeWorkout.exercises.find((e) => e.id === exerciseId);
    const set = workoutExercise?.sets.find((s) => s.id === setId);

    // PR-Check: nur beim Abschließen (nicht beim Rückgängigmachen)
    if (workoutExercise && set && !set.isCompleted && set.weight > 0 && set.reps > 0) {
      if (checkSetForPR(workoutExercise.exercise.id, set.weight, set.reps)) {
        setPRExerciseName(workoutExercise.exercise.nameDE);
        setShowPR(true);
      }
    }

    toggleSetComplete(exerciseId, setId);
    // Rest-Timer wird von SetRow → ExerciseCard → onStartTimer gehandelt
  };

  const progress = totalSetsCount > 0 ? completedSetsCount / totalSetsCount : 0;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.liveIndicatorContainer}>
            <div className={styles.liveDot} />
            <span className={styles.liveText}>LIVE</span>
          </div>
          <h1 className={styles.workoutTitle}>
            {activeWorkout.plannedSplit ?? 'Freies Training'}
          </h1>
        </div>

        <div className={styles.headerActions}>
          {/* Timer */}
          <div className={styles.timerContainer}>
            <Clock size={14} color={colors.textMuted} />
            <span className={styles.timerText}>
              {formatDuration(elapsed)}
            </span>
          </div>

          {/* Request Notifications (Optional) */}
          {!hasNotifPermission && (
            <button
              onClick={handleRequestPush}
              title="Benachrichtigungen für Workout-Timer aktivieren"
              className={styles.coachAlertBtn}
            >
              Coach Alerts
            </button>
          )}

          {/* Cancel */}
          <button
            onClick={handleCancelClick}
            className={styles.cancelBtn}
          >
            <X size={16} color={colors.textMuted} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Sets counter */}
      <div className={styles.setsCounterContainer}>
        <span className={styles.setsCounterText}>
          {completedSetsCount} / {totalSetsCount} Sätze abgeschlossen
        </span>
      </div>

      {/* Exercises (scrollable) */}
      <div className={styles.scrollContainer}>
        {activeWorkout.exercises.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <p className={styles.emptyStateText}>
              Noch keine Übungen hinzugefügt.
            </p>
            <Link href="/workout/add-exercise">
              <Button>
                <Plus size={16} />
                Übung hinzufügen
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {activeWorkout.exercises.map((workoutExercise, index) => {
              const suggestion = calculateOverloadSuggestion(
                workoutExercise.exercise.id,
                sessions,
                workoutExercise.exercise.repRange?.min,
                workoutExercise.exercise.repRange?.max
              );
              return (
                <ExerciseCard
                  key={workoutExercise.id}
                  workoutExercise={workoutExercise}
                  restTimerDefault={restTimerDefault}
                  overloadSuggestion={suggestion}
                  onAddSet={() => addSet(workoutExercise.id)}
                  onUpdateSet={(setId, updates) => updateSet(workoutExercise.id, setId, updates)}
                  onToggleSet={(setId) => handleToggleSet(workoutExercise.id, setId)}
                  onRemoveSet={(setId) => removeSet(workoutExercise.id, setId)}
                  onRemoveExercise={() => removeExercise(workoutExercise.id)}
                  onMoveUp={index > 0 ? () => moveExercise(workoutExercise.id, 'up') : undefined}
                  onMoveDown={index < activeWorkout.exercises.length - 1 ? () => moveExercise(workoutExercise.id, 'down') : undefined}
                  onStartTimer={(seconds) => startRestTimer(seconds)}
                  onApplySuggestion={(w, r) => handleApplySuggestion(workoutExercise.id, w, r)}
                />
              );
            })}

            {/* Bottom Actions moved inside the scrollable stream */}
            <div className={styles.bottomActions}>
              <Link href="/workout/add-exercise" style={{ flex: 1 }}>
                <Button variant="secondary" fullWidth>
                  <Plus size={16} />
                  Übung
                </Button>
              </Link>
              <Button
                fullWidth
                style={{ flex: 2 }}
                onClick={handleFinish}
                disabled={activeWorkout.exercises.length === 0}
              >
                <Check size={16} />
                Abschließen
              </Button>
            </div>
          </>
        )}
      </div>


      {/* Overlays */}
      <RestTimerOverlay
        isOpen={restTimer.active}
        seconds={restTimer.seconds}
        total={restTimer.total}
        onClose={restTimer.stop}
        onRestart={startRestTimer}
      />

      <PRMomentOverlay
        isOpen={showPR}
        exerciseName={prExerciseName}
        onClose={handleClosePR}
      />

      <CancelWorkoutOverlay
        isOpen={showCancel}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancel(false)}
      />
    </div>
  );
}
