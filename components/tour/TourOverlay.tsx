'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourStore } from '@/store/tourStore';
import { usePlanStore } from '@/store/planStore';
import { TOUR_STEPS } from './tourSteps';
import { colors, spacing, typography, radius } from '@/constants/tokens';

const sp = (key: keyof typeof spacing): number => parseInt(spacing[key], 10);

export function TourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { tourActive, tourStep, nextStep, prevStep, skipTour } = useTourStore();
  const splits = usePlanStore((s) => s.splits);
  const activeSplitId = usePlanStore((s) => s.activeSplitId);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });
  const observerRef = useRef<MutationObserver | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const step = TOUR_STEPS[tourStep];

  const resolveRoute = useCallback(
    (route: string): string => {
      if (route.includes('[first-split]')) {
        const activeSplit = splits.find((s) => s.id === activeSplitId) ?? splits[0];
        if (!activeSplit) return '/splits';
        const encodedId = encodeURIComponent(activeSplit.id);
        return route.replace('[first-split]', encodedId);
      }
      return route;
    },
    [splits, activeSplitId],
  );

  // Navigate to required route when step changes
  useEffect(() => {
    if (!tourActive || !step) return;
    const targetRoute = resolveRoute(step.route);
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }, [tourActive, tourStep, pathname, step, resolveRoute, router]);

  // Find target element, scroll into view, update spotlight rect
  useEffect(() => {
    if (!tourActive || !step) return;

    const updateRect = (el: HTMLElement) => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        setSpotlightRect(el.getBoundingClientRect());
      }, 350);
    };

    const findAndSet = (): boolean => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        el.setAttribute('data-tour-active', 'true');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        updateRect(el);
        return true;
      }
      return false;
    };

    document.querySelectorAll('[data-tour-active]').forEach((el) =>
      el.removeAttribute('data-tour-active'),
    );
    setSpotlightRect(null);

    if (!findAndSet()) {
      observerRef.current?.disconnect();
      observerRef.current = new MutationObserver(() => {
        if (findAndSet()) observerRef.current?.disconnect();
      });
      observerRef.current.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observerRef.current?.disconnect();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      document.querySelectorAll('[data-tour-active]').forEach((el) =>
        el.removeAttribute('data-tour-active'),
      );
    };
  }, [tourActive, tourStep, step]);

  // Handle 'tap' action: intercept click, prevent natural navigation,
  // call nextStep() — tour navigation effect routes to the next step's page.
  useEffect(() => {
    if (!tourActive || step?.action !== 'tap') return;
    const el = document.querySelector(step.selector);
    if (!el) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      nextStep();
    };
    el.addEventListener('click', handler, { once: true, capture: true });
    return () => el.removeEventListener('click', handler, { capture: true } as EventListenerOptions);
  }, [tourActive, tourStep, step, nextStep]);

  if (!tourActive) return null;

  const pad = 10;
  const sr = spotlightRect;
  const { w, h } = windowSize;

  const sLeft   = sr ? Math.max(0, sr.left - pad) : 0;
  const sTop    = sr ? Math.max(0, sr.top - pad) : 0;
  const sRight  = sr ? Math.min(w, sr.right + pad) : w;
  const sBottom = sr ? Math.min(h, sr.bottom + pad) : h;

  // For bubble positioning only: cap sBottom so bubble never goes off-screen
  // when the spotlit element is taller than 65% of the viewport.
  const bubbleSBottom = sr ? Math.min(sBottom, Math.round(h * 0.65)) : h;
  const spotlightMidY = sr ? (sTop + bubbleSBottom) / 2 : h / 2;
  const bubbleAbove = sr ? spotlightMidY > h * 0.55 : false;
  const BUBBLE_TOP    = bubbleAbove ? undefined : (sr ? bubbleSBottom + 14 : Math.round(h * 0.38));
  const BUBBLE_BOTTOM = bubbleAbove ? h - sTop + 14 : undefined;

  return (
    <AnimatePresence>
      {tourActive && (
        <>
          {/* Dark overlay — 4 rects around the spotlight, spotlight itself stays clickable */}
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: sTop, background: 'rgba(0,0,0,0.80)', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()} />
            <div style={{ position: 'absolute', left: 0, top: sBottom, right: 0, bottom: 0, background: 'rgba(0,0,0,0.80)', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()} />
            <div style={{ position: 'absolute', left: 0, top: sTop, width: sLeft, height: sBottom - sTop, background: 'rgba(0,0,0,0.80)', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()} />
            <div style={{ position: 'absolute', left: sRight, top: sTop, right: 0, height: sBottom - sTop, background: 'rgba(0,0,0,0.80)', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()} />
          </div>

          {/* Spotlight ring */}
          {sr && (
            <div style={{
              position: 'fixed',
              left: sLeft, top: sTop,
              width: sRight - sLeft, height: sBottom - sTop,
              borderRadius: radius.lg,
              border: `2px solid ${colors.accent}`,
              boxShadow: `0 0 0 3px ${colors.accent}25`,
              zIndex: 9998,
              pointerEvents: 'none',
            }} />
          )}

          {/* Skip button */}
          <button
            onClick={skipTour}
            style={{
              position: 'fixed', top: sp(3), right: sp(4), zIndex: 10001,
              background: 'rgba(0,0,0,0.7)', border: `1px solid ${colors.border}`,
              borderRadius: radius.full, padding: `4px ${sp(3)}px`,
              color: colors.textMuted, cursor: 'pointer', fontSize: 12,
              fontFamily: 'var(--font-manrope)',
            }}
          >
            Tour überspringen
          </button>

          {/* Speech bubble */}
          {step && (
            <motion.div
              key={tourStep}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                position: 'fixed', zIndex: 10001,
                left: sp(4), right: sp(4),
                ...(BUBBLE_BOTTOM !== undefined ? { bottom: BUBBLE_BOTTOM } : {}),
                ...(BUBBLE_TOP   !== undefined ? { top:    BUBBLE_TOP   } : {}),
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.accent}35`,
                borderRadius: radius.xl,
                padding: sp(5),
                display: 'flex', flexDirection: 'column', gap: sp(4),
                boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${colors.accent}18`,
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: sp(2) }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: colors.bgPrimary, fontFamily: 'var(--font-barlow)', letterSpacing: '-0.5px' }}>A</span>
                </div>
                <span style={{ ...typography.label, color: colors.accent, letterSpacing: '0.08em' }}>
                  COACH ARVED
                </span>
                <span style={{ ...typography.monoSm, color: colors.textFaint, marginLeft: 'auto' }}>
                  {step.id} / {TOUR_STEPS.length}
                </span>
              </div>

              {/* Text */}
              <p style={{ ...typography.bodyLg, color: colors.textPrimary, margin: 0, lineHeight: 1.5 }}>
                {step.text}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {tourStep > 0 ? (
                  <button
                    onClick={prevStep}
                    style={{
                      background: 'transparent', border: `1px solid ${colors.border}`,
                      borderRadius: radius.md, padding: `${sp(2)}px ${sp(3)}px`,
                      color: colors.textMuted, cursor: 'pointer',
                      fontSize: 13, fontFamily: 'var(--font-manrope)',
                    }}
                  >
                    ← Zurück
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', alignItems: 'center', gap: sp(2) }}>
                  {step.action === 'tap' && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ fontSize: 12, color: colors.accent, fontFamily: 'var(--font-manrope)', fontWeight: 600 }}
                    >
                      ↑ Tippe das markierte Element
                    </motion.span>
                  )}
                  {step.action === 'next' && (() => {
                    const isLast = tourStep === TOUR_STEPS.length - 1;
                    return (
                      <button
                        onClick={isLast ? skipTour : nextStep}
                        style={{
                          backgroundColor: isLast ? colors.success : colors.accent,
                          border: 'none', borderRadius: radius.md,
                          padding: `${sp(2)}px ${sp(5)}px`,
                          color: colors.bgPrimary, cursor: 'pointer',
                          fontWeight: 700, fontSize: 14,
                          fontFamily: 'var(--font-manrope)',
                        }}
                      >
                        {isLast ? "Los geht's 🚀" : 'Weiter →'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
