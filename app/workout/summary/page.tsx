'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useMemo } from 'react';
import { CheckCircle2, Star, Clock, Dumbbell, TrendingUp, Share2, BarChart2, Download } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
import { formatDuration, formatVolume } from '@/utils/dates';
import { buildShareUrl } from '@/utils/shareToken';
import { getExerciseById } from '@/constants/exercises';
import { calculateWorkoutScore } from '@/utils/scoreEngine';
import type { WorkoutScore } from '@/types/score';
import { CountUp } from '@/components/ui/CountUp';

/** Compact metric row used in the score breakdown section */
function MetricRow({
  label,
  value,
  maxValue,
  unit,
}: {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
}) {
  const pct = Math.round((value / maxValue) * 100);
  return (
    <div style={{ marginBottom: spacing[3] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ ...typography.bodySm, color: colors.textMuted }}>{label}</span>
        <span style={{ ...typography.mono, color: colors.textPrimary }}>
          {unit === '%' ? `${value}${unit}` : `${value} / ${maxValue}`}
        </span>
      </div>
      <div
        style={{
          height: '6px',
          backgroundColor: colors.bgHighest,
          borderRadius: radius.full,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, pct)}%`,
            backgroundColor: pct >= 70 ? colors.accent : pct >= 40 ? colors.accentDark : colors.danger,
            borderRadius: radius.full,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { profile } = useUserStore();
  const [rpe, setRpe] = useState<number>(5);
  const [pdfLoading, setPdfLoading] = useState(false);

  const session = useHistoryStore((state) =>
    sessionId ? state.sessions.find((s) => s.id === sessionId) : null
  );
  const previousSessions = useHistoryStore((state) =>
    state.sessions.filter((s) => s.id !== sessionId).slice(0, 10)
  );
  const updateSession = useHistoryStore((state) => state.updateSession);
  const { generateShareToken: createShareToken } = useHistoryStore();

  // Compute muscle coverage for this session only
  const sessionMuscleSets = useMemo<Record<string, number>>(() => {
    if (!session) return {};
    const setsPerMuscle: Record<string, number> = {};
    for (const ex of session.exercises) {
      const exercise = getExerciseById(ex.exercise.id);
      const primaryMuscle = exercise?.primaryMuscle ?? ex.exercise.primaryMuscle;
      if (!primaryMuscle) continue;
      const workedSets = ex.sets.filter((s) => s.isCompleted && s.type !== 'warmup').length;
      setsPerMuscle[primaryMuscle] = (setsPerMuscle[primaryMuscle] ?? 0) + workedSets;
      for (const sec of exercise?.secondaryMuscles ?? []) {
        setsPerMuscle[sec] = (setsPerMuscle[sec] ?? 0) + Math.floor(workedSets / 2);
      }
    }
    return setsPerMuscle;
  }, [session]);

  const maxSessionSets = Math.max(...Object.values(sessionMuscleSets), 1);

  if (!session) {
    return (
      <div style={{ padding: spacing[6], textAlign: 'center' }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>Session nicht gefunden.</p>
        <Button onClick={() => router.replace('/dashboard')} style={{ marginTop: spacing[4] }}>
          Zum Dashboard
        </Button>
      </div>
    );
  }

  const score: WorkoutScore = calculateWorkoutScore(session, previousSessions);

  const handleSave = async () => {
    await updateSession(session.id, { rpe, score });
    router.replace('/dashboard');
  };

  const handleShare = async () => {
    const token = createShareToken(session.id);
    const url = buildShareUrl(token);
    const text = `💪 ${session.splitName || 'Freies Training'} — Score: ${score.total}/100`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mein Workout', text, url });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* ignore */
      }
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch('/api/export/workout-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, score, userName: profile?.name }),
      });
      if (!res.ok) throw new Error('PDF failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout-${session.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — PDF is optional
    } finally {
      setPdfLoading(false);
    }
  };

  const scoreColor =
    score.total >= 75 ? colors.success : score.total >= 48 ? colors.accent : colors.danger;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
      }}
    >
      {/* SCORE HERO */}
      <div
        style={{
          textAlign: 'center',
          padding: `calc(${spacing[10]} + env(safe-area-inset-top)) ${spacing[5]} ${spacing[6]}`,
          background: `linear-gradient(180deg, ${colors.accentBg} 0%, ${colors.bgPrimary} 100%)`,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <CheckCircle2 size={44} color={colors.success} style={{ marginBottom: spacing[3] }} />

        {/* Big score number */}
        <div style={{ fontSize: '80px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
          <CountUp end={score.total} duration={1400} />
        </div>

        {/* Label below the number */}
        <div
          style={{
            ...typography.h3,
            color: scoreColor,
            marginTop: spacing[2],
            fontWeight: 700,
          }}
        >
          {score.label}
        </div>

        {/* Explanation subtitle */}
        <div
          style={{
            ...typography.bodySm,
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          {score.explanation}
        </div>

        <p style={{ ...typography.bodyLg, color: colors.textSecondary, marginTop: spacing[3] }}>
          {session.splitName ?? 'Freies Training'}
        </p>

        {session.newPRs.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: spacing[2],
              marginTop: spacing[3],
            }}
          >
            <Star size={16} color={colors.accent} />
            <span style={{ ...typography.body, color: colors.accent }}>
              {session.newPRs.length} neue Personal{' '}
              {session.newPRs.length === 1 ? 'Record' : 'Records'}!
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: `${spacing[5]} ${spacing[5]} 0` }}>

        {/* SCORE BREAKDOWN */}
        <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[4] }}>
          Score Aufschlüsselung
        </h3>

        <MetricRow label="Abschlussrate" value={score.completionRate} maxValue={100} unit="%" />
        <MetricRow label="Volumen" value={score.volumeScore} maxValue={35} />
        <MetricRow label="Intensität" value={score.intensityScore} maxValue={20} />

        {/* RPE INPUT */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: spacing[4],
            marginBottom: spacing[5],
            marginTop: spacing[4],
          }}
        >
          <div
            style={{
              ...typography.label,
              color: colors.textMuted,
              marginBottom: spacing[3],
            }}
          >
            WIE ANSTRENGEND? (RPE {rpe.toFixed(1)})
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={rpe}
            onChange={(e) => setRpe(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: colors.accent }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ ...typography.monoSm, color: colors.textFaint }}>Leicht</span>
            <span style={{ ...typography.monoSm, color: colors.textFaint }}>Maximal</span>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: spacing[3],
          padding: `0 ${spacing[5]}`,
        }}
      >
        {[
          {
            icon: <Clock size={20} color={colors.accent} />,
            value: formatDuration(session.durationSeconds),
            label: 'Dauer',
          },
          {
            icon: <Dumbbell size={20} color={colors.accent} />,
            value: String(session.totalSets),
            label: 'Sätze',
          },
          {
            icon: <TrendingUp size={20} color={colors.accent} />,
            value: formatVolume(session.totalVolume),
            label: 'Volumen',
          },
          {
            icon: <BarChart2 size={20} color={colors.accent} />,
            value: String(
              session.exercises.filter((e) => e.sets.some((s) => s.isCompleted)).length
            ),
            label: 'Übungen',
          },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
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
        ))}
      </div>

      {/* SESSION MUSCLE HEATMAP */}
      {Object.keys(sessionMuscleSets).length > 0 && (
        <section style={{ margin: `${spacing[5]} ${spacing[5]} 0` }}>
          <h3
            style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: '13px',
              fontWeight: 600,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '12px',
            }}
          >
            Trainierte Muskeln
          </h3>
          <BodyHeatmap muscleSets={sessionMuscleSets} maxSets={maxSessionSets} mode="session" />
        </section>
      )}

      {/* PRs */}
      {session.newPRs.length > 0 && (
        <div style={{ padding: `${spacing[5]} ${spacing[5]} 0` }}>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Neue Rekorde
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {session.newPRs.map((exId) => {
              const exercise = getExerciseById(exId);
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
                  <Badge variant="accent" style={{ marginLeft: 'auto' }}>
                    PR
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EXERCISES */}
      <div style={{ padding: `${spacing[5]} ${spacing[5]} 0`, flex: 1 }}>
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
                <div
                  style={{
                    ...typography.mono,
                    color: colors.textSecondary,
                    textAlign: 'right',
                  }}
                >
                  {completedSets.length} × {maxWeight > 0 ? `${maxWeight} kg` : 'BW'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIONS */}
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
        <Button fullWidth size="lg" onClick={handleSave}>
          Workout speichern
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
          }}
        >
          Workout teilen <Share2 size={18} />
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
          }}
        >
          {pdfLoading ? 'Exportiere...' : <><Download size={18} /> Als PDF speichern</>}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => router.push('/log')}>
          Im Verlauf ansehen
        </Button>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '24px', color: colors.textMuted, textAlign: 'center' }}>
          Lade...
        </div>
      }
    >
      <SummaryContent />
    </Suspense>
  );
}
