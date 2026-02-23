'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import type { MuscleGroup, Equipment, ExerciseCategory } from '@/types/exercises';

const muscleOptions: { id: MuscleGroup; label: string }[] = [
  { id: 'chest',     label: 'Brust'      },
  { id: 'back',      label: 'Rücken'     },
  { id: 'shoulders', label: 'Schultern'  },
  { id: 'biceps',    label: 'Bizeps'     },
  { id: 'triceps',   label: 'Trizeps'    },
  { id: 'legs',      label: 'Beine'      },
  { id: 'glutes',    label: 'Gesäß'      },
  { id: 'core',      label: 'Core'       },
  { id: 'calves',    label: 'Waden'      },
  { id: 'forearms',  label: 'Unterarme'  },
];

const equipmentOptions: { id: Equipment; label: string }[] = [
  { id: 'barbell',    label: 'Langhantel'   },
  { id: 'dumbbell',   label: 'Kurzhantel'   },
  { id: 'cable',      label: 'Kabel'        },
  { id: 'machine',    label: 'Maschine'     },
  { id: 'bodyweight', label: 'Eigengewicht' },
  { id: 'kettlebell', label: 'Kettlebell'   },
  { id: 'band',       label: 'Band'         },
  { id: 'smith',      label: 'Smith'        },
];

const categoryOptions: { id: ExerciseCategory; label: string }[] = [
  { id: 'compound',  label: 'Compound'  },
  { id: 'isolation', label: 'Isolation' },
  { id: 'cardio',    label: 'Cardio'    },
];

const restOptions = [45, 60, 90, 120, 180];

