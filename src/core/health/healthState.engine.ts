import type { HealthEngineInput, HealthSnapshot, HealthState } from '../types/health';
import {
  wearableLoadPenalty,
  wearableRecoveryBonus,
} from '../../services/wearableHealth/mergeHealthInput';

function wearableLoadAdjustment(input: HealthEngineInput): number {
  if (!input.wearableConnected) return 0;
  let adj = 0;
  if (input.sleepHoursLastNight != null && input.sleepHoursLastNight < 6) adj += 8;
  if (input.stepsToday != null && input.stepsToday > 10_000) adj += 4;
  if (input.restingHeartRate != null && input.restingHeartRate > 75) adj += 3;
  return adj;
}

function resolveState(input: HealthEngineInput): HealthState {
  const load =
    input.recentMatchCount * 12 +
    input.upcomingEventsCount * 8 +
    input.pendingConvocations * 6 -
    input.streakDays * 2 +
    wearableLoadAdjustment(input);

  if (load >= 55) return 'INJURY_RISK';
  if (load >= 40) return 'OVERLOADED';
  if (load >= 28) return 'FATIGUED';
  if (input.recentMatchCount === 0 && input.upcomingEventsCount === 0) return 'RECOVERY';
  if (input.streakDays >= 3 && load < 20) return 'ACTIVE';
  return 'OPTIMAL';
}

/** Moteur santé temps réel (spec §5, §14). */
export function computeHealthSnapshot(input: HealthEngineInput): HealthSnapshot {
  const state = resolveState(input);

  const wearablePenalty = input.wearableConnected
    ? wearableLoadPenalty({
        stepsToday: input.stepsToday ?? null,
        sleepHoursLastNight: input.sleepHoursLastNight ?? null,
        restingHeartRate: input.restingHeartRate ?? null,
        syncedAt: '',
        source: 'apple_health',
      })
    : 0;

  const fatigueScore = Math.min(
    100,
    Math.round(
      input.recentMatchCount * 14 +
        input.upcomingEventsCount * 9 +
        input.pendingConvocations * 7 -
        input.profileCompletion * 0.08 +
        wearablePenalty
    )
  );

  const wearableBonus = input.wearableConnected
    ? wearableRecoveryBonus({
        stepsToday: input.stepsToday ?? null,
        sleepHoursLastNight: input.sleepHoursLastNight ?? null,
        restingHeartRate: input.restingHeartRate ?? null,
        syncedAt: '',
        source: 'apple_health',
      })
    : 0;

  const recoveryScore = Math.min(
    100,
    Math.round(
      55 + input.streakDays * 4 - fatigueScore * 0.35 + input.profileCompletion * 0.12 + wearableBonus
    )
  );

  const trainingLoad = Math.min(
    100,
    Math.round(fatigueScore * 0.7 + input.upcomingEventsCount * 11)
  );

  const injuryRisk: HealthSnapshot['injuryRisk'] =
    state === 'INJURY_RISK' ? 'high' : state === 'OVERLOADED' ? 'medium' : 'low';

  const allowIntenseMatch =
    state === 'OPTIMAL' || state === 'ACTIVE' || (state === 'FATIGUED' && fatigueScore < 45);

  const coachByState: Record<HealthState, { hint: string; message: string }> = {
    OPTIMAL: {
      hint: 'Séance technique ou match modéré',
      message: 'Votre charge est équilibrée. Bon moment pour performer.',
    },
    ACTIVE: {
      hint: 'Match ou entraînement ciblé',
      message: 'Vous êtes en forme. Priorisez un match compatible avec votre niveau.',
    },
    FATIGUED: {
      hint: 'Footing léger ou mobilité',
      message: 'Réduisez l’intensité aujourd’hui pour protéger la récupération.',
    },
    OVERLOADED: {
      hint: 'Repos actif uniquement',
      message:
        'Charge élevée détectée. Vérifiez la disponibilité et adaptez l’intensité si nécessaire.',
    },
    INJURY_RISK: {
      hint: 'Repos + surveillance de la charge',
      message:
        'Charge très élevée sur une période courte. Adaptez la charge et consultez un professionnel de santé en cas de douleur.',
    },
    RECOVERY: {
      hint: 'Réactivation progressive',
      message: 'Reprenez doucement : échauffement long et charge progressive.',
    },
  };

  const coach = coachByState[state];

  return {
    state,
    fatigueScore,
    recoveryScore,
    trainingLoad,
    injuryRisk,
    loadCaution: injuryRisk,
    allowIntenseMatch,
    dailyPlanHint: coach.hint,
    coachMessage: coach.message,
  };
}
