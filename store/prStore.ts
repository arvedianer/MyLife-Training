import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { PRRecord } from '@/types/workout';
import { buildVariationKey } from '@/utils/variations';

interface PRState {
  records: PRRecord[];
  checkAndUpdatePR: (variationKey: string, weight: number, reps: number, sessionId: string, date: string) => boolean;
  getPRForVariation: (variationKey: string) => PRRecord | undefined;
  getAllPRsForExercise: (exerciseId: string) => PRRecord[];
}

function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export { buildVariationKey }; // re-export for convenience

export const usePRStore = create<PRState>()(
  persist(
    (set, get) => ({
      records: [],

      checkAndUpdatePR: (variationKey, weight, reps, sessionId, date) => {
        const current = get().records.find((r) => r.variationKey === variationKey);
        const new1RM = epley1RM(weight, reps);
        const isNewPR = !current || new1RM > current.estimated1RM;

        if (isNewPR) {
          const newRecord: PRRecord = { variationKey, weight, reps, estimated1RM: new1RM, date, sessionId };
          set((state) => ({
            records: [
              ...state.records.filter((r) => r.variationKey !== variationKey),
              newRecord,
            ],
          }));
        }
        return isNewPR;
      },

      getPRForVariation: (variationKey) => {
        return get().records.find((r) => r.variationKey === variationKey);
      },

      getAllPRsForExercise: (exerciseId) => {
        return get().records.filter((r) => r.variationKey.startsWith(`${exerciseId}::`));
      },
    }),
    {
      name: 'pr-storage',
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
