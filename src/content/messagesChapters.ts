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
  | 'requests';

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
  { id: 'care', label: 'Kiné' },
];

