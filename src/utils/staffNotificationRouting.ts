/**
 * Routage inbox staff_notifications → nav Club / Matchs (testable).
 */
import type { StaffNotification, StaffNotificationType } from '../services/staffNotifications.service';
import type { ClubNavItemId } from '../features/club/navigation/clubNavConfig';

export type StaffNotifRoute =
  | { kind: 'event'; eventId: string; hubChapter?: 'apercu' | 'effectif' | 'live' }
  | { kind: 'clubNav'; nav: ClubNavItemId }
  | { kind: 'none' };

export function staffNotificationIcon(type: StaffNotificationType): 'warning' | 'car' | 'handshake' | 'people' | 'notifications' {
  if (type === 'player_late') return 'warning';
  if (type === 'parent_pickup_late') return 'car';
  if (type === 'friendly_invite') return 'handshake';
  if (type === 'internal_move') return 'people';
  return 'notifications';
}

export function staffNotificationRoute(n: Pick<StaffNotification, 'type' | 'event_id'>): StaffNotifRoute {
  if (n.event_id) {
    if (n.type === 'player_late' || n.type === 'parent_pickup_late') {
      return { kind: 'event', eventId: n.event_id, hubChapter: 'effectif' };
    }
    if (n.type === 'friendly_invite') {
      return { kind: 'event', eventId: n.event_id, hubChapter: 'apercu' };
    }
    return { kind: 'event', eventId: n.event_id, hubChapter: 'apercu' };
  }

  switch (n.type) {
    case 'player_late':
    case 'parent_pickup_late':
      return { kind: 'clubNav', nav: 'trainings' };
    case 'friendly_invite':
      return { kind: 'clubNav', nav: 'matches' };
    case 'internal_move':
      return { kind: 'clubNav', nav: 'players' };
    default:
      return { kind: 'clubNav', nav: 'communication' };
  }
}

export function formatStaffNotifWhen(d: Date): string {
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function staffNotifsSubtitle(unread: number, total: number): string {
  if (total === 0) return 'Centre d’alertes club · rappels locaux sur l’appareil';
  if (unread > 0) return `${unread} non lue${unread > 1 ? 's' : ''} · ${total} au total`;
  return `${total} alerte${total > 1 ? 's' : ''} · toutes lues`;
}

/** Copie honnête — push distant via CF si token ; sinon inbox + locaux. */
export const STAFF_NOTIF_DELIVERY_HINT =
  'Inbox staff synchronisée. Les rappels convocations sont locaux sur cet appareil ; le push distant dépend du déploiement serveur.';
