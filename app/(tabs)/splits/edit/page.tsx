'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, PenLine } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePlanStore } from '@/store/planStore';
import { predefinedSplits } from '@/constants/splits';
import type { TrainingSplit } from '@/types/splits';

export default function EditPlanPage() {
  const router = useRouter();
  const { addSplit, deleteSplit, setActiveSplit, splits } = usePlanStore();
  const [tab, setTab] = useState<'templates' | 'my'>('templates');

  const handleAddTemplate = (split: TrainingSplit) => {
    const newSplit: TrainingSplit = {
      ...split,
      id: `${split.id}-${Date.now()}`,
      isActive: splits.length === 0,
      createdAt: Date.now(),
    };
    addSplit(newSplit);
    router.back();
  };

  const difficultyLabel: Record<string, string> = {
    beginner:     'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced:     'Profi',
  };

  return (
    <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
      <PageHeader title="Plan bearbeiten" />

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          padding: `0 ${spacing[5]}`,
          borderBottom: `1px solid ${colors.border}`,
          gap: spacing[4],
        }}
      >
        {(['templates', 'my'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: `${spacing[3]} 0`,
              ...typography.body,
              fontWeight: '600',
              color: tab === t ? colors.accent : colors.textMuted,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === t ? colors.accent : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t === 'templates' ? 'Vorlagen' : 'Meine Pläne'}
          </button>
        ))}
      </div>

      <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {tab === 'templates' ? (
          <>
            <p style={{ ...typography.bodySm, color: colors.textMuted }}>
              Wähle eine Vorlage als Ausgangspunkt.
            </p>
            {predefinedSplits.map((split) => (
              <div
                key={split.id}
                style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.xl,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: spacing[4] }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                    <div>
                      <h3 style={{ ...typography.h3, color: colors.textPrimary }}>
                        {split.name}
                      </h3>
                      <p style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>
                        {split.description}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: spacing[2], marginBottom: spacing[3] }}>
                    <Badge variant="muted">{split.daysPerWeek}x / Woche</Badge>
                    <Badge variant="default">{difficultyLabel[split.difficulty] ?? split.difficulty}</Badge>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleAddTemplate(split)}
                  >
                    <Plus size={14} />
                    Vorlage hinzufügen
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Create new split button */}
            <Link href="/splits/create" style={{ display: 'block' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                  width: '100%',
                  padding: spacing[4],
                  borderRadius: radius.xl,
                  border: `1px dashed ${colors.accent}50`,
                  backgroundColor: colors.accentBg,
                  ...typography.body,
                  color: colors.accent,
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <PenLine size={16} />
                Eigenen Plan erstellen
              </button>
            </Link>

            {splits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: `${spacing[6]} ${spacing[4]}` }}>
                <p style={{ ...typography.body, color: colors.textMuted }}>
                  Noch keine eigenen Pläne. Erstell deinen ersten!
                </p>
              </div>
            ) : (
              splits.map((split) => (
                <div
                  key={split.id}
                  style={{
                    backgroundColor: colors.bgCard,
                    border: `1px solid ${split.isActive ? colors.accent + '50' : colors.border}`,
                    borderRadius: radius.xl,
                    padding: spacing[4],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing[3],
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                      <h3 style={{ ...typography.h3, color: colors.textPrimary }}>
                        {split.name}
                      </h3>
                      {split.isActive && (
                        <span style={{ ...typography.label, color: colors.accent, fontSize: '10px' }}>
                          AKTIV
                        </span>
                      )}
                    </div>
                    <p style={{ ...typography.bodySm, color: colors.textMuted }}>
                      {split.daysPerWeek}x / Woche · {split.days.length} Trainingstage
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
                    {!split.isActive && (
                      <button
                        onClick={() => setActiveSplit(split.id)}
                        style={{
                          ...typography.bodySm,
                          color: colors.accent,
                          background: 'none',
                          border: `1px solid ${colors.accent}50`,
                          borderRadius: radius.md,
                          padding: `${spacing[1]} ${spacing[3]}`,
                          cursor: 'pointer',
                        }}
                      >
                        Aktivieren
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`"${split.name}" wirklich löschen?`)) {
                          deleteSplit(split.id);
                        }
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        cursor: 'pointer',
                        opacity: 0.6,
                        transition: 'opacity 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = colors.danger;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.opacity = '0.6';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = colors.border;
                      }}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
