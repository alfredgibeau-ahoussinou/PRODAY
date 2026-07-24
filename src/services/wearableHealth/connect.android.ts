import type { WearableHealthMetrics } from './types';

type HealthConnectModule = typeof import('react-native-health-connect');

let healthConnectPromise: Promise<HealthConnectModule> | null = null;

/** Charge Health Connect uniquement à la demande (pas au require du home). */
async function getHealthConnect(): Promise<HealthConnectModule> {
  if (!healthConnectPromise) {
    healthConnectPromise = import('react-native-health-connect').catch((error) => {
      healthConnectPromise = null;
      throw error;
    });
  }
  return healthConnectPromise;
}

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

async function ensureInitialized(): Promise<HealthConnectModule> {
  const hc = await getHealthConnect();
  const status = await hc.getSdkStatus();
  if (status !== hc.SdkAvailabilityStatus.SDK_AVAILABLE) {
    throw new Error('Google Health Connect n’est pas disponible sur cet appareil.');
  }
  const ok = await hc.initialize();
  if (!ok) throw new Error('Impossible d’initialiser Google Health Connect.');
  return hc;
}

async function requestHealthPermissions(hc: HealthConnectModule): Promise<void> {
  const granted = await hc.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'RestingHeartRate' },
  ]);
  if (!granted?.length) {
    throw new Error('Autorisation Google Health refusée.');
  }
}

async function readSteps(hc: HealthConnectModule): Promise<number | null> {
  try {
    const startTime = startOfToday().toISOString();
    const endTime = new Date().toISOString();
    const { records } = await hc.readRecords('Steps', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });
    if (!records.length) return null;
    const total = records.reduce((sum, record) => sum + (record.count ?? 0), 0);
    return Math.max(0, total);
  } catch {
    return null;
  }
}

async function readSleepHours(hc: HealthConnectModule): Promise<number | null> {
  try {
    const startTime = startOfYesterday().toISOString();
    const endTime = new Date().toISOString();
    const { records } = await hc.readRecords('SleepSession', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });
    if (!records.length) return null;
    const asleepMs = records.reduce((sum, record) => {
      const start = new Date(record.startTime).getTime();
      const end = new Date(record.endTime).getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    if (asleepMs <= 0) return null;
    return Math.round((asleepMs / 3_600_000) * 10) / 10;
  } catch {
    return null;
  }
}

async function readRestingHeartRate(hc: HealthConnectModule): Promise<number | null> {
  const startTime = startOfYesterday().toISOString();
  const endTime = new Date().toISOString();
  try {
    const { records } = await hc.readRecords('RestingHeartRate', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });
    const sorted = [...records].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
    const bpm = sorted[0]?.beatsPerMinute;
    return bpm && bpm > 0 ? Math.round(bpm) : null;
  } catch {
    return null;
  }
}

export async function connectWearableHealth(): Promise<WearableHealthMetrics> {
  const hc = await ensureInitialized();
  await requestHealthPermissions(hc);
  return fetchWearableMetrics();
}

export async function fetchWearableMetrics(): Promise<WearableHealthMetrics> {
  const hc = await ensureInitialized();
  const [stepsToday, sleepHoursLastNight, restingHeartRate] = await Promise.all([
    readSteps(hc),
    readSleepHours(hc),
    readRestingHeartRate(hc),
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
    source: 'google_health',
  };
}
