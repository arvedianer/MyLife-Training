'use client';

import { useState, useEffect } from 'react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useCommunityPresence } from '@/hooks/useCommunityPresence';
import { ProfileSheet } from '@/components/forum/ProfileSheet';
import { displayUsername, cheffeColor } from '@/components/forum/CheffeBadge';
import { getAllProfiles } from '@/lib/forum';
import type { ForumProfile } from '@/types/forum';
import type { CommunityUser } from '@/hooks/useCommunityPresence';

interface Props {
  userId: string | null;
  myProfile: ForumProfile | null;
}

function UserBubble({
  user,
  onPress,
}: {
  user: CommunityUser;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: 'pointer', padding: spacing[2],
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 44, height: 44, borderRadius: radius.full,
          backgroundColor: user.avatarColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: colors.bgPrimary,
          border: user.status === 'training' ? `2px solid ${colors.accent}` : 'none',
        }}>
          {user.username[0].toUpperCase()}
        </div>
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 12, height: 12, borderRadius: '50%',
          backgroundColor: user.status === 'training' ? colors.accent : colors.success,
          border: `2px solid ${colors.bgPrimary}`,
        }} />
      </div>
      <span style={{
        ...typography.label,
        color: cheffeColor(user.role) || colors.textMuted,
        fontSize: 10, maxWidth: 52, textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {user.username}
      </span>
    </button>
  );
}

export function CommunityTab({ userId, myProfile }: Props) {
  const { onlineUsers, trainingUsers } = useCommunityPresence(
    userId,
    myProfile?.username ?? '',
    myProfile?.avatarColor ?? '#4DFFED',
    myProfile?.role,
  );

  const [selectedUser, setSelectedUser] = useState<ForumProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<ForumProfile[]>([]);

  useEffect(() => {
    void getAllProfiles().then(setAllProfiles);
  }, []);

  const toForumProfile = (u: CommunityUser): ForumProfile => ({
    id: u.userId,
    username: u.username,
    avatarColor: u.avatarColor,
    athleteScore: 0,
    streak: 0,
    createdAt: '',
    role: u.role,
  });

  return (
    <div style={{ padding: spacing[4] }}>
      {/* Online now — shown first */}
      {onlineUsers.length > 0 && (
        <div style={{ marginBottom: spacing[5] }}>
          <div style={{ ...typography.label, color: colors.textMuted, marginBottom: spacing[3] }}>
            🟢 ONLINE JETZT ({onlineUsers.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {onlineUsers.map((u) => (
              <UserBubble
                key={u.userId}
                user={u}
                onPress={() => setSelectedUser(toForumProfile(u))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Training now — shown second */}
      {trainingUsers.length > 0 && (
        <div style={{ marginBottom: spacing[5] }}>
          <div style={{ ...typography.label, color: colors.textMuted, marginBottom: spacing[3] }}>
            🏋️ TRAINIERT GERADE ({trainingUsers.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {trainingUsers.map((u) => (
              <button
                key={u.userId}
                onClick={() => setSelectedUser(toForumProfile(u))}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[3],
                  padding: spacing[3],
                  backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}30`,
                  borderRadius: radius.xl, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: radius.full, flexShrink: 0,
                  backgroundColor: u.avatarColor, border: `2px solid ${colors.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: colors.bgPrimary,
                }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...typography.body, color: cheffeColor(u.role) || colors.textPrimary, fontWeight: 600 }}>
                    {displayUsername(u.username, u.role)}
                  </div>
                  {u.exercise && (
                    <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                      {u.exercise}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {onlineUsers.length === 0 && trainingUsers.length === 0 && (
        <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 20 }}>
          <div style={{ fontSize: 32, marginBottom: spacing[3] }}>🏜️</div>
          <p style={{ ...typography.bodySm, color: colors.textMuted }}>
            Gerade niemand online — sei der Erste!
          </p>
        </div>
      )}

      {/* Alle Nutzer — sorted by athleteScore */}
      {allProfiles.length > 0 && (
        <div style={{ marginTop: spacing[5] }}>
          <div style={{ ...typography.label, color: colors.textMuted, marginBottom: spacing[3] }}>
            👥 ALLE NUTZER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {allProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedUser(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[3],
                  padding: spacing[3],
                  backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                  borderRadius: radius.xl, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: radius.full, flexShrink: 0,
                  backgroundColor: p.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: colors.bgPrimary,
                }}>
                  {p.username[0].toUpperCase()}
                </div>
                <span style={{
                  ...typography.body, flex: 1,
                  color: cheffeColor(p.role) || colors.textPrimary,
                }}>
                  {displayUsername(p.username, p.role)}
                </span>
                <span style={{ ...typography.monoSm, color: colors.textMuted }}>
                  {p.athleteScore} Pkt
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile sheet */}
      {selectedUser && (
        <ProfileSheet
          profile={selectedUser}
          currentUserId={userId ?? ''}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
