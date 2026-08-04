import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  CreateStandaloneCarpoolInput,
  StandaloneCarpoolOffer,
} from '../models/StandaloneCarpoolOffer';
import type { GeoPoint } from '../models/User';
import type { CarpoolPassenger } from '../models/TeamEvent';
import {
  appendPassenger,
  isStandalonePassenger,
  standaloneAvailableSeats,
  standalonePassengerCount,
} from '../utils/standaloneCarpool';
import {
  buildTripParticipantUids,
  nextTripStatusOnEnd,
  nextTripStatusOnStart,
  standaloneOfferTripStatus,
  standaloneTripId,
} from '../utils/carpoolLiveTrip';
import { carpoolLiveTripService } from './carpoolLiveTrip.service';
import type { CarpoolTripStatus } from '../models/CarpoolLiveTrip';

const COL = 'carpool_offers';

async function autoCloseExpiredOffers(offers: StandaloneCarpoolOffer[]): Promise<void> {
  const database = getDb();
  if (!database) return;
  const now = Date.now();
  await Promise.all(
    offers
      .filter(
        (o) =>
          o.status === 'open' &&
          o.trip_status !== 'in_progress' &&
          (o.departs_at.getTime() < now || standalonePassengerCount(o) >= o.seats),
      )
      .map((o) =>
        updateDoc(doc(database, COL, o.id), {
          status: o.departs_at.getTime() < now ? 'completed' : 'closed',
          updated_at: serverTimestamp(),
        }).catch(() => {}),
      ),
  );
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (Number.isFinite(d.getTime())) return d;
  }
  return new Date(0);
}

function mapGeoPoint(raw: unknown): GeoPoint | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as { latitude?: number; longitude?: number };
  if (typeof o.latitude !== 'number' || typeof o.longitude !== 'number') return undefined;
  return { latitude: o.latitude, longitude: o.longitude };
}

function mapPassengers(raw: unknown): CarpoolPassenger[] {
  if (!Array.isArray(raw)) return [];
  const out: CarpoolPassenger[] = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const o = p as Record<string, unknown>;
    const uid = String(o.uid ?? '');
    if (!uid) continue;
    out.push({
      uid,
      name: String(o.name ?? 'Joueur'),
      pickup_place: o.pickup_place as string | undefined,
      pickup_location: mapGeoPoint(o.pickup_location),
      status: o.status as CarpoolPassenger['status'],
    });
  }
  return out;
}

function mapTripStatus(raw: unknown): CarpoolTripStatus | undefined {
  if (raw === 'scheduled' || raw === 'in_progress' || raw === 'completed') return raw;
  return undefined;
}

