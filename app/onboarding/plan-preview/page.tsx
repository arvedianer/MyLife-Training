'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { colors, spacing, typography, radius } from '@/constants/tokens';
import type { WorkoutGoal, TrainingLevel } from '@/types/workout';

function getPlanInsight(
  goal: WorkoutGoal,
  level: TrainingLevel,
): { label: string; title: string; body: string } {
  const isExperienced = level === 'profi' || level === 'experte';

  if (goal === 'kraft' && isExperienced) {
    return {
      label: 'Kraft',
      title: 'Progressive Overload.',
      body: 'Schwere Grundübungen, wöchentliche Steigerung. Genau das was Leute auf deinem Level voranbringt.',
    };
  }

  if (goal === 'muskelaufbau' && !isExperienced) {
    return {
      label: 'Hypertrophie',
      title: 'Muskeln aufbauen.',
      body: 'Volumen und Technik stehen im Vordergrund — das bringt dir Masse.',
    };
  }

  if (goal === 'abnehmen' && level === 'anfaenger') {
    return {
      label: 'Fettabbau',
      title: 'Metabolisches Training.',
      body: 'Hohe Intensität, kurze Pausen, viel Volumen. Fett weg, Form bleibt.',
    };
  }

  if (goal === 'alles') {
    return {
      label: 'Vollständig',
      title: 'Alles auf einmal.',
      body: 'Kraft, Volumen, Ausdauer — alles ausbalanciert.',
    };
  }

  return {
    label: 'Fitness',
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
        background: `radial-gradient(ellipse at 80% 20%, ${colors.accent}10 0%, transparent 50%), ${colors.bgPrimary}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[6]} ${spacing[5]}`,
        cursor: 'pointer',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}
      >
        {/* Label pill */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{ display: 'inline-flex', alignSelf: 'flex-start' }}
        >
          <span style={{
            backgroundColor: `${colors.accent}18`,
            border: `1px solid ${colors.accent}40`,
            borderRadius: radius.full,
            padding: `3px ${spacing[3]}`,
            ...typography.label,
            color: colors.accent,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {insight.label}
          </span>
        </motion.div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-barlow)',
          fontSize: 48,
          fontWeight: 800,
          lineHeight: 1,
          color: colors.textPrimary,
          margin: 0,
        }}>
          {insight.title}
        </h1>

        {/* Divider */}
        <div style={{ width: 40, height: 3, backgroundColor: colors.accent, borderRadius: 2 }} />

        {/* Body */}
        <p style={{ ...typography.bodyLg, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
          {insight.body}
        </p>

        {/* Next hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          style={{ ...typography.body, color: colors.textMuted, margin: 0 }}
        >
          Jetzt noch wann und wo.
        </motion.p>

        {/* Tap hint */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.4 }}
          style={{ ...typography.label, color: colors.textFaint, marginTop: spacing[1] }}
        >
          Tippen zum Weitermachen
        </motion.span>
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
