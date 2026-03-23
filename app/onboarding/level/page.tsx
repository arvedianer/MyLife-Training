'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useUserStore } from '@/store/userStore';
import type { TrainingLevel } from '@/types/workout';

const LEVELS: { id: TrainingLevel; label: string; sub: string }[] = [
  { id: 'anfaenger',     label: 'Gerade gestartet',       sub: 'Weniger als 6 Monate' },
  { id: 'fortgeschritten', label: 'Ich kenn mich aus',    sub: '6 Monate bis 2 Jahre' },
  { id: 'profi',         label: 'Ich weiß was ich tue',   sub: '2 bis 4 Jahre' },
  { id: 'experte',       label: 'Ich trainiere schon lang', sub: '4+ Jahre, ich hab einen Plan' },
];

function LevelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, setOnboardingStep, updateProfile } = useUserStore();
  const [selected, setSelected] = useState<TrainingLevel | null>(
    (profile?.level as TrainingLevel) ?? null
  );

  const handleContinue = () => {
    if (!selected) return;
    updateProfile({ level: selected });
    setOnboardingStep(4);
    const editParam = searchParams.get('edit');
    const target = editParam === 'true'
      ? '/onboarding/plan-preview?edit=true'
      : '/onboarding/plan-preview';
    router.push(target);
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
      <ProgressDots total={6} current={4} />

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Dein Erfahrungslevel?
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Sei ehrlich — das hilft uns, den richtigen Plan zu erstellen.
        </p>
      </div>

      {/* Level Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {LEVELS.map((level) => {
          const isSelected = selected === level.id;
          return (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: spacing[4],
                backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                borderRadius: radius.lg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' }}>
                  {level.label}
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                  {level.sub}
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

export default function LevelPage() {
  return (
    <Suspense>
      <LevelContent />
    </Suspense>
  );
}
