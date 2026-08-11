import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { userRsvp } from '../models/TeamEvent';
import { findCarpoolBooking, totalCarpoolAvailableSeats } from '../utils/carpoolBalance';

const SCHEDULED_IDS_KEY = 'proday:local-notif-scheduled';
const NEARBY_MATCHES_KEY = 'proday:local-notif-nearby-matches';
const CARPOOL_NOTIFIED_KEY = 'proday:local-notif-carpool';

export type ProdayNotificationData = {
  type:
    | 'convocation_j1'
    | 'convocation_h2'
    | 'carpool_seat'
    | 'friendly_nearby'
    | 'friendly_invite'
    | 'friendly_counter'
    | 'mercato_alert'
    | 'mercato_profile'
    | 'availability_alert'
    | 'weekly_question'
    | 'medical_j1'
    | 'sponsor_offer'
    | 'player_activity_analysis'
    | 'guardian_minor_invite'
    | 'internal_move'
    | 'player_late'
    | 'parent_pickup_late'
    | 'coach_session_request';
  guardianEmail?: string;
  eventId?: string;
  hubChapter?: 'apercu' | 'live' | 'composition' | 'stats' | 'effectif';
  homeTab?: 'season' | 'matches' | 'convocations' | 'centre' | 'stats' | 'feed' | 'home' | 'tournois' | 'competitions';
  matchId?: string;
  offerId?: string;
  activityId?: string;
  playerUid?: string;
  moveId?: string;
  bookingId?: string;
};

export type EngagementNotificationHints = {
  mercatoIncomplete?: boolean;
  weeklyQuestionOpen?: boolean;
};

async function notificationsModule() {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function ensurePermission(): Promise<boolean> {
  const Notifications = await notificationsModule();
  if (!Notifications) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function loadScheduledIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw) as string[];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

async function saveScheduledIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids.slice(-80)));
}

async function cancelScheduledReminders(): Promise<void> {
  const Notifications = await notificationsModule();
  if (!Notifications) return;
  const ids = await loadScheduledIds();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
}

async function scheduleAt(
  identifier: string,
  title: string,
  body: string,
  date: Date,
  data: ProdayNotificationData
): Promise<string | null> {
  if (date.getTime() <= Date.now() + 60_000) return null;
  const Notifications = await notificationsModule();
  if (!Notifications) return null;

  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    const id = await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, data, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
    return id;
  } catch {
    return null;
  }
}

function isUserInvolvedInEvent(event: TeamEvent, profile: User): boolean {
  return (
    event.invitee_uids.includes(profile.uid) ||
    profile.uid === event.organizer_uid ||
    event.event_type === 'detection'
  );
}

async function syncConvocationReminders(profile: User, events: TeamEvent[]): Promise<string[]> {
  const ids: string[] = [];
  const now = Date.now();

  for (const event of events) {
    if (!isUserInvolvedInEvent(event, profile)) continue;
    const start = event.starts_at.getTime();
    if (start <= now) continue;

    const status = userRsvp(event, profile.uid);
    const label = event.title;

    const j1 = new Date(start - 24 * 60 * 60 * 1000);
    j1.setHours(18, 0, 0, 0);
    if (j1.getTime() > now) {
      const id = await scheduleAt(
        `convoc-j1-${event.id}`,
        'Convocation demain',
        status === 'pending'
          ? `${label}. Pensez à répondre`
          : `${label}. Match demain`,
        j1,
        {
          type: 'convocation_j1',
          eventId: event.id,
          homeTab: 'convocations',
          hubChapter: status === 'pending' ? 'apercu' : 'composition',
        }
      );
      if (id) ids.push(id);
    }

    const h2 = new Date(start - 2 * 60 * 60 * 1000);
    const h2Id = await scheduleAt(
      `convoc-h2-${event.id}`,
      'Coup d’envoi bientôt',
      `${label} dans 2 heures`,
      h2,
      {
        type: 'convocation_h2',
        eventId: event.id,
        homeTab: 'convocations',
        hubChapter: 'live',
      }
    );
    if (h2Id) ids.push(h2Id);
  }

  return ids;
}

