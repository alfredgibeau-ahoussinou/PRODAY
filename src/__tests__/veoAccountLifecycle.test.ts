/**
 * Cycle de vie du compte Veo, **piloté de bout en bout** avec les Cloud Functions
 * simulées : c'est la seule manière de vérifier que l'application n'affiche jamais un
 * état que le serveur ne lui a pas donné — sans Firebase réel dans les tests.
 */
const mockCallFunction = jest.fn();

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: (...args: unknown[]) => mockCallFunction(...args),
}));

import {
  clearVeoApiClient,
  connectVeoAccount,
  disconnectVeoAccount,
  fetchVeoAccountStatus,
  listVeoAccountVideos,
  resolveVeoPlaybackUrl,
  setVeoApiClient,
  VEO_DISCONNECTED_STATE,
} from '../services/veo/veoAccount.service';
import {
  validateVeoApiClientDraft,
  veoConnectionPillLabel,
} from '../services/veo/veoAccountModel';

const CLUB = 'club-1';

const NOT_CONFIGURED =
  'Identifiants API Veo (client_id + secret) non provisionnés : ils sont délivrés uniquement par un représentant Veo.';

const failure = (code: string, message: string) => Object.assign(new Error(message), { code });

/** Dernier nom de callable demandé par le service. */
const lastCallable = () => mockCallFunction.mock.calls.at(-1)?.[0];
const lastPayload = () => mockCallFunction.mock.calls.at(-1)?.[1];
const lastRegion = () => mockCallFunction.mock.calls.at(-1)?.[2];

/**
 * Toutes les callables ProDay vivent en `europe-west1`. Un appel sans région part sur le
 * domaine par défaut (us-central1) où la fonction n'existe pas : la bibliothèque
 * s'afficherait vide alors que des captations existent.
 */
const expectRegion = () => expect(lastRegion()).toBe('europe-west1');

beforeEach(() => {
  mockCallFunction.mockReset();
});

