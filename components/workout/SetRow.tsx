'use client';

import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { colors } from '@/constants/tokens';
import { NumericInput } from '@/components/ui/Input';
import type { SetEntry } from '@/types/workout';
import styles from './SetRow.module.css';

interface SetRowProps {
  set: SetEntry;
  setNumber: number;
  exerciseId: string;
  repRange?: { min: number; max: number };
  isBodyweight?: boolean;
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
  isBodyweight,
  onUpdateWeight,
  onUpdateReps,
  onToggleComplete,
  onRemove,
  onStartTimer,
}: SetRowProps) {
  const repsColor = getRepsColor(set.reps, repRange);
  const repsInRange = repRange && set.reps > 0 && set.reps >= repRange.min && set.reps <= repRange.max;

  return (
    <div className={`${styles.setRowContainer} ${set.isCompleted ? styles.setRowCompleted : ''}`}>
      {/* Set Number */}
      <div className={`${styles.setNumberBox} ${set.isPR ? styles.setNumberBoxPR : ''}`}>
        <span className={`${styles.setNumberText} ${set.isPR ? styles.setNumberTextPR : ''}`}>
          {set.isPR ? '★' : setNumber}
        </span>
      </div>

      {/* Gewicht */}
      <NumericInput
        value={set.weight}
        onChange={onUpdateWeight}
        step={2.5}
        placeholder={isBodyweight ? 'BW' : '0'}
        style={{
          flex: 1,
          opacity: set.isCompleted ? 0.55 : 1,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Wiederholungen — colored by in/out of rep range */}
      <NumericInput
        value={set.reps}
        onChange={onUpdateReps}
        step={1}
        placeholder="0"
        style={{
          flex: 1,
          opacity: set.isCompleted ? 0.55 : 1,
          transition: 'opacity 0.2s ease',
          borderColor:
            set.reps > 0 && repRange
              ? repsInRange
                ? `${colors.success}70`
                : '#FF950070'
              : undefined,
          color:
            set.reps > 0 && repRange
              ? repsColor
              : colors.textPrimary,
        }}
      />

      {/* Volumen (readonly) */}
      <div className={styles.volumeContainer}>
        <div
          className={`${styles.volumeText} ${!(set.weight > 0 && set.reps > 0) ? styles.volumeTextFaint : ''}`}
          style={{ color: set.weight > 0 && set.reps > 0 ? colors.volumeColor : undefined }}
        >
          {set.weight > 0 && set.reps > 0 ? `${set.weight * set.reps}` : '—'}
        </div>
      </div>

      {/* Complete / Delete */}
      <div className={styles.actionsContainer}>
        <button
          onClick={() => {
            onToggleComplete();
            if (!set.isCompleted && onStartTimer) {
              onStartTimer();
            }
          }}
          className={styles.completeBtn}
        >
          {set.isCompleted ? (
            <CheckCircle2 size={22} color={colors.success} style={{ filter: `drop-shadow(0 0 4px ${colors.success}80)` }} />
          ) : (
            <Circle size={22} color={colors.border} />
          )}
        </button>

        <button
          onClick={onRemove}
          className={styles.deleteBtn}
        >
          <Trash2 size={14} color={colors.danger} />
        </button>
      </div>
    </div>
  );
}
