import AppleHealthKit, {
  type HealthKitPermissions,
  type HealthInputOptions,
  type HealthValue,
} from 'react-native-health';
import type { WearableHealthMetrics } from './types';

const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
    ],
    write: [],
  },
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYesterday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}

function promisify<T>(fn: (cb: (err: string, result: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(new Error(err));
      else resolve(result);
    });
  });
}

async function initHealthKit(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, (err) => {
      if (err) reject(new Error(err));
      else resolve();
    });
  });
}

async function readSteps(): Promise<number | null> {
  try {
    const options: HealthInputOptions = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };
    const result = await promisify<HealthValue>((cb) => {
      AppleHealthKit.getStepCount(options, cb);
    });
    if (result.value == null || !Number.isFinite(result.value)) return null;
    return Math.max(0, Math.round(result.value));
  } catch {
    return null;
  }
}

async function readSleepHours(): Promise<number | null> {
  try {
    const options = {
      startDate: startOfYesterday().toISOString(),
      endDate: new Date().toISOString(),
    };
    const samples = await promisify<HealthValue[]>((cb) => {
      AppleHealthKit.getSleepSamples(options, cb);
    });
    if (!samples.length) return null;

    const asleepMs = samples
      .filter((s) => String(s.value) === 'ASLEEP')
      .reduce((sum, s) => {
        const start = new Date(s.startDate).getTime();
        const end = new Date(s.endDate).getTime();
        return sum + Math.max(0, end - start);
      }, 0);

    if (asleepMs <= 0) return null;
    return Math.round((asleepMs / 3_600_000) * 10) / 10;
  } catch {
    return null;
  }
}

async function readRestingHeartRate(): Promise<number | null> {
  const options: HealthInputOptions = {
    startDate: startOfYesterday().toISOString(),
    endDate: new Date().toISOString(),
  };
  try {
    const result = await promisify<HealthValue>((cb) => {
      AppleHealthKit.getRestingHeartRate(options, cb);
    });
    const value = Math.round(result.value ?? 0);
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function connectWearableHealth(): Promise<WearableHealthMetrics> {
  await initHealthKit();
  return fetchWearableMetrics();
}

export async function fetchWearableMetrics(): Promise<WearableHealthMetrics> {
  const [stepsToday, sleepHoursLastNight, restingHeartRate] = await Promise.all([
    readSteps(),
    readSleepHours(),
    readRestingHeartRate(),
  ]);

  return {
    stepsToday,
    sleepHoursLastNight,
    restingHeartRate,
    exerciseHeartRateAvg: null,
    activeCaloriesToday: null,
    distanceKmToday: null,
    workoutDurationMin: null,
    hrvMs: null,
    syncedAt: new Date().toISOString(),
    source: 'apple_health',
  };
}
