// app/(tabs)/forum/_components/FreundeTab.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { getFriendships, getProfile, acceptFriendRequest, createDMChannel } from '@/lib/forum';
import type { ForumProfile, Friendship } from '@/types/forum';
import { displayUsername, cheffeColor } from '@/components/forum/CheffeBadge';

interface Props {
  userId: string | null;
}

interface FriendEntry {
  friendship: Friendship;
  profile: ForumProfile;
}

export function FreundeTab({ userId }: Props) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pending, setPending] = useState<{ friendship: Friendship; profile: ForumProfile }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function load() {
      const friendships = await getFriendships(userId!);
      const accepted = friendships.filter((f) => f.status === 'accepted');
      const pendingReceived = friendships.filter(
        (f) => f.status === 'pending' && f.userB === userId
      );

      const [friendProfiles, pendingProfiles] = await Promise.all([
        Promise.all(accepted.map((f) => getProfile(f.userA === userId ? f.userB : f.userA))),
        Promise.all(pendingReceived.map((f) => getProfile(f.userA))),
      ]);

      if (cancelled) return;

      setFriends(
        accepted
          .map((f, i) => ({
            friendship: f,
            profile: friendProfiles[i]!,
          }))
          .filter((e): e is { friendship: Friendship; profile: ForumProfile } => e.profile !== null)
      );
      setPending(
        pendingReceived
          .map((f, i) => ({
            friendship: f,
            profile: pendingProfiles[i]!,
          }))
          .filter((e): e is { friendship: Friendship; profile: ForumProfile } => e.profile !== null)
      );
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleAccept = async (friendshipId: string) => {
    if (!userId) return;
    try {
      await acceptFriendRequest(friendshipId);
      // Reload pending list
      const friendships = await getFriendships(userId);
      const pendingReceived = friendships.filter(
        (f) => f.status === 'pending' && f.userB === userId
      );
      const profiles = await Promise.all(pendingReceived.map((f) => getProfile(f.userA)));
      setPending(
        pendingReceived
          .map((f, i) => ({ friendship: f, profile: profiles[i]! }))
          .filter((e): e is { friendship: Friendship; profile: ForumProfile } => e.profile !== null)
      );
      // Also refresh friends list
      const accepted = friendships.filter((f) => f.status === 'accepted');
      const friendProfiles = await Promise.all(
        accepted.map((f) => getProfile(f.userA === userId ? f.userB : f.userA))
      );
      setFriends(
        accepted
          .map((f, i) => ({ friendship: f, profile: friendProfiles[i]! }))
          .filter((e): e is { friendship: Friendship; profile: ForumProfile } => e.profile !== null)
      );
    } catch (err) {
      console.error('[FreundeTab] handleAccept error:', err);
    }
  };

  const handleOpenDM = async (friendId: string) => {
    if (!userId) return;
    try {
      const channelId = await createDMChannel(userId, friendId);
      router.push(`/forum/${channelId}`);
    } catch (err) {
      console.error('[FreundeTab] handleOpenDM error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>
        Lädt...
      </div>
    );
  }

  return (
    <div style={{ padding: spacing[4] }}>
      {/* Pending requests */}
      {pending.length > 0 && (
        <div style={{ marginBottom: spacing[5] }}>
          <div
            style={{ ...typography.label, color: colors.textMuted, marginBottom: spacing[2] }}
          >
            FREUNDSCHAFTSANFRAGEN ({pending.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {pending.map(({ friendship, profile }) => (
              <div
                key={friendship.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  padding: spacing[3],
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.accent}30`,
                  borderRadius: radius.xl,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.full,
                    flexShrink: 0,
                    backgroundColor: profile.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    color: colors.bgPrimary,
                  }}
                >
                  {profile.username[0].toUpperCase()}
                </div>
                <span
                  style={{
                    ...typography.body,
                    color: cheffeColor(profile.role) || colors.textPrimary,
                    flex: 1,
                  }}
                >
                  {displayUsername(profile.username, profile.role)}
                </span>
                <button
                  onClick={() => handleAccept(friendship.id)}
                  style={{
                    backgroundColor: colors.accent,
                    border: 'none',
                    borderRadius: radius.full,
                    padding: '6px 12px',
                    color: colors.bgPrimary,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Annehmen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div style={{ ...typography.label, color: colors.textMuted, marginBottom: spacing[2] }}>
        FREUNDE ({friends.length})
      </div>
      {friends.length === 0 && (
        <p style={{ ...typography.bodySm, color: colors.textMuted }}>
          Noch keine Freunde — tippe im Chat auf einen Avatar um eine Anfrage zu senden.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {friends.map(({ profile }) => (
          <button
            key={profile.id}
            onClick={() => handleOpenDM(profile.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: spacing[3],
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.xl,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.full,
                flexShrink: 0,
                backgroundColor: profile.avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: colors.bgPrimary,
              }}
            >
              {profile.username[0].toUpperCase()}
            </div>
            <span
              style={{
                ...typography.body,
                flex: 1,
                color: cheffeColor(profile.role) || colors.textPrimary,
              }}
            >
              {displayUsername(profile.username, profile.role)}
            </span>
            <span style={{ ...typography.bodySm, color: colors.textMuted }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
