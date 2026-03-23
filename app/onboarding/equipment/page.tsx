'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Dumbbell, User } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useUserStore } from '@/store/userStore';
import type { EquipmentType } from '@/types/workout';

const EQUIPMENT_OPTIONS: { id: EquipmentType; label: string; sub: string; icon: React.ElementType }[] = [
  {
    id: 'vollausgestattet',
    label: 'Fitnessstudio',
    sub: 'Freie Gewichte, Kabelzug, Maschinen',
    icon: Building2,
  },
  {
    id: 'kurzhanteln',
    label: 'Zuhause + Equipment',
    sub: 'Hanteln, Stange, Bank',
    icon: Dumbbell,
  },
  {
    id: 'eigengewicht',
    label: 'Nur Bodyweight',
    sub: 'Kein Equipment',
    icon: User,
  },
];

function EquipmentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const { profile, setOnboardingStep } = useUserStore();
  const [selected, setSelected] = useState<EquipmentType | null>(
    (profile?.equipment as EquipmentType) ?? null
  );

  const handleContinue = () => {
    if (!selected) return;
    useUserStore.setState((s) => ({
      profile: { ...s.profile, equipment: selected } as typeof s.profile,
    }));
    setOnboardingStep(6);
    router.push(isEdit ? '/settings' : '/onboarding/generating');
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
      <ProgressDots total={6} current={6} />

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>
          Was steht dir zur Verfügung?
        </h1>
        <p style={{ ...typography.body, color: colors.textMuted }}>
          Damit dein Plan mit dem passenden Equipment arbeitet.
        </p>
      </div>

      {/* Equipment Options */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        {EQUIPMENT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              style={{
                display: 'flex',
                flexDirection: 'row',
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
              <Icon size={22} color={isSelected ? colors.accent : colors.textMuted} />
              <div>
                <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600', marginBottom: '2px' }}>
                  {option.label}
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted }}>
                  {option.sub}
                </div>
              </div>
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
          {isEdit ? 'Speichern' : 'Plan erstellen'}
        </Button>
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  return (
    <Suspense>
      <EquipmentPageInner />
    </Suspense>
  );
}
