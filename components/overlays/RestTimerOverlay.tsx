'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, SkipForward } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { ProgressBar } from '@/components/ui/ProgressBar';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const progress = total > 0 ? seconds / total : 0;
  const circumference = 2 * Math.PI * 80; // r=80
  const strokeDashoffset = circumference * (1 - progress);

  return createPortal(
    <div
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
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: `calc(${spacing[5]} + env(safe-area-inset-top))`,
          right: spacing[5],
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <X size={18} color={colors.textMuted} />
      </button>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ ...typography.label, color: colors.textMuted }}>PAUSE</p>
        <h2 style={{ ...typography.h2, color: colors.textPrimary, marginTop: spacing[1] }}>
          Erholung
        </h2>
      </div>

      {/* Circular Timer */}
      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={colors.bgHighest}
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={seconds <= 10 ? colors.danger : colors.accent}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>

        {/* Time Display */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              ...typography.displayXL,
              color: seconds <= 10 ? colors.danger : colors.textPrimary,
              transition: 'color 0.3s',
              fontSize: '48px',
              lineHeight: '1',
            }}
          >
            {formatDuration(seconds)}
          </span>
        </div>
      </div>

      {/* Quick adjust buttons — Timer auf gewünschte Dauer setzen */}
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
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontWeight: isActive ? '700' : '400',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = colors.accent;
                  (e.currentTarget as HTMLButtonElement).style.color = colors.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    isActive ? colors.accent : colors.border;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    isActive ? colors.accent : colors.textMuted;
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
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          padding: `${spacing[3]} ${spacing[5]}`,
          borderRadius: radius.full,
          border: `1px solid ${colors.border}`,
          backgroundColor: 'transparent',
          ...typography.body,
          color: colors.textMuted,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <SkipForward size={16} />
        Überspringen
      </button>
    </div>,
    document.body
  );
}
