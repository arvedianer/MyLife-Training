import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { supabase } from '@/lib/supabase';
import type { Exercise, MuscleGroup, Equipment, ExerciseCategory } from '@/types/exercises';

export interface ExerciseState {
    customExercises: Exercise[];
    addCustomExercise: (exercise: Exercise) => void;
    updateCustomExercise: (id: string, updates: Partial<Exercise>) => void;
    removeCustomExercise: (id: string) => void;
    loadFromSupabase: () => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>()(
    persist(
        (set) => ({
            customExercises: [],
            addCustomExercise: (exercise) =>
                set((state) => ({
                    customExercises: [...state.customExercises.filter(e => e.id !== exercise.id), exercise]
                })),
            updateCustomExercise: (id, updates) =>
                set((state) => ({
                    customExercises: state.customExercises.map(e => e.id === id ? { ...e, ...updates } : e)
                })),
            removeCustomExercise: (id) => {
                set((state) => ({
                    customExercises: state.customExercises.filter((e) => e.id !== id)
                }));
                // Fire and forget Supabase deletion for locally removed items matching signature
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && id.startsWith('community-')) {
                        const dbId = id.replace('community-', '');
                        supabase.from('community_exercises').delete().match({ id: dbId, created_by: user.id }).then(({ error }) => {
                            if (error) console.error('Failed to delete exercise from Supabase:', error);
                        });
                    }
                });
            },
            loadFromSupabase: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { data, error } = await supabase
                        .from('community_exercises')
                        .select('*')
                        .or(`is_public.eq.true,created_by.eq.${user.id}`);
                    if (error) throw error;
                    if (data) {
                        const mapped: Exercise[] = data.map(row => ({
                            id: `community-${row.id}`,
                            name: row.name,
                            nameDE: row.name_de,
                            primaryMuscle: row.primary_muscle as MuscleGroup,
                            secondaryMuscles: (row.secondary_muscles as MuscleGroup[]) || [],
                            equipment: (row.equipment as Equipment[]) || [],
                            category: row.category as ExerciseCategory,
                            defaultSets: row.default_sets || 3,
                            defaultReps: row.default_reps || 10,
                            defaultWeight: row.default_weight || 0,
                            repRange: {
                                min: row.rep_range_min || 8,
                                max: row.rep_range_max || 12,
                            },
                            restSeconds: row.rest_seconds || 90,
                            scienceNote: row.science_note || '',
                            isPublic: row.is_public ?? true,
                            createdBy: row.created_by,
                            isCustom: true
                        }));
                        set((state) => {
                            const map = new Map(state.customExercises.map(e => [e.id, e]));
                            mapped.forEach(e => map.set(e.id, e));
                            return { customExercises: Array.from(map.values()) };
                        });
                    }
                } catch (err) {
                    console.error('Failed to load community exercises:', err);
                }
            },
        }),
        {
            name: 'mylife-custom-exercises',
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
