import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { getExerciseById } from '@/constants/exercises';
import type { ActiveWorkout, WorkoutExercise, SetEntry } from '@/types/workout';
import type { Exercise } from '@/types/exercises';
import { useHistoryStore } from './historyStore';
import { calculateIntelligentWeight } from '@/utils/overload';

interface WorkoutState {
  // Aktives Workout (null = kein Workout läuft)
  activeWorkout: ActiveWorkout | null;

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
  reorderExercises: (exercises: WorkoutExercise[]) => void;

  // Actions — Sets
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<SetEntry>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  markSetAsPR: (exerciseId: string, setId: string) => void;

  // Actions — Timer
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultSet(initialWeight = 0, initialReps = 0): SetEntry {
  return {
    id: generateId(),
    weight: initialWeight,
    reps: initialReps,
    isCompleted: false,
    isPR: false,
  };
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
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
              // Always create exactly 2 sets as default, overrides ex.defaultSets per user request
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

      finishWorkout: () => set({ activeWorkout: null }),

      cancelWorkout: () =>
        set({
          activeWorkout: null,
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
            // Always create exactly 2 sets as default
            sets: [createDefaultSet(w, r), createDefaultSet(w, r)],
          };
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: [...state.activeWorkout.exercises, newExercise],
            },
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

                // Letzten Satz als exakte Vorlage für Gewicht & Reps des neuen Satzes
                const newSet: SetEntry = createDefaultSet(
                  lastSet?.weight ?? 0,
                  lastSet?.reps ?? 0
                );

                return { ...e, sets: [...e.sets, newSet] };
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
      partialize: (state) => ({ activeWorkout: state.activeWorkout }) as unknown as WorkoutState,
    }
  )
);
