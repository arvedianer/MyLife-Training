'use client';

import React from 'react';
import styles from './BodyHeatmap.module.css';
import { bodyFront, BodyPart } from './bodyFront';
import { bodyBack } from './bodyBack';
import { spacing } from '@/constants/tokens';

interface BodyHeatmapProps {
    muscleSets: Record<string, number>;
    maxSets: number;
    compact?: boolean;
}

const LEGEND_ITEMS = [
    { color: '#FFFFFF', opacity: 0.04, label: 'Kein Training' },
    { color: '#4A9EFF', opacity: 0.55, label: 'Wenig' },
    { color: '#34C759', opacity: 0.65, label: 'Gut' },
    { color: '#FF9F0A', opacity: 0.75, label: 'Intensiv' },
    { color: '#FF3B30', opacity: 0.85, label: 'Max' },
];

function getMuscleStyle(sets: number, max: number): { fill: string; fillOpacity: number } {
    if (sets === 0 || max === 0) {
        // Untrained: very subtle but visible so the silhouette shows
        return { fill: '#FFFFFF', fillOpacity: 0.04 };
    }
    const ratio = sets / Math.max(max, 1);

    if (ratio <= 0.25) {
        // Low volume — blue (calm, "just getting started")
        return { fill: '#4A9EFF', fillOpacity: 0.55 };
    }
    if (ratio <= 0.5) {
        // Medium volume — green (positive, "good work")
        return { fill: '#34C759', fillOpacity: 0.65 };
    }
    if (ratio <= 0.75) {
        // High volume — orange (alert, "pushing hard")
        return { fill: '#FF9F0A', fillOpacity: 0.75 };
    }
    // Max volume — red (intense, "maxed out")
    return { fill: '#FF3B30', fillOpacity: 0.85 };
}

const BODY_FILL = 'transparent';                  // no background tint — sit on parent background
const BODY_STROKE = 'rgba(255,255,255,0.15)';     // subtle white outline so silhouette is visible on dark bg

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
    // Untrained — use same subtle white so silhouette is visible against dark background
    return getMuscleStyle(0, maxSets);
}

function BodyPartPaths({ items, isBack, muscleSets, maxSets }: { items: BodyPart[], isBack: boolean, muscleSets: Record<string, number>, maxSets: number }) {
    return (
        <g>
            {items.map((part) => {
                const muscleStyle = getPartStyle(part.slug, muscleSets, maxSets);
                const isActive = muscleStyle.fillOpacity > 0.04;
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

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
                {LEGEND_ITEMS.map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: item.color,
                            opacity: item.opacity,
                            border: '1px solid rgba(255,255,255,0.2)',
                            flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted, #AAAAAA)' }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

