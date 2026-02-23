'use client';

import Link from 'next/link';
import { ChevronRight, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useHistoryStore } from '@/store/historyStore';
import { exercises } from '@/constants/exercises';
import { formatVolume } from '@/utils/dates';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function StatsPage() {
  const { sessions, getPersonalRecords } = useHistoryStore();
  const prs = getPersonalRecords();

  // Gesamtstatistiken
  const totalWorkouts = sessions.length;
  const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const totalSets = sessions.reduce((sum, s) => sum + s.totalSets, 0);
  const avgDuration =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.durationSeconds, 0) /
            sessions.length /
            60
        )
      : 0;

  // Wöchentliches Volumen (letzte 8 Wochen)
  const weeklyVolumeData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (7 - i) * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekVolume = sessions
      .filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, s) => sum + s.totalVolume, 0);

    return {
      week: format(weekStart, 'dd.MM', { locale: de }),
      volumen: Math.round((weekVolume / 1000) * 10) / 10,
    };
  });

  // Übungen mit PRs
  const exercisesWithPRs = exercises
    .filter((e) => prs[e.id])
    .slice(0, 10);

  const hasVolume = weeklyVolumeData.some((d) => d.volumen > 0);

  return (
    <div
      style={{
        padding: spacing[5],
        paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[6],
        paddingBottom: spacing[8],
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Statistiken</h1>
        <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
          Dein Fortschritt auf einen Blick
        </p>
      </div>

      {/* Wochenvolumen Chart */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Wochenvolumen
        </h2>
        <div
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: spacing[4],
          }}
        >
          {hasVolume ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyVolumeData} barSize={20}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.borderLight}
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fill: colors.textFaint, fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textFaint, fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  unit="t"
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgElevated,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    color: colors.textPrimary,
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: colors.textMuted }}
                  itemStyle={{ color: colors.accent }}
                  cursor={{ fill: colors.bgHighest }}
                  formatter={(value: number) => [`${value} t`, 'Volumen']}
                />
                <Bar dataKey="volumen" fill={colors.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ ...typography.bodySm, color: colors.textFaint }}>
                Noch keine Daten vorhanden
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Gesamt-Stats */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Gesamt
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[3] }}>
          <StatBlock label="Einheiten" value={String(totalWorkouts)} />
          <StatBlock label="Gesamtvolumen" value={formatVolume(totalVolume)} />
          <StatBlock label="Gesamt-Sätze" value={String(totalSets)} />
          <StatBlock label="Ø Dauer" value={`${avgDuration} min`} />
        </div>
      </div>

      {/* Personal Records */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Personal Records
        </h2>

        {exercisesWithPRs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: `${spacing[8]} ${spacing[4]}`,
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
            }}
          >
            <TrendingUp size={36} color={colors.textFaint} />
            <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[3] }}>
              Noch keine Rekorde vorhanden.
            </p>
            <p style={{ ...typography.bodySm, color: colors.textDisabled, marginTop: spacing[1] }}>
              Trainiere und setze neue Bestleistungen!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {exercisesWithPRs.map((exercise) => {
              const pr = prs[exercise.id];
              return (
                <Link key={exercise.id} href={`/stats/exercise/${exercise.id}`}>
                  <div
                    style={{
                      backgroundColor: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.lg,
                      padding: spacing[4],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgElevated;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgCard;
                    }}
                  >
                    <div>
                      <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                        {exercise.nameDE}
                      </div>
                      <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>
                        Bestes Volumen pro Satz
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ ...typography.mono, color: colors.accent }}>
                          {pr.weight} kg
                        </div>
                        <div style={{ ...typography.monoSm, color: colors.textMuted }}>
                          × {pr.reps} Wdh.
                        </div>
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
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: spacing[4],
      }}
    >
      <div style={{ ...typography.monoLg, color: colors.textPrimary }}>
        {value}
      </div>
      <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>
        {label}
      </div>
    </div>
  );
}
