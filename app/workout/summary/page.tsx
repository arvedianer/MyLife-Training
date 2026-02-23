'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2, Star, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useHistoryStore } from '@/store/historyStore';
import { formatDuration, formatVolume } from '@/utils/dates';
import { exercises } from '@/constants/exercises';

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { getSessionById } = useHistoryStore();

  const session = sessionId ? getSessionById(sessionId) : null;

  if (!session) {
    return (
      <div style={{ padding: spacing[6], textAlign: 'center' }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Session nicht gefunden.
        </p>
        <Button onClick={() => router.replace('/dashboard')} style={{ marginTop: spacing[4] }}>
          Zum Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(180deg, ${colors.accentBg} 0%, ${colors.bgPrimary} 100%)`,
          padding: spacing[8],
          paddingTop: `calc(${spacing[10]} + env(safe-area-inset-top))`,
          textAlign: 'center',
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <CheckCircle2 size={56} color={colors.success} style={{ marginBottom: spacing[4] }} />
        <h1 style={{ ...typography.display, color: colors.textPrimary, marginBottom: spacing[2] }}>
          Glückwunsch!
        </h1>
        <p style={{ ...typography.bodyLg, color: colors.textMuted }}>
          {session.splitName ?? 'Freies Training'} abgeschlossen
        </p>

        {session.newPRs.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: spacing[2], marginTop: spacing[4] }}>
            <Star size={16} color={colors.accent} />
            <span style={{ ...typography.body, color: colors.accent }}>
              {session.newPRs.length} neue Personal {session.newPRs.length === 1 ? 'Record' : 'Records'}!
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: spacing[3],
          padding: spacing[5],
        }}
      >
        <StatItem
          icon={<Clock size={20} color={colors.accent} />}
          value={formatDuration(session.durationSeconds)}
          label="Dauer"
        />
        <StatItem
          icon={<Dumbbell size={20} color={colors.accent} />}
          value={String(session.totalSets)}
          label="Sätze"
        />
        <StatItem
          icon={<TrendingUp size={20} color={colors.accent} />}
          value={formatVolume(session.totalVolume)}
          label="Volumen"
        />
      </div>

      {/* PRs */}
      {session.newPRs.length > 0 && (
        <div style={{ padding: `0 ${spacing[5]}`, marginBottom: spacing[5] }}>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Neue Rekorde
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {session.newPRs.map((exId) => {
              const exercise = exercises.find((e) => e.id === exId);
              if (!exercise) return null;
              return (
                <div
                  key={exId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[3],
                    padding: spacing[3],
                    backgroundColor: colors.accentBg,
                    border: `1px solid ${colors.accent}30`,
                    borderRadius: radius.lg,
                  }}
                >
                  <Star size={16} color={colors.accent} />
                  <span style={{ ...typography.body, color: colors.textPrimary }}>
                    {exercise.nameDE}
                  </span>
                  <Badge variant="accent" style={{ marginLeft: 'auto' }}>PR</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercises Summary */}
      <div style={{ padding: `0 ${spacing[5]}`, flex: 1 }}>
        <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Übungen ({session.exercises.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          {session.exercises.map((workoutExercise) => {
            const completedSets = workoutExercise.sets.filter((s) => s.isCompleted);
            if (completedSets.length === 0) return null;

            const maxWeight = Math.max(...completedSets.map((s) => s.weight));
            return (
              <div
                key={workoutExercise.id}
                style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  padding: spacing[4],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ ...typography.body, color: colors.textPrimary }}>
                  {workoutExercise.exercise.nameDE}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...typography.mono, color: colors.textSecondary }}>
                    {completedSets.length} × {maxWeight} kg
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: spacing[5],
          paddingBottom: `calc(${spacing[5]} + env(safe-area-inset-bottom))`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
          marginTop: spacing[6],
        }}
      >
        <Button fullWidth size="lg" onClick={() => router.replace('/dashboard')}>
          Zum Dashboard
        </Button>
        <Button variant="ghost" fullWidth onClick={() => router.push('/log')}>
          Im Verlauf ansehen
        </Button>
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: spacing[4],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing[2],
        textAlign: 'center',
      }}
    >
      {icon}
      <div style={{ ...typography.monoLg, color: colors.textPrimary }}>{value}</div>
      <div style={{ ...typography.label, color: colors.textMuted }}>{label}</div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense>
      <SummaryContent />
    </Suspense>
  );
}
