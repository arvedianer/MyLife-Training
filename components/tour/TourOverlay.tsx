'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourStore } from '@/store/tourStore';
import { usePlanStore } from '@/store/planStore';
import { TOUR_STEPS } from './tourSteps';
import { colors, spacing, typography, radius } from '@/constants/tokens';

// spacing values are strings like '16px' — extract the numeric pixel value
const sp = (key: keyof typeof spacing): number => parseInt(spacing[key], 10);

export function TourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { tourActive, tourStep, nextStep, prevStep, skipTour } = useTourStore();
  const splits = usePlanStore((s) => s.splits);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handler = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const step = TOUR_STEPS[tourStep];

  // Resolve dynamic routes for split/day steps
  const resolveRoute = useCallback(
    (route: string): string => {
      if (route.includes('[first-split]')) {
        const firstSplit = splits[0];
        if (!firstSplit) return '/splits';
        const slugifiedSplit = firstSplit.name.toLowerCase().replace(/\s+/g, '-');
        const resolved = route.replace('[first-split]', slugifiedSplit);
        if (resolved.includes('[first-day]')) {
          const firstDay = firstSplit.days[0];
          const slugifiedDay = firstDay?.name?.toLowerCase().replace(/\s+/g, '-') ?? '0';
          return resolved.replace('[first-day]', slugifiedDay);
        }
        return resolved;
      }
      return route;
    },
    [splits],
  );

  // Navigate to required route if not already there
  useEffect(() => {
    if (!tourActive || !step) return;
    const targetRoute = resolveRoute(step.route);
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }, [tourActive, tourStep, pathname, step, resolveRoute, router]);

  // Find the target element and update spotlight rect
  useEffect(() => {
    if (!tourActive || !step) return;

    const findAndSet = (): boolean => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        el.setAttribute('data-tour-active', 'true');
        setSpotlightRect(el.getBoundingClientRect());
        return true;
      }
      return false;
    };

    // Clean previous active attribute
    document.querySelectorAll('[data-tour-active]').forEach((el) =>
      el.removeAttribute('data-tour-active'),
    );

    if (!findAndSet()) {
      // Retry via MutationObserver if element not found yet (page still loading)
      observerRef.current?.disconnect();
      observerRef.current = new MutationObserver(() => {
        if (findAndSet()) observerRef.current?.disconnect();
      });
      observerRef.current.observe(document.body, { childList: true, subtree: true });

      // Fallback: if tap-step target still missing after 3s, auto-advance
      if (step.action === 'tap') {
        const timer = setTimeout(() => {
          const el = document.querySelector(step.selector);
          if (!el) nextStep();
        }, 3000);
        return () => {
          clearTimeout(timer);
          observerRef.current?.disconnect();
          document.querySelectorAll('[data-tour-active]').forEach((e) =>
            e.removeAttribute('data-tour-active'),
          );
        };
      }
    }

    return () => {
      observerRef.current?.disconnect();
      document.querySelectorAll('[data-tour-active]').forEach((el) =>
        el.removeAttribute('data-tour-active'),
      );
    };
  }, [tourActive, tourStep, step, nextStep]);

  // Handle 'tap' action: listen for click on highlighted element
  useEffect(() => {
    if (!tourActive || step?.action !== 'tap') return;
    const el = document.querySelector(step.selector);
    if (!el) return;
    const handler = () => nextStep();
    el.addEventListener('click', handler, { once: true });
    return () => el.removeEventListener('click', handler);
  }, [tourActive, tourStep, step, nextStep]);

  if (!tourActive) return null;

  const padding = 8;
  const sr = spotlightRect;

  // Determine whether bubble should appear above or below the spotlight
  const bubbleAboveHalf = sr !== null && windowHeight > 0 && sr.top > windowHeight / 2;
  const bubbleBottom = sr !== null && bubbleAboveHalf ? windowHeight - sr.top + 12 : undefined;
  const bubbleTop =
    sr !== null && !bubbleAboveHalf ? sr.bottom + 12 : sr === null ? sp(4) : undefined;

  // Progress dots: show a window of up to 5 steps centered on the current step
  const windowStart = Math.max(0, tourStep - 2);
  const windowEnd = Math.min(TOUR_STEPS.length, windowStart + 5);
  const visibleSteps = TOUR_STEPS.slice(windowStart, windowEnd);

  return (
    <AnimatePresence>
      {tourActive && (
        <>
          {/* Full-screen backdrop — blocks clicks outside spotlight for 'next' steps,
               passes through for 'tap' steps so the user can click the element */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9997,
              pointerEvents: step?.action === 'tap' ? 'none' : 'auto',
            }}
            onClick={() => {}}
          />

          {/* Spotlight cutout — creates dim overlay via box-shadow */}
          {sr && (
            <div
              style={{
                position: 'fixed',
                left: sr.left - padding,
                top: sr.top - padding,
                width: sr.width + padding * 2,
                height: sr.height + padding * 2,
                borderRadius: radius.md,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                zIndex: 9998,
                pointerEvents: 'none',
                transition: 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease',
              }}
            />
          )}

          {/* Skip button — more prominent */}
          <button
            onClick={skipTour}
            style={{
              position: 'fixed',
              top: sp(4),
              right: sp(4),
              zIndex: 10001,
              background: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.full,
              color: colors.textMuted,
              cursor: 'pointer',
              padding: `${sp(2)}px ${sp(3)}px`,
              ...typography.bodySm,
            }}
          >
            Tour überspringen
          </button>

          {/* Speech bubble */}
          {step && (
            <motion.div
              key={tourStep}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                zIndex: 10001,
                left: sp(4),
                right: sp(4),
                ...(bubbleBottom !== undefined ? { bottom: bubbleBottom } : {}),
                ...(bubbleTop !== undefined ? { top: bubbleTop } : {}),
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                padding: sp(5),
                display: 'flex',
                flexDirection: 'column',
                gap: sp(3),
              }}
            >
              {/* Coach Arved avatar header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp(2) }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: radius.full,
                  backgroundColor: colors.accentBg,
                  border: `1px solid ${colors.accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  💪
                </div>
                <span style={{ ...typography.label, color: colors.accent }}>Coach Arved</span>
              </div>

              {/* Speech bubble text */}
              <p style={{ ...typography.bodyLg, color: colors.textPrimary, margin: 0 }}>
                {step.text}
              </p>

              {/* Progress indicator row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp(2) }}>
                <span style={{ ...typography.monoSm, color: colors.textFaint, flexShrink: 0 }}>
                  {step.id} / {TOUR_STEPS.length}
                </span>
                <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
                  {visibleSteps.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        width: s.id === step.id ? 16 : 6,
                        height: 6,
                        borderRadius: radius.full,
                        backgroundColor: s.id === step.id ? colors.accent : colors.bgHighest,
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: sp(3) }}>
                  {tourStep > 0 && (
                    <button
                      onClick={prevStep}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.md,
                        padding: `${sp(2)}px ${sp(4)}px`,
                        color: colors.textMuted,
                        cursor: 'pointer',
                        ...typography.bodySm,
                      }}
                    >
                      Zurück
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: sp(3), alignItems: 'center' }}>
                  {step.action === 'next' && (() => {
                    const isLastStep = tourStep === TOUR_STEPS.length - 1;
                    return (
                      <button
                        onClick={isLastStep ? skipTour : nextStep}
                        style={{
                          backgroundColor: isLastStep ? colors.success : colors.accent,
                          border: 'none',
                          borderRadius: radius.md,
                          padding: `${sp(2)}px ${sp(4)}px`,
                          color: colors.bgPrimary,
                          cursor: 'pointer',
                          ...typography.label,
                        }}
                      >
                        {isLastStep ? "Los geht's" : 'Weiter'}
                      </button>
                    );
                  })()}
                  {step.action === 'tap' && (
                    <span style={{ ...typography.bodySm, color: colors.textMuted }}>
                      Tippe auf das markierte Element
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
