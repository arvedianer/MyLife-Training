'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { useTourStore } from '@/store/tourStore';
import { usePlanStore } from '@/store/planStore';
import { colors, spacing, typography, radius } from '@/constants/tokens';
import { CheckCircle2, Dumbbell, Calendar, Target, ChevronRight } from 'lucide-react';

export default function DonePage() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const startTour = useTourStore((s) => s.startTour);
  const activeSplit = usePlanStore((s) => s.getActiveSplit());

  const goalLabels: Record<string, string> = {
    muscle: 'Muskelaufbau',
    strength: 'Kraft aufbauen',
    fat_loss: 'Abnehmen',
    endurance: 'Ausdauer verbessern',
    general: 'Fit bleiben',
  };

  const levelLabels: Record<string, string> = {
    beginner: 'Einsteiger',
    intermediate: 'Fortgeschritten',
    advanced: 'Profi',
  };

  const handleStartTour = () => {
    if (!profile) return;
    completeOnboarding(profile);
    startTour();
    router.replace('/');
  };

  const handleSkipTour = () => {
    if (!profile) return;
    completeOnboarding(profile);
    router.replace('/');
  };

  const stats = [
    {
      icon: Calendar,
      label: 'Trainingstage',
      value: `${profile?.trainingDays ?? 3}× / Woche`,
    },
    {
      icon: Target,
      label: 'Ziel',
      value: goalLabels[profile?.goal ?? ''] ?? profile?.goal ?? '—',
    },
    {
      icon: Dumbbell,
      label: 'Level',
      value: levelLabels[profile?.level ?? ''] ?? profile?.level ?? '—',
    },
  ];

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      padding: `${spacing[8]} ${spacing[5]} ${spacing[6]}`,
      maxWidth: 480,
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Check animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        style={{ marginBottom: spacing[6] }}
      >
        <CheckCircle2 size={52} color={colors.accent} />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ marginBottom: spacing[8] }}
      >
        <h1 style={{ ...typography.h1, color: colors.textPrimary, margin: 0, marginBottom: spacing[2] }}>
          {profile?.name ? `Alles klar, ${profile.name}.` : 'Alles klar.'}
        </h1>
        {activeSplit && (
          <p style={{ ...typography.bodyLg, color: colors.accent, margin: 0 }}>
            {activeSplit.name} — bereit zum Start.
          </p>
        )}
      </motion.div>

      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
          marginBottom: spacing[8],
          flex: 1,
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              backgroundColor: colors.bgCard,
              borderRadius: radius.lg,
              padding: `${spacing[3]} ${spacing[4]}`,
              border: `1px solid ${colors.border}`,
            }}
          >
            <stat.icon size={20} color={colors.accent} />
            <div>
              <div style={{ ...typography.label, color: colors.textMuted }}>{stat.label}</div>
              <div style={{ ...typography.bodyLg, color: colors.textPrimary }}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}
      >
        <button
          onClick={handleStartTour}
          style={{
            width: '100%',
            backgroundColor: colors.accent,
            color: colors.bgPrimary,
            border: 'none',
            borderRadius: radius.lg,
            padding: spacing[4],
            cursor: 'pointer',
            ...typography.h3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
          }}
        >
          App kennenlernen <ChevronRight size={18} />
        </button>
        <button
          onClick={handleSkipTour}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: colors.textMuted,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            padding: spacing[3],
            cursor: 'pointer',
            ...typography.body,
          }}
        >
          Direkt loslegen
        </button>
      </motion.div>
    </div>
  );
}
