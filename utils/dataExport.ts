type JsonRecord = Record<string, unknown>;

interface StorageReader {
  getItem: (key: string) => string | null;
}

interface ParsedStore {
  payload: unknown;
  state: JsonRecord;
}

export const MIGRATION_STORAGE_KEYS = {
  user: 'mylife-user',
  history: 'mylife-history',
  plan: 'mylife-plan',
  workout: 'mylife-workout',
  achievements: 'mylife-achievements',
  customExercises: 'mylife-custom-exercises',
  personalRecords: 'pr-storage',
  gyms: 'gym-storage',
  chat: 'mylife-chat',
  tour: 'tour-store',
} as const;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parsePersistedStore(raw: string | null): ParsedStore {
  if (raw === null) {
    return { payload: null, state: {} };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const parsedRecord = asRecord(parsed);
    const state = Object.prototype.hasOwnProperty.call(parsedRecord, 'state')
      ? asRecord(parsedRecord.state)
      : parsedRecord;

    return { payload: parsed, state };
  } catch {
    // Keep malformed allowlisted data recoverable without letting it break the export.
    return {
      payload: {
        parseError: true,
        rawValue: raw,
      },
      state: {},
    };
  }
}

function readStore(storage: StorageReader, key: string): ParsedStore {
  return parsePersistedStore(storage.getItem(key));
}

export function buildMigrationExport(
  storage: StorageReader,
  exportedAt: Date = new Date(),
) {
  const user = readStore(storage, MIGRATION_STORAGE_KEYS.user);
  const history = readStore(storage, MIGRATION_STORAGE_KEYS.history);
  const plan = readStore(storage, MIGRATION_STORAGE_KEYS.plan);
  const workout = readStore(storage, MIGRATION_STORAGE_KEYS.workout);
  const achievements = readStore(storage, MIGRATION_STORAGE_KEYS.achievements);
  const customExercises = readStore(storage, MIGRATION_STORAGE_KEYS.customExercises);
  const personalRecords = readStore(storage, MIGRATION_STORAGE_KEYS.personalRecords);
  const gyms = readStore(storage, MIGRATION_STORAGE_KEYS.gyms);
  const chat = readStore(storage, MIGRATION_STORAGE_KEYS.chat);
  const tour = readStore(storage, MIGRATION_STORAGE_KEYS.tour);

  const sessions = asArray(history.state.sessions);
  const plans = asArray(plan.state.splits);
  const customExerciseList = asArray(customExercises.state.customExercises);
  const personalRecordList = asArray(personalRecords.state.records);

  return {
    schema: 'mylife.training.migration',
    schemaVersion: 1,
    exportedAt: exportedAt.toISOString(),
    source: {
      app: 'MyLife Training Web',
      appVersion: '0.1.0',
      persistence: 'zustand-localStorage',
    },
    summary: {
      sessionCount: sessions.length,
      planCount: plans.length,
      customExerciseCount: customExerciseList.length,
      personalRecordCount: personalRecordList.length,
    },
    training: {
      sessions,
      restDays: asStringArray(history.state.restDays),
      autoRestDays: asStringArray(history.state.autoRestDays),
      plans,
      activePlanId: asStringOrNull(plan.state.activeSplitId),
      customExercises: customExerciseList,
      personalRecords: personalRecordList,
      activeWorkout: workout.state.activeWorkout ?? null,
      recentlyUsedExerciseIds: asStringArray(workout.state.recentlyUsedIds),
    },
    profile: {
      profile: user.state.profile ?? null,
      onboardingCompleted: user.state.onboardingCompleted === true,
      onboardingStep: typeof user.state.onboardingStep === 'number' ? user.state.onboardingStep : null,
      weightUnit: typeof user.state.weightUnit === 'string' ? user.state.weightUnit : null,
      restTimerDefault:
        typeof user.state.restTimerDefault === 'number' ? user.state.restTimerDefault : null,
      language: typeof user.state.language === 'string' ? user.state.language : null,
      bodyWeightLog: asArray(user.state.bodyWeightLog),
      lifetimeAthleteScore:
        typeof user.state.lifetimeAthleteScore === 'number'
          ? user.state.lifetimeAthleteScore
          : null,
    },
    achievements: {
      unlocked: asRecord(achievements.state.unlocked),
      pendingCelebration: asStringOrNull(achievements.state.pendingCelebration),
    },
    auxiliary: {
      gyms: asArray(gyms.state.gyms),
      chat: {
        conversations: asArray(chat.state.conversations),
        activeConversationId: asStringOrNull(chat.state.activeConversationId),
      },
      tour: {
        completed: tour.state.tourCompleted === true,
        active: tour.state.tourActive === true,
        step: typeof tour.state.tourStep === 'number' ? tour.state.tourStep : null,
      },
    },
    legacyBackup: {
      storageFormat: 'zustand-persist',
      includedKeys: Object.values(MIGRATION_STORAGE_KEYS),
      stores: {
        [MIGRATION_STORAGE_KEYS.user]: user.payload,
        [MIGRATION_STORAGE_KEYS.history]: history.payload,
        [MIGRATION_STORAGE_KEYS.plan]: plan.payload,
        [MIGRATION_STORAGE_KEYS.workout]: workout.payload,
        [MIGRATION_STORAGE_KEYS.achievements]: achievements.payload,
        [MIGRATION_STORAGE_KEYS.customExercises]: customExercises.payload,
        [MIGRATION_STORAGE_KEYS.personalRecords]: personalRecords.payload,
        [MIGRATION_STORAGE_KEYS.gyms]: gyms.payload,
        [MIGRATION_STORAGE_KEYS.chat]: chat.payload,
        [MIGRATION_STORAGE_KEYS.tour]: tour.payload,
      },
    },
  };
}

export type MigrationExport = ReturnType<typeof buildMigrationExport>;

export function downloadMigrationExport(): MigrationExport {
  if (typeof window === 'undefined') {
    throw new Error('Data export is only available in the browser.');
  }

  const migrationExport = buildMigrationExport(window.localStorage);
  const json = JSON.stringify(migrationExport, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `mylife-training-export-${migrationExport.exportedAt.slice(0, 10)}.json`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);

  return migrationExport;
}
