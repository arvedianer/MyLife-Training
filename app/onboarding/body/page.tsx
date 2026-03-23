'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useUserStore } from '@/store/userStore';

function BodyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';

  const { profile } = useUserStore();
  const name = useUserStore((s) => s.profile?.name);

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
    const parsedAge = age.trim() !== '' && Number.isFinite(Number(age)) ? Number(age) : undefined;
    const parsedBodyWeight = bodyWeight.trim() !== '' && Number.isFinite(Number(bodyWeight)) ? Number(bodyWeight) : undefined;
    const parsedHeight = height.trim() !== '' && Number.isFinite(Number(height)) ? Number(height) : undefined;

    useUserStore.setState((s) => ({
      profile: {
        ...s.profile,
        ...(parsedAge !== undefined && { age: parsedAge }),
        ...(parsedBodyWeight !== undefined && { bodyWeight: parsedBodyWeight }),
        ...(parsedHeight !== undefined && { height: parsedHeight }),
      } as typeof s.profile,
      onboardingStep: 3,
    }));
    router.push(isEdit ? '/onboarding/confirm-body?edit=true' : '/onboarding/confirm-body');
  };

  const handleSkip = () => {
    useUserStore.setState({ onboardingStep: 3 });
    router.push(isEdit ? '/onboarding/confirm-body?edit=true' : '/onboarding/confirm-body');
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

  const heading = name
    ? `Und ein paar Zahlen, ${name}.`
    : 'Und ein paar Zahlen.';

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
      <ProgressDots total={6} current={2} />

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          {heading}
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Für realistische Gewichtsvorschläge und Leistungsvergleiche.
        </p>
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        {/* Age */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
          <span style={{ ...typography.label, color: colors.textMuted }}>
            ALTER (Jahre)
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
            KÖRPERGEWICHT (kg)
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
            KÖRPERGRÖSSE (cm)
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

export default function BodyPage() {
  return (
    <Suspense>
      <BodyPageInner />
    </Suspense>
  );
}
