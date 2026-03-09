import type { WorkoutGoal } from '@/types/workout';

export interface GoalTheme {
  accent: string;
  accentDark: string;
  accentBg: string;
  label: string;
}

export const GOAL_THEMES: Record<WorkoutGoal, GoalTheme> = {
  muskelaufbau: {
    accent: '#0A84FF',
    accentDark: '#0062D1',
    accentBg: '#0A84FF15',
    label: 'Muskelaufbau',
  },
  kraft: {
    accent: '#FF6B35',
    accentDark: '#E05520',
    accentBg: '#FF6B3515',
    label: 'Maximalkraft',
  },
  abnehmen: {
    accent: '#32D74B',
    accentDark: '#1FA534',
    accentBg: '#32D74B15',
    label: 'Fettabbau',
  },
  fitness: {
    accent: '#BF5AF2',
    accentDark: '#9B3DD4',
    accentBg: '#BF5AF215',
    label: 'Fitness',
  },
  ausdauer: {
    accent: '#00B4D8',
    accentDark: '#0090AD',
    accentBg: '#00B4D815',
    label: 'Ausdauer',
  },
};

export function getGoalTheme(goal: WorkoutGoal | undefined): GoalTheme {
  if (!goal) return GOAL_THEMES.muskelaufbau;
  return GOAL_THEMES[goal] ?? GOAL_THEMES.muskelaufbau;
}

export function applyGoalTheme(goal: WorkoutGoal | undefined): void {
  if (typeof document === 'undefined') return;
  const theme = getGoalTheme(goal);
  document.documentElement.style.setProperty('--accent', theme.accent);
  document.documentElement.style.setProperty('--accent-dark', theme.accentDark);
  document.documentElement.style.setProperty('--accent-bg', theme.accentBg);
}