export default function CustomExercisePage() {
  const router = useRouter();

  const [nameDE, setNameDE] = useState('');
  const [nameEN, setNameEN] = useState('');
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup | null>(null);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [category, setCategory] = useState<ExerciseCategory>('compound');
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultReps, setDefaultReps] = useState(10);
  const [defaultWeight, setDefaultWeight] = useState(0);
  const [repRangeMin, setRepRangeMin] = useState(8);
  const [repRangeMax, setRepRangeMax] = useState(12);
  const [restSeconds, setRestSeconds] = useState(90);
  const [scienceNote, setScienceNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleSecondary = (muscle: MuscleGroup) => {
    setSecondaryMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const toggleEquipment = (eq: Equipment) => {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  };

  const canSave =
    nameDE.trim().length > 0 && primaryMuscle !== null && equipment.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Du musst eingeloggt sein, um eigene Übungen zu erstellen.');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase.from('community_exercises').insert({
        name: nameEN.trim() || nameDE.trim(),
        name_de: nameDE.trim(),
        primary_muscle: primaryMuscle,
        secondary_muscles: secondaryMuscles,
        equipment,
        category,
        default_sets: defaultSets,
        default_reps: defaultReps,
        default_weight: defaultWeight,
        rep_range_min: repRangeMin,
        rep_range_max: repRangeMax,
        rest_seconds: restSeconds,
        science_note: scienceNote.trim(),
        created_by: user.id,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern.');
      setSaving(false);
    }
  };

  const sectionLabel = (text: string) => (
    <div
      style={{
        ...typography.label,
        color: colors.textMuted,
        marginBottom: spacing[2],
      }}
    >
      {text}
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: colors.bgPrimary,
        minHeight: '100dvh',
        paddingBottom: '100px',
      }}
    >
      <PageHeader title="Eigene Übung" />

      {success ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[12],
            gap: spacing[4],
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: colors.successBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={32} color={colors.success} />
          </div>
          <p style={{ ...typography.body, color: colors.success }}>Übung erstellt!</p>
          <p style={{ ...typography.bodySm, color: colors.textMuted }}>
            Sie erscheint jetzt in der Übungssuche für alle Nutzer.
          </p>
        </div>
      ) : (
        <div
          style={{
            padding: spacing[5],
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[5],
          }}
        >
          {/* Name DE */}
          <div>
            {sectionLabel('NAME (DEUTSCH) *')}
            <input
              value={nameDE}
              onChange={(e) => setNameDE(e.target.value)}
              placeholder="z.B. Schrägbank Kurzhanteldrücken"
              style={inputStyle}
            />
          </div>

          {/* Name EN */}
          <div>
            {sectionLabel('NAME (ENGLISCH)')}
            <input
              value={nameEN}
              onChange={(e) => setNameEN(e.target.value)}
              placeholder="z.B. Incline Dumbbell Press"
              style={inputStyle}
            />
          </div>

          {/* Primary muscle */}
          <div>
            {sectionLabel('HAUPTMUSKEL *')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
              {muscleOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPrimaryMuscle(m.id)}
                  style={chipStyle(primaryMuscle === m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary muscles */}
          <div>
            {sectionLabel('NEBENMUSKELN')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
              {muscleOptions
                .filter((m) => m.id !== primaryMuscle)
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleSecondary(m.id)}
                    style={chipStyle(secondaryMuscles.includes(m.id))}
                  >
                    {m.label}
                    {secondaryMuscles.includes(m.id) && (
                      <X size={10} style={{ marginLeft: '4px' }} />
                    )}
                  </button>
                ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            {sectionLabel('EQUIPMENT *')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
              {equipmentOptions.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  style={chipStyle(equipment.includes(eq.id))}
                >
                  {eq.label}
                  {equipment.includes(eq.id) && (
                    <Check size={10} style={{ marginLeft: '4px' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            {sectionLabel('KATEGORIE')}
            <div style={{ display: 'flex', gap: spacing[2] }}>
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    ...chipStyle(category === cat.id),
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Default sets / reps / weight */}
          <div>
            {sectionLabel('STANDARD-WERTE')}
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[1] }}>
                  SÄTZE
                </div>
                <input
                  type="number"
                  value={defaultSets}
                  onChange={(e) => setDefaultSets(Number(e.target.value))}
                  min={1}
                  max={10}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[1] }}>
                  WDH
                </div>
                <input
                  type="number"
                  value={defaultReps}
                  onChange={(e) => setDefaultReps(Number(e.target.value))}
                  min={1}
                  max={100}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[1] }}>
                  KG
                </div>
                <input
                  type="number"
                  value={defaultWeight}
                  onChange={(e) => setDefaultWeight(Number(e.target.value))}
                  min={0}
                  step={2.5}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Rep range */}
          <div>
            {sectionLabel('ZIEL-WIEDERHOLUNGEN')}
            <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
              <input
                type="number"
                value={repRangeMin}
                onChange={(e) => setRepRangeMin(Number(e.target.value))}
                min={1}
                max={repRangeMax}
                style={{ ...inputStyle, flex: 1 }}
              />
              <span style={{ ...typography.body, color: colors.textMuted }}>–</span>
              <input
                type="number"
                value={repRangeMax}
                onChange={(e) => setRepRangeMax(Number(e.target.value))}
                min={repRangeMin}
                max={100}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          {/* Rest seconds */}
          <div>
            {sectionLabel('PAUSE ZWISCHEN SÄTZEN')}
            <div style={{ display: 'flex', gap: spacing[2] }}>
              {restOptions.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setRestSeconds(sec)}
                  style={{
                    ...chipStyle(restSeconds === sec),
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Science note */}
          <div>
            {sectionLabel('FORM-CUES & WISSENSCHAFTLICHE HINWEISE')}
            <textarea
              value={scienceNote}
              onChange={(e) => setScienceNote(e.target.value)}
              placeholder="z.B. Schulterblätter zusammenziehen, kontrollierte Exzentrik..."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '80px',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: spacing[3],
                backgroundColor: colors.dangerBg,
                border: `1px solid ${colors.danger}40`,
                borderRadius: radius.md,
                ...typography.bodySm,
                color: colors.danger,
              }}
            >
              {error}
            </div>
          )}

          {/* Validation hint */}
          {!canSave && (
            <p style={{ ...typography.bodySm, color: colors.textFaint }}>
              * Name, Hauptmuskel und Equipment sind erforderlich.
            </p>
          )}
        </div>
      )}

      {/* Fixed save button */}
      {!success && (
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
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? 'Wird gespeichert...' : 'Übung erstellen'}
          </Button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: `${spacing[3]} ${spacing[4]}`,
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  ...typography.body,
  color: colors.textPrimary,
  boxSizing: 'border-box',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing[1]} ${spacing[3]}`,
    borderRadius: radius.full,
    border: `1px solid ${active ? colors.accent : colors.border}`,
    backgroundColor: active ? colors.accentBg : 'transparent',
    ...typography.bodySm,
    color: active ? colors.accent : colors.textMuted,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };
}
