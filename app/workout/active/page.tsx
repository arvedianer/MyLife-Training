'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Check, Clock, RotateCcw, Star, Mic, MicOff, Loader2 } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableExerciseCard } from '@/components/workout/SortableExerciseCard';
import { FinishWorkoutModal } from '@/components/workout/FinishWorkoutModal';
import { RestTimerOverlay } from '@/components/overlays/RestTimerOverlay';
import { PRMomentOverlay } from '@/components/overlays/PRMomentOverlay';
import { CancelWorkoutOverlay } from '@/components/overlays/CancelWorkoutOverlay';
import { useWorkout } from '@/hooks/useWorkout';
import { useRestTimer } from '@/hooks/useTimer';
import { useUserStore } from '@/store/userStore';
import { useHistoryStore } from '@/store/historyStore';
import { calculateOverloadSuggestion } from '@/utils/overload';
import { formatDuration } from '@/utils/dates';
import { findExerciseByName } from '@/constants/exercises';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import styles from './page.module.css';

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const { restTimerDefault } = useUserStore();
  const {
    activeWorkout,
    completedSetsCount,
    totalSetsCount,
    completeWorkout,
    cancelWorkout,
    checkSetForPR,
    addSet,
    updateSet,
    removeSet,
    toggleSetComplete,
    removeExercise,
    replaceExercise,
    moveExercise,
    startRestTimer,
    undoLastSet,
    undoStack,
    toggleUnilateral,
    changeSetType,
    reorderExercises,
  } = useWorkout();

  const { updateWorkoutExercise } = useWorkoutStore();
  const restTimer = useRestTimer();
  const { sessions } = useHistoryStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeWorkout) return;
    const oldIndex = activeWorkout.exercises.findIndex(e => e.id === String(active.id));
    const newIndex = activeWorkout.exercises.findIndex(e => e.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(activeWorkout.exercises, oldIndex, newIndex);
    reorderExercises(reordered);
  };

  const [elapsed, setElapsed] = useState(0);
  const [showPR, setShowPR] = useState(false); // end-of-workout overlay
  const [showCancel, setShowCancel] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [prExerciseName, setPRExerciseName] = useState('');
  const [prBannerName, setPRBannerName] = useState<string | null>(null); // inline banner during workout

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFinishing = useRef(false); // prevents the "no workout" redirect from firing during completion

  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);

  // Pending confirmation: KI hat etwas verstanden, User muss bestätigen
  interface PendingConfirm {
    exerciseId?: string;
    exerciseName: string;
    isNew: boolean;       // Übung noch nicht im Workout
    weight: number;
    reps: number;
    resolvedExercise?: ReturnType<typeof findExerciseByName>; // für isNew-Fall
  }
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  // Wake Lock — keep screen on during active workout
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => { });
    }
    return () => { lock?.release().catch(() => { }); };
  }, []);

  // Workout-Timer — clear before set to prevent accumulation
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (activeWorkout) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeWorkout]);

  // Redirect wenn kein aktives Workout — aber nicht wenn wir gerade abschließen
  useEffect(() => {
    if (!activeWorkout && !isFinishing.current) {
      router.replace('/start');
    }
  }, [activeWorkout, router]);

  const handleClosePR = useCallback(() => setShowPR(false), []);

  // Finishing: blank screen while navigation happens (avoids redirect to /start)
  if (!activeWorkout) return null;

  const doFinish = () => {
    isFinishing.current = true;
    const session = completeWorkout();
    if (session) {
      router.replace(`/workout/summary?session=${session.id}`);
    } else {
      isFinishing.current = false;
    }
  };

  const handleFinish = () => {
    if (!activeWorkout) return;
    const incompleteSets = activeWorkout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => !s.isCompleted).length,
      0
    );
    if (incompleteSets > 0) {
      setShowFinishModal(true);
    } else {
      doFinish();
    }
  };

  const handleMarkAllDone = () => {
    setShowFinishModal(false);
    if (!activeWorkout) return;
    const storeState = useWorkoutStore.getState();
    for (const ex of activeWorkout.exercises) {
      for (const s of ex.sets) {
        if (!s.isCompleted) {
          storeState.toggleSetComplete(ex.id, s.id);
        }
      }
    }
    doFinish();
  };

  const handleDiscardIncomplete = () => {
    setShowFinishModal(false);
    // completeWorkout() already filters out exercises with no completed sets,
    // and only saves completed sets — incomplete sets are simply not included in the session.
    doFinish();
  };

  const handleCancelClick = () => {
    setShowCancel(true);
  };

  const handleConfirmCancel = () => {
    isFinishing.current = true; // prevent useEffect double-redirect
    cancelWorkout();
    setShowCancel(false);
    router.replace('/start');
  };

  const handleApplySuggestion = (exerciseId: string, weight: number, reps: number) => {
    const workoutEx = activeWorkout.exercises.find((e) => e.id === exerciseId);
    const firstUncompleted = workoutEx?.sets.find((s) => !s.isCompleted);
    if (firstUncompleted) {
      updateSet(exerciseId, firstUncompleted.id, { weight, reps });
    }
  };

  const handleToggleSet = (exerciseId: string, setId: string) => {
    const workoutExercise = activeWorkout.exercises.find((e) => e.id === exerciseId);
    const set = workoutExercise?.sets.find((s) => s.id === setId);

    // PR-Check: nur beim Abschließen (nicht beim Rückgängigmachen)
    if (workoutExercise && set && !set.isCompleted && set.weight > 0 && set.reps > 0) {
      if (checkSetForPR(workoutExercise.exercise.id, set.weight, set.reps)) {
        // Show inline banner (not full overlay) during workout
        setPRBannerName(workoutExercise.exercise.nameDE);
        setTimeout(() => setPRBannerName(null), 3000);
      }
    }

    toggleSetComplete(exerciseId, setId);
    // Rest-Timer wird von SetRow → ExerciseCard → onStartTimer gehandelt
  };

  // Step 1: Parse voice → set pendingConfirm (don't execute yet)
  const handleParseSet = async (text: string) => {
    if (!text.trim() || !activeWorkout) return;
    setIsParsing(true);
    setVoiceError(null);
    setPendingConfirm(null);
    try {
      const res = await fetch('/api/chat/parse-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          exercises: activeWorkout.exercises.map(e => ({ id: e.id, name: e.exercise.nameDE || e.exercise.name }))
        })
      });
      const data = await res.json();

      if (data.error) {
        setVoiceError('Konnte Eingabe nicht verstehen. Bitte nochmal versuchen.');
        setTimeout(() => setVoiceError(null), 3500);
        return;
      }

      if (data.exerciseId) {
        // Existing exercise in workout — show confirmation
        const exItem = activeWorkout.exercises.find(e => e.id === data.exerciseId);
        if (exItem) {
          setPendingConfirm({
            exerciseId: exItem.id,
            exerciseName: exItem.exercise.nameDE || exItem.exercise.name,
            isNew: false,
            weight: data.weight ?? 0,
            reps: data.reps ?? 0,
          });
        }
      } else if (data.newExerciseName) {
        // New exercise — resolve from DB, then show confirmation
        const resolved = findExerciseByName(data.newExerciseName)
          ?? useExerciseStore.getState().customExercises.find(
            (e) => e.nameDE.toLowerCase().includes(data.newExerciseName.toLowerCase())
              || e.name.toLowerCase().includes(data.newExerciseName.toLowerCase())
          );

        setPendingConfirm({
          exerciseName: resolved?.nameDE ?? data.newExerciseName,
          isNew: true,
          weight: data.weight ?? 0,
          reps: data.reps ?? 0,
          resolvedExercise: resolved ?? undefined,
        });
      }
    } catch {
      setVoiceError('Fehler bei der Spracheingabe.');
      setTimeout(() => setVoiceError(null), 3500);
    } finally {
      setIsParsing(false);
    }
  };

  // Step 2: User confirms → execute the action
  const handleConfirmVoice = () => {
    if (!pendingConfirm || !activeWorkout) return;
    const { exerciseId, isNew, weight, reps, resolvedExercise, exerciseName } = pendingConfirm;
    setPendingConfirm(null);

    if (!isNew && exerciseId) {
      // Update existing exercise set
      const exItem = activeWorkout.exercises.find(e => e.id === exerciseId);
      if (exItem) {
        const uncompleted = exItem.sets.filter(s => !s.isCompleted);
        if (uncompleted.length > 0) {
          updateSet(exItem.id, uncompleted[0].id, { weight, reps });
          handleToggleSet(exItem.id, uncompleted[0].id);
        } else {
          setVoiceError(`${exerciseName} hat keine offenen Sätze mehr.`);
          setTimeout(() => setVoiceError(null), 3000);
          return;
        }
      }
    } else {
      // Add new exercise to workout
      let globalEx = resolvedExercise;

      if (!globalEx) {
        // Create custom exercise on the fly
        const newId = `custom-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        globalEx = {
          id: newId,
          name: exerciseName,
          nameDE: exerciseName,
          primaryMuscle: 'core',
          secondaryMuscles: [],
          equipment: [],
          category: 'compound',
          defaultSets: 3,
          defaultReps: 10,
          defaultWeight: 0,
          repRange: { min: 8, max: 12 },
          restSeconds: 90,
          scienceNote: 'Manuell per Sprache hinzugefügt',
          createdBy: 'coach',
        } as NonNullable<ReturnType<typeof findExerciseByName>>;
        useExerciseStore.getState().addCustomExercise(globalEx);
      }

      useWorkoutStore.getState().addExercise(globalEx);

      setTimeout(() => {
        const state = useWorkoutStore.getState().activeWorkout;
        if (!state) return;
        const newExItem = state.exercises[state.exercises.length - 1];
        if (newExItem && newExItem.exercise.id === globalEx!.id) {
          const uncomp = newExItem.sets.filter(s => !s.isCompleted);
          if (uncomp.length > 0 && (weight > 0 || reps > 0)) {
            useWorkoutStore.getState().updateSet(newExItem.id, uncomp[0].id, { weight, reps });
            useWorkoutStore.getState().toggleSetComplete(newExItem.id, uncomp[0].id);
          }
        }
      }, 80);
    }

    const wText = weight > 0 ? `${weight}kg` : 'Eigengewicht';
    setVoiceMessage(`✓ Eingetragen: ${exerciseName}\n${wText} × ${reps} Wdh.`);
    setTimeout(() => setVoiceMessage(null), 3500);
  };

  const toggleListening = () => {
    setVoiceError(null);
    setVoiceMessage(null);
    if (isListening) {
      manualStopRef.current = true;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('Spracheingabe nicht unterstützt.');
      return;
    }

    try {
      manualStopRef.current = false;
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.lang = 'de-DE';
      recognition.interimResults = false;
      recognition.continuous = true;

      recognition.onresult = (e: any) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          handleParseSet(finalTranscript);
        }
      };

      recognition.onend = () => {
        if (!manualStopRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          manualStopRef.current = true;
          setVoiceError('Mikrofon-Zugriff verweigert.');
          setIsListening(false);
          recognitionRef.current = null;
        } else if (e.error !== 'no-speech') {
          manualStopRef.current = true;
          setVoiceError('Fehler bei der Aufnahme.');
          setIsListening(false);
          recognitionRef.current = null;
        }
      };

      recognition.start();
      setIsListening(true);
    } catch {
      setVoiceError('Aufnahme konnte nicht gestartet werden.');
    }
  };

  const progress = totalSetsCount > 0 ? completedSetsCount / totalSetsCount : 0;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.liveIndicatorContainer}>
            <div className={styles.liveDot} />
            <span className={styles.liveText}>LIVE</span>
          </div>
          <h1 className={styles.workoutTitle}>
            {activeWorkout.plannedSplit ?? 'Freies Training'}
          </h1>
        </div>

        <div className={styles.headerActions}>
          {/* Timer */}
          <div className={styles.timerContainer}>
            <Clock size={14} color={colors.textMuted} />
            <span className={styles.timerText}>
              {formatDuration(elapsed)}
            </span>
          </div>

          {/* Undo last completed set */}
          {undoStack.length > 0 && (
            <button
              onClick={undoLastSet}
              title="Letzten Satz rückgängig machen"
              className={styles.cancelBtn}
              style={{ opacity: 0.8 }}
            >
              <RotateCcw size={16} color={colors.warning} />
            </button>
          )}

          {/* Cancel */}
          <button
            onClick={handleCancelClick}
            className={styles.cancelBtn}
          >
            <X size={16} color={colors.textMuted} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Sets counter */}
      <div className={styles.setsCounterContainer}>
        <span className={styles.setsCounterText}>
          {completedSetsCount} / {totalSetsCount} Sätze abgeschlossen
        </span>
      </div>

      {/* Exercises (scrollable) */}
      <div className={styles.scrollContainer}>
        {activeWorkout.exercises.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <p className={styles.emptyStateText}>
              Noch keine Übungen hinzugefügt.
            </p>
            <Link href="/workout/add-exercise">
              <Button>
                <Plus size={16} />
                Übung hinzufügen
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={activeWorkout.exercises.map(e => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                  {activeWorkout.exercises.map((workoutExercise) => {
                    const suggestion = calculateOverloadSuggestion(
                      workoutExercise.exercise.id,
                      sessions,
                      workoutExercise.exercise.repRange?.min,
                      workoutExercise.exercise.repRange?.max
                    );
                    return (
                      <SortableExerciseCard
                        key={workoutExercise.id}
                        sortId={workoutExercise.id}
                        workoutExercise={workoutExercise}
                        restTimerDefault={restTimerDefault}
                        overloadSuggestion={suggestion}
                        onAddSet={() => addSet(workoutExercise.id)}
                        onUpdateSet={(setId, updates) => updateSet(workoutExercise.id, setId, updates)}
                        onToggleSet={(setId) => handleToggleSet(workoutExercise.id, setId)}
                        onRemoveSet={(setId) => removeSet(workoutExercise.id, setId)}
                        onRemoveExercise={() => removeExercise(workoutExercise.id)}
                        onReplaceExercise={(newEx) => replaceExercise(workoutExercise.id, newEx)}
                        onStartTimer={(seconds) => startRestTimer(seconds)}
                        onApplySuggestion={(w, r) => handleApplySuggestion(workoutExercise.id, w, r)}
                        onToggleUnilateral={() => toggleUnilateral(workoutExercise.id)}
                        onChangeSetType={(setId, type) => changeSetType(workoutExercise.id, setId, type as Parameters<typeof changeSetType>[2])}
                        onUpdateExercise={(updates) => updateWorkoutExercise(workoutExercise.id, updates)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {/* Bottom Actions moved inside the scrollable stream */}
            <div className={styles.bottomActions}>
              <Link href="/workout/add-exercise" style={{ flex: 1 }}>
                <Button variant="secondary" fullWidth>
                  <Plus size={16} />
                  Übung
                </Button>
              </Link>
              <Button
                fullWidth
                style={{ flex: 2 }}
                onClick={handleFinish}
                disabled={activeWorkout.exercises.length === 0}
              >
                <Check size={16} />
                Abschließen
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Voice Tracking FAB */}
      <div
        style={{
          position: 'fixed',
          bottom: '100px',
          right: spacing[4],
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: spacing[2],
        }}
      >
        {/* KI Confirmation Card — "Was hat die KI verstanden?" */}
        {pendingConfirm && (
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.accent}50`,
            borderRadius: radius.lg,
            padding: spacing[3],
            minWidth: '220px',
            maxWidth: '280px',
            boxShadow: `0 8px 24px ${colors.accent}25`,
          }}>
            <p style={{ ...typography.label, color: colors.accent, fontSize: '9px', marginBottom: spacing[1] }}>
              {pendingConfirm.isNew ? 'NEUE ÜBUNG ERKANNT' : 'KI HAT VERSTANDEN'}
            </p>
            <p style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700', marginBottom: '2px' }}>
              {pendingConfirm.exerciseName}
            </p>
            <p style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[3] }}>
              {pendingConfirm.weight > 0 ? `${pendingConfirm.weight} kg` : 'Eigengewicht'} × {pendingConfirm.reps} Wdh.
              {!pendingConfirm.resolvedExercise && pendingConfirm.isNew && (
                <span style={{ color: colors.warning, display: 'block', fontSize: '10px', marginTop: '2px' }}>
                  ⚠ Nicht in DB — wird als Custom angelegt
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: spacing[2] }}>
              <button
                onClick={handleConfirmVoice}
                style={{
                  flex: 1, padding: `${spacing[2]} ${spacing[2]}`,
                  backgroundColor: colors.accent, border: 'none',
                  borderRadius: radius.md, cursor: 'pointer',
                  ...typography.label, color: colors.bgPrimary, fontWeight: '700',
                }}
              >
                ✓ Eintragen
              </button>
              <button
                onClick={() => setPendingConfirm(null)}
                style={{
                  flex: 1, padding: `${spacing[2]} ${spacing[2]}`,
                  backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`,
                  borderRadius: radius.md, cursor: 'pointer',
                  ...typography.label, color: colors.textMuted,
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {voiceMessage && (
          <div style={{
            ...typography.label,
            color: colors.textPrimary,
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.accent}40`,
            padding: `${spacing[2]} ${spacing[3]}`,
            borderRadius: radius.md,
            boxShadow: `0 4px 12px ${colors.accent}20`,
            whiteSpace: 'pre-wrap',
            textAlign: 'right'
          }}>
            {voiceMessage}
          </div>
        )}
        {voiceError && (
          <div style={{
            ...typography.label,
            color: colors.bgPrimary,
            backgroundColor: colors.danger,
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: radius.md,
            boxShadow: `0 2px 8px ${colors.danger}40`,
          }}>
            {voiceError}
          </div>
        )}
        <button
          onClick={toggleListening}
          disabled={isParsing}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: radius.full,
            backgroundColor: isListening ? colors.danger : colors.accent,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 16px ${isListening ? colors.danger : colors.accent}80`,
            cursor: isParsing ? 'wait' : 'pointer',
            opacity: isParsing ? 0.8 : 1,
            transition: 'background-color 0.2s',
          }}
        >
          {isParsing ? (
            <Loader2 size={24} color={colors.bgPrimary} style={{ animation: 'spin 1s linear infinite' }} />
          ) : isListening ? (
            <MicOff size={24} color={colors.bgPrimary} />
          ) : (
            <Mic size={24} color={colors.bgPrimary} />
          )}
        </button>
      </div>


      {/* Overlays */}
      <RestTimerOverlay
        isOpen={restTimer.active}
        seconds={restTimer.seconds}
        total={restTimer.total}
        onClose={restTimer.stop}
        onRestart={startRestTimer}
      />

      {/* PRMomentOverlay — kept for end-of-workout, but disabled during active workout (inline banner used instead) */}
      <PRMomentOverlay
        isOpen={showPR}
        exerciseName={prExerciseName}
        onClose={handleClosePR}
      />

      {/* Inline PR Banner — slides up during active workout */}
      {prBannerName && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 150,
            backgroundColor: colors.prColor,
            color: colors.bgPrimary,
            padding: `${spacing[3]} ${spacing[5]}`,
            borderRadius: radius.full,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            boxShadow: `0 4px 24px ${colors.prColor}60`,
            animation: 'scaleIn 0.2s ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          <Star size={16} color={colors.bgPrimary} fill={colors.bgPrimary} />
          <span style={{ ...typography.body, fontWeight: '700' }}>
            Neuer Rekord! {prBannerName}
          </span>
        </div>
      )}

      <CancelWorkoutOverlay
        isOpen={showCancel}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancel(false)}
      />

      {showFinishModal && (
        <FinishWorkoutModal
          incompleteSets={activeWorkout.exercises.reduce(
            (sum, ex) => sum + ex.sets.filter(s => !s.isCompleted).length,
            0
          )}
          onMarkDone={handleMarkAllDone}
          onDiscard={handleDiscardIncomplete}
          onCancel={() => setShowFinishModal(false)}
        />
      )}
    </div>
  );
}
