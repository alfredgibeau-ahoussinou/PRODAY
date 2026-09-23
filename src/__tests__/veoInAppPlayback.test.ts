import { readFileSync } from 'fs';
import { join } from 'path';
import {
  classifyVeoCallableError,
  formatVeoDuration,
  formatVeoRecordedAt,
  normalizeVeoAccountState,
  normalizeVeoVideoList,
  veoAccountHeadline,
  veoConnectionPillLabel,
  veoConnectionTone,
} from '../services/veo/veoAccountModel';

const root = join(__dirname, '..', '..');
const read = (relative: string) => readFileSync(join(root, relative), 'utf8');
const readCode = (relative: string) =>
  read(relative)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const WORKSPACE = 'src/features/video/VideoWorkspace.tsx';
const ACCOUNT_PANEL = 'src/features/video/VeoAccountPanel.tsx';
const SERVICE = 'src/services/veo/veoAccount.service.ts';
const MODEL = 'src/services/veo/veoAccountModel.ts';
const HOOK = 'src/hooks/useVeoAccount.ts';
const FUNCTIONS_API = 'functions/src/veoApi.ts';
const FUNCTIONS_CORE = 'functions/src/veoApiCore.ts';

/**
 * Veo est intégré **dans** ProDay : liste des captations autorisées et lecture passent par
 * l'API officielle, derrière les Cloud Functions. Ce test verrouille ce qui ne doit jamais
 * redevenir un renvoi externe déguisé, ni un état de connexion inventé.
 */
