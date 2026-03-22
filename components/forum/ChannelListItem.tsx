'use client';

import Link from 'next/link';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import type { Channel } from '@/types/forum';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { displayUsername } from '@/components/forum/CheffeBadge';

interface ChannelListItemProps {
  channel: Channel;
  unreadCount: number;
}

export function ChannelListItem({ channel, unreadCount }: ChannelListItemProps) {
  const displayName =
    channel.type === 'general' ? 'General Chat' :
    channel.type === 'dm' ? displayUsername(channel.otherUser?.username ?? 'Direktnachricht', channel.otherUser?.role) :
    (channel.name ?? 'Gruppe');

  const subtitle =
    channel.lastMessage
      ? channel.lastMessage.content || (channel.lastMessage.type === 'workout_card' ? 'Workout geteilt' : '')
      : 'Noch keine Nachrichten';

  const timeAgo = channel.lastMessage
    ? formatDistanceToNow(parseISO(channel.lastMessage.createdAt), { locale: de, addSuffix: false })
    : '';

  return (
    <Link
      href={`/forum/${channel.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: spacing[3],
        padding: `${spacing[3]} ${spacing[4]}`,
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        textDecoration: 'none',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        backgroundColor: channel.type === 'general' ? colors.accent : (channel.otherUser?.avatarColor ?? colors.accent),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: 700, color: colors.bgPrimary,
      }}>
        {channel.type === 'general' ? 'G' :
         channel.type === 'group' ? (channel.name?.[0] ?? 'G').toUpperCase() :
         (channel.otherUser?.username?.[0] ?? '?').toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600, marginBottom: 2 }}>
          {displayName}
        </div>
        <div style={{
          ...typography.bodySm, color: colors.textMuted,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {subtitle}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {timeAgo && (
          <span style={{ ...typography.label, color: colors.textDisabled, fontSize: '10px' }}>{timeAgo}</span>
        )}
        {unreadCount > 0 && (
          <div style={{
            backgroundColor: colors.danger, borderRadius: '10px',
            minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
