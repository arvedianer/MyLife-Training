import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { WorkoutSession } from '@/types/workout';

interface HistoryState {
  sessions: WorkoutSession[];

  // Actions
  addSession: (session: WorkoutSession) => void;
  updateSession: (id: string, updates: Partial<WorkoutSession>) => void;
  deleteSession: (id: string) => void;

  // Selectors (als Methoden für einfachen Zugriff)
  getSessionById: (id: string) => WorkoutSession | undefined;
  getSessionsByExercise: (exerciseId: string) => WorkoutSession[];
  getPersonalRecords: () => Record<string, { weight: number; reps: number; volume: number }>;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions], // Neueste zuerst
        })),

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      getSessionById: (id) => get().sessions.find((s) => s.id === id),

      getSessionsByExercise: (exerciseId) =>
        get().sessions.filter((s) =>
          s.exercises.some((e) => e.exercise.id === exerciseId)
        ),

      getPersonalRecords: () => {
        const sessions = get().sessions;
        const prs: Record<string, { weight: number; reps: number; volume: number }> = {};

        for (const session of sessions) {
          for (const workoutExercise of session.exercises) {
            const exId = workoutExercise.exercise.id;
            for (const set of workoutExercise.sets) {
              if (!set.isCompleted) continue;
              const volume = set.weight * set.reps;
              if (!prs[exId] || volume > prs[exId].volume) {
                prs[exId] = {
                  weight: set.weight,
                  reps: set.reps,
                  volume,
                };
              }
            }
          }
        }

        return prs;
      },
    }),
    {
      name: 'mylife-history',
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
