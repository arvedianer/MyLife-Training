import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { TrainingSplit, SplitDay } from '@/types/splits';

interface PlanState {
  // Splits
  splits: TrainingSplit[];
  activeSplitId: string | null;

  // Actions — Splits
  addSplit: (split: TrainingSplit) => void;
  updateSplit: (id: string, updates: Partial<TrainingSplit>) => void;
  deleteSplit: (id: string) => void;
  setActiveSplit: (id: string) => void;

  // Actions — Split Days
  updateSplitDay: (splitId: string, dayId: string, updates: Partial<SplitDay>) => void;
  addExerciseToDay: (splitId: string, dayId: string, exerciseId: string) => void;
  removeExerciseFromDay: (splitId: string, dayId: string, exerciseId: string) => void;

  // Selectors
  getActiveSplit: () => TrainingSplit | undefined;
  getSplitById: (id: string) => TrainingSplit | undefined;
  getTodaysSplitDay: () => SplitDay | undefined;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      splits: [],
      activeSplitId: null,

      addSplit: (split) =>
        set((state) => ({
          splits: [...state.splits, split],
          activeSplitId: state.activeSplitId ?? split.id,
        })),

      updateSplit: (id, updates) =>
        set((state) => ({
          splits: state.splits.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSplit: (id) =>
        set((state) => ({
          splits: state.splits.filter((s) => s.id !== id),
          activeSplitId: state.activeSplitId === id ? null : state.activeSplitId,
        })),

      setActiveSplit: (id) =>
        set((state) => ({
          activeSplitId: id,
          splits: state.splits.map((s) => ({
            ...s,
            isActive: s.id === id,
          })),
        })),

      updateSplitDay: (splitId, dayId, updates) =>
        set((state) => ({
          splits: state.splits.map((split) => {
            if (split.id !== splitId) return split;
            return {
              ...split,
              days: split.days.map((day) =>
                day.id === dayId ? { ...day, ...updates } : day
              ),
            };
          }),
        })),

      addExerciseToDay: (splitId, dayId, exerciseId) =>
        set((state) => ({
          splits: state.splits.map((split) => {
            if (split.id !== splitId) return split;
            return {
              ...split,
              days: split.days.map((day) => {
                if (day.id !== dayId) return day;
                if (day.exerciseIds.includes(exerciseId)) return day;
                return {
                  ...day,
                  exerciseIds: [...day.exerciseIds, exerciseId],
                };
              }),
            };
          }),
        })),

      removeExerciseFromDay: (splitId, dayId, exerciseId) =>
        set((state) => ({
          splits: state.splits.map((split) => {
            if (split.id !== splitId) return split;
            return {
              ...split,
              days: split.days.map((day) => {
                if (day.id !== dayId) return day;
                return {
                  ...day,
                  exerciseIds: day.exerciseIds.filter((id) => id !== exerciseId),
                };
              }),
            };
          }),
        })),

      getActiveSplit: () => {
        const state = get();
        return state.splits.find((s) => s.id === state.activeSplitId);
      },

      getSplitById: (id) => get().splits.find((s) => s.id === id),

      getTodaysSplitDay: () => {
        const state = get();
        const activeSplit = state.splits.find((s) => s.id === state.activeSplitId);
        if (!activeSplit) return undefined;

        // Rotierender Wochentag (Montag = 0)
        const dayOfWeek = new Date().getDay();
        const adjustedDay = (dayOfWeek + 6) % 7; // Montag als 0
        const dayIndex = adjustedDay % activeSplit.days.length;
        return activeSplit.days[dayIndex];
      },
    }),
    {
      name: 'mylife-plan',
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
    }
  )
);