function offerFromFirestore(id: string, data: Record<string, unknown>): StandaloneCarpoolOffer {
  const statusRaw = data.status;
  const status: StandaloneCarpoolOffer['status'] =
    statusRaw === 'closed' ||
    statusRaw === 'completed' ||
    statusRaw === 'cancelled' ||
    statusRaw === 'in_progress'
      ? statusRaw
      : 'open';
  return {
    id,
    driver_uid: String(data.driver_uid ?? ''),
    driver_name: String(data.driver_name ?? ''),
    club_id: data.club_id as string | undefined,
    city: data.city as string | undefined,
    title: String(data.title ?? ''),
    destination_label: data.destination_label as string | undefined,
    destination_location: mapGeoPoint(data.destination_location),
    departs_at: toDate(data.departs_at),
    meeting_time: data.meeting_time as string | undefined,
    meeting_place: data.meeting_place as string | undefined,
    meeting_location: mapGeoPoint(data.meeting_location),
    seats: Number(data.seats ?? 0),
    notes: data.notes as string | undefined,
    passengers: mapPassengers(data.passengers),
    status,
    trip_status: mapTripStatus(data.trip_status),
    club_only: data.club_only === true,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

export const carpoolOffersService = {
  async listOpen(max = 40, viewerClubId?: string): Promise<StandaloneCarpoolOffer[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    let offers: StandaloneCarpoolOffer[];
    try {
      const snap = await getDocs(
        query(
          collection(database, COL),
          where('status', '==', 'open'),
          orderBy('departs_at', 'asc'),
          limit(max)
        )
      );
      offers = snap.docs.map((d) => offerFromFirestore(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(query(collection(database, COL), limit(max)));
      offers = snap.docs
        .map((d) => offerFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((o) => o.status === 'open')
        .sort((a, b) => a.departs_at.getTime() - b.departs_at.getTime());
    }
    void autoCloseExpiredOffers(offers);
    return offers.filter((o) => !o.club_only || !viewerClubId || o.club_id === viewerClubId);
  },

  async listForUser(
    uid: string,
    viewerClubId?: string,
    max = 60,
  ): Promise<StandaloneCarpoolOffer[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    const snap = await getDocs(query(collection(database, COL), limit(max)));
    const offers = snap.docs.map((d) =>
      offerFromFirestore(d.id, d.data() as Record<string, unknown>),
    );
    void autoCloseExpiredOffers(offers);
    return offers.filter((o) => {
      if (o.club_only && viewerClubId && o.club_id !== viewerClubId) return false;
      return (
        o.driver_uid === uid ||
        (o.passengers ?? []).some((p) => p.uid === uid) ||
        o.status === 'open'
      );
    });
  },

  async listByDriver(driverUid: string): Promise<StandaloneCarpoolOffer[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const snap = await getDocs(
        query(collection(database, COL), where('driver_uid', '==', driverUid), limit(30))
      );
      return snap.docs
        .map((d) => offerFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.departs_at.getTime() - a.departs_at.getTime());
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<StandaloneCarpoolOffer | null> {
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, COL, id));
    if (!snap.exists()) return null;
    return offerFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(
    driverUid: string,
    driverName: string,
    input: CreateStandaloneCarpoolInput
  ): Promise<string> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    if (!input.title.trim()) throw new Error('Indiquez un titre pour votre trajet.');
    if (!Number.isFinite(input.seats) || input.seats < 1) {
      throw new Error('Indiquez au moins une place disponible.');
    }
    if (!input.meeting_place?.trim() && !input.meeting_location) {
      throw new Error('Indiquez un point de rendez-vous.');
    }

    const ref = await addDoc(collection(database, COL), {
      driver_uid: driverUid,
      driver_name: driverName,
      club_id: input.club_id ?? null,
      city: input.city ?? null,
      club_only: input.club_only === true,
      title: input.title.trim(),
      destination_label: input.destination_label?.trim() || null,
      destination_location: input.destination_location ?? null,
      departs_at: Timestamp.fromDate(input.departs_at),
      meeting_time: input.meeting_time?.trim() || null,
      meeting_place: input.meeting_place?.trim() || null,
      meeting_location: input.meeting_location ?? null,
      seats: input.seats,
      notes: input.notes?.trim() || null,
      passengers: [],
      status: 'open',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async update(
    offerId: string,
    driverUid: string,
    patch: Partial<CreateStandaloneCarpoolInput> & { status?: 'open' | 'closed' }
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const offer = await this.getById(offerId);
    if (!offer) throw new Error('Trajet introuvable.');
    if (offer.driver_uid !== driverUid) throw new Error('Modification non autorisée.');

    await updateDoc(doc(database, COL, offerId), {
      ...(patch.title != null ? { title: patch.title.trim() } : {}),
      ...(patch.destination_label !== undefined
        ? { destination_label: patch.destination_label?.trim() || null }
        : {}),
      ...(patch.destination_location !== undefined
        ? { destination_location: patch.destination_location ?? null }
        : {}),
      ...(patch.departs_at ? { departs_at: Timestamp.fromDate(patch.departs_at) } : {}),
      ...(patch.meeting_time !== undefined ? { meeting_time: patch.meeting_time?.trim() || null } : {}),
      ...(patch.meeting_place !== undefined ? { meeting_place: patch.meeting_place?.trim() || null } : {}),
      ...(patch.meeting_location !== undefined
        ? { meeting_location: patch.meeting_location ?? null }
        : {}),
      ...(patch.seats != null ? { seats: patch.seats } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes?.trim() || null } : {}),
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.club_only !== undefined ? { club_only: patch.club_only === true } : {}),
      updated_at: serverTimestamp(),
    });
  },

  async delete(offerId: string, driverUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const offer = await this.getById(offerId);
    if (!offer) return;
    if (offer.driver_uid !== driverUid) throw new Error('Suppression non autorisée.');
    await deleteDoc(doc(database, COL, offerId));
  },

  async requestSeat(
    offerId: string,
    passengerUid: string,
    passengerName: string,
    pickup?: { pickup_place?: string; pickup_location?: GeoPoint }
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const offer = await this.getById(offerId);
    if (!offer) throw new Error('Trajet introuvable.');
    if (offer.status !== 'open') throw new Error('Ce trajet n’est plus disponible.');
    if (offer.trip_status === 'in_progress') {
      throw new Error('Ce trajet est déjà en cours.');
    }
    if (offer.driver_uid === passengerUid) {
      throw new Error('Vous ne pouvez pas réserver votre propre véhicule.');
    }
    if (isStandalonePassenger(offer, passengerUid)) return;
    if (standaloneAvailableSeats(offer) <= 0) {
      throw new Error('Plus de place disponible sur ce trajet.');
    }

    const passengers = appendPassenger(offer.passengers, {
      uid: passengerUid,
      name: passengerName,
      pickup_place: pickup?.pickup_place?.trim() || undefined,
      pickup_location: pickup?.pickup_location,
      status: 'pending',
    });

    await updateDoc(doc(database, COL, offerId), {
      passengers,
      updated_at: serverTimestamp(),
    });
  },

  async respondToSeat(
    offerId: string,
    driverUid: string,
    passengerUid: string,
    accept: boolean,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const offer = await this.getById(offerId);
    if (!offer) throw new Error('Trajet introuvable.');
    if (offer.driver_uid !== driverUid) throw new Error('Action réservée au conducteur.');

    const passengers = (offer.passengers ?? []).map((p) =>
      p.uid === passengerUid
        ? { ...p, status: accept ? ('confirmed' as const) : ('rejected' as const) }
        : p,
    );

    const patch: Record<string, unknown> = {
      passengers,
      updated_at: serverTimestamp(),
    };
    if (accept && standalonePassengerCount({ ...offer, passengers }) >= offer.seats) {
      patch.status = 'closed';
    }

    await updateDoc(doc(database, COL, offerId), patch);
  },

  async cancelSeat(offerId: string, passengerUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const offer = await this.getById(offerId);
    if (!offer) throw new Error('Trajet introuvable.');
    const passengers = (offer.passengers ?? []).filter((p) => p.uid !== passengerUid);
    await updateDoc(doc(database, COL, offerId), {
      passengers,
      updated_at: serverTimestamp(),
    });
  },

  /** Conducteur — démarre le trajet (géoloc live pour les participants). */
  async startTrip(offerId: string, driverUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const offer = await this.getById(offerId);
    if (!offer) throw new Error('Trajet introuvable.');
    if (offer.driver_uid !== driverUid) throw new Error('Action réservée au conducteur.');

    const current = standaloneOfferTripStatus(offer);
    nextTripStatusOnStart(current);

    await carpoolLiveTripService.startSharing({
      tripId: standaloneTripId(offerId),
      kind: 'standalone',
      driverUid,
      participantUids: buildTripParticipantUids(driverUid, offer.passengers),
      offerId,
    });

    await updateDoc(doc(database, COL, offerId), {
      status: 'in_progress',
      trip_status: 'in_progress',
      updated_at: serverTimestamp(),
    });
  },

  /** Conducteur — termine le trajet et arrête le partage de position. */
  async endTrip(offerId: string, driverUid: string): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const offer = await this.getById(offerId);
    if (!offer) throw new Error('Trajet introuvable.');
    if (offer.driver_uid !== driverUid) throw new Error('Action réservée au conducteur.');

    const current = standaloneOfferTripStatus(offer);
    nextTripStatusOnEnd(current);

    await carpoolLiveTripService.stopSharing(standaloneTripId(offerId), driverUid);

    await updateDoc(doc(database, COL, offerId), {
      status: 'completed',
      trip_status: 'completed',
      updated_at: serverTimestamp(),
    });
  },
};
