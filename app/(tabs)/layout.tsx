'use client';

import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppShell } from '@/components/layout/AppShell';
import { colors } from '@/constants/tokens';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useOnboardingGuard();

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
        <BottomNav />
      </div>
    </AppShell>
  );
}
