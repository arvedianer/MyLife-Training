'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, RotateCcw, Weight, Timer } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppShell } from '@/components/layout/AppShell';
import { useUserStore } from '@/store/userStore';
import { useHistoryStore } from '@/store/historyStore';
import { usePlanStore } from '@/store/planStore';
import { useWorkoutStore } from '@/store/workoutStore';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, weightUnit, restTimerDefault, setWeightUnit, setRestTimerDefault, resetUser } =
    useUserStore();
  const { sessions } = useHistoryStore();
  const { splits } = usePlanStore();

  const handleReset = () => {
    if (confirm('Alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      resetUser();
      useHistoryStore.setState({ sessions: [] });
      usePlanStore.setState({ splits: [], activeSplitId: null });
      useWorkoutStore.setState({
        activeWorkout: null,
        restTimerActive: false,
        restTimerSeconds: 0,
        restTimerTotal: 0,
      });
      router.replace('/onboarding/goal');
    }
  };

  return (
    <AppShell>
      <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
        <PageHeader title="Einstellungen" />

        <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
          {/* Profil */}
          {profile && (
            <Section title="Profil">
              <InfoRow label="Ziel" value={profile.goal} />
              <InfoRow label="Level" value={profile.level} />
              <InfoRow label="Trainingstage" value={`${profile.trainingDays}x / Woche`} />
              <InfoRow label="Equipment" value={profile.equipment} />
            </Section>
          )}

          {/* Einheiten */}
          <Section title="Einheiten & Timer">
            {/* Gewichtseinheit */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} 0`,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Weight size={18} color={colors.textMuted} />
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  Gewichtseinheit
                </span>
              </div>
              <div style={{ display: 'flex', gap: spacing[2] }}>
                {(['kg', 'lbs'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setWeightUnit(unit)}
                    style={{
                      padding: `${spacing[1]} ${spacing[3]}`,
                      borderRadius: radius.full,
                      border: `1px solid ${weightUnit === unit ? colors.accent : colors.border}`,
                      backgroundColor: weightUnit === unit ? colors.accentBg : 'transparent',
                      ...typography.label,
                      color: weightUnit === unit ? colors.accent : colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Rest Timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} 0`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Timer size={18} color={colors.textMuted} />
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  Standard-Pausenzeit
                </span>
              </div>
              <div style={{ display: 'flex', gap: spacing[2] }}>
                {[60, 90, 120, 180].map((secs) => (
                  <button
                    key={secs}
                    onClick={() => setRestTimerDefault(secs)}
                    style={{
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: radius.full,
                      border: `1px solid ${restTimerDefault === secs ? colors.accent : colors.border}`,
                      backgroundColor: restTimerDefault === secs ? colors.accentBg : 'transparent',
                      ...typography.monoSm,
                      color: restTimerDefault === secs ? colors.accent : colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {secs}s
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Statistiken */}
          <Section title="Daten">
            <InfoRow label="Trainingseinheiten" value={String(sessions.length)} />
            <InfoRow label="Aktive Pläne" value={String(splits.length)} />
          </Section>

          {/* Danger Zone */}
          <Section title="Gefährliche Zone">
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                width: '100%',
                padding: `${spacing[3]} 0`,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={18} color={colors.danger} />
              <span style={{ ...typography.body, color: colors.danger }}>
                Alle Daten zurücksetzen
              </span>
            </button>
          </Section>

          {/* App Info */}
          <div style={{ textAlign: 'center', paddingBottom: spacing[8] }}>
            <p style={{ ...typography.bodySm, color: colors.textFaint }}>
              MY LIFE Training · v0.1.0
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        style={{
          ...typography.label,
          color: colors.textMuted,
          marginBottom: spacing[3],
        }}
      >
        {title.toUpperCase()}
      </h3>
      <div
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: `0 ${spacing[4]}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing[3]} 0`,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <span style={{ ...typography.body, color: colors.textMuted }}>{label}</span>
      <span style={{ ...typography.body, color: colors.textSecondary }}>{value}</span>
    </div>
  );
}
