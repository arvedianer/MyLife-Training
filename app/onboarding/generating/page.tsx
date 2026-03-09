'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';
import { useUserStore } from '@/store/userStore';
import { usePlanStore } from '@/store/planStore';
import { generateSplitForUser } from '@/constants/splits';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/user';

const steps = [
  'Ziele analysieren...',
  'Trainingsplan erstellen...',
  'Übungen auswählen...',
  'Progressive Overload konfigurieren...',
  'Plan ist bereit!',
];

export default function GeneratingPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const firstName = profile?.name?.split(' ')[0];

  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Simulierter Plan-Generierungsprozess
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= steps.length - 1) {
        clearInterval(interval);
        setDone(true);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!done || !profile) return;

    // Store-Methoden imperativ aufrufen (vermeidet Endlos-Loop durch instabile Referenzen)
    const fullProfile: UserProfile = {
      name: profile.name,
      goal: profile.goal ?? 'muskelaufbau',
      level: profile.level ?? 'anfaenger',
      trainingDays: profile.trainingDays ?? 3,
      equipment: profile.equipment ?? 'vollausgestattet',
      weightUnit: 'kg',
      createdAt: Date.now(),
    };

    const split = generateSplitForUser(
      fullProfile.trainingDays,
      fullProfile.level,
      fullProfile.goal,
      fullProfile.equipment
    );

    usePlanStore.getState().addSplit(split);
    useUserStore.getState().completeOnboarding(fullProfile);

    // Save onboarding data to Supabase profiles table (best-effort, fire-and-forget)
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        void supabase
          .from('profiles')
          .update({
            goal: fullProfile.goal,
            level: fullProfile.level,
            training_days: fullProfile.trainingDays,
            equipment: fullProfile.equipment,
          })
          .eq('id', user.id);
      }
    });

    const timeout = setTimeout(() => {
      router.replace('/dashboard');
    }, 1200);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[6],
        gap: spacing[8],
      }}
    >
      {/* Logo / Brand */}
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            ...typography.display,
            color: colors.accent,
            letterSpacing: '-0.02em',
          }}
        >
          MY LIFE
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[2] }}>
          {done && firstName ? `Bereit, ${firstName}!` : 'Training'}
        </p>
      </div>

      {/* Steps */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                opacity: index > currentStep ? 0.3 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={22} color={colors.success} />
                ) : isCurrent ? (
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${colors.accent}`,
                      borderTopColor: 'transparent',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: colors.bgHighest,
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  ...typography.body,
                  color: isCompleted
                    ? colors.success
                    : isCurrent
                    ? colors.textPrimary
                    : colors.textDisabled,
                  transition: 'color 0.3s',
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
