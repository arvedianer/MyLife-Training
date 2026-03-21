'use client';

import React from 'react';
import styles from './BodyHeatmap.module.css';
import { bodyFront, BodyPart } from './bodyFront';
import { bodyBack } from './bodyBack';
import { colors, spacing } from '@/constants/tokens';

interface BodyHeatmapProps {
    muscleSets: Record<string, number>;
    maxSets: number;
    compact?: boolean;
}

const HEAT_COLORS = [
    { fill: '#3DFFE6', opacity: 0.50 },  // accent cyan — low volume
    { fill: '#4A9EFF', opacity: 0.65 },  // volume blue — mid volume
    { fill: '#BF6FFF', opacity: 0.80 },  // pr purple  — high volume
];

function getMuscleStyle(sets: number, max: number): { fill: string; fillOpacity: number } {
    if (sets === 0 || max === 0) return { fill: 'transparent', fillOpacity: 0 };
    const ratio = Math.min(sets / Math.max(max, 1), 1);
    if (ratio < 0.4)  return { fill: '#3DFFE6', fillOpacity: 0.5 + ratio * 0.5 };  // accent cyan
    if (ratio < 0.75) return { fill: '#4A9EFF', fillOpacity: 0.65 };                // volume blue
    return { fill: '#BF6FFF', fillOpacity: 0.80 };                                   // pr purple
}

const BODY_FILL = 'transparent';      // no background tint — sit on parent background
const BODY_STROKE = colors.border;    // visible separator between muscle paths

const slugMap: Record<string, string[]> = {
  abs: ['core'],
  obliques: ['core'],
  biceps: ['biceps'],
  chest: ['chest'],
  deltoids: ['shoulders'],
  forearm: ['forearms'],
  triceps: ['triceps'],
  neck: ['neck'],
  calves: ['calves'],
  hamstring: ['hamstrings', 'legs'],
  quadriceps: ['quads', 'legs'],
  gluteal: ['glutes', 'legs'],
  trapezius: ['back'],
  'upper-back': ['back'],
  'lower-back': ['back'],
  adductors: ['legs'],
};

function getPartStyle(slug: string, muscleSets: Record<string, number>, maxSets: number): { fill: string; fillOpacity: number } {
    const keys = slugMap[slug] || [];
    for (const key of keys) {
        if (muscleSets[key]) {
            return getMuscleStyle(muscleSets[key], maxSets);
        }
    }
    return { fill: BODY_FILL, fillOpacity: 1 };
}

function BodyPartPaths({ items, isBack, muscleSets, maxSets }: { items: BodyPart[], isBack: boolean, muscleSets: Record<string, number>, maxSets: number }) {
    return (
        <g>
            {items.map((part) => {
                const muscleStyle = getPartStyle(part.slug, muscleSets, maxSets);
                const isActive = muscleStyle.fill !== BODY_FILL && muscleStyle.fill !== 'transparent';
                const pathGlow = isActive ? (isBack ? 'url(#muscleGlowBack)' : 'url(#muscleGlow)') : undefined;
                const className = isActive ? styles.muscleActive : styles.muscleOverlay;

                const renderPaths = (paths?: string[]) => {
                    if (!paths) return null;
                    return paths.map((d, i) => (
                        <path
                            key={d + i}
                            d={d}
                            fill={muscleStyle.fill}
                            fillOpacity={muscleStyle.fillOpacity}
                            stroke={BODY_STROKE}
                            strokeWidth={1.5}
                            filter={pathGlow}
                            className={className}
                        />
                    ));
                };

                return (
                    <g key={part.slug} id={part.slug}>
                        {renderPaths(part.path.common)}
                        {renderPaths(part.path.left)}
                        {renderPaths(part.path.right)}
                    </g>
                );
            })}
        </g>
    );
}

const FRONT_OUTLINE = "";
const BACK_OUTLINE = "";

function FrontBody({ muscleSets, maxSets }: BodyHeatmapProps) {
    return (
        <svg viewBox="0 20 724 1400" width="100%" height="100%" style={{ display: 'block', maxHeight: '400px' }}>
            <defs>
                <filter id="muscleGlow">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path d={FRONT_OUTLINE} fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth={2.5} />
            <BodyPartPaths items={bodyFront} isBack={false} muscleSets={muscleSets} maxSets={maxSets} />
        </svg>
    );
}

function BackBody({ muscleSets, maxSets }: BodyHeatmapProps) {
    return (
        <svg viewBox="724 20 724 1400" width="100%" height="100%" style={{ display: 'block', maxHeight: '400px' }}>
            <defs>
                <filter id="muscleGlowBack">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <path d={BACK_OUTLINE} fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth={2.5} />
            <BodyPartPaths items={bodyBack} isBack={true} muscleSets={muscleSets} maxSets={maxSets} />
        </svg>
    );
}

export function BodyHeatmap({ muscleSets, maxSets, compact = false }: BodyHeatmapProps) {
    if (compact) {
        return (
            <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center', height: '120px' }}>
                <div style={{ width: '60px', height: '120px' }}>
                    <FrontBody muscleSets={muscleSets} maxSets={maxSets} />
                </div>
                <div style={{ width: '60px', height: '120px' }}>
                    <BackBody muscleSets={muscleSets} maxSets={maxSets} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.bodies}>
                <div className={styles.bodyColumn}>
                    <span className={styles.viewLabel}>VORNE</span>
                    <FrontBody muscleSets={muscleSets} maxSets={maxSets} />
                </div>
                <div className={styles.bodyColumn}>
                    <span className={styles.viewLabel}>HINTEN</span>
                    <BackBody muscleSets={muscleSets} maxSets={maxSets} />
                </div>
            </div>

            <div className={styles.scaleLegend}>
                <span className={styles.scaleLabel}>Wenig</span>
                {HEAT_COLORS.map((stop, i) => (
                    <div key={i} className={styles.scaleBlock} style={{ backgroundColor: stop.fill, opacity: stop.opacity }} />
                ))}
                <span className={styles.scaleLabel}>Viel</span>
            </div>
        </div>
    );
}

