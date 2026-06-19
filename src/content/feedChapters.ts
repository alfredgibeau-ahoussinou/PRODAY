export type FeedChapterId = 'actualites' | 'question' | 'publier';

export const FEED_CHAPTERS: { id: FeedChapterId; label: string }[] = [
  { id: 'actualites', label: 'Actualités' },
  { id: 'publier', label: 'Publier' },
];

export type FeedTypeFilter = 'all' | 'news' | 'poll';

export const FEED_TYPE_FILTERS: { id: FeedTypeFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'news', label: 'Actualités' },
  { id: 'poll', label: 'Sondages' },
];
