import type { IconName } from '../components/ui/iconNames';

export type MatchChapterId =
  | 'calendrier'
  | 'centre'
  | 'convocations'
  | 'stats'
  | 'amicaux'
  | 'tournois'
  | 'competitions';

/** Onglets Match visibles en mode joueur (4 max). */
export const JOUEUR_MATCH_CHAPTER_IDS: MatchChapterId[] = [
  'calendrier',
  'convocations',
  'amicaux',
  'stats',
];

export const MATCH_CHAPTERS: {
  id: MatchChapterId;
  label: string;
  shortLabel: string;
  icon: IconName;
}[] = [
  { id: 'calendrier', label: 'Calendrier', shortLabel: 'Agenda', icon: 'calendar' },
  { id: 'centre', label: 'Centre Match', shortLabel: 'Centre', icon: 'football' },
  { id: 'convocations', label: 'Convocations', shortLabel: 'Convocs', icon: 'mail' },
  { id: 'stats', label: 'Stats', shortLabel: 'Stats', icon: 'trophy' },
  { id: 'amicaux', label: 'Amicaux', shortLabel: 'Amicaux', icon: 'handshake' },
  { id: 'tournois', label: 'Tournois', shortLabel: 'Tournois', icon: 'trophy' },
  { id: 'competitions', label: 'Compétitions', shortLabel: 'Compét.', icon: 'shield' },
];

export type CalendarKindFilter = 'all' | 'team_event' | 'friendly_match' | 'competition_fixture';

export const CALENDAR_KIND_FILTERS: { id: CalendarKindFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'team_event', label: 'Convocs' },
  { id: 'friendly_match', label: 'Matchs' },
  { id: 'competition_fixture', label: 'Compét.' },
];

/** Chapitres joueur filtrés depuis la liste complète (ordre rail joueur). */
export function filterJoueurMatchChapters<
  T extends { id: MatchChapterId },
>(chapters: T[]): T[] {
  const byId = new Map(chapters.map((ch) => [ch.id, ch]));
  return JOUEUR_MATCH_CHAPTER_IDS.map((id) => byId.get(id)).filter(
    (ch): ch is T => ch != null,
  );
}

/** Mappe les deep links legacy (centre, tournois, compétitions) vers un onglet joueur. */
export function normalizeJoueurMatchChapter(id: MatchChapterId): MatchChapterId {
  if (JOUEUR_MATCH_CHAPTER_IDS.includes(id)) return id;
  if (id === 'centre') return 'calendrier';
  if (id === 'tournois' || id === 'competitions') return 'amicaux';
  return 'calendrier';
}

export type AmicauxStatusFilter = 'all' | 'open' | 'confirmed' | 'mine';

export const AMICAUX_STATUS_FILTERS: { id: AmicauxStatusFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'Ouverts' },
  { id: 'confirmed', label: 'Confirmés' },
  { id: 'mine', label: 'Les miens' },
];
