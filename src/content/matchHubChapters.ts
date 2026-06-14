export type MatchHubChapterId = 'apercu' | 'live' | 'composition' | 'stats' | 'effectif';

export const MATCH_HUB_CHAPTERS: { id: MatchHubChapterId; label: string }[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'live', label: 'Direct' },
  { id: 'composition', label: 'Compo' },
  { id: 'stats', label: 'Stats' },
  { id: 'effectif', label: 'Effectif' },
];
