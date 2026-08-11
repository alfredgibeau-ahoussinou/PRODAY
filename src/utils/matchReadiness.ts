import type {
  MatchReadinessResult,
  WellnessSignals,
} from '../models/SmartTactics';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Baseline potential from profile signals (0–99). */
export function computeOverallPotential(input: {
  age?: number;
  years_experience?: number;
  season_matches?: number;
  season_goals?: number;
  season_assists?: number;
  height_cm?: number;
}): number {
  let score = 62;
  const age = input.age;
  if (typeof age === 'number') {
    if (age >= 17 && age <= 24) score += 8;
    else if (age >= 25 && age <= 29) score += 6;
    else if (age >= 30 && age <= 33) score += 2;
    else if (age > 33) score -= 4;
    else if (age < 16) score -= 2;
  }
  if (typeof input.years_experience === 'number') {
    score += clamp(input.years_experience, 0, 12);
  }
  const matches = input.season_matches ?? 0;
  score += clamp(Math.round(matches / 3), 0, 8);
  const contrib = (input.season_goals ?? 0) + (input.season_assists ?? 0);
  score += clamp(contrib, 0, 10);
  return clamp(Math.round(score), 40, 99);
}

/**
 * Dynamic match readiness: Potential + Ready %.
 * Example: Potential 87 · Ready 74%
 */
export function computeMatchReadiness(
  potential: number,
  signals: WellnessSignals = {},
): MatchReadinessResult {
  const factors: MatchReadinessResult['factors'] = [];
  let readiness = 78;

  if (signals.injured) {
    return {
      potential: clamp(Math.round(potential), 40, 99),
      readiness_pct: 0,
      form: 20,
      confidence: 15,
      availability: 'out',
      factors: [{ id: 'injury', label: 'Blessé', impact: -100 }],
    };
  }
  if (signals.suspended) {
    return {
      potential: clamp(Math.round(potential), 40, 99),
      readiness_pct: 0,
      form: 40,
      confidence: 30,
      availability: 'suspended',
      factors: [{ id: 'suspension', label: 'Suspendu', impact: -100 }],
    };
  }

  if (typeof signals.sleep_hours === 'number') {
    const impact = signals.sleep_hours >= 7.5 ? 8 : signals.sleep_hours >= 6 ? 2 : -12;
    readiness += impact;
    factors.push({ id: 'sleep', label: 'Sommeil', impact });
  }
  if (typeof signals.fatigue === 'number') {
    const impact = Math.round((5.5 - signals.fatigue) * 3);
    readiness += impact;
    factors.push({ id: 'fatigue', label: 'Fatigue', impact });
  }
  if (typeof signals.stress === 'number') {
    const impact = Math.round((5 - signals.stress) * 2);
    readiness += impact;
    factors.push({ id: 'stress', label: 'Stress', impact });
  }
  if (typeof signals.recovery === 'number') {
    const impact = Math.round((signals.recovery - 5) * 2.5);
    readiness += impact;
    factors.push({ id: 'recovery', label: 'Récupération', impact });
  }
  if (typeof signals.wellness_score === 'number') {
    const impact = Math.round((signals.wellness_score - 5) * 2);
    readiness += impact;
    factors.push({ id: 'wellness', label: 'Bien-être', impact });
  }
  if (typeof signals.pain === 'number' && signals.pain > 0) {
    const impact = -Math.round(signals.pain * 3.5);
    readiness += impact;
    factors.push({ id: 'pain', label: 'Douleur', impact });
  }
  if (typeof signals.training_attendance_rate === 'number') {
    const impact = Math.round((signals.training_attendance_rate - 0.7) * 25);
    readiness += impact;
    factors.push({ id: 'attendance', label: 'Assiduité', impact });
  }
  if (typeof signals.minutes_last_7d === 'number') {
    const impact =
      signals.minutes_last_7d > 270 ? -10 : signals.minutes_last_7d > 180 ? -4 : signals.minutes_last_7d < 45 ? -3 : 4;
    readiness += impact;
    factors.push({ id: 'minutes', label: 'Minutes récentes', impact });
  }
  if (typeof signals.recovery_hours_since_last === 'number') {
    const impact =
      signals.recovery_hours_since_last >= 72
        ? 6
        : signals.recovery_hours_since_last >= 48
          ? 2
          : signals.recovery_hours_since_last < 24
            ? -10
            : -3;
    readiness += impact;
    factors.push({ id: 'rest', label: 'Temps de récupération', impact });
  }
  if (typeof signals.injury_recency_days === 'number' && signals.injury_recency_days < 21) {
    const impact = -Math.round((21 - signals.injury_recency_days) / 2);
    readiness += impact;
    factors.push({ id: 'injury_history', label: 'Historique blessure', impact });
  }

  const readiness_pct = clamp(Math.round(readiness), 0, 100);
  const form = clamp(
    Math.round(readiness_pct * 0.55 + (signals.wellness_score ?? 6) * 4),
    0,
    100,
  );
  const confidence = clamp(
    Math.round(readiness_pct * 0.45 + (signals.recovery ?? 6) * 5 + (signals.sleep_hours ?? 7)),
    0,
    100,
  );

  let availability: MatchReadinessResult['availability'] = 'available';
  if (readiness_pct < 45 || (signals.pain ?? 0) >= 6) availability = 'doubtful';

  return {
    potential: clamp(Math.round(potential), 40, 99),
    readiness_pct,
    form,
    confidence,
    availability,
    factors: factors.sort((a, b) => a.impact - b.impact),
  };
}
