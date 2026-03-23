'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography } from '@/constants/tokens';

const GOAL_LABELS: Record<string, string> = {
  kraft: 'Kraft aufbauen', muskelaufbau: 'Muskeln aufbauen',
  abnehmen: 'Abnehmen', fitness: 'Fit bleiben', alles: 'Alles', ausdauer: 'Ausdauer',
};
const EQUIPMENT_LABELS: Record<string, string> = {
  vollausgestattet: 'Fitnessstudio', kurzhanteln: 'Zuhause + Equipment',
  eigengewicht: 'Bodyweight', minimalistisch: 'Minimalistisch',
};

export default function GeneratingPage() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const [step, setStep] = useState(0);

  const dayCount = profile?.trainingWeekdays?.length ?? profile?.trainingDays ?? 3;
  const goalLabel = GOAL_LABELS[profile?.goal ?? 'fitness'] ?? profile?.goal ?? 'Ziel';
  const equipLabel = EQUIPMENT_LABELS[profile?.equipment ?? 'vollausgestattet'] ?? profile?.equipment ?? 'Equipment';

  const items = [
    '✓ Körperdaten analysiert',
    `✓ Ziel: ${goalLabel}`,
    `✓ ${dayCount} Trainingstage geplant`,
    `✓ Equipment: ${equipLabel}`,
    '⏳ Split wird berechnet...',
    '✓ Plan steht.',
  ];

  useEffect(() => {
    if (step < items.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 400);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => router.push('/onboarding/done'), 800);
      return () => clearTimeout(t);
    }
  }, [step, items.length, router]);

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[6]} ${spacing[5]}`,
    }}>
      <div style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <AnimatePresence>
          {items.slice(0, step).map((item, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                ...typography.bodyLg,
                color: i === items.length - 1 ? colors.accent : colors.textSecondary,
                margin: 0,
              }}
            >
              {item}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
