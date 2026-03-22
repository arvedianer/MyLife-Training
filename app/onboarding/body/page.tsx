'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/store/userStore';

export default function BodyPage() {
  const router = useRouter();
  const { profile } = useUserStore();

  const [age, setAge] = useState<string>(
    profile?.age !== undefined ? String(profile.age) : ''
  );
  const [bodyWeight, setBodyWeight] = useState<string>(
    profile?.bodyWeight !== undefined ? String(profile.bodyWeight) : ''
  );
  const [height, setHeight] = useState<string>(
    profile?.height !== undefined ? String(profile.height) : ''
  );

  const handleContinue = () => {
    const parsedAge = age.trim() !== '' ? Number(age) : undefined;
    const parsedBodyWeight = bodyWeight.trim() !== '' ? Number(bodyWeight) : undefined;
    const parsedHeight = height.trim() !== '' ? Number(height) : undefined;

    useUserStore.setState((s) => ({
      profile: {
        ...s.profile,
        ...(parsedAge !== undefined && { age: parsedAge }),
        ...(parsedBodyWeight !== undefined && { bodyWeight: parsedBodyWeight }),
        ...(parsedHeight !== undefined && { height: parsedHeight }),
      } as typeof s.profile,
      onboardingStep: 3,
    }));
    router.push('/onboarding/goal');
  };

  const handleSkip = () => {
    useUserStore.setState({ onboardingStep: 3 });
    router.push('/onboarding/goal');
  };

  const inputStyle = (hasValue: boolean): React.CSSProperties => ({
    width: '100%',
    padding: `${spacing[4]} ${spacing[5]}`,
    backgroundColor: colors.bgCard,
    border: `1px solid ${hasValue ? colors.accent : colors.border}`,
    borderRadius: radius.lg,
    ...typography.bodyLg,
    color: colors.textPrimary,
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  });

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
          SCHRITT 2 VON 7
        </span>
        <ProgressBar progress={2 / 7} />
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Deine Körperdaten
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Optional — hilft uns, deinen Fortschritt besser zu messen.
        </p>
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        {/* Age */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          <span style={{ ...typography.label, color: colors.textMuted }}>
            ALTER (JAHRE)
          </span>
          <input
            type="number"
            placeholder="z. B. 28"
            value={age}
            min={10}
            max={99}
            onChange={(e) => setAge(e.target.value)}
            style={inputStyle(age.trim() !== '')}
          />
        </div>

        {/* Body Weight */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          <span style={{ ...typography.label, color: colors.textMuted }}>
            KÖRPERGEWICHT (KG)
          </span>
          <input
            type="number"
            placeholder="z. B. 80"
            value={bodyWeight}
            min={30}
            max={300}
            step={0.1}
            onChange={(e) => setBodyWeight(e.target.value)}
            style={inputStyle(bodyWeight.trim() !== '')}
          />
        </div>

        {/* Height */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          <span style={{ ...typography.label, color: colors.textMuted }}>
            KÖRPERGRÖSSE (CM)
          </span>
          <input
            type="number"
            placeholder="z. B. 178"
            value={height}
            min={100}
            max={250}
            onChange={(e) => setHeight(e.target.value)}
            style={inputStyle(height.trim() !== '')}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <button
          onClick={handleSkip}
          style={{
            ...typography.body,
            color: colors.textMuted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Überspringen
        </button>
        <Button fullWidth size="lg" onClick={handleContinue}>
          Weiter
        </Button>
      </div>
    </div>
  );
}
