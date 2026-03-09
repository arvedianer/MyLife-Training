'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { colors, typography, spacing, radius } from '@/constants/tokens';
import { useHistoryStore } from '@/store/historyStore';
import { exercises } from '@/constants/exercises';
import { formatVolume, calculateStreak } from '@/utils/dates';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, subMonths, addWeeks, parseISO, isSameDay, eachDayOfInterval,
} from 'date-fns';
import { de } from 'date-fns/locale';

type Period = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

const PERIOD_LABELS: Record<Period, string> = {
  thisWeek:  'Diese Woche',
  lastWeek:  'Letzte Woche',
  thisMonth: 'Dieser Monat',
  lastMonth: 'Letzter Monat',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern',
  biceps: 'Bizeps', triceps: 'Trizeps', core: 'Core',
  legs: 'Beine', quads: 'Quadrizeps', hamstrings: 'Hamstrings',
  glutes: 'Gesäß', calves: 'Waden', forearms: 'Unterarme',
  neck: 'Nacken', adductors: 'Adduktoren', abductors: 'Abduktoren',
};

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case 'thisWeek':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'lastWeek': {
      const lw = subWeeks(now, 1);
      return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) };
    }
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
  }
}

// Red → Magenta → Purple heat scale
function muscleHeatColor(sets: number, maxSets: number): string | null {
  if (sets === 0 || maxSets === 0) return null;
  const r = Math.min(sets / maxSets, 1);
  if (r < 0.25) return 'rgba(255, 80, 50, 0.62)';
  if (r < 0.50) return 'rgba(238, 34, 54, 0.80)';
  if (r < 0.75) return 'rgba(190, 22, 128, 0.90)';
  return 'rgba(138, 43, 200, 0.96)';
}

function heatBarColor(r: number): string {
  if (r < 0.25) return 'rgba(255, 80, 50, 0.72)';
  if (r < 0.50) return 'rgba(238, 34, 54, 0.85)';
  if (r < 0.75) return 'rgba(190, 22, 128, 0.92)';
  return 'rgba(138, 43, 200, 0.97)';
}

const BB = '#1E1E24'; // body base
const BS = '#30303C'; // body stroke

