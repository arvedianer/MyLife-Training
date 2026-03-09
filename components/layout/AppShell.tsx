'use client';

import { APP_MAX_WIDTH, colors } from '@/constants/tokens';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell — Mobile Viewport Container
 * Zentriert den Content auf max 430px (wie eine native App im Browser).
 * Auf Desktop-Screens wirken die Ränder als dunkle Fläche.
 * Setzt CSS-Variablen für das zielbasierte Theme.
 */
export function AppShell({ children }: AppShellProps) {

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgSecondary, // Desktop-Rand
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: APP_MAX_WIDTH,
          minHeight: '100dvh',
          backgroundColor: colors.bgPrimary,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
