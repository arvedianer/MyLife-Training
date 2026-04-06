'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Plus, Trash2, BookOpen, Zap } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePlanStore } from '@/store/planStore';
import { predefinedSplits } from '@/constants/splits';
import type { TrainingSplit } from '@/types/splits';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Anfänger',
  intermediate: 'Fortgeschritten',
  advanced: 'Profi',
} as const;

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: colors.success,
  intermediate: colors.accent,
  advanced: colors.danger,
} as const;

export default function SplitsPage() {
  const { splits, activeSplitId, setActiveSplit, addSplit, deleteSplit, getTodaysSplitDay } =
    usePlanStore();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const activeSplit = splits.find((s) => s.id === activeSplitId) ?? null;
  const todayDay = getTodaysSplitDay();
  const otherSplits = splits.filter((s) => s.id !== activeSplitId);

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
      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Trainingspläne</h1>
          <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
            {activeSplit ? activeSplit.name : 'Kein aktiver Plan'}
          </p>
        </div>
        <Link href="/splits/edit">
          <Button variant="secondary" size="sm">
            <Plus size={16} />
            Neu
          </Button>
        </Link>
      </div>

      {/* ── ACTIVE PLAN HERO ── */}
      {activeSplit && (
        <Link
          href={`/splits/${encodeURIComponent(activeSplit.id)}`}
          data-tour="active-split-card"
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.accentBg} 0%, transparent 60%)`,
              border: `1px solid ${colors.accent}30`,
              borderRadius: radius.xl,
              padding: spacing[5],
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {/* Label row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing[3],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <span
                  style={{
                    ...typography.label,
                    color: colors.accent,
                    backgroundColor: `${colors.accent}18`,
                    border: `1px solid ${colors.accent}30`,
                    borderRadius: radius.full,
                    padding: `2px ${spacing[3]}`,
                  }}
                >
                  AKTIVER PLAN
                </span>
                {todayDay && (
                  <span
                    style={{
                      ...typography.label,
                      color: colors.accent,
                      backgroundColor: `${colors.accent}20`,
                      border: `1px solid ${colors.accent}40`,
                      borderRadius: radius.full,
                      padding: `2px ${spacing[3]}`,
                    }}
                  >
                    Heute: {todayDay.name}
                  </span>
                )}
              </div>
              <ChevronRight size={20} color={colors.accent} style={{ flexShrink: 0 }} />
            </div>

            {/* Name */}
            <h2
              style={{
                ...typography.h2,
                color: colors.textPrimary,
                marginBottom: spacing[1],
              }}
            >
              {activeSplit.name}
            </h2>

            {/* Description */}
            <p
              style={{
                ...typography.bodySm,
                color: colors.textMuted,
                marginBottom: spacing[4],
              }}
            >
              {activeSplit.description}
            </p>

            {/* Day pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing[2],
                marginBottom: spacing[4],
              }}
            >
              {activeSplit.days.map((day) => (
                <span
                  key={day.id}
                  style={{
                    ...typography.label,
                    fontSize: '10px',
                    color: colors.accent,
                    backgroundColor: `${colors.accent}20`,
                    border: `1px solid ${colors.accent}40`,
                    borderRadius: radius.full,
                    padding: `3px ${spacing[2]}`,
                  }}
                >
                  {day.name}
                </span>
              ))}
            </div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
              <Badge variant="accent">{activeSplit.daysPerWeek}×/Woche</Badge>
              <span
                style={{
                  ...typography.label,
                  color: DIFFICULTY_COLOR[activeSplit.difficulty] ?? colors.textMuted,
                  backgroundColor: `${DIFFICULTY_COLOR[activeSplit.difficulty] ?? colors.textMuted}18`,
                  border: `1px solid ${DIFFICULTY_COLOR[activeSplit.difficulty] ?? colors.textMuted}40`,
                  borderRadius: radius.full,
                  padding: `2px ${spacing[2]}`,
                }}
              >
                {DIFFICULTY_LABEL[activeSplit.difficulty] ?? activeSplit.difficulty}
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* ── MEINE PLÄNE (other custom splits) ── */}
      {otherSplits.length > 0 && (
        <div>
          <h2
            style={{
              ...typography.h3,
              color: colors.textPrimary,
              marginBottom: spacing[3],
            }}
          >
            Meine Pläne
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {otherSplits.map((split) => (
              <Fragment key={split.id}>
                <div
                  style={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.xl,
                    overflow: 'hidden',
                  }}
                >
                  <Link href={`/splits/${encodeURIComponent(split.id)}`}>
                    <div style={{ padding: spacing[4], cursor: 'pointer' }}>
                      {/* Name row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: spacing[2],
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h3
                            style={{
                              ...typography.h3,
                              color: colors.textPrimary,
                              marginBottom: spacing[1],
                            }}
                          >
                            {split.name}
                          </h3>
                          <p style={{ ...typography.bodySm, color: colors.textMuted }}>
                            {split.description}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginLeft: spacing[3] }}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setDeleteConfirm(split.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: spacing[1],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                            title="Plan löschen"
                          >
                            <Trash2 size={16} color={colors.danger} />
                          </button>
                          <ChevronRight size={18} color={colors.textDisabled} style={{ flexShrink: 0 }} />
                        </div>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                        <Badge variant="muted">{split.daysPerWeek}×/Woche</Badge>
                        <span
                          style={{
                            ...typography.label,
                            color: DIFFICULTY_COLOR[split.difficulty] ?? colors.textMuted,
                            backgroundColor: `${DIFFICULTY_COLOR[split.difficulty] ?? colors.textMuted}18`,
                            border: `1px solid ${DIFFICULTY_COLOR[split.difficulty] ?? colors.textMuted}40`,
                            borderRadius: radius.full,
                            padding: `2px ${spacing[2]}`,
                          }}
                        >
                          {DIFFICULTY_LABEL[split.difficulty] ?? split.difficulty}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Activate button */}
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
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── TEMPLATE LIBRARY ── */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginBottom: spacing[3],
          }}
        >
          <BookOpen size={18} color={colors.textMuted} />
          <h2 style={{ ...typography.h3, color: colors.textPrimary }}>
            Trainingspläne entdecken
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          {predefinedSplits.map((template) => (
            <Fragment key={template.id}>
              <div
                style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.xl,
                  overflow: 'hidden',
                }}
              >
                <Link href={`/splits/${encodeURIComponent(template.id)}`}>
                  <div style={{ padding: spacing[4], cursor: 'pointer' }}>
                    {/* Name + chevron */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: spacing[2],
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            ...typography.h3,
                            color: colors.textPrimary,
                            marginBottom: spacing[1],
                          }}
                        >
                          {template.name}
                        </h3>
                        <p style={{ ...typography.bodySm, color: colors.textMuted }}>
                          {template.description}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        color={colors.textDisabled}
                        style={{ marginLeft: spacing[3], flexShrink: 0 }}
                      />
                    </div>

                    {/* Badges + first 2 tags */}
                    <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                      <Badge variant="muted">{template.daysPerWeek}×/Woche</Badge>
                      <span
                        style={{
                          ...typography.label,
                          color: DIFFICULTY_COLOR[template.difficulty] ?? colors.textMuted,
                          backgroundColor: `${DIFFICULTY_COLOR[template.difficulty] ?? colors.textMuted}18`,
                          border: `1px solid ${DIFFICULTY_COLOR[template.difficulty] ?? colors.textMuted}40`,
                          borderRadius: radius.full,
                          padding: `2px ${spacing[2]}`,
                        }}
                      >
                        {DIFFICULTY_LABEL[template.difficulty] ?? template.difficulty}
                      </span>
                      {template.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            ...typography.label,
                            color: colors.textMuted,
                            backgroundColor: colors.bgHighest,
                            borderRadius: radius.full,
                            padding: `2px ${spacing[2]}`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>

                {/* Activate button */}
                <div style={{ padding: `0 ${spacing[4]} ${spacing[4]}` }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleActivateTemplate(template)}
                  >
                    <Zap size={14} />
                    Aktivieren
                  </Button>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteConfirm !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: spacing[4],
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: colors.bgCard,
              borderRadius: radius['2xl'],
              border: `1px solid ${colors.border}`,
              padding: spacing[6],
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[4],
            }}
          >
            <div style={{ ...typography.h3, color: colors.textPrimary }}>Plan löschen?</div>
            <div style={{ ...typography.body, color: colors.textMuted }}>
              {`Möchtest du den Plan "${splits.find((s) => s.id === deleteConfirm)?.name ?? ''}" wirklich löschen?`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
              <button
                onClick={() => {
                  deleteSplit(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                style={{
                  width: '100%',
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  backgroundColor: colors.danger,
                  border: 'none',
                  cursor: 'pointer',
                  ...typography.bodyLg,
                  fontWeight: '700',
                  color: colors.bgPrimary,
                }}
              >
                Ja, löschen
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  width: '100%',
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  backgroundColor: colors.bgElevated,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  ...typography.body,
                  color: colors.textSecondary,
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
