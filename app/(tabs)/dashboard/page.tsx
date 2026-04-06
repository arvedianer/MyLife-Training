'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Play, TrendingUp, Flame, Calendar, ChevronRight, Settings, Target, MessageCircle, AlertTriangle, X, Award, Lightbulb, CheckCircle2, Circle, Dumbbell, Sparkles } from 'lucide-react';
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

  // New user detection
  const isFirstTime = sessions.length === 0;

  // Muscle coverage signal — only relevant after first workout
  const daysLeft = getRemainingWeekDays();
  const missingMuscles = getMissingMuscles(sessions, Object.keys(MUSCLE_LABELS_DE));
  const showMuscleWarning = !isFirstTime && daysLeft > 0 && missingMuscles.length > 0;


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
          backgroundColor: colors.accentBg,
          border: `1px solid ${colors.accent}33`,
          borderRadius: radius.lg,
          padding: `${spacing[3]} ${spacing[4]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing[3],
        }}>
          <span style={{ ...typography.bodySm, color: colors.textSecondary }}>{autoRestNotification}</span>
          <button
            onClick={dismissAutoRest}
            style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <X size={16} color={colors.textMuted} />
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

      {isFirstTime ? (
        /* ── NEW USER EXPERIENCE ─────────────────────────────────── */
        <>
          {/* Welcome card */}
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: spacing[5],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
              <div style={{
                width: 44, height: 44, borderRadius: radius.lg,
                background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accent}10)`,
                border: `1px solid ${colors.accent}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Sparkles size={20} color={colors.accent} />
              </div>
              <div>
                <p style={{ ...typography.bodyLg, color: colors.textPrimary, fontWeight: '700', margin: 0 }}>
                  Alles bereit — los geht&apos;s!
                </p>
                <p style={{ ...typography.bodySm, color: colors.textMuted, margin: 0, marginTop: 2 }}>
                  Starte dein erstes Training und schreibe Geschichte.
                </p>
              </div>
            </div>

            {/* Checklist */}
            {[
              { done: true,  label: 'Profil erstellt & Plan ausgewählt' },
              { done: false, label: 'Erstes Training absolvieren' },
              { done: false, label: 'Deinen Athleten-Score freischalten' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: spacing[3],
                padding: `${spacing[2]} 0`,
                borderTop: i === 0 ? `1px solid ${colors.borderLight}` : 'none',
              }}>
                {item.done
                  ? <CheckCircle2 size={18} color={colors.success} />
                  : <Circle size={18} color={colors.textDisabled} />
                }
                <span style={{
                  ...typography.body,
                  color: item.done ? colors.textMuted : colors.textSecondary,
                  textDecoration: item.done ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Locked score teaser */}
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: spacing[4],
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            opacity: 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
              <div style={{
                width: 42, height: 42, borderRadius: radius.lg,
                backgroundColor: colors.bgHighest,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Award size={20} color={colors.textDisabled} />
              </div>
              <div>
                <p style={{ ...typography.label, color: colors.textFaint }}>ATHLETEN-SCORE</p>
                <p style={{ ...typography.body, color: colors.textMuted }}>
                  Schalte deinen Score frei
                </p>
              </div>
            </div>
            <span style={{ ...typography.label, color: colors.textFaint }}>🔒</span>
          </div>

          {/* First workout motivation */}
          <div style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: spacing[4],
          }}>
            <p style={{ ...typography.label, color: colors.textMuted, marginBottom: spacing[3] }}>
              TIPPS FÜR DEN START
            </p>
            {[
              { icon: Dumbbell,    text: 'Wähle deinen Split und starte ein Training — Konsistenz schlägt Intensität.' },
              { icon: Flame,       text: 'Auch 20 Minuten zählen. Jede Einheit baut auf der nächsten auf.' },
              { icon: MessageCircle, text: 'Coach Arved beantwortet all deine Fragen — frag einfach.' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: spacing[3],
                padding: `${spacing[2]} 0`,
                borderTop: i === 0 ? `1px solid ${colors.borderLight}` : 'none',
              }}>
                <Icon size={16} color={colors.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ ...typography.bodySm, color: colors.textSecondary }}>{text}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ── RETURNING USER CONTENT ──────────────────────────────── */
        <>
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

          {/* Athlete Score */}
          <Link href="/stats" style={{ display: 'block' }}>
            <div
              data-tour="athlete-score"
              style={{
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.xl,
                padding: spacing[4],
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `${colors.accent}40`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = colors.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <div style={{
                  width: 42, height: 42, borderRadius: radius.lg,
                  backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Award size={20} color={colors.accent} />
                </div>
                <div>
                  <p style={{ ...typography.label, color: colors.textMuted }}>ATHLETEN-SCORE</p>
                  <p style={{ ...typography.monoLg, color: colors.accent, lineHeight: '1.2' }}>
                    {displayScore}
                    <span style={{ ...typography.bodySm, color: colors.textMuted, marginLeft: spacing[2] }}>/ 1000</span>
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ ...typography.bodySm, color: colors.textSecondary, fontWeight: '600' }}>
                  {athleteScoreLabel(displayScore)}
                </p>
                <ChevronRight size={18} color={colors.textDisabled} style={{ marginTop: 2 }} />
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
                    ...typography.label, color: colors.warning,
                  }}>
                    {MUSCLE_LABELS_DE[m] ?? m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{
                  background: s.priority === 1 ? colors.accentBg : colors.bgCard,
                  border: `1px solid ${s.priority === 1 ? `${colors.accent}1F` : colors.border}`,
                  borderRadius: radius.lg, padding: `${spacing[3]} ${spacing[4]}`,
                  display: 'flex', alignItems: 'flex-start', gap: spacing[2],
                  ...typography.bodySm, color: colors.textSecondary,
                }}>
                  <Lightbulb size={14} color={colors.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                  {s.message}
                </div>
              ))}
            </div>
          )}

          {/* Recent Workouts */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
              <h3 style={{ ...typography.h3, color: colors.textPrimary }}>Letzte Einheiten</h3>
              <Link href="/log">
                <span style={{ ...typography.bodySm, color: colors.accent }}>Alle anzeigen</span>
              </Link>
            </div>
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
                          {session.newPRs.length > 0 && <Badge variant="accent">PR</Badge>}
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
          </div>
        </>
      )}

      {/* Week Muscle Heatmap — always visible */}
      <div style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        padding: spacing[4],
      }}>
        <p style={{ ...typography.label, color: colors.textMuted, margin: `0 0 ${spacing[3]}` }}>DIESE WOCHE — MUSKELGRUPPEN</p>
        <BodyHeatmap muscleSets={weekMuscleSets} maxSets={weekMaxSets} compact={false} />
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
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', /* intentional non-token: semi-transparent overlay */
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
              ...typography.h3,
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
                  color: colors.textMuted, cursor: 'pointer',
                  ...typography.body,
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
                  cursor: 'pointer',
                  ...typography.body,
                  color: colors.bgPrimary, fontWeight: '700',
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
