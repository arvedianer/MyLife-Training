'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { Button } from '@/components/ui/Button';

interface CancelWorkoutOverlayProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function CancelWorkoutOverlay({
    isOpen,
    onConfirm,
    onCancel,
}: CancelWorkoutOverlayProps) {
    const [mounted, setMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onCancel();
            setIsClosing(false);
        }, 300); // match animation duration
    };

    if (!mounted || (!isOpen && !isClosing)) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
            }}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `${colors.bgPrimary}B0`,
                    backdropFilter: 'blur(4px)',
                    opacity: isClosing ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                }}
                onClick={handleClose}
            />

            {/* Bottom Sheet */}
            <div
                style={{
                    position: 'relative',
                    backgroundColor: colors.bgElevated,
                    borderTopLeftRadius: radius['2xl'],
                    borderTopRightRadius: radius['2xl'],
                    padding: spacing[6],
                    paddingBottom: `calc(${spacing[6]} + env(safe-area-inset-bottom))`,
                    transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
                    transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: spacing[4],
                    borderTop: `1px solid ${colors.borderLight}`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Grabber handle */}
                <div
                    style={{
                        width: '40px',
                        height: '4px',
                        backgroundColor: colors.borderLight,
                        borderRadius: radius.full,
                        marginBottom: spacing[2],
                        cursor: 'grab',
                    }}
                    onClick={handleClose}
                />

                <div
                    style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: `${colors.danger}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: spacing[1],
                    }}
                >
                    <AlertTriangle size={28} color={colors.danger} />
                </div>

                <h3 style={{ ...typography.h3, color: colors.textPrimary, textAlign: 'center' }}>
                    Workout abbrechen?
                </h3>

                <p style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', marginBottom: spacing[2] }}>
                    Bist du sicher, dass du das aktuelle Training wirklich abbrechen möchtest? Alle bisherigen Sätze dieser Session gehen verloren.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: spacing[3] }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            width: '100%',
                            padding: spacing[4],
                            borderRadius: radius.xl,
                            backgroundColor: `${colors.danger}20`,
                            color: colors.danger,
                            border: `1px solid ${colors.danger}40`,
                            ...typography.body,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing[2],
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = `${colors.danger}30`)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = `${colors.danger}20`)}
                    >
                        <Trash2 size={18} />
                        Workout verwerfen
                    </button>

                    <Button variant="ghost" fullWidth onClick={handleClose} size="lg">
                        Nein, weiter trainieren
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
