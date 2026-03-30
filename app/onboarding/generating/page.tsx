'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography, radius } from '@/constants/tokens';

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

  const items = useMemo(() => [
    { text: 'Körperdaten analysiert', done: true },
    { text: `Ziel: ${goalLabel}`, done: true },
    { text: `${dayCount} Trainingstage geplant`, done: true },
    { text: `Equipment: ${equipLabel}`, done: true },
    { text: 'Split wird berechnet...', done: false },
    { text: 'Plan steht.', done: true, accent: true },
  ], [goalLabel, dayCount, equipLabel]);

  useEffect(() => {
    if (step < items.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 420);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => router.push('/onboarding/done'), 700);
      return () => clearTimeout(t);
    }
  }, [step, items, router]);

  const progress = Math.round((step / items.length) * 100);

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      background: `radial-gradient(ellipse at 50% 80%, ${colors.accent}10 0%, transparent 55%), ${colors.bgPrimary}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${spacing[6]} ${spacing[5]}`,
    }}>
      <div style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[5] }}>

        {/* Header */}
        <div>
          <span style={{
            ...typography.label,
            color: colors.accent,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Plan wird erstellt
          </span>
          <h1 style={{
            fontFamily: 'var(--font-barlow)',
            fontSize: 40,
            fontWeight: 800,
            lineHeight: 1,
            color: colors.textPrimary,
            margin: `${spacing[2]} 0 0`,
          }}>
            Einen Moment.
          </h1>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 3,
          backgroundColor: colors.bgHighest,
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ height: '100%', backgroundColor: colors.accent, borderRadius: 2 }}
          />
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          <AnimatePresence>
            {items.slice(0, step).map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: item.done ? `${colors.accent}20` : `${colors.bgHighest}`,
                  border: `1px solid ${item.done ? colors.accent : colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.done && (
                    <span style={{ fontSize: 10, color: colors.accent, lineHeight: 1 }}>✓</span>
                  )}
                  {!item.done && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${colors.accent}`, borderTopColor: 'transparent' }}
                    />
                  )}
                </div>
                <span style={{
                  ...typography.body,
                  color: item.accent ? colors.accent : item.done ? colors.textSecondary : colors.textMuted,
                  fontWeight: item.accent ? 700 : 400,
                  fontSize: item.accent ? 16 : 14,
                }}>
                  {item.text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
