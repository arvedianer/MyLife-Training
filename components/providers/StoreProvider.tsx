'use client';

import { useEffect, useState } from 'react';
import { colors } from '@/constants/tokens';

/**
 * StoreProvider — Hydration Guard für Zustand mit localStorage
 *
 * Verhindert SSR/Client Mismatch: Zustand persist lädt erst nach Mount.
 * Zeigt leeren Hintergrund bis die Stores hydratisiert sind.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          backgroundColor: colors.bgPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  }

  return <>{children}</>;
}
