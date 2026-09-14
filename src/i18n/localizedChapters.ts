import type { IconName } from '../components/ui/iconNames';
import type { TranslateFn } from './types';
import {
  JOUEUR_MATCH_CHAPTER_IDS,
  filterJoueurMatchChapters,
  type MatchChapterId,
  type CalendarKindFilter,
  type AmicauxStatusFilter,
} from '../content/matchChapters';
import type { MessagesChapterId, MessagesThreadFilter } from '../content/messagesChapters';
import type { CarpoolChapterId, CarpoolEventFilter, CarpoolScopeFilter } from '../content/carpoolChapters';
import type { FeedChapterId, FeedTypeFilter } from '../content/feedChapters';
import type { CandidatureChapterId, PositionFilterId } from '../content/candidatureChapters';
import type { MercatoStaffChapterId } from '../content/mercatoStaffChapters';

const tr = (t: TranslateFn, key: string, fallback: string) => {
  const value = t(key);
  return value === key ? fallback : value;
};

export function getMatchChapters(t: TranslateFn) {
  return buildMatchChapters(t);
}

function buildMatchChapters(t: TranslateFn) {
  return [
    {
      id: 'calendrier' as const,
      label: tr(t, 'matchs.chapter.calendrier', 'Calendrier'),
      shortLabel: tr(t, 'matchs.chapter.calendrierShort', 'Agenda'),
      icon: 'calendar' as IconName,
    },
    {
      id: 'centre' as const,
      label: tr(t, 'matchs.chapter.centre', 'Centre Match'),
      shortLabel: tr(t, 'matchs.chapter.centreShort', 'Center'),
      icon: 'football' as IconName,
    },
    {
      id: 'convocations' as const,
      label: tr(t, 'matchs.chapter.convocations', 'Convocations'),
      shortLabel: tr(t, 'matchs.chapter.convocationsShort', 'Convocs'),
      icon: 'mail' as IconName,
    },
    {
      id: 'stats' as const,
      label: tr(t, 'matchs.chapter.stats', 'Stats'),
      shortLabel: tr(t, 'matchs.chapter.stats', 'Stats'),
      icon: 'trophy' as IconName,
    },
    {
      id: 'tournois' as const,
      label: tr(t, 'matchs.chapter.tournois', 'Tournois'),
      shortLabel: tr(t, 'matchs.chapter.tournois', 'Tournois'),
      icon: 'trophy' as IconName,
    },
    {
      id: 'competitions' as const,
      label: tr(t, 'matchs.chapter.competitions', 'Compétitions'),
      shortLabel: tr(t, 'matchs.chapter.competitionsShort', 'Compét.'),
      icon: 'shield' as IconName,
    },
  ] satisfies {
    id: MatchChapterId;
    label: string;
    shortLabel: string;
    icon: IconName;
  }[];
}

/** Chapitres Match Center visibles pôle joueur (Calendrier · Convocs · Stats). */
export function getJoueurMatchChapters(t: TranslateFn) {
  return filterJoueurMatchChapters(buildMatchChapters(t));
}

export function getCalendarKindFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'matchs.filter.calendar.all', 'Tout') },
    { id: 'team_event' as const, label: tr(t, 'matchs.filter.calendar.convocs', 'Convocs') },
    { id: 'friendly_match' as const, label: tr(t, 'matchs.filter.calendar.matches', 'Matchs') },
    {
      id: 'competition_fixture' as const,
      label: tr(t, 'matchs.filter.calendar.competitions', 'Compét.'),
    },
  ] satisfies { id: CalendarKindFilter; label: string }[];
}

export function getAmicauxStatusFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'matchs.filter.friendly.all', 'Tous') },
    { id: 'open' as const, label: tr(t, 'matchs.filter.friendly.open', 'Ouverts') },
    { id: 'confirmed' as const, label: tr(t, 'matchs.filter.friendly.confirmed', 'Confirmés') },
    { id: 'mine' as const, label: tr(t, 'matchs.filter.friendly.mine', 'Les miens') },
  ] satisfies { id: AmicauxStatusFilter; label: string }[];
}

export function getMessagesChapters(t: TranslateFn) {
  return [
    { id: 'inbox' as const, label: tr(t, 'messages.chapter.inbox', 'Conversations') },
    { id: 'network' as const, label: tr(t, 'messages.chapter.network', 'Réseau') },
  ] satisfies { id: MessagesChapterId; label: string }[];
}

export function getMessagesThreadFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'messages.filter.all', 'Tous') },
    { id: 'unread' as const, label: tr(t, 'messages.filter.unread', 'Non lus') },
    { id: 'direct' as const, label: tr(t, 'messages.filter.direct', 'Directs') },
    { id: 'groups' as const, label: tr(t, 'messages.filter.groups', 'Groupes') },
    { id: 'announcements' as const, label: tr(t, 'messages.filter.announcements', 'Annonces') },
    { id: 'coach' as const, label: tr(t, 'messages.filter.coach', 'Coach') },
    { id: 'team' as const, label: tr(t, 'messages.filter.team', 'Vestiaire / Équipe') },
    { id: 'mercato' as const, label: tr(t, 'messages.filter.mercato', 'Mercato') },
    { id: 'care' as const, label: tr(t, 'messages.filter.care', 'Kiné') },
  ] satisfies { id: MessagesThreadFilter; label: string }[];
}

