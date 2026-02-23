'use client';

import { useRouter } from 'next/navigation';
import { Play, Plus } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/store/workoutStore';
import { usePlanStore } from '@/store/planStore';
import { useHistoryStore } from '@/store/historyStore';
import { getExerciseById } from '@/constants/exercises';

export default function StartPage() {
  const router = useRouter();
  const { startWorkout, activeWorkout } = useWorkoutStore();
  const { getActiveSplit, getTodaysSplitDay } = usePlanStore();
  const { sessions } = useHistoryStore();

  const activeSplit = getActiveSplit();
  const todaysDay = getTodaysSplitDay();
  const lastSession = sessions[0];

  const handleStartPlanned = () => {
    // Pre-load all exercises from today's planned split day
    startWorkout(todaysDay?.name ?? activeSplit?.name, todaysDay?.exerciseIds);
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

      {/* Geplantes Training */}
      {todaysDay && !todaysDay.restDay && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <h2 style={{ ...typography.h3, color: colors.textPrimary }}>Heutiger Plan</h2>
            <span style={{ ...typography.bodySm, color: colors.textMuted }}>
              {activeSplit?.name}
            </span>
          </div>
          <div
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.xl,
              padding: spacing[4],
            }}
          >
            <div style={{ marginBottom: spacing[3] }}>
              <h3 style={{ ...typography.h3, color: colors.textPrimary }}>{todaysDay.name}</h3>
              <p style={{ ...typography.bodySm, color: colors.textMuted, marginTop: spacing[1] }}>
                {todaysDay.exerciseIds.length} Übungen geplant
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[4] }}>
              {todaysDay.exerciseIds.slice(0, 4).map((exId) => {
                const ex = getExerciseById(exId);
                if (!ex) return null;
                return (
                  <div key={exId} style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: colors.accent,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ ...typography.body, color: colors.textSecondary }}>{ex.nameDE}</span>
                  </div>
                );
              })}
              {todaysDay.exerciseIds.length > 4 && (
                <span style={{ ...typography.bodySm, color: colors.textMuted, marginLeft: spacing[4] }}>
                  +{todaysDay.exerciseIds.length - 4} weitere
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
              {todaysDay.name} starten
            </Button>
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
