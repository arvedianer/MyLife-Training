'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Play, Plus, Sofa, Droplets, Moon, Beef, PersonStanding, Clock } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/store/workoutStore';
import { usePlanStore } from '@/store/planStore';
import { useHistoryStore } from '@/store/historyStore';
import { getExerciseById } from '@/constants/exercises';
import { calculateIntelligentWeight } from '@/utils/overload';

export default function StartPage() {
  const router = useRouter();
  const { startWorkout, activeWorkout } = useWorkoutStore();
  const { getActiveSplit, getTodaysSplitDay } = usePlanStore();
  const { sessions } = useHistoryStore();

  const activeSplit = getActiveSplit();
  const todaysDayOriginal = getTodaysSplitDay();
  const lastSession = sessions[0];

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  // States for Rest Day checklist (ephemeral for today)
  const [restDayChecklist, setRestDayChecklist] = useState({
    hydration: false,
    stretching: false,
    sleep: false,
    macros: false,
  });

  useEffect(() => {
    if (!selectedDayId) {
      if (todaysDayOriginal) {
        setSelectedDayId(todaysDayOriginal.id);
      } else if (activeSplit && activeSplit.days.length > 0) {
        setSelectedDayId(activeSplit.days[0].id);
      }
    }
  }, [todaysDayOriginal, activeSplit, selectedDayId]);

  const displayDay = activeSplit?.days.find(d => d.id === selectedDayId);
  const isActualToday = displayDay?.id === todaysDayOriginal?.id;

  // Workout preview: weight suggestions + duration estimate
  const previewData = displayDay?.exerciseIds.slice(0, 4).map((exId) => {
    const ex = getExerciseById(exId);
    const suggestion = ex ? calculateIntelligentWeight(ex.id, sessions) : null;
    return { ex, weight: suggestion?.weight ?? null };
  });
  // ~4 sets per exercise, ~2 min set+rest avg → 8min/exercise, rounded
  const estimatedMin = Math.round((displayDay?.exerciseIds.length ?? 0) * 8);

  const handleStartPlanned = () => {
    if (!displayDay) return;
    startWorkout(displayDay.name ?? activeSplit?.name, displayDay.exerciseIds);
    router.push('/workout/active');
  };

  const handleStartFree = () => {
    startWorkout();
    router.push('/workout/active');
  };

  const handleContinue = () => {
    router.push('/workout/active');
  };

  return (
    <div
      style={{
        padding: spacing[5],
        paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[6],
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Training</h1>
        <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
          Wähle wie du starten möchtest
        </p>
      </div>

      {/* Aktives Workout fortsetzen */}
      {activeWorkout && (
        <div
          style={{
            backgroundColor: colors.accentBg,
            border: `1px solid ${colors.accent}40`,
            borderRadius: radius.xl,
            padding: spacing[5],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <div>
              <span style={{ ...typography.label, color: colors.accent }}>LÄUFT GERADE</span>
              <h2 style={{ ...typography.h3, color: colors.textPrimary, marginTop: spacing[1] }}>
                {activeWorkout.plannedSplit ?? 'Freies Training'}
              </h2>
              <p style={{ ...typography.bodySm, color: colors.textMuted }}>
                {activeWorkout.exercises.length} Übungen
              </p>
            </div>
          </div>
          <Button fullWidth size="lg" onClick={handleContinue}>
            Fortsetzen
          </Button>
        </div>
      )}

      {/* Geplantes Training / Rest Day */}
      {activeSplit && displayDay && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <h2 style={{ ...typography.h3, color: colors.textPrimary }}>
              {isActualToday ? 'Heutiger Plan' : 'Plan auswählen'}
            </h2>
            <span style={{ ...typography.bodySm, color: colors.textMuted }}>
              {activeSplit.name}
            </span>
          </div>

          {/* Day Selector */}
          <div style={{ display: 'flex', gap: spacing[2], overflowX: 'auto', paddingBottom: spacing[3], margin: `0 -${spacing[5]}`, paddingLeft: spacing[5], paddingRight: spacing[5], scrollbarWidth: 'none' }}>
            {activeSplit.days.map(day => (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  borderRadius: radius.full,
                  backgroundColor: selectedDayId === day.id ? colors.accent : colors.bgCard,
                  border: `1px solid ${selectedDayId === day.id ? colors.accent : colors.border}`,
                  color: selectedDayId === day.id ? '#000' : colors.textMuted,
                  ...typography.label,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: day.restDay && selectedDayId !== day.id ? 0.6 : 1,
                }}
              >
                {day.name} {day.restDay && <Sofa size={11} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />}
              </button>
            ))}
          </div>

          {displayDay.restDay ? (
            <div
              style={{
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.xl,
                padding: spacing[4],
              }}
            >
              <div style={{ marginBottom: spacing[4], textAlign: 'center' }}>
                <h3 style={{ ...typography.h3, color: colors.accent }}>Rest Day</h3>
                <p style={{ ...typography.bodySm, color: colors.textMuted, marginTop: spacing[1] }}>
                  Erholung ist der Schlüssel zum Muskelaufbau.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                {(
                [
                  { id: 'hydration', label: '3-4 Liter Wasser getrunken', Icon: Droplets },
                  { id: 'sleep', label: '8+ Stunden geschlafen', Icon: Moon },
                  { id: 'macros', label: 'Protein-Ziel erreicht', Icon: Beef },
                  { id: 'stretching', label: '10 Min. Mobility / Stretching', Icon: PersonStanding },
                ] as const
              ).map((item) => {
                const checked = restDayChecklist[item.id as keyof typeof restDayChecklist];
                return (
                  <div
                    key={item.id}
                    onClick={() => setRestDayChecklist(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[3],
                      backgroundColor: checked ? `${colors.accent}15` : colors.bgHighest,
                      border: `1px solid ${checked ? colors.accent : colors.border}`,
                      borderRadius: radius.lg,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${checked ? colors.accent : colors.textDisabled}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: checked ? colors.accent : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <div style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</div>
                      )}
                    </div>
                    <item.Icon size={16} color={checked ? colors.accent : colors.textMuted} />
                    <span
                      style={{
                        ...typography.body,
                        color: checked ? colors.textPrimary : colors.textSecondary,
                        textDecoration: checked ? 'line-through' : 'none',
                        opacity: checked ? 0.7 : 1,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.xl,
                padding: spacing[4],
              }}
            >
              <div style={{ marginBottom: spacing[3] }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ ...typography.h3, color: colors.textPrimary }}>{displayDay.name}</h3>
                  {estimatedMin > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color={colors.textMuted} />
                      <span style={{ ...typography.monoSm, color: colors.textMuted }}>ca. {estimatedMin} min</span>
                    </div>
                  )}
                </div>
                <p style={{ ...typography.bodySm, color: colors.textMuted, marginTop: spacing[1] }}>
                  {displayDay.exerciseIds.length} Übungen geplant
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[4] }}>
                {previewData?.map(({ ex, weight }) => {
                  if (!ex) return null;
                  return (
                    <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: colors.accent,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ ...typography.body, color: colors.textSecondary, flex: 1 }}>{ex.nameDE}</span>
                      {weight !== null && (
                        <span style={{ ...typography.monoSm, color: colors.textMuted }}>{weight} kg</span>
                      )}
                    </div>
                  );
                })}
                {displayDay.exerciseIds.length > 4 && (
                  <span style={{ ...typography.bodySm, color: colors.textMuted, marginLeft: spacing[4] }}>
                    +{displayDay.exerciseIds.length - 4} weitere
                  </span>
                )}
              </div>
              <Button
                fullWidth
                size="lg"
                onClick={handleStartPlanned}
                disabled={!!activeWorkout}
              >
                <Play size={18} />
                {displayDay.name} starten
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Manual Rest Day View (if selected from Quick Start) */}
      {selectedDayId === 'manual-rest-day' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <h2 style={{ ...typography.h3, color: colors.textPrimary }}>
              Manueller Rest Day
            </h2>
            <button
              onClick={() => setSelectedDayId(todaysDayOriginal?.id || (activeSplit?.days[0]?.id as string))}
              style={{ ...typography.bodySm, color: colors.accent, background: 'none', border: 'none', padding: 0 }}
            >
              Abbrechen
            </button>
          </div>
          <div
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.xl,
              padding: spacing[4],
            }}
          >
            <div style={{ marginBottom: spacing[4], textAlign: 'center' }}>
              <h3 style={{ ...typography.h3, color: colors.accent }}>Rest Day</h3>
              <p style={{ ...typography.bodySm, color: colors.textMuted, marginTop: spacing[1] }}>
                Dein spontaner Ruhetag. Erholung ist der Schlüssel zum Muskelaufbau.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              {(
                [
                  { id: 'hydration', label: '3-4 Liter Wasser getrunken', Icon: Droplets },
                  { id: 'sleep', label: '8+ Stunden geschlafen', Icon: Moon },
                  { id: 'macros', label: 'Protein-Ziel erreicht', Icon: Beef },
                  { id: 'stretching', label: '10 Min. Mobility / Stretching', Icon: PersonStanding },
                ] as const
              ).map((item) => {
                const checked = restDayChecklist[item.id as keyof typeof restDayChecklist];
                return (
                  <div
                    key={item.id}
                    onClick={() => setRestDayChecklist(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[3],
                      padding: spacing[3],
                      backgroundColor: checked ? `${colors.accent}15` : colors.bgHighest,
                      border: `1px solid ${checked ? colors.accent : colors.border}`,
                      borderRadius: radius.lg,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${checked ? colors.accent : colors.textDisabled}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: checked ? colors.accent : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <div style={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}>✓</div>
                      )}
                    </div>
                    <item.Icon size={16} color={checked ? colors.accent : colors.textMuted} />
                    <span
                      style={{
                        ...typography.body,
                        color: checked ? colors.textPrimary : colors.textSecondary,
                        textDecoration: checked ? 'line-through' : 'none',
                        opacity: checked ? 0.7 : 1,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Freies Training */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Schnellstart
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          <Card onPress={activeWorkout ? undefined : handleStartFree}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: radius.md,
                  backgroundColor: colors.bgHighest,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={22} color={colors.textMuted} />
              </div>
              <div>
                <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                  Leeres Training
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                  Selbst Übungen hinzufügen
                </div>
              </div>
            </div>
          </Card>

          {/* Manuelles Rest Day Card */}
          <Card onPress={() => setSelectedDayId('manual-rest-day')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: radius.md,
                  backgroundColor: `${colors.accent}15`,
                  border: `1px solid ${colors.accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sofa size={22} color={colors.accent} />
              </div>
              <div>
                <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                  Rest Day einlegen
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                  Heute pausieren & regenerieren
                </div>
              </div>
            </div>
          </Card>

          {lastSession && (
            <Card onPress={activeWorkout ? undefined : () => {
              // Repeat last session: pre-load the same exercise IDs in order
              const lastExerciseIds = lastSession.exercises.map((e) => e.exercise.id);
              startWorkout(lastSession.splitName, lastExerciseIds);
              router.push('/workout/active');
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: radius.md,
                    backgroundColor: colors.bgHighest,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={22} color={colors.textMuted} />
                </div>
                <div>
                  <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                    Letzte Einheit wiederholen
                  </div>
                  <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                    {lastSession.splitName ?? 'Freies Training'}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
