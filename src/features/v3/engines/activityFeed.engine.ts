import type { TeamEvent } from '../../../models/TeamEvent';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { Application } from '../../../models/Player';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import { userRsvp } from '../../../models/TeamEvent';

export type ActivityKind =
  | 'match_played'
  | 'convocation'
  | 'rsvp_yes'
  | 'application'
  | 'carpool'
  | 'friendly_join';

export interface ActivityFeedItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  at: Date;
  metric?: string;
  tab: MainTabId;
}

const MAX_ITEMS = 12;

function pastEvents(events: TeamEvent[], uid: string): TeamEvent[] {
  const now = Date.now();
  return events
    .filter((e) => e.starts_at.getTime() < now)
    .filter(
      (e) =>
        e.organizer_uid === uid ||
        e.invitee_uids.includes(uid) ||
        userRsvp(e, uid) === 'yes'
    )
    .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
    .slice(0, 5);
}

/** Fil d'activités type Strava — matchs, convocations, mercato. */
export function buildActivityFeed(params: {
  uid: string;
  teamEvents: TeamEvent[];
  openMatches: FriendlyMatch[];
  applications: Application[];
}): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];
  const now = Date.now();

  for (const event of pastEvents(params.teamEvents, params.uid)) {
    const stats = event.player_match_stats?.[params.uid];
    items.push({
      id: `played-${event.id}`,
      kind: 'match_played',
      title: event.title,
      subtitle: event.city,
      at: event.starts_at,
      metric:
        stats?.goals != null || stats?.assists != null
          ? `${stats.goals ?? 0} but(s) · ${stats.assists ?? 0} passe(s)`
          : 'Présent',
      tab: 'matchs',
    });
  }

  for (const event of params.teamEvents) {
    if (event.starts_at.getTime() < now) continue;
    const rsvp = userRsvp(event, params.uid);
    if (rsvp === 'yes') {
      items.push({
        id: `rsvp-${event.id}`,
        kind: 'rsvp_yes',
        title: `Confirmé. ${event.title}`,
        subtitle: event.location_label || event.city,
        at: event.starts_at,
        tab: 'matchs',
      });
    } else if (rsvp === 'pending' && event.invitee_uids.includes(params.uid)) {
      items.push({
        id: `conv-${event.id}`,
        kind: 'convocation',
        title: `Convocation. ${event.title}`,
        subtitle: 'Répondez à la convocation',
        at: event.starts_at,
        tab: 'matchs',
      });
    }

    const hasCarpool =
      (event.carpool_slots ?? []).some(
        (s) =>
          s.driver_uid === params.uid ||
          (s.passengers ?? []).some((p) => p.uid === params.uid)
      );
    if (hasCarpool && event.starts_at.getTime() > now) {
      items.push({
        id: `carpool-${event.id}`,
        kind: 'carpool',
        title: `Trajet. ${event.title}`,
        subtitle: 'Covoiturage planifié',
        at: event.starts_at,
        tab: 'covoiturage',
      });
    }
  }

  for (const app of params.applications.slice(0, 4)) {
    items.push({
      id: `app-${app.id}`,
      kind: 'application',
      title: 'Candidature Mercato',
      subtitle: app.status === 'PENDING' ? 'En attente de réponse' : `Statut : ${app.status}`,
      at: app.created_at,
      tab: 'recrutement',
    });
  }

  for (const match of params.openMatches.slice(0, 3)) {
    if (match.requester_uid !== params.uid) continue;
    items.push({
      id: `friendly-${match.id}`,
      kind: 'friendly_join',
      title: match.requester_club_name,
      subtitle: match.city,
      at: match.date,
      metric: match.level_type,
      tab: 'matchs',
    });
  }

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, MAX_ITEMS);
}
