'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';
import { ExerciseSearch } from '@/components/workout/ExerciseSearch';
import { useWorkoutStore } from '@/store/workoutStore';
import { useHistoryStore } from '@/store/historyStore';
import type { Exercise } from '@/types/exercises';
import type { SetEntry, WorkoutExercise } from '@/types/workout';

export default function AddExercisePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const sessionEdit = searchParams.get('sessionEdit') === '1';

  const { addExercise, activeWorkout } = useWorkoutStore();
  const { getSessionById, updateSession } = useHistoryStore();

  // Extract sessionId from returnTo path like /log/<id>
  const sessionId = sessionEdit && returnTo
    ? returnTo.split('/log/')[1] ?? null
    : null;

  useEffect(() => {
    // Only redirect if NOT in session edit mode and no active workout
    if (!sessionEdit && !activeWorkout) {
      router.replace('/start');
    }
  }, [activeWorkout, router, sessionEdit]);

  const handleSelect = async (exercise: Exercise) => {
    if (sessionEdit && sessionId) {
      // Add exercise to an existing session
      const session = getSessionById(sessionId);
      if (session) {
        const newExercise: WorkoutExercise = {
          id: `${sessionId}-${exercise.id}-${Date.now()}`,
          exercise,
          sets: [
            {
              id: `set-${Date.now()}`,
              weight: exercise.defaultWeight ?? 0,
              reps: exercise.defaultReps ?? 10,
              isCompleted: true,
              isPR: false,
              type: 'normal',
            } satisfies SetEntry,
          ],
          isUnilateral: false,
          unilateralSync: false,
        };

        await updateSession(sessionId, {
          exercises: [...session.exercises, newExercise],
        });
      }
      router.push(returnTo!);
    } else {
      // Normal flow: add to active workout
      addExercise(exercise);
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.back();
      }
    }
  };

  // In session edit mode we don't need an active workout
  if (!sessionEdit && !activeWorkout) return null;

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
          flexShrink: 0,
        }}
      >
        <h1 style={{ ...typography.h3, color: colors.textPrimary }}>
          Übung hinzufügen
        </h1>
        <button
          onClick={() => (returnTo ? router.push(returnTo) : router.back())}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} color={colors.textMuted} />
        </button>
      </div>

      {/* Search (scrollable) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing[5],
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <ExerciseSearch onSelect={handleSelect} />
      </div>
    </div>
  );
}
