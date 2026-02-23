'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { exercises as builtinExercises } from '@/constants/exercises';
import { supabase } from '@/lib/supabase';
import type { Exercise, MuscleGroup, Equipment, ExerciseCategory } from '@/types/exercises';
import { useRouter } from 'next/navigation';

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void;
}

const muscleGroups: { id: MuscleGroup; label: string }[] = [
  { id: 'chest',     label: 'Brust'     },
  { id: 'back',      label: 'Rücken'    },
  { id: 'shoulders', label: 'Schultern' },
  { id: 'biceps',    label: 'Bizeps'    },
  { id: 'triceps',   label: 'Trizeps'   },
  { id: 'legs',      label: 'Beine'     },
  { id: 'glutes',    label: 'Gesäß'     },
  { id: 'core',      label: 'Core'      },
  { id: 'calves',    label: 'Waden'     },
  { id: 'forearms',  label: 'Unterarme' },
];

const equipmentFilters: { id: Equipment; label: string }[] = [
  { id: 'barbell',    label: 'Langhantel'   },
  { id: 'dumbbell',   label: 'Kurzhantel'   },
  { id: 'cable',      label: 'Kabel'        },
  { id: 'machine',    label: 'Maschine'     },
  { id: 'bodyweight', label: 'Eigengewicht' },
  { id: 'kettlebell', label: 'Kettlebell'   },
  { id: 'band',       label: 'Band'         },
  { id: 'smith',      label: 'Smith'        },
];

const categoryFilters: { id: ExerciseCategory; label: string }[] = [
  { id: 'compound',  label: 'Compound'  },
  { id: 'isolation', label: 'Isolation' },
  { id: 'cardio',    label: 'Cardio'    },
];

