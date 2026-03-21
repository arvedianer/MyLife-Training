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
  isCardio?: boolean;
  /** Weight from last session — shown as ghost placeholder when field is empty */
  previousWeight?: number;
  /** Reps from last session — shown as ghost placeholder when field is empty */
  previousReps?: number;
}

// Removed getRepsColor — rep-range color highlighting removed

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
  isCardio,
  previousWeight,
  previousReps,
}: SetRowProps) {

  const handleToggle = () => {
    if (!set.isCompleted) {
      // Auto-fill ghost values when completing with empty fields.
      // Guard previousWeight > 0: avoids overwriting intentional zero-weight entries
      // (e.g. bodyweight exercises where weight=0 is a deliberate choice, not an empty field).
      if (set.weight === 0 && previousWeight !== undefined && previousWeight > 0) {
        onUpdateWeight(previousWeight);
      }
      if (set.reps === 0 && previousReps !== undefined && previousReps > 0) {
        onUpdateReps(previousReps);
      }
    }
    onToggleComplete();
  };

  const getSetTypeChar = () => {
    switch (set.type) {
      case 'warmup': return 'W';
      case 'dropset': return 'D';
      case 'fail': return 'F';
      case 'superset': return 'S';
      default: return setNumber;
    }
  };

  const getSetTypeClass = () => {
    if (set.type === 'warmup') return styles.setNumberBoxWarmup;
    if (set.type === 'dropset') return styles.setNumberBoxDropset;
    if (set.isPR) return styles.setNumberBoxPR;
    return '';
  };

  const getSetTypeTextClass = () => {
    if (set.type === 'warmup') return styles.setNumberTextWarmup;
    if (set.type === 'dropset') return styles.setNumberTextDropset;
    if (set.isPR) return styles.setNumberTextPR;
    return '';
  };

  return (
    <div className={`${styles.setRowContainer} ${set.isCompleted ? styles.setRowCompleted : ''}`}>
      {/* Set Number & Side Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', width: 44 }}>
        {set.side && set.side !== 'both' && (
          <div className={`${styles.sideIndicator} ${styles.sideIndicatorActive}`}>
            {set.side === 'left' ? 'L' : 'R'}
          </div>
        )}
        <div className={`${styles.setNumberBox} ${getSetTypeClass()}`}>
          <span className={`${styles.setNumberText} ${getSetTypeTextClass()}`}>
            {set.isPR ? '★' : getSetTypeChar()}
          </span>
        </div>
      </div>

      {/* Gewicht */}
      <NumericInput
        value={set.weight}
        onChange={onUpdateWeight}
        step={isCardio ? 0.5 : 2.5}
        placeholder={
          set.weight === 0 && previousWeight !== undefined
            ? String(previousWeight)
            : isCardio ? 'km' : (isBodyweight ? 'BW' : '0')
        }
        ghost={set.weight === 0 && previousWeight !== undefined}
        style={{
          flex: 1,
          opacity: set.isCompleted ? 0.55 : 1,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Wiederholungen */}
      <NumericInput
        value={set.reps}
        onChange={onUpdateReps}
        step={isCardio ? 1 : 1}
        placeholder={
          set.reps === 0 && previousReps !== undefined
            ? String(previousReps)
            : isCardio ? 'min' : '0'
        }
        ghost={set.reps === 0 && previousReps !== undefined}
        style={{
          flex: 1,
          opacity: set.isCompleted ? 0.55 : 1,
          transition: 'opacity 0.2s ease',
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
            handleToggle();
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
