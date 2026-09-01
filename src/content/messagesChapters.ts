export type MessagesChapterId = 'inbox' | 'network';

export const MESSAGES_CHAPTERS: { id: MessagesChapterId; label: string }[] = [
  { id: 'inbox', label: 'Conversations' },
  { id: 'network', label: 'Réseau' },
];

export type MessagesThreadFilter =
  | 'all'
  | 'unread'
  | 'coach'
  | 'team'
  | 'mercato'
  | 'care'
  | 'requests';

export const MESSAGES_THREAD_FILTERS: { id: MessagesThreadFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'coach', label: 'Coach' },
  { id: 'team', label: 'Vestiaire / Équipe' },
  { id: 'mercato', label: 'Mercato' },
  { id: 'unread', label: 'Non lus' },
  { id: 'requests', label: 'Demandes' },
  { id: 'care', label: 'Kiné' },
];

