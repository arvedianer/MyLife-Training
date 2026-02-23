'use client';

import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { SetRow } from './SetRow';
import { Badge } from '@/components/ui/Badge';
import type { WorkoutExercise } from '@/types/workout';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  restTimerDefault: number;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: { weight?: number; reps?: number }) => void;
  onToggleSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onStartTimer: (seconds: number) => void;
}

export function ExerciseCard({
  workoutExercise,
  restTimerDefault,
  onAddSet,
  onUpdateSet,
  onToggleSet,
  onRemoveSet,
  onRemoveExercise,
  onStartTimer,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { exercise, sets } = workoutExercise;
  const completedSets = sets.filter((s) => s.isCompleted).length;

  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        overflow: 'hidden',
        marginBottom: spacing[3],
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${spacing[4]} ${spacing[4]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: collapsed ? 'none' : `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <h3
              style={{
                ...typography.h3,
                color: colors.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {exercise.nameDE}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] }}>
            <Badge variant="muted">
              {completedSets}/{sets.length} Sätze
            </Badge>
            <span style={{ ...typography.bodySm, color: colors.textDisabled }}>
              {exercise.equipment[0]}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
          {/* Delete Exercise */}
          <button
            onClick={onRemoveExercise}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              opacity: 0.5,
              transition: 'opacity 0.15s, background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.dangerBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.5';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 size={16} color={colors.danger} />
          </button>

          {/* Collapse */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
            }}
          >
            {collapsed ? (
              <ChevronDown size={18} color={colors.textMuted} />
            ) : (
              <ChevronUp size={18} color={colors.textMuted} />
            )}
          </button>
        </div>
      </div>

      {/* Sets */}
      {!collapsed && (
        <div style={{ padding: `0 ${spacing[4]}` }}>
          {/* Column Headers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: `${spacing[2]} 0`,
              marginBottom: spacing[1],
            }}
          >
            <div style={{ width: '28px' }} />
            <div style={{ flex: 1, ...typography.label, color: colors.textFaint }}>KG</div>
            <div style={{ flex: 1, ...typography.label, color: colors.textFaint }}>WDH</div>
            <div style={{ width: '48px', ...typography.label, color: colors.textFaint, textAlign: 'right' }}>VOL</div>
            <div style={{ width: '68px' }} />
          </div>

          {/* Set Rows */}
          {sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              setNumber={index + 1}
              exerciseId={workoutExercise.id}
              onUpdateWeight={(weight) => onUpdateSet(set.id, { weight })}
              onUpdateReps={(reps) => onUpdateSet(set.id, { reps })}
              onToggleComplete={() => onToggleSet(set.id)}
              onRemove={() => onRemoveSet(set.id)}
              onStartTimer={() => onStartTimer(restTimerDefault)}
            />
          ))}

          {/* Add Set Button */}
          <button
            onClick={onAddSet}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              width: '100%',
              padding: `${spacing[3]} 0`,
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              ...typography.bodySm,
              color: colors.accent,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            <Plus size={14} />
            Satz hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}
