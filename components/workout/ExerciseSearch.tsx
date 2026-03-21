'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Dumbbell, Edit2, Trash2, Filter } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { exercises as builtinExercises } from '@/constants/exercises';
import { useExerciseStore } from '@/store/exerciseStore';
import { useWorkoutStore } from '@/store/workoutStore';
import type { Exercise, MuscleGroup, Equipment, ExerciseCategory } from '@/types/exercises';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void;
}

const muscleGroups: { id: MuscleGroup; label: string }[] = [
  { id: 'chest', label: 'Brust' },
  { id: 'back', label: 'Rücken' },
  { id: 'shoulders', label: 'Schultern' },
  { id: 'biceps', label: 'Bizeps' },
  { id: 'triceps', label: 'Trizeps' },
  { id: 'legs', label: 'Beine' },
  { id: 'glutes', label: 'Gesäß' },
  { id: 'core', label: 'Core' },
  { id: 'calves', label: 'Waden' },
  { id: 'forearms', label: 'Unterarme' },
  { id: 'cardio', label: 'Cardio' },
];

const equipmentFilters: { id: Equipment; label: string }[] = [
  { id: 'barbell', label: 'Langhantel' },
  { id: 'dumbbell', label: 'Kurzhantel' },
  { id: 'cable', label: 'Kabel' },
  { id: 'machine', label: 'Maschine' },
  { id: 'bodyweight', label: 'Eigengewicht' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'band', label: 'Band' },
  { id: 'smith', label: 'Smith' },
];

const categoryFilters: { id: ExerciseCategory; label: string }[] = [
  { id: 'compound', label: 'Mehrgelenk' }, // "Compound" ist für viele zu komplex
  { id: 'isolation', label: 'Isolation' },
  { id: 'cardio', label: 'Ausdauer' },
];

