'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Play } from 'lucide-react';
import { useWorkoutStore } from '@/store/workoutStore';
import { colors, spacing, radius, typography } from '@/constants/tokens';
import { formatDuration } from '@/utils/dates';

export function ActiveWorkoutBanner() {
    const { activeWorkout } = useWorkoutStore();
    const pathname = usePathname();
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Synchronise timer
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (activeWorkout) {
            intervalRef.current = setInterval(() => {
                setElapsed(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
            }, 1000);
            setElapsed(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [activeWorkout]);

    // Don't show if there is no active workout OR if we are currently ON the active workout page
    if (!activeWorkout || pathname?.startsWith('/workout/active')) {
        return null;
    }

    return (
        <Link href="/workout/active" style={{ textDecoration: 'none' }}>
            <div
                style={{
                    padding: `${spacing[3]} ${spacing[4]}`,
                    backgroundColor: `${colors.accent}15`,
                    borderTop: `1px solid ${colors.accent}40`,
                    borderBottom: `1px solid ${colors.accent}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: `${colors.accent}25`,
                            border: `1px solid ${colors.accent}60`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse 2s infinite',
                        }}
                    >
                        <Play size={14} fill={colors.accent} color={colors.accent} />
                    </div>
                    <div>
                        <div style={{ ...typography.bodySm, color: colors.textPrimary, fontWeight: 600 }}>
                            {activeWorkout.plannedSplit || 'Freies Training'}
                        </div>
                        <div style={{ ...typography.monoSm, color: colors.accent }}>
                            {formatDuration(elapsed)}
                        </div>
                    </div>
                </div>

                <div style={{ ...typography.label, color: colors.accent, fontWeight: 600 }}>
                    ZURÜCK
                </div>

                <style>{`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 ${colors.accent}40; }
            70% { box-shadow: 0 0 0 6px transparent; }
            100% { box-shadow: 0 0 0 0 transparent; }
          }
        `}</style>
            </div>
        </Link>
    );
}
