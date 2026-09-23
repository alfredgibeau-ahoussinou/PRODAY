export type MessagesChapterId = 'inbox' | 'network';

export const MESSAGES_CHAPTERS: { id: MessagesChapterId; label: string }[] = [
  { id: 'inbox', label: 'Conversations' },
  { id: 'network', label: 'Réseau' },
];

export type MessagesThreadFilter =
  | 'all'
  | 'unread'
  | 'direct'
  | 'groups'
  | 'announcements'
  | 'coach'
  | 'team'
  | 'mercato'
  | 'care'
  | 'requests'
  /** Catégories par rôle — organisent l'affichage, ne modifient aucun droit. */
  | 'players'
  | 'parents'
  | 'coaches'
  | 'club_staff';

/**
 * Catégories de conversation du rail, dans l'ordre d'affichage.
 *
 * La **nature** d'une conversation (direct, groupe, annonce) n'est plus un filtre : elle est
 * affichée comme badge sur chaque ligne. Cela évite la surcharge de filtres constatée dans le
 * rail précédent (neuf entrées) sans rien perdre de l'information.
 */
export const MESSAGES_CATEGORY_FILTERS: { id: MessagesThreadFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'unread', label: 'Non lus' },
  { id: 'players', label: 'Joueurs' },
  { id: 'parents', label: 'Parents' },
  { id: 'coaches', label: 'Coachs' },
  { id: 'club_staff', label: 'Club / Staff' },
];

/** Filtres compacts officiels ProDay Spécifications v4 : Tous, Non lus, Directs, Groupes, Annonces. */
export const MESSAGES_V4_COMPACT_FILTERS: { id: MessagesThreadFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'unread', label: 'Non lus' },
  { id: 'direct', label: 'Directs' },
  { id: 'groups', label: 'Groupes' },
  { id: 'announcements', label: 'Annonces' },
];

export const MESSAGES_THREAD_FILTERS: { id: MessagesThreadFilter; label: string }[] = [
  ...MESSAGES_V4_COMPACT_FILTERS,
  { id: 'coach', label: 'Coach' },
  { id: 'team', label: 'Vestiaire / Équipe' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'requests', label: 'Demandes' },
];