describe('Compte Veo — un état qui vient du serveur, jamais supposé', () => {
  it('ne déclare « connecté » que sur la réponse serveur', () => {
    const payload = { configured: true, connected: true, expiresAt: 1_800_000_000_000, accountEmail: 'coach@club.fr', message: 'ok' };
    const state = normalizeVeoAccountState(payload);
    expect(state.kind).toBe('connected');
    expect(state.connected).toBe(true);
    expect(state.accountEmail).toBe('coach@club.fr');
    expect(veoAccountHeadline(state)).toBe('Compte Veo connecté');
  });

  it('distingue « client prêt, compte non connecté » de « non configuré »', () => {
    const configuredOnly = normalizeVeoAccountState({ configured: true, connected: false, message: 'x' });
    expect(configuredOnly.kind).toBe('disconnected');
    expect(configuredOnly.connected).toBe(false);

    const none = normalizeVeoAccountState({ configured: false, connected: false, message: 'x' });
    expect(none.kind).toBe('not_configured');
    expect(veoAccountHeadline(none)).toBe('Connexion Veo non configurée');
  });

  it('ne déduit jamais une connexion d’une réponse vide ou malformée', () => {
    for (const payload of [null, undefined, 'oops', {}, { connected: 'yes' }]) {
      const state = normalizeVeoAccountState(payload);
      expect(state.connected).toBe(false);
    }
  });

  it('traduit chaque échec de fonction en nature explicite', () => {
    expect(classifyVeoCallableError({ code: 'functions/failed-precondition', message: 'client Veo absent' })).toEqual({
      kind: 'not_configured',
      message: 'client Veo absent',
    });
    expect(classifyVeoCallableError({ code: 'functions/permission-denied', message: 'refusé' }).kind).toBe('unauthorized');
    expect(classifyVeoCallableError({ code: 'functions/not-found', message: 'not-found' }).message).toMatch(
      /non déployé/,
    );
    expect(classifyVeoCallableError(new Error('réseau')).kind).toBe('unavailable');
  });

  it('un échec de vérification ne se lit pas « non configuré »', () => {
    // Le serveur n'a pas répondu : on ne sait pas si le client Veo existe. L'afficher
    // comme « non configuré » ferait demander un accès déjà peut-être délivré.
    const unreachable = { ...normalizeVeoAccountState({}), kind: 'unavailable' as const };
    expect(veoConnectionPillLabel(unreachable)).toBe('Indisponible');
    expect(veoConnectionPillLabel(unreachable)).not.toBe('Non configuré');
    expect(veoConnectionTone(unreachable)).toBe('warning');

    const refused = { ...unreachable, kind: 'unauthorized' as const };
    expect(veoConnectionPillLabel(refused)).toBe('Refusé');
    expect(veoConnectionTone(refused)).toBe('danger');

    const absent = { ...unreachable, kind: 'not_configured' as const };
    expect(veoConnectionPillLabel(absent)).toBe('Non configuré');
    expect(veoConnectionTone(absent)).toBe('neutral');

    const ok = { ...unreachable, kind: 'connected' as const, connected: true };
    expect(veoConnectionPillLabel(ok)).toBe('Connecté');
    expect(veoConnectionTone(ok)).toBe('success');
  });

  it('normalise la liste de captations sans inventer de champ', () => {
    const videos = normalizeVeoVideoList({
      videos: [
        { id: 'a', title: 'U15 · RC France', recordedAt: '2026-09-12T18:00:00Z', durationSec: 5400, status: 'Transcoded' },
        { id: 'b' },
        { title: 'sans identifiant' },
        'nope',
      ],
    });
    expect(videos).toHaveLength(2);
    expect(videos[0].title).toBe('U15 · RC France');
    expect(videos[0].durationSec).toBe(5400);
    // Un titre absent est libellé, une date absente reste annoncée comme telle.
    expect(videos[1].title).toMatch(/Captation b/);
    expect(formatVeoRecordedAt(null)).toBe('Date non communiquée');
    expect(formatVeoDuration(null)).toBe('');
    expect(formatVeoDuration(5400)).toBe('90 min');
  });

  it('côté serveur, aucun mot de passe n’est persisté et le direct n’est pas promis', () => {
    const api = read(FUNCTIONS_API);
    // Le jeton seul est stocké, avec son expiration et l'adresse du compte.
    expect(api).toMatch(/token,\s*\n\s*expires_at/);
    expect(api).not.toMatch(/password[^\n]*\bset\(/);
    // Aucun endpoint de direct n'est documenté : le module ne doit pas en inventer un.
    expect(api).not.toMatch(/\/live|lives\b/i);
  });
});

describe('Lecture Veo dans ProDay — le lecteur intégré, pas un renvoi externe', () => {
  it('passe par les Cloud Functions pour la liste et l’URL de lecture', () => {
    const service = readCode(SERVICE);
    for (const callable of ['veoAccountStatus', 'veoConnect', 'veoDisconnect', 'veoVideosList', 'veoPlaybackUrl']) {
      expect(service).toContain(`callFunction<`);
      expect(service).toContain(callable);
    }
    // Région explicite : sans elle, l'appel part au domaine par défaut et la fonction y
    // est introuvable — la vidéo semblerait « autorisée mais absente ».
    expect(service).toContain("VEO_FUNCTIONS_REGION = 'europe-west1'");
    // Sept callables : état, connexion, déconnexion, identifiants (saisie + retrait),
    // bibliothèque et URL de lecture. Chacune porte la région explicitement.
    expect(service.match(/VEO_FUNCTIONS_REGION,/g)?.length).toBe(7);
    // Les identifiants d'application sont saisissables depuis l'app, sans commande.
    expect(service).toContain('veoSetApiClient');
    expect(service).toContain('veoClearApiClient');
    // Côté serveur : callables **v2** (convention du dépôt) dans la même région.
    const api = readCode(FUNCTIONS_API);
    expect(api).toContain("from 'firebase-functions/v2/https'");
    expect(api).toContain("region: VEO_FUNCTIONS_REGION");
    expect(api.match(/= onCall\(VEO_CALLABLE_OPTIONS/g)?.length).toBe(7);
    // Le secret d'application ne quitte jamais le serveur : il est écrit dans une
    // collection que seul le SDK admin lit, et l'écran ne reçoit qu'un identifiant masqué.
    expect(readCode(FUNCTIONS_CORE)).toContain("VEO_API_CLIENTS_COLLECTION = 'veo_api_clients'");
    expect(api).toMatch(/VEO_API_CLIENTS_COLLECTION}\/\$\{clubId\}`\)\.set\(record/);
    expect(api).toContain('maskClientId');
    /**
     * Le secret n'apparaît que sur le chemin de **stockage** — quatre occurrences :
     * présence vérifiée à la relecture, clef + valeur du document relu, écriture à
     * l'enregistrement. Une occurrence de plus (par exemple un `client_secret` ajouté à
     * l'état renvoyé à l'écran) ferait échouer ce test.
     */
    expect(api.match(/client_secret/g)?.length).toBe(4);
    // Aucun secret n'est lu depuis la configuration de l'application : le couple
    // d'identifiants est **saisi par le club** et transmis à notre fonction, jamais
    // embarqué, jamais relu d'une variable d'environnement côté client.
    for (const source of [service, readCode(MODEL), readCode(HOOK)]) {
      expect(source).not.toMatch(/VEO_CLIENT_SECRET|process\.env\.VEO|EXPO_PUBLIC_VEO/);
    }
    // L'état manipulé par l'écran ne porte qu'un identifiant masqué, jamais le secret.
    const model = readCode(MODEL);
    const stateType = model.slice(
      model.indexOf('export type VeoAccountState'),
      model.indexOf('export type VeoAccountVideo'),
    );
    expect(stateType).toContain('clientIdMasked');
    expect(stateType).not.toMatch(/Secret/);
  });

  it('rend la connexion et la bibliothèque du compte dans le module partagé', () => {
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('useVeoAccount');
    expect(workspace).toContain('useVeoLibrary');
    expect(workspace).toContain('<VeoAccountPanel');
    expect(workspace).toContain('<VeoAccountLibrary');
    expect(workspace).toContain('<VeoQrPairingCard');
    // Le panneau de connexion est rendu pour les deux pôles : le même module les sert.
    expect(read(ACCOUNT_PANEL)).toContain('COMPTE VEO · VÉRIFIÉ CÔTÉ SERVEUR');
    // Visible pour les pôles Club **et** Coach (texte adapté quand le rôle ne gère pas la
    // connexion), mais pas pour un joueur ou un parent.
    expect(workspace).toMatch(/\{canSeeConnections \? \(\s*<VeoAccountLibrary/);
    expect(workspace).toContain('canManage={canManage}');
    expect(read(ACCOUNT_PANEL)).toContain('dès que le staff du club aura connecté le compte');
    // Le club est transmis au hook : sans lui, la vidéo Veo n'est rattachée à rien.
    expect(workspace).toContain('useVeoAccount(effectiveClubId ?? null)');
    // Deux niveaux de permission distincts à l'écran (le serveur revérifie les deux).
    expect(workspace).toContain('canConnect={canConnectVeo}');
    expect(workspace).toContain('canManageApiClient={canManageVeoApiClient}');
  });

  it('lit une captation du compte Veo dans le lecteur intégré, avec URL résolue à la volée', () => {
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('resolveVeoPlaybackUrl');
    expect(workspace).toContain('setActivePlayingVideo({');
    expect(workspace).toContain('url: result.target.url');
    // Les vidéos du compte n'ouvrent ni lien externe ni page Veo.
    expect(workspace).not.toMatch(/Linking\.openURL\([^)]*api\.veo\.co[^)]*\)\s*;?\s*\/\/[^\n]*lecture/i);
    const accountBlock = workspace.slice(workspace.indexOf('if (video.veoVideoId)'));
    expect(accountBlock.slice(0, 900)).not.toContain('Linking.openURL');
  });

  it('expose chargement, échec et reprise au lieu d’un écran figé', () => {
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('testID="veo-playback-error"');
    expect(workspace).toContain('testID="veo-playback-retry"');
    expect(workspace).toContain('resolvingVeoVideoId');
    const panel = readCode(ACCOUNT_PANEL);
    expect(panel).toContain('testID="veo-api-client-form"');
    expect(panel).toContain('testID="veo-api-client-submit"');
    expect(panel).toContain('testID="veo-api-client-clear"');
    expect(panel).toContain('testID="veo-library-loading"');
    expect(panel).toContain('testID="veo-library-retry"');
    expect(panel).toContain('testID="veo-library-empty"');
    expect(panel).toContain('testID="veo-account-refresh"');
    // La bibliothèque n'est interrogée que si la connexion est vérifiée.
    expect(readCode(HOOK)).toContain('enabled');
    expect(readCode(WORKSPACE)).toContain('useVeoLibrary(veoAccount.state.connected)');
  });

  it('décrit le QR Veo Go sans embarquer de scanner factice', () => {
    const panel = read(ACCOUNT_PANEL);
    const code = readCode(ACCOUNT_PANEL);
    expect(code).toContain('VEO_CONNECTION_METHODS');
    expect(code).toContain('Aucun scanner n’est embarqué dans ProDay');
    // La demande d'accès Veo n'est proposée que sur un constat serveur, jamais sur un échec.
    expect(code).toContain("state.kind === 'not_configured'");
    expect(code).toMatch(/state\.kind === 'unavailable' \|\| state\.kind === 'unauthorized'/);
    expect(code).not.toMatch(/BarCodeScanner|expo-camera|CameraView|useCameraPermissions/);
    // Le guide officiel et l'application Veo Go sont accessibles, sans promesse d'appairage.
    expect(code).not.toMatch(/appair[ée]\s*avec succ[eè]s|Pairing successful/i);
    // Les étapes et le guide officiel viennent du modèle documenté, pas du panneau.
    expect(read('src/features/video/veoWorkspace.ts')).toContain('support.veo.com');
    expect(panel).toContain('Guide officiel Veo Go');
  });

  it('garde le direct en renvoi assumé et renvoie aux enregistrements in-app', () => {
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('<VeoExternalHandoffCard');
    expect(workspace).toContain('testID="veo-live-recordings-note"');
    expect(workspace).toMatch(/section Bibliothèque liste/);
  });
});
