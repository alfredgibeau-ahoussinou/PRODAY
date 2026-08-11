import type { HealthSnapshot } from '../core/types/health';
import type { WearableHealthMetrics } from '../services/wearableHealth/types';
import type { WellnessSignals } from '../models/SmartTactics';
import { defaultWellnessForUser } from './smartPlayerCards';
import type { User } from '../models/User';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Map Apple Santé / Google Health metrics → Smart Tactics WellnessSignals. */
export function wearableToWellnessSignals(
  wearable: WearableHealthMetrics | null | undefined,
  health?: HealthSnapshot | null,
  base?: WellnessSignals,
): WellnessSignals {
  const out: WellnessSignals = { ...(base ?? {}) };

  if (wearable?.sleepHoursLastNight != null) {
    out.sleep_hours = wearable.sleepHoursLastNight;
  }
  if (wearable?.workoutDurationMin != null) {
    out.minutes_last_7d = Math.max(out.minutes_last_7d ?? 0, wearable.workoutDurationMin);
  }

  // HRV / RHR heuristics → recovery & fatigue (1–10)
  if (wearable?.hrvMs != null) {
    // Higher HRV ≈ better recovery (rough amateur scale)
    out.recovery = clamp(Math.round(wearable.hrvMs / 8), 1, 10);
  }
  if (wearable?.restingHeartRate != null) {
    const rhr = wearable.restingHeartRate;
    const fatigueFromRhr = rhr <= 55 ? 2 : rhr <= 65 ? 4 : rhr <= 75 ? 6 : 8;
    out.fatigue = out.fatigue ?? fatigueFromRhr;
    if (out.recovery == null) {
      out.recovery = clamp(11 - fatigueFromRhr, 1, 10);
    }
  }
  if (wearable?.stepsToday != null && wearable.stepsToday > 12_000) {
    out.fatigue = clamp((out.fatigue ?? 5) + 1, 1, 10);
  }

  if (health) {
    // Engine scores are 0–100-ish; map to 1–10
    out.fatigue = clamp(Math.round(health.fatigueScore / 10), 1, 10);
    out.recovery = clamp(Math.round(health.recoveryScore / 10), 1, 10);
    if (health.state === 'INJURY_RISK' || health.state === 'OVERLOADED') {
      out.pain = Math.max(out.pain ?? 0, health.state === 'INJURY_RISK' ? 5 : 3);
    }
    if (health.state === 'RECOVERY') {
      out.recovery_hours_since_last = Math.max(out.recovery_hours_since_last ?? 0, 48);
    }
  }

  if (out.wellness_score == null && (out.sleep_hours != null || out.recovery != null)) {
    const sleepPart = out.sleep_hours != null ? clamp(out.sleep_hours, 0, 10) : 7;
    const recPart = out.recovery ?? 6;
    const fatPart = 10 - (out.fatigue ?? 5);
    out.wellness_score = clamp(Math.round((sleepPart + recPart + fatPart) / 3), 1, 10);
  }

  return out;
}

/** Merge self wearable, optional club check-ins, and profile defaults. */
export function buildWellnessByUid(input: {
  members: User[];
  selfUid?: string;
  selfWearable?: WearableHealthMetrics | null;
  selfHealth?: HealthSnapshot | null;
  checkinsByUid?: Record<string, WellnessSignals>;
}): Record<string, WellnessSignals> {
  const out: Record<string, WellnessSignals> = {};
  for (const m of input.members) {
    let signals = defaultWellnessForUser(m);
    const checkin = input.checkinsByUid?.[m.uid];
    if (checkin) signals = { ...signals, ...checkin };
    if (m.uid === input.selfUid) {
      signals = wearableToWellnessSignals(input.selfWearable, input.selfHealth, signals);
    }
    out[m.uid] = signals;
  }
  return out;
}
