'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Dumbbell, User, Package } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/store/userStore';
import type { EquipmentType } from '@/types/workout';

const equipmentOptions: { id: EquipmentType; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: 'vollausgestattet',
    label: 'Vollständiges Gym',
    description: 'Langhanteln, Kurzhanteln, Kabelzug, Maschinen',
    icon: Building2,
  },
  {
    id: 'kurzhanteln',
    label: 'Kurzhanteln',
    description: 'Nur Kurzhanteln — Heimtraining',
    icon: Dumbbell,
  },
  {
    id: 'eigengewicht',
    label: 'Eigengewicht',
    description: 'Kein Equipment — Bodyweight only',
    icon: User,
  },
  {
    id: 'minimalistisch',
    label: 'Minimalistisch',
    description: 'Kurzhanteln + Klimmzugstange',
    icon: Package,
  },
];

export default function EquipmentPage() {
  const router = useRouter();
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
    router.push('/onboarding/generating');
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
          SCHRITT 6 VON 7
        </span>
        <ProgressBar progress={6 / 7} />
      </div>

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
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing[3],
        }}
      >
        {equipmentOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: spacing[3],
                padding: spacing[4],
                backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                borderRadius: radius.lg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                minHeight: '120px',
              }}
            >
              <Icon size={22} color={isSelected ? colors.accent : colors.textMuted} />
              <div>
                <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600', marginBottom: '4px' }}>
                  {option.label}
                </div>
                <div style={{ ...typography.bodySm, color: colors.textMuted, lineHeight: '16px' }}>
                  {option.description}
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
          Plan erstellen
        </Button>
      </div>
    </div>
  );
}
