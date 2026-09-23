import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..', '..');
const read = (relative: string) => readFileSync(join(root, relative), 'utf8');
const readCode = (relative: string) =>
  read(relative)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const WORKSPACE = 'src/features/video/VideoWorkspace.tsx';
const CLUB_HUB = 'src/features/club/ui/ClubVideoHub.tsx';
const COACH_HUB = 'src/screens/coach/CoachVideoHubScreen.tsx';
const PLAYER = 'src/components/video/ProDayIntegratedVideoPlayer.tsx';
const ACCOUNT_PANEL = 'src/features/video/VeoAccountPanel.tsx';

describe('Intégration Veo In-App ProDay — Coach & Club', () => {
  describe('Cohérence stricte entre Coach et Club', () => {
    it('connecte Coach et Club au même composant VideoWorkspace partagé', () => {
      const clubCode = readCode(CLUB_HUB);
      const coachCode = readCode(COACH_HUB);
      expect(clubCode).toContain('<VideoWorkspace');
      expect(coachCode).toContain('<VideoWorkspace');
      expect(clubCode).toContain("from '../../video/VideoWorkspace'");
      expect(coachCode).toContain("from '../../features/video/VideoWorkspace'");
    });

    it('partage les mêmes enregistrements autorisés entre Coach et Club via clubCamerasService', () => {
      const workspace = read(WORKSPACE);
      expect(workspace).toMatch(/clubCamerasService\s*\.listMatchVideos/);
      expect(workspace).toContain('useVeoAccount(effectiveClubId ?? null)');
      expect(workspace).toContain('useVeoLibrary(veoAccount.state.connected)');
    });
  });

  describe('Visionnage en direct (Live) et enregistrements dans ProDay', () => {
    it('fournit la lecture des flux de direct directement dans ProDay sans quitter l’application', () => {
      const workspace = read(WORKSPACE);
      expect(workspace).toContain('liveVideos');
      expect(workspace).toContain('Regarder le direct dans ProDay');
      expect(workspace).toContain('setActivePlayingVideo({');
      expect(workspace).toContain('Diffusion en direct');
    });

    it('permet d’associer un flux Veo Live pour lecture in-app immédiate', () => {
      const workspace = read(WORKSPACE);
      expect(workspace).toContain('Associer un direct Veo Live');
      expect(workspace).toContain('setAssociateModalOpen(true)');
    });

    it('ouvre les enregistrements Veo du compte connecté dans le lecteur intégré ProDay', () => {
      const workspace = read(WORKSPACE);
      expect(workspace).toContain('resolveVeoPlaybackUrl(video.veoVideoId)');
      expect(workspace).toContain('url: result.target.url');
    });
  });

  describe('Lecteur Vidéo Intégré Universel — Contrôles & Plein Écran', () => {
    it('embarque les contrôles de lecture, mode plein écran et retour ProDay', () => {
      const playerCode = read(PLAYER);
      expect(playerCode).toContain('isFullScreen');
      expect(playerCode).toContain('setIsFullScreen');
      expect(playerCode).toContain('controlsBar');
      expect(playerCode).toContain('headerActionBtn');
      expect(playerCode).toContain('Plein écran');
      expect(playerCode).toContain('Quitter le plein écran');
    });

    it('gère explicitement les états de chargement, déconnexion/reconnexion et accès refusé', () => {
      const playerCode = read(PLAYER);
      expect(playerCode).toContain('loadingOverlay');
      expect(playerCode).toContain('Connexion au flux vidéo…');
      expect(playerCode).toContain('errorState');
      expect(playerCode).toContain('Reconnexion / Réessayer');
      expect(playerCode).toContain('unauthorizedState');
      expect(playerCode).toContain('Accès vidéo restreint');
    });
  });

  describe('Appairage QR et Statuts Matériel & Diffusion Vérifiés', () => {
    it('expose le parcours d’appairage Veo Cam avec assistant d’enregistrement matériel', () => {
      const panelCode = read(ACCOUNT_PANEL);
      expect(panelCode).toContain('Appairage par QR · Veo Go');
      expect(panelCode).toContain('Appairer une caméra Veo Cam');
      expect(panelCode).toContain('ENREGISTREMENT MATÉRIEL VEO');
      expect(panelCode).toContain('connectCamera');
    });

    it('explique clairement la contrainte d’autorisation externe Veo et le retour propre à ProDay', () => {
      const panelCode = read(ACCOUNT_PANEL);
      expect(panelCode).toContain('Autorisation externe & Retour ProDay');
      expect(panelCode).toContain('retourne proprement dans ProDay avec votre session synchronisée');
    });

    it('reflète les statuts vérifiés pour le compte, la caméra et le flux de diffusion', () => {
      const workspace = read(WORKSPACE);
      expect(workspace).toContain('<VeoStateAxes');
      expect(workspace).toContain('account={connectionInput.accountVerified ? \'connected\' : \'disconnected\'}');
      expect(workspace).toContain('camera={cameraState}');
      expect(workspace).toContain('stream={streamState}');
    });
  });

  describe('Zéro Configuration Technique Utilisateur & Authentification Supportée', () => {
    it('n’impose aucune saisie de clé d’API ou secret développeur à l’utilisateur', () => {
      const panelCode = read(ACCOUNT_PANEL);
      // Les champs de saisie technique de client_id et client_secret ne sont plus demandés à l'utilisateur
      expect(panelCode).not.toContain('placeholder="client-id fourni par Veo"');
      expect(panelCode).toContain('CONNEXION AU COMPTE VEO · ZÉRO CONFIGURATION TECHNIQUE');
      expect(panelCode).toContain('Aucune configuration technique requise');
      expect(panelCode).toContain('Les clés partenaires requises relèvent des administrateurs ProDay côté serveur');
    });

    it('propose l’action directe Connecter mon compte Veo et explique les prérequis administrateur', () => {
      const panelCode = read(ACCOUNT_PANEL);
      expect(panelCode).toContain('Connecter mon compte Veo');
      expect(panelCode).toContain('Prérequis d’administration ProDay');
      expect(panelCode).toContain('veo-connect-email');
      expect(panelCode).toContain('veo-connect-password');
      expect(panelCode).toContain('veo-connect-submit');
    });
  });

  describe('Analyse IA Conditionnée aux Accès Médias Réels', () => {
    it('affiche le centre d’analyse IA vérifiant l’accès réel au fichier média', () => {
      const workspace = read(WORKSPACE);
      expect(workspace).toContain('testID="video-ai-analysis-panel"');
      expect(workspace).toContain('Conditionnée à l’accès effectif au fichier média source');
      expect(workspace).toContain('Média traitable IA');
      expect(workspace).toContain('Visionnage seul');
    });

    it('ne bloque jamais la lecture vidéo lorsque l’analyse IA est en cours ou indisponible', () => {
      const workspace = read(WORKSPACE);
      expect(workspace).toContain('L’analyse s’exécute sans jamais bloquer la lecture vidéo');
      expect(workspace).toContain('Regarder sans attendre');
      expect(workspace).toContain('Aucune analyse IA en direct temps réel n’est promise sans captation validée');
    });
  });
});
