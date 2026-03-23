import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { TrainingSplit, SplitDay } from '@/types/splits';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';

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
  loadFromSupabase: (userId: string) => Promise<void>;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      splits: [],
      activeSplitId: null,

      addSplit: async (split) => {
        set((state) => ({
          splits: [...state.splits, split],
          activeSplitId: state.activeSplitId ?? split.id,
        }));

        if (split.type === 'custom') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            try {
              await supabase.from('custom_splits').insert({
                id: split.id,
                user_id: user.id,
                name: split.name,
                days_per_week: split.daysPerWeek,
                days: split.days, // JSONB
              });
            } catch (e) {
              console.error("Failed to sync split to Supabase:", e);
            }
          }
        }
      },

      updateSplit: async (id, updates) => {
        set((state) => ({
          splits: state.splits.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));

        const split = get().splits.find(s => s.id === id);
        if (split && split.type === 'custom') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            try {
              await supabase.from('custom_splits').update({
                name: split.name,
                days_per_week: split.daysPerWeek,
                days: split.days,
              }).eq('id', split.id).eq('user_id', user.id);
            } catch (e) {
              console.error("Failed to update split in Supabase:", e);
            }
          }
        }
      },

      deleteSplit: async (id) => {
        set((state) => ({
          splits: state.splits.filter((s) => s.id !== id),
          activeSplitId: state.activeSplitId === id ? null : state.activeSplitId,
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            await supabase.from('custom_splits').delete().eq('id', id);
          } catch (e) {
            console.error("Failed to delete split from Supabase:", e);
          }
        }
      },

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

        const dayOfWeek = new Date().getDay();
        const adjustedDay = (dayOfWeek + 6) % 7; // [0=Mo, 1=Di, ..., 6=So]

        // Access userStore state directly (non-hook access — safe inside a Zustand action)
        const weekdays = useUserStore.getState().profile?.trainingWeekdays;

        if (Array.isArray(weekdays) && weekdays.length > 0) {
          if (!weekdays.includes(adjustedDay)) return undefined; // rest day

          // Map training weekday to split day index
          const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
          const dayIndex = sortedWeekdays.indexOf(adjustedDay);
          return dayIndex >= 0 && dayIndex < activeSplit.days.length
            ? activeSplit.days[dayIndex]
            : undefined;
        }

        // Fallback: rotate through split days (original behavior for profiles without trainingWeekdays)
        const dayIndex = adjustedDay % activeSplit.days.length;
        return activeSplit.days[dayIndex];
      },

      loadFromSupabase: async (userId) => {
        try {
          const { data, error } = await supabase.from('custom_splits')
            .select('*').eq('user_id', userId);

          if (error) throw error;

          if (data) {
            const mappedSplits: TrainingSplit[] = data.map((d: any) => ({
              id: d.id,
              name: d.name,
              type: 'custom',
              description: 'Aus der Cloud geladen',
              scienceNote: '',
              days: d.days || [],
              daysPerWeek: d.days_per_week,
              difficulty: 'intermediate',
              isActive: false,
              createdAt: Date.now(),
            }));

            set((state) => {
              const existingIds = new Set(state.splits.map((s) => s.id));
              const newSplits = mappedSplits.filter((s) => !existingIds.has(s.id));
              return {
                splits: [...state.splits, ...newSplits],
              };
            });
          }
        } catch (e) {
          console.error("Failed to load splits from Supabase:", e);
        }
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
