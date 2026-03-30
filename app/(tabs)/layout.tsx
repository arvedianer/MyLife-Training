'use client';

import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import { useSync } from '@/hooks/useSync';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppShell } from '@/components/layout/AppShell';
import { ActiveWorkoutBanner } from '@/components/workout/ActiveWorkoutBanner';
import { CoachBubble } from '@/components/ui/CoachBubble';
import { colors, spacing, typography } from '@/constants/tokens';
import { WifiOff } from 'lucide-react';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useOnboardingGuard();
  const { syncError } = useSync();

  if (!ready) return null;

  return (
    <AppShell>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
        }}
      >
        {syncError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[4]}`,
              backgroundColor: colors.bgElevated,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <WifiOff size={12} color={colors.textMuted} />
            <span style={{ ...typography.label, color: colors.textMuted }}>
              OFFLINE — Lokale Daten werden genutzt
            </span>
          </div>
        )}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            backgroundColor: colors.bgPrimary,
          }}
        >
          {children}
        </main>
        <ActiveWorkoutBanner />
        <BottomNav />
        <CoachBubble />
      </div>
    </AppShell>
  );
}
