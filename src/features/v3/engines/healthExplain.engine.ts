import type { HealthEngineInput, HealthSnapshot } from '../../../core/types/health';
import { getWearablePlatformLabel } from '../../../services/wearableHealth/types';

export type HealthFactorImpact = 'positive' | 'negative' | 'neutral';

export interface HealthScoreFactor {
  id: string;
  label: string;
  detail: string;
  impact: HealthFactorImpact;
  weight: number;
}

export interface HealthScoreExplanation {
  fatigueFactors: HealthScoreFactor[];
  recoveryFactors: HealthScoreFactor[];
  summary: string;
}

/** Décomposition WHOOP-like — transparence des scores. */
export function explainHealthScores(
  input: HealthEngineInput,
  snapshot: HealthSnapshot
): HealthScoreExplanation {
  const fatigueFactors: HealthScoreFactor[] = [];

  if (input.recentMatchCount > 0) {
    fatigueFactors.push({
      id: 'recent_matches',
      label: 'Matchs récents',
      detail: `${input.recentMatchCount} match(s) sur la période`,
      impact: input.recentMatchCount >= 3 ? 'negative' : 'neutral',
      weight: input.recentMatchCount * 14,
    });
  }

  if (input.upcomingEventsCount > 0) {
    fatigueFactors.push({
      id: 'upcoming',
      label: 'Événements à venir',
      detail: `${input.upcomingEventsCount} convocation(s) planifiée(s)`,
      impact: input.upcomingEventsCount >= 4 ? 'negative' : 'neutral',
      weight: input.upcomingEventsCount * 9,
    });
  }

  if (input.pendingConvocations > 0) {
    fatigueFactors.push({
      id: 'pending_rsvp',
      label: 'Réponses en attente',
      detail: `${input.pendingConvocations} convocation(s) sans réponse`,
      impact: 'neutral',
      weight: input.pendingConvocations * 7,
    });
  }

  if (input.profileCompletion >= 70) {
    fatigueFactors.push({
      id: 'profile',
      label: 'Profil complet',
      detail: 'Meilleure personnalisation des conseils',
      impact: 'positive',
      weight: Math.round(input.profileCompletion * 0.08),
    });
  }

  if (input.wearableConnected) {
    const sourceLabel = getWearablePlatformLabel();
    if (input.stepsToday != null) {
      fatigueFactors.push({
        id: 'wearable_steps',
        label: `Pas (${sourceLabel})`,
        detail: `${input.stepsToday.toLocaleString('fr-FR')} pas aujourd’hui`,
        impact: input.stepsToday > 10_000 ? 'negative' : 'neutral',
        weight: input.stepsToday > 12_000 ? 6 : input.stepsToday > 9_000 ? 3 : 0,
      });
    }
    if (input.sleepHoursLastNight != null) {
      fatigueFactors.push({
        id: 'wearable_sleep',
        label: `Sommeil (${sourceLabel})`,
        detail: `${input.sleepHoursLastNight} h la nuit dernière`,
        impact: input.sleepHoursLastNight < 6 ? 'negative' : input.sleepHoursLastNight >= 7.5 ? 'positive' : 'neutral',
        weight: input.sleepHoursLastNight < 6 ? 8 : 0,
      });
    }
  }

  const recoveryFactors: HealthScoreFactor[] = [];

  if (input.wearableConnected && input.restingHeartRate != null) {
    const sourceLabel = getWearablePlatformLabel();
    recoveryFactors.push({
      id: 'wearable_hr',
      label: `FC repos (${sourceLabel})`,
      detail: `${input.restingHeartRate} bpm`,
      impact: input.restingHeartRate <= 58 ? 'positive' : 'neutral',
      weight: input.restingHeartRate <= 58 ? 4 : 0,
    });
  }

  if (input.streakDays > 0) {
    recoveryFactors.push({
      id: 'streak',
      label: 'Régularité',
      detail: `${input.streakDays} jour(s) d'activité suivie(s)`,
      impact: 'positive',
      weight: input.streakDays * 4,
    });
  }

  if (snapshot.state === 'RECOVERY' || input.recentMatchCount === 0) {
    recoveryFactors.push({
      id: 'rest',
      label: 'Repos récent',
      detail: 'Peu ou pas de charge récente. Récupération favorisée',
      impact: 'positive',
      weight: 12,
    });
  }

  if (snapshot.injuryRisk !== 'low') {
    recoveryFactors.push({
      id: 'risk',
      label: 'Risque blessure',
      detail:
        snapshot.injuryRisk === 'high'
          ? 'Charge élevée. Priorité récupération'
          : 'Surveillez la charge cette semaine',
      impact: 'negative',
      weight: snapshot.injuryRisk === 'high' ? 20 : 10,
    });
  }

  const summary =
    input.wearableConnected
      ? `${snapshot.state === 'INJURY_RISK' || snapshot.state === 'OVERLOADED'
          ? 'Votre corps signale une surcharge.'
          : snapshot.state === 'FATIGUED'
            ? 'Fatigue modérée détectée.'
            : 'Équilibre charge/récupération favorable.'} Scores ProDay ajustés avec vos données ${getWearablePlatformLabel()}.`
      : snapshot.state === 'INJURY_RISK' || snapshot.state === 'OVERLOADED'
      ? 'Votre corps signale une surcharge. Privilégiez repos et soins avant l’intensité.'
      : snapshot.state === 'FATIGUED'
        ? 'Fatigue modérée : allégez la semaine et favorisez la récupération active.'
        : 'Votre équilibre charge/récupération permet de performer en sécurité. Les scores ci-dessous sont estimés depuis votre activité ProDay (connectez Apple Santé ou Google Health pour plus de précision).';

  return { fatigueFactors, recoveryFactors, summary };
}
