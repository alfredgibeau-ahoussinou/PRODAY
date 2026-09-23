/**
 * Modèle Calendrier **partagé** Coach ↔ Club/Admin.
 *
 * L'implémentation pure (plages, hero, lignes d'agenda, ton d'événement) vit
 * toujours dans `features/club/ui/clubCalendarModel.ts` : le pôle Coach
 * consomme donc **la même** logique, sans copie. Ce module lui donne un nom
 * neutre et une surface d'import stable, pour que les consommateurs Coach ne
 * dépendent pas du vocabulaire « club ».
 *
 * Un seul comportement pour les deux pôles : un événement classé « match » d'un
 * côté l'est aussi de l'autre, avec le même libellé et le même ordre.
 */

export type {
  ClubCalendarItemModel as CalendarItemModel,
  ClubCalendarNavTarget as CalendarNavTarget,
  ClubCalendarRange as CalendarRange,
} from '../club/ui/clubCalendarModel';

export {
  buildClubCalendarItemModel as buildCalendarItemModel,
  clubCalendarKindLabel as calendarKindLabel,
  filterClubCalendarEvents as filterCalendarEvents,
  formatClubCalendarPeriodHeader as formatCalendarPeriodHeader,
  navigateClubCalendarDate as navigateCalendarDate,
  resolveClubCalendarEventKind as resolveCalendarEventKind,
  resolveClubCalendarHero as resolveCalendarHero,
  resolveClubCalendarNav as resolveCalendarNav,
  resolveClubCalendarSubtitle as resolveCalendarSubtitle,
} from '../club/ui/clubCalendarModel';
