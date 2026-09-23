/**
 * Brouillon de groupe de messagerie — pure et testable, jusqu'au document écrit.
 *
 * Deux garanties tenues ici, parce qu'elles sont faciles à perdre dans un écran :
 *   1. **Aucun participant hors périmètre de contact.** L'éligibilité est décidée par la règle
 *      d'autorité (`canContact`, alimenté par `evaluateMessagingPermission`) ; un contact
 *      refusé est listé avec son motif, il n'est jamais simplement masqué ni contourné.
 *   2. **Le document Firestore est construit hors de l'écran** (`buildGroupThreadPayload`), donc
 *      vérifiable : identifiant unique, créateur toujours membre, rôles enregistrés pour que la
 *      catégorisation ne devine rien, non-lus pour les autres membres seulement.
 */
import type { UserRole } from '../../models/User';

/** Au-delà, la conversation devient illisible et coûteuse à fan-out. */
export const MAX_GROUP_PARTICIPANTS = 30;
export const MIN_GROUP_NAME = 2;
export const MAX_GROUP_NAME = 60;

export type GroupCandidate = {
  uid: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  isMinor?: boolean;
};

export type GroupContactDecision = { allowed: boolean; reason?: string };

export type GroupDraft = {
  name: string;
  /** UID du créateur : toujours membre, jamais retirable par lui-même au moment de la création. */
  creatorUid: string;
  creatorName: string;
  creatorRole: UserRole;
  /** Participants choisis, créateur exclu. */
  selected: GroupCandidate[];
  avatarUrl?: string;
};

export type GroupCandidateState = {
  candidate: GroupCandidate;
  selectable: boolean;
  /** Motif exact du refus, affiché tel quel à l'utilisateur. */
  blockedReason?: string;
  alreadySelected: boolean;
};

/**
 * Classe chaque candidat. Un contact refusé reste visible avec son motif : le masquer ferait
 * croire à une absence de contact plutôt qu'à une règle.
 */
export function evaluateGroupCandidates(
  candidates: GroupCandidate[],
  selectedUids: string[],
  canContact: (candidate: GroupCandidate) => GroupContactDecision,
): GroupCandidateState[] {
  const selectedSet = new Set(selectedUids);
  return candidates.map((candidate) => {
    const decision = canContact(candidate);
    return {
      candidate,
      selectable: decision.allowed,
      blockedReason: decision.allowed ? undefined : decision.reason,
      alreadySelected: selectedSet.has(candidate.uid),
    };
  });
}

export type GroupDraftErrors = {
  name?: string;
  participants?: string;
  avatar?: string;
};

export function validateGroupDraft(draft: GroupDraft): GroupDraftErrors {
  const errors: GroupDraftErrors = {};
  const name = draft.name.trim();

  if (name.length === 0) {
    errors.name = 'Donnez un nom au groupe.';
  } else if (name.length < MIN_GROUP_NAME) {
    errors.name = `Le nom doit contenir au moins ${MIN_GROUP_NAME} caractères.`;
  } else if (name.length > MAX_GROUP_NAME) {
    errors.name = `Le nom ne peut pas dépasser ${MAX_GROUP_NAME} caractères.`;
  }

  if (draft.selected.length === 0) {
    errors.participants = 'Sélectionnez au moins un participant.';
  } else if (draft.selected.length + 1 > MAX_GROUP_PARTICIPANTS) {
    errors.participants = `Un groupe est limité à ${MAX_GROUP_PARTICIPANTS} participants.`;
  } else {
    const uidSet = new Set(draft.selected.map((s) => s.uid));
    if (uidSet.size !== draft.selected.length) {
      errors.participants = 'Un même participant ne peut pas être ajouté deux fois.';
    } else if (uidSet.has(draft.creatorUid)) {
      errors.participants = 'Vous faites déjà partie du groupe.';
    }
  }

  return errors;
}

export function isGroupDraftValid(draft: GroupDraft): boolean {
  const e = validateGroupDraft(draft);
  return !e.name && !e.participants && !e.avatar;
}

/**
 * Identifiant de fil unique et non devinable. Préfixé pour être reconnaissable comme groupe.
 * Le résultat est mis en minuscules : la classe `a-z` combinée au drapeau `i` ne filtrait pas
 * les majuscules, laissant passer un identifiant à casse mixte.
 */
export function buildGroupThreadId(random: () => string): string {
  const token = random()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  if (!token) {
    throw new Error('Identifiant de groupe insuffisant : générez-le depuis une source aléatoire.');
  }
  return `grp_${token}`;
}

export type GroupParticipantRoles = Record<string, UserRole>;
export type GroupParticipantNames = Record<string, string>;

export type GroupThreadPayload = {
  id: string;
  is_group: true;
  thread_kind: 'group';
  thread_title: string;
  group_avatar_url: string | null;
  created_by: string;
  participant_ids: string[];
  participant_names: GroupParticipantNames;
  /** Rôles réellement connus : ils évitent de deviner les catégories à l'affichage. */
  participant_roles: GroupParticipantRoles;
  contains_minor: boolean;
  last_message: string;
  unread_by: string[];
  admin_uids: string[];
};

/**
 * Construit le document du groupe.
 * - l'ordre des participants est stable (créateur d'abord, puis les invités d'origine) ;
 * - `unread_by` ne contient **jamais** le créateur : le fil est considéré lu pour lui ;
 * - `admin_uids` démarre au créateur, ce qui rend la gestion des membres explicite.
 */
