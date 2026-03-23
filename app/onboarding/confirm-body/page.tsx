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
    profile?.bodyWeight ? `${profile.bodyWeight}kg` : null,
    profile?.height ? `${profile.height}cm` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      onClick={() => router.push(nextRoute)}
      style={{
        minHeight: '100dvh',
        backgroundColor: colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[6]} ${spacing[5]}`,
        cursor: 'pointer',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: spacing[3] }}
      >
        <h2 style={{ ...typography.h2, color: colors.accent, margin: 0 }}>
          {hasData
            ? `${profile?.name ? profile.name + '. ' : ''}${summary}`
            : `Alright${profile?.name ? `, ${profile.name}` : ''}.`}
        </h2>
        <p style={{ ...typography.bodyLg, color: colors.textSecondary, margin: 0 }}>
          {hasData ? 'Gute Basis. Jetzt: Was willst du?' : 'Kommen wir zu deinen Zielen.'}
        </p>
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
