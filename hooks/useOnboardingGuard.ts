'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

/**
 * Leitet nicht-onboardete Nutzer zu /onboarding/goal um.
 * Wird in (tabs)/layout.tsx aufgerufen um alle Tab-Screens zu schützen.
 */
export function useOnboardingGuard() {
  const router = useRouter();
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  useEffect(() => {
    if (!onboardingCompleted) {
      router.replace('/onboarding/goal');
    }
  }, [onboardingCompleted, router]);

  return onboardingCompleted;
}
