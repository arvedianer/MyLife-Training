import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { getExerciseById } from '@/constants/exercises';
import type { ActiveWorkout, WorkoutExercise, SetEntry } from '@/types/workout';
import type { Exercise } from '@/types/exercises';
import { useHistoryStore } from './historyStore';
import { calculateIntelligentWeight } from '@/utils/overload';

interface UndoEntry {
  exerciseId: string;
  setId: string;
}

interface WorkoutState {
  // Aktives Workout (null = kein Workout läuft)
  activeWorkout: ActiveWorkout | null;

  // Undo stack (non-persisted — lives for current workout only)
  undoStack: UndoEntry[];

  // Recently used exercise IDs (persisted, max 10)
  recentlyUsedIds: string[];

  // Rest Timer
  restTimerActive: boolean;
  restTimerSeconds: number;
  restTimerTotal: number;

  // Actions — Workout
  startWorkout: (splitName?: string, preloadExerciseIds?: string[]) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;

  // Actions — Übungen
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  replaceExercise: (exerciseId: string, newExercise: Exercise) => void;
  reorderExercises: (exercises: WorkoutExercise[]) => void;
  toggleUnilateral: (exerciseId: string) => void;

  // Actions — Sets
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<SetEntry>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  markSetAsPR: (exerciseId: string, setId: string) => void;
  changeSetType: (exerciseId: string, setId: string, type: SetEntry['type']) => void;
  undoLastSet: () => void;

