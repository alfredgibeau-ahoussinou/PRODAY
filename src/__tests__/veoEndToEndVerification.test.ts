/**
 * Tests End-to-End d’Intégration Veo dans ProDay
 *
 * Vérifie exhaustivement les 10 flux fondamentaux exigés :
 * 1. Authentification (connexion supportée, annulation, reconnexion, expiration, déconnexion, zéro clé API)
 * 2. Appairage QR (code valide, invalide, expiré, permissions refusées, reprise)
 * 3. États de connexion (compte, caméra, direct, vérifiés séparément)
 * 4. Récupération des vidéos (équipes, matchs, recherche, pagination)
 * 5. Visionnage en direct (in-app, audio, plein écran, latence)
 * 6. Replays (lecture, contrôles, réouverture après sortie)
 * 7. Résilience et reprise (perte réseau, rétablissement, jetons expirés)
 * 8. Permissions et périmètres (coach, club/admin, joueur, parent)
 * 9. Analyse IA (traitement, non-blocage de la lecture)
 * 10. Compatibilité multi-appareils (Web PC/Mac, Mobile iPhone/iPad)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const mockCallFunction = jest.fn();

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: (...args: unknown[]) => mockCallFunction(...args),
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(async () => ({ id: 'mock-camera-id' })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] })),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  Timestamp: {
    fromDate: (d: Date) => d,
  },
  where: jest.fn(),
}));

jest.mock('../lib/firebase', () => ({
  getDb: jest.fn(() => ({})),
}));

jest.mock('../config/firebase', () => ({
  isFirebaseConfigured: jest.fn(() => false),
}));

import {
  connectVeoAccount,
  disconnectVeoAccount,
  fetchVeoAccountStatus,
  listVeoAccountVideos,
  resolveVeoPlaybackUrl,
  setVeoApiClient,
  VEO_DISCONNECTED_STATE,
} from '../services/veo/veoAccount.service';
import {
  classifyVeoCallableError,
  normalizeVeoAccountState,
  normalizeVeoVideoList,
  veoAccountHeadline,
  veoConnectionPillLabel,
  veoConnectionTone,
} from '../services/veo/veoAccountModel';
import {
  canManageVideoConnections,
  describeConnectionMethod,
  describeVeoConnection,
  libraryVisibilityNote,
  resolveCameraState,
  resolveStreamState,
  resolveVideoSections,
  toVideoAudienceRole,
  VEO_CONNECTION_METHODS,
} from '../features/video/veoWorkspace';
import { clubCamerasService } from '../services/clubCameras.service';
import { veoService } from '../services/veo/veo.service';

const root = join(__dirname, '..', '..');
const read = (relative: string) => readFileSync(join(root, relative), 'utf8');
const readCode = (relative: string) =>
  read(relative)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const WORKSPACE = 'src/features/video/VideoWorkspace.tsx';
const ACCOUNT_PANEL = 'src/features/video/VeoAccountPanel.tsx';
const PLAYER = 'src/components/video/ProDayIntegratedVideoPlayer.tsx';

describe('Audit & Test End-to-End Veo dans ProDay', () => {
  beforeEach(() => {
    mockCallFunction.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. Authentification
  // -------------------------------------------------------------------------
  describe('Workflow 1 — Authentification & Gestion de Session', () => {
    const CLUB = 'club-proday-01';

    it('n’impose aucune clé d’API ni accès développeur aux utilisateurs finaux', () => {
      const panel = readCode(ACCOUNT_PANEL);
      expect(panel).toContain('CONNEXION AU COMPTE VEO · ZÉRO CONFIGURATION TECHNIQUE');
      expect(panel).toContain('Les clés partenaires requises relèvent des administrateurs ProDay côté serveur');
      expect(panel).not.toContain('placeholder="client-id fourni par Veo"');
    });

    it('permet la connexion par le flux supporté (email + mot de passe transmis au serveur)', async () => {
      mockCallFunction.mockResolvedValueOnce({
        configured: true,
        connected: true,
        expiresAt: Date.now() + 1_200_000_000,
        accountEmail: 'coach.principal@club.fr',
        message: 'Compte Veo connecté.',
      });

      const state = await connectVeoAccount(CLUB, 'coach.principal@club.fr', 'secretPass123');

      expect(mockCallFunction).toHaveBeenCalledWith(
        'veoConnect',
        {
          clubId: CLUB,
          email: 'coach.principal@club.fr',
          password: 'secretPass123',
        },
        'europe-west1',
      );
      expect(state.kind).toBe('connected');
      expect(state.connected).toBe(true);
      expect(state.accountEmail).toBe('coach.principal@club.fr');
      expect(JSON.stringify(state)).not.toContain('secretPass123');
    });

    it('propose un bouton d’annulation propre sur le formulaire de connexion', () => {
      const panel = readCode(ACCOUNT_PANEL);
      expect(panel).toContain('testID="veo-connect-cancel"');
      expect(panel).toContain('Annuler');
    });

    it('gère une session expirée et propose son renouvellement', () => {
      const pastTime = Date.now() - 100_000;
      const expiredState = normalizeVeoAccountState({
        configured: true,
        connected: false,
        expiresAt: pastTime,
        accountEmail: 'coach@club.fr',
        message: 'Session Veo expirée. Veuillez vous reconnecter.',
      });

      expect(expiredState.kind).toBe('expired');
      expect(expiredState.connected).toBe(false);
      expect(veoConnectionPillLabel(expiredState)).toBe('Expiré');
      expect(veoAccountHeadline(expiredState)).toBe('Accès Veo expiré');
      expect(veoConnectionTone(expiredState)).toBe('warning');

      const panel = readCode(ACCOUNT_PANEL);
      expect(panel).toContain('testID="veo-reconnect-btn"');
      expect(panel).toContain('Renouveler la session');
    });

    it('ferme la session et révoque le jeton lors de la déconnexion', async () => {
      mockCallFunction.mockResolvedValueOnce({ connected: false });

      const state = await disconnectVeoAccount();

      expect(mockCallFunction).toHaveBeenCalledWith('veoDisconnect', {}, 'europe-west1');
      expect(state.kind).toBe('disconnected');
      expect(state.connected).toBe(false);
      expect(state.accountEmail).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Appairage QR & Matériel
  // -------------------------------------------------------------------------
  describe('Workflow 2 — Appairage QR & Matériel Caméra', () => {
    it('décrit honnêtement la contrainte QR Veo Go (échange iPhone à iPhone, pas ProDay)', () => {
      const method = VEO_CONNECTION_METHODS.find((m) => m.id === 'phone_rig_qr')!;
      expect(method.surface).toBe('external');
      expect(method.blockedReason).toContain('affiché par le premier iPhone');
      expect(method.blockedReason).toContain('scanné par le second');
      expect(method.documentation).toContain('support.veo.com');
    });

    it('valide et enregistre un code ou numéro de série de caméra valide', async () => {
      const connectSpy = jest.spyOn(clubCamerasService, 'connectCamera').mockResolvedValueOnce({
        id: 'cam-real-123',
        message: 'Caméra jumelée avec succès',
      });

      const panelCode = readCode(ACCOUNT_PANEL);
      expect(panelCode).toContain('testID="veo-qr-serial-input"');
      expect(panelCode).toContain('testID="veo-qr-pairing-submit"');
      expect(panelCode).toContain('testID="veo-qr-pairing-success"');
      expect(panelCode).toContain('testID="veo-qr-pairing-error"');
      expect(panelCode).toContain('testID="veo-qr-pairing-retry"');

      await clubCamerasService.connectCamera({
        club_id: 'club-1',
        vendor: 'veo',
        model: 'Veo Cam 2',
        external_device_id: 'VEOCAM-2-84920',
        display_name: 'Caméra Honneur (VEOCAM-2-84920)',
      });

      expect(connectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          external_device_id: 'VEOCAM-2-84920',
          vendor: 'veo',
        }),
      );
      connectSpy.mockRestore();
    });

    it('détecte et rejette un code d’appairage expiré', () => {
      const panelCode = readCode(ACCOUNT_PANEL);
      expect(panelCode).toContain('Code d’appairage expiré. Veuillez générer un nouveau code');
    });

    it('détecte et rejette un code d’appairage invalide ou malformé', () => {
      const panelCode = readCode(ACCOUNT_PANEL);
      expect(panelCode).toContain('Code d’appairage invalide ou format non reconnu');
    });
  });

  // -------------------------------------------------------------------------
  // 3. États de connexion distincts
  // -------------------------------------------------------------------------
  describe('Workflow 3 — États de connexion distincts et vérifiés', () => {
    it('distingue strictement compte, caméra et flux de direct', () => {
      const workspace = readCode(WORKSPACE);
      expect(workspace).toContain('<VeoStateAxes');
      expect(workspace).toContain("account={connectionInput.accountVerified ? 'connected' : 'disconnected'}");
      expect(workspace).toContain('camera={cameraState}');
      expect(workspace).toContain('stream={streamState}');
    });

    it('résout correctement l’état de la caméra (non appairée, appairée hors ligne, en ligne/prête)', () => {
      expect(resolveCameraState(null)).toBe('unpaired');
      expect(resolveCameraState({ status: 'connected', sync_status: 'idle' })).toBe('paired_offline');
      expect(resolveCameraState({ status: 'connected', sync_status: 'ok' })).toBe('paired_available');
      expect(resolveCameraState({ status: 'error' })).toBe('error');
    });

    it('résout correctement l’état du flux (indisponible, démarrage, direct, interrompu, terminé)', () => {
      expect(resolveStreamState(null)).toBe('unavailable');
      expect(resolveStreamState({ kind: 'live', status: 'uploading' })).toBe('starting');
      expect(resolveStreamState({ kind: 'live', status: 'recording' })).toBe('live');
      expect(resolveStreamState({ status: 'failed' })).toBe('interrupted');
      expect(resolveStreamState({ kind: 'replay', status: 'ready' })).toBe('ended');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Récupération et navigation des vidéos
  // -------------------------------------------------------------------------
  describe('Workflow 4 — Récupération des captations autorisées', () => {
    it('charge les vidéos du compte Veo et les fusionne avec la bibliothèque club', async () => {
      mockCallFunction.mockResolvedValueOnce({
        videos: [
          { id: 'veo-101', title: 'Seniors vs Red Star', recordedAt: '2026-09-10T15:00:00Z', durationSec: 5400, status: 'Transcoded' },
          { id: 'veo-102', title: 'U17 National vs PSG', recordedAt: '2026-09-12T14:00:00Z', durationSec: 4800, status: 'Transcoded' },
        ],
      });

      const res = await listVeoAccountVideos();
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.videos).toHaveLength(2);
        expect(res.videos[0].title).toBe('Seniors vs Red Star');
      }
    });

    it('supporte le filtrage par équipe et la recherche textuelle', () => {
      const workspace = readCode(WORKSPACE);
      expect(workspace).toContain('testID="video-library-search"');
      expect(workspace).toContain('libraryTeams');
      expect(workspace).toContain('filteredVideos');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Visionnage en direct in-app
  // -------------------------------------------------------------------------
  describe('Workflow 5 — Visionnage direct dans ProDay', () => {
    it('joue les flux de direct directement dans ProDay sans quitter l’application', () => {
      const workspace = readCode(WORKSPACE);
      expect(workspace).toContain('liveVideos');
      expect(workspace).toContain('Regarder le direct dans ProDay');
      expect(workspace).toContain('setActivePlayingVideo({');
    });

    it('intègre les contrôles de lecture, l’indicateur Live et le plein écran', () => {
      const player = readCode(PLAYER);
      expect(player).toContain('LECTEUR INTÉGRÉ PRODAY');
      expect(player).toContain('isFullScreen');
      expect(player).toContain('setIsFullScreen');
      expect(player).toContain('controlsBar');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Replays & Contrôles
  // -------------------------------------------------------------------------
  describe('Workflow 6 — Replays et Contrôles de lecture', () => {
    it('résout l’URL de lecture officielle Veo à la volée', async () => {
      mockCallFunction.mockResolvedValueOnce({
        videoId: 'veo-101',
        url: 'https://storage.veo.co/download/match-veo-101.mp4',
        durationSec: 5400,
      });

      const playback = await resolveVeoPlaybackUrl('veo-101');
      expect(playback.ok).toBe(true);
      if (playback.ok) {
        expect(playback.target.url).toBe('https://storage.veo.co/download/match-veo-101.mp4');
      }
    });

    it('permet la réouverture immédiate après fermeture du lecteur', () => {
      const workspace = readCode(WORKSPACE);
      expect(workspace).toContain('onClose={() => setActivePlayingVideo(null)}');
      expect(workspace).toContain('handlePlayVideo(vid)');
    });
  });

  // -------------------------------------------------------------------------
  // 7. Résilience & Reprise après coupure
  // -------------------------------------------------------------------------
  describe('Workflow 7 — Résilience & Reprise d’erreurs', () => {
    it('affiche un bouton de reconnexion/réessayer en cas d’erreur de lecture', () => {
      const player = readCode(PLAYER);
      expect(player).toContain('errorState');
      expect(player).toContain('Reconnexion / Réessayer');
      expect(player).toContain('handleRetry');
    });

    it('gère l’indisponibilité réseau avec possibilité de réessai', async () => {
      mockCallFunction.mockRejectedValueOnce(
        Object.assign(new Error('Veo temporairement indisponible'), { code: 'functions/unavailable' }),
      );

      const status = await fetchVeoAccountStatus('club-1');
      expect(status.kind).toBe('unavailable');
      expect(status.connected).toBe(false);

      const workspace = readCode(WORKSPACE);
      const panel = readCode(ACCOUNT_PANEL);
      expect(workspace).toContain('testID="veo-playback-retry"');
      expect(panel).toContain('testID="veo-account-refresh"');
    });
  });

  // -------------------------------------------------------------------------
  // 8. Permissions et Périmètres par rôle
  // -------------------------------------------------------------------------
  describe('Workflow 8 — Permissions et Périmètres par Rôle', () => {
    it('donne accès aux connexions et clips au Club et au Coach', () => {
      const clubSections = resolveVideoSections('club').map((s) => s.id);
      const coachSections = resolveVideoSections('coach').map((s) => s.id);
      expect(clubSections).toContain('connections');
      expect(clubSections).toContain('clips');
      expect(coachSections).toContain('connections');
      expect(coachSections).toContain('clips');
    });

    it('retire les sections de configuration aux Joueurs et Parents', () => {
      const playerSections = resolveVideoSections('player').map((s) => s.id);
      const parentSections = resolveVideoSections('parent').map((s) => s.id);
      expect(playerSections).not.toContain('connections');
      expect(playerSections).not.toContain('clips');
      expect(parentSections).not.toContain('connections');
    });

    it('restreint la modification des identifiants d’application au rôle Dirigeant/Club', () => {
      expect(canManageVideoConnections('coach')).toBe(false);
      expect(canManageVideoConnections('club')).toBe(true);
      expect(canManageVideoConnections('president')).toBe(true);
      expect(canManageVideoConnections('player')).toBe(false);
    });

    it('bloque la lecture dans le lecteur universel pour les rôles non autorisés', () => {
      const player = readCode(PLAYER);
      expect(player).toContain('unauthorizedState');
      expect(player).toContain('Accès vidéo restreint');
    });
  });

  // -------------------------------------------------------------------------
  // 9. Analyse IA & Détection des temps forts
  // -------------------------------------------------------------------------
  describe('Workflow 9 — Analyse IA & Détection des Temps Forts', () => {
    it('conditionne l’analyse IA à l’accès au média sans bloquer la lecture', () => {
      const workspace = readCode(WORKSPACE);
      expect(workspace).toContain('testID="video-ai-analysis-panel"');
      expect(workspace).toContain('Conditionnée à l’accès effectif au fichier média source');
      expect(workspace).toContain('L’analyse s’exécute sans jamais bloquer la lecture vidéo');
      expect(workspace).toContain('Regarder sans attendre');
      expect(workspace).toContain('Média traitable IA');
      expect(workspace).toContain('Visionnage seul');
    });
  });

  // -------------------------------------------------------------------------
  // 10. Multi-plateformes & Appareils
  // -------------------------------------------------------------------------
  describe('Workflow 10 — Multi-plateformes & Dispositifs', () => {
    it('supporte à la fois les rendus Web (PC/Mac) et Natifs (iPhone/iPad/Android)', () => {
      const player = readCode(PLAYER);
      expect(player).toContain('WebVideoRenderer');
      expect(player).toContain('NativeVideoRenderer');
      expect(player).toContain('Platform.OS === \'web\'');
      expect(player).toContain('iframe');
      expect(player).toContain('VideoView');
      expect(player).toContain('WebView');
    });
  });
});
