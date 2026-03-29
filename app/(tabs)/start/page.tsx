'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Play, Plus, Sofa, Droplets, Moon, Beef, PersonStanding, Clock, RotateCcw } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { useWorkoutStore } from '@/store/workoutStore';
import { usePlanStore } from '@/store/planStore';
import { useHistoryStore } from '@/store/historyStore';
import { getExerciseById } from '@/constants/exercises';
import { calculateIntelligentWeight } from '@/utils/overload';

export default function StartPage() {
  const router = useRouter();
  const { startWorkout, activeWorkout } = useWorkoutStore();
  const { getActiveSplit, getTodaysSplitDay } = usePlanStore();
  const { sessions, addRestDay } = useHistoryStore();

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
  const [restDaySaved, setRestDaySaved] = useState(false);

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

  const handleRepeatLast = () => {
    if (!lastSession || activeWorkout) return;
    const lastExerciseIds = lastSession.exercises.map((e) => e.exercise.id);
    startWorkout(lastSession.splitName, lastExerciseIds);
    router.push('/workout/active');
  };

  const handleRestDay = () => {
    setSelectedDayId('manual-rest-day');
    const today = new Date().toISOString().split('T')[0];
    addRestDay(today);
    setRestDaySaved(true);
    setTimeout(() => setRestDaySaved(false), 2000);
  };

  const handleContinue = () => {
    router.push('/workout/active');
  };

  const restDayChecklistItems = [
    { id: 'hydration', label: '3-4 Liter Wasser getrunken', Icon: Droplets },
    { id: 'sleep', label: '8+ Stunden geschlafen', Icon: Moon },
    { id: 'macros', label: 'Protein-Ziel erreicht', Icon: Beef },
    { id: 'stretching', label: '10 Min. Mobility / Stretching', Icon: PersonStanding },
  ] as const;

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
          {activeSplit && isActualToday
            ? `Heute · ${activeSplit.name}`
            : 'Wähle wie du starten möchtest'}
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

      {/* Manual Rest Day View */}
      {selectedDayId === 'manual-rest-day' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <h2 style={{ ...typography.h3, color: colors.textPrimary }}>
              Manueller Rest Day
            </h2>
            <button
              onClick={() => setSelectedDayId(todaysDayOriginal?.id ?? activeSplit?.days[0]?.id ?? null)}
              style={{ ...typography.bodySm, color: colors.accent, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
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
              {restDayChecklistItems.map((item) => {
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

      {/* PRIMARY SECTION — Planned workout (when plan exists and no manual rest day) */}
      {activeSplit && displayDay && selectedDayId !== 'manual-rest-day' && (
        <div>
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
            /* Plan Rest Day card */
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
                {restDayChecklistItems.map((item) => {
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
            /* PRIMARY: Planned workout card — accent border */
            <div
              style={{
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.accent}`,
                borderRadius: radius.xl,
                padding: spacing[5],
              }}
            >
              {/* Card header */}
              <div style={{ marginBottom: spacing[4] }}>
                <span style={{ ...typography.label, color: colors.accent, display: 'block', marginBottom: spacing[1] }}>
                  {isActualToday ? 'HEUTE' : 'PLAN'} · {activeSplit.name.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ ...typography.h2, color: colors.textPrimary }}>{displayDay.name}</h2>
                  {estimatedMin > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color={colors.textMuted} />
                      <span style={{ ...typography.monoSm, color: colors.textMuted }}>ca. {estimatedMin} min</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Exercise chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: spacing[2], marginBottom: spacing[5] }}>
                {previewData?.map(({ ex }) => {
                  if (!ex) return null;
                  return (
                    <span
                      key={ex.id}
                      style={{
                        ...typography.bodySm,
                        color: colors.textSecondary,
                        backgroundColor: colors.bgHighest,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.full,
                        padding: `${spacing[1]} ${spacing[3]}`,
                        whiteSpace: 'nowrap' as const,
                      }}
                    >
                      {ex.nameDE}
                    </span>
                  );
                })}
                {displayDay.exerciseIds.length > 4 && (
                  <span
                    style={{
                      ...typography.bodySm,
                      color: colors.textMuted,
                      backgroundColor: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.full,
                      padding: `${spacing[1]} ${spacing[3]}`,
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    +{displayDay.exerciseIds.length - 4} weitere
                  </span>
                )}
              </div>

              {/* Big CTA */}
              <Button
                fullWidth
                size="lg"
                data-tour="start-button"
                onClick={handleStartPlanned}
                disabled={!!activeWorkout}
              >
                <Play size={18} />
                Training starten
              </Button>
            </div>
          )}

          {/* Quick action chips row */}
          <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' as const, marginTop: spacing[3] }}>
            {lastSession && (
              <button
                onClick={activeWorkout ? undefined : handleRepeatLast}
                disabled={!!activeWorkout}
                style={{
                  backgroundColor: colors.bgElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.full,
                  padding: `${spacing[2]} ${spacing[4]}`,
                  ...typography.bodySm,
                  color: activeWorkout ? colors.textDisabled : colors.textSecondary,
                  cursor: activeWorkout ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  whiteSpace: 'nowrap' as const,
                }}
              >
                <RotateCcw size={13} color={activeWorkout ? colors.textDisabled : colors.textMuted} />
                Letztes wiederholen
              </button>
            )}
            <button
              onClick={handleRestDay}
              style={{
                backgroundColor: colors.bgElevated,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.full,
                padding: `${spacing[2]} ${spacing[4]}`,
                ...typography.bodySm,
                color: colors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                whiteSpace: 'nowrap' as const,
              }}
            >
              <Sofa size={13} color={colors.textMuted} />
              Rest Day
            </button>
          </div>

          {/* Free workout as secondary option */}
          <button
            onClick={activeWorkout ? undefined : handleStartFree}
            disabled={!!activeWorkout}
            style={{
              marginTop: spacing[3],
              width: '100%',
              padding: `${spacing[3]} ${spacing[5]}`,
              borderRadius: radius.lg,
              backgroundColor: colors.bgHighest,
              color: activeWorkout ? colors.textDisabled : colors.textSecondary,
              ...typography.body,
              fontWeight: '600',
              cursor: activeWorkout ? 'not-allowed' : 'pointer',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
          >
            <Plus size={16} />
            Freies Workout starten
          </button>
        </div>
      )}

      {/* PRIMARY SECTION — No plan: Free workout as primary */}
      {!activeSplit && selectedDayId !== 'manual-rest-day' && (
        <div>
          <div
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.accent}`,
              borderRadius: radius.xl,
              padding: spacing[5],
              marginBottom: spacing[3],
            }}
          >
            <div style={{ marginBottom: spacing[4] }}>
              <span
                style={{
                  ...typography.label,
                  color: colors.accent,
                  display: 'block',
                  marginBottom: spacing[1],
                }}
              >
                FREIES WORKOUT
              </span>
              <h2 style={{ ...typography.h2, color: colors.textPrimary }}>
                Training starten
              </h2>
              <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
                Übungen frei wählen, kein Plan nötig
              </p>
            </div>
            <button
              data-tour="start-button"
              onClick={activeWorkout ? undefined : handleStartFree}
              disabled={!!activeWorkout}
              style={{
                width: '100%',
                padding: `${spacing[4]} ${spacing[5]}`,
                borderRadius: radius.lg,
                backgroundColor: activeWorkout ? colors.bgHighest : colors.accent,
                color: activeWorkout ? colors.textDisabled : '#000',
                ...typography.bodyLg,
                fontWeight: '700',
                cursor: activeWorkout ? 'not-allowed' : 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
              }}
            >
              <Play size={18} />
              Workout starten
            </button>
          </div>

          {/* Quick action chips */}
          <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' as const }}>
            {lastSession && (
              <button
                onClick={activeWorkout ? undefined : handleRepeatLast}
                disabled={!!activeWorkout}
                style={{
                  backgroundColor: colors.bgElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.full,
                  padding: `${spacing[2]} ${spacing[4]}`,
                  ...typography.bodySm,
                  color: activeWorkout ? colors.textDisabled : colors.textSecondary,
                  cursor: activeWorkout ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  whiteSpace: 'nowrap' as const,
                }}
              >
                <RotateCcw size={13} color={activeWorkout ? colors.textDisabled : colors.textMuted} />
                Letztes wiederholen
              </button>
            )}
            <button
              onClick={handleRestDay}
              style={{
                backgroundColor: colors.bgElevated,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.full,
                padding: `${spacing[2]} ${spacing[4]}`,
                ...typography.bodySm,
                color: colors.textSecondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                whiteSpace: 'nowrap' as const,
              }}
            >
              <Sofa size={13} color={colors.textMuted} />
              Rest Day
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
