/**
 * Historique de la composition — **annulation de session**.
 *
 * Le coach enchaîne les essais : aligner, retirer, échanger deux postes,
 * changer de système, gérer une indisponibilité. Un `undo` limité à la dernière
 * action ne suffit donc pas — il faut pouvoir **remonter toute la session**,
 * jusqu'au onze d'ouverture.
 *
 * Deux règles portent l'honnêteté de cette pile.
 *
 * 1. **Un instantané est complet.** Il contient le format, le système, les crans
 *    *et* l'effectif : sans l'effectif, annuler une indisponibilité remettrait
 *    un joueur absent sur le terrain — exactement l'état que l'écran s'interdit
 *    par ailleurs.
 * 2. **Rien n'est empilé deux fois.** Un geste sans effet (reposer un joueur
 *    sur son propre poste) n'ajoute pas d'étape : le coach ne peut pas « annuler
 *    dans le vide ».
 */

import type { MatchFormatKey } from '../constants/tacticalMatrix';
import type { SquadPlayer } from './coachSquadRoster';

export type CoachLineupSnapshot = {
  format: MatchFormatKey;
  formation: string;
  /** Identifiant par cran de terrain (« null » = poste libre). */
  starterIds: (string | null)[];
  /** Effectif au moment du geste — disponibilité comprise. */
  squad: SquadPlayer[];
};

/** Au-delà, la session n'est plus une session : on oublie les plus vieux gestes. */
export const COACH_LINEUP_HISTORY_LIMIT = 40;

/** Instantané immuable de l'état courant (copies, jamais de références vives). */
export function readCoachLineupSnapshot(state: {
  format: MatchFormatKey;
  formation: string;
  starterIds: (string | null)[];
  squad: SquadPlayer[];
}): CoachLineupSnapshot {
  return {
    format: state.format,
    formation: state.formation,
    starterIds: [...state.starterIds],
    squad: state.squad.map((player) => ({ ...player })),
  };
}

function sameSquad(a: SquadPlayer[], b: SquadPlayer[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((player, index) => {
    const other = b[index];
    if (!other || other.id !== player.id) return false;
    /** Seul champ que le coach modifie réellement sur l'effectif. */
    return other.availability === player.availability;
  });
}

/** Deux instantanés décrivent-ils le même onze ? (garde anti-doublon de la pile) */
export function sameCoachLineup(a: CoachLineupSnapshot, b: CoachLineupSnapshot): boolean {
  if (a.format !== b.format || a.formation !== b.formation) return false;
  if (a.starterIds.length !== b.starterIds.length) return false;
  if (a.starterIds.some((id, index) => id !== b.starterIds[index])) return false;
  return sameSquad(a.squad, b.squad);
}

/** Empile l'état **avant** un geste, en ignorant un doublon strict. */
export function pushCoachLineupHistory(
  history: CoachLineupSnapshot[],
  snapshot: CoachLineupSnapshot,
): CoachLineupSnapshot[] {
  const last = history[history.length - 1];
  if (last && sameCoachLineup(last, snapshot)) return history;
  const next = [...history, snapshot];
  return next.length > COACH_LINEUP_HISTORY_LIMIT
    ? next.slice(next.length - COACH_LINEUP_HISTORY_LIMIT)
    : next;
}

/** Dépile le dernier état — `null` quand la session est déjà revenue à son début. */
export function popCoachLineupHistory(
  history: CoachLineupSnapshot[],
): { history: CoachLineupSnapshot[]; snapshot: CoachLineupSnapshot } | null {
  const snapshot = history[history.length - 1];
  if (!snapshot) return null;
  return { history: history.slice(0, -1), snapshot };
}
