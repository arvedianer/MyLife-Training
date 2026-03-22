'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { createGroupChannel, getFriendships, getProfile } from '@/lib/forum';
import { supabase } from '@/lib/supabase';
import type { ForumProfile } from '@/types/forum';

export default function NewGroupPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<ForumProfile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const friendships = await getFriendships(user.id);
      const accepted = friendships.filter((f) => f.status === 'accepted');
      const profiles = await Promise.all(
        accepted.map((f) => getProfile(f.userA === user.id ? f.userB : f.userA))
      );
      setFriends(profiles.filter(Boolean) as ForumProfile[]);
    });
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!userId || !groupName.trim() || selected.length === 0) return;
    setCreating(true);
    const channelId = await createGroupChannel(userId, groupName.trim(), selected);
    router.push(`/forum/${channelId}`);
  };

  return (
    <div style={{ padding: spacing[4], maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[5] }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} color={colors.textSecondary} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-barlow)', fontSize: 24, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Neue Gruppe
        </h1>
      </div>

      <div style={{ marginBottom: spacing[5] }}>
        <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
          GRUPPENNAME
        </label>
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="z.B. Gym Crew"
          style={{
            width: '100%', backgroundColor: colors.bgHighest,
            border: `1px solid ${colors.border}`, borderRadius: radius.xl,
            padding: `${spacing[3]} ${spacing[4]}`, color: colors.textPrimary, fontSize: 14,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: spacing[5] }}>
        <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
          MITGLIEDER ({selected.length} ausgewählt)
        </label>
        {friends.length === 0 && (
          <p style={{ ...typography.bodySm, color: colors.textMuted }}>
            Noch keine Freunde — füge zuerst Freunde hinzu, indem du im Chat auf ein Profil tippst.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          {friends.map((f) => {
            const isSelected = selected.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: spacing[3],
                  padding: `${spacing[3]} ${spacing[4]}`,
                  backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                  border: `1px solid ${isSelected ? colors.accent + '40' : colors.border}`,
                  borderRadius: radius.xl, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  backgroundColor: f.avatarColor, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: colors.bgPrimary,
                }}>
                  {f.username[0].toUpperCase()}
                </div>
                <span style={{ ...typography.body, color: colors.textPrimary }}>{f.username}</span>
                {isSelected && <div style={{ marginLeft: 'auto' }}><X size={14} color={colors.accent} /></div>}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!groupName.trim() || selected.length === 0 || creating}
        style={{
          width: '100%', padding: spacing[4],
          backgroundColor: (!groupName.trim() || selected.length === 0) ? colors.bgHighest : colors.accent,
          border: 'none', borderRadius: radius.xl,
          color: (!groupName.trim() || selected.length === 0) ? colors.textMuted : colors.bgPrimary,
          fontSize: 16, fontWeight: 700, cursor: (!groupName.trim() || selected.length === 0 || creating) ? 'default' : 'pointer',
        }}
      >
        {creating ? 'Erstelle...' : `Gruppe erstellen (${selected.length + 1} Mitglieder)`}
      </button>
    </div>
  );
}
