import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

interface TourState {
  tourCompleted: boolean;
  tourActive: boolean;
  tourStep: number; // 0-based, max 23 (displayed as 1-24)
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  resetTour: () => void;
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      tourCompleted: false,
      tourActive: false,
      tourStep: 0,

      startTour: () => set({ tourActive: true, tourStep: 0 }),

      nextStep: () => {
        const { tourStep } = get();
        if (tourStep >= 23) {
          set({ tourActive: false, tourCompleted: true, tourStep: 0 });
        } else {
          set({ tourStep: tourStep + 1 });
        }
      },

      prevStep: () => {
        const { tourStep } = get();
        if (tourStep > 0) set({ tourStep: tourStep - 1 });
      },

      skipTour: () => set({ tourActive: false, tourCompleted: true, tourStep: 0 }),

      resetTour: () => set({ tourCompleted: false, tourActive: false, tourStep: 0 }),
    }),
    {
      name: 'tour-store',
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
      partialize: (state) => ({
        tourCompleted: state.tourCompleted,
        tourActive: state.tourActive,
        tourStep: state.tourStep,
      }) as unknown as TourState,
    }
  )
);
