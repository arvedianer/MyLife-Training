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
    }

    return () => {
      observerRef.current?.disconnect();
      document.querySelectorAll('[data-tour-active]').forEach((el) =>
        el.removeAttribute('data-tour-active'),
      );
    };
  }, [tourActive, tourStep, step]);

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

  return (
    <AnimatePresence>
      {tourActive && (
        <>
          {/* Full-screen backdrop — blocks clicks outside spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9997,
              pointerEvents: 'auto',
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
              }}
            />
          )}

          {/* Skip button */}
          <button
            onClick={skipTour}
            style={{
              position: 'fixed',
              top: sp(4),
              right: sp(4),
              zIndex: 10001,
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              ...typography.bodySm,
            }}
          >
            Tour überspringen
          </button>

          {/* Speech bubble */}
          {step && (
            <motion.div
              key={tourStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
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
                gap: sp(4),
              }}
            >
              <p
                style={{
                  ...typography.bodyLg,
                  color: colors.textPrimary,
                  margin: 0,
                }}
              >
                {step.text}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ ...typography.monoSm, color: colors.textFaint }}>
                  Schritt {step.id} von 24
                </span>

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
                  {step.action === 'next' && (
                    <button
                      onClick={tourStep === 23 ? skipTour : nextStep}
                      style={{
                        backgroundColor: tourStep === 23 ? colors.success : colors.accent,
                        border: 'none',
                        borderRadius: radius.md,
                        padding: `${sp(2)}px ${sp(4)}px`,
                        color: colors.bgPrimary,
                        cursor: 'pointer',
                        ...typography.label,
                      }}
                    >
                      {tourStep === 23 ? "Los geht's" : 'Weiter'}
                    </button>
                  )}
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