function mapCommunityExercise(row: Record<string, unknown>): Exercise & { isCustom?: boolean } {
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
  const { customExercises, removeCustomExercise } = useExerciseStore();
  const recentlyUsedIds = useWorkoutStore((s) => s.recentlyUsedIds);
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<'all' | 'builtin' | 'community' | 'private'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const allExercises = useMemo(
    () => {
      // Kombiniere custom exercises aus dem Store mit den Built-in Exercises
      // Stelle sicher, dass eigene als "isCustom" markiert sind
      const mappedCustom = customExercises.map(e => ({ ...e, isCustom: true }));
      return [...builtinExercises, ...mappedCustom];
    },
    [customExercises]
  );

  const filtered = useMemo(() => {
    return allExercises
      .filter((ex) => {
        const matchesQuery =
          query.length === 0 ||
          ex.nameDE.toLowerCase().includes(query.toLowerCase()) ||
          ex.name.toLowerCase().includes(query.toLowerCase());

        const matchesMuscle =
          !selectedMuscle ||
          ex.primaryMuscle === selectedMuscle;

        const matchesEquipment =
          !selectedEquipment || ex.equipment.includes(selectedEquipment);

        const matchesCategory =
          !selectedCategory || ex.category === selectedCategory;

        const isCustom = (ex as Exercise & { isCustom?: boolean }).isCustom;
        const isPublic = (ex as Exercise & { isPublic?: boolean }).isPublic ?? true;

        if (selectedOrigin === 'builtin' && isCustom) return false;
        if (selectedOrigin === 'community' && (!isCustom || !isPublic)) return false;
        if (selectedOrigin === 'private' && (!isCustom || isPublic)) return false;

        return matchesQuery && matchesMuscle && matchesEquipment && matchesCategory;
      })
      .sort((a, b) => (b.popularity ?? 50) - (a.popularity ?? 50));
  }, [query, selectedMuscle, selectedEquipment, selectedCategory, selectedOrigin, allExercises]);

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
      {/* Search Input & Filter Toggle */}
      <div style={{ display: 'flex', gap: spacing[2] }}>
        <div
          style={{
            flex: 1,
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

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `0 ${spacing[4]}`,
            backgroundColor: showFilters ? colors.accentBg : colors.bgHighest,
            border: `1px solid ${showFilters ? colors.accent : colors.border}`,
            borderRadius: radius.lg,
            color: showFilters ? colors.accent : colors.textMuted,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          title="Filter ein-/ausblenden"
        >
          <Filter size={18} />
        </button>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[2], marginTop: spacing[1] }}>

          {/* Herkunft / Typ Filter (Privat, Community, App) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
            <span style={{ ...typography.label, color: colors.textMuted }}>KATEGORIE / HERKUNFT</span>
            <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
              <div style={{ display: 'flex', gap: spacing[2], width: 'max-content' }}>
                <FilterChip<'all' | 'builtin' | 'community' | 'private'>
                  id="all"
                  label="ALLE ÜBUNGEN"
                  selected={selectedOrigin === 'all'}
                  onToggle={(id) => setSelectedOrigin(id)}
                />
                <FilterChip<'all' | 'builtin' | 'community' | 'private'>
                  id="builtin"
                  label="VON MYLIFE"
                  selected={selectedOrigin === 'builtin'}
                  onToggle={(id) => setSelectedOrigin(id)}
                />
                <FilterChip<'all' | 'builtin' | 'community' | 'private'>
                  id="community"
                  label="VON COMMUNITY"
                  selected={selectedOrigin === 'community'}
                  onToggle={(id) => setSelectedOrigin(id)}
                />
                <FilterChip<'all' | 'builtin' | 'community' | 'private'>
                  id="private"
                  label="NUR MEINE EIGENEN"
                  selected={selectedOrigin === 'private'}
                  onToggle={(id) => setSelectedOrigin(id)}
                />
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', backgroundColor: colors.borderLight }} />

          {/* Muscle Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
            <span style={{ ...typography.label, color: colors.textMuted }}>MUSKELGRUPPEN</span>
            <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
              <div style={{ display: 'flex', gap: spacing[2], width: 'max-content' }}>
                <FilterChip<'null'>
                  id="null"
                  label="EGAL"
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
          </div>

          <div style={{ width: '100%', height: '1px', backgroundColor: colors.borderLight }} />

          {/* Equipment + Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
            <span style={{ ...typography.label, color: colors.textMuted }}>ART & GERÄT</span>
            <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
              <div style={{ display: 'flex', gap: spacing[2], width: 'max-content' }}>
                {categoryFilters.map((cat) => (
                  <FilterChip<ExerciseCategory>
                    key={cat.id}
                    id={cat.id}
                    label={cat.label}
                    selected={selectedCategory === cat.id}
                    onToggle={(id) => setSelectedCategory(selectedCategory === id ? null : id)}
                  />
                ))}
                <div style={{ width: '1px', backgroundColor: colors.border, margin: `0 ${spacing[1]}` }} />
                {equipmentFilters.map((eq) => (
                  <FilterChip<Equipment>
                    key={eq.id}
                    id={eq.id}
                    label={eq.label}
                    selected={selectedEquipment === eq.id}
                    onToggle={(id) => setSelectedEquipment(selectedEquipment === id ? null : id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zuletzt benutzt — shown when no query/filters active */}
      {query.length === 0 && !selectedMuscle && !selectedEquipment && !selectedCategory && recentlyUsedIds.length > 0 && (
        <div>
          <p style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[2] }}>
            ZULETZT BENUTZT
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {recentlyUsedIds
              .map((id) => allExercises.find((ex) => ex.id === id))
              .filter((ex): ex is typeof allExercises[0] => ex !== undefined)
              .slice(0, 5)
              .map((exercise) => (
                <div
                  key={`recent-${exercise.id}`}
                  onClick={() => onSelect(exercise)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing[4],
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgElevated; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgCard; }}
                >
                  <div>
                    <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {exercise.nameDE}
                    </div>
                    <div style={{ ...typography.bodySm, color: colors.textMuted }}>{exercise.primaryMuscle}</div>
                  </div>
                  <Plus size={16} color={colors.accent} />
                </div>
              ))}
          </div>
          <div style={{ height: '1px', backgroundColor: colors.borderLight, margin: `${spacing[3]} 0` }} />
        </div>
      )}

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
            const exerciseCreatedBy = (exercise as Exercise & { createdBy?: string }).createdBy;
            const isCreator = isCustom && (!exerciseCreatedBy || exerciseCreatedBy === currentUserId);
            const isPublic = (exercise as Exercise & { isPublic?: boolean }).isPublic ?? true;
            return (
              <div
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
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgElevated;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgCard;
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {exercise.nameDE}
                    </span>
                    {isCustom && (
                      <span
                        style={{
                          ...typography.label,
                          color: isPublic ? '#00CCCC' : colors.textMuted,
                          backgroundColor: isPublic ? '#00CCCC15' : colors.bgElevated,
                          border: `1px solid ${isPublic ? '#00CCCC30' : colors.border}`,
                          borderRadius: radius.sm,
                          padding: '1px 6px',
                        }}
                      >
                        {isPublic ? 'Community' : 'Privat'}
                      </span>
                    )}
                    {(exercise.popularity ?? 0) >= 80 && (
                      <span
                        style={{
                          ...typography.label,
                          color: colors.accent,
                          fontSize: '9px',
                          padding: `1px ${spacing[1]}`,
                          border: `1px solid ${colors.accent}40`,
                          borderRadius: radius.full,
                          marginLeft: spacing[1],
                        }}
                      >
                        ★
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] }}>
                    <Badge variant="muted">
                      {muscleGroups.find(m => m.id === exercise.primaryMuscle)?.label || exercise.primaryMuscle}
                    </Badge>
                    <span style={{ ...typography.bodySm, color: colors.textDisabled }}>
                      {exercise.equipment.map(eq => equipmentFilters.find(f => f.id === eq)?.label || eq).join(' · ')}
                    </span>
                    <span style={{ ...typography.bodySm, color: colors.textFaint }}>
                      {categoryFilters.find(c => c.id === exercise.category)?.label || exercise.category}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                  {isCreator && (
                    <>
                      <button
                        title="Bearbeiten"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/workout/custom-exercise?edit=${exercise.id}`);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: spacing[1],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.textMuted,
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        title="Löschen"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Möchtest du diese Übung wirklich löschen?')) {
                            removeCustomExercise(exercise.id);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: spacing[1],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.danger,
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  <Plus size={18} color={colors.accent} />
                </div>
              </div>
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
