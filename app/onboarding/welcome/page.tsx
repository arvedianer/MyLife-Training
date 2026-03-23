'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { colors, spacing, typography, radius } from '@/constants/tokens';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[6]} ${spacing[5]}`,
        gap: spacing[8],
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
          maxWidth: 400,
          width: '100%',
        }}
      >
        <h1 style={{ ...typography.h1, color: colors.textPrimary, margin: 0 }}>
          Hey. Ich bin Arved.
        </h1>
        <p
          style={{
            ...typography.bodyLg,
            color: colors.textSecondary,
            margin: 0,
          }}
        >
          Ich hab diese App gebaut weil alle anderen Geld kosten und keine davon
          wirklich optimal funktioniert.
        </p>
        <p
          style={{
            ...typography.bodyLg,
            color: colors.textMuted,
            margin: 0,
          }}
        >
          2 Minuten — dann steht dein Plan.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <button
          onClick={() => router.push('/onboarding/name')}
          style={{
            width: '100%',
            backgroundColor: colors.accent,
            color: colors.bgPrimary,
            border: 'none',
            borderRadius: radius.lg,
            padding: spacing[4],
            cursor: 'pointer',
            ...typography.h3,
            transition: 'background-color 200ms ease-out',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor =
              colors.accentDark;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor =
              colors.accent;
          }}
        >
          Los geht's →
        </button>
      </motion.div>
    </div>
  );
}
