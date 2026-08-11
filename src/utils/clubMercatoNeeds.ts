/**
 * Mercato club interne — cartographie des besoins (recommandations, pas vérité absolue).
 */

export type SquadPositionNeed =
  | 'goalkeeper'
  | 'defender'
  | 'midfielder'
  | 'forward';

export const SQUAD_POSITION_LABELS: Record<SquadPositionNeed, string> = {
  goalkeeper: 'Gardien',
  defender: 'Défenseur',
  midfielder: 'Milieu',
  forward: 'Attaquant',
};

export interface ClubRosterNeedLine {
  position: SquadPositionNeed;
  count: number;
}

export interface ClubRosterNeedInput {
  teamId: string;
  teamLabel: string;
  needs: ClubRosterNeedLine[];
  /** Effectif actuel par poste (données réelles uniquement). */
  currentByPosition: Partial<Record<SquadPositionNeed, number>>;
  /** Joueurs qui changent de catégorie (uids) — optionnel. */
  departingCount?: number;
}

export interface ClubRosterNeedRecommendation {
  teamId: string;
  teamLabel: string;
  position: SquadPositionNeed;
  requested: number;
  current: number | null;
  /** Suggestion textuelle prudente. */
  suggestion: string;
  confidence: 'low' | 'medium';
  dataGaps: string[];
}

export function recommendRosterNeeds(
  input: ClubRosterNeedInput,
): ClubRosterNeedRecommendation[] {
  return input.needs.map((line) => {
    const raw = input.currentByPosition[line.position];
    const dataGaps: string[] = [];
    if (raw == null) dataGaps.push(`effectif ${SQUAD_POSITION_LABELS[line.position]}`);
    const current = raw ?? null;
    const shortfall =
      current == null ? line.count : Math.max(0, line.count - current + (input.departingCount ?? 0));

    let suggestion: string;
    let confidence: 'low' | 'medium' = 'low';
    if (current == null) {
      suggestion = `Donnée indisponible pour le poste ${SQUAD_POSITION_LABELS[line.position]}. Ajoutez l’effectif actuel pour affiner.`;
    } else if (shortfall > 0) {
      confidence = dataGaps.length ? 'low' : 'medium';
      suggestion = `Pour la saison prochaine, l’effectif semble nécessiter un renfort au poste de ${SQUAD_POSITION_LABELS[line.position].toLowerCase()} (besoin estimé : ${shortfall}). Recommandation basée sur les données disponibles — pas une vérité absolue.`;
    } else {
      confidence = 'medium';
      suggestion = `Besoin ${SQUAD_POSITION_LABELS[line.position]} couvert selon les données actuelles.`;
    }

    return {
      teamId: input.teamId,
      teamLabel: input.teamLabel,
      position: line.position,
      requested: line.count,
      current,
      suggestion,
      confidence,
      dataGaps,
    };
  });
}
