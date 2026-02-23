import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { UserProfile } from '@/types/user';

interface UserState {
  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;

  // Profil
  profile: UserProfile | null;

  // Einstellungen
  weightUnit: 'kg' | 'lbs';
  restTimerDefault: number; // Sekunden

  // Actions
  setOnboardingStep: (step: number) => void;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setRestTimerDefault: (seconds: number) => void;
  resetUser: () => void;
}

const initialState = {
  onboardingCompleted: false,
  onboardingStep: 1,
  profile: null,
  weightUnit: 'kg' as const,
  restTimerDefault: 90,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      completeOnboarding: (profile) =>
        set({
          onboardingCompleted: true,
          onboardingStep: 5,
          profile,
          weightUnit: 'kg',
        }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      setWeightUnit: (unit) => set({ weightUnit: unit }),

      setRestTimerDefault: (seconds) => set({ restTimerDefault: seconds }),

      resetUser: () => set(initialState),
    }),
    {
      name: 'mylife-user',
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
