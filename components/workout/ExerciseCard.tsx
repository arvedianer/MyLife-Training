'use client';

import { Plus, ChevronDown, ChevronUp, Target, TrendingUp, Check, ArrowLeftRight, Loader2, X, RefreshCw, GripVertical, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { SetRow } from './SetRow';
import { ExerciseSettingsSheet } from './ExerciseSettingsSheet';
import type { WorkoutExercise } from '@/types/workout';
import type { Exercise } from '@/types/exercises';
import { exercises as exerciseDb, findExerciseByName } from '@/constants/exercises';
import { EQUIPMENT_LABELS } from '@/utils/variations';
import styles from './ExerciseCard.module.css';

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
  onReplaceExercise?: (newExercise: Exercise) => void;
  onStartTimer: (seconds: number) => void;
  onApplySuggestion?: (weight: number, reps: number) => void;
  onToggleUnilateral?: () => void;
  onChangeSetType?: (setId: string, type: string) => void;
  onUpdateExercise?: (updates: Partial<WorkoutExercise>) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
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
  onReplaceExercise,
  onStartTimer,
  onApplySuggestion,
  onToggleUnilateral,
  onChangeSetType,
  onUpdateExercise,
  dragHandleProps,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [customRest, setCustomRest] = useState<number | null>(null);
  const [busyLoading, setBusyLoading] = useState(false);
  const [busyAlts, setBusyAlts] = useState<{ name: string; reason: string }[] | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleDeviceBusy = async () => {
    setBusyLoading(true);
    setBusyAlts(null);

    // Same-muscle exercises from DB (excluding current) — sent to AI so it picks exact names
    const sameMusclExercises = exerciseDb
      .filter((e) => e.primaryMuscle === exercise.primaryMuscle && e.id !== exercise.id)
      .map((e) => e.nameDE)
      .slice(0, 15);

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: 'device_busy',
          userInput: exercise.nameDE,
          availableExercises: sameMusclExercises,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.alternatives) && data.alternatives.length > 0) {
        setBusyAlts(data.alternatives);
      } else {
        // Fallback: use real DB exercises if AI returned nothing useful
        setBusyAlts(
          sameMusclExercises.slice(0, 3).map((name) => ({
            name,
            reason: 'Alternative aus der Übungsdatenbank',
          })),
        );
      }
    } catch {
      // Offline fallback: real DB exercises, not generic placeholder strings
      setBusyAlts(
        sameMusclExercises.slice(0, 3).map((name) => ({
          name,
          reason: 'Alternative aus der Übungsdatenbank',
        })),
      );
    } finally {
      setBusyLoading(false);
    }
  };

  const handleSelectAlternative = (altName: string) => {
    // Use fuzzy matching so AI names like "Kniebeugen" match "Langhantel Kniebeugen"
    const found = findExerciseByName(altName);
    if (found && onReplaceExercise) {
      onReplaceExercise(found);
    }
    setBusyAlts(null);
  };

  const { exercise, sets } = workoutExercise;
  const completedSets = sets.filter((s) => s.isCompleted).length;
  const isFullyCompleted = sets.length > 0 && completedSets === sets.length;
  const isBodyweight = exercise.equipment?.includes('bodyweight') || exercise.defaultWeight === 0;
  const isCardio = !!exercise.isCardio;

  useEffect(() => {
    if (isFullyCompleted) {
      setCollapsed(true);
    }
  }, [isFullyCompleted]);

  // Use optional custom override, else exercise specific, else fallback
  const restSeconds = customRest ?? exercise.restSeconds ?? restTimerDefault;

  return (
    <div className={`${styles.exerciseCard} ${isFullyCompleted ? styles.cardBgCompleted : styles.cardBgNormal}`}>
      {/* Header */}
      <div
        className={`${styles.headerContainer} ${collapsed ? '' : styles.headerBorder} ${isFullyCompleted ? styles.headerBgCompleted : styles.headerBgNormal}`}
      >
        {/* Drag Handle */}
        <div className={styles.dragHandle} {...(dragHandleProps ?? {})}>
          <GripVertical size={18} color={colors.textFaint} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Exercise Name — strikethrough + dimmed when done */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <h3 className={`${styles.exerciseTitle} ${isFullyCompleted ? styles.exerciseTitleDone : ''}`}>
              {exercise.nameDE}
            </h3>
            {isFullyCompleted && <Check size={16} color={colors.success} />}
          </div>

          {/* Sub-info row */}
          <div className={styles.subInfo}>
            <span className={styles.muscleLabel}>{exercise.primaryMuscle}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.setsLabel}>{completedSets}/{sets.length} Sätze</span>
            {workoutExercise.equipment && (
              <>
                <span className={styles.dot}>·</span>
                <span className={styles.equipLabel}>{EQUIPMENT_LABELS[workoutExercise.equipment]}</span>
              </>
            )}
          </div>

          {/* Overload chip */}
          {overloadSuggestion && !isFullyCompleted && (
            <button
              onClick={() => onApplySuggestion?.(overloadSuggestion.weight, overloadSuggestion.reps)}
              className={styles.overloadChip}
              title="Tippen um auf ersten offenen Satz anzuwenden"
            >
              <TrendingUp size={11} color={colors.accent} />
              <span className={styles.monoSmAccent}>{overloadSuggestion.weight} kg × {overloadSuggestion.reps} Wdh.</span>
              <span className={styles.overloadReason}>{overloadSuggestion.reason}</span>
            </button>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className={styles.settingsBtn}
          aria-label="Übungseinstellungen"
        >
          <Settings size={18} color={colors.textMuted} />
        </button>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Aufklappen" : "Zuklappen"}
          className={`${styles.hoverBtn} ${styles.collapseBtn}`}
        >
          {collapsed ? <ChevronDown size={18} color={colors.textMuted} /> : <ChevronUp size={18} color={colors.textMuted} />}
        </button>
      </div>

      {/* Device Busy Alternative Card */}
      {busyAlts && (
        <div
          style={{
            margin: `0 ${spacing[4]} ${spacing[3]}`,
            padding: spacing[3],
            backgroundColor: `${colors.accent}08`,
            border: `1px solid ${colors.accent}25`,
            borderRadius: radius.lg,
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <RefreshCw size={12} color={colors.accent} />
              <span style={{ ...typography.label, color: colors.accent, fontSize: '10px' }}>ALTERNATIVE AUSWÄHLEN</span>
            </div>
            <button onClick={() => setBusyAlts(null)} style={{ padding: '2px' }}>
              <X size={14} color={colors.textFaint} />
            </button>
          </div>

          {/* Alternative buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {busyAlts.map((alt, i) => {
              const inDb = !!findExerciseByName(alt.name);
              return (
                <button
                  key={i}
                  onClick={() => handleSelectAlternative(alt.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing[2]} ${spacing[3]}`,
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s',
                    gap: spacing[2],
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = colors.accent; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                      <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600', fontSize: '13px' }}>
                        {alt.name}
                      </span>
                      {!inDb && (
                        <span style={{ ...typography.label, color: colors.textFaint, fontSize: '9px' }}>custom</span>
                      )}
                    </div>
                    <span style={{ ...typography.bodySm, color: colors.textMuted, fontSize: '11px' }}>{alt.reason}</span>
                  </div>
                  <ArrowLeftRight size={13} color={inDb ? colors.accent : colors.textDisabled} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sets */}
      {!collapsed && (
        <div style={{ padding: `0 ${spacing[4]}` }}>
          {/* Column Headers */}
          <div className={styles.tableHeader}>
            <div style={{ width: '28px' }} />
            <div className={styles.headerCell}>{isCardio ? 'KM' : (isBodyweight ? '+KG' : 'KG')}</div>
            <div className={styles.headerCell}>{isCardio ? 'MIN' : 'WDH'}</div>
            <div className={styles.headerCellRight}>{isCardio ? 'PACE' : 'VOL'}</div>
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
              isBodyweight={isBodyweight}
              onUpdateWeight={(weight) => onUpdateSet(set.id, { weight })}
              onUpdateReps={(reps) => onUpdateSet(set.id, { reps })}
              onToggleComplete={() => onToggleSet(set.id)}
              onRemove={() => onRemoveSet(set.id)}
              onStartTimer={() => onStartTimer(restSeconds)}
              isCardio={isCardio}
            />
          ))}

          {/* Add Set Button */}
          <button
            onClick={onAddSet}
            className={styles.addSetBtn}
          >
            <Plus size={14} />
            Satz hinzufügen
          </button>
        </div>
      )}

      <ExerciseSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        exercise={exercise}
        equipment={workoutExercise.equipment ?? 'barbell'}
        gymId={workoutExercise.gymId}
        isUnilateral={workoutExercise.isUnilateral}
        restSeconds={customRest ?? exercise.restSeconds ?? restTimerDefault}
        warmupEnabled={workoutExercise.warmupEnabled ?? false}
        warmupCount={workoutExercise.warmupSetsCount ?? 1}
        repRangeMin={exercise.repRange?.min ?? 6}
        repRangeMax={exercise.repRange?.max ?? 12}
        note={workoutExercise.note}
        onEquipmentChange={(eq) => onUpdateExercise?.({ equipment: eq })}
        onGymChange={(gymId) => onUpdateExercise?.({ gymId: gymId ?? undefined })}
        onUnilateralChange={(_val: boolean) => onToggleUnilateral?.()}
        onRestChange={(s) => setCustomRest(s)}
        onWarmupChange={(enabled, count) => onUpdateExercise?.({ warmupEnabled: enabled, warmupSetsCount: count })}
        onRepRangeChange={(_min, _max) => { /* stored in exercise, not workout state — skip for now */ }}
        onNoteChange={(note) => onUpdateExercise?.({ note })}
        onRemoveExercise={() => { setShowSettings(false); onRemoveExercise(); }}
        onReplaceExercise={() => setShowSettings(false)}
        onShowHistory={() => setShowSettings(false)}
      />

      {/* Device Busy — AI Alternative button (kept accessible via settings, but still available inline) */}
      {busyLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[2] }}>
          <Loader2 size={15} color={colors.accent} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </div>
  );
}
