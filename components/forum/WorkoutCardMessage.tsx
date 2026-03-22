'use client';

import { colors, typography, radius, spacing } from '@/constants/tokens';
import type { Message, ForumProfile } from '@/types/forum';
import { format, parseISO } from 'date-fns';

interface WorkoutCardMessageProps {
  message: Message;
  sender: ForumProfile | null;
  isOwn: boolean;
  onAvatarPress?: () => void;
}

export function WorkoutCardMessage({ message, sender, isOwn, onAvatarPress }: WorkoutCardMessageProps) {
  const meta = message.metadata;
  const time = format(parseISO(message.createdAt), 'HH:mm');
  const volumeTons = meta ? Math.round(meta.totalVolume / 100) / 10 : 0;
  const durationMin = meta ? Math.round(meta.durationSeconds / 60) : 0;

  return (
    <div style={{
      display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: spacing[2], marginBottom: spacing[2],
    }}>
      {!isOwn && (
        <button
          onClick={onAvatarPress}
          style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            backgroundColor: sender?.avatarColor ?? colors.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: colors.bgPrimary,
            border: 'none', cursor: 'pointer',
          }}
        >
          {(sender?.username?.[0] ?? '?').toUpperCase()}
        </button>
      )}
      <div style={{ maxWidth: '80%' }}>
        {!isOwn && sender && (
          <div style={{ ...typography.label, color: colors.textMuted, marginBottom: 2, paddingLeft: 4 }}>
            {sender.username}
          </div>
        )}
        <div style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.accent}40`,
          borderRadius: radius.xl, overflow: 'hidden', minWidth: 220,
        }}>
          <div style={{
            padding: `${spacing[2]} ${spacing[3]}`,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', gap: spacing[2],
          }}>
            <span>💪</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...typography.label, color: colors.accent, fontWeight: 700 }}>
                {sender?.username ?? 'Training'}
              </div>
              <div style={{ ...typography.label, color: colors.textMuted, fontSize: '10px' }}>
                {format(parseISO(message.createdAt), 'dd.MM.yy · HH:mm')}
              </div>
            </div>
            {meta?.score != null && (
              <div style={{ ...typography.mono, color: colors.success, fontWeight: 700 }}>
                {meta.score}/100
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, backgroundColor: colors.border }}>
            {[
              { label: 'Volumen', value: `${volumeTons}t` },
              { label: 'Dauer', value: `${durationMin}min` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                backgroundColor: colors.bgCard,
                padding: `${spacing[2]} ${spacing[3]}`, textAlign: 'center',
              }}>
                <div style={{ ...typography.mono, color: colors.textPrimary, fontWeight: 700 }}>{value}</div>
                <div style={{ ...typography.label, color: colors.textMuted, fontSize: '10px' }}>{label}</div>
              </div>
            ))}
          </div>
          {meta?.exercises && meta.exercises.length > 0 && (
            <div style={{ padding: `${spacing[2]} ${spacing[3]}` }}>
              {meta.exercises.slice(0, 3).map((ex, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ ...typography.bodySm, color: colors.textSecondary }}>{ex.nameDE}</span>
                  <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                    {ex.sets}× {ex.maxWeight > 0 ? `${ex.maxWeight}kg` : 'EG'}
                  </span>
                </div>
              ))}
              {meta.exercises.length > 3 && (
                <div style={{ ...typography.label, color: colors.textMuted, marginTop: 2 }}>
                  +{meta.exercises.length - 3} weitere
                </div>
              )}
            </div>
          )}
          {message.content && (
            <div style={{ padding: `${spacing[1]} ${spacing[3]} ${spacing[2]}`, borderTop: `1px solid ${colors.border}` }}>
              <p style={{ ...typography.bodySm, color: colors.textMuted, margin: 0 }}>{message.content}</p>
            </div>
          )}
        </div>
        <div style={{ ...typography.label, color: colors.textDisabled, fontSize: '10px', paddingLeft: 4, marginTop: 2 }}>
          {time}
        </div>
      </div>
    </div>
  );
}
