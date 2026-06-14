import type { UserRole } from '../../models/User';

const MERCATO_HINTS = ['candidature', 'poste', 'essai', 'convocation', 'entraînement'];
const RDV_HINTS = ['rdv', 'dispo', 'disponible', 'créneau', 'rendez-vous', 'kiné', 'consultation'];
const MATCH_HINTS = ['match', 'amicaux', 'composition', 'convoc'];

/** Suggestions de réponse rapide contextuelles (annexe A — Messages V3+). */
export function buildChatQuickReplies(params: {
  otherRole?: UserRole;
  otherName: string;
  lastIncoming?: string;
}): string[] {
  const replies = new Set<string>();
  const incoming = params.lastIncoming?.toLowerCase() ?? '';
  const firstName = params.otherName.split(' ')[0] || params.otherName;

  if (RDV_HINTS.some((hint) => incoming.includes(hint))) {
    replies.add('Oui, je suis disponible');
    replies.add('On peut caler ça cette semaine');
    replies.add('Quels créneaux vous arrange ?');
  }

  if (MATCH_HINTS.some((hint) => incoming.includes(hint))) {
    replies.add('Je confirme ma présence');
    replies.add('Je ne pourrai pas être là');
  }

  if (MERCATO_HINTS.some((hint) => incoming.includes(hint))) {
    replies.add('Je suis très intéressé(e)');
    replies.add('Pouvez-vous m’en dire plus ?');
  }

  if (params.otherRole === 'coach' || params.otherRole === 'club') {
    replies.add('Merci coach, bien reçu');
    replies.add('Je suis motivé(e) pour la suite');
  }

  if (params.otherRole === 'physio') {
    replies.add('Merci docteur, je note');
    replies.add('Je confirme le créneau proposé');
  }

  if (params.otherRole === 'agent' || params.otherRole === 'recruiter') {
    replies.add('Oui, parlons-en');
    replies.add('Envoyez-moi les détails');
  }

  replies.add(`Merci ${firstName} !`);
  replies.add('Parfait, à très vite');

  return [...replies].slice(0, 4);
}
