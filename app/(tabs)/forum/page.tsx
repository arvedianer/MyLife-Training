'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { getMyChannels } from '@/lib/forum';
import { useForumStore } from '@/store/forumStore';
import { ChannelListItem } from '@/components/forum/ChannelListItem';
import { supabase } from '@/lib/supabase';
import type { Channel } from '@/types/forum';

export default function ForumPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadByChannel = useForumStore((s) => s.unreadByChannel);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      getMyChannels(user.id).then((chs) => {
        const sorted = [
          ...chs.filter((c) => c.type === 'general'),
          ...chs.filter((c) => c.type === 'dm'),
          ...chs.filter((c) => c.type === 'group'),
        ];
        setChannels(sorted);
        setLoading(false);
      });
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ padding: spacing[4], maxWidth: 480, margin: '0 auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[5] }}>
        <h1 style={{ fontFamily: 'var(--font-barlow)', fontSize: 28, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Forum
        </h1>
        <button
          onClick={() => router.push('/forum/new-group')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: colors.accentBg, border: `1px solid ${colors.accent}40`,
            borderRadius: radius.full, padding: '8px 14px',
            color: colors.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Gruppe
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: colors.textMuted, paddingTop: 40 }}>Lädt...</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {channels.map((ch) => (
          <ChannelListItem key={ch.id} channel={ch} unreadCount={unreadByChannel[ch.id] ?? 0} />
        ))}
      </div>

      {!loading && channels.length <= 1 && (
        <p style={{ ...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>
          Noch keine Chats — schreib im General oder starte eine Direktnachricht über ein Profil.
        </p>
      )}
    </motion.div>
  );
}
