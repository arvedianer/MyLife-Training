'use client';

import { Plus, ChevronDown, ChevronUp, Trash2, HelpCircle, Target, Timer, TrendingUp, Check, ArrowUp, ArrowDown, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { SetRow } from './SetRow';
import { Badge } from '@/components/ui/Badge';
import type { WorkoutExercise } from '@/types/workout';
import type { Exercise } from '@/types/exercises';
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

interface AiAlternative {
  alternative: string;
  reason: string;
  weightNote?: string;
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
  onMoveUp,
  onMoveDown,
}: ExerciseCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [scienceExpanded, setScienceExpanded] = useState(false);
  const [customRest, setCustomRest] = useState<number | null>(null);
  const [isEditingRest, setIsEditingRest] = useState(false);
  const [showDeviceBusy, setShowDeviceBusy] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiAlternative | null>(null);

  const { exercise, sets } = workoutExercise;
  const completedSets = sets.filter((s) => s.isCompleted).length;
  const isFullyCompleted = sets.length > 0 && completedSets === sets.length;
  const isBodyweight = exercise.equipment?.includes('bodyweight') || exercise.defaultWeight === 0;

  useEffect(() => {
    if (isFullyCompleted) {
      setCollapsed(true);
    }
  }, [isFullyCompleted]);

  // Use optional custom override, else exercise specific, else fallback
  const restSeconds = customRest ?? exercise.restSeconds ?? restTimerDefault;

  const fetchAlternative = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: 'device_busy',
          userInput: exercise.nameDE,
        }),
      });
      const data = await res.json() as AiAlternative;
      setAiResult(data);
    } catch {
      setAiResult({ alternative: 'Kurzhantel-Variante', reason: 'Gleiche Muskelgruppe', weightNote: '' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenDeviceBusy = () => {
    setShowDeviceBusy(true);
    setAiResult(null);
    fetchAlternative();
  };

  return (
    <div className={`${styles.exerciseCard} ${isFullyCompleted ? styles.cardBgCompleted : styles.cardBgNormal}`}>
      {/* Header */}
      <div
        className={`${styles.headerContainer} ${collapsed ? '' : styles.headerBorder} ${isFullyCompleted ? styles.headerBgCompleted : styles.headerBgNormal}`}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <h3 className={`${styles.exerciseTitle} ${isFullyCompleted ? styles.exerciseTitleCompleted : styles.exerciseTitleNormal}`}>
              {exercise.nameDE}
            </h3>
            {isFullyCompleted && <Check size={18} color={colors.success} />}
          </div>

          {/* Progress + Science badges */}
          <div className={styles.badgesContainer}>
            <Badge variant="muted">
              {completedSets}/{sets.length} Sätze
            </Badge>

            {/* Rep range target */}
            {exercise.repRange && (
              <div className={styles.badgeAccentBox}>
                <Target size={10} color={colors.accent} />
                <span className={styles.monoSmAccent}>
                  {exercise.repRange.min}–{exercise.repRange.max} Wdh.
                </span>
              </div>
            )}

            {/* Rest time */}
            <div className={styles.badgeIconBox}>
              <Timer size={10} color={colors.textMuted} />
              {isEditingRest ? (
                <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                  <button
                    onClick={() => setCustomRest(Math.max(15, restSeconds - 15))}
                    className={`${styles.hoverBtn} ${styles.opacityHover}`}
                    style={{ padding: '0 4px', color: colors.textPrimary }}
                    aria-label="Decrease Rest"
                  >
                    -
                  </button>
                  <span className={styles.monoSmMuted} style={{ color: colors.textPrimary }}>{restSeconds}s</span>
                  <button
                    onClick={() => setCustomRest(Math.min(300, restSeconds + 15))}
                    className={`${styles.hoverBtn} ${styles.opacityHover}`}
                    style={{ padding: '0 4px', color: colors.textPrimary }}
                    aria-label="Increase Rest"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setIsEditingRest(false)}
                    className={`${styles.hoverBtn} ${styles.opacityHover} ${styles.labelAccent}`}
                    style={{ padding: '0 4px' }}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingRest(true)}
                  className={styles.hoverBtn}
                  style={{ padding: 0 }}
                >
                  <span className={styles.monoSmMuted}>
                    {restSeconds}s
                  </span>
                </button>
              )}
            </div>

            {/* Gerät besetzt */}
            <button
              onClick={handleOpenDeviceBusy}
              className={styles.scienceToggle}
              style={{ borderColor: `${colors.warning}40`, color: colors.warning }}
            >
              <AlertTriangle size={10} color={colors.warning} />
              <span style={{ ...typography.label, fontSize: '10px', color: colors.warning }}>Besetzt</span>
            </button>

            {/* Science note toggle (now always visible to explain reps too) */}
            <button
              onClick={() => setScienceExpanded((v) => !v)}
              className={`${styles.scienceToggle} ${scienceExpanded ? styles.scienceToggleExpanded : styles.scienceToggleClosed}`}
              aria-expanded={scienceExpanded}
            >
              <HelpCircle size={10} color={scienceExpanded ? colors.accent : colors.textFaint} />
              <span className={scienceExpanded ? styles.labelAccent : styles.labelFaint}>
                Warum?
              </span>
            </button>
          </div>

          {/* Science note expanded */}
          {scienceExpanded && (
            <div className={styles.scienceCard}>
              {exercise.scienceNote && (
                <div>
                  <span className={styles.labelAccent}>Übungs-Fokus:</span>
                  <p className={styles.bodySmMutedLine18} style={{ marginTop: '2px' }}>
                    {exercise.scienceNote}
                  </p>
                </div>
              )}

              <div>
                <span className={styles.labelAccent}>Warum {exercise.repRange ? `${exercise.repRange.min}–${exercise.repRange.max}` : '6–8'} Wiederholungen?</span>
                <p className={styles.bodySmMutedLine18} style={{ marginTop: '2px' }}>
                  Dieser Bereich bietet die optimale Balance aus mechanischer Spannung und Muskelermüdung. Es ist der Sweetspot, um effektiv Muskelmasse (Hypertrophie) aufzubauen und gleichzeitig Kraft zu steigern.
                </p>
              </div>
            </div>
          )}

          {/* KI Suggestion — always visible as compact inline row */}
          {overloadSuggestion && (
            <button
              onClick={() => onApplySuggestion?.(overloadSuggestion.weight, overloadSuggestion.reps)}
              className={styles.suggestionInline}
              title="Tippen um auf ersten offenen Satz anzuwenden"
            >
              <TrendingUp size={11} color={colors.accent} />
              <span className={styles.monoSmAccent}>
                {overloadSuggestion.weight} kg × {overloadSuggestion.reps} Wdh.
              </span>
              <span className={styles.monoSmMuted} style={{ fontSize: '9px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                — {overloadSuggestion.reason}
              </span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0, marginLeft: spacing[2], alignItems: 'center' }}>
          {/* Reorder Buttons */}
          {(onMoveUp || onMoveDown) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: spacing[1] }}>
              {onMoveUp && (
                <button
                  onClick={onMoveUp}
                  aria-label="Nach oben verschieben"
                  className={`${styles.hoverBtn} ${styles.opacityHover}`}
                  style={{ padding: '2px' }}
                >
                  <ArrowUp size={14} color={colors.textPrimary} />
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={onMoveDown}
                  aria-label="Nach unten verschieben"
                  className={`${styles.hoverBtn} ${styles.opacityHover}`}
                  style={{ padding: '2px' }}
                >
                  <ArrowDown size={14} color={colors.textPrimary} />
                </button>
              )}
            </div>
          )}

          {/* Delete Exercise */}
          <button
            onClick={onRemoveExercise}
            aria-label="Übung entfernen"
            className={`${styles.hoverBtn} ${styles.dangerBtn}`}
          >
            <Trash2 size={16} color={colors.danger} />
          </button>

          {/* Collapse */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Aufklappen" : "Zuklappen"}
            className={`${styles.hoverBtn} ${styles.collapseBtn}`}
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
          <div className={styles.tableHeader}>
            <div style={{ width: '28px' }} />
            <div className={styles.headerCell}>{isBodyweight ? '+KG' : 'KG'}</div>
            <div className={styles.headerCell}>WDH</div>
            <div className={styles.headerCellRight}>VOL</div>
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

      {/* Gerät besetzt Modal */}
      {showDeviceBusy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.65)',
          }}
          onClick={() => setShowDeviceBusy(false)}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: colors.bgElevated,
              borderTop: `1px solid ${colors.border}`,
              borderRadius: `${radius.xl} ${radius.xl} 0 0`,
              padding: spacing[6],
              paddingBottom: `calc(${spacing[6]} + env(safe-area-inset-bottom))`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <AlertTriangle size={18} color={colors.warning} />
                <span style={{ ...typography.h3, color: colors.textPrimary }}>Gerät besetzt</span>
              </div>
              <button onClick={() => setShowDeviceBusy(false)} style={{ padding: spacing[1] }}>
                <X size={20} color={colors.textMuted} />
              </button>
            </div>

            <p style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[5] }}>
              Alternative für <strong style={{ color: colors.textPrimary }}>{exercise.nameDE}</strong>
            </p>

            {/* Loading state */}
            {aiLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], padding: spacing[4], backgroundColor: colors.bgCard, borderRadius: radius.lg }}>
                <RefreshCw size={16} color={colors.accent} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ ...typography.body, color: colors.textMuted }}>KI sucht Alternative...</span>
              </div>
            )}

            {/* Result */}
            {!aiLoading && aiResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                <div style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  padding: spacing[4],
                }}>
                  <div style={{ ...typography.h3, color: colors.accent, marginBottom: spacing[1] }}>
                    {aiResult.alternative}
                  </div>
                  <div style={{ ...typography.bodySm, color: colors.textMuted }}>{aiResult.reason}</div>
                  {aiResult.weightNote && (
                    <div style={{ ...typography.bodySm, color: colors.warning, marginTop: spacing[2] }}>
                      {aiResult.weightNote}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: spacing[3] }}>
                  <button
                    onClick={() => setShowDeviceBusy(false)}
                    style={{
                      flex: 1,
                      padding: spacing[3],
                      backgroundColor: colors.bgHighest,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.md,
                      color: colors.textMuted,
                      ...typography.body,
                      cursor: 'pointer',
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      // Find exercise in our library by name (fuzzy)
                      import('@/constants/exercises').then(({ exercises: exList }) => {
                        const alt = aiResult.alternative.toLowerCase();
                        const match = exList.find(
                          (ex: Exercise) => ex.nameDE.toLowerCase() === alt || ex.name.toLowerCase() === alt
                        );
                        if (match && onReplaceExercise) {
                          onReplaceExercise(match);
                        }
                        setShowDeviceBusy(false);
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: spacing[3],
                      backgroundColor: colors.accent,
                      border: 'none',
                      borderRadius: radius.md,
                      color: colors.bgPrimary,
                      ...typography.body,
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Übernehmen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
