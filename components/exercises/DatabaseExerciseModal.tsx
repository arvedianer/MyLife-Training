import React from 'react';
import { X } from 'lucide-react';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import type { Exercise } from '@/types/exercise';
import { Badge } from '@/components/ui/Badge';
import { BodyHeatmap } from '@/components/ui/BodyHeatmap';

interface Props {
    exercise: Exercise;
    onClose: () => void;
}

export function DatabaseExerciseModal({ exercise, onClose }: Props) {
    const muscleWeights = React.useMemo(() => {
        const weights: Record<string, number> = {};
        const mapMuscle = (m: string, weight: number) => {
            const mapped = m.toLowerCase();
            if (mapped === 'abdominals') weights['core'] = (weights['core'] || 0) + weight;
            else if (mapped === 'glutes') weights['glutes'] = (weights['glutes'] || 0) + weight;
            else if (mapped === 'shoulders') weights['shoulders'] = (weights['shoulders'] || 0) + weight;
            else if (mapped === 'quadriceps') weights['quads'] = (weights['quads'] || 0) + weight;
            else if (mapped === 'hamstrings') weights['hamstrings'] = (weights['hamstrings'] || 0) + weight;
            else if (mapped === 'lower back') weights['back'] = (weights['back'] || 0) + weight;
            else if (mapped === 'middle back') weights['back'] = (weights['back'] || 0) + weight;
            else if (mapped === 'lats') weights['back'] = (weights['back'] || 0) + weight;
            else if (mapped === 'calves') weights['calves'] = (weights['calves'] || 0) + weight;
            else if (mapped === 'triceps') weights['triceps'] = (weights['triceps'] || 0) + weight;
            else if (mapped === 'biceps') weights['biceps'] = (weights['biceps'] || 0) + weight;
            else if (mapped === 'chest') weights['chest'] = (weights['chest'] || 0) + weight;
            else if (mapped === 'forearms') weights['forearms'] = (weights['forearms'] || 0) + weight;
            else if (mapped === 'traps') weights['back'] = (weights['back'] || 0) + weight;
            else if (mapped === 'neck') weights['neck'] = (weights['neck'] || 0) + weight;
            else if (mapped === 'adductors') weights['legs'] = (weights['legs'] || 0) + weight;
            else if (mapped === 'abductors') weights['legs'] = (weights['legs'] || 0) + weight;
        };

        exercise.primaryMuscles.forEach(m => mapMuscle(m, 3));
        exercise.secondaryMuscles.forEach(m => mapMuscle(m, 1));

        return weights;
    }, [exercise]);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: colors.bgPrimary,
                    borderTopLeftRadius: radius['2xl'],
                    borderTopRightRadius: radius['2xl'],
                    borderTop: `1px solid ${colors.borderLight}`,
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${spacing[4]} ${spacing[5]}`,
                        borderBottom: `1px solid ${colors.borderLight}`,
                    }}
                >
                    <h2 style={{ ...typography.h3, color: colors.textPrimary, margin: 0 }}>
                        {exercise.name}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: colors.textMuted,
                            cursor: 'pointer',
                            padding: spacing[1],
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: spacing[5], overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[6] }}>
                        <Badge variant="accent">{exercise.category}</Badge>
                        <Badge variant="muted">{exercise.level}</Badge>
                        {exercise.equipment && <Badge variant="muted">{exercise.equipment}</Badge>}
                        {exercise.force && <Badge variant="muted">{exercise.force}</Badge>}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing[6],
                        ...(typeof window !== 'undefined' && window.innerWidth > 768 ? { flexDirection: 'row' as const } : {})
                    }}>
                        <div style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing[4], border: `1px solid ${colors.borderLight}` }}>
                            <h3 style={{ ...typography.bodyLg, color: colors.textPrimary, marginBottom: spacing[3] }}>Belastete Muskeln</h3>
                            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', marginBottom: spacing[4] }}>
                                {exercise.primaryMuscles.map(m => (
                                    <span key={m} style={{ ...typography.label, color: colors.danger }}>{m}</span>
                                ))}
                                {exercise.secondaryMuscles.map(m => (
                                    <span key={m} style={{ ...typography.label, color: colors.warning }}>{m}</span>
                                ))}
                            </div>
                            <div style={{ height: '300px' }}>
                                <BodyHeatmap muscleSets={muscleWeights} maxSets={3} />
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
                            {exercise.images && exercise.images.length > 0 && (
                                <div style={{ display: 'flex', gap: spacing[3], overflowX: 'auto', paddingBottom: spacing[2] }}>
                                    {exercise.images.map(img => (
                                        <div key={img} style={{
                                            flexShrink: 0,
                                            width: '200px',
                                            height: '200px',
                                            borderRadius: radius.lg,
                                            overflow: 'hidden',
                                            backgroundColor: colors.bgElevated,
                                            border: `1px solid ${colors.borderLight}`
                                        }}>
                                            <img
                                                src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${img}`}
                                                alt={exercise.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <h3 style={{ ...typography.bodyLg, color: colors.textPrimary, marginBottom: spacing[3] }}>Ausführung</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                                    {exercise.instructions.map((step, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: spacing[3] }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: colors.accentBg,
                                                color: colors.accent,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                ...typography.label,
                                                fontWeight: 600
                                            }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ ...typography.body, color: colors.textSecondary, lineHeight: 1.5 }}>
                                                {step}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