describe('Cycle de vie du compte Veo', () => {
  it('sans client Veo provisionné : aucun état connecté, le blocage est exact', async () => {
    mockCallFunction.mockRejectedValueOnce(failure('functions/failed-precondition', NOT_CONFIGURED));

    const state = await fetchVeoAccountStatus(CLUB);

    expect(lastCallable()).toBe('veoAccountStatus');
    expectRegion();
    expect(lastPayload()).toEqual({ clubId: CLUB });
    expect(state.kind).toBe('not_configured');
    expect(state.configured).toBe(false);
    expect(state.connected).toBe(false);
    expect(state.message).toContain('représentant Veo');
  });

  it('client présent mais compte non connecté : le formulaire devient utile', async () => {
    mockCallFunction.mockResolvedValueOnce({
      configured: true,
      connected: false,
      expiresAt: null,
      accountEmail: null,
      message: 'Lancez la connexion.',
    });

    const state = await fetchVeoAccountStatus(CLUB);

    expect(state.kind).toBe('disconnected');
    expect(state.configured).toBe(true);
    expect(state.connected).toBe(false);
    // Aucune adresse n'est inventée pour remplir la carte.
    expect(state.accountEmail).toBeNull();
  });

  it('connexion : le mot de passe part au serveur, l’adresse est nettoyée, rien n’est conservé', async () => {
    mockCallFunction.mockResolvedValueOnce({
      configured: true,
      connected: true,
      expiresAt: 1_800_000_000_000,
      accountEmail: 'coach@club.fr',
      message: 'Compte Veo connecté.',
    });

    const state = await connectVeoAccount(CLUB, '  coach@club.fr  ', 'mot-de-passe-veo');

    expect(lastCallable()).toBe('veoConnect');
    expectRegion();
    expect(lastPayload()).toEqual({
      clubId: CLUB,
      email: 'coach@club.fr',
      password: 'mot-de-passe-veo',
    });
    expect(state.kind).toBe('connected');
    expect(state.accountEmail).toBe('coach@club.fr');
    // Le mot de passe n'est présent dans aucun état renvoyé à l'interface.
    expect(JSON.stringify(state)).not.toContain('mot-de-passe-veo');
  });

  it('Veo refuse l’échange : accès refusé, jamais un faux succès', async () => {
    mockCallFunction.mockRejectedValueOnce(
      failure('functions/permission-denied', 'Veo a refusé cet échange d’identifiants.'),
    );

    const state = await connectVeoAccount(CLUB, 'coach@club.fr', 'mauvais');

    expect(state.kind).toBe('unauthorized');
    expect(state.connected).toBe(false);
    expect(state.message).toMatch(/refusé/);
  });

  it('liste des captations : les vidéos autorisées viennent du serveur', async () => {
    mockCallFunction.mockResolvedValueOnce({
      videos: [
        { id: 'v-1', title: 'U15 · RC France', recordedAt: '2026-09-12T18:00:00Z', durationSec: 5400, status: 'Transcoded' },
        { id: 'v-2', title: 'U17 · Derby', recordedAt: null, durationSec: null, status: null },
      ],
    });

    const result = await listVeoAccountVideos();

    expect(lastCallable()).toBe('veoVideosList');
    expectRegion();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.videos.map((v) => v.id)).toEqual(['v-1', 'v-2']);
      expect(result.videos[1].recordedAt).toBeNull();
    }
  });

  it('liste inaccessible : l’erreur remonte pour être affichée avec reprise', async () => {
    mockCallFunction.mockRejectedValueOnce(failure('functions/unavailable', 'Veo est injoignable.'));

    const result = await listVeoAccountVideos();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.state.kind).toBe('unavailable');
      expect(result.state.message).toMatch(/injoignable/);
    }
  });

  it('lecture : l’URL vient de Veo, sinon l’échec est explicite', async () => {
    mockCallFunction.mockResolvedValueOnce({
      videoId: 'v-1',
      url: 'https://storage.veo.co/v-1/16x9.mp4',
      durationSec: 5400,
    });

    const played = await resolveVeoPlaybackUrl('v-1');

    expect(lastCallable()).toBe('veoPlaybackUrl');
    expectRegion();
    expect(lastPayload()).toEqual({ videoId: 'v-1' });
    expect(played.ok).toBe(true);
    if (played.ok) expect(played.target.url).toBe('https://storage.veo.co/v-1/16x9.mp4');

    // Réponse sans URL : aucun lecteur ne s'ouvre sur une source inventée.
    mockCallFunction.mockResolvedValueOnce({ videoId: 'v-2' });
    const empty = await resolveVeoPlaybackUrl('v-2');
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.state.message).toMatch(/aucune URL de lecture/);
  });

  it('déconnexion : l’état retombe, la bibliothèque n’est plus interrogée', async () => {
    mockCallFunction.mockResolvedValueOnce({ connected: false });

    const state = await disconnectVeoAccount();

    expect(lastCallable()).toBe('veoDisconnect');
    expectRegion();
    expect(state).toEqual(VEO_DISCONNECTED_STATE);
    expect(state.connected).toBe(false);
  });

  it('service non déployé : le message nomme la cause au lieu d’un échec muet', async () => {
    mockCallFunction.mockRejectedValueOnce(failure('functions/not-found', 'not-found'));

    const state = await fetchVeoAccountStatus(CLUB);

    expect(state.kind).toBe('unavailable');
    expect(state.message).toMatch(/non déployé/);
  });

  it('vérification impossible : l’état n’est jamais présenté comme un client Veo absent', async () => {
    // Constaté à l’écran : une fonction injoignable s’affichait « Non configuré » et
    // proposait de demander un accès Veo — un diagnostic faux.
    mockCallFunction.mockRejectedValueOnce(failure('functions/internal', 'internal'));

    const state = await fetchVeoAccountStatus(CLUB);

    expect(state.kind).toBe('unavailable');
    expect(state.kind).not.toBe('not_configured');
    expect(veoConnectionPillLabel(state)).toBe('Indisponible');
  });

  it('réseau indisponible : une reprise réussie rétablit un état vérifié', async () => {
    mockCallFunction.mockRejectedValueOnce(failure('functions/unavailable', 'unavailable'));
    const broken = await fetchVeoAccountStatus(CLUB);
    expect(broken.connected).toBe(false);

    mockCallFunction.mockResolvedValueOnce({
      configured: true,
      connected: true,
      expiresAt: Date.now() + 600_000,
      accountEmail: 'coach@club.fr',
      message: 'Compte Veo connecté.',
    });
    const recovered = await fetchVeoAccountStatus(CLUB);

    expect(recovered.kind).toBe('connected');
    expect(veoConnectionPillLabel(recovered)).toBe('Connecté');
  });

  it('enregistre les identifiants API Veo du club depuis l’app, sans jamais les renvoyer', async () => {
    mockCallFunction.mockResolvedValueOnce({
      configured: true,
      connected: false,
      message: 'Identifiants enregistrés.',
      clientSource: 'club',
      clientIdMasked: '••••6789',
      clubClientStored: true,
    });

    const state = await setVeoApiClient(CLUB, {
      clientId: '  client-veo-123456  ',
      clientSecret: '  secret-veo-tres-long-1234  ',
      environment: 'uat',
    });

    expect(lastCallable()).toBe('veoSetApiClient');
    expectRegion();
    expect(lastPayload()).toEqual({
      clubId: CLUB,
      clientId: 'client-veo-123456',
      clientSecret: 'secret-veo-tres-long-1234',
      environment: 'uat',
    });
    expect(state.kind).toBe('disconnected');
    expect(state.configured).toBe(true);
    expect(state.clientSource).toBe('club');
    expect(state.clientIdMasked).toBe('••••6789');
    // Le secret ne revient jamais dans un état manipulé par l'écran.
    expect(JSON.stringify(state)).not.toContain('secret-veo-tres-long-1234');
  });

  it('refuse une saisie incomplète sans appeler le serveur', () => {
    expect(validateVeoApiClientDraft({ clientId: 'court', clientSecret: 'secret-veo-tres-long-1234' })).toEqual({
      ok: false,
      message: 'Identifiant client Veo incomplet.',
    });
    expect(validateVeoApiClientDraft({ clientId: 'client-veo-123456', clientSecret: 'trop-court' })).toEqual({
      ok: false,
      message: 'Secret client Veo incomplet.',
    });
    // Identifiant recopié dans les deux champs : le serveur refuserait aussi, on l'arrête avant.
    expect(
      validateVeoApiClientDraft({
        clientId: 'client-veo-123456',
        clientSecret: 'client-veo-123456',
      }).ok,
    ).toBe(false);
    expect(
      validateVeoApiClientDraft({
        clientId: 'client-veo-123456',
        clientSecret: 'secret-veo-tres-long-1234',
      }).ok,
    ).toBe(true);
  });

  it('retire les identifiants du club et retombe sur un état non configuré', async () => {
    mockCallFunction.mockResolvedValueOnce({ cleared: true });

    const state = await clearVeoApiClient(CLUB);

    expect(lastCallable()).toBe('veoClearApiClient');
    expectRegion();
    expect(lastPayload()).toEqual({ clubId: CLUB });
    expect(state).toEqual(VEO_DISCONNECTED_STATE);
  });

  it('sans club associé, rien n’est demandé au serveur', async () => {
    const state = await fetchVeoAccountStatus('');

    // Un club vide n'est pas un appel : le serveur refuserait, et l'écran doit le dire.
    expect(mockCallFunction).not.toHaveBeenCalled();
    expect(state.kind).toBe('unavailable');
    expect(state.message).toMatch(/Aucun club associé/);
    expect(state.connected).toBe(false);
  });
});
