/**
 * Relance groupée des réponses en attente — **la logique du badge**, extraite
 * pour que l'accueil et la page Effectif partagent exactement le même
 * comportement au lieu de dupliquer quarante lignes d'état.
 *
 * L'envoi passe par `executeBulkRsvpReminders` (utils/coachRsvpReminders) — le
 * même chemin que les rappels J-1 : notification locale au joueur, inbox staff
 * du club, tuteur si mineur. L'acteur est le profil de session avec son flag
 * admin, comme les autres écritures staff du coach.
 */

import { useCallback, useEffect, useState } from 'react';
import type { TeamEvent } from '../models/TeamEvent';
import { executeBulkRsvpReminders } from '../utils/coachRsvpReminders';
import { useSessionProfile } from './useSessionProfile';

/** Durée d'affichage du retour succès/échec sur le badge. */
const FEEDBACK_MS = 2800;

export type RsvpRemindFeedback = 'sent' | 'failed' | 'cooldown';

/**
 * @param event la convocation ciblée — le prochain événement de l'écran.
 *   `coachRsvpReminders` cible lui-même les invités sans réponse : aucun
 *   calcul de liste côté appelant, donc aucune divergence possible.
 */
export function useCoachRsvpRemind(event: TeamEvent | null): {
  /** Un envoi est en cours — le badge remplace son bouton par un spinner. */
  reminding: boolean;
  /** Déclenche la relance groupée. Sans club rattaché, annonce l'échec. */
  remindAll: () => Promise<void>;
  /** Retour éphémère sur le badge — `null` une fois le délai écoulé. */
  feedbackKind: RsvpRemindFeedback | null;
} {
  const profile = useSessionProfile();
  const [reminding, setReminding] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: RsvpRemindFeedback;
    until: number;
  } | null>(null);

  const remindAll = useCallback(async () => {
    if (!event || reminding) return;
    if (!profile?.profile.club_id) {
      /**
       * Sans club, l'inbox staff ne peut pas être alimentée : l'écriture serait
       * refusée, alors on l'annonce au lieu de laisser croire à l'envoi.
       */
      setFeedback({ kind: 'failed', until: Date.now() + FEEDBACK_MS });
      return;
    }
    setReminding(true);
    try {
      const result = await executeBulkRsvpReminders([event], {
        user: profile,
        isAdmin: profile.is_admin,
      });
      if (result.remindedCount > 0) {
        setFeedback({ kind: 'sent', until: Date.now() + FEEDBACK_MS });
      } else if (result.blockedCount > 0) {
        /**
         * Tous les destinataires ont déjà été relancés < 24 h : le badge l'annonce
         * sans prétendre ni à un succès ni à un échec d'envoi.
         */
        setFeedback({ kind: 'cooldown', until: Date.now() + FEEDBACK_MS });
      } else {
        setFeedback({ kind: 'failed', until: Date.now() + FEEDBACK_MS });
      }
    } catch {
      setFeedback({ kind: 'failed', until: Date.now() + FEEDBACK_MS });
    } finally {
      setReminding(false);
    }
  }, [event, profile, reminding]);

  const feedbackKind: RsvpRemindFeedback | null =
    feedback && Date.now() < feedback.until ? feedback.kind : null;

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  return { reminding, remindAll, feedbackKind };
}