// Map community exercise from Supabase row to Exercise interface
function mapCommunityExercise(row: Record<string, unknown>): Exercise & { isCustom: true } {
  return {
    id: `community-${row.id as string}`,
    name: row.name as string,
    nameDE: row.name_de as string,
    primaryMuscle: row.primary_muscle as MuscleGroup,
    secondaryMuscles: (row.secondary_muscles as MuscleGroup[]) ?? [],
    equipment: (row.equipment as Equipment[]) ?? [],
    category: row.category as ExerciseCategory,
    defaultSets: (row.default_sets as number) ?? 3,
    defaultReps: (row.default_reps as number) ?? 10,
    defaultWeight: (row.default_weight as number) ?? 0,
    repRange: {
      min: (row.rep_range_min as number) ?? 8,
      max: (row.rep_range_max as number) ?? 12,
    },
    restSeconds: (row.rest_seconds as number) ?? 90,
    scienceNote: (row.science_note as string) ?? '',
    isCustom: true,
  };
}

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [communityExercises, setCommunityExercises] = useState<(Exercise & { isCustom: true })[]>([]);

  // Fetch community exercises from Supabase
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const { data } = await supabase
          .from('community_exercises')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) {
          setCommunityExercises(data.map(mapCommunityExercise));
        }
      } catch {
        // Supabase not configured — silently skip
      }
    };
    fetchCommunity();
  }, []);

  const allExercises = useMemo(
    () => [...builtinExercises, ...communityExercises],
    [communityExercises]
  );

  const filtered = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesQuery =
        query.length === 0 ||
        ex.nameDE.toLowerCase().includes(query.toLowerCase()) ||
        ex.name.toLowerCase().includes(query.toLowerCase());

      const matchesMuscle =
        !selectedMuscle ||
        ex.primaryMuscle === selectedMuscle ||
        ex.secondaryMuscles.includes(selectedMuscle);

      const matchesEquipment =
        !selectedEquipment || ex.equipment.includes(selectedEquipment);

      const matchesCategory =
        !selectedCategory || ex.category === selectedCategory;

      return matchesQuery && matchesMuscle && matchesEquipment && matchesCategory;
    });
  }, [query, selectedMuscle, selectedEquipment, selectedCategory, allExercises]);

  function FilterChip<T extends string>({
    id,
    label,
    selected,
    onToggle,
  }: {
    id: T;
    label: string;
    selected: boolean;
    onToggle: (id: T) => void;
  }) {
    return (
      <button
        onClick={() => onToggle(id)}
        style={{
          flexShrink: 0,
          padding: `${spacing[1]} ${spacing[3]}`,
          borderRadius: radius.full,
          border: `1px solid ${selected ? colors.accent : colors.border}`,
          backgroundColor: selected ? colors.accentBg : colors.bgCard,
          ...typography.label,
          color: selected ? colors.accent : colors.textMuted,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        {label.toUpperCase()}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
      {/* Search Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          backgroundColor: colors.bgHighest,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: `${spacing[3]} ${spacing[4]}`,
        }}
      >
        <Search size={18} color={colors.textMuted} />
        <input
          type="text"
          placeholder="Übung suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            ...typography.body,
            color: colors.textPrimary,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
          }}
          autoFocus
        />
      </div>

      {/* Muscle Filter */}
      <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
        <div style={{ display: 'flex', gap: spacing[2], width: 'max-content' }}>
          <FilterChip<'null'>
            id="null"
            label="ALLE"
            selected={!selectedMuscle}
            onToggle={() => setSelectedMuscle(null)}
          />
          {muscleGroups.map((mg) => (
            <FilterChip<MuscleGroup>
              key={mg.id}
              id={mg.id}
              label={mg.label}
              selected={selectedMuscle === mg.id}
              onToggle={(id) => setSelectedMuscle(selectedMuscle === id ? null : id)}
            />
          ))}
        </div>
      </div>

      {/* Equipment + Category Filter */}
      <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
        <div style={{ display: 'flex', gap: spacing[2], width: 'max-content' }}>
          {equipmentFilters.map((eq) => (
            <FilterChip<Equipment>
              key={eq.id}
              id={eq.id}
              label={eq.label}
              selected={selectedEquipment === eq.id}
              onToggle={(id) => setSelectedEquipment(selectedEquipment === id ? null : id)}
            />
          ))}
          <div style={{ width: '1px', backgroundColor: colors.border, margin: `0 ${spacing[1]}` }} />
          {categoryFilters.map((cat) => (
            <FilterChip<ExerciseCategory>
              key={cat.id}
              id={cat.id}
              label={cat.label}
              selected={selectedCategory === cat.id}
              onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing[8] }}>
            <p style={{ ...typography.body, color: colors.textMuted }}>
              Keine Übungen gefunden.
            </p>
          </div>
        ) : (
          filtered.map((exercise) => {
            const isCustom = (exercise as Exercise & { isCustom?: boolean }).isCustom;
            return (
              <button
                key={exercise.id}
                onClick={() => onSelect(exercise)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing[4],
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${isCustom ? `${colors.accent}30` : colors.border}`,
                  borderRadius: radius.lg,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgElevated;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.bgCard;
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {exercise.nameDE}
                    </span>
                    {isCustom && (
                      <span
                        style={{
                          ...typography.label,
                          color: '#00CCCC',
                          backgroundColor: '#00CCCC15',
                          border: '1px solid #00CCCC30',
                          borderRadius: radius.sm,
                          padding: '1px 6px',
                        }}
                      >
                        Community
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] }}>
                    <Badge variant="muted">{exercise.primaryMuscle}</Badge>
                    <span style={{ ...typography.bodySm, color: colors.textDisabled }}>
                      {exercise.equipment.join(' · ')}
                    </span>
                    <span style={{ ...typography.bodySm, color: colors.textFaint }}>
                      {exercise.category}
                    </span>
                  </div>
                </div>
                <Plus size={18} color={colors.accent} />
              </button>
            );
          })
        )}

        {/* Create custom exercise button */}
        <button
          onClick={() => router.push('/workout/custom-exercise')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
            padding: `${spacing[3]} ${spacing[4]}`,
            backgroundColor: 'transparent',
            border: `1px dashed ${colors.border}`,
            borderRadius: radius.lg,
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginTop: spacing[2],
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = colors.accent;
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.accentBg;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border;
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <Dumbbell size={16} color={colors.textMuted} />
          <span style={{ ...typography.bodySm, color: colors.textMuted }}>
            Eigene Übung erstellen
          </span>
        </button>
      </div>
    </div>
  );
}
