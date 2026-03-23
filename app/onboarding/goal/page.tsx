'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Dumbbell, TrendingDown, Activity, Target } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useUserStore } from '@/store/userStore';
import { GOAL_THEMES } from '@/utils/theme';
import type { WorkoutGoal } from '@/types/workout';

const GOALS: { id: WorkoutGoal; icon: React.ElementType; label: string; sub: string }[] = [
  { id: 'kraft',        icon: Zap,         label: 'Kraft aufbauen',  sub: 'Schwerer heben, Bestleistungen brechen' },
  { id: 'muskelaufbau', icon: Dumbbell,    label: 'Muskeln aufbauen', sub: 'Mehr Masse, bessere Optik' },
  { id: 'abnehmen',     icon: TrendingDown, label: 'Abnehmen',        sub: 'Fett verlieren, Form halten' },
  { id: 'fitness',      icon: Activity,    label: 'Fit bleiben',      sub: 'Energie, Gesundheit, Ausdauer' },
  { id: 'alles',        icon: Target,      label: 'Alles davon',      sub: 'Rundum besser werden' },
];

function GoalPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';

  const updateProfile = useUserStore((s) => s.updateProfile);
  const profile = useUserStore((s) => s.profile);

  const initialSelected: WorkoutGoal[] = [
    ...(profile?.goal ? [profile.goal as WorkoutGoal] : []),
    ...(profile?.secondaryGoal ? [profile.secondaryGoal] : []),
  ];

  const [selected, setSelected] = useState<WorkoutGoal[]>(initialSelected);

  const toggle = (g: WorkoutGoal) => {
    setSelected((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length >= 2) return [prev[0], g];
      return [...prev, g];
    });
  };

  const handleContinue = () => {
    if (selected.length === 0) return;
    updateProfile({
      goal: selected[0],
      secondaryGoal: selected[1] ?? null,
    });
    router.push(isEdit ? '/onboarding/level?edit=true' : '/onboarding/level');
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
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ProgressDots total={6} current={3} />
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Was ist dein Ziel?
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Wähle bis zu 2 Ziele. Wir passen deinen Trainingsplan genau darauf an.
        </p>
      </div>

      {/* Goal Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selected.includes(goal.id);
          const isPrimary = selected[0] === goal.id;
          const goalTheme = GOAL_THEMES[goal.id] ?? GOAL_THEMES['fitness'];
          const accentColor = isSelected ? goalTheme.accent : colors.accent;
          const accentBgColor = isSelected ? goalTheme.accentBg : colors.accentBg;

          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                padding: spacing[4],
                backgroundColor: isSelected ? accentBgColor : colors.bgCard,
                border: `1px solid ${isSelected ? accentColor : colors.border}`,
                borderRadius: radius.lg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: radius.md,
                  backgroundColor: isSelected ? `${accentColor}20` : colors.bgHighest,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background-color 0.15s',
                }}
              >
                <Icon size={22} color={isSelected ? accentColor : colors.textMuted} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.bodyLg, color: colors.textPrimary, fontWeight: '600' }}>
                  {goal.label}
                  {isPrimary && selected.length >= 2 && (
                    <span
                      style={{
                        ...typography.label,
                        color: accentColor,
                        marginLeft: spacing[2],
                        opacity: 0.8,
                      }}
                    >
                      Primär
                    </span>
                  )}
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>
                  {goal.sub}
                </div>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? accentColor : colors.border}`,
                  backgroundColor: isSelected ? accentColor : 'transparent',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Actions */}
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
        <Button fullWidth size="lg" disabled={selected.length === 0} onClick={handleContinue}>
          Weiter
        </Button>
      </div>
    </div>
  );
}

export default function GoalPage() {
  return (
    <Suspense>
      <GoalPageInner />
    </Suspense>
  );
}
