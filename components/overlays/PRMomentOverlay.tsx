'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { colors, typography, spacing } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';

interface PRMomentOverlayProps {
  isOpen: boolean;
  exerciseName: string;
  weight?: number;
  reps?: number;
  onClose: () => void;
}

export function PRMomentOverlay({
  isOpen,
  exerciseName,
  weight,
  reps,
  onClose,
}: PRMomentOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close nach 4 Sekunden — onClose bewusst aus deps entfernt (stabiler Ref via useCallback im Parent)
  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(onClose, 4000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: `${colors.bgPrimary}E0`,
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[6],
        textAlign: 'center',
        padding: spacing[6],
      }}
      onClick={onClose}
    >
      {/* Stars */}
      <div style={{ display: 'flex', gap: spacing[2] }}>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={28}
            color={colors.accent}
            fill={colors.accent}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      {/* Text */}
      <div>
        <p style={{ ...typography.label, color: colors.accent, marginBottom: spacing[2] }}>
          NEUER REKORD!
        </p>
        <h1 style={{ ...typography.display, color: colors.textPrimary, marginBottom: spacing[2] }}>
          Personal Record
        </h1>
        <h2 style={{ ...typography.h2, color: colors.accent }}>
          {exerciseName}
        </h2>
        {weight && reps && (
          <p style={{ ...typography.bodyLg, color: colors.textMuted, marginTop: spacing[3] }}>
            {weight} kg × {reps} Wdh.
          </p>
        )}
      </div>

      <Button variant="secondary" onClick={onClose}>
        Weiter trainieren
      </Button>

      <p style={{ ...typography.bodySm, color: colors.textDisabled }}>
        Tippe irgendwo um fortzufahren
      </p>
    </div>,
    document.body
  );
}
