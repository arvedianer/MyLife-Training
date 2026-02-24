'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronRight, Dumbbell } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { exercises as allExercises } from '@/constants/exercises';
import { Badge } from '@/components/ui/Badge';
import { useWorkoutStore } from '@/store/workoutStore';
import type { MuscleGroup, Equipment } from '@/types/exercises';

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
};

const muscleOrder: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'legs', 'glutes',
  'biceps', 'triceps', 'core', 'calves', 'forearms',
];

const equipmentOrder: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band',
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

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

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
      if (
        selectedMuscle &&
        ex.primaryMuscle !== selectedMuscle &&
        !ex.secondaryMuscles.includes(selectedMuscle)
      )
        return false;
      if (selectedEquipment && !ex.equipment.includes(selectedEquipment))
        return false;
      return true;
    });
  }, [search, selectedMuscle, selectedEquipment]);

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
      {/* Header */}
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
          <span
            style={{
              ...typography.bodySm,
              color: colors.textMuted,
              marginLeft: 'auto',
            }}
          >
            {filtered.length} von {allExercises.length}
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: spacing[3] }}>
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

        {/* Muscle filter chips */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            overflowX: 'auto',
            paddingBottom: spacing[2],
            scrollbarWidth: 'none',
          }}
        >
          <button style={chipStyle(!selectedMuscle)} onClick={() => setSelectedMuscle(null)}>
            Alle
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

        {/* Equipment filter chips */}
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
            {filtered.map((exercise) => (
              <div
                key={exercise.id}
                style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
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
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600 }}>
                    {exercise.nameDE}
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
                      {exercise.equipment.map((e) => equipmentLabels[e] ?? e).join(', ')}
                    </Badge>
                    <Badge variant={exercise.category === 'compound' ? 'accent' : 'default'}>
                      {exercise.category === 'compound'
                        ? 'Compound'
                        : exercise.category === 'isolation'
                        ? 'Isolation'
                        : 'Cardio'}
                    </Badge>
                  </div>
                </div>

                {/* Add to Workout button (only if workout is active) */}
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

                <ChevronRight size={16} color={colors.textFaint} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
