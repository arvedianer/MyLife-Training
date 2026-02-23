'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, AlertCircle, Calendar, Dumbbell } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePlanStore } from '@/store/planStore';
import { decodePlan } from '@/utils/planShare';
import { getExerciseById } from '@/constants/exercises';
import type { TrainingSplit } from '@/types/splits';

export default function ImportSplitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addSplit } = usePlanStore();

  const [split, setSplit] = useState<TrainingSplit | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const data = searchParams.get('data');
    if (!data) {
      setInvalid(true);
      return;
    }
    const decoded = decodePlan(data);
    if (!decoded) {
      setInvalid(true);
      return;
    }
    setSplit(decoded);
  }, [searchParams]);

  const handleImport = () => {
    if (!split) return;
    const importedSplit: TrainingSplit = {
      ...split,
      id: `imported-${Date.now()}`,
      createdAt: Date.now(),
      isActive: false,
    };
    addSplit(importedSplit);
    setImported(true);
    setTimeout(() => router.replace('/splits'), 1200);
  };

  if (invalid) {
    return (
      <div
        style={{
          backgroundColor: colors.bgPrimary,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
          gap: spacing[4],
        }}
      >
        <AlertCircle size={48} color={colors.danger} />
        <h1 style={{ ...typography.h2, color: colors.textPrimary, textAlign: 'center' }}>
          Ungültiger Plan-Link
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
          Der Link ist beschädigt oder abgelaufen.
        </p>
        <Button onClick={() => router.replace('/splits')}>Zurück zu Splits</Button>
      </div>
    );
  }

  if (imported) {
    return (
      <div
        style={{
          backgroundColor: colors.bgPrimary,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
          gap: spacing[4],
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: colors.accentBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Download size={32} color={colors.accent} />
        </div>
        <p style={{ ...typography.body, color: colors.accent }}>Plan importiert!</p>
      </div>
    );
  }

  if (!split) {
    return (
      <div
        style={{
          backgroundColor: colors.bgPrimary,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  }

  return (
    <div
      style={{
        backgroundColor: colors.bgPrimary,
        minHeight: '100dvh',
        paddingBottom: '100px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${spacing[6]} ${spacing[5]} ${spacing[4]}`,
          paddingTop: `calc(${spacing[6]} + env(safe-area-inset-top))`,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ ...typography.label, color: colors.accent, marginBottom: spacing[2] }}>
          PLAN TEILEN
        </div>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          {split.name}
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[2] }}>
          {split.description}
        </p>
        <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[3], flexWrap: 'wrap' }}>
          <Badge variant="muted">{split.daysPerWeek}x/Woche</Badge>
          <Badge variant="muted">{split.difficulty}</Badge>
          <Badge variant="muted">{split.type.toUpperCase()}</Badge>
        </div>
      </div>

      {/* Plan days */}
      <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        {split.scienceNote && (
          <div
            style={{
              padding: spacing[4],
              backgroundColor: `${colors.accent}08`,
              border: `1px solid ${colors.accent}20`,
              borderRadius: radius.xl,
            }}
          >
            <p style={{ ...typography.bodySm, color: colors.textMuted }}>
              {split.scienceNote}
            </p>
          </div>
        )}

        {split.days.map((day, i) => (
          <div
            key={day.id ?? i}
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.xl,
              overflow: 'hidden',
            }}
          >
            {/* Day header */}
            <div
              style={{
                padding: spacing[4],
                borderBottom: day.exerciseIds.length > 0 ? `1px solid ${colors.borderLight}` : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <Calendar size={14} color={colors.textMuted} />
                  <span style={{ ...typography.label, color: colors.textMuted }}>
                    TAG {i + 1}
                  </span>
                </div>
                <h3 style={{ ...typography.h3, color: colors.textPrimary, marginTop: '4px' }}>
                  {day.name}
                </h3>
              </div>
              {day.restDay && (
                <Badge variant="muted">Ruhetag</Badge>
              )}
            </div>

            {/* Exercises */}
            {day.exerciseIds.length > 0 && (
              <div style={{ padding: `${spacing[2]} ${spacing[4]}` }}>
                {day.exerciseIds.map((exId) => {
                  const ex = getExerciseById(exId);
                  return (
                    <div
                      key={exId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[3],
                        padding: `${spacing[2]} 0`,
                        borderBottom: `1px solid ${colors.borderLight}`,
                      }}
                    >
                      <Dumbbell size={12} color={colors.textFaint} />
                      <span style={{ ...typography.body, color: colors.textSecondary }}>
                        {ex?.nameDE ?? exId}
                      </span>
                      {ex && (
                        <span style={{ ...typography.bodySm, color: colors.textDisabled, marginLeft: 'auto' }}>
                          {ex.repRange.min}–{ex.repRange.max}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fixed import button */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          padding: `${spacing[4]} ${spacing[5]}`,
          paddingBottom: `calc(${spacing[4]} + env(safe-area-inset-bottom))`,
          backgroundColor: colors.bgPrimary,
          borderTop: `1px solid ${colors.borderLight}`,
          display: 'flex',
          gap: spacing[3],
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            padding: `${spacing[3]} ${spacing[4]}`,
            borderRadius: radius.lg,
            border: `1px solid ${colors.border}`,
            backgroundColor: 'transparent',
            ...typography.body,
            color: colors.textMuted,
            cursor: 'pointer',
          }}
        >
          Abbrechen
        </button>
        <Button fullWidth size="lg" onClick={handleImport}>
          Plan importieren
        </Button>
      </div>
    </div>
  );
}
