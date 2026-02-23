'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';
import { ExerciseSearch } from '@/components/workout/ExerciseSearch';
import { useWorkoutStore } from '@/store/workoutStore';
import type { Exercise } from '@/types/exercises';

export default function AddExercisePage() {
  const router = useRouter();
  const { addExercise, activeWorkout } = useWorkoutStore();

  const handleSelect = (exercise: Exercise) => {
    addExercise(exercise);
    router.back();
  };

  if (!activeWorkout) {
    router.replace('/start');
    return null;
  }

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
          onClick={() => router.back()}
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
