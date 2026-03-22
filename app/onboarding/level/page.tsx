'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sprout, TrendingUp, Trophy } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/store/userStore';
import type { TrainingLevel } from '@/types/workout';

const levels: { id: TrainingLevel; label: string; description: string; detail: string; icon: React.ElementType }[] = [
  {
    id: 'anfaenger',
    label: 'Anfänger',
    description: 'Weniger als 1 Jahr Erfahrung',
    detail: 'Wir starten mit den Grundübungen und bauen Schritt für Schritt auf.',
    icon: Sprout,
  },
  {
    id: 'fortgeschritten',
    label: 'Fortgeschritten',
    description: '1–3 Jahre Erfahrung',
    detail: 'Du kennst die Basics und willst systematisch vorankommen.',
    icon: TrendingUp,
  },
  {
    id: 'profi',
    label: 'Profi',
    description: 'Über 3 Jahre Erfahrung',
    detail: 'Du trainierst seit Jahren konsequent und kennst deinen Körper.',
    icon: Trophy,
  },
];

export default function LevelPage() {
  const router = useRouter();
  const { profile, setOnboardingStep } = useUserStore();
  const [selected, setSelected] = useState<TrainingLevel | null>(
    (profile?.level as TrainingLevel) ?? null
  );

  const handleContinue = () => {
    if (!selected) return;
    useUserStore.setState((s) => ({
      profile: { ...s.profile, level: selected } as typeof s.profile,
    }));
    setOnboardingStep(4);
    router.push('/onboarding/days');
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
          SCHRITT 4 VON 7
        </span>
        <ProgressBar progress={4 / 7} />
      </div>

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
        {levels.map((level) => {
          const Icon = level.icon;
          const isSelected = selected === level.id;
          return (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[2],
                padding: spacing[4],
                backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                borderRadius: radius.lg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Icon size={20} color={isSelected ? colors.accent : colors.textMuted} />
                <div>
                  <div style={{ ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' }}>
                    {level.label}
                  </div>
                  <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                    {level.description}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: 'auto',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                    backgroundColor: isSelected ? colors.accent : 'transparent',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                />
              </div>
              {isSelected && (
                <p style={{ ...typography.bodySm, color: colors.accent, marginLeft: '32px' }}>
                  {level.detail}
                </p>
              )}
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
