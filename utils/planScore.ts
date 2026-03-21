import { getExerciseById } from '@/constants/exercises';

export interface PlanScoreResult {
  total: number;   // 0–100
  frequencyScore: number;
  balanceScore: number;
  varietyScore: number;
  tips: string[];
}

export function calculatePlanScore(split: {
  days: Array<{ exerciseIds?: string[]; restDay?: boolean }>;
}): PlanScoreResult {
  const trainingDays = split.days.filter((d) => !d.restDay);

  // 1. Frequency — optimal 3–5 days/week
  const frequencyScore = trainingDays.length === 0 ? 0
    : trainingDays.length >= 3 && trainingDays.length <= 5 ? 100
    : trainingDays.length < 3 ? Math.round((trainingDays.length / 3) * 100)
    : Math.max(60, 100 - (trainingDays.length - 5) * 15);

  // 2. Balance — push vs. pull
  const PUSH_MUSCLES = ['chest', 'shoulders', 'triceps'];
  const PULL_MUSCLES = ['back', 'biceps'];
  let pushCount = 0;
  let pullCount = 0;
  let legCount = 0;

  for (const day of trainingDays) {
    for (const exerciseId of day.exerciseIds ?? []) {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) continue;
      if (PUSH_MUSCLES.includes(exercise.primaryMuscle)) pushCount++;
      else if (PULL_MUSCLES.includes(exercise.primaryMuscle)) pullCount++;
      else if (['legs', 'glutes', 'calves'].includes(exercise.primaryMuscle)) legCount++;
    }
  }
  const muscleTotal = pushCount + pullCount + legCount;
  const balanceScore = muscleTotal === 0 ? 50 : Math.round(
    Math.max(0, 100 - Math.abs(pushCount - pullCount) * 8 - (legCount < muscleTotal * 0.2 ? 20 : 0))
  );

  // 3. Variety — compound vs. isolation mix
  let compoundCount = 0;
  let isolationCount = 0;
  for (const day of trainingDays) {
    for (const exerciseId of day.exerciseIds ?? []) {
      const exercise = getExerciseById(exerciseId);
      if (!exercise) continue;
      if (exercise.category === 'compound') compoundCount++;
      else if (exercise.category === 'isolation') isolationCount++;
    }
  }
  const exTotal = compoundCount + isolationCount;
  const actualRatio = exTotal > 0 ? compoundCount / exTotal : 0.5;
  const varietyScore = Math.round(Math.max(40, 100 - Math.abs(actualRatio - 0.5) * 120));

  const total = Math.round(frequencyScore * 0.35 + balanceScore * 0.35 + varietyScore * 0.30);
  const tips: string[] = [];
  if (frequencyScore < 60) tips.push('Mehr Trainingstage für optimale Frequenz (Ziel: 3–5 Tage)');
  if (balanceScore < 60) tips.push(`Push/Pull Balance anpassen: ${pushCount} Push vs. ${pullCount} Pull`);
  if (legCount < muscleTotal * 0.2 && muscleTotal > 0) tips.push('Beintraining zu wenig vertreten');
  if (varietyScore < 60) tips.push('Mix aus Compound und Isolationsübungen verbessern');

  return { total, frequencyScore, balanceScore, varietyScore, tips };
}
