'use client';

import { useHistoryStore } from '@/store/historyStore';
import { computePersonalRecords } from '@/utils/personalRecords';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { colors, typography, spacing, radius } from '@/constants/tokens';

export default function RecordsPage() {
  const { sessions } = useHistoryStore();
  const records = useMemo(() => computePersonalRecords(sessions), [sessions]);

  return (
    <div
      style={{
        padding: spacing[5],
        paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
        paddingBottom: '80px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[5] }}>
        <Link
          href="/log"
          style={{
            color: colors.textMuted,
            textDecoration: 'none',
            fontSize: '20px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ←
        </Link>
        <h1 style={{ ...typography.h2, color: colors.textPrimary, margin: 0 }}>
          Bestleistungen
        </h1>
      </div>

      {records.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: colors.textFaint,
            paddingTop: '60px',
            ...typography.body,
          }}
        >
          Noch keine abgeschlossenen Trainings
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {records.map((r, i) => (
          <div
            key={r.exerciseId}
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${i === 0 ? 'rgba(250,204,21,0.3)' : colors.border}`,
              borderRadius: radius.lg,
              padding: `${spacing[4]} ${spacing[4]}`,
            }}
          >
            {/* Exercise name row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                marginBottom: spacing[3],
              }}
            >
              {i === 0 && <span style={{ fontSize: '16px' }}>🥇</span>}
              {i === 1 && <span style={{ fontSize: '16px' }}>🥈</span>}
              {i === 2 && <span style={{ fontSize: '16px' }}>🥉</span>}
              <div
                style={{
                  ...typography.h3,
                  color: colors.textPrimary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.exerciseName}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: spacing[5] }}>
              {/* Max Weight */}
              <div>
                <div
                  style={{
                    ...typography.label,
                    color: colors.textMuted,
                    marginBottom: '2px',
                    letterSpacing: '0.05em',
                  }}
                >
                  MAX GEWICHT
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-courier, monospace)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: colors.accent,
                    lineHeight: 1.1,
                  }}
                >
                  {r.maxWeight} kg
                </div>
                <div style={{ ...typography.label, color: colors.textFaint, marginTop: '2px' }}>
                  {format(parseISO(r.maxWeightDate), 'dd.MM.yy')}
                </div>
              </div>

              {/* Estimated 1RM */}
              {r.bestOneRepMax !== null && (
                <div>
                  <div
                    style={{
                      ...typography.label,
                      color: colors.textMuted,
                      marginBottom: '2px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    1RM EST.
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-courier, monospace)',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: colors.accent,
                      lineHeight: 1.1,
                    }}
                  >
                    ≈{r.bestOneRepMax} kg
                  </div>
                  {r.bestOneRepMaxDate && (
                    <div style={{ ...typography.label, color: colors.textFaint, marginTop: '2px' }}>
                      {format(parseISO(r.bestOneRepMaxDate), 'dd.MM.yy')}
                    </div>
                  )}
                </div>
              )}

              {/* Best Volume */}
              <div>
                <div
                  style={{
                    ...typography.label,
                    color: colors.textMuted,
                    marginBottom: '2px',
                    letterSpacing: '0.05em',
                  }}
                >
                  BEST VOLUMEN
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-courier, monospace)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    lineHeight: 1.1,
                  }}
                >
                  {r.maxVolume >= 1000
                    ? `${(r.maxVolume / 1000).toFixed(1)}t`
                    : `${Math.round(r.maxVolume)}kg`}
                </div>
              </div>

              {/* Max Reps */}
              <div>
                <div
                  style={{
                    ...typography.label,
                    color: colors.textMuted,
                    marginBottom: '2px',
                    letterSpacing: '0.05em',
                  }}
                >
                  MAX WDHL
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-courier, monospace)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: colors.textSecondary,
                    lineHeight: 1.1,
                  }}
                >
                  {r.maxReps}×
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
