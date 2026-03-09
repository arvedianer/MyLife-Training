'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, RotateCcw, Weight, Timer, LogOut, User, Globe, Database } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppShell } from '@/components/layout/AppShell';
import { useUserStore } from '@/store/userStore';
import { useHistoryStore } from '@/store/historyStore';
import { usePlanStore } from '@/store/planStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { supabase } from '@/lib/supabase';
import { loadMockData } from '@/utils/mockData';

interface SupabaseUser {
  email?: string;
  username?: string;
  memberSince?: string;
}

function formatMemberSince(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'ML';
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile, weightUnit, restTimerDefault, language, setWeightUnit, setRestTimerDefault, setLanguage, resetUser, updateProfile } =
    useUserStore();
  const { sessions } = useHistoryStore();
  const { splits } = usePlanStore();

  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name ?? '');

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setSupabaseUser({
          email: user.email,
          username: user.user_metadata?.username as string | undefined,
          memberSince: user.created_at,
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  const handleReset = () => {
    if (confirm('Alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      resetUser();
      useHistoryStore.setState({ sessions: [] });
      usePlanStore.setState({ splits: [], activeSplitId: null });
      useWorkoutStore.setState({
        activeWorkout: null,
        restTimerActive: false,
        restTimerSeconds: 0,
        restTimerTotal: 0,
      });
      router.replace('/onboarding/name');
    }
  };

  // Derived display name — Supabase username or profile name or fallback
  const displayName = supabaseUser?.username || profile?.name || 'Sportler';
  const displayEmail = supabaseUser?.email ?? '';
  const initials = getInitials(displayName, displayEmail);

  return (
    <AppShell>
      <div style={{ backgroundColor: colors.bgPrimary, minHeight: '100dvh' }}>
        <PageHeader title="Einstellungen" />

        <div style={{ padding: spacing[5], display: 'flex', flexDirection: 'column', gap: spacing[6] }}>

          {/* ── KONTO ─────────────────────────────────────────────────── */}
          <Section title="Konto">
            {/* User identity card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                padding: `${spacing[4]} 0`,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.accent}40, ${colors.accent}15)`,
                  border: `2px solid ${colors.accent}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span style={{ ...typography.h3, color: colors.accent }}>{initials}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...typography.bodyLg, color: colors.textPrimary, fontWeight: 700 }}>
                  {displayName}
                </div>
                {displayEmail && (
                  <div
                    style={{
                      ...typography.bodySm,
                      color: colors.textMuted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayEmail}
                  </div>
                )}
                {supabaseUser?.memberSince && (
                  <div style={{ ...typography.bodySm, color: colors.textFaint, marginTop: '2px' }}>
                    Mitglied seit {formatMemberSince(supabaseUser.memberSince)}
                  </div>
                )}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                width: '100%',
                padding: `${spacing[3]} 0`,
                background: 'none',
                border: 'none',
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                opacity: loggingOut ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <LogOut size={18} color={colors.danger} />
              <span style={{ ...typography.body, color: colors.danger }}>
                {loggingOut ? 'Abmelden...' : 'Abmelden'}
              </span>
            </button>
          </Section>

          {/* ── PROFIL ────────────────────────────────────────────────── */}
          {profile && (
            <Section title="Profil">
              {/* Editable name row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: `${spacing[3]} 0`, borderBottom: `1px solid ${colors.borderLight}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                  <User size={16} color={colors.textMuted} />
                  <span style={{ ...typography.body, color: colors.textMuted }}>Name</span>
                </div>
                {editingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      placeholder="Dein Name"
                      autoFocus
                      style={{
                        backgroundColor: colors.bgHighest,
                        border: `1px solid ${colors.accent}`,
                        borderRadius: radius.md,
                        padding: `${spacing[1]} ${spacing[2]}`,
                        ...typography.body,
                        color: colors.textPrimary,
                        outline: 'none',
                        width: '130px',
                      }}
                    />
                    <button
                      onClick={() => {
                        updateProfile({ name: nameInput.trim() || undefined });
                        setEditingName(false);
                      }}
                      style={{
                        padding: `${spacing[1]} ${spacing[3]}`,
                        borderRadius: radius.full,
                        backgroundColor: colors.accent,
                        border: 'none',
                        ...typography.label, color: colors.bgPrimary,
                        cursor: 'pointer',
                      }}
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNameInput(profile?.name ?? ''); setEditingName(true); }}
                    style={{
                      ...typography.body, color: profile?.name ? colors.textSecondary : colors.accent,
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    {profile?.name || 'Tippen um Namen zu setzen →'}
                  </button>
                )}
              </div>
              <InfoRow label="Ziel" value={profile.goal} />
              <InfoRow label="Level" value={profile.level} />
              <InfoRow label="Trainingstage" value={`${profile.trainingDays}x / Woche`} />
              <InfoRow label="Equipment" value={profile.equipment} />
            </Section>
          )}

          {/* ── EINHEITEN & TIMER ─────────────────────────────────────── */}
          <Section title="Einheiten & Timer">
            {/* Gewichtseinheit */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} 0`,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Weight size={18} color={colors.textMuted} />
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  Gewichtseinheit
                </span>
              </div>
              <div style={{ display: 'flex', gap: spacing[2] }}>
                {(['kg', 'lbs'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setWeightUnit(unit)}
                    style={{
                      padding: `${spacing[1]} ${spacing[3]}`,
                      borderRadius: radius.full,
                      border: `1px solid ${weightUnit === unit ? colors.accent : colors.border}`,
                      backgroundColor: weightUnit === unit ? colors.accentBg : 'transparent',
                      ...typography.label,
                      color: weightUnit === unit ? colors.accent : colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Sprache */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} 0`,
                borderBottom: `1px solid ${colors.borderLight}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Globe size={18} color={colors.textMuted} />
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  Sprache
                </span>
              </div>
              <div style={{ display: 'flex', gap: spacing[2] }}>
                {(['de', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      padding: `${spacing[1]} ${spacing[3]}`,
                      borderRadius: radius.full,
                      border: `1px solid ${language === lang ? colors.accent : colors.border}`,
                      backgroundColor: language === lang ? colors.accentBg : 'transparent',
                      ...typography.label,
                      color: language === lang ? colors.accent : colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Rest Timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} 0`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                <Timer size={18} color={colors.textMuted} />
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  Standard-Pausenzeit
                </span>
              </div>
              <div style={{ display: 'flex', gap: spacing[2] }}>
                {[60, 90, 120, 180].map((secs) => (
                  <button
                    key={secs}
                    onClick={() => setRestTimerDefault(secs)}
                    style={{
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: radius.full,
                      border: `1px solid ${restTimerDefault === secs ? colors.accent : colors.border}`,
                      backgroundColor: restTimerDefault === secs ? colors.accentBg : 'transparent',
                      ...typography.monoSm,
                      color: restTimerDefault === secs ? colors.accent : colors.textMuted,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {secs}s
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ── STATISTIKEN ───────────────────────────────────────────── */}
          <Section title="Daten">
            <InfoRow label="Trainingseinheiten" value={String(sessions.length)} />
            <InfoRow label="Aktive Pläne" value={String(splits.length)} />
          </Section>

          {/* ── DANGER ZONE ───────────────────────────────────────────── */}
          <Section title="Gefährliche Zone">
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                width: '100%',
                padding: `${spacing[3]} 0`,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={18} color={colors.danger} />
              <span style={{ ...typography.body, color: colors.danger }}>
                Alle Daten zurücksetzen
              </span>
            </button>
          </Section>

          {/* ── ENTWICKLER ───────────────────────────────────────────── */}
          <Section title="Entwickler">
            <button
              onClick={() => {
                if (confirm('Bestehende Historie überschreiben und 3 Monate Beispieldaten laden?')) {
                  loadMockData();
                  alert('Beispieldaten erfolgreich geladen!');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                width: '100%',
                padding: `${spacing[3]} 0`,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Database size={18} color={colors.accent} />
              <span style={{ ...typography.body, color: colors.accent }}>
                Mockup-Daten laden (3 Monate)
              </span>
            </button>
          </Section>

          {/* ── APP INFO ──────────────────────────────────────────────── */}
          <div style={{ textAlign: 'center', paddingBottom: spacing[8] }}>
            <p style={{ ...typography.bodySm, color: colors.textFaint }}>
              MY LIFE Training · v0.1.0
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        style={{
          ...typography.label,
          color: colors.textMuted,
          marginBottom: spacing[3],
        }}
      >
        {title.toUpperCase()}
      </h3>
      <div
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: `0 ${spacing[4]}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing[3]} 0`,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <span style={{ ...typography.body, color: colors.textMuted }}>{label}</span>
      <span style={{ ...typography.body, color: colors.textSecondary }}>{value}</span>
    </div>
  );
}
