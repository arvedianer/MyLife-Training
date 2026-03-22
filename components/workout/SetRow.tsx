'use client';

import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { colors } from '@/constants/tokens';
import { NumericInput } from '@/components/ui/Input';
import type { SetEntry } from '@/types/workout';
import { formatOneRepMax } from '@/utils/oneRepMax';
import styles from './SetRow.module.css';

interface SetRowProps {
  set: SetEntry;
  setNumber: number;
  exerciseId: string;
  repRange?: { min: number; max: number };
  isBodyweight?: boolean;
  isUnilateral?: boolean;
  onUpdateWeight: (weight: number) => void;
  onUpdateReps: (reps: number) => void;
  onUpdateRepsL?: (repsL: number) => void;
  onUpdateRepsR?: (repsR: number) => void;
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
  isUnilateral,
  onUpdateWeight,
  onUpdateReps,
  onUpdateRepsL,
  onUpdateRepsR,
  onToggleComplete,
  onRemove,
  onStartTimer,
  isCardio,
  previousWeight,
  previousReps,
}: SetRowProps) {
  const [localRepsL, setLocalRepsL] = useState<number | undefined>(undefined);
  const [localRepsR, setLocalRepsR] = useState<number | undefined>(undefined);

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
      {/* Set Number */}
      <div style={{ display: 'flex', alignItems: 'center', width: 28 }}>
        <div className={`${styles.setNumberBox} ${getSetTypeClass()}`}>
          <span className={`${styles.setNumberText} ${getSetTypeTextClass()}`}>
            {set.isPR ? '★' : getSetTypeChar()}
          </span>
        </div>
      </div>

      {/* Gewicht — always one shared input */}
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

      {/* Wiederholungen — L/R side-by-side for unilateral, single input otherwise */}
      {isUnilateral ? (
        <div className={styles.unilateralReps} style={{ opacity: set.isCompleted ? 0.55 : 1, transition: 'opacity 0.2s ease' }}>
          <div className={styles.sideRepInput}>
            <span className={styles.sideLabel}>L</span>
            <NumericInput
              value={localRepsL ?? set.repsL ?? set.reps}
              onChange={(val) => {
                setLocalRepsL(val);
                onUpdateRepsL?.(val);
              }}
              step={1}
              min={1}
              placeholder={String(set.repsL ?? set.reps ?? previousReps ?? 10)}
              ghost={localRepsL === undefined && !set.repsL && set.reps === 0 && previousReps !== undefined}
              style={{ flex: 1 }}
            />
          </div>
          <div className={styles.sideRepInput}>
            <span className={styles.sideLabel}>R</span>
            <NumericInput
              value={localRepsR ?? set.repsR ?? set.reps}
              onChange={(val) => {
                setLocalRepsR(val);
                onUpdateRepsR?.(val);
              }}
              step={1}
              min={1}
              placeholder={String(set.repsR ?? set.reps ?? previousReps ?? 10)}
              ghost={localRepsR === undefined && !set.repsR && set.reps === 0 && previousReps !== undefined}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      ) : (
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
      )}

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

        {set.isCompleted && set.weight > 0 && set.reps > 0 && (
          <span style={{
            fontSize: '10px',
            color: colors.textFaint,
            fontFamily: 'var(--font-courier, monospace)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            marginLeft: '2px',
          }}>
            {formatOneRepMax(set.weight, set.reps)}
          </span>
        )}

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
