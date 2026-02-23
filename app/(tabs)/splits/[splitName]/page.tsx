'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Edit2, Play } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePlanStore } from '@/store/planStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { getExerciseById } from '@/constants/exercises';

export default function SplitDetailPage({
  params,
}: {
  params: { splitName: string };
}) {
  const router = useRouter();
  const { splitName } = params;
  const { getSplitById, activeSplitId, setActiveSplit } = usePlanStore();
  const { startWorkout, activeWorkout } = useWorkoutStore();
  const split = getSplitById(decodeURIComponent(splitName));

  if (!split) {
    return (
      <div style={{ padding: spacing[6] }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>Split nicht gefunden.</p>
      </div>
    );
  }

  const isActive = split.id === activeSplitId;

  const difficultyLabel: Record<string, string> = {
    beginner:     'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced:     'Profi',
  };

  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
      <PageHeader
        title={split.name}
        rightElement={
          <Link href="/splits/edit">
            <button
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Edit2 size={16} color={colors.textMuted} />
            </button>
          </Link>
        }
      />

      <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
        {/* Info */}
        <div>
          <p style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing[3] }}>
            {split.description}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            <Badge variant={isActive ? 'accent' : 'muted'}>
              {split.daysPerWeek}x / Woche
            </Badge>
            <Badge variant="default">
              {difficultyLabel[split.difficulty] ?? split.difficulty}
            </Badge>
            {isActive && (
              <Badge variant="success">
                Aktiv
              </Badge>
            )}
          </div>
        </div>

        {/* Activate */}
        {!isActive && (
          <Button
            fullWidth
            variant="secondary"
            onClick={() => setActiveSplit(split.id)}
          >
            <CheckCircle2 size={16} />
            Als aktiven Plan setzen
          </Button>
        )}

        {/* Days */}
        <div>
          <h3 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
            Trainingstage
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {split.days.map((day, idx) => (
              <div
                key={day.id}
                style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.xl,
                  overflow: 'hidden',
                }}
              >
                {/* Day Header */}
                <div
                  style={{
                    padding: `${spacing[3]} ${spacing[4]}`,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ ...typography.label, color: colors.textMuted }}>
                      TAG {idx + 1}
                    </span>
                    <h4 style={{ ...typography.h3, color: colors.textPrimary }}>
                      {day.name}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[1], justifyContent: 'flex-end' }}>
                    {day.muscleGroups.slice(0, 3).map((mg) => (
                      <Badge key={mg} variant="muted">{mg}</Badge>
                    ))}
                  </div>
                </div>

                {/* Exercises */}
                <div style={{ padding: `${spacing[2]} ${spacing[4]}` }}>
                  {day.exerciseIds.map((exId) => {
                    const ex = getExerciseById(exId);
                    if (!ex) return null;
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
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? colors.accent : colors.textDisabled,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ ...typography.body, color: colors.textSecondary }}>
                          {ex.nameDE}
                        </span>
                        <span style={{ ...typography.bodySm, color: colors.textDisabled, marginLeft: 'auto' }}>
                          {ex.defaultSets}×{ex.defaultReps}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Start this day button */}
                {day.exerciseIds.length > 0 && (
                  <div
                    style={{
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderTop: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <Button
                      variant={activeWorkout ? 'ghost' : 'secondary'}
                      size="sm"
                      fullWidth
                      disabled={!!activeWorkout}
                      onClick={() => {
                        startWorkout(day.name, day.exerciseIds);
                        router.push('/workout/active');
                      }}
                    >
                      <Play size={13} />
                      {day.name} starten
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
