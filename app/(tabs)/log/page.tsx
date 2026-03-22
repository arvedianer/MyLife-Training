'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Dumbbell, Clock, CheckSquare, Square, Circle, CheckCircle2, X } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Badge } from '@/components/ui/Badge';
import { useHistoryStore } from '@/store/historyStore';
import { formatWorkoutDate, formatDuration } from '@/utils/dates';

export default function LogPage() {
  const router = useRouter();
  const { sessions } = useHistoryStore();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateSplit = () => {
    router.push(`/splits/create?sessions=${selectedIds.join(',')}`);
  };

  return (
    <div
      style={{
        padding: spacing[5],
        paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
        paddingBottom: selectMode ? '140px' : spacing[5],
        display: 'flex',
        flexDirection: 'column',
        gap: spacing[5],
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Verlauf</h1>
          <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
            {sessions.length} {sessions.length === 1 ? 'Einheit' : 'Einheiten'} insgesamt
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={handleToggleSelectMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: radius.lg,
              border: `1px solid ${selectMode ? colors.accent : colors.border}`,
              backgroundColor: selectMode ? colors.accentBg : 'transparent',
              color: selectMode ? colors.accent : colors.textMuted,
              cursor: 'pointer',
              ...typography.bodySm,
              fontWeight: '600',
              transition: 'all 0.15s',
            }}
          >
            {selectMode ? (
              <>
                <X size={14} />
                Abbrechen
              </>
            ) : (
              <>
                <CheckSquare size={14} />
                Auswählen
              </>
            )}
          </button>
        )}
      </div>

      {/* Records Link */}
      <Link
        href="/log/records"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          padding: `${spacing[2]} ${spacing[4]}`,
          ...typography.bodySm,
          color: colors.textSecondary,
          textDecoration: 'none',
          fontWeight: '600',
        }}
      >
        🏆 Bestleistungen
      </Link>

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
          {sessions.map((session) => {
            const isSelected = selectedIds.includes(session.id);

            const cardContent = (
              <div
                style={{
                  backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                  border: `1px solid ${isSelected ? colors.accent + '60' : colors.border}`,
                  borderRadius: radius.lg,
                  padding: spacing[4],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, border-color 0.15s',
                }}
              >
                {/* Checkbox in select mode */}
                {selectMode && (
                  <div style={{ marginRight: spacing[3], flexShrink: 0 }}>
                    {isSelected ? (
                      <CheckCircle2 size={20} color={colors.accent} />
                    ) : (
                      <Circle size={20} color={colors.textDisabled} />
                    )}
                  </div>
                )}

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

                {!selectMode && (
                  <ChevronRight size={18} color={colors.textDisabled} style={{ flexShrink: 0, marginLeft: spacing[2] }} />
                )}
              </div>
            );

            if (selectMode) {
              return (
                <div
                  key={session.id}
                  onClick={() => handleToggleSelect(session.id)}
                  style={{ display: 'block' }}
                >
                  {cardContent}
                </div>
              );
            }

            return (
              <Link key={session.id} href={`/log/${session.id}`} style={{ display: 'block' }}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      )}

      {/* Multi-select bottom bar */}
      {selectMode && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
            left: 0,
            right: 0,
            backgroundColor: colors.bgElevated,
            borderTop: `1px solid ${colors.border}`,
            padding: `12px ${spacing[5]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            zIndex: 10,
          }}
        >
          <span style={{ ...typography.body, color: colors.textMuted }}>
            {selectedIds.length === 0
              ? 'Einheiten auswählen'
              : `${selectedIds.length} ausgewählt`}
          </span>
          {selectedIds.length >= 2 && (
            <button
              onClick={handleCreateSplit}
              style={{
                backgroundColor: colors.accent,
                color: '#000',
                border: 'none',
                borderRadius: radius.lg,
                padding: `10px ${spacing[4]}`,
                ...typography.body,
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Aus Auswahl Split erstellen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
