import { readFileSync } from 'fs';
import { join } from 'path';
import { coachVideoSurfaceTokens } from '../features/video/videoSurfaceTokens';
import type { CoachThemeTokens } from '../utils/coachTeamTheme';

const root = join(__dirname, '..', '..');
const read = (relative: string) => readFileSync(join(root, relative), 'utf8');

/**
 * Code sans commentaires : les en-têtes **documentent** ce qui a été retiré (et citent
 * donc les libellés bannis). Les garde-fous doivent porter sur le code rendu, pas sur la
 * prose qui explique la décision.
 */
const readCode = (relative: string) =>
  read(relative)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const WORKSPACE = 'src/features/video/VideoWorkspace.tsx';
const CLUB_HUB = 'src/features/club/ui/ClubVideoHub.tsx';
const COACH_HUB = 'src/screens/coach/CoachVideoHubScreen.tsx';

/**
 * L'espace Vidéo est **un seul module** rendu par les deux pôles. Ces garde-fous
 * empêchent deux régressions précises : la réapparition de contrôles qui simulent une
 * intégration inexistante, et la duplication du module par pôle (copies divergentes).
 */
describe('Espace Vidéo — un module partagé, aucune intégration simulée', () => {
  it('rend le même module depuis le pôle Club et le pôle Coach', () => {
    for (const hub of [CLUB_HUB, COACH_HUB]) {
      expect(readCode(hub)).toMatch(/from '[^']*video\/VideoWorkspace'/);
      expect(read(hub)).toContain('<VideoWorkspace');
    }
    // Le module est le seul endroit qui parle aux services vidéo.
    const workspace = read(WORKSPACE);
    expect(workspace).toContain('clubCamerasService');
    expect(workspace).toContain('buildClipsFromVideos');
    expect(readCode(CLUB_HUB)).not.toContain('clubCamerasService');
    expect(readCode(COACH_HUB)).not.toContain('clubCamerasService');
  });

  it('ne code aucune couleur de pôle dans le module partagé', () => {
    const workspace = readCode(WORKSPACE);
    // Les surfaces viennent des jetons reçus : pas d'hex, pas de rgba en dur.
    const styleBlock = workspace.slice(workspace.indexOf('const styles = StyleSheet.create'));
    expect(styleBlock).not.toMatch(/#[0-9A-Fa-f]{6}/);
    expect(styleBlock).not.toMatch(/rgba\(/);
  });

  it('n’invente aucun état : ni « Connecté », ni clip, ni accusé de partage', () => {
    const sources = [WORKSPACE, CLUB_HUB, COACH_HUB].map(readCode).join('\n');
    // La connexion n'est déclarée qu'après vérification auprès du serveur ProDay :
    // `connected` vient du jeton Veo réellement présent dans `veo_sessions`.
    expect(readCode(WORKSPACE)).toContain('accountVerified: veoAccount.state.connected');
    expect(readCode(WORKSPACE)).toContain('clientConfigured: veoAccount.state.configured');
    // Aucun jeu de clips fabriqué, aucun destinataire de partage implicite.
    expect(sources).not.toMatch(/DEFAULT_CLIPS/);
    expect(sources).not.toMatch(/Extrait Partagé|Partagé au groupe|envoyé au groupe/i);
    // Aucune diffusion simulée vers un matériel non connecté.
    expect(sources).not.toMatch(/Smartphones Vestiaire|Sync Locker|Telestration Pro/i);
  });

  it('traite le direct comme un renvoi externe, jamais comme un lecteur ProDay', () => {
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('<VeoExternalHandoffCard');
    // Le seul lecteur intégré lit une source réellement associée du document persisté.
    expect(workspace).toContain('storageUrl: video.storage_url');
    expect(workspace).toMatch(/Aucune source lisible n’est associée/);
  });

  it('dérive le libellé de source du document, sans durée ni score inventés', () => {
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('MATCH_VIDEO_SOURCE_LABEL');
    expect(workspace).toContain('MATCH_VIDEO_VENDOR_LABEL');
    // Aucun score ni compteur de vues fabriqué pour remplir une carte.
    expect(workspace).toMatch(/score: '',/);
    expect(workspace).toMatch(/viewsCount: 0,/);
    expect(workspace).not.toMatch(/\|\| 24|'RC France'/);
  });

  /**
   * Un QR décoratif ou un faux succès d’appairage est exactement ce que la demande
   * interdit. Ce test échoue si quiconque ajoute un scanner qui n’a pas de mécanisme
   * officiel derrière lui.
   */
  it('n’embarque aucun scanner de QR ni de fausse confirmation d’appairage', () => {
    const sources = [WORKSPACE, CLUB_HUB, COACH_HUB]
      .map((p) => readCode(p) + read('src/features/video/VideoWorkspacePanels.tsx'))
      .join('\n');
    // Aucune brique de scan caméra n’est utilisée pour « appairer » un appareil Veo.
    expect(sources).not.toMatch(/BarCodeScanner|expo-camera|CameraView|useCameraPermissions/);
    // Aucun état d’appairage simulé.
    expect(sources).not.toMatch(/appair[ée]\s*avec succ[eè]s|Pairing successful|paired successfully/i);
  });

  it('décrit le QR Veo Go là où il vit réellement', () => {
    const panels = read('src/features/video/VideoWorkspacePanels.tsx');
    const workspace = readCode(WORKSPACE);
    // Le panneau de connexion est rendu, et il vient du modèle documenté.
    expect(workspace).toContain('<VeoConnectPanel');
    expect(panels).toContain('VEO_CONNECTION_METHODS');
    // Les trois axes d’état restent séparés à l’écran.
    expect(workspace).toContain('<VeoStateAxes');
    expect(panels).toContain('ÉTATS DISTINCTS');
  });

  it('réserve l’association de match aux rôles habilités', () => {
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('canManageVideoConnections');
    expect(workspace).toMatch(/\{canManage \? \(/);
  });

  it('verrouille la lecture des états non lisibles (téléversement, traitement, échec)', () => {
    // La carte canonique désactive la presse et l'expose à l'accessibilité —
    // le voile seul ne suffit pas : un état décoratif ne protège rien.
    const card = readCode('src/features/video/VideoCard.tsx');
    expect(card).toContain('disabled={!isPlayable}');
    expect(card).toContain('accessibilityState={{ disabled: !isPlayable }}');
    // Barrière centrale en amont de toute résolution de flux (lecteur héro,
    // réessai, direct, clips) : un appelant qui oublie le verrou de carte
    // est rattrapé par `handlePlayVideo`.
    const workspace = readCode(WORKSPACE);
    expect(workspace).toContain('resolveVideoLifecycle(video)');
    expect(workspace).toMatch(/!lifecycle\.playable/);
    expect(workspace).toMatch(/Lecture indisponible/);
  });
});

describe('videoSurfaceTokens — les deux pôles alimentent le même contrat', () => {
  const coachTokens: CoachThemeTokens = {
    accent: '#22C55E',
    onAccent: '#000000',
    deep: '#0F5C2B',
    soft: 'rgba(34, 197, 94, 0.22)',
    glow: 'rgba(34, 197, 94, 0.24)',
    bg: '#0B0B0F',
    surface: '#14141A',
    elevated: '#1C1C24',
    border: 'rgba(255, 255, 255, 0.08)',
    foreground: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.6)',
    isLight: false,
    variant: 'solid',
    teamLabel: 'U15',
  };

  it('mappe les jetons Coach sans inventer de niveau de bordure', () => {
    const adapted = coachVideoSurfaceTokens(coachTokens);
    expect(adapted.surface).toBe(coachTokens.surface);
    expect(adapted.accent).toBe(coachTokens.accent);
    expect(adapted.accentSoft).toBe(coachTokens.soft);
    expect(adapted.onAccent).toBe(coachTokens.onAccent);
    // Le pôle Coach n'a qu'un niveau de bordure : on réutilise, on n'invente pas.
    expect(adapted.borderStrong).toBe(coachTokens.border);
  });

  it('fournit les états sémantiques absents des jetons Coach', () => {
    const adapted = coachVideoSurfaceTokens(coachTokens);
    for (const key of ['success', 'warning', 'danger'] as const) {
      expect(adapted[key]).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