  // Actions — Timer
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultSet(initialWeight = 0, initialReps = 0, type: SetEntry['type'] = 'normal', side: SetEntry['side'] = 'both'): SetEntry {
  return {
    id: generateId(),
    weight: initialWeight,
    reps: initialReps,
    isCompleted: false,
    isPR: false,
    type,
    side,
  };
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      undoStack: [],
      recentlyUsedIds: [],
      restTimerActive: false,
      restTimerSeconds: 0,
      restTimerTotal: 0,

      startWorkout: (splitName, preloadExerciseIds) => {
        const sessions = useHistoryStore.getState().sessions;

        // Build pre-loaded WorkoutExercise list from split's exerciseIds
        const preloaded: WorkoutExercise[] = (preloadExerciseIds ?? [])
          .map((id) => getExerciseById(id))
          .filter((ex): ex is Exercise => !!ex)
          .map((ex) => {
            const suggestion = calculateIntelligentWeight(ex.id, sessions);
            const w = suggestion ? suggestion.weight : 0;
            const r = suggestion ? suggestion.reps : 8; // Default 6-8 reps (represented as 8)
            return {
              id: generateId(),
              exercise: ex,
              isUnilateral: false,
              unilateralSync: true,
              // Always create exactly 2 sets as default
              sets: Array.from({ length: 2 }, () => createDefaultSet(w, r)),
            };
          });

        set({
          activeWorkout: {
            id: generateId(),
            startedAt: Date.now(),
            exercises: preloaded,
            timerActive: false,
            timerSeconds: 0,
            plannedSplit: splitName,
          },
        });
      },

      finishWorkout: () => set({ activeWorkout: null, undoStack: [] }),

      cancelWorkout: () =>
        set({
          activeWorkout: null,
          undoStack: [],
          restTimerActive: false,
          restTimerSeconds: 0,
          restTimerTotal: 0,
        }),

      addExercise: (exercise) =>
        set((state) => {
          if (!state.activeWorkout) return state;

          const sessions = useHistoryStore.getState().sessions;
          const suggestion = calculateIntelligentWeight(exercise.id, sessions);
          const w = suggestion ? suggestion.weight : 0;
          const r = suggestion ? suggestion.reps : 8; // Default 6-8 reps

          const newExercise: WorkoutExercise = {
            id: generateId(),
            exercise,
            isUnilateral: false,
            unilateralSync: true,
            // Always create exactly 2 sets as default
            sets: [createDefaultSet(w, r), createDefaultSet(w, r)],
          };

          // Track recently used (prepend, deduplicate, max 10)
          const updated = [exercise.id, ...state.recentlyUsedIds.filter((id) => id !== exercise.id)].slice(0, 10);

          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: [...state.activeWorkout.exercises, newExercise],
            },
            recentlyUsedIds: updated,
          };
        }),

      removeExercise: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.filter(
                (e) => e.id !== exerciseId
              ),
            },
          };
        }),

      replaceExercise: (exerciseId, newExercise) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                return {
                  ...e,
                  exercise: newExercise,
                  // Reset sets but preserve count with empty values
                  sets: e.sets.map((s) => ({ ...s, isCompleted: false, isPR: false })),
                };
              }),
            },
          };
        }),

      reorderExercises: (exercises) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: { ...state.activeWorkout, exercises },
          };
        }),

      addSet: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                const lastSet = e.sets[e.sets.length - 1];
                const weight = lastSet?.weight ?? 0;
                const reps = lastSet?.reps ?? 0;
                const type = lastSet?.type ?? 'normal';

                if (e.isUnilateral) {
                  // If unilateral, add a pair (L and R)
                  return {
                    ...e,
                    sets: [
                      ...e.sets,
                      createDefaultSet(weight, reps, type, 'left'),
                      createDefaultSet(weight, reps, type, 'right'),
                    ],
                  };
                }

                return {
                  ...e,
                  sets: [...e.sets, createDefaultSet(weight, reps, type, 'both')],
                };
              }),
            },
          };
        }),

      changeSetType: (exerciseId, setId, type) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                return {
                  ...e,
                  sets: e.sets.map((s) => (s.id === setId ? { ...s, type } : s)),
                };
              }),
            },
          };
        }),

      toggleUnilateral: (exerciseId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                const nowUnilateral = !e.isUnilateral;

                // If switching TO unilateral, we might want to split existing sets
                // But for now, let's just update the flag. 
                // Any NEW sets added after this will be L/R pairs.

                return { ...e, isUnilateral: nowUnilateral };
              }),
            },
          };
        }),

      updateSet: (exerciseId, setId, updates) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                return {
                  ...e,
                  sets: e.sets.map((s) =>
                    s.id === setId ? { ...s, ...updates } : s
                  ),
                };
              }),
            },
          };
        }),

      removeSet: (exerciseId, setId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                return {
                  ...e,
                  sets: e.sets.filter((s) => s.id !== setId),
                };
              }),
            },
          };
        }),

      toggleSetComplete: (exerciseId, setId) => {
        const state = get();
        if (!state.activeWorkout) return;
        const exercise = state.activeWorkout.exercises.find(
          (e) => e.id === exerciseId
        );
        const currentSet = exercise?.sets.find((s) => s.id === setId);
        if (!currentSet) return;

        // Push to undo stack when completing (not un-completing)
        const isCompleting = !currentSet.isCompleted;

        set((s) => {
          if (!s.activeWorkout) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                return {
                  ...e,
                  sets: e.sets.map((st) =>
                    st.id === setId
                      ? { ...st, isCompleted: !st.isCompleted }
                      : st
                  ),
                };
              }),
            },
            undoStack: isCompleting
              ? [...s.undoStack, { exerciseId, setId }]
              : s.undoStack,
          };
        });
      },

      undoLastSet: () => {
        const state = get();
        if (state.undoStack.length === 0 || !state.activeWorkout) return;
        const last = state.undoStack[state.undoStack.length - 1];
        set((s) => {
          if (!s.activeWorkout) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              exercises: s.activeWorkout.exercises.map((e) => {
                if (e.id !== last.exerciseId) return e;
                return {
                  ...e,
                  sets: e.sets.map((st) =>
                    st.id === last.setId ? { ...st, isCompleted: false } : st
                  ),
                };
              }),
            },
            undoStack: s.undoStack.slice(0, -1),
          };
        });
      },

      markSetAsPR: (exerciseId, setId) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((e) => {
                if (e.id !== exerciseId) return e;
                return {
                  ...e,
                  sets: e.sets.map((s) =>
                    s.id === setId ? { ...s, isPR: true } : s
                  ),
                };
              }),
            },
          };
        }),

      startRestTimer: (seconds) =>
        set({
          restTimerActive: true,
          restTimerSeconds: seconds,
          restTimerTotal: seconds,
        }),

      stopRestTimer: () =>
        set({
          restTimerActive: false,
          restTimerSeconds: 0,
          restTimerTotal: 0,
        }),

      tickRestTimer: () =>
        set((state) => {
          if (!state.restTimerActive) return state;
          const newSeconds = state.restTimerSeconds - 1;
          if (newSeconds <= 0) {
            return {
              restTimerActive: false,
              restTimerSeconds: 0,
            };
          }
          return { restTimerSeconds: newSeconds };
        }),
    }),
    {
      name: 'mylife-workout',
      storage: {
        getItem: (name) => {
          const value = zustandStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          zustandStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          zustandStorage.removeItem(name);
        },
      },
      // Nur activeWorkout persistieren — Timer-State wird bei Reload zurückgesetzt
      partialize: (state) => ({
        activeWorkout: state.activeWorkout,
        recentlyUsedIds: state.recentlyUsedIds,
        // undoStack is intentionally NOT persisted (session-only)
      }) as unknown as WorkoutState,
    }
  )
);
