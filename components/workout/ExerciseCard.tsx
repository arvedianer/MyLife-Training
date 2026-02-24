'use client';

import { Plus, ChevronDown, ChevronUp, Trash2, Info, Target, Timer, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { SetRow } from './SetRow';
import { Badge } from '@/components/ui/Badge';
import type { WorkoutExercise } from '@/types/workout';

interface OverloadSuggestion {
  weight: number;
  reps: number;
  reason: string;
}

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  restTimerDefault: number;
  overloadSuggestion?: OverloadSuggestion | null;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: { weight?: number; reps?: number }) => void;
  onToggleSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onStartTimer: (seconds: number) => void;
  onApplySuggestion?: (weight: number, reps: number) => void;
}

export function ExerciseCard({
  workoutExercise,
  restTimerDefault,
  overloadSuggestion,
  onAddSet,
  onUpdateSet,
  onToggleSet,
  onRemoveSet,
  onRemoveExercise,
  onStartTimer,
  onApplySuggestion,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [scienceExpanded, setScienceExpanded] = useState(false);
  const { exercise, sets } = workoutExercise;
  const completedSets = sets.filter((s) => s.isCompleted).length;

  // Use exercise-specific rest time if available, fall back to default
  const restSeconds = exercise.restSeconds ?? restTimerDefault;

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

          {/* Progress + Science badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[2], flexWrap: 'wrap' }}>
            <Badge variant="muted">
              {completedSets}/{sets.length} Sätze
            </Badge>

            {/* Rep range target */}
            {exercise.repRange && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: `${colors.accent}15`,
                  border: `1px solid ${colors.accent}30`,
                  borderRadius: radius.sm,
                  padding: '2px 8px',
                }}
              >
                <Target size={10} color={colors.accent} />
                <span style={{ ...typography.monoSm, color: colors.accent }}>
                  {exercise.repRange.min}–{exercise.repRange.max} Wdh.
                </span>
              </div>
            )}

            {/* Rest time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: colors.bgHighest,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.sm,
                padding: '2px 8px',
              }}
            >
              <Timer size={10} color={colors.textMuted} />
              <span style={{ ...typography.monoSm, color: colors.textMuted }}>
                {restSeconds}s
              </span>
            </div>

            {/* Science note toggle */}
            {exercise.scienceNote && (
              <button
                onClick={() => setScienceExpanded((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: scienceExpanded ? `${colors.accent}20` : 'transparent',
                  border: `1px solid ${scienceExpanded ? colors.accent + '50' : colors.borderLight}`,
                  borderRadius: radius.sm,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Info size={10} color={scienceExpanded ? colors.accent : colors.textFaint} />
                <span style={{ ...typography.label, color: scienceExpanded ? colors.accent : colors.textFaint }}>
                  Warum?
                </span>
              </button>
            )}
          </div>

          {/* Science note expanded */}
          {scienceExpanded && exercise.scienceNote && (
            <div
              style={{
                marginTop: spacing[2],
                padding: spacing[3],
                backgroundColor: `${colors.accent}08`,
                border: `1px solid ${colors.accent}20`,
                borderRadius: radius.md,
              }}
            >
              <p style={{ ...typography.bodySm, color: colors.textMuted, lineHeight: '18px' }}>
                {exercise.scienceNote}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0, marginLeft: spacing[2] }}>
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
          {/* KI Overload Suggestion */}
          {overloadSuggestion && (
            <button
              onClick={() => onApplySuggestion?.(overloadSuggestion.weight, overloadSuggestion.reps)}
              title="Tippen um auf ersten offenen Satz anzuwenden"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: `${spacing[2]} ${spacing[3]}`,
                marginTop: spacing[2],
                marginBottom: spacing[1],
                backgroundColor: `${colors.accent}10`,
                border: `1px solid ${colors.accent}30`,
                borderRadius: radius.md,
                cursor: onApplySuggestion ? 'pointer' : 'default',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (onApplySuggestion) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${colors.accent}20`;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${colors.accent}10`;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <TrendingUp size={12} color={colors.accent} />
                <span style={{ ...typography.label, color: colors.accent }}>
                  KI: {overloadSuggestion.weight} kg × {overloadSuggestion.reps} Wdh.
                </span>
              </div>
              <span style={{ ...typography.label, color: colors.textFaint, fontSize: '9px' }}>
                {overloadSuggestion.reason}
              </span>
            </button>
          )}

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
              repRange={exercise.repRange}
              onUpdateWeight={(weight) => onUpdateSet(set.id, { weight })}
              onUpdateReps={(reps) => onUpdateSet(set.id, { reps })}
              onToggleComplete={() => onToggleSet(set.id)}
              onRemove={() => onRemoveSet(set.id)}
              onStartTimer={() => onStartTimer(restSeconds)}
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
