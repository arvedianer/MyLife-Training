'use client';

import Link from 'next/link';
import { ChevronRight, CheckCircle2, Plus } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePlanStore } from '@/store/planStore';

export default function SplitsPage() {
  const { splits, activeSplitId, setActiveSplit } = usePlanStore();

  const difficultyLabel: Record<string, string> = {
    beginner:     'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced:     'Profi',
  };

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
          <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Trainingspläne</h1>
          <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
            Deine Splits & Periodisierung
          </p>
        </div>
        <Link href="/splits/edit">
          <Button variant="secondary" size="sm">
            <Plus size={16} />
            Neu
          </Button>
        </Link>
      </div>

      {/* Splits */}
      {splits.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: `${spacing[10]} ${spacing[4]}`,
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}
        >
          <p style={{ ...typography.body, color: colors.textMuted }}>
            Kein Trainingsplan vorhanden.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {splits.map((split) => {
            const isActive = split.id === activeSplitId;
            return (
              <div
                key={split.id}
                style={{
                  backgroundColor: isActive ? colors.accentBg : colors.bgCard,
                  border: `1px solid ${isActive ? colors.accent + '40' : colors.border}`,
                  borderRadius: radius.xl,
                  overflow: 'hidden',
                }}
              >
                {/* Split Header */}
                <Link href={`/splits/${encodeURIComponent(split.id)}`}>
                  <div
                    style={{
                      padding: spacing[4],
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                          <h3 style={{ ...typography.h3, color: colors.textPrimary }}>
                            {split.name}
                          </h3>
                          {isActive && (
                            <CheckCircle2 size={16} color={colors.accent} />
                          )}
                        </div>
                        <p style={{ ...typography.bodySm, color: colors.textMuted }}>
                          {split.description}
                        </p>
                      </div>
                      <ChevronRight size={18} color={colors.textDisabled} style={{ marginLeft: spacing[3], flexShrink: 0 }} />
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      <Badge variant={isActive ? 'accent' : 'muted'}>
                        {split.daysPerWeek}x / Woche
                      </Badge>
                      <Badge variant="default">
                        {difficultyLabel[split.difficulty] ?? split.difficulty}
                      </Badge>
                    </div>
                  </div>
                </Link>

                {/* Split Days Preview */}
                <div
                  style={{
                    borderTop: `1px solid ${isActive ? colors.accent + '20' : colors.border}`,
                    padding: `${spacing[3]} ${spacing[4]}`,
                    display: 'flex',
                    gap: spacing[2],
                    flexWrap: 'wrap',
                  }}
                >
                  {split.days.map((day) => (
                    <span
                      key={day.id}
                      style={{
                        ...typography.label,
                        fontSize: '10px',
                        color: isActive ? colors.accent : colors.textMuted,
                        backgroundColor: isActive ? `${colors.accent}15` : colors.bgHighest,
                        padding: `${spacing[1]} ${spacing[2]}`,
                        borderRadius: radius.full,
                      }}
                    >
                      {day.name}
                    </span>
                  ))}
                </div>

                {/* Activate Button */}
                {!isActive && (
                  <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}` }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => setActiveSplit(split.id)}
                    >
                      Als aktiv setzen
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