async function loadCarpoolNotified(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(`${CARPOOL_NOTIFIED_KEY}:${uid}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveCarpoolNotified(uid: string, keys: Set<string>): Promise<void> {
  await AsyncStorage.setItem(
    `${CARPOOL_NOTIFIED_KEY}:${uid}`,
    JSON.stringify([...keys].slice(-50))
  );
}

/** Une seule alerte immédiate par événement — pas de spam à chaque synchro. */
async function syncCarpoolAlerts(profile: User, events: TeamEvent[]): Promise<void> {
  const Notifications = await notificationsModule();
  if (!Notifications) return;

  const now = Date.now();
  const horizon = now + 72 * 60 * 60 * 1000;
  const notified = await loadCarpoolNotified(profile.uid);

  for (const event of events) {
    const key = `${event.id}`;
    if (notified.has(key)) continue;
    if (!event.invitee_uids.includes(profile.uid)) continue;
    if (event.starts_at.getTime() > horizon || event.starts_at.getTime() <= now) continue;
    if (findCarpoolBooking(event, profile.uid)) continue;

    const available = totalCarpoolAvailableSeats(event.carpool_slots ?? []);
    if (available === null || available <= 0) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `carpool-alert-${event.id}-${profile.uid}`,
        content: {
          title: 'Place covoiturage',
          body: `${available} place(s) dispo pour ${event.title}`,
          data: {
            type: 'carpool_seat',
            eventId: event.id,
            homeTab: 'convocations',
            hubChapter: 'apercu',
          } satisfies ProdayNotificationData,
        },
        trigger: null,
      });
      notified.add(key);
    } catch {
      /* ignore */
    }
  }

  await saveCarpoolNotified(profile.uid, notified);
}

async function loadNotifiedMatchIds(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(`${NEARBY_MATCHES_KEY}:${uid}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveNotifiedMatchIds(uid: string, ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(
    `${NEARBY_MATCHES_KEY}:${uid}`,
    JSON.stringify([...ids].slice(-100))
  );
}

async function syncNearbyFriendlyMatches(
  profile: User,
  matches: FriendlyMatch[]
): Promise<void> {
  const city = profile.city?.trim().toLowerCase();
  if (!city) return;

  const notified = await loadNotifiedMatchIds(profile.uid);
  const fresh = matches.filter(
    (m) =>
      m.status === 'OPEN' &&
      m.city.toLowerCase().includes(city) &&
      !notified.has(m.id) &&
      m.requester_uid !== profile.uid
  );

  if (fresh.length === 0) return;

  const Notifications = await notificationsModule();
  if (!Notifications) return;

  const sample = fresh[0];
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Match amical près de chez vous',
        body:
          fresh.length === 1
            ? `${sample.requester_club_name} · ${sample.city}`
            : `${fresh.length} matchs ouverts à ${profile.city}`,
        data: {
          type: 'friendly_nearby',
          matchId: sample.id,
          homeTab: 'matches',
        } satisfies ProdayNotificationData,
      },
      trigger: null,
    });
    fresh.forEach((m) => notified.add(m.id));
    await saveNotifiedMatchIds(profile.uid, notified);
  } catch {
    /* ignore */
  }
}

async function syncEngagementReminders(
  profile: User,
  hints: EngagementNotificationHints,
): Promise<string[]> {
  const ids: string[] = [];
  const now = Date.now();

  if (hints.mercatoIncomplete && profile.role === 'player') {
    const when = new Date();
    when.setDate(when.getDate() + 1);
    when.setHours(10, 0, 0, 0);
    const id = await scheduleAt(
      `mercato-profile-${profile.uid}`,
      'Profil Mercato incomplet',
      'Complétez votre checklist pour être visible des clubs.',
      when,
      { type: 'mercato_profile', homeTab: 'centre' },
    );
    if (id) ids.push(id);
  }

  if (hints.weeklyQuestionOpen) {
    const when = new Date();
    const day = when.getDay();
    const daysUntilWed = (3 - day + 7) % 7 || 7;
    when.setDate(when.getDate() + daysUntilWed);
    when.setHours(18, 0, 0, 0);
    if (when.getTime() > now + 60_000) {
      const id = await scheduleAt(
        `weekly-q-${profile.uid}`,
        'Question de la semaine',
        'Partagez votre réponse avec la communauté ProDay.',
        when,
        { type: 'weekly_question', homeTab: 'feed' },
      );
      if (id) ids.push(id);
    }
  }

  return ids;
}

async function syncMedicalAppointmentReminders(profile: User): Promise<string[]> {
  if (profile.role !== 'player') return [];
  const ids: string[] = [];
  try {
    const { medicalAppointmentsService } = await import('./medicalAppointments.service');
    const appointments = await medicalAppointmentsService.listForPatient(profile.uid);
    const now = Date.now();
    for (const appt of appointments) {
      if (appt.status === 'cancelled' || appt.status === 'completed') continue;
      const start = appt.start_at.getTime();
      if (start <= now) continue;
      const j1 = new Date(start - 24 * 60 * 60 * 1000);
      j1.setHours(18, 0, 0, 0);
      if (j1.getTime() <= now + 60_000) continue;
      const id = await scheduleAt(
        `medical-j1-${appt.id}`,
        'RDV kiné demain',
        `${appt.physio_name ?? 'Kiné'} · ${appt.motif ?? 'Consultation'}`,
        j1,
        { type: 'medical_j1', homeTab: 'centre' },
      );
      if (id) ids.push(id);
    }
  } catch {
    /* ignore */
  }
  return ids;
}

/** Planifie rappels convocation, alertes covoiturage et matchs proches (local). */
export async function syncProdayLocalNotifications(
  profile: User | null | undefined,
  events: TeamEvent[],
  matches: FriendlyMatch[],
  engagement?: EngagementNotificationHints,
): Promise<void> {
  if (!profile || Platform.OS === 'web') return;
  if (!(await ensurePermission())) return;

  await cancelScheduledReminders();

  const scheduled = await syncConvocationReminders(profile, events);
  const engagementIds = engagement
    ? await syncEngagementReminders(profile, engagement)
    : [];
  const medicalIds = await syncMedicalAppointmentReminders(profile);
  await saveScheduledIds([...scheduled, ...engagementIds, ...medicalIds]);

  await syncCarpoolAlerts(profile, events);
  await syncNearbyFriendlyMatches(profile, matches);
}

/** Notification locale immédiate (utilitaire hors synchronisation globale). */
export async function scheduleProdayLocalNotification(params: {
  identifier: string;
  title: string;
  body: string;
  data: ProdayNotificationData;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!(await ensurePermission())) return;
  const Notifications = await notificationsModule();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: params.identifier,
      content: {
        title: params.title,
        body: params.body,
        data: params.data,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    /* no-op */
  }
}
