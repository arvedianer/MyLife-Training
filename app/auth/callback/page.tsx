'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/constants/tokens';

// OAuth callback page — Supabase redirects here after Google/Apple login.
// Exchanges the PKCE code for a session using the client-side supabase instance,
// so the session lands in localStorage (same as email/password login).
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');

      if (errorParam) {
        setError(errorDescription ?? errorParam);
        setTimeout(() => router.replace('/auth/login'), 3000);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError('Anmeldung fehlgeschlagen — bitte erneut versuchen.');
          setTimeout(() => router.replace('/auth/login'), 3000);
          return;
        }
      }

      // Session set — root page will handle onboarding check
      router.replace('/');
    };

    handleCallback();
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      {error ? (
        <p style={{ ...typography.body, color: colors.danger, textAlign: 'center', padding: '0 24px' }}>
          {error}
        </p>
      ) : (
        <>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `3px solid ${colors.accent}`,
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ ...typography.body, color: colors.textMuted }}>Einen Moment …</p>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
