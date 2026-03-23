'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { useTourStore } from '@/store/tourStore';
import { usePlanStore } from '@/store/planStore';
import { colors, spacing, typography, radius } from '@/constants/tokens';

export default function DonePage() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const startTour = useTourStore((s) => s.startTour);
  const activeSplit = usePlanStore((s) => s.getActiveSplit());

  const handleStart = () => {
    completeOnboarding(profile!);  // sets onboardingCompleted: true
    startTour();                    // sets tourActive: true, tourStep: 0
    router.replace('/');            // navigate to dashboard (tour will take over)
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[6]} ${spacing[5]}`,
      gap: spacing[8],
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[4] }}
      >
        <h1 style={{ ...typography.h1, color: colors.textPrimary, margin: 0 }}>
          Dein Plan steht{profile?.name ? `, ${profile.name}` : ''}.
        </h1>
        {activeSplit && (
          <p style={{ ...typography.bodyLg, color: colors.accent, margin: 0 }}>
            {activeSplit.name} — {profile?.trainingDays ?? 3} Tage pro Woche.
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <button
          onClick={handleStart}
          style={{
            width: '100%',
            backgroundColor: colors.accent,
            color: colors.bgPrimary,
            border: 'none',
            borderRadius: radius.lg,
            padding: spacing[4],
            cursor: 'pointer',
            ...typography.h3,
          }}
        >
          App kennenlernen →
        </button>
      </motion.div>
    </div>
  );
}
