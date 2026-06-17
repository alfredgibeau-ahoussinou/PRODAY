import { computeHealthSnapshot } from '../core/health/healthState.engine';
import {
  applyWearableToHealthInput,
  wearableLoadPenalty,
  wearableRecoveryBonus,
} from '../services/wearableHealth/mergeHealthInput';
import { hasWearableData } from '../services/wearableHealth/formatWearableMetrics';
import type { WearableHealthMetrics } from '../services/wearableHealth/types';

describe('wearable health merge', () => {
  const baseInput = {
    globalScore: 70,
    upcomingEventsCount: 1,
    pendingConvocations: 0,
    recentMatchCount: 1,
    streakDays: 3,
    profileCompletion: 80,
  };

  const wearable: WearableHealthMetrics = {
    stepsToday: 11_500,
    sleepHoursLastNight: 5.2,
    restingHeartRate: 54,
    syncedAt: '2026-06-08T08:00:00.000Z',
    source: 'apple_health',
  };

  it('marque la connexion wearable dans le moteur santé', () => {
    const merged = applyWearableToHealthInput(baseInput, wearable);
    expect(merged.wearableConnected).toBe(true);
    expect(merged.stepsToday).toBe(11_500);
    expect(merged.sleepHoursLastNight).toBe(5.2);
    expect(merged.restingHeartRate).toBe(54);
  });

  it('n’active pas le wearable si aucune donnée lue', () => {
    const emptyWearable: WearableHealthMetrics = {
      stepsToday: null,
      sleepHoursLastNight: null,
      restingHeartRate: null,
      syncedAt: '2026-06-08T08:00:00.000Z',
      source: 'apple_health',
    };
    expect(hasWearableData(emptyWearable)).toBe(false);
    const merged = applyWearableToHealthInput(baseInput, emptyWearable);
    expect(merged.wearableConnected).toBeUndefined();
  });

  it('augmente la fatigue avec peu de sommeil et beaucoup de pas', () => {
    const without = computeHealthSnapshot(baseInput);
    const withWearable = computeHealthSnapshot(applyWearableToHealthInput(baseInput, wearable));
    expect(withWearable.fatigueScore).toBeGreaterThan(without.fatigueScore);
  });

  it('calcule bonus et pénalités wearables', () => {
    expect(wearableLoadPenalty(wearable)).toBeGreaterThan(0);
    expect(wearableRecoveryBonus({ ...wearable, sleepHoursLastNight: 8 })).toBeGreaterThan(0);
  });
});