// ─────────────────────────────────────────────────────────
// FRONT BODY SVG
// ─────────────────────────────────────────────────────────
function FrontBodySVG({ muscleSets, maxSets }: { muscleSets: Record<string, number>; maxSets: number }) {
  const h = (m: string) => muscleHeatColor(muscleSets[m] || 0, maxSets);
  const chest     = h('chest');
  const shoulders = h('shoulders');
  const biceps    = h('biceps');
  const core      = h('core');
  const quads     = h('quads') ?? h('legs');
  const calves    = h('calves');
  const forearms  = h('forearms');

  return (
    <svg viewBox="0 0 100 215" width="90" height="193" style={{ display: 'block' }}>
      {/* ── BASE BODY SHAPES ── */}
      {/* Head */}
      <ellipse cx="50" cy="15" rx="13" ry="14" fill={BB} stroke={BS} strokeWidth="0.8" />
      {/* Neck */}
      <path d="M44,27 L44,39 L56,39 L56,27 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Torso */}
      <path d="M44,39 C34,41 21,47 17,61 C13,74 15,86 19,95 C22,102 29,107 36,108 L64,108 C71,107 78,102 81,95 C85,86 87,74 83,61 C79,47 66,41 56,39 Z" fill={BB} stroke={BS} strokeWidth="0.8" />
      {/* Left upper arm */}
      <path d="M21,47 C13,52 9,64 10,77 C11,86 15,91 21,91 C25,89 26,83 26,75 C27,65 24,53 21,47 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Right upper arm */}
      <path d="M79,47 C87,52 91,64 90,77 C89,86 85,91 79,91 C75,89 74,83 74,75 C73,65 76,53 79,47 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Left forearm */}
      <path d="M10,77 C7,85 7,98 10,106 C12,111 17,112 21,110 C25,108 25,101 24,93 C23,87 17,82 10,77 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Right forearm */}
      <path d="M90,77 C93,85 93,98 90,106 C88,111 83,112 79,110 C75,108 75,101 76,93 C77,87 83,82 90,77 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Hip */}
      <path d="M36,108 C28,110 26,116 27,120 L31,122 L69,122 L73,120 C74,116 72,110 64,108 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Left thigh */}
      <path d="M31,122 C24,131 21,147 22,160 C23,168 28,172 34,171 C40,170 43,163 43,153 C44,140 42,128 36,122 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Right thigh */}
      <path d="M69,122 C76,131 79,147 78,160 C77,168 72,172 66,171 C60,170 57,163 57,153 C56,140 58,128 64,122 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Left calf */}
      <path d="M22,160 C16,167 16,179 19,186 C21,190 26,191 31,189 C36,187 37,180 36,172 C35,165 34,168 34,171 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Right calf */}
      <path d="M78,160 C84,167 84,179 81,186 C79,190 74,191 69,189 C64,187 63,180 64,172 C65,165 66,168 66,171 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      {/* Feet */}
      <ellipse cx="27" cy="192" rx="9" ry="3.5" fill={BB} stroke={BS} strokeWidth="0.6" />
      <ellipse cx="73" cy="192" rx="9" ry="3.5" fill={BB} stroke={BS} strokeWidth="0.6" />

      {/* ── MUSCLE HEAT OVERLAYS ── */}
      {/* Chest - left pec */}
      {chest && <path d="M44,51 C35,52 25,59 25,71 C25,80 33,83 43,81 C48,79 50,75 50,67 C50,57 48,51 44,51 Z" fill={chest} />}
      {/* Chest - right pec */}
      {chest && <path d="M56,51 C65,52 75,59 75,71 C75,80 67,83 57,81 C52,79 50,75 50,67 C50,57 52,51 56,51 Z" fill={chest} />}
      {/* Shoulder left */}
      {shoulders && <ellipse cx="19" cy="61" rx="9" ry="13" transform="rotate(-14 19 61)" fill={shoulders} />}
      {/* Shoulder right */}
      {shoulders && <ellipse cx="81" cy="61" rx="9" ry="13" transform="rotate(14 81 61)" fill={shoulders} />}
      {/* Bicep left */}
      {biceps && <path d="M12,67 C9,74 9,84 12,89 C14,93 19,93 22,90 C25,88 25,81 24,73 C23,67 17,63 12,67 Z" fill={biceps} />}
      {/* Bicep right */}
      {biceps && <path d="M88,67 C91,74 91,84 88,89 C86,93 81,93 78,90 C75,88 75,81 76,73 C77,67 83,63 88,67 Z" fill={biceps} />}
      {/* Forearms left */}
      {forearms && <path d="M9,84 C7,92 8,103 11,108 C13,111 18,112 21,110 C24,107 24,99 22,92 C20,86 15,82 9,84 Z" fill={forearms} />}
      {/* Forearms right */}
      {forearms && <path d="M91,84 C93,92 92,103 89,108 C87,111 82,112 79,110 C76,107 76,99 78,92 C80,86 85,82 91,84 Z" fill={forearms} />}
      {/* Abs - 6 pack */}
      {core && <>
        <rect x="39" y="83" width="9" height="7.5" rx="2.5" fill={core} />
        <rect x="52" y="83" width="9" height="7.5" rx="2.5" fill={core} />
        <rect x="39" y="92.5" width="9" height="7.5" rx="2.5" fill={core} />
        <rect x="52" y="92.5" width="9" height="7.5" rx="2.5" fill={core} />
        <rect x="39.5" y="102" width="8.5" height="6.5" rx="2.5" fill={core} />
        <rect x="52" y="102" width="8.5" height="6.5" rx="2.5" fill={core} />
      </>}
      {/* Quads left */}
      {quads && <path d="M31,123 C24,133 21,149 23,162 C25,168 30,171 35,170 C40,168 43,161 42,151 C43,138 41,126 36,123 Z" fill={quads} />}
      {/* Quads right */}
      {quads && <path d="M69,123 C76,133 79,149 77,162 C75,168 70,171 65,170 C60,168 57,161 58,151 C57,138 59,126 64,123 Z" fill={quads} />}
      {/* Calves left */}
      {calves && <path d="M20,162 C15,169 16,181 19,187 C21,190 26,191 31,189 C36,186 37,179 35,171 C33,165 32,168 34,171 Z" fill={calves} />}
      {/* Calves right */}
      {calves && <path d="M80,162 C85,169 84,181 81,187 C79,190 74,191 69,189 C64,186 63,179 65,171 C67,165 66,168 66,171 Z" fill={calves} />}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// BACK BODY SVG
// ─────────────────────────────────────────────────────────
function BackBodySVG({ muscleSets, maxSets }: { muscleSets: Record<string, number>; maxSets: number }) {
  const h = (m: string) => muscleHeatColor(muscleSets[m] || 0, maxSets);
  const back       = h('back');
  const shoulders  = h('shoulders');
  const triceps    = h('triceps');
  const glutes     = h('glutes');
  const hamstrings = h('hamstrings');
  const calves     = h('calves');

  return (
    <svg viewBox="0 0 100 215" width="90" height="193" style={{ display: 'block' }}>
      {/* ── BASE BODY (same structure as front) ── */}
      <ellipse cx="50" cy="15" rx="13" ry="14" fill={BB} stroke={BS} strokeWidth="0.8" />
      <path d="M44,27 L44,39 L56,39 L56,27 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M44,39 C34,41 21,47 17,61 C13,74 15,86 19,95 C22,102 29,107 36,108 L64,108 C71,107 78,102 81,95 C85,86 87,74 83,61 C79,47 66,41 56,39 Z" fill={BB} stroke={BS} strokeWidth="0.8" />
      <path d="M21,47 C13,52 9,64 10,77 C11,86 15,91 21,91 C25,89 26,83 26,75 C27,65 24,53 21,47 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M79,47 C87,52 91,64 90,77 C89,86 85,91 79,91 C75,89 74,83 74,75 C73,65 76,53 79,47 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M10,77 C7,85 7,98 10,106 C12,111 17,112 21,110 C25,108 25,101 24,93 C23,87 17,82 10,77 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M90,77 C93,85 93,98 90,106 C88,111 83,112 79,110 C75,108 75,101 76,93 C77,87 83,82 90,77 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M36,108 C28,110 26,116 27,120 L31,122 L69,122 L73,120 C74,116 72,110 64,108 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M31,122 C24,131 21,147 22,160 C23,168 28,172 34,171 C40,170 43,163 43,153 C44,140 42,128 36,122 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M69,122 C76,131 79,147 78,160 C77,168 72,172 66,171 C60,170 57,163 57,153 C56,140 58,128 64,122 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M22,160 C16,167 16,179 19,186 C21,190 26,191 31,189 C36,187 37,180 36,172 C35,165 34,168 34,171 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <path d="M78,160 C84,167 84,179 81,186 C79,190 74,191 69,189 C64,187 63,180 64,172 C65,165 66,168 66,171 Z" fill={BB} stroke={BS} strokeWidth="0.7" />
      <ellipse cx="27" cy="192" rx="9" ry="3.5" fill={BB} stroke={BS} strokeWidth="0.6" />
      <ellipse cx="73" cy="192" rx="9" ry="3.5" fill={BB} stroke={BS} strokeWidth="0.6" />

      {/* ── MUSCLE HEAT OVERLAYS ── */}
      {/* Traps - upper back diamond */}
      {back && <path d="M44,39 C38,43 28,49 26,58 C29,64 36,67 50,68 C64,67 71,64 74,58 C72,49 62,43 56,39 Z" fill={back} />}
      {/* Lat left */}
      {back && <path d="M18,62 C13,70 12,82 16,92 C19,99 25,103 30,101 C34,98 34,89 33,79 C31,68 25,60 18,62 Z" fill={back} opacity="0.88" />}
      {/* Lat right */}
      {back && <path d="M82,62 C87,70 88,82 84,92 C81,99 75,103 70,101 C66,98 66,89 67,79 C69,68 75,60 82,62 Z" fill={back} opacity="0.88" />}
      {/* Lower back */}
      {back && <ellipse cx="50" cy="97" rx="14" ry="9" fill={back} opacity="0.72" />}
      {/* Rear shoulder left */}
      {shoulders && <ellipse cx="18" cy="59" rx="9" ry="13" transform="rotate(-12 18 59)" fill={shoulders} />}
      {/* Rear shoulder right */}
      {shoulders && <ellipse cx="82" cy="59" rx="9" ry="13" transform="rotate(12 82 59)" fill={shoulders} />}
      {/* Tricep left */}
      {triceps && <path d="M12,65 C9,73 9,83 12,89 C14,93 19,93 22,90 C25,88 25,81 24,73 C23,67 17,63 12,65 Z" fill={triceps} />}
      {/* Tricep right */}
      {triceps && <path d="M88,65 C91,73 91,83 88,89 C86,93 81,93 78,90 C75,88 75,81 76,73 C77,67 83,63 88,65 Z" fill={triceps} />}
      {/* Glute left */}
      {glutes && <path d="M36,109 C28,114 27,124 30,132 C33,138 39,140 44,136 C48,131 48,122 45,114 C42,108 39,107 36,109 Z" fill={glutes} />}
      {/* Glute right */}
      {glutes && <path d="M64,109 C72,114 73,124 70,132 C67,138 61,140 56,136 C52,131 52,122 55,114 C58,108 61,107 64,109 Z" fill={glutes} />}
      {/* Hamstring left */}
      {hamstrings && <path d="M31,132 C24,143 22,157 24,165 C26,170 31,172 36,170 C41,168 43,160 42,150 C41,139 37,131 31,132 Z" fill={hamstrings} />}
      {/* Hamstring right */}
      {hamstrings && <path d="M69,132 C76,143 78,157 76,165 C74,170 69,172 64,170 C59,168 57,160 58,150 C59,139 63,131 69,132 Z" fill={hamstrings} />}
      {/* Calf left */}
      {calves && <path d="M20,163 C15,170 16,182 19,187 C21,190 26,191 31,189 C36,186 37,179 35,171 C33,165 32,168 34,171 Z" fill={calves} />}
      {/* Calf right */}
      {calves && <path d="M80,163 C85,170 84,182 81,187 C79,190 74,191 69,189 C64,186 63,179 65,171 C67,165 66,168 66,171 Z" fill={calves} />}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('thisWeek');
  const { sessions, getPersonalRecords } = useHistoryStore();
  const prs = getPersonalRecords();

  const { start, end } = useMemo(() => getPeriodRange(period), [period]);

  const periodSessions = useMemo(
    () => sessions.filter(s => { const d = parseISO(s.date); return d >= start && d <= end; }),
    [sessions, start, end],
  );

  // Key metrics
  const periodWorkouts = periodSessions.length;
  const periodVolume   = periodSessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const periodDurSec   = periodSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const periodSets     = periodSessions.reduce((sum, s) => sum + s.totalSets, 0);
  const avgDurMin      = periodWorkouts > 0 ? Math.round(periodDurSec / periodWorkouts / 60) : 0;

  // Muscle set counts
  const muscleSets = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of periodSessions) {
      for (const ex of s.exercises) {
        const done = ex.sets.filter(st => st.isCompleted).length;
        if (!done) continue;
        const pm = ex.exercise.primaryMuscle as string;
        if (pm) counts[pm] = (counts[pm] || 0) + done;
        for (const sm of (ex.exercise.secondaryMuscles || []) as string[]) {
          counts[sm] = (counts[sm] || 0) + Math.ceil(done / 2);
        }
      }
    }
    return counts;
  }, [periodSessions]);

  const maxMuscleSets = Math.max(...Object.values(muscleSets), 1);
  const hasMuscleData = Object.keys(muscleSets).length > 0;

  // Training days calendar
  const periodDays  = eachDayOfInterval({ start, end });
  const trainedDays = new Set(periodSessions.map(s => format(parseISO(s.date), 'yyyy-MM-dd')));

  // All-time
  const totalWorkouts = sessions.length;
  const totalDurSec   = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalDurH     = Math.floor(totalDurSec / 3600);
  const currentStreak = calculateStreak(sessions.map(s => s.date));

  // 8-week volume chart
  const weeklyVolumeData = Array.from({ length: 8 }, (_, i) => {
    const wStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 7 - i);
    const wEnd   = addWeeks(wStart, 1);
    const vol    = sessions
      .filter(s => { const d = parseISO(s.date); return d >= wStart && d < wEnd; })
      .reduce((sum, s) => sum + s.totalVolume, 0);
    return {
      week: format(wStart, 'dd.MM', { locale: de }),
      volumen: Math.round((vol / 1000) * 10) / 10,
    };
  });
  const hasVolumeData = weeklyVolumeData.some(d => d.volumen > 0);

  const exercisesWithPRs = exercises.filter(e => prs[e.id]).slice(0, 10);

  const HEAT_SCALE = [
    'rgba(255, 80, 50, 0.62)',
    'rgba(238, 34, 54, 0.80)',
    'rgba(190, 22, 128, 0.90)',
    'rgba(138, 43, 200, 0.96)',
  ];

  return (
    <div style={{
      padding: spacing[5],
      paddingTop: `calc(${spacing[8]} + env(safe-area-inset-top))`,
      display: 'flex', flexDirection: 'column', gap: spacing[6],
      paddingBottom: spacing[8],
    }}>

      {/* ── HEADER ── */}
      <div>
        <h1 style={{ ...typography.h1, color: colors.textPrimary }}>Statistiken</h1>
        <p style={{ ...typography.body, color: colors.textMuted, marginTop: spacing[1] }}>
          Dein Fortschritt auf einen Blick
        </p>
      </div>

      {/* ── PERIOD TABS ── */}
      <div style={{ display: 'flex', gap: spacing[2], overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flexShrink: 0,
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: radius.full,
              border: `1px solid ${period === p ? colors.accent : colors.border}`,
              backgroundColor: period === p ? colors.accentBg : 'transparent',
              ...typography.label,
              color: period === p ? colors.accent : colors.textMuted,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {PERIOD_LABELS[p].toUpperCase()}
          </button>
        ))}
      </div>

      {/* ══ HEATMAP — FIRST ══ */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Muskelgruppen
        </h2>
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: spacing[4],
        }}>
          {/* Front + Back SVGs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: spacing[8], marginBottom: spacing[3] }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[2] }}>VORNE</p>
              <FrontBodySVG muscleSets={muscleSets} maxSets={maxMuscleSets} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...typography.label, color: colors.textFaint, marginBottom: spacing[2] }}>HINTEN</p>
              <BackBodySVG muscleSets={muscleSets} maxSets={maxMuscleSets} />
            </div>
          </div>

          {/* Color scale */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], justifyContent: 'center', marginBottom: spacing[4] }}>
            <span style={{ ...typography.monoSm, color: colors.textFaint, fontSize: '10px' }}>Wenig</span>
            {HEAT_SCALE.map((c, i) => (
              <div key={i} style={{
                width: '24px', height: '8px', borderRadius: '3px',
                backgroundColor: c,
              }} />
            ))}
            <span style={{ ...typography.monoSm, color: colors.textFaint, fontSize: '10px' }}>Viel</span>
          </div>

          {/* Muscle bars — top 8 */}
          {hasMuscleData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {Object.entries(muscleSets)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([muscle, sets]) => {
                  const r = sets / maxMuscleSets;
                  return (
                    <div key={muscle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ ...typography.bodySm, color: colors.textSecondary }}>
                          {MUSCLE_LABELS[muscle] ?? muscle}
                        </span>
                        <span style={{ ...typography.monoSm, color: colors.textMuted }}>{sets} Sets</span>
                      </div>
                      <div style={{ height: '5px', borderRadius: '3px', backgroundColor: colors.bgHighest, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${r * 100}%`, borderRadius: '3px',
                          backgroundColor: heatBarColor(r), transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p style={{ ...typography.bodySm, color: colors.textMuted, textAlign: 'center', paddingTop: spacing[2] }}>
              Kein Training in diesem Zeitraum aufgezeichnet.
            </p>
          )}
        </div>
      </div>

      {/* ── 3 KEY METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[3] }}>
        <MetricCard
          label="Einheiten"
          value={String(periodWorkouts)}
          sub="Workouts"
        />
        <MetricCard
          label="Volumen"
          value={periodVolume >= 1000 ? `${(periodVolume / 1000).toFixed(1)}t` : `${Math.round(periodVolume)}kg`}
          sub="Gesamt"
        />
        <MetricCard
          label="Ø Dauer"
          value={`${avgDurMin}min`}
          sub="Pro Workout"
        />
      </div>

      {/* ── TRAINING CALENDAR ── */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Trainingstage
        </h2>
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: spacing[4],
        }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            gap: periodDays.length > 14 ? spacing[1] : spacing[2],
            justifyContent: 'center',
          }}>
            {periodDays.map(day => {
              const key     = format(day, 'yyyy-MM-dd');
              const trained = trainedDays.has(key);
              const today   = isSameDay(day, new Date());
              const sz      = periodDays.length > 14 ? '26px' : '34px';
              return (
                <div
                  key={key}
                  title={format(day, 'EEE dd.MM', { locale: de })}
                  style={{
                    width: sz, height: sz, borderRadius: radius.sm,
                    backgroundColor: trained ? colors.accent : colors.bgHighest,
                    border: today ? `2px solid ${colors.accent}80` : `1px solid ${colors.borderLight}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ ...typography.monoSm, fontSize: '9px', color: trained ? colors.bgPrimary : colors.textFaint }}>
                    {format(day, 'd')}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: spacing[4], justifyContent: 'center', marginTop: spacing[3] }}>
            <LegendDot color={colors.accent} label={`Trainiert (${periodWorkouts})`} />
            <LegendDot color={colors.bgHighest} label={`Ruhetag (${periodDays.length - periodWorkouts})`} />
          </div>
        </div>
      </div>

      {/* ── VOLUME PROGRESS CHART ── */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[1] }}>
          Volumen-Entwicklung
        </h2>
        <p style={{ ...typography.bodySm, color: colors.textMuted, marginBottom: spacing[3] }}>
          Trainingsvolumen der letzten 8 Wochen
        </p>
        <div style={{
          backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
          borderRadius: radius.lg, padding: spacing[4],
        }}>
          {hasVolumeData ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyVolumeData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: colors.textFaint, fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false} unit="t" width={28}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: '12px' }}
                  labelStyle={{ color: colors.textMuted }}
                  itemStyle={{ color: colors.volumeColor }}
                  cursor={{ fill: colors.bgHighest }}
                  formatter={(v: number) => [`${v} t`, 'Volumen']}
                />
                <Bar dataKey="volumen" fill={colors.volumeColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ ...typography.bodySm, color: colors.textMuted }}>Noch keine Workouts in den letzten 8 Wochen</p>
            </div>
          )}
        </div>
      </div>

      {/* ── PERSONAL RECORDS ── */}
      <div>
        <h2 style={{ ...typography.h3, color: colors.textPrimary, marginBottom: spacing[3] }}>
          Personal Records
        </h2>
        {exercisesWithPRs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: `${spacing[6]} ${spacing[4]}`,
            backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
          }}>
            <p style={{ ...typography.body, color: colors.textMuted }}>Noch keine Rekorde vorhanden.</p>
            <p style={{ ...typography.bodySm, color: colors.textDisabled, marginTop: spacing[1] }}>
              Trainiere und setze neue Bestleistungen!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {exercisesWithPRs.map(exercise => {
              const pr = prs[exercise.id];
              return (
                <Link key={exercise.id} href={`/stats/exercise/${exercise.id}`}>
                  <div
                    style={{
                      backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
                      borderRadius: radius.lg, padding: spacing[4],
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgElevated}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = colors.bgCard}
                  >
                    <div>
                      <div style={{ ...typography.body, color: colors.textPrimary, fontWeight: 600 }}>{exercise.nameDE}</div>
                      <div style={{ ...typography.bodySm, color: colors.textMuted, marginTop: '2px' }}>Bestes Set</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ ...typography.mono, color: colors.prColor }}>{pr.weight} kg</div>
                        <div style={{ ...typography.monoSm, color: colors.textMuted }}>× {pr.reps} Wdh.</div>
                      </div>
                      <ChevronRight size={16} color={colors.textDisabled} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ALL-TIME SLIM STRIP ── */}
      <div style={{
        backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
        borderRadius: radius.lg, padding: `${spacing[4]} ${spacing[4]}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...typography.monoLg, color: colors.textPrimary }}>{totalWorkouts}</div>
          <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>Einheiten</div>
        </div>
        <div style={{
          textAlign: 'center',
          borderLeft: `1px solid ${colors.borderLight}`,
          borderRight: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ ...typography.monoLg, color: colors.textPrimary }}>{currentStreak}</div>
          <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>Streak Tage</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...typography.monoLg, color: colors.textPrimary }}>{totalDurH}h</div>
          <div style={{ ...typography.label, color: colors.textMuted, marginTop: spacing[1] }}>Zeit im Gym</div>
        </div>
      </div>

    </div>
  );
}

// ─── Helper Components ─────────────────────────────────────
function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{
      backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`,
      borderRadius: radius.lg, padding: spacing[3],
      display: 'flex', flexDirection: 'column', gap: spacing[1],
    }}>
      <div style={{ ...typography.monoLg, color: colors.textPrimary, lineHeight: 1, fontSize: '18px' }}>{value}</div>
      <div style={{ ...typography.label, color: colors.textFaint, marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color }} />
      <span style={{ ...typography.monoSm, color: colors.textMuted }}>{label}</span>
    </div>
  );
}
