'use client';

import Link from 'next/link';
import { Play, TrendingUp, Flame, Calendar, ChevronRight, Settings, Target, MessageCircle, AlertTriangle } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';
import { useUserStore } from '@/store/userStore';
import { useHistoryStore } from '@/store/historyStore';
import { usePlanStore } from '@/store/planStore';
import { formatWorkoutDate, formatDuration, formatVolume, calculateStreak } from '@/utils/dates';
import { parseISO } from 'date-fns';
import { getMissingMuscles, getRemainingWeekDays, getWeeklyMuscleStatus, MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { sessions } = useHistoryStore();
  const { getActiveSplit, getTodaysSplitDay } = usePlanStore();

  const activeSplit = getActiveSplit();
  const todaysDay = getTodaysSplitDay();
  const recentSessions = sessions.slice(0, 3);

  // Streak berechnen
  const streak = calculateStreak(sessions.map((s) => s.date));

  // Wochenvolumen (parseISO für konsistente Timezone-Behandlung)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const recentWeekSessions = sessions.filter((s) => parseISO(s.date) >= weekAgo);
  const weekVolume = recentWeekSessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const weekWorkouts = recentWeekSessions.length;

  // Muscle coverage signal
  const daysLeft = getRemainingWeekDays();
  const missingMuscles = getMissingMuscles(sessions, Object.keys(MUSCLE_LABELS_DE));
  const showMuscleWarning = daysLeft > 0 && missingMuscles.length > 0;

  // Compact heatmap data — use getWeeklyMuscleStatus for consistency with warning logic
  const weeklyStatus = getWeeklyMuscleStatus(sessions);
  const muscleSets = Object.fromEntries(weeklyStatus.map((s) => [s.muscleId, s.setsThisWeek]));
  const maxMuscleSets = Math.max(...weeklyStatus.map((s) => s.setsThisWeek), 1);

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

      {/* Start Workout CTA */}
      <Link href="/start" style={{ display: 'block' }}>
        <div
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3] }}>
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

      {/* Compact Body Heatmap */}
      <div style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        padding: spacing[3],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <BodyHeatmap compact muscleSets={muscleSets} maxSets={maxMuscleSets} />
      </div>

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
