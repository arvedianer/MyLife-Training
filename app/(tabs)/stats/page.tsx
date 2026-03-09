'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import BodyHeatmap from '@/components/ui/BodyHeatmap';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
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

function heatBarColor(r: number): string {
  if (r < 0.25) return 'rgba(255, 80, 50, 0.72)';
  if (r < 0.50) return 'rgba(238, 34, 54, 0.85)';
  if (r < 0.75) return 'rgba(190, 22, 128, 0.92)';
  return 'rgba(138, 43, 200, 0.97)';
}



export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('thisWeek');
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

  // 8-week volume chart
  const weeklyVolumeData = Array.from({ length: 8 }, (_, i) => {
    const wStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 7 - i);
    const wEnd = addWeeks(wStart, 1);
    const vol = sessions
      .filter(s => { const d = parseISO(s.date); return d >= wStart && d < wEnd; })
      .reduce((sum, s) => sum + s.totalVolume, 0);
    return {
      week: format(wStart, 'dd.MM', { locale: de }),
      volumen: Math.round((vol / 1000) * 10) / 10,
    };
  });
  const hasVolumeData = weeklyVolumeData.some(d => d.volumen > 0);

  const exercisesWithPRs = exercises.filter(e => prs[e.id]).slice(0, 10);


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
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[1] }}>
          Volumen-Entwicklung
        </h2>
        <p style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[3] }}>
          Trainingsvolumen der letzten 8 Wochen
        </p>
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: spacing[4],
        }}>
          {hasVolumeData ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyVolumeData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false} unit="t" width={28}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: '12px' }}
                  labelStyle={{ color: colors.textMuted }}
                  itemStyle={{ color: colors.volumeColor }}
                  cursor={{ fill: colors.bgHighest }}
                  formatter={(v: number) => [`${v} t`, 'Volumen']}
                />
                <Bar dataKey="volumen" fill={colors.volumeColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ ...typography.bodySm, color: colors.textMuted }}>Noch keine Workouts in den letzten 8 Wochen</p>
            </div>
          )}
        </div>
      </div>

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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color }} />
      <span style={{ ...typography.monoSm, color: colors.textMuted }}>{label}</span>
    </div>
  );
}
