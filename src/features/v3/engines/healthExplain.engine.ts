import type { HealthEngineInput, HealthSnapshot } from '../../../core/types/health';

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

  const recoveryFactors: HealthScoreFactor[] = [];

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
      detail: 'Peu ou pas de charge récente — récupération favorisée',
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
          ? 'Charge élevée — priorité récupération'
          : 'Surveillez la charge cette semaine',
      impact: 'negative',
      weight: snapshot.injuryRisk === 'high' ? 20 : 10,
    });
  }

  const summary =
    snapshot.state === 'INJURY_RISK' || snapshot.state === 'OVERLOADED'
      ? 'Votre corps signale une surcharge. L’IA privilégie repos et soins avant l’intensité.'
      : snapshot.state === 'FATIGUED'
        ? 'Fatigue modérée : allégez la semaine et favorisez la récupération active.'
        : 'Votre équilibre charge/récupération permet de performer en sécurité.';

  return { fatigueFactors, recoveryFactors, summary };
}
