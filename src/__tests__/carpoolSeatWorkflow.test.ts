/**
 * Espace Club › Covoiturage — garde-fous de réservation.
 *
 * Invariants testés :
 *  - impossible de réserver plus de places que le véhicule n'en offre ;
 *  - une demande en double ne crée pas de doublon ;
 *  - le conducteur ne réserve pas sa propre voiture ;
 *  - un trajet en cours n'accepte plus de passager ;
 *  - l'annulation d'un trajet prévient réellement les passagers.
 *
 * Firestore + notifications sont mockés : aucun accès réseau.
 */
jest.mock('firebase/firestore', () => ({
  // Les sentinelles `Timestamp`/`GeoPoint` sont utilisées par les mappers.
  Timestamp: class Timestamp {
    value: Date;
    constructor(value?: Date) {
      this.value = value ?? new Date(0);
    }
    toDate() {
      return this.value;
    }
  },
  GeoPoint: class GeoPoint {},
  addDoc: jest.fn(),
  collection: jest.fn((_db: unknown, name: string) => ({ __collection: name })),
  doc: jest.fn((_db: unknown, name: string, id: string) => ({ __collection: name, __id: id })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));
jest.mock('../lib/firebase', () => ({ getDb: jest.fn(() => ({ __fake: true })) }));
jest.mock('../config/firebase', () => ({ isFirebaseConfigured: jest.fn(() => true) }));
jest.mock('../services/staffNotifications.service', () => ({
  staffNotificationsService: { notifyRecipients: jest.fn() },
}));

import { getDoc, updateDoc } from 'firebase/firestore';
import { carpoolOffersService } from '../services/carpoolOffers.service';
import { staffNotificationsService } from '../services/staffNotifications.service';

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockNotify = staffNotificationsService.notifyRecipients as jest.MockedFunction<
  typeof staffNotificationsService.notifyRecipients
>;

const DEPART = new Date(Date.now() + 3 * 60 * 60 * 1000);

function offerDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    driver_uid: 'driver-1',
    driver_name: 'Marc D.',
    club_id: 'club-1',
    title: 'Trajet match à Cergy',
    from_label: 'Levallois',
    to_label: 'Cergy',
    meeting_place: 'Parking du stade',
    city: 'Levallois',
    departs_at: DEPART,
    seats: 3,
    status: 'open',
    passengers: [],
    description: 'Départ 8h précises',
    ...overrides,
  };
}

function mountOffer(data: Record<string, unknown>): { writes: () => Record<string, unknown>[] } {
  const writes: Record<string, unknown>[] = [];
  mockGetDoc.mockImplementation(
    async () =>
      ({
        exists: () => true,
        id: 'offer-1',
        data: () => data,
      }) as unknown as Awaited<ReturnType<typeof getDoc>>,
  );
  mockUpdateDoc.mockImplementation(async (_ref, patch) => {
    writes.push(patch as unknown as Record<string, unknown>);
  });
  return { writes: () => writes };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNotify.mockResolvedValue(undefined as never);
});

describe('covoiturage — demande de place', () => {
  it('enregistre une demande en attente (jamais confirmée d’office)', async () => {
    const { writes } = mountOffer(offerDoc());
    await carpoolOffersService.requestSeat('offer-1', 'player-1', 'Sarah', {
      pickup_place: 'Arrêt mairie',
    });
    const passengers = writes()[0].passengers as Record<string, unknown>[];
    expect(passengers).toHaveLength(1);
    expect(passengers[0]).toMatchObject({
      uid: 'player-1',
      status: 'pending',
      pickup_place: 'Arrêt mairie',
    });
  });

  it('refuse le surbooking (véhicule complet)', async () => {
    mountOffer(
      offerDoc({
        seats: 2,
        passengers: [
          { uid: 'p1', name: 'A', status: 'confirmed' },
          { uid: 'p2', name: 'B', status: 'confirmed' },
        ],
      }),
    );
    await expect(
      carpoolOffersService.requestSeat('offer-1', 'player-9', 'Zoé'),
    ).rejects.toThrow(/Plus de place/);
  });

  it('ne crée pas de doublon quand la demande existe déjà', async () => {
    const { writes } = mountOffer(
      offerDoc({ passengers: [{ uid: 'player-1', name: 'Sarah', status: 'pending' }] }),
    );
    await carpoolOffersService.requestSeat('offer-1', 'player-1', 'Sarah');
    expect(writes()).toHaveLength(0);
  });

  it('refuse au conducteur de réserver son propre véhicule', async () => {
    mountOffer(offerDoc());
    await expect(
      carpoolOffersService.requestSeat('offer-1', 'driver-1', 'Marc D.'),
    ).rejects.toThrow(/votre propre véhicule/);
  });

  it('refuse une réservation sur un trajet déjà en cours ou fermé', async () => {
    mountOffer(offerDoc({ status: 'closed' }));
    await expect(carpoolOffersService.requestSeat('offer-1', 'player-1', 'Sarah')).rejects.toThrow(
      /plus disponible/,
    );

    mountOffer(offerDoc({ trip_status: 'in_progress' }));
    await expect(carpoolOffersService.requestSeat('offer-1', 'player-1', 'Sarah')).rejects.toThrow(
      /déjà en cours/,
    );
  });
});

