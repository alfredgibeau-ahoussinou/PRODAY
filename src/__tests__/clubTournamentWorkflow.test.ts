/**
 * Workflow tournois club — cycle de vie, capacité, invitations externes.
 *
 * Vérifie ce qui ne doit JAMAIS arriver :
 *  - une inscription externe marquée confirmée alors que l'invitation vient
 *    d'être envoyée (ou que l'organisateur n'a pas approuvé) ;
 *  - un dépassement de capacité ;
 *  - une transition d'état interdite ;
 *  - un doublon d'inscription pour le même club.
 *
 * Firestore est mocké en mémoire : aucun accès réseau.
 */
jest.mock('firebase/firestore', () => ({
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

import { getDoc, updateDoc } from 'firebase/firestore';
import { clubTournamentsService } from '../services/clubTournaments.service';
import {
  ALLOWED_LIFECYCLE_TRANSITIONS,
  canAcceptExternalRegistration,
  canTransitionLifecycle,
  type ClubTournamentEvent,
} from '../models/ClubTournamentEvent';

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

type StoredDoc = Record<string, unknown>;

const CLUB_ID = 'club-1';

function baseEvent(overrides: Partial<StoredDoc> = {}): StoredDoc {
  return {
    club_id: CLUB_ID,
    created_by: 'admin-1',
    name: 'Tournoi de rentrée U13',
    category: 'U13',
    format: 'pools_then_knockout',
    status: 'registration_open',
    capacity: 8,
    starts_at: new Date('2026-10-10T09:00:00.000Z'),
    ends_at: new Date('2026-10-11T18:00:00.000Z'),
    city: 'Levallois',
    venue_label: 'Stade municipal',
    registration_deadline: new Date('2026-10-01T20:00:00.000Z'),
    participation_conditions: 'Licence FFF obligatoire',
    teams: [],
    external_invites: [],
    fixtures: [],
    change_log: [],
    is_public: false,
    ...overrides,
  };
}

/** Installe un document courant dans le mock getDoc et capture les updateDoc. */
function mountEvent(data: StoredDoc): { writes: () => StoredDoc[] } {
  const writes: StoredDoc[] = [];
  mockGetDoc.mockImplementation(
    async () =>
      ({
        exists: () => true,
        id: 't-1',
        data: () => data,
      }) as unknown as Awaited<ReturnType<typeof getDoc>>,
  );
  mockUpdateDoc.mockImplementation(async (_ref, patch) => {
    writes.push(patch as unknown as StoredDoc);
  });
  return { writes: () => writes };
}

beforeEach(() => {
  jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/* Cycle de vie                                                        */
/* ------------------------------------------------------------------ */

describe('cycle de vie du tournoi', () => {
  it('n’autorise que les transitions déclarées', () => {
    expect(canTransitionLifecycle('draft', 'registration_open')).toBe(true);
    expect(canTransitionLifecycle('draft', 'confirmed')).toBe(false);
    expect(canTransitionLifecycle('registration_open', 'registration_closed')).toBe(true);
    expect(canTransitionLifecycle('confirmed', 'registration_open')).toBe(false);
    // Un tournoi terminé ou annulé est un état final.
    expect(ALLOWED_LIFECYCLE_TRANSITIONS.completed).toEqual([]);
    expect(ALLOWED_LIFECYCLE_TRANSITIONS.cancelled).toEqual([]);
  });

  it('refuse une transition interdite et n’écrit rien', async () => {
    const { writes } = mountEvent(baseEvent({ status: 'draft' }));
    await expect(clubTournamentsService.setStatus('t-1', 'confirmed')).rejects.toThrow(
      /Transition impossible/,
    );
    expect(writes()).toHaveLength(0);
  });

  it('journalise une transition valide avec son auteur', async () => {
    const { writes } = mountEvent(baseEvent({ status: 'draft' }));
    await clubTournamentsService.setStatus('t-1', 'registration_open', { by: 'Président' });
    expect(writes()).toHaveLength(1);
    expect(writes()[0].status).toBe('registration_open');
    expect((writes()[0].change_log as StoredDoc[])[0].by).toBe('Président');
  });

  it('refuse de reporter un tournoi annulé', async () => {
    mountEvent(baseEvent({ status: 'cancelled' }));
    await expect(
      clubTournamentsService.postpone('t-1', new Date('2026-11-01T09:00:00.000Z')),
    ).rejects.toThrow(/ne peut plus être reporté/);
  });
});

/* ------------------------------------------------------------------ */
/* Invitations externes (participants sans compte ProDay)              */
/* ------------------------------------------------------------------ */

describe('invitations externes', () => {
  it('crée une invitation « envoyée », jamais confirmée d’office', async () => {
    const { writes } = mountEvent(baseEvent());
    const invite = await clubTournamentsService.createExternalInvite('t-1', {
      club_name: 'AS Voisine',
      contact_email: 'contact@as-voisine.test',
      requires_approval: true,
    });
    expect(invite.status).toBe('sent');
    expect(invite.requires_approval).toBe(true);
    expect(invite.token.length).toBeGreaterThan(10);
    const written = writes()[0].external_invites as StoredDoc[];
    expect(written).toHaveLength(1);
    expect(written[0].status).toBe('sent');
  });

  it('refuse d’inviter quand les inscriptions sont fermées', async () => {
    mountEvent(baseEvent({ status: 'registration_closed' }));
    await expect(
      clubTournamentsService.createExternalInvite('t-1', { club_name: 'AS Voisine' }),
    ).rejects.toThrow(/inscriptions sont fermées/i);
  });

  it('refuse d’inviter au-delà de la capacité', async () => {
    mountEvent(
      baseEvent({
        capacity: 1,
        teams: [{ id: 'team-1', name: 'Équipe 1', club_name: 'FC ProDay', category: 'U13' }],
      }),
    );
    await expect(
      clubTournamentsService.createExternalInvite('t-1', { club_name: 'AS Voisine' }),
    ).rejects.toThrow(/Capacité atteinte/);
  });

  it('refuse un doublon de club déjà invité', async () => {
    mountEvent(
      baseEvent({
        external_invites: [
          {
            id: 'ext-1',
            club_name: 'AS Voisine',
            token: 'tok-1',
            status: 'accepted',
            requires_approval: false,
            created_at: new Date(),
          },
        ],
      }),
    );
    await expect(
      clubTournamentsService.createExternalInvite('t-1', { club_name: 'as voisine  ' }),
    ).rejects.toThrow(/déjà invité/);
  });

  it('répond « accepted » mais reste en attente d’approbation si requis', async () => {
    const { writes } = mountEvent(
      baseEvent({
        external_invites: [
          {
            id: 'ext-1',
            club_name: 'AS Voisine',
            token: 'tok-1',
            status: 'sent',
            requires_approval: true,
            created_at: new Date(),
          },
        ],
      }),
    );
    const result = await clubTournamentsService.respondToExternalInvite('t-1', 'tok-1', 'accepted', {
      club_name: 'AS Voisine',
      contact_name: 'Coach Durand',
      contact_email: 'coach@as-voisine.test',
    });
    // Jamais « confirmé » : l'organisateur doit approuver.
    expect(result.status).toBe('pending_approval');
    const written = writes()[0].external_invites as StoredDoc[];
    expect(written[0].status).toBe('accepted');
    expect(written[0].responded_by).toBe('external');
    expect(written[0].contact_email).toBe('coach@as-voisine.test');
  });

  it('enregistre un refus explicite', async () => {
    const { writes } = mountEvent(
      baseEvent({
        external_invites: [
          { id: 'ext-1', club_name: 'AS Voisine', token: 'tok-1', status: 'sent', requires_approval: false, created_at: new Date() },
        ],
      }),
    );
    const result = await clubTournamentsService.respondToExternalInvite('t-1', 'tok-1', 'declined', {
      club_name: 'AS Voisine',
    });
    expect(result.status).toBe('declined');
    expect((writes()[0].external_invites as StoredDoc[])[0].status).toBe('declined');
  });

  it('refuse une invitation révoquée ou expirée', async () => {
    mountEvent(
      baseEvent({
        external_invites: [
          { id: 'ext-1', club_name: 'AS Voisine', token: 'tok-revoked', status: 'revoked', requires_approval: false, created_at: new Date() },
          {
            id: 'ext-2',
            club_name: 'AS Lointaine',
            token: 'tok-expired',
            status: 'sent',
            requires_approval: false,
            created_at: new Date(),
            expires_at: new Date('2026-09-01T00:00:00.000Z'),
          },
        ],
      }),
    );
    await expect(
      clubTournamentsService.respondToExternalInvite('t-1', 'tok-revoked', 'accepted', { club_name: 'AS Voisine' }),
    ).rejects.toThrow(/révoquée/);
    await expect(
      clubTournamentsService.respondToExternalInvite('t-1', 'tok-expired', 'accepted', { club_name: 'AS Lointaine' }),
    ).rejects.toThrow(/expiré/);
  });

  it('refuse un doublon d’inscription pour le même club', async () => {
    mountEvent(
      baseEvent({
        external_invites: [
          { id: 'ext-1', club_name: 'AS Voisine', token: 'tok-1', status: 'accepted', requires_approval: false, created_at: new Date() },
          { id: 'ext-2', club_name: 'AS Voisine', token: 'tok-2', status: 'sent', requires_approval: false, created_at: new Date() },
        ],
      }),
    );
    await expect(
      clubTournamentsService.respondToExternalInvite('t-1', 'tok-2', 'accepted', { club_name: 'AS Voisine' }),
    ).rejects.toThrow(/inscription existe déjà/);
  });
});

/* ------------------------------------------------------------------ */
/* Garde-fou pur côté invité                                          */
/* ------------------------------------------------------------------ */

describe('canAcceptExternalRegistration', () => {
  const event = (overrides: Partial<ClubTournamentEvent> = {}): ClubTournamentEvent =>
    ({
      id: 't-1',
      club_id: CLUB_ID,
      created_by: 'admin-1',
      name: 'Tournoi',
      category: 'U13',
      format: 'pools_only',
      status: 'registration_open',
      capacity: 2,
      starts_at: new Date('2026-10-10T09:00:00.000Z'),
      city: 'Levallois',
      venue_label: null,
      registration_deadline: new Date('2026-10-01T20:00:00.000Z'),
      participation_conditions: null,
      teams: [],
      external_invites: [
        {
          id: 'ext-1',
          club_name: 'AS Voisine',
          token: 'tok-1',
          status: 'sent',
          requires_approval: false,
          created_at: new Date(),
        },
      ],
      fixtures: [],
      change_log: [],
      is_public: false,
      ...overrides,
    }) as ClubTournamentEvent;

  it('accepte une invitation ouverte dans un tournoi non complet', () => {
    expect(canAcceptExternalRegistration(event(), 'tok-1').ok).toBe(true);
  });

  it('refuse quand la capacité est atteinte', () => {
    const full = event({
      capacity: 1,
      teams: [{ id: 't', name: 'Équipe', club_name: 'Club', category: 'U13' } as never],
    });
    expect(canAcceptExternalRegistration(full, 'tok-1').ok).toBe(false);
  });

  it('refuse quand les inscriptions sont fermées', () => {
    expect(canAcceptExternalRegistration(event({ status: 'registration_closed' }), 'tok-1').ok).toBe(false);
  });

  it('refuse un token inconnu', () => {
    expect(canAcceptExternalRegistration(event(), 'inconnu').ok).toBe(false);
  });
});
