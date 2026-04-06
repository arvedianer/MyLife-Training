'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';
import { StreakCalendar } from '@/components/ui/StreakCalendar';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import type { WorkoutSession } from '@/types/workout';
import { useHistoryStore } from '@/store/historyStore';
import { exercises } from '@/constants/exercises';
import { formatVolume, calculateStreak } from '@/utils/dates';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, addWeeks, parseISO, isAfter,
} from 'date-fns';
import { MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';
import { computeMuscleRecovery } from '@/utils/muscleRecovery';
import { de } from 'date-fns/locale';
import { computeAthleteScore, athleteScoreLabel } from '@/utils/athleteScore';
import { useUserStore } from '@/store/userStore';
import { computeStrengthPercentiles } from '@/utils/strengthStandards';
import { estimateOneRepMax } from '@/utils/oneRepMax';

type TimeRange = 'week' | 'month' | 'lifetime';

function getPeriodRange(range: TimeRange, allSessions: WorkoutSession[]): { start: Date; end: Date; sessions: WorkoutSession[] } {
  const now = new Date();
  if (range === 'week') {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return { start, end, sessions: allSessions.filter(s => { const d = parseISO(s.date); return d >= start && d <= end; }) };
  }
  if (range === 'month') {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return { start, end, sessions: allSessions.filter(s => { const d = parseISO(s.date); return d >= start && d <= end; }) };
  }
  // lifetime
  return { start: new Date(0), end: now, sessions: allSessions };
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern',
  biceps: 'Bizeps', triceps: 'Trizeps', core: 'Core',
  legs: 'Beine', quads: 'Quadrizeps', hamstrings: 'Hamstrings',
  glutes: 'Gesäß', calves: 'Waden', forearms: 'Unterarme',
  neck: 'Nacken', adductors: 'Adduktoren', abductors: 'Abduktoren',
};

function heatBarColor(r: number): string {
  // chart data colors — intentional
  if (r < 0.25) return 'rgba(255, 80, 50, 0.72)';
  if (r < 0.50) return 'rgba(238, 34, 54, 0.85)';
  if (r < 0.75) return 'rgba(190, 22, 128, 0.92)';
  return 'rgba(138, 43, 200, 0.97)';
}

const RANGE_WEEKS: Record<string, number> = { '4w': 4, '8w': 8, '3m': 13, '6m': 26, '1y': 52 };
const RANGE_KEYS = ['4w', '8w', '3m', '6m', '1y'] as const;
type VolumeRange = '4w' | '8w' | '3m' | '6m' | '1y';

const PUSH_MUSCLES = new Set(['chest', 'shoulders', 'triceps']);
const PULL_MUSCLES = new Set(['back', 'biceps', 'forearms']);
const LEGS_MUSCLES = new Set(['legs', 'quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors']);
const CORE_MUSCLES = new Set(['core', 'abs']);

export default function StatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [volumeView, setVolumeView] = useState<'weekly' | 'session'>('weekly');
  const [volumeRange, setVolumeRange] = useState<VolumeRange>('8w');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { sessions, restDays, getPersonalRecords } = useHistoryStore();
  const prs = getPersonalRecords();

  const { start, end, sessions: periodSessions } = useMemo(
    () => getPeriodRange(timeRange, sessions),
    [timeRange, sessions],
  );

  // Key metrics
  const periodWorkouts = periodSessions.length;
  const periodVolume = periodSessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const periodDurSec = periodSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const periodSets = periodSessions.reduce((sum, s) => sum + s.totalSets, 0);
  const avgDurMin = periodWorkouts > 0 ? Math.round(periodDurSec / periodWorkouts / 60) : 0;

  // Muscle set counts
  const muscleSets = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of periodSessions) {
      for (const ex of s.exercises) {
        const done = ex.sets.filter(st => st.isCompleted).length;
        if (!done) continue;
        const pm = ex.exercise.primaryMuscle as string;
        if (pm) counts[pm] = (counts[pm] || 0) + done;
        for (const sm of (ex.exercise.secondaryMuscles || []) as string[]) {
          counts[sm] = (counts[sm] || 0) + Math.ceil(done / 2);
        }
      }
    }
    return counts;
  }, [periodSessions]);

  const maxMuscleSets = Math.max(...Object.values(muscleSets), 1);
  const hasMuscleData = Object.keys(muscleSets).length > 0;

  // All-time
  const totalWorkouts = sessions.length;
  const totalDurSec = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalDurH = Math.floor(totalDurSec / 3600);
  const totalVolumeTons = sessions.reduce((sum, s) => sum + s.totalVolume, 0) / 1000;
  const currentStreak = calculateStreak(sessions.map(s => s.date));

  // Available muscles for filter (from all sessions)
  const availableMuscles = useMemo(() => {
    const ms = new Set<string>();
    for (const s of sessions) {
      for (const ex of s.exercises) {
        if (ex.exercise.primaryMuscle) ms.add(ex.exercise.primaryMuscle as string);
      }
    }
    return Array.from(ms).sort();
  }, [sessions]);

  // Athlete Score
  const profile = useUserStore(s => s.profile);
  const lifetimeAthleteScore = useUserStore(s => s.lifetimeAthleteScore);
  const updateLifetimeAthleteScore = useUserStore(s => s.updateLifetimeAthleteScore);

  const athleteResult = useMemo(
    () => computeAthleteScore(sessions, profile?.bodyWeight ?? 0),
    [sessions, profile?.bodyWeight],
  );

  // Persist the lifetime best — useEffect is correct for side effects
  useEffect(() => {
    if (athleteResult.total > 0) updateLifetimeAthleteScore(athleteResult.total);
  }, [athleteResult.total, updateLifetimeAthleteScore]);

  const displayScore = Math.max(lifetimeAthleteScore, athleteResult.total);

  // Best 1RM per exercise across all sessions (for benchmarks)
  const bestOrmByExercise = useMemo(() => {
    const best: Record<string, number> = {};
    for (const session of sessions) {
      for (const ex of session.exercises) {
        const id = ex.exercise?.id ?? '';
        if (!id) continue;
        for (const set of ex.sets) {
          if (!set.isCompleted || !set.weight || !set.reps) continue;
          const orm = estimateOneRepMax(set.weight, set.reps);
          if (orm && orm > (best[id] ?? 0)) best[id] = orm;
        }
      }
    }
    return best;
  }, [sessions]);

  const strengthPercentiles = useMemo(
    () => computeStrengthPercentiles(bestOrmByExercise, profile?.bodyWeight ?? 0),
    [bestOrmByExercise, profile?.bodyWeight],
  );

  // Volume chart — respects volumeRange state
  const weeksToShow = RANGE_WEEKS[volumeRange] ?? 8;
  const weeklyVolumeData = useMemo(() => Array.from({ length: weeksToShow }, (_, i) => {
    const wStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weeksToShow - 1 - i);
    const wEnd = addWeeks(wStart, 1);
    const weekSessions = sessions.filter(s => { const d = parseISO(s.date); return d >= wStart && d < wEnd; });
    let vol: number;
    if (muscleFilter === null) {
      vol = weekSessions.reduce((sum, s) => sum + s.totalVolume, 0);
    } else {
      vol = weekSessions.reduce((sum, s) =>
        sum + s.exercises
          .filter(ex => (ex.exercise.primaryMuscle as string) === muscleFilter)
          .reduce((eSum, ex) =>
            eSum + ex.sets
              .filter(st => st.isCompleted && st.weight > 0 && st.reps > 0)
              .reduce((sSum, st) => sSum + st.weight * st.reps, 0),
          0),
      0);
    }
    return {
      week: format(wStart, 'yyyy-MM-dd'),
      volumen: muscleFilter === null
        ? Math.round((vol / 1000) * 10) / 10  // tonnes
        : Math.round(vol),                      // kg
    };
  }), [sessions, muscleFilter, weeksToShow]);

  const volumeUnit = muscleFilter === null ? 't' : 'kg';
  const hasVolumeData = weeklyVolumeData.some(d => d.volumen > 0);

  // Missing muscles this week
  const missingMusclesThisWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const thisWeekSessions = sessions.filter(s => isAfter(parseISO(s.date), weekStart) || parseISO(s.date) >= weekStart);
    const trainedMuscles = new Set(
      thisWeekSessions.flatMap(s => s.exercises.map(e => e.exercise.primaryMuscle as string))
    );
    const MAJOR_MUSCLES = ['chest', 'back', 'quads', 'shoulders', 'biceps', 'triceps', 'core', 'hamstrings'];
    return MAJOR_MUSCLES.filter(m => !trainedMuscles.has(m));
  }, [sessions]);

  const muscleRecovery = useMemo(() => computeMuscleRecovery(sessions), [sessions]);

  const exercisesWithPRs = exercises.filter(e => prs[e.id]).slice(0, 10);

  // Progressive overload: 1RM estimates for main lifts over time
  const MAIN_LIFTS = [
    { id: 'bench-press',    label: 'Bankdrücken', color: colors.accent },
    { id: 'squat',          label: 'Kniebeuge',   color: colors.cheffe },
    { id: 'deadlift',       label: 'Kreuzheben',  color: colors.danger },
    { id: 'overhead-press', label: 'OHP',         color: colors.prColor },
  ] as const;

  const overloadData = useMemo(() => {
    const sortedSessions = [...sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-52);

    return sortedSessions.map(session => {
      const point: Record<string, string | number> = {
        date: session.date,
      };
      for (const lift of MAIN_LIFTS) {
        const ex = session.exercises.find(e => e.exercise?.id === lift.id);
        if (!ex) continue;
        let bestOrm: number | null = null;
        for (const set of ex.sets) {
          if (!set.isCompleted || !set.weight || !set.reps) continue;
          const orm = estimateOneRepMax(set.weight, set.reps);
          if (orm !== null && (bestOrm === null || orm > bestOrm)) bestOrm = orm;
        }
        if (bestOrm !== null) point[lift.label] = bestOrm;
      }
      return point;
    });
  // MAIN_LIFTS is a const defined in render scope but never changes — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  const overloadHasData = MAIN_LIFTS.some(lift =>
    overloadData.filter(d => lift.label in d).length >= 3,
  );

// Strength progression: top 5 most-trained exercises with max-weight history
  const strengthData = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    for (const session of sessions) {
      for (const ex of session.exercises) {
        const id = ex.exercise.id;
        if (!counts[id]) counts[id] = { name: ex.exercise.nameDE, count: 0 };
        counts[id].count += 1;
      }
    }
    const top5 = Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    return top5.map(([exerciseId, { name }]) => {
      const history = sessions
        .filter(s => s.exercises.some(e => e.exercise.id === exerciseId))
        .map(s => {
          const ex = s.exercises.find(e => e.exercise.id === exerciseId)!;
          const done = ex.sets.filter(st => st.isCompleted && st.weight > 0);
          const maxWeight = done.length > 0 ? Math.max(...done.map(st => st.weight)) : 0;
          return { datum: format(parseISO(s.date), 'dd.MM', { locale: de }), maxWeight };
        })
        .reverse()
        .slice(0, 12)
        .filter(d => d.maxWeight > 0);
      return { exerciseId, name, history };
    }).filter(({ history }) => history.length >= 2);
  }, [sessions]);


  return (
    <div style={{
      padding: spacing[5],
      paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
      display: 'flex', flexDirection: 'column', gap: spacing[6],
      paddingBottom: spacing[8],
    }}>

      {/* ── HEADER ── */}
      <div>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Statistiken</h1>
        <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
          Dein Fortschritt auf einen Blick
        </p>
      </div>

      {/* ── TIME RANGE TOGGLE ── */}
      <div style={{
        display: 'flex', gap: '4px',
        background: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: '10px', padding: '3px',
        marginBottom: spacing[4],
      }}>
        {(['week', 'month', 'lifetime'] as const).map(r => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            style={{
              flex: 1, padding: '7px 0',
              borderRadius: '7px', border: 'none', cursor: 'pointer',
              background: timeRange === r ? colors.accent : 'transparent',
              color: timeRange === r ? colors.bgPrimary : colors.textMuted,
              fontSize: '13px', fontWeight: 600,
              fontFamily: typography.body.fontFamily,
              transition: 'all 0.15s ease',
            }}
          >
            {r === 'week' ? 'Woche' : r === 'month' ? 'Monat' : 'Lebenszeit'}
          </button>
        ))}
      </div>

      {/* ══ HEATMAP — FIRST ══ */}
      <div data-tour="heatmap">
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Muskelgruppen
        </h2>
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: spacing[4],
        }}>
          <BodyHeatmap muscleSets={muscleSets} maxSets={maxMuscleSets} />


          {/* Muscle bars — top 8 */}
          {hasMuscleData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {Object.entries(muscleSets)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([muscle, sets]) => {
                  const r = sets / maxMuscleSets;
                  return (
                    <div key={muscle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ ...typography.bodySm, color: colors.textSecondary }}>
                          {MUSCLE_LABELS[muscle] ?? muscle}
                        </span>
                        <span style={{ ...typography.monoSm, color: colors.textMuted }}>{sets} Sets</span>
                      </div>
                      <div style={{ height: '5px', borderRadius: '3px', backgroundColor: colors.bgHighest, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${r * 100}%`, borderRadius: '3px',
                          backgroundColor: heatBarColor(r), transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p style={{ ...typography.bodySm, color: colors.textMuted, textAlign: 'center', paddingTop: spacing[2] }}>
              Kein Training in diesem Zeitraum aufgezeichnet.
            </p>
          )}
        </div>
      </div>

      {/* ── MISSING MUSCLES THIS WEEK ── */}
      {missingMusclesThisWeek.length > 0 && missingMusclesThisWeek.length < 7 && (
        <div style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: `${spacing[3]} ${spacing[4]}`,
        }}>
          <div style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[2] }}>
            Diese Woche noch nicht trainiert:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            {missingMusclesThisWeek.map(m => (
              <span key={m} style={{
                backgroundColor: colors.bgElevated,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.full,
                padding: `3px ${spacing[3]}`,
                ...typography.label,
                color: colors.textSecondary,
              }}>
                {(MUSCLE_LABELS_DE as Record<string, string>)[m] ?? m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── MUSCLE RECOVERY ── */}
      {muscleRecovery.length > 0 && (
        <section style={{ marginBottom: spacing[5] }}>
          <h2 style={{ ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing[2] }}>
            Muskel-Erholung
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[2] }}>
            {muscleRecovery.slice(0, 8).map(m => {
              const pct = Math.round(m.recoveryRatio * 100);
              const isReady = m.status === 'recovered';
              // status bar colors — intentional
              const barColor = m.status === 'fatigued' ? colors.danger
                : m.status === 'recovering' ? '#FF9F0A'
                : colors.success;
              return (
                <div key={m.muscle} style={{
                  backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                  borderRadius: radius.md, padding: `${spacing[2]} ${spacing[3]}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] }}>
                    <span style={{ ...typography.bodySm, fontWeight: 600, color: colors.textSecondary }}>
                      {m.label}
                    </span>
                    <span style={{ ...typography.label, color: isReady ? colors.success : colors.textMuted }}>
                      {isReady ? 'Bereit' : m.hoursAgo < 24 ? `~${m.hoursAgo}h` : `~${Math.round(m.hoursAgo / 24)}d`}
                    </span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: colors.border, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, maxWidth: '100%',
                      backgroundColor: barColor, borderRadius: '2px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ATHLETE SCORE ── */}
      <div style={{
        background: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: radius.lg, padding: spacing[5],
        textAlign: 'center', marginBottom: spacing[4],
      }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: typography.h1.fontFamily, marginBottom: spacing[3] }}>
          Athleten-Score
        </p>
        <div style={{ display: 'flex', gap: spacing[6], justifyContent: 'center', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '64px', fontWeight: 800, color: colors.accent, fontFamily: typography.h1.fontFamily, lineHeight: 1, margin: 0 }}>
              {athleteResult.total}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, fontFamily: typography.body.fontFamily, marginTop: spacing[1], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {timeRange === 'week' ? 'Diese Woche' : timeRange === 'month' ? 'Diesen Monat' : 'Gesamt'}
            </p>
          </div>
          {lifetimeAthleteScore > 0 && lifetimeAthleteScore !== athleteResult.total && (
            <div style={{ textAlign: 'center', opacity: 0.55 }}>
              <p style={{ fontSize: '64px', fontWeight: 800, color: colors.textMuted, fontFamily: typography.h1.fontFamily, lineHeight: 1, margin: 0 }}>
                {lifetimeAthleteScore}
              </p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, fontFamily: typography.body.fontFamily, marginTop: spacing[1], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                All-Time Best
              </p>
            </div>
          )}
        </div>
        <p style={{ fontSize: '16px', fontWeight: 600, color: colors.textSecondary, fontFamily: typography.body.fontFamily, marginTop: spacing[2] }}>
          {athleteScoreLabel(Math.max(lifetimeAthleteScore, athleteResult.total))}
        </p>
      </div>

      {/* ── PROGRESSIVE OVERLOAD CHART ── */}
      {overloadHasData && (
        <div style={{ marginBottom: spacing[4] }}>
          <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[1] }}>
            Kraftentwicklung
          </h2>
          <p style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[3] }}>
            Geschätztes 1RM der Hauptübungen über Zeit
          </p>
          <div style={{
            backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg, padding: spacing[4],
          }}>
            {!mounted ? (
              <div style={{ height: '180px', backgroundColor: colors.bgHighest, borderRadius: radius.md }} />
            ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={overloadData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(d: string) => {
                    try { return format(parseISO(d), 'dd.MM'); } catch { return d; }
                  }}
                />
                <YAxis
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  unit="kg"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.md }}
                  labelStyle={{ color: colors.textMuted, fontSize: '11px' }}
                  labelFormatter={(d: string) => {
                    try { return format(parseISO(d), 'dd.MM.yyyy'); } catch { return d; }
                  }}
                />
                {MAIN_LIFTS.map(lift => (
                  <Line
                    key={lift.id}
                    type="monotone"
                    dataKey={lift.label}
                    stroke={lift.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            )}
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[3], justifyContent: 'center', marginTop: spacing[3] }}>
              {MAIN_LIFTS.map(lift => (
                <div key={lift.id} style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                  <div style={{ width: '10px', height: '3px', borderRadius: '2px', backgroundColor: lift.color }} />
                  <span style={{ ...typography.monoSm, color: colors.textMuted }}>{lift.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4 DIMENSIONS (Endurance removed) ── */}
      <div style={{ marginBottom: spacing[4] }}>
        <h2 style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing[2], fontFamily: typography.h1.fontFamily }}>
          Dimensionen
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[2] }}>
          {athleteResult.dimensions
            .filter(dim => dim.name !== 'Endurance')
            .map(dim => (
            <div key={dim.name} style={{
              background: colors.bgCard, border: `1px solid ${colors.border}`,
              borderRadius: radius.md, padding: spacing[3],
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, fontFamily: typography.body.fontFamily }}>
                  {dim.nameDE}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: colors.accent, fontFamily: typography.h1.fontFamily, lineHeight: 1 }}>
                  {dim.score}
                </span>
              </div>
              <div style={{ height: '3px', background: colors.border, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${dim.score}%`,
                  background: colors.accent, borderRadius: '2px',
                }} />
              </div>
              <p style={{ fontSize: '10px', color: colors.textFaint, marginTop: spacing[1], fontFamily: typography.body.fontFamily, lineHeight: 1.4 }}>
                {dim.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── BENCHMARKS ── */}
      {(strengthPercentiles.length > 0 || sessions.length >= 3) && (
        <div data-tour="benchmarks" style={{ marginBottom: spacing[4] }}>
          <h2 style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing[2], fontFamily: typography.h1.fontFamily }}>
            Kraftvergleich
          </h2>
          <div style={{
            background: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg, overflow: 'hidden',
          }}>
            {strengthPercentiles.length > 0 ? (
              strengthPercentiles.map((p, i) => (
                <div key={p.exercise} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderBottom: i < strengthPercentiles.length - 1 ? `1px solid ${colors.border}` : 'none',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, fontFamily: typography.body.fontFamily }}>
                    {p.exerciseDE}
                  </span>
                  <span style={{ fontSize: '13px', color: colors.textMuted, fontFamily: typography.body.fontFamily }}>
                    ~{p.orm}&thinsp;kg · <span style={{ color: colors.accent, fontWeight: 700 }}>Top {100 - p.percentile}%</span>
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: colors.textMuted, fontFamily: typography.body.fontFamily, textAlign: 'center', padding: spacing[4] }}>
                Trage dein Körpergewicht in den Einstellungen ein, um Kraftvergleiche zu sehen.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── LIFETIME STATS ── */}
      {timeRange === 'lifetime' && (
        <div style={{ marginBottom: spacing[4] }}>
          <h2 style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: spacing[2], fontFamily: typography.h1.fontFamily }}>
            Lebenszeit
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[2], marginBottom: spacing[2] }}>
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing[3], textAlign: 'center' }}>
              <p style={{ fontSize: '26px', fontWeight: 800, color: colors.accent, fontFamily: typography.h1.fontFamily, margin: 0, lineHeight: 1 }}>
                {totalVolumeTons.toFixed(1)}t
              </p>
              <p style={{ fontSize: '10px', color: colors.textMuted, fontFamily: typography.body.fontFamily, marginTop: spacing[1] }}>Bewegt</p>
            </div>
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing[3], textAlign: 'center' }}>
              <p style={{ fontSize: '26px', fontWeight: 800, color: colors.accent, fontFamily: typography.h1.fontFamily, margin: 0, lineHeight: 1 }}>
                {totalWorkouts}
              </p>
              <p style={{ fontSize: '10px', color: colors.textMuted, fontFamily: typography.body.fontFamily, marginTop: spacing[1] }}>Sessions</p>
            </div>
            <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: spacing[3], textAlign: 'center' }}>
              <p style={{ fontSize: '26px', fontWeight: 800, color: colors.accent, fontFamily: typography.h1.fontFamily, margin: 0, lineHeight: 1 }}>
                {totalDurH}h
              </p>
              <p style={{ fontSize: '10px', color: colors.textMuted, fontFamily: typography.body.fontFamily, marginTop: spacing[1] }}>Trainiert</p>
            </div>
          </div>
          {totalVolumeTons > 0 && (
            <p style={{ fontSize: '12px', color: colors.textMuted, fontFamily: typography.body.fontFamily, textAlign: 'center', fontStyle: 'italic' }}>
              Du hast {(totalVolumeTons / 7300 * 100).toFixed(1)}% des Eiffelturms gehoben (7.300 Tonnen).
            </p>
          )}
        </div>
      )}

      {/* ── 3 KEY METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3] }}>
        <MetricCard
          label="Einheiten"
          value={String(periodWorkouts)}
          sub="Workouts"
        />
        <MetricCard
          label="Volumen"
          value={periodVolume >= 1000 ? `${(periodVolume / 1000).toFixed(1)}t` : `${Math.round(periodVolume)}kg`}
          sub="Gesamt"
        />
        <MetricCard
          label="Ø Dauer"
          value={`${avgDurMin}min`}
          sub="Pro Workout"
        />
      </div>


      {/* ── AKTIVITÄTS-KALENDER (GitHub-Style) ── */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Aktivitäts-Kalender
        </h2>
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: `${spacing[3]} ${spacing[4]}`,
        }}>
          <StreakCalendar
            trainingDates={sessions.map(s => s.date)}
            restDays={restDays ?? []}
            weeks={14}
          />
        </div>
      </div>

      {/* ── VOLUME PROGRESS CHART ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing[1] }}>
          <h2 style={{ ...typography.h3, color: colors.textPrimary }}>
            Volumen-Entwicklung
          </h2>
        </div>
        <p style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[3] }}>
          {muscleFilter ? `${MUSCLE_LABELS[muscleFilter] ?? muscleFilter} — letzte ${volumeRange}` : `Gesamtvolumen — letzte ${volumeRange}`}
        </p>

        {/* Volume range selector */}
        <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[3] }}>
          {RANGE_KEYS.map(rk => (
            <button
              key={rk}
              onClick={() => setVolumeRange(rk)}
              style={{
                padding: `3px ${spacing[3]}`, borderRadius: radius.full,
                border: `1px solid ${volumeRange === rk ? colors.accent : colors.border}`,
                backgroundColor: volumeRange === rk ? colors.accentBg : 'transparent',
                ...typography.label, color: volumeRange === rk ? colors.accent : colors.textMuted,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {rk.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Muscle filter pills */}
        {availableMuscles.length > 0 && (
          <div style={{
            display: 'flex', gap: spacing[2], overflowX: 'auto', scrollbarWidth: 'none',
            paddingBottom: spacing[2], marginBottom: spacing[3],
          }}>
            <button
              onClick={() => setMuscleFilter(null)}
              style={{
                flexShrink: 0, padding: `4px ${spacing[3]}`, borderRadius: radius.full,
                border: `1px solid ${muscleFilter === null ? colors.volumeColor : colors.border}`,
                backgroundColor: muscleFilter === null ? `${colors.volumeColor}20` : 'transparent',
                ...typography.label, color: muscleFilter === null ? colors.volumeColor : colors.textMuted,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              Alle
            </button>
            {availableMuscles.map(m => (
              <button
                key={m}
                onClick={() => setMuscleFilter(m === muscleFilter ? null : m)}
                style={{
                  flexShrink: 0, padding: `4px ${spacing[3]}`, borderRadius: radius.full,
                  border: `1px solid ${muscleFilter === m ? colors.volumeColor : colors.border}`,
                  backgroundColor: muscleFilter === m ? `${colors.volumeColor}20` : 'transparent',
                  ...typography.label, color: muscleFilter === m ? colors.volumeColor : colors.textMuted,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {MUSCLE_LABELS[m] ?? m}
              </button>
            ))}
          </div>
        )}

        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: spacing[4],
        }}>
          {!mounted ? (
            <div style={{ height: '200px', backgroundColor: colors.bgHighest, borderRadius: radius.md }} />
          ) : hasVolumeData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyVolumeData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(dateStr: string) => {
                    try {
                      const date = parseISO(dateStr);
                      if (weeksToShow <= 8) {
                        // Show abbreviated week date "KW dd.MM"
                        return format(date, 'dd.MM', { locale: de });
                      }
                      // For larger ranges show just month abbreviation
                      return format(date, 'MMM', { locale: de }).slice(0, 3);
                    } catch {
                      return dateStr;
                    }
                  }}
                  interval={weeksToShow > 13 ? Math.floor(weeksToShow / 8) : 0}
                />
                <YAxis
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false} unit={volumeUnit} width={32}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: '12px' }}
                  labelStyle={{ color: colors.textMuted }}
                  itemStyle={{ color: colors.volumeColor }}
                  cursor={{ fill: colors.bgHighest }}
                  formatter={(v: number) => [`${v} ${volumeUnit}`, muscleFilter ? (MUSCLE_LABELS[muscleFilter] ?? muscleFilter) : 'Gesamt']}
                />
                <Bar dataKey="volumen" fill={colors.volumeColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ ...typography.bodySm, color: colors.textMuted }}>Noch keine Workouts in den letzten {volumeRange}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── KRAFTENTWICKLUNG ── */}
      {strengthData.length > 0 && (
        <div>
          <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[1] }}>
            Kraftentwicklung
          </h2>
          <p style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[3] }}>
            Max. Gewicht deiner meisttrainierten Übungen
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {strengthData.map(({ exerciseId, name, history }) => {
              const prWeight = prs[exerciseId]?.weight ?? 0;
              const firstW = history[0]?.maxWeight ?? 0;
              const lastW = history[history.length - 1]?.maxWeight ?? 0;
              const gainKg = lastW - firstW;
              return (
                <Link key={exerciseId} href={`/stats/exercise/${exerciseId}`}>
                  <div
                    style={{
                      backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                      borderRadius: radius.lg, padding: spacing[4], cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgElevated}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgCard}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                      <span style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600 }}>{name}</span>
                      <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                        {gainKg !== 0 && (
                          <span style={{
                            ...typography.monoSm, fontSize: '10px',
                            color: gainKg > 0 ? colors.success : colors.danger,
                          }}>
                            {gainKg > 0 ? '+' : ''}{gainKg} kg
                          </span>
                        )}
                        {prWeight > 0 && (
                          <span style={{
                            ...typography.monoSm, color: colors.prColor,
                            backgroundColor: `${colors.prColor}20`,
                            padding: '2px 8px', borderRadius: radius.full, fontSize: '10px',
                          }}>
                            PR {prWeight} kg
                          </span>
                        )}
                      </div>
                    </div>
                    {mounted ? (
                      <ResponsiveContainer width="100%" height={70}>
                        <LineChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                          <XAxis
                            dataKey="datum"
                            tick={{ fill: colors.textFaint, fontSize: 9, fontFamily: 'monospace' }}
                            axisLine={false} tickLine={false} interval="preserveStartEnd"
                          />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{ backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: radius.sm, fontSize: '11px' }}
                            labelStyle={{ color: colors.textMuted }}
                            itemStyle={{ color: colors.volumeColor }}
                            formatter={(v: number) => [`${v} kg`, 'Max. Gewicht']}
                          />
                          <Line
                            type="monotone" dataKey="maxWeight"
                            stroke={colors.volumeColor} strokeWidth={2}
                            dot={{ fill: colors.volumeColor, r: 2, strokeWidth: 0 }}
                            activeDot={{ fill: colors.accent, r: 4, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '70px', backgroundColor: colors.bgHighest, borderRadius: radius.sm }} />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PERSONAL RECORDS ── */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Personal Records
        </h2>
        {exercisesWithPRs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: `${spacing[6]} ${spacing[4]}`,
            backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}>
            <p style={{ ...typography.body, color: colors.textMuted }}>Noch keine Rekorde vorhanden.</p>
            <p style={{ ...typography.bodySm, color: colors.textDisabled, marginTop: spacing[1] }}>
              Trainiere und setze neue Bestleistungen!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {exercisesWithPRs.map(exercise => {
              const pr = prs[exercise.id];
              return (
                <Link key={exercise.id} href={`/stats/exercise/${exercise.id}`}>
                  <div
                    style={{
                      backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                      borderRadius: radius.lg, padding: spacing[4],
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgElevated}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgCard}
                  >
                    <div>
                      <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600 }}>{exercise.nameDE}</div>
                      <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>Bestes Set</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ ...typography.mono, color: colors.prColor }}>{pr.weight} kg</div>
                        <div style={{ ...typography.monoSm, color: colors.textMuted }}>× {pr.reps} Wdh.</div>
                      </div>
                      <ChevronRight size={16} color={colors.textDisabled} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ALL-TIME SLIM STRIP ── */}
      <div style={{
        backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: radius.lg, padding: `${spacing[4]} ${spacing[4]}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...typography.monoLg, color: colors.textPrimary }}>{totalWorkouts}</div>
          <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>Einheiten</div>
        </div>
        <div style={{
          textAlign: 'center',
          borderLeft: `1px solid ${colors.borderLight}`,
          borderRight: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ ...typography.monoLg, color: colors.textPrimary }}>{currentStreak}</div>
          <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>Streak Tage</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...typography.monoLg, color: colors.textPrimary }}>{totalDurH}h</div>
          <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>Zeit im Gym</div>
        </div>
      </div>

    </div>
  );
}

// ─── Helper Components ─────────────────────────────────────
function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{
      backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
      borderRadius: radius.lg, padding: spacing[3],
      display: 'flex', flexDirection: 'column', gap: spacing[1],
    }}>
      <div style={{ ...typography.monoLg, color: colors.textPrimary, lineHeight: 1, fontSize: '18px' }}>{value}</div>
      <div style={{ ...typography.label, color: colors.textFaint, marginTop: '2px' }}>{label}</div>
    </div>
  );
}
