'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/store/userStore';

export default function NamePage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [name, setName] = useState(profile?.name ?? '');

  const handleContinue = () => {
    // Save name (even if empty — optional)
    useUserStore.setState((s) => ({
      profile: { ...s.profile, name: name.trim() || undefined } as typeof s.profile,
      onboardingStep: 2,
    }));
    router.push('/onboarding/body');
  };

  const handleSkip = () => {
    useUserStore.setState({ onboardingStep: 2 });
    router.push('/onboarding/body');
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
          SCHRITT 1 VON 7
        </span>
        <ProgressBar progress={1 / 7} />
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Wie heißt du?
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Damit wir dich persönlich ansprechen können.
        </p>
      </div>

      {/* Name Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <input
          type="text"
          placeholder="Dein Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
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
        <Button fullWidth size="lg" onClick={handleContinue}>
          {name.trim() ? `Weiter, ${name.trim()}!` : 'Weiter'}
        </Button>
      </div>
    </div>
  );
}
