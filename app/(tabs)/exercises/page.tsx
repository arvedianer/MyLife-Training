'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronRight, Dumbbell, Edit2, Trash2, Filter } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { exercises as allHardcodedExercises } from '@/constants/exercises';
import { Badge } from '@/components/ui/Badge';
import { useWorkoutStore } from '@/store/workoutStore';
import { useExerciseStore } from '@/store/exerciseStore';
import type { MuscleGroup, Equipment, Exercise } from '@/types/exercises';
import { supabase } from '@/lib/supabase';

const muscleLabels: Record<MuscleGroup, string> = {
  chest: 'Brust',
  back: 'Rücken',
  shoulders: 'Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  legs: 'Beine',
  glutes: 'Gesäß',
  core: 'Core',
  calves: 'Waden',
  forearms: 'Unterarme',
};

const equipmentLabels: Record<Equipment, string> = {
  barbell: 'Langhantel',
  dumbbell: 'Kurzhantel',
  cable: 'Kabel',
  machine: 'Maschine',
  bodyweight: 'Körpergew.',
  kettlebell: 'Kettlebell',
  band: 'Band',
  smith: 'Smith',
  cardio_machine: 'Cardio',
};

const muscleOrder: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'legs', 'glutes',
  'biceps', 'triceps', 'core', 'calves', 'forearms',
];

const equipmentOrder: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'smith', 'bodyweight', 'kettlebell', 'band', 'cardio_machine',
];

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: radius.full,
    border: `1px solid ${active ? colors.accent : colors.border}`,
    backgroundColor: active ? `${colors.accent}15` : colors.bgCard,
    color: active ? colors.accent : colors.textMuted,
    ...typography.label,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s',
  };
}

