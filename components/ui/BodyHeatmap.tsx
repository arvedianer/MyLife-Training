'use client';

import React from 'react';
import styles from './BodyHeatmap.module.css';

/* ────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────── */
interface BodyHeatmapProps {
    muscleSets: Record<string, number>;
    maxSets: number;
}

/* ────────────────────────────────────────────────────
   Color helpers
   ──────────────────────────────────────────────────── */
const HEAT_COLORS = [
    'rgba(255, 80, 50, 0.62)',   // low
    'rgba(238, 34, 54, 0.80)',
    'rgba(190, 22, 128, 0.90)',
    'rgba(138, 43, 200, 0.96)',  // high
];

function heatColor(sets: number, max: number): string | null {
    if (sets === 0 || max === 0) return null;
    const r = Math.min(sets / max, 1);
    if (r < 0.25) return HEAT_COLORS[0];
    if (r < 0.50) return HEAT_COLORS[1];
    if (r < 0.75) return HEAT_COLORS[2];
    return HEAT_COLORS[3];
}

/* Body base colors */
const BODY_FILL = '#1A1A22';
const BODY_STROKE = '#2C2C38';
const OUTLINE_FILL = '#20202A';

/* ────────────────────────────────────────────────────
   Front Body SVG
   ──────────────────────────────────────────────────── */
