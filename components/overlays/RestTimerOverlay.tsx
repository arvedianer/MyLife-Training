'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, SkipForward, Minimize2, Maximize2 } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { formatDuration } from '@/utils/dates';

interface RestTimerOverlayProps {
  isOpen: boolean;
  seconds: number;
  total: number;
  onClose: () => void;
  onRestart: (seconds: number) => void;
}

export function RestTimerOverlay({
  isOpen,
  seconds,
  total,
  onClose,
  onRestart,
}: RestTimerOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auto-expand when timer finishes (so user sees it ended)
  useEffect(() => {
    if (seconds === 0 && minimized) setMinimized(false);
  }, [seconds, minimized]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) setMinimized(false);
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const progress = total > 0 ? seconds / total : 0;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - progress);
  const isWarning = seconds <= 10;
  const ringColor = isWarning ? colors.danger : colors.accent;

  // ── Minimized: floating chip top-right ─────────────────────────────────
  if (minimized) {
    const miniC = 2 * Math.PI * 18;
    const miniOffset = miniC * (1 - progress);
    return createPortal(
      <button
        onClick={() => setMinimized(false)}
        title="Timer aufklappen"
        style={{
          position: 'fixed',
          top: `calc(${spacing[4]} + env(safe-area-inset-top))`,
          right: spacing[4],
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          padding: `${spacing[2]} ${spacing[3]}`,
          backgroundColor: colors.bgCard,
          border: `1px solid ${ringColor}60`,
          borderRadius: radius.full,
          cursor: 'pointer',
          boxShadow: `0 4px 16px ${ringColor}30`,
          transition: 'border-color 0.3s',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <circle cx="20" cy="20" r="18" fill="none" stroke={colors.bgHighest} strokeWidth="3" />
          <circle
            cx="20" cy="20" r="18" fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={miniC}
            strokeDashoffset={miniOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <span style={{
          ...typography.monoLg, fontSize: '16px',
          color: isWarning ? colors.danger : colors.textPrimary,
          minWidth: '36px', textAlign: 'center',
          transition: 'color 0.3s',
        }}>
          {formatDuration(seconds)}
        </span>
        <Maximize2 size={14} color={colors.textFaint} />
      </button>,
      document.body,
    );
  }

  // ── Full overlay ────────────────────────────────────────────────────────
  return createPortal(
    <div
      data-tour="rest-timer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: `${colors.bgPrimary}F0`,
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[8],
      }}
    >
      {/* Top-right: minimize + close */}
      <div style={{
        position: 'absolute',
        top: `calc(${spacing[5]} + env(safe-area-inset-top))`,
        right: spacing[5],
        display: 'flex',
        gap: spacing[2],
      }}>
        <button
          onClick={() => setMinimized(true)}
          title="Einklappen — Timer läuft weiter"
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Minimize2 size={16} color={colors.textMuted} />
        </button>
        <button
          onClick={onClose}
          title="Timer stoppen"
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={18} color={colors.textMuted} />
        </button>
      </div>

      {/* Minimize hint */}
      <p style={{ ...typography.label, fontSize: '9px', color: colors.textFaint, letterSpacing: '0.05em' }}>
        PAUSE — TIMER LÄUFT
      </p>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: `-${spacing[6]}` }}>
        <h2 style={{ ...typography.h2, color: colors.textPrimary }}>Erholung</h2>
        <p style={{ ...typography.bodySm, color: colors.textFaint, marginTop: '4px' }}>
          Einklappen um Übungen zu sehen →
        </p>
      </div>

      {/* Circular Timer */}
      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r="80" fill="none" stroke={colors.bgHighest} strokeWidth="8" />
          <circle
            cx="100" cy="100" r="80" fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            ...typography.displayXL,
            color: isWarning ? colors.danger : colors.textPrimary,
            transition: 'color 0.3s', fontSize: '48px', lineHeight: '1',
          }}>
            {formatDuration(seconds)}
          </span>
        </div>
      </div>

      {/* Quick adjust */}
      <div>
        <p style={{ ...typography.label, color: colors.textFaint, textAlign: 'center', marginBottom: spacing[2] }}>
          PAUSE SETZEN
        </p>
        <div style={{ display: 'flex', gap: spacing[3] }}>
          {[30, 60, 90, 120].map((secs) => {
            const isActive = secs === total;
            return (
              <button
                key={secs}
                onClick={() => onRestart(secs)}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: radius.full,
                  border: `1px solid ${isActive ? colors.accent : colors.border}`,
                  backgroundColor: isActive ? colors.accentBg : colors.bgCard,
                  ...typography.bodySm,
                  color: isActive ? colors.accent : colors.textMuted,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontWeight: isActive ? '700' : '400',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = colors.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = colors.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = isActive ? colors.accent : colors.border;
                  (e.currentTarget as HTMLButtonElement).style.color = isActive ? colors.accent : colors.textMuted;
                }}
              >
                {secs}s
              </button>
            );
          })}
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onClose}
        style={{
          display: 'flex', alignItems: 'center', gap: spacing[2],
          padding: `${spacing[3]} ${spacing[5]}`, borderRadius: radius.full,
          border: `1px solid ${colors.border}`, backgroundColor: 'transparent',
          ...typography.body, color: colors.textMuted, cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <SkipForward size={16} />
        Überspringen
      </button>
    </div>,
    document.body,
  );
}
