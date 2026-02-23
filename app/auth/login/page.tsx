'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, radius, typography } from '@/constants/tokens';

export default function LoginPage() {
  const router = useRouter();
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('E-Mail oder Passwort falsch. Bitte versuche es erneut.');
      setLoading(false);
      return;
    }

    if (onboardingCompleted) {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding/goal');
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[6]} ${spacing[5]}`,
      }}
    >
      {/* Logo / Wordmark */}
      <div style={{ marginBottom: spacing[10], textAlign: 'center' }}>
        <div
          style={{
            ...typography.display,
            color: colors.accent,
            letterSpacing: '-1px',
            textTransform: 'uppercase',
          }}
        >
          MY LIFE
        </div>
        <div
          style={{
            ...typography.label,
            color: colors.textMuted,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginTop: spacing[1],
          }}
        >
          Training
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: colors.bgCard,
          borderRadius: radius['2xl'],
          border: `1px solid ${colors.border}`,
          padding: spacing[6],
        }}
      >
        <h1
          style={{
            ...typography.h2,
            color: colors.textPrimary,
            marginBottom: spacing[1],
          }}
        >
          Willkommen zurück
        </h1>
        <p
          style={{
            ...typography.body,
            color: colors.textMuted,
            marginBottom: spacing[6],
          }}
        >
          Melde dich an, um weiterzumachen.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            <label
              style={{ ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              E-Mail
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: spacing[3],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.textMuted,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="deine@email.de"
                style={{
                  width: '100%',
                  backgroundColor: colors.bgHighest,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} 36px`,
                  color: colors.textPrimary,
                  ...typography.body,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            <label
              style={{ ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              Passwort
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: spacing[3],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.textMuted,
                  pointerEvents: 'none',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  backgroundColor: colors.bgHighest,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radius.lg,
                  padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} 36px`,
                  color: colors.textPrimary,
                  ...typography.body,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                backgroundColor: colors.dangerBg,
                border: `1px solid ${colors.danger}30`,
                borderRadius: radius.md,
                padding: `${spacing[3]} ${spacing[4]}`,
                ...typography.bodySm,
                color: colors.danger,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              width: '100%',
              backgroundColor: loading ? colors.accentDark : colors.accent,
              color: colors.bgPrimary,
              borderRadius: radius.lg,
              padding: `${spacing[3]} ${spacing[4]}`,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              ...typography.bodyLg,
              fontWeight: '700',
              marginTop: spacing[2],
            }}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                Einloggen
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            margin: `${spacing[6]} 0`,
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
          <span style={{ ...typography.bodySm, color: colors.textMuted }}>oder</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
        </div>

        {/* Sign up link */}
        <Link href="/auth/signup" style={{ display: 'block', textDecoration: 'none' }}>
          <div
            style={{
              textAlign: 'center',
              padding: `${spacing[3]} ${spacing[4]}`,
              borderRadius: radius.lg,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bgElevated,
              ...typography.body,
              color: colors.textSecondary,
              cursor: 'pointer',
            }}
          >
            Noch kein Account?{' '}
            <span style={{ color: colors.accent, fontWeight: '600' }}>Registrieren</span>
          </div>
        </Link>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: ${colors.textFaint}; }
        input:focus { border-color: ${colors.accent}50 !important; }
      `}</style>
    </div>
  );
}
