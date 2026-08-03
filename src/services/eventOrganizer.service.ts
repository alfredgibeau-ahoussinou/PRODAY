import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  organizerEventFromFirestore,
  eventRegistrationFromFirestore,
} from '../lib/firestoreMappers';
import type {
  CreateOrganizerEventInput,
  EventRegistration,
  EventResultEntry,
  EventOrganizerStatus,
  OrganizerEvent,
  RegisterForEventInput,
} from '../models/EventOrganizer';
import {
  assignRegistrationStatus,
  countActiveRegistrations,
  eventRequiresPayment,
  publishEventResults,
  registrationIsActive,
  sortRegistrationsByStatus,
} from '../utils/eventOrganizerScaffold';

const EVENTS_COL = 'organizer_events';
const REGS_COL = 'event_registrations';

export const eventOrganizerService = {
  async listByOrganizer(organizerUid: string, max = 40): Promise<OrganizerEvent[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, EVENTS_COL),
        where('organizer_uid', '==', organizerUid),
        orderBy('starts_at', 'asc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        organizerEventFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      const snap = await getDocs(
        query(collection(database, EVENTS_COL), where('organizer_uid', '==', organizerUid)),
      );
      return snap.docs
        .map((d) => organizerEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
        .slice(0, max);
    }
  },

  async listOpenForRegistration(max = 24): Promise<OrganizerEvent[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, EVENTS_COL),
        where('status', '==', 'registration_open'),
        orderBy('starts_at', 'asc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) =>
        organizerEventFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
    } catch {
      const snap = await getDocs(collection(database, EVENTS_COL));
      return snap.docs
        .map((d) => organizerEventFromFirestore(d.id, d.data() as Record<string, unknown>))
        .filter((e) => e.status === 'registration_open')
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
        .slice(0, max);
    }
  },

  async getById(id: string): Promise<OrganizerEvent | null> {
    if (!isFirebaseConfigured()) return null;
    const database = getDb();
    if (!database) return null;
    const snap = await getDoc(doc(database, EVENTS_COL, id));
    if (!snap.exists()) return null;
    return organizerEventFromFirestore(snap.id, snap.data() as Record<string, unknown>);
  },

  async create(input: CreateOrganizerEventInput): Promise<string> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const title = input.title.trim();
    if (!title) throw new Error('Titre requis.');

    const ref = doc(collection(database, EVENTS_COL));
    const status: EventOrganizerStatus = input.open_registration
      ? 'registration_open'
      : 'draft';

    await setDoc(ref, {
      organizer_uid: input.organizer_uid,
      organizer_name: input.organizer_name.trim(),
      kind: input.kind,
      title,
      description: input.description?.trim() || null,
      city: input.city?.trim() || null,
      venue: input.venue?.trim() || null,
      starts_at: input.starts_at,
      ends_at: input.ends_at ?? null,
      status,
      capacity: input.capacity ?? null,
      registration_price_cents: input.registration_price_cents ?? 0,
      media_urls: [],
      results: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async updateStatus(eventId: string, status: EventOrganizerStatus): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, EVENTS_COL, eventId), {
      status,
      updated_at: serverTimestamp(),
    });
  },

  async listRegistrations(eventId: string): Promise<EventRegistration[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];

    try {
      const q = query(
        collection(database, REGS_COL),
        where('event_id', '==', eventId),
        orderBy('created_at', 'asc'),
      );
      const snap = await getDocs(q);
      return sortRegistrationsByStatus(
        snap.docs.map((d) =>
          eventRegistrationFromFirestore(d.id, d.data() as Record<string, unknown>),
        ),
      );
    } catch {
      const snap = await getDocs(
        query(collection(database, REGS_COL), where('event_id', '==', eventId)),
      );
      return sortRegistrationsByStatus(
        snap.docs.map((d) =>
          eventRegistrationFromFirestore(d.id, d.data() as Record<string, unknown>),
        ),
      );
    }
  },

  async register(input: RegisterForEventInput): Promise<string> {
    const event = await this.getById(input.event_id);
    if (!event) throw new Error('Événement introuvable.');
    if (event.status !== 'registration_open' && event.status !== 'published') {
      throw new Error('Les inscriptions sont closes.');
    }

    const existing = await this.listRegistrations(input.event_id);
    if (
      existing.some(
        (r) => r.user_uid === input.user_uid && registrationIsActive(r.status),
      )
    ) {
      throw new Error('Vous êtes déjà inscrit.');
    }

    const activeCount = countActiveRegistrations(existing);
    let status = assignRegistrationStatus(event, activeCount);
    if (status === 'cancelled') {
      throw new Error('Les inscriptions sont closes.');
    }
    // Payant : confirmed → pending jusqu’au paiement (sauf waitlist).
    if (status === 'confirmed' && eventRequiresPayment(event)) {
      status = 'pending';
    }

    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const ref = doc(collection(database, REGS_COL));
    await setDoc(ref, {
      event_id: input.event_id,
      user_uid: input.user_uid,
      display_name: input.display_name?.trim() || null,
      email: input.email?.trim() || null,
      status,
      payment_ref: null,
      amount_cents: event.registration_price_cents ?? 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return ref.id;
  },

  async setRegistrationStatus(
    registrationId: string,
    status: EventRegistration['status'],
    paymentRef?: string,
  ): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, REGS_COL, registrationId), {
      status,
      ...(paymentRef != null ? { payment_ref: paymentRef } : {}),
      updated_at: serverTimestamp(),
    });
  },

  async publishResults(eventId: string, entries: EventResultEntry[]): Promise<void> {
    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const results = publishEventResults(eventId, entries);
    await updateDoc(doc(database, EVENTS_COL, eventId), {
      results: {
        event_id: results.event_id,
        entries: results.entries,
        published: true,
        published_at: serverTimestamp(),
      },
      status: 'completed',
      updated_at: serverTimestamp(),
    });
  },

  async addMediaUrl(eventId: string, url: string): Promise<void> {
    const trimmed = url.trim();
    if (!trimmed) throw new Error('URL média requise.');
    const event = await this.getById(eventId);
    if (!event) throw new Error('Événement introuvable.');
    const media = [...(event.media_urls ?? [])];
    if (media.includes(trimmed)) return;
    media.push(trimmed);

    if (!isFirebaseConfigured()) throw new Error('Firebase non configuré');
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, EVENTS_COL, eventId), {
      media_urls: media,
      updated_at: serverTimestamp(),
    });
  },
};
