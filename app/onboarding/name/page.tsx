'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useUserStore } from '@/store/userStore';

function NamePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const { profile } = useUserStore();
  const [name, setName] = useState(profile?.name ?? '');

  const handleContinue = () => {
    useUserStore.setState((s) => ({
      profile: { ...s.profile, name: name.trim() || undefined } as typeof s.profile,
      onboardingStep: 2,
    }));
    router.push(isEdit ? '/onboarding/body?edit=true' : '/onboarding/body');
  };

  const handleSkip = () => {
    useUserStore.setState({ onboardingStep: 2 });
    router.push(isEdit ? '/onboarding/body?edit=true' : '/onboarding/body');
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
      {/* Progress Dots */}
      <ProgressDots total={6} current={1} />

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Wie soll ich dich nennen?
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Damit ich dich nicht die ganze Zeit &apos;du&apos; nenne.
        </p>
      </div>

      {/* Name Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <input
          type="text"
          placeholder="Dein Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim().length >= 2 && handleContinue()}
          autoFocus
          maxLength={30}
          style={{
            width: '100%',
            padding: `${spacing[4]} ${spacing[5]}`,
            backgroundColor: colors.bgCard,
            border: `1px solid ${name.trim() ? colors.accent : colors.border}`,
            borderRadius: radius.lg,
            ...typography.bodyLg,
            color: colors.textPrimary,
            outline: 'none',
            transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
        />
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
        <Button
          fullWidth
          size="lg"
          onClick={handleContinue}
          disabled={name.trim().length < 2}
        >
          {name.trim().length >= 2 ? `Weiter, ${name.trim()}!` : 'Weiter'}
        </Button>
      </div>
    </div>
  );
}

export default function NamePage() {
  return (
    <Suspense>
      <NamePageInner />
    </Suspense>
  );
}
