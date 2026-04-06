'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, radius, typography } from '@/constants/tokens';
import type { WorkoutGoal, TrainingLevel, TrainingDays, EquipmentType } from '@/types/workout';

const CALLBACK_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    setOauthLoading(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: CALLBACK_URL },
    });
    if (oauthError) {
      setError('Anmeldung fehlgeschlagen — bitte erneut versuchen.');
      setOauthLoading(null);
    }
    // On success the browser navigates away — no state cleanup needed
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('E-Mail oder Passwort falsch. Bitte versuche es erneut.');
      setLoading(false);
      return;
    }

    // Fetch profile from Supabase to check if onboarding was already completed
    const userId = data.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('goal, level, training_days, equipment, name, age, body_weight, height, training_weekdays, secondary_goal, weight_unit, profile_created_at')
        .eq('id', userId)
        .single();

      if (profile?.goal) {
        // Onboarding was done — restore full profile to local store and go to dashboard
        useUserStore.getState().completeOnboarding({
          goal: profile.goal as WorkoutGoal,
          level: (profile.level ?? 'anfaenger') as TrainingLevel,
          trainingDays: (profile.training_days ?? 3) as TrainingDays,
          equipment: (profile.equipment ?? 'vollausgestattet') as EquipmentType,
          weightUnit: ((profile.weight_unit as 'kg' | 'lbs') ?? 'kg'),
          createdAt: (profile.profile_created_at as number | null) ?? Date.now(),
          ...(profile.name ? { name: profile.name as string } : {}),
          ...(profile.age != null ? { age: profile.age as number } : {}),
          ...(profile.body_weight != null ? { bodyWeight: profile.body_weight as number } : {}),
          ...(profile.height != null ? { height: profile.height as number } : {}),
          ...(profile.training_weekdays != null ? { trainingWeekdays: profile.training_weekdays as number[] } : {}),
          ...(profile.secondary_goal != null ? { secondaryGoal: profile.secondary_goal as WorkoutGoal } : {}),
        });
        router.replace('/dashboard');
        return;
      }
    }

    // No onboarding data found → start onboarding
    router.replace('/onboarding/welcome');
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

        {/* OAuth buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[4] }}>
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[3],
              width: '100%', padding: `${spacing[3]} ${spacing[4]}`,
              backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: radius.lg, cursor: oauthLoading ? 'not-allowed' : 'pointer',
              ...typography.body, color: colors.textPrimary, opacity: oauthLoading && oauthLoading !== 'google' ? 0.5 : 1,
            }}
          >
            {oauthLoading === 'google' ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Mit Google anmelden
          </button>

          <button
            onClick={() => handleOAuth('apple')}
            disabled={!!oauthLoading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[3],
              width: '100%', padding: `${spacing[3]} ${spacing[4]}`,
              backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: radius.lg, cursor: oauthLoading ? 'not-allowed' : 'pointer',
              ...typography.body, color: colors.textPrimary, opacity: oauthLoading && oauthLoading !== 'apple' ? 0.5 : 1,
            }}
          >
            {oauthLoading === 'apple' ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            )}
            Mit Apple anmelden
          </button>
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
