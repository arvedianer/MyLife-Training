'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type PanInfo, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import { colors, spacing } from '@/constants/tokens';
import { useGymStore } from '@/store/gymStore';
import { EQUIPMENT_LABELS } from '@/utils/variations';
import type { ExerciseEquipment } from '@/types/workout';
import type { Exercise } from '@/types/exercises';
import styles from './ExerciseSettingsSheet.module.css';

interface ExerciseSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise;
  // Current values
  equipment: ExerciseEquipment;
  gymId?: string;
  isUnilateral: boolean;
  restSeconds: number;
  warmupEnabled: boolean;
  warmupCount: number;
  repRangeMin: number;
  repRangeMax: number;
  note?: string;
  // Callbacks
  onEquipmentChange: (eq: ExerciseEquipment) => void;
  onGymChange: (gymId: string | undefined) => void;
  onUnilateralChange: (val: boolean) => void;
  onRestChange: (seconds: number) => void;
  onWarmupChange: (enabled: boolean, count: number) => void;
  onRepRangeChange: (min: number, max: number) => void;
  onNoteChange: (note: string) => void;
  onRemoveExercise: () => void;
  onReplaceExercise: () => void;
  // History + device busy
  onShowHistory: () => void;
  onDeviceBusy?: () => void;
}

const EQUIPMENT_OPTIONS: ExerciseEquipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'other'];
const REST_PRESETS = [60, 90, 120, 180, 300];
const WARMUP_COUNTS = [1, 2, 3];
const REP_RANGE_PRESETS: Array<{ label: string; min: number; max: number }> = [
  { label: '1–5',   min: 1,  max: 5  },
  { label: '5–8',   min: 5,  max: 8  },
  { label: '8–12',  min: 8,  max: 12 },
  { label: '10–15', min: 10, max: 15 },
  { label: '12–20', min: 12, max: 20 },
  { label: '20+',   min: 20, max: 30 },
];