/** Filtres messagerie compacts v4 : Tous, Non lus, Directs, Groupes, Annonces */
export function getMessagesV4CompactFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'messages.filter.all', 'Tous') },
    { id: 'unread' as const, label: tr(t, 'messages.filter.unread', 'Non lus') },
    { id: 'direct' as const, label: tr(t, 'messages.filter.direct', 'Directs') },
    { id: 'groups' as const, label: tr(t, 'messages.filter.groups', 'Groupes') },
    { id: 'announcements' as const, label: tr(t, 'messages.filter.announcements', 'Annonces') },
  ] satisfies { id: MessagesThreadFilter; label: string }[];
}

/** Filtres messagerie coach — sans Kiné. */
export function getCoachMessagesThreadFilters(t: TranslateFn) {
  return getMessagesThreadFilters(t).filter((f) => f.id !== 'care');
}

/** Filtres messagerie joueur — compacts v4. */
export function getJoueurMessagesThreadFilters(t: TranslateFn) {
  return getMessagesV4CompactFilters(t);
}


export function getCarpoolChapters(t: TranslateFn) {
  return [
    { id: 'evenements' as const, label: tr(t, 'carpool.chapter.events', 'Événements') },
    { id: 'reserver' as const, label: tr(t, 'carpool.chapter.reserve', 'Réserver') },
    { id: 'proposer' as const, label: tr(t, 'carpool.chapter.propose', 'Proposer') },
    { id: 'mes_trajets' as const, label: tr(t, 'carpool.chapter.trips', 'Mes trajets') },
    { id: 'equipe' as const, label: tr(t, 'carpool.chapter.team', 'Équipe') },
  ] satisfies { id: CarpoolChapterId; label: string }[];
}

export function getCarpoolEventFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'carpool.filter.all', 'Tout') },
    { id: 'needs_ride' as const, label: tr(t, 'carpool.filter.needsRide', 'Sans trajet') },
    { id: 'offering' as const, label: tr(t, 'carpool.filter.offering', 'Je conduis') },
    { id: 'booked' as const, label: tr(t, 'carpool.filter.booked', 'Réservé') },
  ] satisfies { id: CarpoolEventFilter; label: string }[];
}

export function getCarpoolScopeFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'carpool.scope.all', 'Tous types') },
    { id: 'match' as const, label: tr(t, 'carpool.scope.match', 'Match') },
    { id: 'training' as const, label: tr(t, 'carpool.scope.training', 'Entraînement') },
    { id: 'event' as const, label: tr(t, 'carpool.scope.event', 'Événement') },
  ] satisfies { id: CarpoolScopeFilter; label: string }[];
}

export function getFeedChapters(t: TranslateFn, options?: { showWeekly?: boolean }) {
  const chapters: { id: FeedChapterId; label: string }[] = [
    { id: 'actualites', label: tr(t, 'feed.chapter.news', 'Actualités') },
  ];
  if (options?.showWeekly) {
    chapters.push({
      id: 'question',
      label: tr(t, 'feed.chapter.responses', 'Réponses'),
    });
  }
  chapters.push({ id: 'publier', label: tr(t, 'feed.chapter.publish', 'Publier') });
  return chapters;
}

export function getFeedTypeFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'feed.filter.all', 'Tout') },
    { id: 'news' as const, label: tr(t, 'feed.filter.news', 'Actualités') },
    { id: 'poll' as const, label: tr(t, 'feed.filter.polls', 'Sondages') },
  ] satisfies { id: FeedTypeFilter; label: string }[];
}

export function getCandidatureChapters(t: TranslateFn) {
  return [
    { id: 'annonces' as const, label: tr(t, 'mercato.chapter.posts', 'Annonces') },
    { id: 'suivi' as const, label: tr(t, 'mercato.chapter.tracking', 'Suivi') },
  ] satisfies { id: CandidatureChapterId; label: string }[];
}

export function getPositionFilters(t: TranslateFn) {
  return [
    { id: 'all' as const, label: tr(t, 'mercato.filter.all', 'Tous') },
    { id: 'gk' as const, label: tr(t, 'mercato.filter.gk', 'Gardien') },
    { id: 'def' as const, label: tr(t, 'mercato.filter.def', 'Défense') },
    { id: 'mid' as const, label: tr(t, 'mercato.filter.mid', 'Milieu') },
    { id: 'fwd' as const, label: tr(t, 'mercato.filter.fwd', 'Attaque') },
  ] satisfies { id: PositionFilterId; label: string }[];
}

export function getMercatoStaffChapters(t: TranslateFn) {
  return [
    { id: 'explorer' as const, label: tr(t, 'mercato.chapter.explore', 'Explorer') },
    { id: 'annonces' as const, label: tr(t, 'mercato.chapter.posts', 'Annonces') },
    { id: 'outils' as const, label: tr(t, 'mercato.chapter.tools', 'Outils') },
  ] satisfies { id: MercatoStaffChapterId; label: string }[];
}
