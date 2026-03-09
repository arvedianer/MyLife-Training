'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, Star, Clock, Dumbbell, TrendingUp, Share2, RefreshCw } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
import { formatDuration, formatVolume } from '@/utils/dates';
import { getExerciseById } from '@/constants/exercises';
import { generateCoachInsight } from '@/utils/coach';
import { Bot } from 'lucide-react';

interface AiSummary {
  highlights: string[];
  coachMessage: string;
}

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { profile } = useUserStore();
  // Reaktives Abonnieren der sessions erlaubt Re-Rendern, falls persist() leicht verzögert lädt
  const session = useHistoryStore((state) =>
    sessionId ? state.sessions.find(s => s.id === sessionId) : null
  );

  const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const exercises = session.exercises.map((e) => ({
      name: e.exercise.nameDE,
      sets: e.sets.filter((s) => s.isCompleted).length,
      totalVolume: e.sets.filter((s) => s.isCompleted).reduce((sum, s) => sum + s.weight * s.reps, 0),
    }));
    fetch('/api/ai-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        triggerType: 'post_workout',
        workoutContext: {
          exercises,
          durationSeconds: session.durationSeconds,
          totalVolume: session.totalVolume,
          newPRs: session.newPRs,
          splitName: session.splitName,
        },
        userProfile: {
          goal: profile?.goal,
          level: profile?.level,
          name: profile?.name,
        },
      }),
    })
      .then((r) => r.json() as Promise<AiSummary>)
      .then((data) => setAiSummary(data))
      .catch(() => setAiSummary(null))
      .finally(() => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

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

  const handleShare = async () => {
    if (!session) return;

    let text = `🔥 Workout abgeschlossen: ${session.splitName || 'Freies Training'} 🔥\n\n`;
    text += `⏱️ Dauer: ${formatDuration(session.durationSeconds)}\n`;
    text += `💪 Volumen: ${formatVolume(session.totalVolume)} kg\n`;
    text += `📊 Sätze: ${session.totalSets}\n\n`;

    if (session.newPRs.length > 0) {
      text += `🌟 ${session.newPRs.length} Neue Rekorde:\n`;
      session.newPRs.forEach(exId => {
        const ex = getExerciseById(exId);
        if (ex) text += `- ${ex.nameDE}\n`;
      });
      text += '\n';
    }

    text += `Trainiert mit MY LIFE Training.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mein Workout',
          text: text,
        });
      } catch (error) {
        console.log('Teilen abgebrochen oder fehlgeschlagen:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Workout-Zusammenfassung kopiert!');
      } catch (err) {
        console.error('Fehler beim Kopieren', err);
      }
    }
  };

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

      {/* AI Coach Insight */}
      <div style={{ padding: spacing[5], paddingBottom: 0 }}>
        <div style={{
          backgroundColor: `${colors.accent}15`,
          border: `1px solid ${colors.accent}40`,
          borderRadius: radius.xl,
          padding: spacing[4],
          display: 'flex',
          gap: spacing[3],
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            {aiLoading
              ? <RefreshCw size={18} color={colors.bgPrimary} style={{ animation: 'spin 1s linear infinite' }} />
              : <Bot size={20} color={colors.bgPrimary} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...typography.label, color: colors.accent, marginBottom: spacing[2] }}>DEIN COACH SAGT:</div>
            {aiLoading && (
              <p style={{ ...typography.bodySm, color: colors.textMuted }}>Analysiere dein Workout...</p>
            )}
            {!aiLoading && aiSummary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                {aiSummary.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: spacing[2], alignItems: 'flex-start' }}>
                    <span style={{ color: colors.accent, flexShrink: 0 }}>›</span>
                    <span style={{ ...typography.bodySm, color: colors.textPrimary }}>{h}</span>
                  </div>
                ))}
                <p style={{ ...typography.bodySm, color: colors.accent, marginTop: spacing[1], fontStyle: 'italic' }}>
                  {aiSummary.coachMessage}
                </p>
              </div>
            )}
            {!aiLoading && !aiSummary && (
              <p style={{ ...typography.bodySm, color: colors.textPrimary, lineHeight: '20px' }}>
                " {generateCoachInsight(session)} "
              </p>
            )}
          </div>
        </div>
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
        <Button variant="secondary" fullWidth onClick={handleShare} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Workout teilen <Share2 size={18} style={{ marginLeft: spacing[2] }} />
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
