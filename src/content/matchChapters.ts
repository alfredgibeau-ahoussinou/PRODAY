import type { IconName } from '../components/ui/Icon';

export type MatchChapterId =
  | 'calendrier'
  | 'centre'
  | 'convocations'
  | 'stats'
  | 'amicaux';

export const MATCH_CHAPTERS: {
  id: MatchChapterId;
  label: string;
  shortLabel: string;
  icon: IconName;
}[] = [
  { id: 'calendrier', label: 'Calendrier', shortLabel: 'Agenda', icon: 'calendar' },
  { id: 'centre', label: 'Centre', shortLabel: 'Live', icon: 'football' },
  { id: 'convocations', label: 'Convocations', shortLabel: 'Convocs', icon: 'mail' },
  { id: 'stats', label: 'Stats', shortLabel: 'Stats', icon: 'trophy' },
  { id: 'amicaux', label: 'Amicaux', shortLabel: 'Amicaux', icon: 'handshake' },
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
