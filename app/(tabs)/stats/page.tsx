'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import BodyHeatmap from '@/components/ui/BodyHeatmap';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useHistoryStore } from '@/store/historyStore';
import { exercises } from '@/constants/exercises';
import { formatVolume, calculateStreak } from '@/utils/dates';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, subMonths, addWeeks, parseISO, isSameDay, eachDayOfInterval,
} from 'date-fns';
import { de } from 'date-fns/locale';

type Period = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

const PERIOD_LABELS: Record<Period, string> = {
  thisWeek: 'Diese Woche',
  lastWeek: 'Letzte Woche',
  thisMonth: 'Dieser Monat',
  lastMonth: 'Letzter Monat',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern',
  biceps: 'Bizeps', triceps: 'Trizeps', core: 'Core',
  legs: 'Beine', quads: 'Quadrizeps', hamstrings: 'Hamstrings',
  glutes: 'Gesäß', calves: 'Waden', forearms: 'Unterarme',
  neck: 'Nacken', adductors: 'Adduktoren', abductors: 'Abduktoren',
};

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'thisWeek':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'lastWeek': {
      const lw = subWeeks(now, 1);
      return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) };
    }
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
  }
}

function getPreviousPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'thisWeek': {
      const lw = subWeeks(now, 1);
      return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) };
    }
    case 'lastWeek': {
      const tw = subWeeks(now, 2);
      return { start: startOfWeek(tw, { weekStartsOn: 1 }), end: endOfWeek(tw, { weekStartsOn: 1 }) };
    }
    case 'thisMonth': {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case 'lastMonth': {
      const pm = subMonths(now, 2);
      return { start: startOfMonth(pm), end: endOfMonth(pm) };
    }
  }
}

function heatBarColor(r: number): string {
  if (r < 0.25) return 'rgba(255, 80, 50, 0.72)';
  if (r < 0.50) return 'rgba(238, 34, 54, 0.85)';
  if (r < 0.75) return 'rgba(190, 22, 128, 0.92)';
  return 'rgba(138, 43, 200, 0.97)';
}



export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('thisWeek');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const { sessions, getPersonalRecords } = useHistoryStore();
  const prs = getPersonalRecords();

  const { start, end } = useMemo(() => getPeriodRange(period), [period]);

  const periodSessions = useMemo(
    () => sessions.filter(s => { const d = parseISO(s.date); return d >= start && d <= end; }),
    [sessions, start, end],
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

  // Training days calendar
  const periodDays = eachDayOfInterval({ start, end });
  const trainedDays = new Set(periodSessions.map(s => format(parseISO(s.date), 'yyyy-MM-dd')));

  // All-time
  const totalWorkouts = sessions.length;
  const totalDurSec = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalDurH = Math.floor(totalDurSec / 3600);
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

  // 8-week volume chart — supports muscle group filter
  const weeklyVolumeData = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const wStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 7 - i);
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
      week: format(wStart, 'dd.MM', { locale: de }),
      volumen: muscleFilter === null
        ? Math.round((vol / 1000) * 10) / 10  // tonnes
        : Math.round(vol),                      // kg
    };
  }), [sessions, muscleFilter]);

  const volumeUnit = muscleFilter === null ? 't' : 'kg';
  const hasVolumeData = weeklyVolumeData.some(d => d.volumen > 0);

  const exercisesWithPRs = exercises.filter(e => prs[e.id]).slice(0, 10);

  // Previous period (for comparison strip)
  const { start: prevStart, end: prevEnd } = useMemo(() => getPreviousPeriodRange(period), [period]);
  const prevPeriodSessions = useMemo(
    () => sessions.filter(s => { const d = parseISO(s.date); return d >= prevStart && d <= prevEnd; }),
    [sessions, prevStart, prevEnd],
  );
  const prevWorkouts = prevPeriodSessions.length;
  const prevVolume = prevPeriodSessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const prevDurSec = prevPeriodSessions.reduce((sum, s) => sum + s.durationSeconds, 0);

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

      {/* ── PERIOD TABS ── */}
      <div style={{ display: 'flex', gap: spacing[2], overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flexShrink: 0,
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: radius.full,
              border: `1px solid ${period === p ? colors.accent : colors.border}`,
              backgroundColor: period === p ? colors.accentBg : 'transparent',
              ...typography.label,
              color: period === p ? colors.accent : colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {PERIOD_LABELS[p].toUpperCase()}
          </button>
        ))}
      </div>

      {/* ══ HEATMAP — FIRST ══ */}
      <div>
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

      {/* ── PERIOD COMPARISON STRIP ── */}
      {(prevWorkouts > 0 || periodWorkouts > 0) && (
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: `${spacing[3]} ${spacing[4]}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing[2],
        }}>
          <span style={{ ...typography.bodySm, color: colors.textMuted, flexShrink: 0 }}>
            vs. Vorherige Periode
          </span>
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <CompareChip current={periodWorkouts} prev={prevWorkouts} unit="" suffix="WO" />
            <CompareChip current={Math.round(periodVolume / 100) / 10} prev={Math.round(prevVolume / 100) / 10} unit="t" suffix="Vol" />
            <CompareChip current={Math.round(periodDurSec / 60)} prev={Math.round(prevDurSec / 60)} unit="min" suffix="Zeit" />
          </div>
        </div>
      )}

      {/* ── TRAINING CALENDAR ── */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Trainingstage
        </h2>
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: spacing[4],
        }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            gap: periodDays.length > 14 ? spacing[1] : spacing[2],
            justifyContent: 'center',
          }}>
            {periodDays.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const trained = trainedDays.has(key);
              const today = isSameDay(day, new Date());
              const sz = periodDays.length > 14 ? '26px' : '34px';
              return (
                <div
                  key={key}
                  title={format(day, 'EEE dd.MM', { locale: de })}
                  style={{
                    width: sz, height: sz, borderRadius: radius.sm,
                    backgroundColor: trained ? colors.accent : colors.bgHighest,
                    border: today ? `2px solid ${colors.accent}80` : `1px solid ${colors.borderLight}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ ...typography.monoSm, fontSize: '9px', color: trained ? colors.bgPrimary : colors.textFaint }}>
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', marginTop: spacing[3] }}>
            <LegendDot color={colors.accent} label={`Trainiert (${periodWorkouts})`} />
            <LegendDot color={colors.bgHighest} label={`Ruhetag (${periodDays.length - periodWorkouts})`} />
          </div>
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
          {muscleFilter ? `${MUSCLE_LABELS[muscleFilter] ?? muscleFilter} — letzte 8 Wochen` : 'Gesamtvolumen der letzten 8 Wochen'}
        </p>

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
          {hasVolumeData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyVolumeData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
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
              <p style={{ ...typography.bodySm, color: colors.textMuted }}>Noch keine Workouts in den letzten 8 Wochen</p>
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

function CompareChip({ current, prev, unit, suffix }: { current: number; prev: number; unit: string; suffix: string }) {
  const delta = current - prev;
  const sign = delta > 0 ? '+' : '';
  const color = delta > 0 ? colors.success : delta < 0 ? colors.danger : colors.textMuted;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ ...typography.monoSm, color: delta !== 0 ? color : colors.textMuted, fontSize: '11px' }}>
        {delta !== 0 ? `${sign}${delta}${unit}` : `—`}
      </span>
      <span style={{ ...typography.label, color: colors.textDisabled, fontSize: '9px' }}>{suffix}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color }} />
      <span style={{ ...typography.monoSm, color: colors.textMuted }}>{label}</span>
    </div>
  );
}
