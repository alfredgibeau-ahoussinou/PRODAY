export type CarpoolChapterId =
  | 'evenements'
  | 'reserver'
  | 'proposer'
  | 'mes_trajets'
  | 'equipe';

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
