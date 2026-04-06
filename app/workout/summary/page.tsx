'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, Clock, Dumbbell, TrendingUp, Share2, BarChart2, Download, Globe, MessageCircle, Users } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';
import { useHistoryStore } from '@/store/historyStore';
import { useUserStore } from '@/store/userStore';
import { formatDuration, formatVolume, calculateStreak } from '@/utils/dates';
import { useAchievementStore } from '@/store/achievementStore';
import { buildShareUrl } from '@/utils/shareToken';
import { getExerciseById } from '@/constants/exercises';
import { calculateWorkoutScore } from '@/utils/scoreEngine';
import type { WorkoutScore } from '@/types/score';
import { CountUp } from '@/components/ui/CountUp';
import { supabase } from '@/lib/supabase';
import { sendWorkoutCard, getMyChannels, getGeneralChannelId } from '@/lib/forum';
import type { Channel } from '@/types/forum';

/** Compact metric row used in the score breakdown section */
function MetricRow({
  label,
  value,
  maxValue,
  unit,
  explainer,
}: {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  explainer?: string;
}) {
  const pct = Math.round((value / maxValue) * 100);
  return (
    <div style={{ marginBottom: spacing[3] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ ...typography.bodySm, color: colors.textMuted }}>{label}</span>
          {explainer && (
            <span style={{ ...typography.bodySm, color: colors.textFaint, marginLeft: spacing[2] }}>
              — {explainer}
            </span>
          )}
        </div>
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
  const [shareOpen, setShareOpen] = useState(false);
  const [shareChannels, setShareChannels] = useState<Channel[]>([]);
  const [shareCaption, setShareCaption] = useState('');
  const [shareUserId, setShareUserId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const session = useHistoryStore((state) =>
    sessionId ? state.sessions.find((s) => s.id === sessionId) : null
  );
  const previousSessions = useHistoryStore((state) =>
    state.sessions.filter((s) => s.id !== sessionId).slice(0, 10)
  );
  const sessions = useHistoryStore((state) => state.sessions);
  const restDays = useHistoryStore((state) => state.restDays);
  const updateSession = useHistoryStore((state) => state.updateSession);
  const { generateShareToken: createShareToken } = useHistoryStore();

  const { checkAndUnlock, pendingCelebration, clearPendingCelebration } = useAchievementStore();
  const allAchievements = useAchievementStore((s) => s.getAllWithStatus)();
  const celebrationAchievement = pendingCelebration
    ? allAchievements.find((a) => a.id === pendingCelebration) ?? null
    : null;

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!alive || !user) return;
      setShareUserId(user.id);
      getMyChannels(user.id).then((channels) => {
        if (alive) setShareChannels(channels);
      });
    });
    return () => { alive = false; };
  }, []);

  // Check and unlock achievements once on summary mount
  useEffect(() => {
    if (!session) return;
    const trainingDates = sessions.map((s) => s.date);
    const streak = calculateStreak(trainingDates, restDays);
    const maxWeight = session.exercises
      .flatMap((ex) => ex.sets)
      .filter((s) => s.isCompleted)
      .reduce((max, s) => Math.max(max, s.weight ?? 0), 0);

    checkAndUnlock(
      sessions.length,
      session.newPRs.length > 0,
      maxWeight,
      session.totalVolume,
      streak,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

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

  const handleShareToChannel = async (channelId: string) => {
    if (!shareUserId || !session) return;
    setSharing(true);
    try {
      const exercises = session.exercises.map((ex) => {
        const done = ex.sets.filter((s) => s.isCompleted);
        const maxWeight = done.length > 0 ? Math.max(...done.map((s) => s.weight)) : 0;
        return { nameDE: ex.exercise.nameDE, sets: done.length, maxWeight };
      });
      await sendWorkoutCard(channelId, shareUserId, {
        sessionId: session.id,
        exercises,
        totalVolume: session.totalVolume,
        durationSeconds: session.durationSeconds,
        score: score.total,
        muscleSets: sessionMuscleSets,
      }, shareCaption);
      setShareOpen(false);
      setShareCaption('');
    } finally {
      setSharing(false);
    }
  };

  const scoreColor =
    score.total >= 75 ? colors.success : score.total >= 48 ? colors.accent : colors.danger;

  const totalVolume = session.totalVolume;
  const totalCompletedSets = session.totalSets;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        paddingBottom: '80px', // space for sticky action bar
      }}
    >
      {/* SCORE HERO */}
      <div
        style={{
          padding: `calc(${spacing[8]} + env(safe-area-inset-top)) ${spacing[5]} ${spacing[5]}`,
          background: `linear-gradient(180deg, ${colors.accentBg} 0%, ${colors.bgPrimary} 100%)`,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing[3] }}>
          <CheckCircle2 size={36} color={colors.success} />
        </div>

        {/* Quick stats strip */}
        <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[5] }}>
          {([
            { label: 'Dauer', value: formatDuration(session.durationSeconds) },
            { label: 'Volumen', value: formatVolume(totalVolume) },
            { label: 'Sets', value: String(totalCompletedSets) },
          ] as const).map(stat => (
            <div key={stat.label} style={{
              flex: 1,
              backgroundColor: colors.bgCard,
              borderRadius: radius.lg,
              padding: spacing[3],
              border: `1px solid ${colors.border}`,
              textAlign: 'center',
            }}>
              <div style={{ ...typography.mono, color: colors.textPrimary, fontSize: 20 }}>
                {stat.value}
              </div>
              <div style={{ ...typography.label, color: colors.textMuted }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* PR celebration badge — shown above score card when new records were set */}
        {session.newPRs && session.newPRs.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            backgroundColor: colors.successBg,
            border: `1px solid ${colors.success}30`,
            borderRadius: radius.full,
            padding: `${spacing[1]} ${spacing[3]}`,
            alignSelf: 'flex-start',
            marginBottom: spacing[3],
          }}>
            <Star size={12} color={colors.success} fill={colors.success} />
            <span style={{ ...typography.label, color: colors.success }}>
              {session.newPRs.length} NEUER REKORD{session.newPRs.length > 1 ? 'E' : ''}
            </span>
          </div>
        )}

        {/* Score hero card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 150 }}
          style={{
            textAlign: 'center',
            padding: `${spacing[6]} ${spacing[4]}`,
            backgroundColor: colors.bgCard,
            borderRadius: radius.xl,
            border: `1px solid ${colors.border}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 200,
            height: 200,
            borderRadius: '50%',
            backgroundColor: score.total >= 70 ? `${colors.accent}08` : 'transparent',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />

          {/* Big score number */}
          <div style={{ ...typography.displayXL, color: scoreColor, lineHeight: 1, marginBottom: spacing[2] }}>
            <CountUp end={score.total} duration={1400} />
          </div>

          {/* Label below the number */}
          <div
            style={{
              ...typography.h3,
              color: colors.textPrimary,
              marginBottom: spacing[1],
              fontWeight: 700,
            }}
          >
            {score.label}
          </div>

          <div style={{ ...typography.bodySm, color: colors.textMuted }}>
            Workout Score
          </div>
        </motion.div>

        <p style={{ ...typography.bodyLg, color: colors.textSecondary, marginTop: spacing[3], textAlign: 'center' }}>
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

        <MetricRow label="Abschlussrate" value={score.completionRate} maxValue={100} unit="%" explainer="Abgeschlossene Sets" />
        <MetricRow label="Volumen" value={score.volume} maxValue={100} unit="%" explainer="Tonnen bewegt vs. Durchschnitt" />
        <MetricRow label="Intensität" value={score.intensity} maxValue={100} unit="%" explainer="Gewicht vs. letzte Sessions" />

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
        data-tour="summary-stats"
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
              ...typography.label,
              color: colors.textMuted,
              marginBottom: spacing[3],
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

      {/* SECONDARY ACTIONS — share / pdf / log */}
      <div
        style={{
          padding: `${spacing[5]} ${spacing[5]} 0`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[2],
          marginTop: spacing[4],
        }}
      >
        <div style={{ display: 'flex', gap: spacing[2] }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              flex: 1,
            }}
          >
            <Share2 size={16} /> Teilen
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
              flex: 1,
            }}
          >
            {pdfLoading ? 'PDF...' : <><Download size={16} /> PDF</>}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push('/log')} style={{ flex: 1 }}>
            Verlauf
          </Button>
        </div>
        <button
          onClick={() => setShareOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: spacing[3],
            backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}40`,
            borderRadius: radius.xl, color: colors.accent, fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <MessageCircle size={16} />
          Im Forum teilen
        </button>
      </div>

      {/* STICKY ACTION BAR */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.bgPrimary,
          paddingTop: spacing[3],
          paddingBottom: `calc(${spacing[4]} + env(safe-area-inset-bottom))`,
          paddingLeft: spacing[4],
          paddingRight: spacing[4],
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          gap: spacing[3],
          zIndex: 50,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            flex: 1,
            padding: spacing[3],
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            color: colors.textMuted,
            cursor: 'pointer',
            ...typography.body,
          }}
        >
          Dashboard
        </button>
        <button
          onClick={handleSave}
          style={{
            flex: 2,
            padding: spacing[3],
            backgroundColor: colors.accent,
            border: 'none',
            borderRadius: radius.lg,
            color: colors.bgPrimary,
            cursor: 'pointer',
            ...typography.h3,
          }}
        >
          Speichern & fertig →
        </button>
      </div>

      {/* ACHIEVEMENT CELEBRATION MODAL */}
      {celebrationAchievement && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: spacing[5],
          }}
          onClick={clearPendingCelebration}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.accent}40`,
              borderRadius: radius['2xl'],
              padding: spacing[8],
              textAlign: 'center',
              maxWidth: '320px',
              width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[4],
            }}
          >
            <div style={{ fontSize: '56px', lineHeight: 1 }}>{celebrationAchievement.icon}</div>
            <div>
              <p style={{ ...typography.label, color: colors.accent, letterSpacing: '2px', marginBottom: spacing[2] }}>
                ACHIEVEMENT FREIGESCHALTET
              </p>
              <h2 style={{ ...typography.h2, color: colors.textPrimary, margin: 0, marginBottom: spacing[2] }}>
                {celebrationAchievement.title}
              </h2>
              <p style={{ ...typography.body, color: colors.textMuted, margin: 0 }}>
                {celebrationAchievement.description}
              </p>
            </div>
            <button
              onClick={clearPendingCelebration}
              style={{
                width: '100%', padding: spacing[4],
                backgroundColor: colors.accent, border: 'none',
                borderRadius: radius.lg, cursor: 'pointer',
                ...typography.bodyLg, fontWeight: '700', color: colors.bgPrimary,
              }}
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShareOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100 }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
            backgroundColor: colors.bgCard,
            borderRadius: `${radius.xl} ${radius.xl} 0 0`,
            padding: spacing[5], maxWidth: 480, margin: '0 auto',
          }}>
            <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
              Im Forum teilen
            </h3>
            <input
              value={shareCaption}
              onChange={(e) => setShareCaption(e.target.value)}
              placeholder="Optionale Nachricht dazu..."
              style={{
                width: '100%', backgroundColor: colors.bgHighest, border: `1px solid ${colors.border}`,
                borderRadius: radius.xl, padding: `${spacing[2]} ${spacing[4]}`,
                color: colors.textPrimary, fontSize: 14, outline: 'none',
                marginBottom: spacing[3], boxSizing: 'border-box' as const,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {/* General Chat */}
              <button
                onClick={async () => {
                  const genId = await getGeneralChannelId();
                  if (genId) await handleShareToChannel(genId);
                }}
                disabled={sharing}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[3],
                  padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colors.bgHighest,
                  border: `1px solid ${colors.border}`, borderRadius: radius.lg,
                  cursor: 'pointer', textAlign: 'left' as const,
                }}
              >
                <Globe size={16} color={colors.accent} />
                <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                  General Chat
                </span>
              </button>
              {/* DMs und Gruppen */}
              {shareChannels.filter((c) => c.type !== 'general').map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleShareToChannel(ch.id)}
                  disabled={sharing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: spacing[3],
                    padding: `${spacing[3]} ${spacing[4]}`, backgroundColor: colors.bgHighest,
                    border: `1px solid ${colors.border}`, borderRadius: radius.lg,
                    cursor: 'pointer', textAlign: 'left' as const,
                  }}
                >
                  {ch.type === 'group' ? (
                    <>
                      <Users size={16} color={colors.accent} />
                      <span style={{ ...typography.body, color: colors.textPrimary }}>{ch.name}</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={16} color={colors.accent} />
                      <span style={{ ...typography.body, color: colors.textPrimary }}>
                        {ch.otherUser?.username ?? 'Direktnachricht'}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
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