export function buildGroupThreadPayload(
  draft: GroupDraft,
  threadId: string,
): GroupThreadPayload {
  const seen = new Set<string>([draft.creatorUid]);
  const participants: GroupCandidate[] = [];
  for (const candidate of draft.selected) {
    if (seen.has(candidate.uid)) continue;
    seen.add(candidate.uid);
    participants.push(candidate);
  }

  const participantIds = [draft.creatorUid, ...participants.map((p) => p.uid)];
  const participantNames: GroupParticipantNames = { [draft.creatorUid]: draft.creatorName };
  const participantRoles: GroupParticipantRoles = { [draft.creatorUid]: draft.creatorRole };

  for (const p of participants) {
    participantNames[p.uid] = p.displayName;
    participantRoles[p.uid] = p.role;
  }

  return {
    id: threadId,
    is_group: true,
    thread_kind: 'group',
    thread_title: draft.name.trim(),
    group_avatar_url: draft.avatarUrl?.trim() ? draft.avatarUrl.trim() : null,
    created_by: draft.creatorUid,
    participant_ids: participantIds,
    participant_names: participantNames,
    participant_roles: participantRoles,
    contains_minor: participants.some((p) => p.isMinor === true),
    last_message: '',
    unread_by: participants.map((p) => p.uid),
    admin_uids: [draft.creatorUid],
  };
}

/* ------------------------------------------------------------------ *
 * Gestion des membres
 * ------------------------------------------------------------------ */

export type GroupMembershipAction =
  | { kind: 'add'; actorUid: string; targetUid: string }
  | { kind: 'remove'; actorUid: string; targetUid: string }
  | { kind: 'leave'; actorUid: string };

export type GroupMembershipContext = {
  participantIds: string[];
  adminUids: string[];
  createdBy: string;
};

/**
 * Qui peut ajouter, retirer ou quitter. Règle explicite, et non implicite dans l'écran :
 * seuls les administrateurs gèrent les membres ; un membre peut toujours se retirer lui-même ;
 * le dernier administrateur ne peut pas partir sans transmettre le rôle.
 */
export function evaluateGroupMembershipAction(
  ctx: GroupMembershipContext,
  action: GroupMembershipAction,
): { allowed: boolean; reason?: string } {
  const isAdmin = ctx.adminUids.includes(action.actorUid);

  if (action.kind === 'leave') {
    if (!ctx.participantIds.includes(action.actorUid)) {
      return { allowed: false, reason: 'Vous ne faites pas partie de ce groupe.' };
    }
    if (isAdmin && ctx.adminUids.length === 1 && ctx.participantIds.length > 1) {
      return {
        allowed: false,
        reason: 'Vous êtes le seul administrateur : désignez un autre administrateur avant de quitter le groupe.',
      };
    }
    return { allowed: true };
  }

  if (!isAdmin) {
    return { allowed: false, reason: 'Seuls les administrateurs du groupe gèrent les membres.' };
  }

  if (action.kind === 'add') {
    if (ctx.participantIds.includes(action.targetUid)) {
      return { allowed: false, reason: 'Ce membre fait déjà partie du groupe.' };
    }
    if (ctx.participantIds.length >= MAX_GROUP_PARTICIPANTS) {
      return { allowed: false, reason: `Un groupe est limité à ${MAX_GROUP_PARTICIPANTS} participants.` };
    }
    return { allowed: true };
  }

  // remove
  if (!ctx.participantIds.includes(action.targetUid)) {
    return { allowed: false, reason: 'Ce membre ne fait pas partie du groupe.' };
  }
  // L'auto-retrait est examiné **avant** la protection du créateur : sinon un créateur
  // cherchant à se retirer recevrait « le créateur ne peut pas être retiré » alors que le
  // chemin prévu est « Quitter le groupe » (qui contrôle, lui, la passation d'administration).
  if (action.targetUid === action.actorUid) {
    return { allowed: false, reason: 'Pour vous retirer, utilisez l’option Quitter le groupe.' };
  }
  if (action.targetUid === ctx.createdBy) {
    return { allowed: false, reason: 'Le créateur du groupe ne peut pas être retiré.' };
  }
  return { allowed: true };
}

/** Les nouveaux membres voient l'historique : le fil n'est pas segmenté. Dit explicitement. */
export function newMembersSeeHistory(): boolean {
  return true;
}

/* ------------------------------------------------------------------ *
 * Erreurs du service
 * ------------------------------------------------------------------ */

/**
 * Traduit le refus du service en message exploitable.
 *
 * Constaté en conditions réelles : la création d'un groupe renvoie
 * `Missing or insufficient permissions.` en anglais, sans dire quoi faire. Ce message vient des
 * **règles Firestore**, qui font autorité : `isValidThreadCreate()` exige exactement deux
 * participants, et la mise à jour interdit de modifier `participant_ids`. Tant que ces règles
 * ne sont pas adaptées, un groupe ne peut pas être créé côté service — le dire clairement
 * vaut mieux qu'un échec opaque.
 */
export function humanizeGroupError(raw: string): string {
  const s = (raw || '').toLowerCase();
  if (/missing or insufficient permissions|permission-denied|permission denied/.test(s)) {
    return 'Le service a refusé l’opération : les règles du club n’autorisent pas encore les groupes (limitées aujourd’hui aux conversations à deux). Aucun groupe n’a été créé.';
  }
  if (/unauthenticated|connexion requise/.test(s)) {
    return 'Connexion requise pour créer un groupe.';
  }
  if (/firebase non configur|not configured/.test(s)) {
    return 'Service de messagerie non configuré sur cet environnement.';
  }
  if (/existe déjà|already exists/.test(s)) {
    return 'Un groupe portant cet identifiant existe déjà. Relancez la création.';
  }
  const cleaned = (raw || '').replace(/\{[\s\S]*\}/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return cleaned.length > 0
    ? `${cleaned} Aucun groupe n’a été créé.`
    : 'Création du groupe impossible. Aucun groupe n’a été créé.';
}
