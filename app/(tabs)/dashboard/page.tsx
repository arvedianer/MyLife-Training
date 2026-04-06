'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Play, TrendingUp, Flame, Calendar, ChevronRight, Settings, Target, MessageCircle, AlertTriangle, X, Award } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useUserStore } from '@/store/userStore';
import { useHistoryStore } from '@/store/historyStore';
import { usePlanStore } from '@/store/planStore';
import { computeAthleteScore, athleteScoreLabel } from '@/utils/athleteScore';
import { formatWorkoutDate, formatDuration, formatVolume, calculateStreak } from '@/utils/dates';
import { parseISO, startOfWeek } from 'date-fns';
import { getMissingMuscles, getRemainingWeekDays, MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';
import { useAutoRestDay } from '@/hooks/useAutoRestDay';
import { generateSuggestions } from '@/utils/workoutSuggestions';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { sessions, restDays, addRestDay } = useHistoryStore();
  const { getActiveSplit, getTodaysSplitDay } = usePlanStore();
  const { notification: autoRestNotification, dismiss: dismissAutoRest } = useAutoRestDay();

  const activeSplit = getActiveSplit();
  const todaysDay = getTodaysSplitDay();
  const recentSessions = sessions.slice(0, 3);

  // Streak berechnen (Trainingstage + Rest Days zählen beide)
  const trainingDates = sessions.map((s) => s.date);
  const streak = calculateStreak(trainingDates, restDays);

  // Aktuelle Kalenderwoche (Mo–So) — konsistent mit Stats-Seite
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const recentWeekSessions = sessions.filter((s) => parseISO(s.date) >= weekStart);
  const weekVolume = recentWeekSessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const weekWorkouts = recentWeekSessions.length;

  // Muscle coverage signal
  const daysLeft = getRemainingWeekDays();
  const missingMuscles = getMissingMuscles(sessions, Object.keys(MUSCLE_LABELS_DE));
  const showMuscleWarning = daysLeft > 0 && missingMuscles.length > 0;


  // Athlete Score (compact summary for dashboard)
  const lifetimeAthleteScore = useUserStore((s) => s.lifetimeAthleteScore);
  const athleteResult = useMemo(
    () => computeAthleteScore(sessions, profile?.bodyWeight ?? 0),
    [sessions, profile?.bodyWeight],
  );
  const displayScore = Math.max(lifetimeAthleteScore, athleteResult.total);

  // Smart suggestions
  const suggestions = useMemo(() => generateSuggestions(sessions), [sessions]);

  // Current week muscle sets (Mon–Sun) for the body heatmap
  const weekMuscleSets = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of recentWeekSessions) {
      for (const ex of s.exercises) {
        const done = ex.sets.filter((st) => st.isCompleted).length;
        if (!done) continue;
        const pm = ex.exercise.primaryMuscle as string;
        if (pm) counts[pm] = (counts[pm] || 0) + done;
        for (const sm of (ex.exercise.secondaryMuscles || []) as string[]) {
          counts[sm] = (counts[sm] || 0) + Math.ceil(done / 2);
        }
      }
    }
    return counts;
  }, [recentWeekSessions]);
  const weekMaxSets = Math.max(...Object.values(weekMuscleSets), 1);

  // Streak modal
  const [showStreakModal, setShowStreakModal] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dayBefore  = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    // Once-per-day guard
    const lastShown = localStorage.getItem('streakWarningShown');
    if (lastShown === today) return;

    const trainedToday     = sessions.some(s => s.date === today);
    const trainedYesterday = sessions.some(s => s.date === yesterday);
    const restYesterday    = restDays?.includes(yesterday);
    const restToday        = restDays?.includes(today);

    if (!trainedToday && !restToday && !trainedYesterday && !restYesterday && streak > 0) {
      const trainedDayBefore = sessions.some(s => s.date === dayBefore);
      const restDayBefore    = restDays?.includes(dayBefore);
      if (trainedDayBefore || restDayBefore) {
        // Only 1 day missed → silent auto rest day for yesterday
        addRestDay(yesterday);
        return;
      }
      // 2+ days missed → show popup once per day
      if (streak > 1) {
        setShowStreakModal(true);
        localStorage.setItem('streakWarningShown', today);
      }
    }
  }, [sessions, restDays, streak, addRestDay]);

  // Goal personalization
  const goal = profile?.goal;
  const GOAL_TAGLINES: Record<string, string> = {
    muskelaufbau: 'Baue Muskeln. Set für Set.',
    kraft: 'Mehr Kraft. Jeden Tag.',
    abnehmen: 'Bleib konsistent. Du schaffst das.',
    fitness: 'Aktiv und fit bleiben.',
    ausdauer: 'Weiter. Immer weiter.',
  };
  const GOAL_LABELS: Record<string, string> = {
    muskelaufbau: 'Muskelaufbau', kraft: 'Maximalkraft',
    abnehmen: 'Fettabbau', fitness: 'Fitness', ausdauer: 'Ausdauer',
  };
  const goalTagline = goal ? GOAL_TAGLINES[goal] : null;

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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              ...typography.h1,
              color: colors.textPrimary,
              marginBottom: spacing[1],
            }}
          >
            Guten {getGreeting()},{' '}
            <span style={{ color: colors.accent }}>
              {profile?.name ?? 'Athlet'}
            </span>
          </h1>
          <p style={{ ...typography.body, color: colors.textMuted }}>
            {todaysDay && !todaysDay.restDay
              ? `Heute: ${todaysDay.name}`
              : goalTagline ?? 'Heute ist ein Ruhetag'}
          </p>
          {goal && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing[1],
                marginTop: spacing[2],
                padding: `2px ${spacing[2]}`,
                backgroundColor: colors.accentBg,
                border: `1px solid ${colors.accent}40`,
                borderRadius: radius.full,
              }}
            >
              <Target size={10} color={colors.accent} />
              <span style={{ ...typography.label, color: colors.accent, fontSize: '10px' }}>
                {GOAL_LABELS[goal] ?? goal}
              </span>
            </div>
          )}
        </div>
        <Link href="/settings">
          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Settings size={18} color={colors.textMuted} />
          </button>
        </Link>
      </div>

      {/* Auto Rest Day Notification */}
      {autoRestNotification && (
        <div style={{
          background: 'var(--accent-bg)',
          border: '1px solid rgba(61, 255, 230, 0.2)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}>
          <span>{autoRestNotification}</span>
          <button
            onClick={dismissAutoRest}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Start Workout CTA */}
      <Link href="/start" style={{ display: 'block' }}>
        <div
          data-tour="workout-cta"
          style={{
            background: `linear-gradient(135deg, ${colors.accentBg} 0%, ${colors.bgCard} 100%)`,
            border: `1px solid ${colors.accent}30`,
            borderRadius: radius.xl,
            padding: spacing[5],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          <div>
            <p style={{ ...typography.label, color: colors.accent }}>BEREIT?</p>
            <h2 style={{ ...typography.h2, color: colors.textPrimary, marginTop: spacing[1] }}>
              {todaysDay && !todaysDay.restDay
                ? `${todaysDay.name} starten`
                : 'Freies Training'}
            </h2>
            {activeSplit && (
              <p style={{ ...typography.bodySm, color: colors.textMuted, marginTop: spacing[1] }}>
                {activeSplit.name}
              </p>
            )}
          </div>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Play size={24} color={colors.bgPrimary} fill={colors.bgPrimary} />
          </div>
        </div>
      </Link>

      {/* Stats Row */}
      <div data-tour="streak-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3] }}>
        <StatCard
          icon={<Flame size={18} color={colors.success} />}
          value={String(streak)}
          label="Streak"
          unit="Tage"
          valueColor={colors.success}
        />
        <StatCard
          icon={<Calendar size={18} color={colors.accent} />}
          value={String(weekWorkouts)}
          label="Diese Woche"
          unit="Einheiten"
        />
        <StatCard
          icon={<TrendingUp size={18} color={colors.volumeColor} />}
          value={formatVolume(weekVolume).replace('kg', '').replace('t', '')}
          label="Volumen"
          unit={weekVolume >= 1000 ? 'Tonnen' : 'kg'}
          valueColor={colors.volumeColor}
        />
      </div>


      {/* Athlete Score — compact dashboard card */}
      <Link href="/stats" style={{ display: 'block' }}>
        <div
          data-tour="athlete-score"
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: spacing[4],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${colors.accent}40`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = colors.border; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: radius.lg,
              backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Award size={20} color={colors.accent} />
            </div>
            <div>
              <p style={{ ...typography.label, color: colors.textMuted }}>ATHLETEN-SCORE</p>
              <p style={{ ...typography.monoLg, color: colors.accent, lineHeight: '1.2' }}>
                {displayScore}
                <span style={{ ...typography.bodySm, color: colors.textMuted, marginLeft: spacing[2] }}>
                  / 1000
                </span>
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ ...typography.bodySm, color: colors.textSecondary, fontWeight: '600' }}>
              {athleteScoreLabel(displayScore)}
            </p>
            <ChevronRight size={18} color={colors.textDisabled} style={{ marginTop: '2px' }} />
          </div>
        </div>
      </Link>

      {/* Muscle Coverage Warning */}
      {showMuscleWarning && (
        <div style={{
          backgroundColor: `${colors.warning}10`,
          border: `1px solid ${colors.warning}30`,
          borderRadius: radius.xl,
          padding: spacing[4],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
            <AlertTriangle size={16} color={colors.warning} />
            <span style={{ ...typography.label, color: colors.warning }}>
              NOCH {daysLeft} TAG{daysLeft !== 1 ? 'E' : ''} — MUSKELN UNGENÜGEND TRAINIERT
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            {missingMuscles.slice(0, 4).map((m) => (
              <span key={m} style={{
                padding: `3px ${spacing[2]}`,
                backgroundColor: `${colors.warning}20`,
                border: `1px solid ${colors.warning}40`,
                borderRadius: radius.full,
                ...typography.label,
                color: colors.warning,
              }}>
                {MUSCLE_LABELS_DE[m] ?? m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Week Muscle Heatmap */}
      <div style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        padding: spacing[4],
      }}>
        <p style={{ ...typography.label, color: colors.textMuted, margin: `0 0 ${spacing[3]}` }}>DIESE WOCHE — MUSKELGRUPPEN</p>
        <BodyHeatmap muscleSets={weekMuscleSets} maxSets={weekMaxSets} compact={false} />
      </div>


      {/* Smart Workout Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{
              background: s.priority === 1 ? colors.accentBg : colors.bgCard,
              border: `1px solid ${s.priority === 1 ? `${colors.accent}1F` : colors.border}`,
              borderRadius: '10px', padding: '10px 14px',
              fontSize: '13px', color: colors.textSecondary,
            }}>
              💡 {s.message}
            </div>
          ))}
        </div>
      )}

      {/* Recent Workouts */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing[3],
          }}
        >
          <h3 style={{ ...typography.h3, color: colors.textPrimary }}>
            Letzte Einheiten
          </h3>
          <Link href="/log">
            <span style={{ ...typography.bodySm, color: colors.accent }}>Alle anzeigen</span>
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: `${spacing[8]} ${spacing[4]}`,
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
            }}
          >
            <p style={{ ...typography.body, color: colors.textMuted }}>
              Noch keine Trainingseinheiten.
            </p>
            <p style={{ ...typography.bodySm, color: colors.textFaint, marginTop: spacing[1] }}>
              Starte dein erstes Workout!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {recentSessions.map((session) => (
              <Link key={session.id} href={`/log/${session.id}`}>
                <Card style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                        <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                          {session.splitName ?? 'Freies Training'}
                        </span>
                        {session.newPRs.length > 0 && (
                          <Badge variant="accent">PR</Badge>
                        )}
                      </div>
                      <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                        {formatWorkoutDate(session.date)} · {formatDuration(session.durationSeconds)} · {session.totalSets} Sätze
                      </span>
                    </div>
                    <ChevronRight size={18} color={colors.textDisabled} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Arved Coach Card */}
      <Link href="/chat" style={{ display: 'block' }}>
        <div
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: spacing[4],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${colors.accent}40`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = colors.border; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: radius.lg,
              backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <MessageCircle size={20} color={colors.accent} />
            </div>
            <div>
              <p style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>Coach Arved</p>
              <p style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>
                Dein persönlicher KI Trainer
              </p>
            </div>
          </div>
          <ChevronRight size={18} color={colors.textDisabled} />
        </div>
      </Link>

      {/* Streak Warning Modal */}
      {showStreakModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
          }}
          onClick={() => setShowStreakModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: radius['2xl'], padding: spacing[6],
              width: '100%', maxWidth: '360px', position: 'relative',
            }}
          >
            {/* X-Button */}
            <button
              onClick={() => setShowStreakModal(false)}
              style={{
                position: 'absolute', top: spacing[4], right: spacing[4],
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={18} color={colors.textMuted} />
            </button>

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: spacing[3] }}>
              <Flame size={36} color={colors.danger} />
            </div>

            <h3 style={{
              fontFamily: 'var(--font-barlow)', fontSize: '22px', fontWeight: 700,
              color: colors.textPrimary, textAlign: 'center', marginBottom: spacing[2],
              margin: `0 0 ${spacing[2]} 0`,
            }}>
              Streak in Gefahr!
            </h3>
            <p style={{
              ...typography.body, color: colors.textMuted,
              textAlign: 'center', marginBottom: spacing[5],
              margin: `0 0 ${spacing[5]} 0`,
            }}>
              Du hast mehrere Tage nicht trainiert. Trag einen Rest Day ein um deinen Streak zu retten.
            </p>

            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button
                onClick={() => setShowStreakModal(false)}
                style={{
                  flex: 1, padding: spacing[4], borderRadius: radius.xl,
                  background: colors.bgCard, border: `1px solid ${colors.border}`,
                  color: colors.textMuted, fontSize: '14px', cursor: 'pointer',
                  fontFamily: 'var(--font-manrope)',
                }}
              >
                Schliessen
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  addRestDay(today);
                  setShowStreakModal(false);
                }}
                style={{
                  flex: 1, padding: spacing[4], borderRadius: radius.xl,
                  background: colors.accent, border: 'none',
                  color: colors.bgPrimary, fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-manrope)',
                }}
              >
                Rest Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  unit,
  valueColor,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  unit: string;
  valueColor?: string;
}) {
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
      }}
    >
      {icon}
      <div>
        <div style={{ ...typography.monoLg, color: valueColor ?? colors.textPrimary }}>
          {value}
        </div>
        <div style={{ ...typography.monoSm, color: colors.textMuted }}>
          {unit}
        </div>
      </div>
      <div style={{ ...typography.label, color: colors.textFaint }}>
        {label}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morgen';
  if (hour < 17) return 'Tag';
  return 'Abend';
}
