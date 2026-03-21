'use client';

import { useEffect } from 'react';
import styles from './FinishWorkoutModal.module.css';

interface Props {
  incompleteSets: number;
  onMarkDone: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function FinishWorkoutModal({ incompleteSets, onMarkDone, onDiscard, onCancel }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>{incompleteSets} {incompleteSets === 1 ? 'Set' : 'Sets'} nicht abgeschlossen</h2>
        <p className={styles.subtitle}>Was soll mit den nicht abgehakten Sets passieren?</p>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={onMarkDone}>
            Als gemacht markieren
          </button>
          <button className={styles.btnDanger} onClick={onDiscard}>
            Verwerfen
          </button>
          <button className={styles.btnGhost} onClick={onCancel}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
