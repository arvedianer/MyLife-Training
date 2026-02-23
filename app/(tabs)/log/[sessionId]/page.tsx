'use client';

import { useRouter } from 'next/navigation';
import { Clock, Dumbbell, TrendingUp, Trash2, Star } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useHistoryStore } from '@/store/historyStore';
import { formatWorkoutDate, formatDuration, formatVolume } from '@/utils/dates';
import { exercises } from '@/constants/exercises';

export default function SessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const router = useRouter();
  const { getSessionById, deleteSession } = useHistoryStore();
  const session = getSessionById(sessionId);

  if (!session) {
    return (
      <div style={{ padding: spacing[6], textAlign: 'center' }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Session nicht gefunden.
        </p>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Diese Einheit wirklich löschen?')) {
      deleteSession(sessionId);
      router.back();
    }
  };

  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
      <PageHeader
        title={session.splitName ?? 'Freies Training'}
        subtitle={formatWorkoutDate(session.date)}
        rightElement={
          <button
            onClick={handleDelete}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: colors.dangerBg,
              border: `1px solid ${colors.danger}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={16} color={colors.danger} />
          </button>
        }
      />

      <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3] }}>
          <StatItem
            icon={<Clock size={16} color={colors.accent} />}
            value={formatDuration(session.durationSeconds)}
            label="Dauer"
          />
          <StatItem
            icon={<Dumbbell size={16} color={colors.accent} />}
            value={String(session.totalSets)}
            label="Sätze"
          />
          <StatItem
            icon={<TrendingUp size={16} color={colors.accent} />}
            value={formatVolume(session.totalVolume)}
            label="Volumen"
          />
        </div>

        {/* PRs */}
        {session.newPRs.length > 0 && (
          <div>
            <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
              Personal Records
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
              {session.newPRs.map((exId) => {
                const ex = exercises.find((e) => e.id === exId);
                return (
                  <div
                    key={exId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: `${spacing[2]} ${spacing[3]}`,
                      backgroundColor: colors.accentBg,
                      border: `1px solid ${colors.accent}30`,
                      borderRadius: radius.full,
                    }}
                  >
                    <Star size={12} color={colors.accent} fill={colors.accent} />
                    <span style={{ ...typography.label, color: colors.accent }}>
                      {ex?.nameDE ?? exId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Exercises */}
        <div>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Übungen
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {session.exercises.map((workoutExercise) => {
              const completedSets = workoutExercise.sets.filter((s) => s.isCompleted);
              if (completedSets.length === 0) return null;

              return (
                <div
                  key={workoutExercise.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    overflow: 'hidden',
                  }}
                >
                  {/* Exercise Header */}
                  <div
                    style={{
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderBottom: `1px solid ${colors.borderLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {workoutExercise.exercise.nameDE}
                    </span>
                    <div style={{ display: 'flex', gap: spacing[2] }}>
                      {session.newPRs.includes(workoutExercise.exercise.id) && (
                        <Badge variant="accent">PR</Badge>
                      )}
                      <Badge variant="muted">{completedSets.length} Sätze</Badge>
                    </div>
                  </div>

                  {/* Sets */}
                  <div style={{ padding: `${spacing[2]} ${spacing[4]}` }}>
                    {completedSets.map((set, idx) => (
                      <div
                        key={set.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[4],
                          padding: `${spacing[2]} 0`,
                          borderBottom: idx < completedSets.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                        }}
                      >
                        <span style={{ ...typography.monoSm, color: colors.textDisabled, width: '20px' }}>
                          {idx + 1}
                        </span>
                        <span style={{ ...typography.mono, color: colors.textPrimary }}>
                          {set.weight} kg
                        </span>
                        <span style={{ ...typography.mono, color: colors.textMuted }}>
                          × {set.reps} Wdh.
                        </span>
                        <span style={{ ...typography.monoSm, color: colors.textDisabled, marginLeft: 'auto' }}>
                          {set.weight * set.reps} Vol.
                        </span>
                        {set.isPR && (
                          <Star size={12} color={colors.accent} fill={colors.accent} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
        padding: spacing[3],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[2],
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {icon}
      <div style={{ ...typography.mono, color: colors.textPrimary }}>{value}</div>
      <div style={{ ...typography.label, color: colors.textMuted }}>{label}</div>
    </div>
  );
}
