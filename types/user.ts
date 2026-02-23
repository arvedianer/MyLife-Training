import type {
  WorkoutGoal,
  TrainingLevel,
  TrainingDays,
  EquipmentType,
} from './workout';

export interface UserProfile {
  name?: string;
  goal: WorkoutGoal;
  level: TrainingLevel;
  trainingDays: TrainingDays;
  equipment: EquipmentType;
  weightUnit: 'kg' | 'lbs';
  createdAt: number; // Unix timestamp
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number; // 1-5
  profile: Partial<UserProfile>;
}
