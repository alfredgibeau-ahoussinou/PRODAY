import type { ClubNavItemId } from '../navigation/clubNavConfig';
import type { ClubWorkspace } from '../hooks/useClubWorkspace';

export type ClubAiSafeActionId =
  | 'briefing'
  | 'nav_coaches'
  | 'nav_trainings'
  | 'nav_matches'
  | 'nav_notifications'
  | 'propose_assign_coach'
  | 'propose_send_reminders'
  | 'refuse_auto_move';

export type ClubAiPlan = {
  reply: string;
  /** Action locale sûre (nav / briefing) — exécutée sans confirm. */
  safeNav?: ClubNavItemId;
  /** Action sensible — Alert de confirmation avant exécution. */
  sensitive?: {
    id: ClubAiSafeActionId;
    title: string;
    body: string;
    confirmLabel: string;
  };
};

/**
 * Planificateur local pour actions sensibles — le dialogue distant (Mistral)
 * reste dans ClubAiAssistant ; ici on ne déclenche jamais d’auto-écriture.
 */
export function planClubAiReply(text: string, ws: ClubWorkspace): ClubAiPlan {
  const lower = text.trim().toLowerCase();

  if (lower.includes('déplac') || lower.includes('transfert') || lower.includes('bouger')) {
    return {
      reply:
        'Je peux suggérer un mouvement entre équipes, mais jamais l’appliquer sans votre confirmation explicite. Aucun joueur ne sera déplacé automatiquement.',
      sensitive: {
        id: 'refuse_auto_move',
        title: 'Mouvement d’effectif',
        body: 'L’IA ne déplace pas les joueurs. Ouvrir l’effectif pour une proposition manuelle ?',
        confirmLabel: 'Voir effectif',
      },
    };
  }

  if (lower.includes('brief') || lower.includes('aujourd') || lower.includes('résumé')) {
    return {
      reply: `${ws.briefingHeadline} — ${ws.briefingSummary} Statut : ${ws.statusLabel}.`,
    };
  }

  if (lower.includes('notif') || lower.includes('alerte')) {
    return {
      reply: 'Voici le centre de notifications du club.',
      safeNav: 'notifications',
    };
  }

  if (
    lower.includes('convoc') ||
    lower.includes('rappel') ||
    lower.includes('relance') ||
    lower.includes('présence')
  ) {
    const nextTraining = ws.todayTrainings[0] ?? ws.events.find((e) => e.event_type === 'training');
    return {
      reply: nextTraining
        ? `Je peux envoyer un rappel de convocation pour « ${nextTraining.title} ». Confirmation obligatoire.`
        : 'Aucune séance à rappeler tout de suite. Je peux ouvrir les entraînements pour en créer une.',
      sensitive: {
        id: nextTraining ? 'propose_send_reminders' : 'nav_trainings',
        title: nextTraining ? 'Envoyer les rappels' : 'Entraînements',
        body: nextTraining
          ? `Confirmer l’envoi des rappels pour « ${nextTraining.title} » ? Les joueurs en attente seront notifiés.`
          : 'Ouvrir la liste des entraînements ?',
        confirmLabel: nextTraining ? 'Envoyer' : 'Ouvrir',
      },
    };
  }

  if (lower.includes('coach') || lower.includes('affect')) {
    return {
      reply:
        ws.teamsWithoutCoach > 0
          ? `${ws.teamsWithoutCoach} équipe(s) sans coach. Je peux ouvrir l’affectation — confirmation avant toute écriture.`
          : 'Toutes les équipes ont un coach. Vous pouvez quand même revoir les affectations.',
      sensitive: {
        id: 'propose_assign_coach',
        title: 'Affectation coach',
        body: 'Ouvrir l’écran Coach pour affecter ou retirer un coach ? Aucun joueur ne sera déplacé.',
        confirmLabel: 'Voir les coachs',
      },
    };
  }

  if (lower.includes('match')) {
    return {
      reply: 'Je peux ouvrir le calendrier des matchs et les invitations inter-clubs.',
      safeNav: 'matches',
    };
  }

  if (lower.includes('entraî') || lower.includes('entrain')) {
    return {
      reply: 'Je peux ouvrir les entraînements et la feuille de présence.',
      safeNav: 'trainings',
    };
  }

  return {
    reply:
      'Je recommande, je ne décide pas. Essayez « briefing », « rappels convocation », « affecter coach » ou « notifications ». Toute action sensible demandera votre OK.',
  };
}