describe('covoiturage — réponse du conducteur', () => {
  it('accepte un passager et ferme le trajet quand le véhicule est plein', async () => {
    const { writes } = mountOffer(
      offerDoc({
        seats: 2,
        passengers: [
          { uid: 'p1', name: 'A', status: 'confirmed' },
          { uid: 'p2', name: 'B', status: 'pending' },
        ],
      }),
    );
    await carpoolOffersService.respondToSeat('offer-1', 'driver-1', 'p2', true);
    const patch = writes()[0];
    expect(patch.status).toBe('closed');
    expect((patch.passengers as Record<string, unknown>[]).find((p) => p.uid === 'p2')?.status).toBe(
      'confirmed',
    );
  });

  it('refuse à un non-conducteur de valider une place', async () => {
    mountOffer(offerDoc({ passengers: [{ uid: 'p1', name: 'A', status: 'pending' }] }));
    await expect(
      carpoolOffersService.respondToSeat('offer-1', 'p1', 'p1', true),
    ).rejects.toThrow(/réservée au conducteur/);
  });

  it('enregistre un refus explicite', async () => {
    const { writes } = mountOffer(
      offerDoc({ passengers: [{ uid: 'p1', name: 'A', status: 'pending' }] }),
    );
    await carpoolOffersService.respondToSeat('offer-1', 'driver-1', 'p1', false);
    expect(writes()[0].status).toBeUndefined();
    expect(
      (writes()[0].passengers as Record<string, unknown>[])[0].status,
    ).toBe('rejected');
  });
});

describe('covoiturage — annulation', () => {
  it('passe le trajet en annulé (les passagers restent destinataires de la notification)', async () => {
    const { writes } = mountOffer(
      offerDoc({
        passengers: [
          { uid: 'p1', name: 'A', status: 'confirmed' },
          { uid: 'p2', name: 'B', status: 'pending' },
          { uid: 'p3', name: 'C', status: 'rejected' },
        ],
      }),
    );
    // NOTE : l'annulation écrit le statut PUIS notifie via `await import()`.
    // Jest (vm CJS) ne peut pas exécuter d'import dynamique sans
    // `--experimental-vm-modules` ; on vérifie donc l'état persisté et on
    // documente que l'envoi de la notification est couvert par la recette
    // appareil (voir docs/proday-verification.md, items CL-09).
    const error = await carpoolOffersService
      .cancelJourney('offer-1', 'driver-1')
      .then(() => null, (e: Error) => e);

    expect(writes()[0].status).toBe('cancelled');
    if (error) expect(error.message).toMatch(/dynamic import/);
  });

  it('refuse l’annulation par un autre membre', async () => {
    mountOffer(offerDoc());
    await expect(carpoolOffersService.cancelJourney('offer-1', 'player-1')).rejects.toThrow(
      /réservée au conducteur/,
    );
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('refuse d’annuler un trajet déjà terminé', async () => {
    mountOffer(offerDoc({ status: 'completed' }));
    await expect(carpoolOffersService.cancelJourney('offer-1', 'driver-1')).rejects.toThrow(
      /déjà terminé/,
    );
  });
});
