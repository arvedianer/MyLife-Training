'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePlanStore } from '@/store/planStore';
import { predefinedSplits } from '@/constants/splits';
import type { TrainingSplit } from '@/types/splits';
import { getExerciseById } from '@/constants/exercises';
import { MUSCLE_LABELS_DE } from '@/utils/muscleCoverage';

export default function SplitsPage() {
  const { splits, activeSplitId, setActiveSplit, addSplit, deleteSplit } = usePlanStore();

  const difficultyLabel: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Profi',
  };

  const handleActivateTemplate = (template: TrainingSplit) => {
    const clonedSplit: TrainingSplit = {
      ...template,
      id: `custom-${Date.now()}`,
      isActive: true,
      type: 'custom',
      createdAt: Date.now(),
    };
    addSplit(clonedSplit);
  };

  const renderSplitCard = (split: TrainingSplit, isTemplate = false) => {
    const isActive = split.id === activeSplitId;

    const splitMuscles = split.days
      .flatMap(d => d.exerciseIds.map(id => {
        const ex = getExerciseById(id);
        return ex?.primaryMuscle as string | undefined;
      }))
      .filter((m): m is string => Boolean(m));
    const uniqueMuscles = [...new Set(splitMuscles)].slice(0, 5);

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
                  {!isTemplate && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Möchtest du den Plan "${split.name}" wirklich löschen?`)) {
                          deleteSplit(split.id);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: spacing[1],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Plan löschen"
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </button>
                  )}
                </div>
                <p style={{ ...typography.bodySm, color: colors.textMuted }}>
                  {split.description}
                </p>
              </div>
              <ChevronRight size={18} color={colors.textDisabled} style={{ marginLeft: spacing[3], flexShrink: 0 }} />
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' }}>
              <Badge variant={isActive ? 'accent' : 'muted'}>
                {split.daysPerWeek}x / Woche
              </Badge>
              <Badge variant="default">
                {difficultyLabel[split.difficulty] ?? split.difficulty}
              </Badge>
            </div>

            {/* Muscle chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
              {uniqueMuscles.map(m => (
                <span key={m} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}>
                  {(MUSCLE_LABELS_DE as Record<string, string>)[m] ?? m}
                </span>
              ))}
              {uniqueMuscles.length === 0 && (
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Keine Übungen</span>
              )}
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
              onClick={() => isTemplate ? handleActivateTemplate(split) : setActiveSplit(split.id)}
            >
              {isTemplate ? 'Vorlage aktivieren' : 'Als aktiv setzen'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: spacing[5],
        paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[6],
        paddingBottom: '100px',
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

      {/* Meine Pläne */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>Meine Pläne</h2>
        {splits.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: `${spacing[10]} ${spacing[4]}`,
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              marginBottom: spacing[4],
            }}
          >
            <p style={{ ...typography.body, color: colors.textMuted }}>
              Kein eigener Trainingsplan vorhanden.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[6] }}>
            {splits.map(split => <Fragment key={split.id}>{renderSplitCard(split, false)}</Fragment>)}
          </div>
        )}
      </div>

      {/* Vorlagen */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>Vorlagen</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {predefinedSplits.map(template => <Fragment key={template.id}>{renderSplitCard(template, true)}</Fragment>)}
        </div>
      </div>
    </div>
  );
}
