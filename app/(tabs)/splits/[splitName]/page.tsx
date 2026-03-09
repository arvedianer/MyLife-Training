'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Edit2, Play, ChevronDown, ChevronUp, FlaskConical, Share2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePlanStore } from '@/store/planStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { getExerciseById } from '@/constants/exercises';
import { encodePlan } from '@/utils/planShare';
import { predefinedSplits } from '@/constants/splits';
import { analyzeSplit } from '@/utils/splitAnalysis';
import type { RepScheme, TrainingSplit } from '@/types/splits';

export default function SplitDetailPage({
  params,
}: {
  params: { splitName: string };
}) {
  const router = useRouter();
  const { splitName } = params;
  const decodedName = decodeURIComponent(splitName);
  const { getSplitById, activeSplitId, setActiveSplit, addSplit } = usePlanStore();
  const { startWorkout, activeWorkout } = useWorkoutStore();

  let split = getSplitById(decodedName);
  let isTemplate = false;

  if (!split) {
    // Try finding in predefined templates
    const template = predefinedSplits.find(s => s.id === decodedName);
    if (template) {
      split = template;
      isTemplate = true;
    }
  }

  const [scienceOpen, setScienceOpen] = useState(false);

  if (!split) {
    return (
      <div style={{ padding: spacing[6] }}>
        <p style={{ ...typography.body, color: colors.textMuted }}>Split nicht gefunden.</p>
      </div>
    );
  }

  const isActive = split.id === activeSplitId;
  const analysis = analyzeSplit(split);
  const [shareToast, setShareToast] = useState(false);

  const handleShare = () => {
    const encoded = encodePlan(split);
    const url = `${window.location.origin}/splits/import?data=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  };

  const difficultyLabel: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Profi',
  };

  const handleActivateTemplate = () => {
    if (!split) return;
    const clonedSplit: TrainingSplit = {
      ...split,
      id: `custom-${Date.now()}`,
      isActive: true,
      type: 'custom',
      createdAt: Date.now(),
    };
    addSplit(clonedSplit);
    router.push('/splits');
  };

  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
      <PageHeader
        title={split.name}
        rightElement={
          <div style={{ display: 'flex', gap: spacing[2] }}>
            {/* Share button */}
            <button
              onClick={handleShare}
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
              title="Plan teilen"
            >
              <Share2 size={16} color={colors.textMuted} />
            </button>
            {/* Edit button */}
            {!isTemplate && (
              <Link href={`/splits/create?edit=${split.id}`}>
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
            )}
          </div>
        }
      />

      {/* Share toast */}
      {shareToast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.accent}40`,
            borderRadius: radius.lg,
            padding: `${spacing[3]} ${spacing[4]}`,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          <Share2 size={14} color={colors.accent} />
          <span style={{ ...typography.bodySm, color: colors.accent }}>
            Link kopiert!
          </span>
        </div>
      )}

      <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[5] }}>
        {/* Beschreibung + Badges */}
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
            {isActive && <Badge variant="success">Aktiv</Badge>}
          </div>
        </div>

        {/* Plan Quality Card */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: spacing[4],
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <ShieldCheck size={16} color={colors.accent} />
              <span style={{ ...typography.label, color: colors.textMuted }}>PLAN QUALITÄT</span>
            </div>
            {/* Grade badge */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: analysis.score >= 70 ? `${colors.success}20` : analysis.score >= 50 ? `${colors.accent}20` : `${colors.danger}20`,
                border: `2px solid ${analysis.score >= 70 ? colors.success : analysis.score >= 50 ? colors.accent : colors.danger}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{
                ...typography.label,
                color: analysis.score >= 70 ? colors.success : analysis.score >= 50 ? colors.accent : colors.danger,
                fontSize: '14px',
              }}>
                {analysis.grade}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[1] }}>
              <span style={{ ...typography.bodySm, color: colors.textMuted }}>Score</span>
              <span style={{ ...typography.monoSm, color: colors.textPrimary }}>{analysis.score}/100</span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: colors.bgHighest, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${analysis.score}%`,
                  borderRadius: '3px',
                  backgroundColor: analysis.score >= 70 ? colors.success : analysis.score >= 50 ? colors.accent : colors.danger,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], marginBottom: analysis.issues.length > 0 ? spacing[2] : 0 }}>
              {analysis.strengths.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <CheckCircle2 size={12} color={colors.success} />
                  <span style={{ ...typography.bodySm, color: colors.textMuted }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Issues */}
          {analysis.issues.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
              {analysis.issues.map((issue, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[2] }}>
                  <AlertTriangle size={12} color={colors.danger} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ ...typography.bodySm, color: colors.textMuted }}>{issue}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Science Note — kollabierbar */}
        {split.scienceNote && (
          <div
            style={{
              backgroundColor: `${colors.accent}08`,
              border: `1px solid ${colors.accent}25`,
              borderRadius: radius.lg,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setScienceOpen((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: `${spacing[3]} ${spacing[4]}`,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <FlaskConical size={14} color={colors.accent} />
                <span style={{ ...typography.label, color: colors.accent }}>
                  WARUM DIESER PLAN?
                </span>
              </div>
              {scienceOpen ? (
                <ChevronUp size={14} color={colors.accent} />
              ) : (
                <ChevronDown size={14} color={colors.accent} />
              )}
            </button>
            {scienceOpen && (
              <div
                style={{
                  padding: `0 ${spacing[4]} ${spacing[4]}`,
                  borderTop: `1px solid ${colors.accent}20`,
                  paddingTop: spacing[3],
                }}
              >
                <p style={{ ...typography.body, color: colors.textMuted, lineHeight: '22px' }}>
                  {split.scienceNote}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activate */}
        {isTemplate ? (
          <Button
            fullWidth
            variant="primary"
            onClick={handleActivateTemplate}
          >
            <CheckCircle2 size={16} />
            Vorlage aktivieren
          </Button>
        ) : (
          !isActive && (
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setActiveSplit(split!.id)}
            >
              <CheckCircle2 size={16} />
              Als aktiven Plan setzen
            </Button>
          )
        )}

        {/* Trainingstage */}
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[1], justifyContent: 'flex-end', alignItems: 'center' }}>
                    {/* RepScheme Badge */}
                    {day.repScheme && (
                      <RepSchemeBadge scheme={day.repScheme} />
                    )}
                    {day.muscleGroups.slice(0, 2).map((mg) => (
                      <Badge key={mg} variant="muted">{mg}</Badge>
                    ))}
                  </div>
                </div>

                {/* Day Science Note */}
                {day.scienceNote && (
                  <div
                    style={{
                      padding: `${spacing[2]} ${spacing[4]}`,
                      backgroundColor: `${colors.accent}05`,
                      borderBottom: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <p style={{ ...typography.bodySm, color: colors.textMuted }}>
                      {day.scienceNote}
                    </p>
                  </div>
                )}

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
                        <span style={{ ...typography.body, color: colors.textSecondary, flex: 1 }}>
                          {ex.nameDE}
                        </span>
                        {/* Show rep range instead of fixed reps */}
                        <span style={{ ...typography.monoSm, color: colors.textDisabled }}>
                          {ex.defaultSets}×{ex.repRange ? `${ex.repRange.min}–${ex.repRange.max}` : ex.defaultReps}
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

function RepSchemeBadge({ scheme }: { scheme: RepScheme }) {
  const config: Record<RepScheme, { label: string; color: string; bg: string }> = {
    strength: { label: 'KRAFT', color: colors.warning, bg: colors.warningBg },
    hypertrophy: { label: 'HYPERTROPHIE', color: colors.accent, bg: `${colors.accent}15` },
    endurance: { label: 'AUSDAUER', color: colors.success, bg: `${colors.success}15` },
  };
  const c = config[scheme];
  return (
    <div
      style={{
        padding: '2px 8px',
        borderRadius: radius.sm,
        backgroundColor: c.bg,
        border: `1px solid ${c.color}40`,
      }}
    >
      <span style={{ ...typography.label, color: c.color }}>{c.label}</span>
    </div>
  );
}
