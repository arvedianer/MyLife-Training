'use client';

import { colors, typography, radius, spacing } from '@/constants/tokens';
import type { Message, ForumProfile } from '@/types/forum';
import { format, parseISO } from 'date-fns';
import { displayUsername, cheffeColor } from '@/components/forum/CheffeBadge';

interface MessageBubbleProps {
  message: Message;
  sender: ForumProfile | null;
  isOwn: boolean;
  onAvatarPress?: () => void;
}

export function MessageBubble({ message, sender, isOwn, onAvatarPress }: MessageBubbleProps) {
  const time = format(parseISO(message.createdAt), 'HH:mm');

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: spacing[2],
      marginBottom: spacing[2],
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
      <div style={{ maxWidth: '72%' }}>
        {!isOwn && sender && (
          <div style={{ ...typography.label, color: cheffeColor(sender.role) || colors.textMuted, marginBottom: 2, paddingLeft: 4 }}>
            {displayUsername(sender.username, sender.role)}
          </div>
        )}
        <div style={{
          backgroundColor: isOwn ? colors.accent : colors.bgCard,
          border: isOwn ? 'none' : `1px solid ${colors.border}`,
          borderRadius: isOwn
            ? `${radius.xl} ${radius.xl} 4px ${radius.xl}`
            : `${radius.xl} ${radius.xl} ${radius.xl} 4px`,
          padding: `${spacing[2]} ${spacing[3]}`,
        }}>
          <p style={{
            ...typography.body,
            color: isOwn ? colors.bgPrimary : colors.textPrimary,
            margin: 0, wordBreak: 'break-word',
          }}>
            {message.content}
          </p>
        </div>
        <div style={{ ...typography.label, color: colors.textDisabled, fontSize: '10px', paddingLeft: 4, marginTop: 2 }}>
          {time}
        </div>
      </div>
    </div>
  );
}
