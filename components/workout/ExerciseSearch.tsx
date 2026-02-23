'use client';

import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { exercises } from '@/constants/exercises';
import type { Exercise, MuscleGroup } from '@/types/exercises';

interface ExerciseSearchProps {
  onSelect: (exercise: Exercise) => void;
}

const muscleGroups: { id: MuscleGroup; label: string }[] = [
  { id: 'chest',      label: 'Brust'      },
  { id: 'back',       label: 'Rücken'     },
  { id: 'shoulders',  label: 'Schultern'  },
  { id: 'biceps',     label: 'Bizeps'     },
  { id: 'triceps',    label: 'Trizeps'    },
  { id: 'legs',       label: 'Beine'      },
  { id: 'glutes',     label: 'Gesäß'      },
  { id: 'core',       label: 'Core'       },
  { id: 'calves',     label: 'Waden'      },
];

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesQuery =
        query.length === 0 ||
        ex.nameDE.toLowerCase().includes(query.toLowerCase()) ||
        ex.name.toLowerCase().includes(query.toLowerCase());

      const matchesMuscle =
        !selectedMuscle ||
        ex.primaryMuscle === selectedMuscle ||
        ex.secondaryMuscles.includes(selectedMuscle);

      return matchesQuery && matchesMuscle;
    });
  }, [query, selectedMuscle]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
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
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          overflowX: 'auto',
          paddingBottom: spacing[1],
        }}
      >
        <button
          onClick={() => setSelectedMuscle(null)}
          style={{
            flexShrink: 0,
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: radius.full,
            border: `1px solid ${!selectedMuscle ? colors.accent : colors.border}`,
            backgroundColor: !selectedMuscle ? colors.accentBg : colors.bgCard,
            ...typography.label,
            color: !selectedMuscle ? colors.accent : colors.textMuted,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          ALLE
        </button>
        {muscleGroups.map((mg) => (
          <button
            key={mg.id}
            onClick={() => setSelectedMuscle(selectedMuscle === mg.id ? null : mg.id)}
            style={{
              flexShrink: 0,
              padding: `${spacing[1]} ${spacing[3]}`,
              borderRadius: radius.full,
              border: `1px solid ${selectedMuscle === mg.id ? colors.accent : colors.border}`,
              backgroundColor: selectedMuscle === mg.id ? colors.accentBg : colors.bgCard,
              ...typography.label,
              color: selectedMuscle === mg.id ? colors.accent : colors.textMuted,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {mg.label.toUpperCase()}
          </button>
        ))}
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
          filtered.map((exercise) => (
            <button
              key={exercise.id}
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
                <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                  {exercise.nameDE}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] }}>
                  <Badge variant="muted">{exercise.primaryMuscle}</Badge>
                  <span style={{ ...typography.bodySm, color: colors.textDisabled }}>
                    {exercise.equipment[0]}
                  </span>
                </div>
              </div>
              <Plus size={18} color={colors.accent} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