function FrontBody({ muscleSets, maxSets }: BodyHeatmapProps) {
    const h = (m: string) => heatColor(muscleSets[m] || 0, maxSets);
    const chest = h('chest');
    const shoulders = h('shoulders');
    const biceps = h('biceps');
    const core = h('core');
    const quads = h('quads') ?? h('legs');
    const calves = h('calves');
    const forearms = h('forearms');
    const adductors = h('adductors');
    const neck = h('neck');

    return (
        <svg viewBox="0 0 200 440" width="160" height="352" style={{ display: 'block' }}>
            <defs>
                <filter id="muscleGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* ══════════ BASE BODY SILHOUETTE ══════════ */}

            {/* Head */}
            <ellipse cx="100" cy="30" rx="22" ry="26" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            {/* Ears */}
            <ellipse cx="77" cy="30" rx="4" ry="7" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <ellipse cx="123" cy="30" rx="4" ry="7" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />

            {/* Neck */}
            <path d="M90,54 L90,68 C90,72 92,74 96,74 L104,74 C108,74 110,72 110,68 L110,54"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Torso – anatomical trapezoid with waist taper */}
            <path d="M68,82 C56,86 44,96 38,116 C34,132 36,152 40,168
               C44,180 52,190 60,196 L68,200
               L80,206 L100,210 L120,206 L132,200 L140,196
               C148,190 156,180 160,168
               C164,152 166,132 162,116
               C156,96 144,86 132,82 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1.2" />

            {/* Shoulder caps – rounded deltoid shape */}
            <path d="M68,82 C52,78 36,84 28,100 C24,110 26,118 34,122 C40,118 50,112 58,106 C64,100 66,90 68,82 Z"
                fill={OUTLINE_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M132,82 C148,78 164,84 172,100 C176,110 174,118 166,122 C160,118 150,112 142,106 C136,100 134,90 132,82 Z"
                fill={OUTLINE_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Upper arms */}
            <path d="M34,122 C26,134 22,150 24,166 C26,178 32,184 40,182
               C46,180 48,170 48,158 C48,144 44,132 34,122 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M166,122 C174,134 178,150 176,166 C174,178 168,184 160,182
               C154,180 152,170 152,158 C152,144 156,132 166,122 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Forearms */}
            <path d="M24,166 C18,180 16,198 20,212 C23,222 30,226 38,222
               C44,218 46,206 44,192 C42,180 36,170 24,166 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M176,166 C182,180 184,198 180,212 C177,222 170,226 162,222
               C156,218 154,206 156,192 C158,180 164,170 176,166 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Hands */}
            <path d="M20,212 C16,222 14,232 18,238 C22,244 30,244 36,238 C40,232 40,224 38,222 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <path d="M180,212 C184,222 186,232 182,238 C178,244 170,244 164,238 C160,232 160,224 162,222 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />

            {/* Hip / pelvis area */}
            <path d="M80,206 C68,210 62,220 64,232 L72,240 L100,244 L128,240 L136,232
               C138,220 132,210 120,206 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Thighs */}
            <path d="M72,240 C58,254 50,278 52,304 C54,322 62,334 72,332
               C82,330 86,316 86,298 C86,274 82,254 72,240 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M128,240 C142,254 150,278 148,304 C146,322 138,334 128,332
               C118,330 114,316 114,298 C114,274 118,254 128,240 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Knees */}
            <ellipse cx="72" cy="338" rx="14" ry="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <ellipse cx="128" cy="338" rx="14" ry="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />

            {/* Calves / Shins */}
            <path d="M58,342 C50,356 48,376 52,392 C55,402 62,406 70,404
               C78,402 82,392 80,376 C78,358 74,346 58,342 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M142,342 C150,356 152,376 148,392 C145,402 138,406 130,404
               C122,402 118,392 120,376 C122,358 126,346 142,342 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Feet */}
            <path d="M52,392 C44,402 40,416 46,422 C52,428 66,428 76,422 C82,416 82,406 70,404 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <path d="M148,392 C156,402 160,416 154,422 C148,428 134,428 124,422 C118,416 118,406 130,404 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />


            {/* ══════════ MUSCLE OVERLAYS (Front) ══════════ */}

            {/* ── Neck / Traps (front) ── */}
            {neck && (
                <path d="M90,56 C86,62 80,72 76,80 L88,82 L100,82 L112,82 L124,80
                 C120,72 114,62 110,56 Z"
                    fill={neck} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            )}

            {/* ── Shoulders / Deltoids ── */}
            {shoulders && <>
                <path d="M68,82 C54,80 38,86 30,102 C26,110 28,118 36,120
                 C42,116 52,108 60,102 C66,96 68,88 68,82 Z"
                    fill={shoulders} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <path d="M132,82 C146,80 162,86 170,102 C174,110 172,118 164,120
                 C158,116 148,108 140,102 C134,96 132,88 132,82 Z"
                    fill={shoulders} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            </>}

            {/* ── Chest / Pectorals ── */}
            {chest && <>
                {/* Left pec – anatomical fan shape */}
                <path d="M68,90 C62,96 54,106 52,118 C50,130 56,140 68,142
                 C80,142 90,134 96,122 C98,114 98,104 96,96 C92,88 80,86 68,90 Z"
                    fill={chest} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                {/* Right pec */}
                <path d="M132,90 C138,96 146,106 148,118 C150,130 144,140 132,142
                 C120,142 110,134 104,122 C102,114 102,104 104,96 C108,88 120,86 132,90 Z"
                    fill={chest} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            </>}

            {/* ── Biceps ── */}
            {biceps && <>
                <path d="M34,126 C28,138 24,154 26,168 C28,178 34,182 40,180
                 C46,176 48,166 46,152 C44,140 40,130 34,126 Z"
                    fill={biceps} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <path d="M166,126 C172,138 176,154 174,168 C172,178 166,182 160,180
                 C154,176 152,166 154,152 C156,140 160,130 166,126 Z"
                    fill={biceps} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            </>}

            {/* ── Forearms ── */}
            {forearms && <>
                <path d="M24,170 C18,184 16,200 20,214 C24,222 32,224 38,220
                 C42,214 44,202 42,190 C40,178 34,172 24,170 Z"
                    fill={forearms} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <path d="M176,170 C182,184 184,200 180,214 C176,222 168,224 162,220
                 C158,214 156,202 158,190 C160,178 166,172 176,170 Z"
                    fill={forearms} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            </>}

            {/* ── Core / Abs – 6 pack ── */}
            {core && <>
                {/* Upper abs */}
                <rect x="82" y="148" width="14" height="14" rx="3" fill={core} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <rect x="104" y="148" width="14" height="14" rx="3" fill={core} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                {/* Mid abs */}
                <rect x="82" y="166" width="14" height="14" rx="3" fill={core} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <rect x="104" y="166" width="14" height="14" rx="3" fill={core} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                {/* Lower abs */}
                <rect x="83" y="184" width="13" height="12" rx="3" fill={core} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <rect x="104" y="184" width="13" height="12" rx="3" fill={core} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                {/* Obliques */}
                <path d="M66,146 C60,158 58,172 62,186 C64,192 70,196 76,194
                 C80,190 82,180 80,168 C78,156 74,146 66,146 Z"
                    fill={core} opacity={0.55} className={styles.muscleOverlay} />
                <path d="M134,146 C140,158 142,172 138,186 C136,192 130,196 124,194
                 C120,190 118,180 120,168 C122,156 126,146 134,146 Z"
                    fill={core} opacity={0.55} className={styles.muscleOverlay} />
            </>}

            {/* ── Adductors (inner thigh) ── */}
            {adductors && <>
                <path d="M86,244 C90,260 94,280 92,300 C90,312 86,318 82,314
                 C78,308 76,290 78,272 C80,258 82,248 86,244 Z"
                    fill={adductors} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <path d="M114,244 C110,260 106,280 108,300 C110,312 114,318 118,314
                 C122,308 124,290 122,272 C120,258 118,248 114,244 Z"
                    fill={adductors} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            </>}

            {/* ── Quads ── */}
            {quads && <>
                {/* Left quad – outer sweep */}
                <path d="M72,244 C60,258 52,282 54,306 C56,322 64,332 72,330
                 C80,328 84,314 84,296 C84,272 80,252 72,244 Z"
                    fill={quads} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                {/* Right quad */}
                <path d="M128,244 C140,258 148,282 146,306 C144,322 136,332 128,330
                 C120,328 116,314 116,296 C116,272 120,252 128,244 Z"
                    fill={quads} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            </>}

            {/* ── Calves (front – tibialis) ── */}
            {calves && <>
                <path d="M60,344 C52,358 50,378 54,394 C58,402 64,406 70,402
                 C76,398 80,386 78,372 C76,358 70,348 60,344 Z"
                    fill={calves} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
                <path d="M140,344 C148,358 150,378 146,394 C142,402 136,406 130,402
                 C124,398 120,386 122,372 C124,358 130,348 140,344 Z"
                    fill={calves} className={styles.muscleOverlay} filter="url(#muscleGlow)" />
            </>}

            {/* Midline groove */}
            <line x1="100" y1="84" x2="100" y2="200" stroke={BODY_STROKE} strokeWidth="0.6" opacity="0.4" />
            {/* Linea alba between abs */}
            <line x1="100" y1="146" x2="100" y2="198" stroke={BODY_STROKE} strokeWidth="1" opacity="0.6" />
        </svg>
    );
}