export function ExerciseSettingsSheet({
  isOpen, onClose, exercise,
  equipment, gymId, isUnilateral, restSeconds, warmupEnabled, warmupCount,
  repRangeMin, repRangeMax, note,
  onEquipmentChange, onGymChange, onUnilateralChange, onRestChange,
  onWarmupChange, onRepRangeChange, onNoteChange,
  onRemoveExercise, onReplaceExercise, onShowHistory, onDeviceBusy,
}: ExerciseSettingsSheetProps) {
  const { gyms, addGym } = useGymStore();
  const [showAddGym, setShowAddGym] = useState(false);
  const [newGymName, setNewGymName] = useState('');
  const dragControls = useDragControls();

  // Defensive clamp: ensure valid range even if parent passes bad props
  const safeMin = Math.min(repRangeMin, repRangeMax - 1);
  const safeMax = Math.max(repRangeMax, repRangeMin + 1);

  const handleAddGym = () => {
    if (!newGymName.trim()) return;
    const gym = addGym(newGymName.trim());
    onGymChange(gym.id);
    setNewGymName('');
    setShowAddGym(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 100,
            }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { if (info.offset.y > 80) onClose(); }}
            className={styles.sheet}
          >
            {/* Handle — drag initiates only from here, not from scrollable content */}
            <div className={styles.handle} onPointerDown={(e) => dragControls.start(e)} style={{ cursor: 'grab' }} />

            {/* Header */}
            <div className={styles.sheetHeader}>
              <div>
                <div className={styles.sheetTitle}>{exercise.nameDE}</div>
                <div className={styles.sheetSubtitle}>Übungseinstellungen</div>
              </div>
              <button onClick={onClose} className={styles.closeBtn} aria-label="Schließen">
                <X size={20} color={colors.textMuted} />
              </button>
            </div>

            <div className={styles.scrollContent}>
              {/* EQUIPMENT */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>EQUIPMENT</div>
                <div className={styles.chipRow}>
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <button
                      key={eq}
                      onClick={() => onEquipmentChange(eq)}
                      className={`${styles.chip} ${equipment === eq ? styles.chipActive : ''}`}
                    >
                      {EQUIPMENT_LABELS[eq]}
                    </button>
                  ))}
                </div>
              </div>

              {/* SEITIG */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>SEITIG</div>
                <div className={styles.chipRow}>
                  <button
                    onClick={() => onUnilateralChange(false)}
                    className={`${styles.chip} ${!isUnilateral ? styles.chipActive : ''}`}
                  >
                    Bilateral
                  </button>
                  <button
                    onClick={() => onUnilateralChange(true)}
                    className={`${styles.chip} ${isUnilateral ? styles.chipActive : ''}`}
                  >
                    Unilateral
                  </button>
                </div>
              </div>

              {/* GYM */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>GYM (optional)</div>
                <div className={styles.chipRow}>
                  <button
                    onClick={() => onGymChange(undefined)}
                    className={`${styles.chip} ${!gymId ? styles.chipActive : ''}`}
                  >
                    Kein Gym
                  </button>
                  {gyms.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => onGymChange(gym.id)}
                      className={`${styles.chip} ${gymId === gym.id ? styles.chipActive : ''}`}
                    >
                      {gym.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddGym(true)}
                    className={styles.chip}
                  >
                    + Gym hinzufügen
                  </button>
                </div>
                {showAddGym && (
                  <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[2] }}>
                    <input
                      value={newGymName}
                      onChange={(e) => setNewGymName(e.target.value)}
                      placeholder="Gym Name..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGym()}
                      className={styles.gymInput}
                      autoFocus
                    />
                    <button onClick={handleAddGym} className={`${styles.chip} ${styles.chipActive}`}>OK</button>
                    <button onClick={() => setShowAddGym(false)} className={styles.chip} aria-label="Abbrechen">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* REST TIMER */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>PAUSE NACH SATZ</div>
                <div className={styles.chipRow}>
                  {REST_PRESETS.map((s) => (
                    <button
                      key={s}
                      onClick={() => onRestChange(s)}
                      className={`${styles.chip} ${restSeconds === s ? styles.chipActive : ''}`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              {/* WARM-UP SÄTZE */}
              <div className={styles.section}>
                <div className={styles.sectionLabelRow}>
                  <span className={styles.sectionLabel}>WARM-UP SÄTZE</span>
                  <button
                    onClick={() => onWarmupChange(!warmupEnabled, warmupCount)}
                    className={`${styles.toggle} ${warmupEnabled ? styles.toggleActive : ''}`}
                  >
                    {warmupEnabled ? 'AN' : 'AUS'}
                  </button>
                </div>
                {warmupEnabled && (
                  <div className={styles.chipRow}>
                    {WARMUP_COUNTS.map((n) => (
                      <button
                        key={n}
                        onClick={() => onWarmupChange(true, n)}
                        className={`${styles.chip} ${warmupCount === n ? styles.chipActive : ''}`}
                      >
                        {n} Satz{n > 1 ? 'e' : ''}
                      </button>
                    ))}
                  </div>
                )}
                {warmupEnabled && (
                  <p className={styles.hint}>Warm-up Sätze zählen nicht in Stats oder Score</p>
                )}
              </div>

              {/* WIEDERHOLUNGSBEREICH */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>WIEDERHOLUNGSBEREICH</div>

                {/* Preset chips — tap to set common range instantly */}
                <div className={styles.chipRow}>
                  {REP_RANGE_PRESETS.map((preset) => {
                    const isActive = safeMin === preset.min && safeMax === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => onRepRangeChange(preset.min, preset.max)}
                        className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Manual steppers for fine-tuning */}
                <div className={styles.rangeStepperRow}>
                  <div className={styles.rangeStepper}>
                    <span className={styles.rangeStepperLabel}>MIN</span>
                    <button
                      onClick={() => onRepRangeChange(Math.max(1, safeMin - 1), safeMax)}
                      className={styles.stepperBtn}
                      aria-label="Min verringern"
                    >−</button>
                    <span className={styles.rangeValue}>{safeMin}</span>
                    <button
                      onClick={() => onRepRangeChange(Math.min(safeMax - 1, safeMin + 1), safeMax)}
                      className={styles.stepperBtn}
                      aria-label="Min erhöhen"
                    >+</button>
                  </div>
                  <span className={styles.rangeSeparator}>—</span>
                  <div className={styles.rangeStepper}>
                    <span className={styles.rangeStepperLabel}>MAX</span>
                    <button
                      onClick={() => onRepRangeChange(safeMin, Math.max(safeMin + 1, safeMax - 1))}
                      className={styles.stepperBtn}
                      aria-label="Max verringern"
                    >−</button>
                    <span className={styles.rangeValue}>{safeMax}</span>
                    <button
                      onClick={() => onRepRangeChange(safeMin, Math.min(30, safeMax + 1))}
                      className={styles.stepperBtn}
                      aria-label="Max erhöhen"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* NOTIZEN */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>NOTIZEN</div>
                <textarea
                  value={note ?? ''}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Ausführungshinweise, Cues..."
                  className={styles.textarea}
                  rows={2}
                />
              </div>

              {/* ERWEITERT */}
              <div className={styles.section}>
                <div className={styles.sectionLabel}>ERWEITERT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  <button onClick={onShowHistory} className={styles.extendedBtn}>
                    Letzte 5 Einheiten →
                  </button>
                  {onDeviceBusy && (
                    <button onClick={onDeviceBusy} className={styles.extendedBtn}>
                      Gerät besetzt → Alternative vorschlagen
                    </button>
                  )}
                </div>
              </div>

              {/* DANGER ZONE */}
              <div className={styles.dangerSection}>
                <button onClick={onReplaceExercise} className={styles.replaceBtn}>
                  Übung ersetzen
                </button>
                <button onClick={onRemoveExercise} className={styles.removeBtn}>
                  Übung entfernen
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
