'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { colors, spacing, typography, radius } from '@/constants/tokens';
import type { TrainingDays } from '@/types/workout';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getFeedback(count: number, goal: string): string {
  if (count === 0) return 'Wähle mindestens 2 Tage.';
  if (count === 1) return '1 Tag — wähle noch einen weiteren.';
  if (count === 2) return '2 Tage — Minimalismus. Funktioniert mit dem richtigen Plan.';
  if (count === 3) return `3 Tage — das ideale Volumen${goal ? ' für dein Ziel' : ''}.`;
  if (count === 4) return '4 Tage — solid. Genug Regeneration zwischen den Einheiten.';
  return `${count} Tage — ambitioniert. Schlaf und Ernährung nicht vergessen.`;
}

function DaysInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const updateProfile = useUserStore((s) => s.updateProfile);
  const goal = useUserStore((s) => s.profile.goal);
  const [selected, setSelected] = useState<number[]>([]); // [0=Mo, ..., 6=So]

  const toggle = (i: number) => {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
    );
  };

  const canContinue = selected.length >= 2;

  const handleContinue = () => {
    const sorted = [...selected].sort((a, b) => a - b);
    updateProfile({
      trainingWeekdays: sorted,
      trainingDays: Math.min(sorted.length, 6) as TrainingDays,
    });
    router.push(isEdit ? '/onboarding/equipment?edit=true' : '/onboarding/equipment');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: colors.bgPrimary,
      display: 'flex',
      flexDirection: 'column',
      padding: `${spacing[6]} ${spacing[5]}`,
      gap: spacing[6],
    }}>
      <ProgressDots total={6} current={5} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ display: 'flex', flexDirection: 'column', gap: spacing[5], flex: 1 }}
      >
        <h1 style={{ ...typography.h1, color: colors.textPrimary, margin: 0 }}>
          Wann kannst du trainieren?
        </h1>

        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
          {WEEKDAYS.map((day, i) => {
            const active = selected.includes(i);
            return (
              <button
                key={day}
                onClick={() => toggle(i)}
                style={{
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderRadius: radius.md,
                  border: `1px solid ${active ? colors.accent : colors.border}`,
                  backgroundColor: active ? colors.accentBg : colors.bgCard,
                  color: active ? colors.accent : colors.textMuted,
                  cursor: 'pointer',
                  ...typography.label,
                  transition: 'all 0.15s ease',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        <p style={{ ...typography.body, color: colors.textMuted, margin: 0 }}>
          {getFeedback(selected.length, goal ?? '')}
        </p>
      </motion.div>

      <button
        disabled={!canContinue}
        onClick={handleContinue}
        style={{
          width: '100%',
          backgroundColor: canContinue ? colors.accent : colors.bgHighest,
          color: canContinue ? colors.bgPrimary : colors.textDisabled,
          border: 'none',
          borderRadius: radius.lg,
          padding: spacing[4],
          cursor: canContinue ? 'pointer' : 'not-allowed',
          ...typography.h3,
        }}
      >
        Weiter
      </button>
    </div>
  );
}

export default function DaysPage() {
  return (
    <Suspense>
      <DaysInner />
    </Suspense>
  );
}
