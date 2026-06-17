import type { HealthEngineInput } from '../../core/types/health';
import type { WearableHealthMetrics } from './types';
import { hasWearableData } from './formatWearableMetrics';

/** Fusionne les données Apple Santé / Google Health dans le moteur santé. */
export function applyWearableToHealthInput(
  input: HealthEngineInput,
  wearable: WearableHealthMetrics | null | undefined
): HealthEngineInput {
  if (!wearable || !hasWearableData(wearable)) return input;
  return {
    ...input,
    sleepHoursLastNight: wearable.sleepHoursLastNight ?? undefined,
    stepsToday: wearable.stepsToday ?? undefined,
    restingHeartRate: wearable.restingHeartRate ?? undefined,
    wearableConnected: true,
  };
}

export function wearableRecoveryBonus(wearable: WearableHealthMetrics | null | undefined): number {
  if (!wearable || !hasWearableData(wearable)) return 0;
  let bonus = 0;
  if (wearable.sleepHoursLastNight != null) {
    if (wearable.sleepHoursLastNight >= 7.5) bonus += 6;
    else if (wearable.sleepHoursLastNight < 6) bonus -= 10;
  }
  if (wearable.restingHeartRate != null && wearable.restingHeartRate <= 58) bonus += 4;
  return bonus;
}

export function wearableLoadPenalty(wearable: WearableHealthMetrics | null | undefined): number {
  if (!wearable || !hasWearableData(wearable)) return 0;
  let penalty = 0;
  if (wearable.sleepHoursLastNight != null && wearable.sleepHoursLastNight < 6) penalty += 8;
  if (wearable.stepsToday != null) {
    if (wearable.stepsToday > 12_000) penalty += 6;
    else if (wearable.stepsToday > 9_000) penalty += 3;
  }
  return penalty;
}
