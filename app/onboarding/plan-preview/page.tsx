'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography } from '@/constants/tokens';
import type { WorkoutGoal, TrainingLevel } from '@/types/workout';

function getPlanInsight(
  goal: WorkoutGoal,
  level: TrainingLevel,
): { title: string; body: string } {
  const isExperienced = level === 'profi' || level === 'experte';

  if (goal === 'kraft' && isExperienced) {
    return {
      title: 'Progressive Overload.',
      body: 'Schwere Grundübungen, wöchentliche Steigerung. Genau das was Leute auf deinem Level voranbringt.',
    };
  }

  if (goal === 'muskelaufbau' && !isExperienced) {
    return {
      title: 'Hypertrophie-Training.',
      body: 'Volumen und Technik stehen im Vordergrund — das bringt dir Masse.',
    };
  }

  if (goal === 'abnehmen' && level === 'anfaenger') {
    return {
      title: 'Metabolisches Training.',
      body: 'Hohe Intensität, kurze Pausen, viel Volumen. Fett weg, Form bleibt.',
    };
  }

  if (goal === 'alles') {
    return {
      title: 'Vollständiges Programm.',
      body: 'Kraft, Volumen, Ausdauer — alles ausbalanciert.',
    };
  }

  return {
    title: 'Dein Plan.',
    body: 'Dein Plan passt sich deinen Antworten an. Kommen wir zu den Details.',
  };
}

function PlanPreviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const profile = useUserStore((s) => s.profile);

  const nextRoute = isEdit ? '/onboarding/days?edit=true' : '/onboarding/days';

  useEffect(() => {
    const timer = setTimeout(() => router.push(nextRoute), 3000);
    return () => clearTimeout(timer);
  }, [router, nextRoute]);

  const insight = getPlanInsight(profile?.goal ?? 'fitness', profile?.level ?? 'anfaenger');

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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        <h2 style={{ ...typography.h2, color: colors.accent, margin: 0 }}>
          {insight.title}
        </h2>
        <p style={{ ...typography.bodyLg, color: colors.textSecondary, margin: 0 }}>
          {insight.body}
        </p>
        <p style={{ ...typography.body, color: colors.textMuted, margin: 0 }}>
          Jetzt noch wann und wo.
        </p>
      </motion.div>
    </div>
  );
}

export default function PlanPreviewPage() {
  return (
    <Suspense>
      <PlanPreviewInner />
    </Suspense>
  );
}
