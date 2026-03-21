'use client';

import { use } from 'react';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { formatDuration } from '@/utils/dates';

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const sessions = useHistoryStore((state) => state.sessions);
  const { profile } = useUserStore();

  const session = sessions.find((s) => s.shareToken === token);

  if (!session) {
    return (
      <div style={{ padding: spacing[10], textAlign: 'center', backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
        <h2 style={{ ...typography.h2, color: colors.textPrimary, marginBottom: spacing[3] }}>Training nicht gefunden</h2>
        <p style={{ ...typography.body, color: colors.textMuted }}>Dieser Link ist abgelaufen oder ungültig.</p>
      </div>
    );
  }

  const scoreColor = session.score
    ? session.score.total >= 90 ? colors.success : session.score.total >= 60 ? colors.accent : colors.danger
    : colors.accent;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: colors.bgPrimary, padding: spacing[5] }}>
      {/* Attribution banner */}
      <div style={{
        textAlign: 'center', padding: spacing[3], marginBottom: spacing[4],
        backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl,
      }}>
        <span style={{ ...typography.bodySm, color: colors.textMuted }}>Training · </span>
        <span style={{ ...typography.bodySm, color: colors.accent, fontWeight: '700' }}>MY LIFE Training</span>
      </div>

      {/* Score hero */}
      {session.score && (
        <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
          <div style={{ fontSize: '64px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
            {session.score.total}
          </div>
          <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>/ 100 Punkte</div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3], marginBottom: spacing[5] }}>
        {[
          { label: 'Dauer', value: formatDuration(session.durationSeconds) },
          { label: 'Sätze', value: String(session.totalSets) },
          { label: 'Volumen', value: `${Math.round(session.totalVolume)}kg` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg, padding: spacing[3], textAlign: 'center',
          }}>
            <div style={{ ...typography.mono, color: colors.textPrimary }}>{value}</div>
            <div style={{ ...typography.label, color: colors.textMuted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Exercises */}
      <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
        Übungen ({session.exercises.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], marginBottom: spacing[6] }}>
        {session.exercises.map((ex) => {
          const done = ex.sets.filter((s) => s.isCompleted);
          const maxW = done.length > 0 ? Math.max(...done.map((s) => s.weight)) : 0;
          return (
            <div key={ex.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: `${spacing[3]} ${spacing[4]}`,
              backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
            }}>
              <span style={{ ...typography.body, color: colors.textPrimary }}>{ex.exercise.nameDE}</span>
              <span style={{ ...typography.mono, color: colors.textMuted, fontSize: '12px' }}>
                {done.length} × {maxW > 0 ? `${maxW}kg` : 'EG'}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center', padding: spacing[5],
        backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}30`,
        borderRadius: radius['2xl'],
      }}>
        <p style={{ ...typography.body, color: colors.accent, fontWeight: '700', marginBottom: spacing[2] }}>
          Tracke auch dein Training
        </p>
        <p style={{ ...typography.bodySm, color: colors.textMuted }}>MY LIFE Training — kostenlos im Browser</p>
      </div>
    </div>
  );
}
