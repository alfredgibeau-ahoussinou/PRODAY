export type MatchChapterId =
  | 'calendrier'
  | 'centre'
  | 'convocations'
  | 'stats'
  | 'amicaux';

export const MATCH_CHAPTERS: { id: MatchChapterId; label: string }[] = [
  { id: 'calendrier', label: 'Calendrier' },
  { id: 'centre', label: 'Centre' },
  { id: 'convocations', label: 'Convocs' },
  { id: 'stats', label: 'Stats' },
  { id: 'amicaux', label: 'Amicaux' },
];

export type CalendarKindFilter = 'all' | 'team_event' | 'friendly_match';

export const CALENDAR_KIND_FILTERS: { id: CalendarKindFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'team_event', label: 'Convocs' },
  { id: 'friendly_match', label: 'Matchs' },
];

export type AmicauxStatusFilter = 'all' | 'open' | 'confirmed' | 'mine';

export const AMICAUX_STATUS_FILTERS: { id: AmicauxStatusFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'Ouverts' },
  { id: 'confirmed', label: 'Confirmés' },
  { id: 'mine', label: 'Les miens' },
];
