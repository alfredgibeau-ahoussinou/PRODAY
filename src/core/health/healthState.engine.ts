import type { HealthEngineInput, HealthSnapshot, HealthState } from '../types/health';

function resolveState(input: HealthEngineInput): HealthState {
  const load =
    input.recentMatchCount * 12 +
    input.upcomingEventsCount * 8 +
    input.pendingConvocations * 6 -
    input.streakDays * 2;

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

  const fatigueScore = Math.min(
    100,
    Math.round(
      input.recentMatchCount * 14 +
        input.upcomingEventsCount * 9 +
        input.pendingConvocations * 7 -
        input.profileCompletion * 0.08
    )
  );

  const recoveryScore = Math.min(
    100,
    Math.round(55 + input.streakDays * 4 - fatigueScore * 0.35 + input.profileCompletion * 0.12)
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
      message: 'Votre charge est équilibrée — bon moment pour performer.',
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
      message: 'Charge élevée détectée — évitez les matchs intenses.',
    },
    INJURY_RISK: {
      hint: 'Repos + bilan kiné si douleur',
      message: 'Risque blessure élevé. L’IA bloque les matchs intenses.',
    },
    RECOVERY: {
      hint: 'Réactivation progressive',
      message: 'Reprenez doucement : échauffement long et match loisir.',
    },
  };

  const coach = coachByState[state];

  return {
    state,
    fatigueScore,
    recoveryScore,
    trainingLoad,
    injuryRisk,
    allowIntenseMatch,
    dailyPlanHint: coach.hint,
    coachMessage: coach.message,
  };
}
