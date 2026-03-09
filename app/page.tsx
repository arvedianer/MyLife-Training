'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/tokens';

export default function RootPage() {
  const router = useRouter();
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  useEffect(() => {
    const check = async () => {
      // If Supabase is configured, check for a session
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/auth/login');
          return;
        }
      }

      // Authenticated (or running locally without Supabase) → check onboarding
      if (onboardingCompleted) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding/name');
      }
    };

    check();
  }, [onboardingCompleted, router]);

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
