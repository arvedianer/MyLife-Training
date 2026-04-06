// app/(tabs)/forum/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { getMyChannels, getMessages, getMyProfile } from '@/lib/forum';
import type { ForumProfile } from '@/types/forum';
import { useForumStore } from '@/store/forumStore';
import { ChannelListItem } from '@/components/forum/ChannelListItem';
import { supabase } from '@/lib/supabase';
import type { Channel } from '@/types/forum';
import { FreundeTab } from './_components/FreundeTab';
import { CommunityTab } from './_components/CommunityTab';

type ForumTab = 'general' | 'freunde' | 'community';

const TABS: { key: ForumTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'freunde', label: 'Freunde' },
  { key: 'community', label: 'Community' },
];

export default function ForumPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ForumTab>('general');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<ForumProfile | null>(null);
  const unreadByChannel = useForumStore((s) => s.unreadByChannel);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const profile = await getMyProfile();
      setMyProfile(profile);
      const chs = await getMyChannels(user.id);
      const sorted = [
        ...chs.filter((c) => c.type === 'general'),
        ...chs.filter((c) => c.type === 'dm'),
        ...chs.filter((c) => c.type === 'group'),
      ];
      const enriched = await Promise.all(
        sorted.map(async (ch) => {
          const msgs = await getMessages(ch.id, 1);
          return { ...ch, lastMessage: msgs[0] ?? null };
        })
      );
      setChannels(enriched);
      setLoading(false);
    }
    void load();
  }, []);

  const generalChannel = channels.find((c) => c.type === 'general') ?? null;
  const dmAndGroupChannels = channels.filter((c) => c.type !== 'general');

  // Count unread for tab badges
  const generalUnread = generalChannel ? (unreadByChannel[generalChannel.id] ?? 0) : 0;
  const freundeUnread = dmAndGroupChannels.reduce((sum, ch) => sum + (unreadByChannel[ch.id] ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: colors.bgPrimary }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: `${spacing[4]} ${spacing[4]} 0`,
        flexShrink: 0,
      }}>
        <h1 style={{ fontFamily: 'var(--font-barlow)', fontSize: 28, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Forum
        </h1>
        <button
          onClick={() => router.push('/forum/new-group')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}40`,
            borderRadius: radius.full, padding: '7px 14px',
            color: colors.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Gruppe
        </button>
      </div>

      {/* Tab Bar */}
      <div data-tour="forum-tabs" style={{
        display: 'flex', borderBottom: `1px solid ${colors.border}`,
        padding: `${spacing[3]} ${spacing[4]} 0`,
        gap: spacing[2], flexShrink: 0,
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge =
            tab.key === 'general' && generalUnread > 0 ? generalUnread :
            tab.key === 'freunde' && freundeUnread > 0 ? freundeUnread : 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                position: 'relative',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: `${spacing[2]} ${spacing[3]}`,
                paddingBottom: spacing[3],
                color: isActive ? colors.accent : colors.textMuted,
                fontSize: 14, fontWeight: isActive ? 700 : 400,
                borderBottom: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: -2,
                  backgroundColor: colors.danger, borderRadius: '10px',
                  minWidth: 14, height: 14,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 3px',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'general' && (
          <div style={{ padding: spacing[4], display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {/* Coach Arved banner */}
            <div style={{
              backgroundColor: colors.accentBg,
              border: `1px solid ${colors.accent}33`,
              borderRadius: radius.md,
              padding: `${spacing[2]} ${spacing[3]}`,
              marginBottom: spacing[1],
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}>
              <span style={{ ...typography.bodySm, color: colors.accent, fontWeight: 700 }}>Coach Arved</span>
              <span style={{ ...typography.bodySm, color: colors.textMuted }}>ist im Forum aktiv — stell deine Fragen direkt hier.</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>Lädt...</div>
            ) : channels.length > 0 ? (
              channels.map((ch) => (
                <ChannelListItem
                  key={ch.id}
                  channel={ch}
                  unreadCount={unreadByChannel[ch.id] ?? 0}
                />
              ))
            ) : (
              <p style={{ ...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>
                Keine Chats verfügbar.
              </p>
            )}
          </div>
        )}
        {activeTab === 'freunde' && <FreundeTab userId={userId} />}
        {activeTab === 'community' && <CommunityTab userId={userId} myProfile={myProfile} />}
      </div>
    </motion.div>
  );
}
