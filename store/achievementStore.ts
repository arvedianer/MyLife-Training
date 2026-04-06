import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  unlockedAt?: number; // Unix timestamp
}

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_workout',   title: 'Erste Einheit',       description: 'Du hast dein erstes Training abgeschlossen.', icon: '🏋️' },
  { id: 'five_workouts',   title: 'Auf Kurs',             description: '5 Trainingseinheiten absolviert.', icon: '🔥' },
  { id: 'ten_workouts',    title: 'Gewohnheit',           description: '10 Einheiten — du machst es richtig.', icon: '💪' },
  { id: 'fifty_workouts',  title: 'Ausdauer',             description: '50 Trainingseinheiten. Respekt.', icon: '🏆' },
  { id: 'first_pr',        title: 'Persönlicher Rekord',  description: 'Du hast deinen ersten PR gesetzt.', icon: '⭐' },
  { id: 'heavy_lift',      title: 'Schwere Last',         description: 'Einen Satz mit über 100kg abgeschlossen.', icon: '🎯' },
  { id: 'volume_1000',     title: 'Volumen-Maschine',     description: '1000kg Gesamtvolumen in einer Einheit.', icon: '📈' },
  { id: 'streak_7',        title: 'Woche durch',          description: '7 Tage Streak gehalten.', icon: '🗓️' },
];

interface AchievementState {
  unlocked: Record<string, number>; // id -> unlockedAt timestamp
  pendingCelebration: string | null; // achievement id to celebrate

  checkAndUnlock: (
    sessionCount: number,
    hasNewPR: boolean,
    maxWeight: number,
    totalVolume: number,
    streak: number,
  ) => void;
  clearPendingCelebration: () => void;
  getAllWithStatus: () => (Achievement & { unlocked: boolean })[];
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: {},
      pendingCelebration: null,

      checkAndUnlock: (sessionCount, hasNewPR, maxWeight, totalVolume, streak) => {
        const { unlocked } = get();
        const toUnlock: string[] = [];

        const check = (id: string, condition: boolean) => {
          if (condition && !unlocked[id]) toUnlock.push(id);
        };

        check('first_workout',  sessionCount >= 1);
        check('five_workouts',  sessionCount >= 5);
        check('ten_workouts',   sessionCount >= 10);
        check('fifty_workouts', sessionCount >= 50);
        check('first_pr',       hasNewPR);
        check('heavy_lift',     maxWeight >= 100);
        check('volume_1000',    totalVolume >= 1000);
        check('streak_7',       streak >= 7);

        if (toUnlock.length > 0) {
          const now = Date.now();
          const newUnlocked = { ...unlocked };
          toUnlock.forEach((id) => { newUnlocked[id] = now; });
          // Celebrate the most "impressive" one (last in priority order)
          set({ unlocked: newUnlocked, pendingCelebration: toUnlock[toUnlock.length - 1] });
        }
      },

      clearPendingCelebration: () => set({ pendingCelebration: null }),

      getAllWithStatus: () => {
        const { unlocked } = get();
        return ALL_ACHIEVEMENTS.map((a) => ({
          ...a,
          unlockedAt: unlocked[a.id],
          unlocked: !!unlocked[a.id],
        }));
      },
    }),
    {
      name: 'mylife-achievements',
      storage: {
        getItem: (name) => {
          const v = zustandStorage.getItem(name);
          return v ? JSON.parse(v) : null;
        },
        setItem: (name, value) => zustandStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => zustandStorage.removeItem(name),
      },
    },
  ),
);

export const ALL_ACHIEVEMENTS_LIST = ALL_ACHIEVEMENTS;
