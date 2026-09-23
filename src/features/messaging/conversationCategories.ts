/**
 * Catégorisation des conversations — pure et testable.
 *
 * Les catégories **organisent** l'affichage ; elles ne donnent ni ne retirent aucun droit.
 * Une conversation n'est classée dans « Joueurs », « Parents », « Coachs » ou « Club/Staff »
 * que si le rôle réel du participant est **connu** (`resolveRole`). Rôle inconnu ⇒ la
 * conversation reste dans « Tous » et dans aucune catégorie précise : on ne devine pas.
 *
 * Un groupe mixte est volontairement présent dans **plusieurs** catégories (c'est son intérêt),
 * mais il ne s'affiche qu'une seule fois dans la liste.
 */
import type { UserRole } from '../../models/User';

export type ConversationCategory = 'all' | 'players' | 'parents' | 'coaches' | 'club_staff';

export const CONVERSATION_CATEGORIES: { id: ConversationCategory; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'players', label: 'Joueurs' },
  { id: 'parents', label: 'Parents' },
  { id: 'coaches', label: 'Coachs' },
  { id: 'club_staff', label: 'Club / Staff' },
];

/** Nature de la conversation : dialogue direct, groupe, annonce officielle. */
export type ConversationKind = 'direct' | 'group' | 'announcement';

export type CategorizableThread = {
  id: string;
  other_user_id?: string;
  participant_name?: string;
  thread_title?: string;
  thread_kind?: string;
  last_message?: string;
  unread?: boolean;
  /** Ajoutés par la création de groupe : données écrites, pas déduites. */
  is_group?: boolean;
  participant_ids?: string[];
  /** Rôles enregistrés à la création. Typés largement : ils viennent de Firestore. */
  participant_roles?: Record<string, string>;
  /** Une annonce officielle est diffusée par un club, pas un dialogue. */
  is_announcement?: boolean;
};

export function resolveConversationKind(thread: CategorizableThread): ConversationKind {
  if (thread.is_announcement || thread.thread_kind === 'announcement') return 'announcement';
  if (thread.is_group || thread.thread_kind === 'team_group') return 'group';
  return 'direct';
}

/**
 * Rôles réellement présents dans la conversation (hors lecteur).
 * Pour un direct : le rôle de l'autre participant. Pour un groupe : tous les membres connus.
 */
export function conversationRoles(
  thread: CategorizableThread,
  currentUid: string,
  resolveRole: (uid: string) => UserRole | null,
): UserRole[] {
  const fromMap = thread.participant_roles;
  if (fromMap && Object.keys(fromMap).length > 0) {
    return Object.entries(fromMap)
      .filter(([uid]) => uid !== currentUid)
      .map(([, role]) => role as UserRole);
  }
  if (thread.is_group || thread.thread_kind === 'team_group') {
    const ids = thread.participant_ids ?? [];
    return ids
      .filter((uid) => uid !== currentUid)
      .map((uid) => resolveRole(uid))
      .filter((r): r is UserRole => r !== null);
  }
  const other = thread.other_user_id;
  if (!other) return [];
  const role = resolveRole(other);
  return role ? [role] : [];
}

/** Catégories où la conversation a sa place. Sans rôle connu : aucune catégorie précise. */
export function categoriesForRoles(roles: UserRole[]): ConversationCategory[] {
  const out = new Set<ConversationCategory>();
  for (const role of roles) {
    switch (role) {
      case 'player':
        out.add('players');
        break;
      case 'parent':
        out.add('parents');
        break;
      case 'coach':
        out.add('coaches');
        break;
      case 'club':
      // Le kiné appartient au staff du club : il relève de « Club / Staff ».
      case 'physio':
        out.add('club_staff');
        break;
      // Agent, recruteur, organisateur, sponsor, supporter ne relèvent d'aucune des quatre
      // catégories demandées : ils restent visibles dans « Tous », sans être rangés de force.
      default:
        break;
    }
  }
  return [...out];
}

/**
 * Générique sur le type de fil : la catégorisation ne doit pas **effacer** les champs
 * supplémentaires que l'appelant détient (par ex. `MessageThread`), sinon il faudrait
 * reconvertir et le typage cesserait de prouver quoi que ce soit.
 */
export type CategorizedConversation<T extends CategorizableThread = CategorizableThread> = {
  thread: T;
  kind: ConversationKind;
  categories: ConversationCategory[];
};

export function categorizeConversations<T extends CategorizableThread>(
  threads: T[],
  currentUid: string,
  resolveRole: (uid: string) => UserRole | null,
): CategorizedConversation<T>[] {
  return threads.map((thread) => ({
    thread,
    kind: resolveConversationKind(thread),
    categories: categoriesForRoles(conversationRoles(thread, currentUid, resolveRole)),
  }));
}

/**
 * Filtre par catégorie. Ne duplique jamais un fil : une conversation retournée une seule fois,
 * même si elle appartient à plusieurs catégories (groupe mixte).
 */
export function filterByCategory<T extends CategorizableThread>(
  list: CategorizedConversation<T>[],
  category: ConversationCategory,
): CategorizedConversation<T>[] {
  if (category === 'all') return list;
  return list.filter((c) => c.categories.includes(category));
}

/** Recherche locale sur le titre, le nom du participant et le dernier message. */
export function matchesConversationQuery<T extends CategorizableThread>(
  entry: CategorizedConversation<T>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = entry.thread;
  const haystack = [
    t.thread_title ?? '',
    t.participant_name ?? '',
    t.last_message ?? '',
    ...(t.participant_ids ?? []),
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const needle = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return haystack.includes(needle);
}

export function countUnread<T extends CategorizableThread>(
  list: CategorizedConversation<T>[],
): number {
  return list.filter((c) => c.thread.unread).length;
}

/** Libellé lisible de la nature d'une conversation. */
export function conversationKindLabel(kind: ConversationKind): string {
  switch (kind) {
    case 'group':
      return 'Groupe';
    case 'announcement':
      return 'Annonce';
    default:
      return 'Direct';
  }
}