export default function ExercisesPage() {
  const router = useRouter();
  const { activeWorkout, addExercise } = useWorkoutStore();
  const { customExercises, removeCustomExercise } = useExerciseStore();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const allExercises = useMemo(() => {
    return [...customExercises, ...allHardcodedExercises].sort((a, b) => a.nameDE.localeCompare(b.nameDE));
  }, [customExercises]);

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<'all' | 'builtin' | 'community' | 'private'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return allExercises.filter((ex) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !ex.nameDE.toLowerCase().includes(q) &&
          !ex.name.toLowerCase().includes(q)
        )
          return false;
      }
      if (selectedMuscle && ex.primaryMuscle !== selectedMuscle) return false;
      if (selectedEquipment && !ex.equipment.includes(selectedEquipment)) return false;

      const isCustom = (ex as Exercise & { isCustom?: boolean }).isCustom;
      const isPublic = (ex as Exercise & { isPublic?: boolean }).isPublic ?? true;

      if (selectedOrigin === 'builtin' && isCustom) return false;
      if (selectedOrigin === 'community' && (!isCustom || !isPublic)) return false;
      if (selectedOrigin === 'private' && (!isCustom || isPublic)) return false;

      return true;
    });
  }, [search, selectedMuscle, selectedEquipment, selectedOrigin, allExercises]);

  const handleAddToWorkout = (exerciseId: string) => {
    const ex = allExercises.find((e) => e.id === exerciseId);
    if (ex) addExercise(ex);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: colors.bgPrimary,
      }}
    >
      <div
        style={{
          padding: `${spacing[6]} ${spacing[5]} ${spacing[4]}`,
          paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
          borderBottom: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.bgPrimary,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
          <Dumbbell size={22} color={colors.accent} />
          <h1 style={{ ...typography.h2, color: colors.textPrimary }}>Übungen</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <span
              style={{
                ...typography.bodySm,
                color: colors.textMuted,
              }}
            >
              {filtered.length} Übungen
            </span>
            <button
              onClick={() => router.push('/workout/custom-exercise')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Neue Übung erstellen"
            >
              <Plus size={18} color={colors.accent} />
            </button>
          </div>
        </div>

        {/* Search and Filter Toggle */}
        <div style={{ display: 'flex', gap: spacing[2], marginBottom: showFilters ? spacing[3] : spacing[4] }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: spacing[3],
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.textMuted,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Übung suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} 40px`,
                color: colors.textPrimary,
                ...typography.body,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `0 ${spacing[4]}`,
              backgroundColor: showFilters ? colors.accentBg : colors.bgCard,
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

        {/* Expandable Filters */}
        {showFilters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4], padding: `0 ${spacing[1]}` }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              <span style={{ ...typography.label, color: colors.textMuted }}>KATEGORIE / HERKUNFT</span>
              <div
                style={{
                  display: 'flex',
                  gap: spacing[2],
                  overflowX: 'auto',
                  paddingBottom: spacing[1],
                  scrollbarWidth: 'none',
                }}
              >
                <button style={chipStyle(selectedOrigin === 'all')} onClick={() => setSelectedOrigin('all')}>
                  Alle Übungen
                </button>
                <button style={chipStyle(selectedOrigin === 'builtin')} onClick={() => setSelectedOrigin('builtin')}>
                  Von MyLife
                </button>
                <button style={chipStyle(selectedOrigin === 'community')} onClick={() => setSelectedOrigin('community')}>
                  Von Community
                </button>
                <button style={chipStyle(selectedOrigin === 'private')} onClick={() => setSelectedOrigin('private')}>
                  Nur Meine Eigenen
                </button>
              </div>
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: colors.borderLight }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              <span style={{ ...typography.label, color: colors.textMuted }}>MUSKELGRUPPEN</span>
              <div
                style={{
                  display: 'flex',
                  gap: spacing[2],
                  overflowX: 'auto',
                  paddingBottom: spacing[1],
                  scrollbarWidth: 'none',
                }}
              >
                <button style={chipStyle(!selectedMuscle)} onClick={() => setSelectedMuscle(null)}>
                  Egal
                </button>
                {muscleOrder.map((m) => (
                  <button
                    key={m}
                    style={chipStyle(selectedMuscle === m)}
                    onClick={() => setSelectedMuscle(selectedMuscle === m ? null : m)}
                  >
                    {muscleLabels[m]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width: '100%', height: '1px', backgroundColor: colors.borderLight }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              <span style={{ ...typography.label, color: colors.textMuted }}>ART & GERÄT</span>
              <div
                style={{
                  display: 'flex',
                  gap: spacing[2],
                  overflowX: 'auto',
                  paddingBottom: spacing[1],
                  scrollbarWidth: 'none',
                }}
              >
                {equipmentOrder.map((eq) => (
                  <button
                    key={eq}
                    style={chipStyle(selectedEquipment === eq)}
                    onClick={() =>
                      setSelectedEquipment(selectedEquipment === eq ? null : eq)
                    }
                  >
                    {equipmentLabels[eq]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div
        style={{
          flex: 1,
          padding: `${spacing[3]} ${spacing[5]}`,
          paddingBottom: '100px',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: `${spacing[12]} 0`,
              textAlign: 'center',
              color: colors.textMuted,
              ...typography.body,
            }}
          >
            Keine Übungen gefunden.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {filtered.map((mixedEx) => {
              // Local Exercise Render
              const exercise = mixedEx as Exercise;
              const exerciseCreatedBy = (exercise as Exercise & { createdBy?: string }).createdBy;
              const isCustom = (exercise as Exercise & { isCustom?: boolean }).isCustom;
              const isCreator = isCustom && (!exerciseCreatedBy || exerciseCreatedBy === currentUserId);
              const isPublic = (exercise as Exercise & { isPublic?: boolean }).isPublic ?? true;

              return (
                <div
                  key={exercise.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${isCustom ? `${colors.accent}30` : colors.border}`,
                    borderRadius: radius.xl,
                    padding: `${spacing[4]}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onClick={() => router.push(`/stats/exercise/${exercise.id}`)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgElevated;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgCard;
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600 }}>
                        {exercise.nameDE}
                      </div>
                      {isCustom && (
                        <span
                          style={{
                            ...typography.label,
                            color: isPublic ? colors.accent : colors.textMuted,
                            backgroundColor: isPublic ? colors.accentBg : colors.bgElevated,
                            border: `1px solid ${isPublic ? colors.accent + '30' : colors.border}`,
                            borderRadius: radius.sm,
                            padding: '1px 6px',
                          }}
                        >
                          {isPublic ? 'Community' : 'Privat'}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: spacing[2],
                        marginTop: spacing[1],
                        flexWrap: 'wrap',
                      }}
                    >
                      <Badge variant="muted">{muscleLabels[exercise.primaryMuscle]}</Badge>
                      <Badge variant="muted">
                        {exercise.equipment?.map((e) => equipmentLabels[e as Equipment] ?? e).join(', ')}
                      </Badge>
                      <Badge variant={exercise.category === 'compound' ? 'accent' : 'default'}>
                        {exercise.category === 'compound'
                          ? 'Mehrgelenk'
                          : exercise.category === 'isolation'
                            ? 'Isolation'
                            : 'Ausdauer'}
                      </Badge>
                    </div>
                  </div>

                  {activeWorkout && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWorkout(exercise.id);
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: `${colors.accent}20`,
                        border: `1px solid ${colors.accent}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'background-color 0.15s',
                      }}
                      title="Zum Workout hinzufügen"
                    >
                      <Plus size={16} color={colors.accent} />
                    </button>
                  )}

                  {isCreator && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1], marginRight: spacing[1] }}>
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
                          padding: spacing[2],
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
                          padding: spacing[2],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.danger,
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}

                  <ChevronRight size={16} color={colors.textFaint} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal removed as external database integration is disabled */}
    </div>
  );
}
