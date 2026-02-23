'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/constants/tokens';

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('Nutzername muss mindestens 3 Zeichen lang sein.');
      return;
    }
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.trim() },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Diese E-Mail ist bereits registriert. Logge dich ein.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Go to onboarding to complete profile setup
    router.replace('/onboarding/goal');
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', colors.danger, '#FF9500', colors.success];
  const strengthLabels = ['', 'Zu kurz', 'Ausreichend', 'Stark'];

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
      {/* Logo */}
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
          Account erstellen
        </h1>
        <p
          style={{
            ...typography.body,
            color: colors.textMuted,
            marginBottom: spacing[6],
          }}
        >
          Kostenlos registrieren und loslegen.
        </p>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            <label
              style={{ ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              Nutzername
            </label>
            <div style={{ position: 'relative' }}>
              <User
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
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                required
                autoComplete="username"
                placeholder="arved_lifts"
                maxLength={30}
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
            <span style={{ ...typography.bodySm, color: colors.textFaint }}>
              Nur Buchstaben, Zahlen und _ erlaubt
            </span>
          </div>

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
                autoComplete="new-password"
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
            {/* Password strength */}
            {password.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <div style={{ display: 'flex', gap: spacing[1], flex: 1 }}>
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: '3px',
                        borderRadius: '2px',
                        backgroundColor: passwordStrength >= level ? strengthColors[passwordStrength] : colors.bgHighest,
                        transition: 'background-color 0.2s',
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...typography.bodySm, color: strengthColors[passwordStrength] }}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
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

          {/* Perks */}
          <div
            style={{
              backgroundColor: colors.accentBg,
              borderRadius: radius.lg,
              padding: spacing[4],
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[2],
            }}
          >
            {['Kostenlos & keine Werbung', 'Trainingshistorie sichern', 'Geräteübergreifend synchron'].map((perk) => (
              <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                <Check size={14} color={colors.accent} />
                <span style={{ ...typography.bodySm, color: colors.textSecondary }}>{perk}</span>
              </div>
            ))}
          </div>

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
            }}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                Account erstellen
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

        {/* Login link */}
        <Link href="/auth/login" style={{ display: 'block', textDecoration: 'none' }}>
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
            Bereits einen Account?{' '}
            <span style={{ color: colors.accent, fontWeight: '600' }}>Einloggen</span>
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
