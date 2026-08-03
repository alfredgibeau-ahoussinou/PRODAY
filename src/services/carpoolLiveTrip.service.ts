import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CarpoolLiveLocationUpdate,
  CarpoolLiveTripDoc,
  CarpoolLiveTripKind,
} from '../models/CarpoolLiveTrip';
import type { GeoPoint } from '../models/User';

const COL = 'carpool_trip_live';

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const d = (value as { toDate: () => Date }).toDate();
    return Number.isFinite(d.getTime()) ? d : undefined;
  }
  return undefined;
}

function mapGeo(raw: unknown): GeoPoint | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as { latitude?: number; longitude?: number };
  if (typeof o.latitude !== 'number' || typeof o.longitude !== 'number') return undefined;
  return { latitude: o.latitude, longitude: o.longitude };
}

function fromFirestore(id: string, data: Record<string, unknown>): CarpoolLiveTripDoc {
  const participants = Array.isArray(data.participant_uids)
    ? data.participant_uids.map(String).filter(Boolean)
    : [];
  return {
    trip_id: id,
    kind: data.kind === 'event' ? 'event' : 'standalone',
    offer_id: data.offer_id ? String(data.offer_id) : undefined,
    event_id: data.event_id ? String(data.event_id) : undefined,
    driver_uid: String(data.driver_uid ?? ''),
    participant_uids: participants,
    active: data.active === true,
    location: mapGeo(data.location),
    heading: typeof data.heading === 'number' ? data.heading : undefined,
    accuracy_m: typeof data.accuracy_m === 'number' ? data.accuracy_m : undefined,
    updated_at: toDate(data.updated_at),
    started_at: toDate(data.started_at),
    ended_at: toDate(data.ended_at),
  };
}

export const carpoolLiveTripService = {
  async get(tripId: string): Promise<CarpoolLiveTripDoc | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, tripId));
    if (!snap.exists()) return null;
    return fromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  /**
   * Démarre le partage : crée / réactive le doc live avec la liste des participants.
   * Le statut `in_progress` reste sur l’offre / le slot (services métier).
   */
  async startSharing(args: {
    tripId: string;
    kind: CarpoolLiveTripKind;
    driverUid: string;
    participantUids: string[];
    offerId?: string;
    eventId?: string;
  }): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (args.driverUid !== args.participantUids[0] && !args.participantUids.includes(args.driverUid)) {
      // ensure driver is always a participant
    }
    const participants = [...new Set([args.driverUid, ...args.participantUids])];

    await setDoc(
      doc(database, COL, args.tripId),
      {
        trip_id: args.tripId,
        kind: args.kind,
        offer_id: args.offerId ?? null,
        event_id: args.eventId ?? null,
        driver_uid: args.driverUid,
        participant_uids: participants,
        active: true,
        location: null,
        heading: null,
        accuracy_m: null,
        started_at: serverTimestamp(),
        ended_at: null,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  },

  async publishLocation(
    tripId: string,
    driverUid: string,
    update: CarpoolLiveLocationUpdate,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = doc(database, COL, tripId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Partage de position non démarré.');
    const data = snap.data() as Record<string, unknown>;
    if (data.driver_uid !== driverUid) throw new Error('Seul le conducteur peut publier la position.');
    if (data.active !== true) throw new Error('Le trajet n’est plus actif.');

    await updateDoc(ref, {
      location: { latitude: update.latitude, longitude: update.longitude },
      heading: update.heading ?? null,
      accuracy_m: update.accuracy_m ?? null,
      updated_at: serverTimestamp(),
    });
  },

  /** Arrête le partage et efface les coordonnées (vie privée). */
  async stopSharing(tripId: string, driverUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const ref = doc(database, COL, tripId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Record<string, unknown>;
    if (data.driver_uid !== driverUid) throw new Error('Seul le conducteur peut arrêter le partage.');

    await updateDoc(ref, {
      active: false,
      location: null,
      heading: null,
      accuracy_m: null,
      ended_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  },

  subscribe(
    tripId: string,
    onChange: (doc: CarpoolLiveTripDoc | null) => void,
  ): Unsubscribe {
    const database = getDb();
    if (!database) {
      onChange(null);
      return () => {};
    }
    return onSnapshot(
      doc(database, COL, tripId),
      (snap) => {
        if (!snap.exists()) {
          onChange(null);
          return;
        }
        onChange(fromFirestore(snap.id, snap.data() as Record<string, unknown>));
      },
      () => onChange(null),
    );
  },
};
