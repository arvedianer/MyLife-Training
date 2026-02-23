'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Check, Clock } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { Button } from '@/components/ui/Button';
import { RestTimerOverlay } from '@/components/overlays/RestTimerOverlay';
import { PRMomentOverlay } from '@/components/overlays/PRMomentOverlay';
import { useWorkout } from '@/hooks/useWorkout';
import { useRestTimer } from '@/hooks/useTimer';
import { useUserStore } from '@/store/userStore';
import { formatDuration } from '@/utils/dates';

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
    startRestTimer,
  } = useWorkout();

  const restTimer = useRestTimer();

  const [elapsed, setElapsed] = useState(0);
  const [showPR, setShowPR] = useState(false);
  const [prExerciseName, setPRExerciseName] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishing = useRef(false); // prevents the "no workout" redirect from firing during completion

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

  if (!activeWorkout && !isFinishing.current) return null;

  const handleFinish = () => {
    isFinishing.current = true;
    const session = completeWorkout();
    if (session) {
      router.replace(`/workout/summary?session=${session.id}`);
    } else {
      isFinishing.current = false;
    }
  };

  const handleCancel = () => {
    if (confirm('Workout wirklich abbrechen? Alle Daten gehen verloren.')) {
      cancelWorkout();
      router.replace('/start');
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

  const handleClosePR = useCallback(() => setShowPR(false), []);

  const progress = totalSetsCount > 0 ? completedSetsCount / totalSetsCount : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        backgroundColor: colors.bgPrimary,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing[4]} ${spacing[5]}`,
          paddingTop: `calc(${spacing[4]} + env(safe-area-inset-top))`,
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.bgPrimary,
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: colors.success,
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ ...typography.label, color: colors.success }}>LIVE</span>
          </div>
          <h1 style={{ ...typography.h3, color: colors.textPrimary, marginTop: '2px' }}>
            {activeWorkout.plannedSplit ?? 'Freies Training'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Clock size={14} color={colors.textMuted} />
            <span style={{ ...typography.mono, color: colors.textMuted }}>
              {formatDuration(elapsed)}
            </span>
          </div>

          {/* Cancel */}
          <button
            onClick={handleCancel}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} color={colors.textMuted} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '3px', backgroundColor: colors.bgHighest, flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: colors.accent,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Sets counter */}
      <div
        style={{
          padding: `${spacing[2]} ${spacing[5]}`,
          backgroundColor: colors.bgSecondary,
          flexShrink: 0,
        }}
      >
        <span style={{ ...typography.bodySm, color: colors.textMuted }}>
          {completedSetsCount} / {totalSetsCount} Sätze abgeschlossen
        </span>
      </div>

      {/* Exercises (scrollable) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `${spacing[4]} ${spacing[5]}`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {activeWorkout.exercises.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${spacing[16]} ${spacing[4]}`,
              gap: spacing[4],
              textAlign: 'center',
            }}
          >
            <p style={{ ...typography.body, color: colors.textMuted }}>
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
            {activeWorkout.exercises.map((workoutExercise) => (
              <ExerciseCard
                key={workoutExercise.id}
                workoutExercise={workoutExercise}
                restTimerDefault={restTimerDefault}
                onAddSet={() => addSet(workoutExercise.id)}
                onUpdateSet={(setId, updates) => updateSet(workoutExercise.id, setId, updates)}
                onToggleSet={(setId) => handleToggleSet(workoutExercise.id, setId)}
                onRemoveSet={(setId) => removeSet(workoutExercise.id, setId)}
                onRemoveExercise={() => removeExercise(workoutExercise.id)}
                onStartTimer={(seconds) => startRestTimer(seconds)}
              />
            ))}
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div
        style={{
          padding: `${spacing[4]} ${spacing[5]}`,
          paddingBottom: `calc(${spacing[4]} + env(safe-area-inset-bottom))`,
          borderTop: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.bgPrimary,
          flexShrink: 0,
          display: 'flex',
          gap: spacing[3],
        }}
      >
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
