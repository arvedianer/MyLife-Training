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
  age?: number;         // years
  bodyWeight?: number;  // kg (always stored in kg regardless of weightUnit)
  height?: number;      // cm
  trainingWeekdays?: number[];  // [0=Mo, 1=Di, ..., 6=So]; conversion: (jsDay + 6) % 7
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number; // 1-5
  profile: Partial<UserProfile>;
}
