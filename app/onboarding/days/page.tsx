'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/store/userStore';
import type { TrainingDays } from '@/types/workout';

const dayOptions: { days: TrainingDays; label: string; description: string }[] = [
  { days: 2, label: '2 Tage', description: 'Minimal — Ganzkörper 2x/Woche' },
  { days: 3, label: '3 Tage', description: 'Ideal — Ganzkörper oder Upper/Lower' },
  { days: 4, label: '4 Tage', description: 'Optimal — Upper/Lower Split' },
  { days: 5, label: '5 Tage', description: 'Intensiv — PPL + Extra' },
  { days: 6, label: '6 Tage', description: 'Fortgeschritten — Push/Pull/Legs 2x' },
];

export default function DaysPage() {
  const router = useRouter();
  const { profile, setOnboardingStep } = useUserStore();
  const [selected, setSelected] = useState<TrainingDays | null>(
    (profile?.trainingDays as TrainingDays) ?? null
  );

  const handleContinue = () => {
    if (!selected) return;
    useUserStore.setState((s) => ({
      profile: { ...s.profile, trainingDays: selected } as typeof s.profile,
    }));
    setOnboardingStep(5);
    router.push('/onboarding/equipment');
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: spacing[6],
        paddingTop: `calc(${spacing[10]} + env(safe-area-inset-top))`,
        gap: spacing[6],
      }}
    >
      {/* Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <span style={{ ...typography.label, color: colors.textMuted }}>
          SCHRITT 5 VON 7
        </span>
        <ProgressBar progress={5 / 7} />
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Wie viele Tage pro Woche?
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Realistisch planen — Konstanz schlägt Intensität.
        </p>
      </div>

      {/* Day Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        {dayOptions.map((option) => {
          const isSelected = selected === option.days;
          return (
            <button
              key={option.days}
              onClick={() => setSelected(option.days)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[4]} ${spacing[5]}`,
                backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                borderRadius: radius.lg,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' }}>
                  {option.label}
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                  {option.description}
                </div>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                  backgroundColor: isSelected ? colors.accent : 'transparent',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              />
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <button
          onClick={() => router.back()}
          style={{
            ...typography.body,
            color: colors.textMuted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          ← Zurück
        </button>
        <Button fullWidth size="lg" disabled={!selected} onClick={handleContinue}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
