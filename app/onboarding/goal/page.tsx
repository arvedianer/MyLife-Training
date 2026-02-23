'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Dumbbell, Flame, Heart, Wind } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/store/userStore';
import type { WorkoutGoal } from '@/types/workout';

const goals: { id: WorkoutGoal; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'muskelaufbau',  label: 'Muskelaufbau',  description: 'Muskeln aufbauen & Definition verbessern', icon: Dumbbell },
  { id: 'kraft',         label: 'Kraft',          description: 'Maximalstärke & Kraftwerte steigern',      icon: Target   },
  { id: 'abnehmen',      label: 'Abnehmen',       description: 'Körperfett reduzieren & fit werden',       icon: Flame    },
  { id: 'fitness',       label: 'Fitness',        description: 'Allgemeine Fitness & Gesundheit',          icon: Heart    },
  { id: 'ausdauer',      label: 'Ausdauer',       description: 'Kondition & Cardio verbessern',            icon: Wind     },
];

export default function GoalPage() {
  const router = useRouter();
  const { profile, setOnboardingStep } = useUserStore();
  const [selected, setSelected] = useState<WorkoutGoal | null>(
    (profile?.goal as WorkoutGoal) ?? null
  );

  const handleContinue = () => {
    if (!selected) return;
    useUserStore.setState((s) => ({
      profile: { ...s.profile, goal: selected } as typeof s.profile,
      onboardingStep: 2,
    }));
    setOnboardingStep(2);
    router.push('/onboarding/level');
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
          SCHRITT 1 VON 5
        </span>
        <ProgressBar progress={0.2} />
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Was ist dein Ziel?
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Wir passen deinen Trainingsplan genau darauf an.
        </p>
      </div>

      {/* Goal Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selected === goal.id;
          return (
            <button
              key={goal.id}
              onClick={() => setSelected(goal.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                padding: spacing[4],
                backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                borderRadius: radius.lg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: radius.md,
                  backgroundColor: isSelected ? `${colors.accent}20` : colors.bgHighest,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 0.15s',
                }}
              >
                <Icon size={22} color={isSelected ? colors.accent : colors.textMuted} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' }}>
                  {goal.label}
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>
                  {goal.description}
                </div>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                  backgroundColor: isSelected ? colors.accent : 'transparent',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Continue */}
      <div style={{ marginTop: 'auto' }}>
        <Button
          fullWidth
          size="lg"
          disabled={!selected}
          onClick={handleContinue}
        >
          Weiter
        </Button>
      </div>
    </div>
  );
}
