'use client';

import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { NumericInput } from '@/components/ui/Input';
import type { SetEntry } from '@/types/workout';

interface SetRowProps {
  set: SetEntry;
  setNumber: number;
  exerciseId: string;
  repRange?: { min: number; max: number };
  onUpdateWeight: (weight: number) => void;
  onUpdateReps: (reps: number) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
  restTimerDefault?: number;
  onStartTimer?: () => void;
}

function getRepsColor(reps: number, repRange?: { min: number; max: number }): string {
  if (!repRange || reps === 0) return colors.textDisabled;
  if (reps >= repRange.min && reps <= repRange.max) return colors.success;
  return '#FF9500'; // orange — outside range
}

export function SetRow({
  set,
  setNumber,
  repRange,
  onUpdateWeight,
  onUpdateReps,
  onToggleComplete,
  onRemove,
  onStartTimer,
}: SetRowProps) {
  const repsColor = getRepsColor(set.reps, repRange);
  const repsInRange = repRange && set.reps > 0 && set.reps >= repRange.min && set.reps <= repRange.max;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: `${spacing[2]} 0`,
        borderBottom: `1px solid ${colors.borderLight}`,
        backgroundColor: set.isCompleted ? `${colors.success}08` : 'transparent',
        transition: 'background-color 0.2s',
      }}
    >
      {/* Set Number */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: radius.sm,
          backgroundColor: set.isPR ? colors.accentBg : colors.bgHighest,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            ...typography.monoSm,
            color: set.isPR ? colors.accent : colors.textMuted,
          }}
        >
          {set.isPR ? '★' : setNumber}
        </span>
      </div>

      {/* Gewicht */}
      <div style={{ flex: 1 }}>
        <div style={{ ...typography.label, color: colors.textFaint, marginBottom: '2px' }}>
          KG
        </div>
        <NumericInput
          value={set.weight}
          onChange={onUpdateWeight}
          step={2.5}
          placeholder="0"
          style={{
            opacity: set.isCompleted ? 0.6 : 1,
          }}
        />
      </div>

      {/* Wiederholungen — colored by in/out of rep range */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            ...typography.label,
            color: set.reps > 0 && repRange ? repsColor : colors.textFaint,
            marginBottom: '2px',
            transition: 'color 0.2s',
          }}
        >
          WDH {repsInRange ? '✓' : set.reps > 0 && repRange ? '!' : ''}
        </div>
        <NumericInput
          value={set.reps}
          onChange={onUpdateReps}
          step={1}
          placeholder="0"
          style={{
            opacity: set.isCompleted ? 0.6 : 1,
            borderColor:
              set.reps > 0 && repRange
                ? repsInRange
                  ? `${colors.success}60`
                  : '#FF950060'
                : undefined,
          }}
        />
      </div>

      {/* Volumen (readonly) */}
      <div style={{ width: '48px', textAlign: 'right', flexShrink: 0 }}>
        <div style={{ ...typography.label, color: colors.textFaint, marginBottom: '2px' }}>
          VOL
        </div>
        <div style={{ ...typography.monoSm, color: colors.textDisabled }}>
          {set.weight > 0 && set.reps > 0 ? `${set.weight * set.reps}` : '—'}
        </div>
      </div>

      {/* Complete / Delete */}
      <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
        <button
          onClick={() => {
            onToggleComplete();
            if (!set.isCompleted && onStartTimer) {
              onStartTimer();
            }
          }}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderRadius: '50%',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgHighest;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          {set.isCompleted ? (
            <CheckCircle2 size={22} color={colors.success} />
          ) : (
            <Circle size={22} color={colors.textDisabled} />
          )}
        </button>

        <button
          onClick={onRemove}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderRadius: '50%',
            transition: 'background-color 0.15s',
            opacity: 0.4,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.dangerBg;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.4';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <Trash2 size={14} color={colors.danger} />
        </button>
      </div>
    </div>
  );
}
