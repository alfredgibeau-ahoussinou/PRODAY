import type { UserRole } from '../../models/User';

const MERCATO_HINTS = ['candidature', 'poste', 'essai', 'convocation', 'entraînement'];
const RDV_HINTS = ['rdv', 'dispo', 'disponible', 'créneau', 'rendez-vous', 'kiné', 'consultation'];
const MATCH_HINTS = ['match', 'amicaux', 'composition', 'convoc'];

export type ChatQuickReplyIcon =
  | 'calendar'
  | 'checkmark-circle'
  | 'chat'
  | 'close'
  | 'star'
  | 'football'
  | 'handshake'
  | 'mail'
  | 'heart'
  | 'time';

export type ChatQuickReply = {
  id: string;
  text: string;
  icon: ChatQuickReplyIcon;
};

function pushReply(
  list: ChatQuickReply[],
  seen: Set<string>,
  item: ChatQuickReply
): void {
  if (seen.has(item.text) || list.length >= 4) return;
  seen.add(item.text);
  list.push(item);
}

/** Suggestions de réponse rapide contextuelles (annexe A — Messages V3+). */
export function buildChatQuickReplies(params: {
  otherRole?: UserRole;
  otherName: string;
  lastIncoming?: string;
}): ChatQuickReply[] {
  const replies: ChatQuickReply[] = [];
  const seen = new Set<string>();
  const incoming = params.lastIncoming?.toLowerCase() ?? '';
  const firstName = params.otherName.split(' ')[0] || params.otherName;

  if (RDV_HINTS.some((hint) => incoming.includes(hint))) {
    pushReply(replies, seen, {
      id: 'rdv-yes',
      text: 'Oui, je suis dispo',
      icon: 'calendar',
    });
    pushReply(replies, seen, {
      id: 'rdv-week',
      text: 'On peut caler ça cette semaine',
      icon: 'calendar',
    });
    pushReply(replies, seen, {
      id: 'rdv-slots',
      text: 'Quels créneaux vous conviennent ?',
      icon: 'time',
    });
  }

  if (MATCH_HINTS.some((hint) => incoming.includes(hint))) {
    pushReply(replies, seen, {
      id: 'match-yes',
      text: 'Je confirme ma présence',
      icon: 'checkmark-circle',
    });
    pushReply(replies, seen, {
      id: 'match-no',
      text: 'Je ne pourrai pas venir',
      icon: 'close',
    });
  }

  if (MERCATO_HINTS.some((hint) => incoming.includes(hint))) {
    pushReply(replies, seen, {
      id: 'mercato-yes',
      text: 'Très intéressé(e) !',
      icon: 'star',
    });
    pushReply(replies, seen, {
      id: 'mercato-more',
      text: 'Pouvez-vous m’en dire plus ?',
      icon: 'chat',
    });
  }

  if (params.otherRole === 'coach' || params.otherRole === 'club') {
    pushReply(replies, seen, {
      id: 'coach-ok',
      text: 'Bien reçu, coach',
      icon: 'checkmark-circle',
    });
    pushReply(replies, seen, {
      id: 'coach-motivated',
      text: 'Motivé(e) pour la suite',
      icon: 'football',
    });
  }

  if (params.otherRole === 'physio') {
    pushReply(replies, seen, {
      id: 'physio-noted',
      text: 'C’est noté, merci',
      icon: 'checkmark-circle',
    });
    pushReply(replies, seen, {
      id: 'physio-slot',
      text: 'Je confirme le créneau',
      icon: 'calendar',
    });
  }

  if (params.otherRole === 'agent' || params.otherRole === 'recruiter') {
    pushReply(replies, seen, {
      id: 'agent-talk',
      text: 'Oui, parlons-en',
      icon: 'handshake',
    });
    pushReply(replies, seen, {
      id: 'agent-details',
      text: 'Envoyez-moi les détails',
      icon: 'mail',
    });
  }

  pushReply(replies, seen, {
    id: 'thanks',
    text: `Merci ${firstName} !`,
    icon: 'heart',
  });
  pushReply(replies, seen, {
    id: 'soon',
    text: 'Parfait, à très vite',
    icon: 'chat',
  });

  return replies.slice(0, 4);
}
