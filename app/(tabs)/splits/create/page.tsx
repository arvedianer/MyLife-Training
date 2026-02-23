'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Search, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { usePlanStore } from '@/store/planStore';
import { exercises as allExercises, getExerciseById } from '@/constants/exercises';
import type { TrainingSplit, RepScheme } from '@/types/splits';
import type { MuscleGroup, Equipment } from '@/types/exercises';

interface DayForm {
  name: string;
  exerciseIds: string[];
  repScheme: RepScheme;
}

const muscleFilterOptions: { id: MuscleGroup; label: string }[] = [
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

const equipmentFilterOptions: { id: Equipment; label: string }[] = [
  { id: 'barbell',    label: 'Langhantel'   },
  { id: 'dumbbell',   label: 'Kurzhantel'   },
  { id: 'cable',      label: 'Kabel'        },
  { id: 'machine',    label: 'Maschine'     },
  { id: 'bodyweight', label: 'Eigengewicht' },
  { id: 'kettlebell', label: 'Kettlebell'   },
  { id: 'band',       label: 'Band'         },
];

const repSchemeOptions: { id: RepScheme; label: string; color: string; bg: string }[] = [
  { id: 'strength',    label: 'KRAFT',          color: '#FF9500', bg: '#1A1000' },
  { id: 'hypertrophy', label: 'HYPERTROPHIE',   color: colors.accent, bg: colors.accentBg },
  { id: 'endurance',   label: 'AUSDAUER',       color: colors.success, bg: colors.successBg },
];

export default function CreateSplitPage() {
  const router = useRouter();
  const { addSplit, splits } = usePlanStore();

  const [splitName, setSplitName] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [days, setDays] = useState<DayForm[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({
      name: defaultDayName(i, 3),
      exerciseIds: [],
      repScheme: 'hypertrophy' as RepScheme,
    }))
  );
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [searchDayIndex, setSearchDayIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMuscle, setSearchMuscle] = useState<MuscleGroup | null>(null);
  const [searchEquipment, setSearchEquipment] = useState<Equipment | null>(null);

  const filteredExercises = useMemo(() => {
    return allExercises.filter((e) => {
      const matchesQuery =
        searchQuery.length === 0 ||
        e.nameDE.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMuscle =
        !searchMuscle ||
        e.primaryMuscle === searchMuscle ||
        e.secondaryMuscles.includes(searchMuscle);

      const matchesEquipment =
        !searchEquipment || e.equipment.includes(searchEquipment);

      return matchesQuery && matchesMuscle && matchesEquipment;
    });
  }, [searchQuery, searchMuscle, searchEquipment]);

  const handleDaysPerWeekChange = useCallback((n: number) => {
    setDaysPerWeek(n);
    setDays((prev) => {
      if (n > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: n - prev.length }, (_, i) => ({
            name: defaultDayName(prev.length + i, n),
            exerciseIds: [] as string[],
            repScheme: 'hypertrophy' as RepScheme,
          })),
        ];
      }
      return prev.slice(0, n);
    });
  }, []);

  const handleToggleExercise = (dayIndex: number, exId: string) => {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const has = d.exerciseIds.includes(exId);
        return {
          ...d,
          exerciseIds: has
            ? d.exerciseIds.filter((id) => id !== exId)
            : [...d.exerciseIds, exId],
        };
      })
    );
  };

  const handleRemoveExercise = (dayIndex: number, exId: string) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, exerciseIds: d.exerciseIds.filter((id) => id !== exId) }
          : d
      )
    );
  };

  const handleRepScheme = (dayIndex: number, scheme: RepScheme) => {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, repScheme: scheme } : d))
    );
  };

  const openPicker = (dayIdx: number) => {
    setSearchDayIndex(dayIdx);
    setSearchQuery('');
    setSearchMuscle(null);
    setSearchEquipment(null);
  };

  const handleSave = () => {
    if (!splitName.trim()) return;
    const newSplit: TrainingSplit = {
      id: `custom-${Date.now()}`,
      name: splitName.trim(),
      type: 'custom',
      description: 'Eigener Trainingsplan',
      daysPerWeek,
      difficulty: 'intermediate',
      isActive: splits.length === 0,
      createdAt: Date.now(),
      scienceNote: '',
      days: days.map((d, i) => ({
        id: `custom-day-${Date.now()}-${i}`,
        name: d.name.trim() || `Tag ${i + 1}`,
        muscleGroups: [],
        exerciseIds: d.exerciseIds,
        restDay: false,
        repScheme: d.repScheme,
      })),
    };
    addSplit(newSplit);
    router.back();
  };

  const canSave = splitName.trim().length > 0;

  return (
    <div
      style={{
        backgroundColor: colors.bgPrimary,
        minHeight: '100dvh',
        paddingBottom: '80px',
      }}
    >
      <PageHeader title="Eigener Plan" />

      <div
        style={{
          padding: spacing[5],
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[5],
        }}
      >
        {/* Plan Name */}
        <div>
          <label
            style={{
              ...typography.label,
              color: colors.textMuted,
              display: 'block',
              marginBottom: spacing[2],
            }}
          >
            PLAN NAME
          </label>
          <input
            value={splitName}
            onChange={(e) => setSplitName(e.target.value)}
            placeholder="z.B. Mein Push Pull Split"
            style={{
              width: '100%',
              padding: `${spacing[3]} ${spacing[4]}`,
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              ...typography.body,
              color: colors.textPrimary,
            }}
          />
        </div>

        {/* Days per week */}
        <div>
          <label
            style={{
              ...typography.label,
              color: colors.textMuted,
              display: 'block',
              marginBottom: spacing[2],
            }}
          >
            TRAININGSTAGE PRO WOCHE
          </label>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => handleDaysPerWeekChange(n)}
                style={{
                  flex: 1,
                  padding: spacing[2],
                  borderRadius: radius.md,
                  border: `1px solid ${daysPerWeek === n ? colors.accent : colors.border}`,
                  backgroundColor: daysPerWeek === n ? colors.accentBg : 'transparent',
                  ...typography.label,
                  color: daysPerWeek === n ? colors.accent : colors.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Day cards */}
        {days.map((day, dayIdx) => (
          <div
            key={dayIdx}
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${expandedDay === dayIdx ? colors.accent + '40' : colors.border}`,
              borderRadius: radius.xl,
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
          >
            {/* Day header */}
            <button
              onClick={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}
              style={{
                width: '100%',
                padding: spacing[4],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    ...typography.label,
                    color: colors.textMuted,
                    minWidth: '44px',
                    flexShrink: 0,
                  }}
                >
                  TAG {dayIdx + 1}
                </span>
                <input
                  value={day.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    setDays((prev) =>
                      prev.map((d, i) =>
                        i === dayIdx ? { ...d, name: e.target.value } : d
                      )
                    );
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`Tag ${dayIdx + 1}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    ...typography.h3,
                    color: colors.textPrimary,
                    flex: 1,
                    minWidth: 0,
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  flexShrink: 0,
                }}
              >
                {day.exerciseIds.length > 0 && (
                  <span
                    style={{
                      ...typography.monoSm,
                      color: colors.accent,
                      backgroundColor: colors.accentBg,
                      padding: `2px ${spacing[2]}`,
                      borderRadius: radius.full,
                    }}
                  >
                    {day.exerciseIds.length}
                  </span>
                )}
                {expandedDay === dayIdx ? (
                  <ChevronUp size={16} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={colors.textMuted} />
                )}
              </div>
            </button>

            {/* Expanded: exercise list + picker */}
            {expandedDay === dayIdx && (
              <div style={{ borderTop: `1px solid ${colors.borderLight}` }}>
                {/* Selected exercises */}
                {day.exerciseIds.length > 0 && (
                  <div style={{ padding: `${spacing[2]} ${spacing[4]}` }}>
                    {day.exerciseIds.map((exId) => {
                      const ex = getExerciseById(exId);
                      if (!ex) return null;
                      return (
                        <div
                          key={exId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: `${spacing[2]} 0`,
                            borderBottom: `1px solid ${colors.borderLight}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing[3],
                            }}
                          >
                            <div
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: colors.accent,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ ...typography.body, color: colors.textSecondary }}>
                              {ex.nameDE}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveExercise(dayIdx, exId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: spacing[1],
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <X size={14} color={colors.textDisabled} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Exercise picker */}
                {searchDayIndex === dayIdx ? (
                  <div style={{ padding: spacing[4] }}>
                    {/* Search bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        backgroundColor: colors.bgHighest,
                        borderRadius: radius.lg,
                        padding: `${spacing[2]} ${spacing[3]}`,
                        marginBottom: spacing[2],
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Search size={14} color={colors.textMuted} />
                      <input
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Übung suchen..."
                        style={{
                          flex: 1,
                          background: 'none',
                          border: 'none',
                          ...typography.body,
                          color: colors.textPrimary,
                        }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <X size={12} color={colors.textMuted} />
                        </button>
                      )}
                    </div>

                    {/* Muscle filter chips */}
                    <div style={{ overflowX: 'auto', paddingBottom: '2px', marginBottom: spacing[1] }}>
                      <div style={{ display: 'flex', gap: spacing[1], width: 'max-content' }}>
                        <button
                          onClick={() => setSearchMuscle(null)}
                          style={filterChipStyle(!searchMuscle)}
                        >
                          ALLE
                        </button>
                        {muscleFilterOptions.map((mg) => (
                          <button
                            key={mg.id}
                            onClick={() => setSearchMuscle(searchMuscle === mg.id ? null : mg.id)}
                            style={filterChipStyle(searchMuscle === mg.id)}
                          >
                            {mg.label.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Equipment filter chips */}
                    <div style={{ overflowX: 'auto', paddingBottom: '2px', marginBottom: spacing[3] }}>
                      <div style={{ display: 'flex', gap: spacing[1], width: 'max-content' }}>
                        <button
                          onClick={() => setSearchEquipment(null)}
                          style={filterChipStyle(!searchEquipment)}
                        >
                          ALLE
                        </button>
                        {equipmentFilterOptions.map((eq) => (
                          <button
                            key={eq.id}
                            onClick={() => setSearchEquipment(searchEquipment === eq.id ? null : eq.id)}
                            style={filterChipStyle(searchEquipment === eq.id)}
                          >
                            {eq.label.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exercise list */}
                    <div
                      style={{
                        maxHeight: '220px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        marginBottom: spacing[3],
                      }}
                    >
                      {filteredExercises.map((ex) => {
                        const selected = day.exerciseIds.includes(ex.id);
                        return (
                          <button
                            key={ex.id}
                            onClick={() => handleToggleExercise(dayIdx, ex.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: `${spacing[2]} ${spacing[3]}`,
                              borderRadius: radius.md,
                              backgroundColor: selected ? colors.accentBg : 'transparent',
                              border: `1px solid ${selected ? colors.accent + '40' : 'transparent'}`,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.1s',
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  ...typography.body,
                                  color: selected ? colors.accent : colors.textSecondary,
                                  display: 'block',
                                }}
                              >
                                {ex.nameDE}
                              </span>
                              <span
                                style={{
                                  ...typography.bodySm,
                                  color: colors.textMuted,
                                }}
                              >
                                {ex.primaryMuscle} · {ex.category} · {ex.equipment[0]}
                              </span>
                            </div>
                            {selected && (
                              <Check size={14} color={colors.accent} style={{ flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setSearchDayIndex(null);
                        setSearchQuery('');
                        setSearchMuscle(null);
                        setSearchEquipment(null);
                      }}
                      style={{
                        ...typography.bodySm,
                        color: colors.accent,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Fertig ({day.exerciseIds.length} ausgewählt)
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: spacing[4], display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                    {/* Add exercises button */}
                    <button
                      onClick={() => openPicker(dayIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing[2],
                        width: '100%',
                        padding: `${spacing[3]} ${spacing[4]}`,
                        borderRadius: radius.lg,
                        border: `1px dashed ${colors.accent}50`,
                        backgroundColor: 'transparent',
                        ...typography.bodySm,
                        color: colors.accent,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <Plus size={14} />
                      Übungen auswählen
                    </button>

                    {/* Rep scheme selector */}
                    <div>
                      <div style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[2] }}>
                        TRAININGSFOKUS
                      </div>
                      <div style={{ display: 'flex', gap: spacing[2] }}>
                        {repSchemeOptions.map((opt) => {
                          const active = day.repScheme === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleRepScheme(dayIdx, opt.id)}
                              style={{
                                flex: 1,
                                padding: `${spacing[2]} ${spacing[1]}`,
                                borderRadius: radius.md,
                                border: `1px solid ${active ? opt.color : colors.border}`,
                                backgroundColor: active ? opt.bg : 'transparent',
                                ...typography.label,
                                color: active ? opt.color : colors.textMuted,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontSize: '9px',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fixed save button */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          padding: `${spacing[4]} ${spacing[5]}`,
          paddingBottom: `calc(${spacing[4]} + env(safe-area-inset-bottom))`,
          backgroundColor: colors.bgPrimary,
          borderTop: `1px solid ${colors.borderLight}`,
        }}
      >
        <Button fullWidth size="lg" onClick={handleSave} disabled={!canSave}>
          Plan speichern
        </Button>
      </div>
    </div>
  );
}

function filterChipStyle(active: boolean): React.CSSProperties {
  return {
    flexShrink: 0,
    padding: '2px 8px',
    borderRadius: '100px',
    border: `1px solid ${active ? colors.accent : colors.border}`,
    backgroundColor: active ? colors.accentBg : 'transparent',
    fontSize: '10px',
    fontWeight: '700',
    color: active ? colors.accent : colors.textMuted,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
  };
}

function defaultDayName(index: number, total: number): string {
  const pplNames = ['Push', 'Pull', 'Legs'];
  const ulNames = ['Oberkörper', 'Unterkörper'];
  const broNames = ['Brust', 'Rücken', 'Schultern', 'Arme', 'Beine'];
  if (total === 3) return pplNames[index] ?? `Tag ${index + 1}`;
  if (total === 2 || total === 4) return ulNames[index % 2] ?? `Tag ${index + 1}`;
  if (total === 5) return broNames[index] ?? `Tag ${index + 1}`;
  return `Tag ${index + 1}`;
}
