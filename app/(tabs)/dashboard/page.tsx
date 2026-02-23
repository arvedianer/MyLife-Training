'use client';

import Link from 'next/link';
import { Play, TrendingUp, Flame, Calendar, ChevronRight, Settings } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useUserStore } from '@/store/userStore';
import { useHistoryStore } from '@/store/historyStore';
import { usePlanStore } from '@/store/planStore';
import { formatWorkoutDate, formatDuration, formatVolume } from '@/utils/dates';

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { sessions } = useHistoryStore();
  const { getActiveSplit, getTodaysSplitDay } = usePlanStore();

  const activeSplit = getActiveSplit();
  const todaysDay = getTodaysSplitDay();
  const recentSessions = sessions.slice(0, 3);

  // Streak berechnen
  const streak = calculateStreak(sessions.map((s) => s.date));

  // Wochenvolumen
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const recentWeekSessions = sessions.filter((s) => new Date(s.date) >= weekAgo);
  const weekVolume = recentWeekSessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const weekWorkouts = recentWeekSessions.length;

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
              : 'Heute ist ein Ruhetag'}
          </p>
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
          icon={<Flame size={18} color={colors.accent} />}
          value={String(streak)}
          label="Streak"
          unit="Tage"
        />
        <StatCard
          icon={<Calendar size={18} color={colors.accent} />}
          value={String(weekWorkouts)}
          label="Diese Woche"
          unit="Einheiten"
        />
        <StatCard
          icon={<TrendingUp size={18} color={colors.accent} />}
          value={formatVolume(weekVolume).replace('kg', '').replace('t', '')}
          label="Volumen"
          unit={weekVolume >= 1000 ? 'Tonnen' : 'kg'}
        />
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
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  unit,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  unit: string;
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
        <div style={{ ...typography.monoLg, color: colors.textPrimary }}>
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

// Parse a YYYY-MM-DD string as a local-time Date (avoids UTC midnight timezone shift)
function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = Array.from(new Set(dates)).sort().reverse();
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const dateStr of sorted) {
    const date = parseLocalDate(dateStr);
    const diff = Math.round(
      (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff <= 1) {
      streak++;
      currentDate = date;
    } else {
      break;
    }
  }

  return streak;
}
