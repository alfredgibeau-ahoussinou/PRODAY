/**
 * Charge & disponibilité — alertes de prudence (pas de diagnostic médical).
 */

export type ReturnToPlayStatus =
  | 'unavailable'
  | 'progressive'
  | 'partial_training'
  | 'available'
  | 'final_clearance';

export const RETURN_TO_PLAY_LABELS: Record<ReturnToPlayStatus, string> = {
  unavailable: 'Indisponible',
  progressive: 'Reprise progressive',
  partial_training: 'Entraînement partiel',
  available: 'Disponible',
  final_clearance: 'Validation finale',
};

/** Statuts visibles coach (sans détail médical). */
export type CoachVisibleAvailability = 'available' | 'unavailable' | 'progressive';

export function toCoachVisibleAvailability(
  status: ReturnToPlayStatus,
): CoachVisibleAvailability {
  if (status === 'available' || status === 'final_clearance') return 'available';
  if (status === 'unavailable') return 'unavailable';
  return 'progressive';
}

export interface PlayerLoadSignals {
  uid: string;
  displayName: string;
  matchesLast7d: number;
  minutesLast7d: number;
  trainingsLast7d: number;
  /** Fatigue déclarée 1–10 si fournie, sinon null = donnée indisponible. */
  declaredFatigue: number | null;
  /** Jours depuis dernier match (null = jamais). */
  daysSinceLastMatch: number | null;
  rtpStatus?: ReturnToPlayStatus;
}

export type LoadAlertLevel = 'info' | 'caution' | 'high';

export interface LoadAlert {
  uid: string;
  displayName: string;
  level: LoadAlertLevel;
  /** Message opérationnel — jamais un % de risque de blessure. */
  message: string;
  /** Données manquantes explicites. */
  missingData: string[];
}

/**
 * Construit des alertes de charge à partir des signaux disponibles.
 * N’invente aucune donnée manquante.
 */
export function buildLoadAlerts(players: PlayerLoadSignals[]): LoadAlert[] {
  const alerts: LoadAlert[] = [];

  for (const p of players) {
    const missing: string[] = [];
    if (p.declaredFatigue == null) missing.push('fatigue déclarée');
    if (p.daysSinceLastMatch == null && p.matchesLast7d === 0) missing.push('historique match');

    const denseCompetition =
      p.matchesLast7d >= 2 || (p.minutesLast7d >= 160 && p.trainingsLast7d >= 2);
    const highDeclared = (p.declaredFatigue ?? 0) >= 7;
    const tightTurnaround = p.daysSinceLastMatch != null && p.daysSinceLastMatch <= 2;

    if (p.rtpStatus === 'unavailable' || p.rtpStatus === 'progressive') {
      alerts.push({
        uid: p.uid,
        displayName: p.displayName,
        level: 'info',
        message: `${p.displayName} — statut : ${RETURN_TO_PLAY_LABELS[p.rtpStatus]}. Pas de détail médical affiché.`,
        missingData: missing,
      });
      continue;
    }

    if (denseCompetition || highDeclared || tightTurnaround) {
      alerts.push({
        uid: p.uid,
        displayName: p.displayName,
        level: highDeclared || (denseCompetition && tightTurnaround) ? 'high' : 'caution',
        message:
          'Charge élevée détectée sur une période courte. Vérifiez la disponibilité et adaptez la charge si nécessaire. Ceci n’est pas un diagnostic médical.',
        missingData: missing,
      });
    } else if (missing.length > 0) {
      alerts.push({
        uid: p.uid,
        displayName: p.displayName,
        level: 'info',
        message: 'Donnée indisponible pour une alerte précise.',
        missingData: missing,
      });
    }
  }

  return alerts.sort((a, b) => {
    const rank = { high: 0, caution: 1, info: 2 };
    return rank[a.level] - rank[b.level];
  });
}
