'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { useHistoryStore } from '@/store/historyStore';
import { getExerciseById } from '@/constants/exercises';
import { formatShortDate, formatVolume } from '@/utils/dates';

export default function ExerciseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const exercise = getExerciseById(id);
  const { getSessionsByExercise, getPersonalRecords } = useHistoryStore();

  const sessions = getSessionsByExercise(id);
  const prs = getPersonalRecords();
  const pr = prs[id];

  if (!exercise) {
    return (
      <div style={{ padding: spacing[6] }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>Übung nicht gefunden.</p>
      </div>
    );
  }

  // Letzten 30 Sätze für diese Übung
  const setHistory = sessions
    .flatMap((session) => {
      const ex = session.exercises.find((e) => e.exercise.id === id);
      if (!ex) return [];
      return ex.sets
        .filter((s) => s.isCompleted)
        .map((s) => ({
          date: session.date,
          weight: s.weight,
          reps: s.reps,
          volume: s.weight * s.reps,
          isPR: s.isPR,
        }));
    })
    .slice(0, 30);

  // Gewichtsprogression: bestes Gewicht je Session
  const progressionData = sessions
    .map((session) => {
      const ex = session.exercises.find((e) => e.exercise.id === id);
      if (!ex) return null;
      const completedSets = ex.sets.filter((s) => s.isCompleted && s.weight > 0);
      if (completedSets.length === 0) return null;
      const bestWeight = Math.max(...completedSets.map((s) => s.weight));
      return {
        datum: formatShortDate(session.date),
        gewicht: bestWeight,
      };
    })
    .filter((d): d is { datum: string; gewicht: number } => d !== null)
    .reverse()
    .slice(0, 15);

  const hasProgressionData = progressionData.length >= 2;
  const prWeight = pr?.weight ?? 0;

  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
      <PageHeader title={exercise.nameDE} subtitle={exercise.primaryMuscle} />

      <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[6], paddingBottom: spacing[8] }}>
        {/* PR Banner */}
        {pr && (
          <div
            style={{
              backgroundColor: colors.accentBg,
              border: `1px solid ${colors.accent}30`,
              borderRadius: radius.xl,
              padding: spacing[4],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ ...typography.label, color: colors.accent }}>PERSONAL RECORD</p>
              <p style={{ ...typography.monoLg, color: colors.textPrimary, marginTop: spacing[1] }}>
                {pr.weight} kg × {pr.reps} Wdh.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ ...typography.label, color: colors.textMuted }}>VOLUMEN</p>
              <p style={{ ...typography.mono, color: colors.accent }}>
                {formatVolume(pr.volume)}
              </p>
            </div>
          </div>
        )}

        {/* Gewichtsprogression Chart */}
        <div>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Gewichtsprogression
          </h3>
          <div
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              padding: spacing[4],
            }}
          >
            {hasProgressionData ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={progressionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.borderLight}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="datum"
                    tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: colors.textFaint, fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    unit="kg"
                    width={40}
                    domain={['auto', 'auto']}
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
                    formatter={(value: number) => [`${value} kg`, 'Bestes Gewicht']}
                  />
                  {prWeight > 0 && (
                    <ReferenceLine
                      y={prWeight}
                      stroke={colors.accent}
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="gewicht"
                    stroke={colors.accent}
                    strokeWidth={2}
                    dot={{ fill: colors.accent, r: 3, strokeWidth: 0 }}
                    activeDot={{ fill: colors.accent, r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
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
                  {progressionData.length < 2
                    ? 'Mindestens 2 Einheiten für den Graphen nötig'
                    : 'Noch keine Daten vorhanden'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Exercise Info */}
        <div>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Details
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            <Badge variant="accent">{exercise.primaryMuscle}</Badge>
            {exercise.secondaryMuscles.map((m) => (
              <Badge key={m} variant="muted">{m}</Badge>
            ))}
            {exercise.equipment.map((eq) => (
              <Badge key={eq} variant="default">{eq}</Badge>
            ))}
            <Badge variant={exercise.category === 'compound' ? 'success' : 'default'}>
              {exercise.category}
            </Badge>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Verlauf ({setHistory.length} Sätze)
          </h3>

          {setHistory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: spacing[8],
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
              }}
            >
              <p style={{ ...typography.body, color: colors.textMuted }}>
                Noch keine Daten vorhanden.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {setHistory.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: entry.isPR ? colors.accentBg : colors.bgCard,
                    border: `1px solid ${entry.isPR ? colors.accent + '40' : colors.border}`,
                    borderRadius: radius.lg,
                    padding: `${spacing[3]} ${spacing[4]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ ...typography.mono, color: colors.textPrimary }}>
                      {entry.weight} kg × {entry.reps}
                    </span>
                    <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>
                      {formatShortDate(entry.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ ...typography.monoSm, color: entry.isPR ? colors.accent : colors.textDisabled }}>
                      {entry.volume} Vol.
                    </span>
                    {entry.isPR && (
                      <div style={{ ...typography.label, color: colors.accent, fontSize: '10px' }}>
                        PR
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
