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
  language: 'de' | 'en';

  // Body weight history
  bodyWeightLog: { date: string; weight: number }[];

  // Scores
  lifetimeAthleteScore: number; // 0–1000, never decreases

  // Actions
  setOnboardingStep: (step: number) => void;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setRestTimerDefault: (seconds: number) => void;
  setLanguage: (lang: 'de' | 'en') => void;
  resetUser: () => void;
  updateLifetimeAthleteScore: (score: number) => void;
}

const initialState = {
  onboardingCompleted: false,
  onboardingStep: 1,
  profile: null,
  weightUnit: 'kg' as const,
  restTimerDefault: 150,
  language: 'de' as const,
  lifetimeAthleteScore: 0,
  bodyWeightLog: [] as { date: string; weight: number }[],
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      completeOnboarding: (profile) =>
        set({
          onboardingCompleted: true,
          onboardingStep: 8,
          profile,
          weightUnit: 'kg',
        }),

      updateProfile: (updates) =>
        set((state) => {
          const newLog = updates.bodyWeight != null
            ? [
                ...state.bodyWeightLog.filter(e => e.date !== new Date().toISOString().split('T')[0]),
                { date: new Date().toISOString().split('T')[0], weight: updates.bodyWeight! },
              ].slice(-30) // keep last 30 entries
            : state.bodyWeightLog;
          return {
            profile: state.profile ? { ...state.profile, ...updates } : null,
            bodyWeightLog: newLog,
          };
        }),

      setWeightUnit: (unit) => set({ weightUnit: unit }),

      setRestTimerDefault: (seconds) => set({ restTimerDefault: seconds }),

      setLanguage: (lang) => set({ language: lang }),

      resetUser: () => set(initialState),

      updateLifetimeAthleteScore: (score) =>
        set((state) => ({
          lifetimeAthleteScore: Math.max(state.lifetimeAthleteScore, score),
        })),
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
