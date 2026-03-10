import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { WorkoutSession } from '@/types/workout';
import { supabase } from '@/lib/supabase';
import { getExerciseById } from '@/constants/exercises';

interface HistoryState {
  sessions: WorkoutSession[];

  // Actions
  addSession: (session: WorkoutSession) => void;
  updateSession: (id: string, updates: Partial<WorkoutSession>) => Promise<void>;
  deleteSession: (id: string) => void;

  // Selectors (als Methoden für einfachen Zugriff)
  getSessionById: (id: string) => WorkoutSession | undefined;
  getSessionsByExercise: (exerciseId: string) => WorkoutSession[];
  getPersonalRecords: () => Record<string, { weight: number; reps: number; volume: number }>;
  loadFromSupabase: (userId: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: async (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions], // Neueste zuerst
        }));

        // Fire-and-forget Supabase sync (outer try/catch prevents auth errors from propagating)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            try {
              await supabase.from('sessions').insert({
                id: session.id,
                user_id: user.id,
                date: session.date,
                split_name: session.splitName ?? null,
                duration: session.durationSeconds,
                total_volume: session.totalVolume,
                notes: session.note ?? null,
              });
              for (const ex of session.exercises) {
                await supabase.from('session_exercises').insert({
                  session_id: session.id,
                  user_id: user.id,
                  exercise_id: ex.exercise.id,
                  exercise_name: ex.exercise.nameDE,
                  sets: ex.sets, // JSONB
                });
              }
            } catch (e) {
              console.error("Failed to sync session to Supabase:", e);
            }
          }
        } catch (e) {
          console.error("historyStore.addSession auth error:", e);
        }
      },

      updateSession: async (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const updatedSession = get().sessions.find(s => s.id === id);
            if (!updatedSession) return;

            await supabase.from('sessions').update({
              total_volume: updatedSession.totalVolume,
              duration: updatedSession.durationSeconds,
              notes: updatedSession.note,
              split_name: updatedSession.splitName,
            }).eq('id', id).eq('user_id', user.id);

            for (const ex of updatedSession.exercises) {
              await supabase.from('session_exercises').update({
                sets: ex.sets,
              }).eq('session_id', id).eq('exercise_id', ex.exercise.id);
            }
          } catch (e) {
            console.error("Failed to update session in Supabase:", e);
          }
        }
      },

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

      loadFromSupabase: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('sessions')
            .select('*, session_exercises(*)')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(200);

          if (error) throw error;

          if (data) {
            const mappedSessions: WorkoutSession[] = data.map((d: any) => ({
              id: d.id,
              date: d.date,
              startedAt: new Date(d.date).getTime(), // Fallback
              finishedAt: new Date(d.date).getTime() + (d.duration * 1000), // Fallback
              durationSeconds: d.duration,
              totalVolume: d.total_volume,
              totalSets: d.session_exercises?.reduce((acc: number, cur: any) => acc + (cur.sets?.length || 0), 0) || 0,
              newPRs: [],
              splitName: d.split_name || undefined,
              note: d.notes || undefined,
              exercises: (d.session_exercises || []).map((se: any) => {
                const exerciseData = getExerciseById(se.exercise_id);
                return {
                  id: `${d.id}-${se.exercise_id}`,
                  exercise: exerciseData ?? {
                    id: se.exercise_id,
                    nameDE: se.exercise_name,
                    nameEN: se.exercise_name,
                    name: se.exercise_name,
                    primaryMuscle: 'chest' as const,
                    secondaryMuscles: [] as string[],
                    equipment: [] as string[],
                    category: 'compound' as const,
                  },
                  sets: se.sets || [],
                };
              }),
            }));

            set((state) => {
              const localMap = new Map(state.sessions.map((s) => [s.id, s]));
              mappedSessions.forEach(mapped => {
                if (!localMap.has(mapped.id)) {
                  localMap.set(mapped.id, mapped);
                }
              });

              const merged = Array.from(localMap.values()).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
              );

              return { sessions: merged };
            });
          }
        } catch (e) {
          console.error("Failed to load sessions from Supabase:", e);
        }
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
