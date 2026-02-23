'use client';

import Link from 'next/link';
import { ChevronRight, Dumbbell, Clock } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { useHistoryStore } from '@/store/historyStore';
import { formatWorkoutDate, formatDuration } from '@/utils/dates';

export default function LogPage() {
  const { sessions } = useHistoryStore();

  return (
    <div
      style={{
        padding: spacing[5],
        paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[5],
      }}
    >
      {/* Header */}
      <div>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Verlauf</h1>
        <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
          {sessions.length} {sessions.length === 1 ? 'Einheit' : 'Einheiten'} insgesamt
        </p>
      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[3],
            paddingTop: spacing[16],
            textAlign: 'center',
          }}
        >
          <Dumbbell size={48} color={colors.textFaint} />
          <div>
            <p style={{ ...typography.bodyLg, color: colors.textMuted, fontWeight: '600' }}>
              Noch keine Einheiten
            </p>
            <p style={{ ...typography.body, color: colors.textDisabled, marginTop: spacing[1] }}>
              Starte dein erstes Training!
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          {sessions.map((session) => (
            <Link key={session.id} href={`/log/${session.id}`} style={{ display: 'block' }}>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + PR Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <span
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.splitName ?? 'Freies Training'}
                    </span>
                    {session.newPRs.length > 0 && (
                      <Badge variant="accent">{session.newPRs.length} PR</Badge>
                    )}
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                      {formatWorkoutDate(session.date)}
                    </span>
                    <span style={{ ...typography.bodySm, color: colors.textDisabled }}>·</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color={colors.textDisabled} />
                      <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                        {formatDuration(session.durationSeconds)}
                      </span>
                    </div>
                    <span style={{ ...typography.bodySm, color: colors.textDisabled }}>·</span>
                    <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                      {session.totalSets} Sätze
                    </span>
                  </div>
                </div>

                <ChevronRight size={18} color={colors.textDisabled} style={{ flexShrink: 0, marginLeft: spacing[2] }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