/* ────────────────────────────────────────────────────
   Back Body SVG
   ──────────────────────────────────────────────────── */
function BackBody({ muscleSets, maxSets }: BodyHeatmapProps) {
    const h = (m: string) => heatColor(muscleSets[m] || 0, maxSets);
    const back = h('back');
    const shoulders = h('shoulders');
    const triceps = h('triceps');
    const glutes = h('glutes');
    const hamstrings = h('hamstrings');
    const calves = h('calves');
    const neck = h('neck');
    const forearms = h('forearms');

    return (
        <svg viewBox="0 0 200 440" width="160" height="352" style={{ display: 'block' }}>
            <defs>
                <filter id="muscleGlowBack">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* ══════════ BASE BODY SILHOUETTE (Back) ══════════ */}

            {/* Head */}
            <ellipse cx="100" cy="30" rx="22" ry="26" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <ellipse cx="77" cy="30" rx="4" ry="7" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <ellipse cx="123" cy="30" rx="4" ry="7" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />

            {/* Neck */}
            <path d="M90,54 L90,68 C90,72 92,74 96,74 L104,74 C108,74 110,72 110,68 L110,54"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Torso */}
            <path d="M68,82 C56,86 44,96 38,116 C34,132 36,152 40,168
               C44,180 52,190 60,196 L68,200
               L80,206 L100,210 L120,206 L132,200 L140,196
               C148,190 156,180 160,168
               C164,152 166,132 162,116
               C156,96 144,86 132,82 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1.2" />

            {/* Shoulder caps */}
            <path d="M68,82 C52,78 36,84 28,100 C24,110 26,118 34,122 C40,118 50,112 58,106 C64,100 66,90 68,82 Z"
                fill={OUTLINE_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M132,82 C148,78 164,84 172,100 C174,110 172,118 166,122 C160,118 150,112 142,106 C136,100 134,90 132,82 Z"
                fill={OUTLINE_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Upper arms */}
            <path d="M34,122 C26,134 22,150 24,166 C26,178 32,184 40,182
               C46,180 48,170 48,158 C48,144 44,132 34,122 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M166,122 C174,134 178,150 176,166 C174,178 168,184 160,182
               C154,180 152,170 152,158 C152,144 156,132 166,122 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Forearms */}
            <path d="M24,166 C18,180 16,198 20,212 C23,222 30,226 38,222
               C44,218 46,206 44,192 C42,180 36,170 24,166 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M176,166 C182,180 184,198 180,212 C177,222 170,226 162,222
               C156,218 154,206 156,192 C158,180 164,170 176,166 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Hands */}
            <path d="M20,212 C16,222 14,232 18,238 C22,244 30,244 36,238 C40,232 40,224 38,222 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <path d="M180,212 C184,222 186,232 182,238 C178,244 170,244 164,238 C160,232 160,224 162,222 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />

            {/* Hip */}
            <path d="M80,206 C68,210 62,220 64,232 L72,240 L100,244 L128,240 L136,232
               C138,220 132,210 120,206 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Thighs */}
            <path d="M72,240 C58,254 50,278 52,304 C54,322 62,334 72,332
               C82,330 86,316 86,298 C86,274 82,254 72,240 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M128,240 C142,254 150,278 148,304 C146,322 138,334 128,332
               C118,330 114,316 114,298 C114,274 118,254 128,240 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Knees */}
            <ellipse cx="72" cy="338" rx="14" ry="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <ellipse cx="128" cy="338" rx="14" ry="10" fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />

            {/* Calves */}
            <path d="M58,342 C50,356 48,376 52,392 C55,402 62,406 70,404
               C78,402 82,392 80,376 C78,358 74,346 58,342 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />
            <path d="M142,342 C150,356 152,376 148,392 C145,402 138,406 130,404
               C122,402 118,392 120,376 C122,358 126,346 142,342 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="1" />

            {/* Feet */}
            <path d="M52,392 C44,402 40,416 46,422 C52,428 66,428 76,422 C82,416 82,406 70,404 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />
            <path d="M148,392 C156,402 160,416 154,422 C148,428 134,428 124,422 C118,416 118,406 130,404 Z"
                fill={BODY_FILL} stroke={BODY_STROKE} strokeWidth="0.8" />


            {/* ══════════ MUSCLE OVERLAYS (Back) ══════════ */}

            {/* ── Neck / Upper traps ── */}
            {neck && (
                <path d="M90,56 C86,62 78,72 72,82 L88,82 L100,82 L112,82 L128,82
                 C122,72 114,62 110,56 Z"
                    fill={neck} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            )}

            {/* ── Rear delts ── */}
            {shoulders && <>
                <path d="M68,82 C54,80 38,86 30,102 C26,110 28,118 36,120
                 C42,116 52,108 60,102 C66,96 68,88 68,82 Z"
                    fill={shoulders} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
                <path d="M132,82 C146,80 162,86 170,102 C174,110 172,118 164,120
                 C158,116 148,108 140,102 C134,96 132,88 132,82 Z"
                    fill={shoulders} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            </>}

            {/* ── Traps – upper back diamond ── */}
            {back && (
                <path d="M84,82 C76,88 68,96 64,106 C68,116 78,122 100,124
                 C122,122 132,116 136,106 C132,96 124,88 116,82 Z"
                    fill={back} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            )}

            {/* ── Lats – V-taper ── */}
            {back && <>
                <path d="M44,108 C36,120 34,138 38,156 C42,168 50,176 60,174
                 C68,172 72,160 70,144 C68,128 58,114 44,108 Z"
                    fill={back} opacity={0.85} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
                <path d="M156,108 C164,120 166,138 162,156 C158,168 150,176 140,174
                 C132,172 128,160 130,144 C132,128 142,114 156,108 Z"
                    fill={back} opacity={0.85} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            </>}

            {/* ── Lower back / Erectors ── */}
            {back && (
                <path d="M82,170 C76,178 74,190 78,200 C82,206 92,210 100,210
                 C108,210 118,206 122,200 C126,190 124,178 118,170
                 C112,164 88,164 82,170 Z"
                    fill={back} opacity={0.65} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            )}

            {/* ── Triceps ── */}
            {triceps && <>
                <path d="M34,126 C28,140 24,156 26,170 C28,180 34,184 40,180
                 C46,176 48,164 46,150 C44,138 40,130 34,126 Z"
                    fill={triceps} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
                <path d="M166,126 C172,140 176,156 174,170 C172,180 166,184 160,180
                 C154,176 152,164 154,150 C156,138 160,130 166,126 Z"
                    fill={triceps} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            </>}

            {/* ── Forearms (back) ── */}
            {forearms && <>
                <path d="M24,170 C18,184 16,200 20,214 C24,222 32,224 38,220
                 C42,214 44,202 42,190 C40,178 34,172 24,170 Z"
                    fill={forearms} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
                <path d="M176,170 C182,184 184,200 180,214 C176,222 168,224 162,220
                 C158,214 156,202 158,190 C160,178 166,172 176,170 Z"
                    fill={forearms} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            </>}

            {/* ── Glutes ── */}
            {glutes && <>
                <path d="M76,206 C66,214 62,228 66,242 C70,252 80,256 90,250
                 C98,244 100,232 96,220 C92,210 84,204 76,206 Z"
                    fill={glutes} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
                <path d="M124,206 C134,214 138,228 134,242 C130,252 120,256 110,250
                 C102,244 100,232 104,220 C108,210 116,204 124,206 Z"
                    fill={glutes} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            </>}

            {/* ── Hamstrings ── */}
            {hamstrings && <>
                <path d="M72,252 C60,268 54,290 56,310 C58,324 64,332 72,330
                 C80,328 84,316 84,298 C84,278 80,260 72,252 Z"
                    fill={hamstrings} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
                <path d="M128,252 C140,268 146,290 144,310 C142,324 136,332 128,330
                 C120,328 116,316 116,298 C116,278 120,260 128,252 Z"
                    fill={hamstrings} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            </>}

            {/* ── Calves (back – gastrocnemius) ── */}
            {calves && <>
                <path d="M60,344 C52,358 50,378 54,394 C58,402 64,406 70,402
                 C78,398 80,386 78,372 C76,358 70,348 60,344 Z"
                    fill={calves} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
                <path d="M140,344 C148,358 150,378 146,394 C142,402 136,406 130,402
                 C122,398 120,386 122,372 C124,358 130,348 140,344 Z"
                    fill={calves} className={styles.muscleOverlay} filter="url(#muscleGlowBack)" />
            </>}

            {/* Spine line */}
            <line x1="100" y1="78" x2="100" y2="210" stroke={BODY_STROKE} strokeWidth="0.8" opacity="0.35" />
        </svg>
    );
}


/* ────────────────────────────────────────────────────
   Exported component
   ──────────────────────────────────────────────────── */
export default function BodyHeatmap({ muscleSets, maxSets }: BodyHeatmapProps) {
    const HEAT_SCALE = [
        'rgba(255, 80, 50, 0.62)',
        'rgba(238, 34, 54, 0.80)',
        'rgba(190, 22, 128, 0.90)',
        'rgba(138, 43, 200, 0.96)',
    ];

    return (
        <div className={styles.container}>
            {/* Front + Back */}
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

            {/* Color legend */}
            <div className={styles.scaleLegend}>
                <span className={styles.scaleLabel}>Wenig</span>
                {HEAT_SCALE.map((c, i) => (
                    <div key={i} className={styles.scaleBlock} style={{ backgroundColor: c }} />
                ))}
                <span className={styles.scaleLabel}>Viel</span>
            </div>
        </div>
    );
}
