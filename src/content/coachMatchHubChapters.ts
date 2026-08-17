import type { MatchHubChapterId } from './matchHubChapters';

/** Segments hub match coach — ordre et libellés SportEasy. */
export const COACH_MATCH_HUB_CHAPTERS: { id: MatchHubChapterId; label: string }[] = [
  { id: 'apercu', label: 'Résumé' },
  { id: 'effectif', label: 'Effectif' },
  { id: 'composition', label: 'Compo' },
  { id: 'live', label: 'Direct' },
  { id: 'stats', label: 'Stats' },
];

export function coachMatchHubLabel(chapter: MatchHubChapterId): string {
  return COACH_MATCH_HUB_CHAPTERS.find((c) => c.id === chapter)?.label ?? chapter;
}
