'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography } from '@/constants/tokens';

function ConfirmBodyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const profile = useUserStore((s) => s.profile);

  const nextRoute = isEdit ? '/onboarding/goal?edit=true' : '/onboarding/goal';

  useEffect(() => {
    const t = setTimeout(() => router.push(nextRoute), 2500);
    return () => clearTimeout(t);
  }, [router, nextRoute]);

  const hasData = profile?.age || profile?.bodyWeight || profile?.height;
  const summary = [
    profile?.age ? `${profile.age} J.` : null,
    profile?.bodyWeight ? `${profile.bodyWeight} kg` : null,
    profile?.height ? `${profile.height} cm` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      onClick={() => router.push(nextRoute)}
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        background: `radial-gradient(ellipse at 20% 30%, ${colors.accent}12 0%, transparent 55%), ${colors.bgPrimary}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[6]} ${spacing[5]}`,
        cursor: 'pointer',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[4] }}
      >
        {/* Label */}
        <span style={{
          ...typography.label,
          color: colors.accent,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Körperprofil
        </span>

        {/* Main heading */}
        <h1 style={{
          fontFamily: 'var(--font-barlow)',
          fontSize: 44,
          fontWeight: 800,
          lineHeight: 1,
          color: hasData ? colors.textPrimary : colors.accent,
          margin: 0,
        }}>
          {hasData
            ? (profile?.name ? `${profile.name}.` : 'Alright.')
            : 'Alright.'}
        </h1>

        {/* Stats row */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            style={{
              display: 'flex',
              gap: spacing[3],
              flexWrap: 'wrap',
            }}
          >
            {[
              profile?.age ? { label: 'Alter', value: `${profile.age} J.` } : null,
              profile?.bodyWeight ? { label: 'Gewicht', value: `${profile.bodyWeight} kg` } : null,
              profile?.height ? { label: 'Größe', value: `${profile.height} cm` } : null,
            ].filter(Boolean).map((item) => item && (
              <div key={item.label} style={{
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: `${spacing[2]} ${spacing[3]}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                <span style={{ ...typography.label, color: colors.textMuted, fontSize: 10 }}>{item.label}</span>
                <span style={{ ...typography.monoLg, color: colors.accent, fontSize: 20 }}>{item.value}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Subtext */}
        <p style={{ ...typography.bodyLg, color: colors.textMuted, margin: 0 }}>
          {hasData ? 'Gute Basis. Jetzt: Was willst du?' : 'Kommen wir zu deinen Zielen.'}
        </p>

        {/* Tap hint */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          style={{ ...typography.label, color: colors.textFaint, marginTop: spacing[2] }}
        >
          Tippen zum Weitermachen
        </motion.span>
      </motion.div>
    </div>
  );
}

export default function ConfirmBodyPage() {
  return (
    <Suspense>
      <ConfirmBodyInner />
    </Suspense>
  );
}
