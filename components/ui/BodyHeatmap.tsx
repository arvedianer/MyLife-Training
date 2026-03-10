'use client';

import React from 'react';
import styles from './BodyHeatmap.module.css';
import { bodyFront, BodyPart } from './bodyFront';
import { bodyBack } from './bodyBack';

interface BodyHeatmapProps {
    muscleSets: Record<string, number>;
    maxSets: number;
}

const HEAT_COLORS = [
    'rgba(255, 80, 50, 0.62)',
    'rgba(238, 34, 54, 0.80)',
    'rgba(190, 22, 128, 0.90)',
    'rgba(138, 43, 200, 0.96)',
];

function heatColor(sets: number, max: number): string | null {
    if (sets === 0 || max === 0) return null;
    const r = Math.min(sets / max, 1);
    if (r < 0.25) return HEAT_COLORS[0];
    if (r < 0.50) return HEAT_COLORS[1];
    if (r < 0.75) return HEAT_COLORS[2];
    return HEAT_COLORS[3];
}

const BODY_FILL = '#272736';   // lighter than bgPrimary — body clearly visible
const BODY_STROKE = '#42425C'; // visible separator between muscle paths

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

function getPartColor(slug: string, muscleSets: Record<string, number>, maxSets: number) {
    const keys = slugMap[slug] || [];
    for (const key of keys) {
        if (muscleSets[key]) {
            return heatColor(muscleSets[key], maxSets);
        }
    }
    return null;
}

function BodyPartPaths({ items, isBack, muscleSets, maxSets }: { items: BodyPart[], isBack: boolean, muscleSets: Record<string, number>, maxSets: number }) {
    return (
        <g>
            {items.map((part) => {
                const highlight = getPartColor(part.slug, muscleSets, maxSets);
                const fill = highlight || BODY_FILL;
                const pathGlow = highlight ? (isBack ? 'url(#muscleGlowBack)' : 'url(#muscleGlow)') : undefined;
                const className = highlight ? styles.muscleActive : styles.muscleOverlay;

                const renderPaths = (paths?: string[]) => {
                    if (!paths) return null;
                    return paths.map((d, i) => (
                        <path key={d + i} d={d} fill={fill} stroke={BODY_STROKE} strokeWidth={1.5} filter={pathGlow} className={className} />
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

export default function BodyHeatmap({ muscleSets, maxSets }: BodyHeatmapProps) {
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
                {HEAT_COLORS.map((c, i) => (
                    <div key={i} className={styles.scaleBlock} style={{ backgroundColor: c }} />
                ))}
                <span className={styles.scaleLabel}>Viel</span>
            </div>
        </div>
    );
}
