'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, MessageCircle } from 'lucide-react';
import { colors, typography, radius, spacing } from '@/constants/tokens';
import type { ForumProfile } from '@/types/forum';
import { sendFriendRequest, createDMChannel, updateProfile } from '@/lib/forum';
import { displayUsername } from '@/components/forum/CheffeBadge';
import { useRouter } from 'next/navigation';

interface ProfileSheetProps {
  profile: ForumProfile;
  currentUserId: string;
  onClose: () => void;
  isFriend?: boolean;
}

export function ProfileSheet({
  profile,
  currentUserId,
  onClose,
  isFriend = false,
}: ProfileSheetProps) {
  const router = useRouter();
  const [friendSent, setFriendSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState(profile.username);
  const [newColor, setNewColor] = useState(profile.avatarColor);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isOwnProfile = profile.id === currentUserId;

  const COLOR_PRESETS = [
    '#4DFFED', // accent cyan
    '#FFD700', // gold (cheffe color)
    '#FF6B35', // orange
    '#FF4081', // pink
    '#9C27B0', // purple
    '#4CAF50', // green
    '#FF3B30', // red
    '#FFFFFF', // white
  ];

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      await sendFriendRequest(currentUserId, profile.id);
      setFriendSent(true);
    } catch {
      // Already exists or other error — ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDM = async () => {
    setLoading(true);
    try {
      const channelId = await createDMChannel(currentUserId, profile.id);
      onClose();
      router.push(`/forum/${channelId}`);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmed = newUsername.trim();
    if (trimmed.length < 3) { setSaveError('Mindestens 3 Zeichen'); return; }
    if (trimmed.length > 20) { setSaveError('Maximal 20 Zeichen'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setSaveError('Nur Buchstaben, Zahlen und _ erlaubt'); return; }

    setSaving(true);
    setSaveError(null);
    const { error } = await updateProfile(profile.id, {
      username: trimmed,
      avatarColor: newColor,
    });
    setSaving(false);
    if (error) {
      setSaveError(error);
    } else {
      setEditMode(false);
    }
  };

  const tierLabel =
    profile.athleteScore >= 800
      ? 'Elite'
      : profile.athleteScore >= 600
        ? 'Athlet'
        : profile.athleteScore >= 400
          ? 'Fortgeschrittener'
          : profile.athleteScore >= 200
            ? 'Aufsteiger'
            : 'Einsteiger';

  const sheetRadius = radius['2xl'];

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 100,
        }}
      />
      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 101,
          backgroundColor: colors.bgCard,
          borderRadius: `${sheetRadius} ${sheetRadius} 0 0`,
          padding: spacing[5],
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: spacing[4],
            right: spacing[4],
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={20} color={colors.textMuted} />
        </button>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: spacing[4],
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: editMode ? newColor : profile.avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: colors.bgPrimary,
              marginBottom: spacing[2],
            }}
          >
            {profile.username[0].toUpperCase()}
          </div>
          <div style={{ ...typography.h3, color: profile.role === 'cheffe' ? '#FFD700' : colors.textPrimary }}>
            {displayUsername(profile.username, profile.role)}
          </div>
          <div
            style={{
              ...typography.bodySm,
              color: colors.textMuted,
              marginTop: 2,
            }}
          >
            {tierLabel} · {profile.athleteScore} Punkte · {profile.streak}{' '}
            Tage Streak
          </div>

          {isOwnProfile && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{
                marginTop: spacing[3],
                padding: `${spacing[2]} ${spacing[4]}`,
                backgroundColor: colors.bgHighest,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.full,
                color: colors.textMuted,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ✏️ Bearbeiten
            </button>
          )}
        </div>

        {editMode && (
          <div style={{ width: '100%', padding: spacing[4] }}>
            {/* Username input */}
            <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[1] }}>
              USERNAME
            </label>
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              maxLength={20}
              style={{
                width: '100%',
                backgroundColor: colors.bgHighest,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                padding: `${spacing[2]} ${spacing[3]}`,
                color: colors.textPrimary,
                fontSize: 14,
                outline: 'none',
                marginBottom: spacing[3],
                boxSizing: 'border-box' as const,
              }}
            />

            {/* Color picker */}
            <label style={{ ...typography.label, color: colors.textMuted, display: 'block', marginBottom: spacing[2] }}>
              AVATAR-FARBE
            </label>
            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', marginBottom: spacing[4] }}>
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.full,
                    backgroundColor: color,
                    border: newColor === color ? '3px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    outline: newColor === color ? `2px solid ${colors.accent}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>

            {saveError && (
              <p style={{ ...typography.bodySm, color: colors.danger, marginBottom: spacing[2] }}>{saveError}</p>
            )}

            <div style={{ display: 'flex', gap: spacing[2] }}>
              <button
                onClick={() => { setEditMode(false); setSaveError(null); }}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  backgroundColor: colors.bgHighest,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.full,
                  color: colors.textMuted,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || newUsername.trim().length < 3}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  backgroundColor: newUsername.trim().length >= 3 ? colors.accent : colors.bgHighest,
                  border: 'none',
                  borderRadius: radius.full,
                  color: newUsername.trim().length >= 3 ? colors.bgPrimary : colors.textMuted,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        )}

        {profile.id !== currentUserId && (
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <button
              onClick={handleAddFriend}
              disabled={isFriend || friendSent || loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: spacing[3],
                borderRadius: radius.xl,
                backgroundColor:
                  isFriend || friendSent ? colors.bgHighest : colors.accentBg,
                border: `1px solid ${
                  isFriend || friendSent
                    ? colors.border
                    : colors.accent + '40'
                }`,
                color:
                  isFriend || friendSent ? colors.textMuted : colors.accent,
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  isFriend || friendSent ? 'default' : 'pointer',
              }}
            >
              <UserPlus size={16} />
              {isFriend
                ? 'Befreundet'
                : friendSent
                  ? 'Anfrage gesendet'
                  : 'Freund hinzufügen'}
            </button>
            <button
              onClick={handleDM}
              disabled={loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: spacing[3],
                borderRadius: radius.xl,
                backgroundColor: colors.bgHighest,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <MessageCircle size={16} />
              Nachricht
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
