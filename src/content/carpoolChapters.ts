export type CarpoolChapterId =
  | 'evenements'
  | 'reserver'
  | 'proposer'
  | 'mes_trajets'
  | 'equipe';

/** Modes hub A→Z — une seule barre de navigation. */
export type CarpoolHubMode = 'ride' | 'drive' | 'trips';

export const CARPOOL_CHAPTERS: { id: CarpoolChapterId; label: string }[] = [
  { id: 'evenements', label: 'Événements' },
  { id: 'reserver', label: 'Réserver' },
  { id: 'proposer', label: 'Proposer' },
  { id: 'mes_trajets', label: 'Mes trajets' },
  { id: 'equipe', label: 'Équipe' },
];

export type CarpoolEventFilter = 'all' | 'needs_ride' | 'offering' | 'booked';

export const CARPOOL_EVENT_FILTERS: { id: CarpoolEventFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'needs_ride', label: 'Sans trajet' },
  { id: 'offering', label: 'Je conduis' },
  { id: 'booked', label: 'Réservé' },
];

/** Filtre métier : événement / match / entraînement (lieu via recherche). */
export type CarpoolScopeFilter = 'all' | 'match' | 'training' | 'event';

export const CARPOOL_SCOPE_FILTERS: { id: CarpoolScopeFilter; label: string }[] = [
  { id: 'all', label: 'Tous types' },
  { id: 'match', label: 'Match' },
  { id: 'training', label: 'Entraînement' },
  { id: 'event', label: 'Événement' },
];

/** Deep-link chapter → mode hub (rétrocompat). */
export function carpoolChapterToHubMode(chapter: CarpoolChapterId): CarpoolHubMode {
  if (chapter === 'proposer') return 'drive';
  if (chapter === 'mes_trajets' || chapter === 'equipe') return 'trips';
  return 'ride';
}

export function carpoolHubModeToChapter(mode: CarpoolHubMode): CarpoolChapterId {
  if (mode === 'drive') return 'proposer';
  if (mode === 'trips') return 'mes_trajets';
  return 'reserver';
}
