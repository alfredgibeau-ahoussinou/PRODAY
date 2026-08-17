import {
  COACH_HOME_TOOLS,
  COACH_HOME_DEST_IDS,
  COACH_MENU_DEST_IDS,
  COACH_MORE_NAV_IDS,
  COACH_NAV_FOLDERS,
  COACH_PRIMARY_NAV_IDS,
  COACH_SECONDARY_NAV_IDS,
  COACH_TOOL_GROUPS,
  canonicalizeCoachNav,
  coachNavFromTab,
  findCoachNavItem,
  primaryTabForCoachNav,
  tabFromCoachNav,
} from '../features/coach/navigation/coachNavConfig';
import {
  resolveCoachMenuItems,
  resolveCoachMoreItems,
  resolveCoachNavFolders,
  resolveCoachToolGroups,
} from '../features/coach/navigation/resolveCoachNavAccess';
import { COACH_SITE, getCoachPageIdentity } from '../content/coachPageIdentity';

describe('coachNavConfig', () => {
  it('expose 4 onglets premium (Accueil → Profil)', () => {
    const ids = COACH_NAV_FOLDERS.map((f) => f.id);
    expect(ids).toEqual(['accueil', 'equipe', 'ia', 'profil']);
    const dest = COACH_NAV_FOLDERS.flatMap((f) => f.items.map((i) => i.id));
    expect(dest).toEqual(['today', 'equipe', 'coach_ia', 'profil']);
    expect(COACH_PRIMARY_NAV_IDS).toEqual(dest);
    expect(findCoachNavItem('today')?.label).toBe('Accueil');
    expect(findCoachNavItem('equipe')?.label).toBe('Équipe');
    expect(findCoachNavItem('coach_ia')?.label).toBe('IA');
    expect(findCoachNavItem('profil')?.label).toBe('Profil');
    expect(findCoachNavItem('messages')?.label).toBe('Messages');
  });

  it('canonise les alias legacy et surligne Accueil pour les outils secondaires', () => {
    expect(canonicalizeCoachNav('pitch')).toBe('today');
    expect(canonicalizeCoachNav('effectif')).toBe('equipe');
    expect(canonicalizeCoachNav('planning')).toBe('entrainements');
    expect(canonicalizeCoachNav('matchs')).toBe('match_center');
    expect(primaryTabForCoachNav('gestion')).toBe('today');
    expect(primaryTabForCoachNav('joueurs')).toBe('today');
    expect(primaryTabForCoachNav('smart_tactics')).toBe('today');
    expect(primaryTabForCoachNav('match_center')).toBe('today');
    expect(primaryTabForCoachNav('entrainements')).toBe('today');
    expect(primaryTabForCoachNav('carpool')).toBe('today');
    expect(primaryTabForCoachNav('planning')).toBe('today');
    expect(primaryTabForCoachNav('plus')).toBe('today');
    expect(primaryTabForCoachNav('messages')).toBe('profil');
    expect(primaryTabForCoachNav('today')).toBe('today');
  });

  it('mappe tabs ↔ nav', () => {
    expect(tabFromCoachNav('match_center')).toBe('matchs');
    expect(tabFromCoachNav('messages')).toBe('messages');
    expect(coachNavFromTab('feed')).toBe('smart_tactics');
    expect(coachNavFromTab('home')).toBe('today');
    expect(findCoachNavItem('smart_tactics')?.requiresSmartTactics).toBe(true);
    expect(findCoachNavItem('mes_videos')?.label).toBe('Mes vidéos');
  });

  it('range les outils secondaires sur Accueil (hors barre primaire)', () => {
    const dest = COACH_NAV_FOLDERS.flatMap((f) => f.items.map((i) => i.id));
    expect(dest).not.toContain('plus');
    expect(dest).not.toContain('messages');
    expect(dest).not.toContain('gestion');
    expect(dest).not.toContain('smart_tactics');
    expect(dest).not.toContain('match_center');
    expect(dest).not.toContain('entrainements');
    expect(dest).not.toContain('joueurs');
    expect(COACH_SECONDARY_NAV_IDS).toContain('match_center');
    expect(COACH_SECONDARY_NAV_IDS).toContain('entrainements');
    expect(COACH_SECONDARY_NAV_IDS).toContain('joueurs');
    expect(COACH_SECONDARY_NAV_IDS).toContain('smart_tactics');
    expect(COACH_SECONDARY_NAV_IDS).toContain('gestion');
    expect(COACH_SECONDARY_NAV_IDS).not.toContain('plus');
    expect(COACH_HOME_DEST_IDS).toContain('planning');
    expect(COACH_MENU_DEST_IDS).toEqual(COACH_HOME_DEST_IDS);
    expect(COACH_TOOL_GROUPS.flatMap((g) => g.toolIds)).toHaveLength(8);
    expect(COACH_HOME_TOOLS.map((t) => t.id)).toEqual([
      'match_center',
      'entrainements',
      'gestion',
      'com_staff',
      'carpool',
      'smart_tactics',
      'mes_videos',
      'forme',
    ]);
    expect(COACH_MORE_NAV_IDS).toContain('planning');
  });
});

describe('resolveCoachNavAccess', () => {
  it('soft-lock Smart Tactics si hors formule', () => {
    const more = resolveCoachMoreItems({ canSmartTactics: false, canVideo: true });
    const st = more.find((i) => i.id === 'smart_tactics');
    expect(st?.locked).toBe(true);
    expect(st?.lockReason).toMatch(/Coach Pro/i);
  });

  it('ouvre Smart Tactics si Coach Pro / club covers', () => {
    const more = resolveCoachMoreItems({ canSmartTactics: true, canVideo: true });
    const st = more.find((i) => i.id === 'smart_tactics');
    expect(st?.locked).toBe(false);
  });

  it('soft-lock Mes vidéos si flag coach_video off', () => {
    const more = resolveCoachMoreItems({ canSmartTactics: true, canVideo: false });
    const video = more.find((i) => i.id === 'mes_videos');
    expect(video?.locked).toBe(true);
    expect(video?.lockReason).toMatch(/Vidéo Coach/i);
  });

  it('résout 4 dossiers primaires', () => {
    const folders = resolveCoachNavFolders({ canSmartTactics: true, canVideo: true });
    expect(folders).toHaveLength(4);
    expect(folders.flatMap((f) => f.items).map((i) => i.id)).toHaveLength(4);
  });

  it('expose les 8 lignes Outils depuis COACH_TOOL_GROUPS', () => {
    const menu = resolveCoachMenuItems({ canSmartTactics: true, canVideo: true });
    expect(menu.map((i) => i.id)).toEqual(COACH_HOME_TOOLS.map((t) => t.id));
    expect(menu.find((i) => i.id === 'match_center')?.label).toBe('Matchs');
    expect(menu.find((i) => i.id === 'entrainements')?.label).toBe('Séances');
    expect(menu.find((i) => i.id === 'com_staff')?.label).toBe('Parents');
    const groups = resolveCoachToolGroups({ canSmartTactics: true, canVideo: true });
    expect(groups).toHaveLength(3);
    expect(groups.flatMap((g) => g.items)).toHaveLength(8);
  });
});

describe('COACH_SITE night', () => {
  it('utilise le fond noir SportEasy', () => {
    expect(COACH_SITE.bg).toBe('#000000');
    expect(COACH_SITE.surface).toBe('#1C1C1E');
    expect(COACH_SITE.foreground).toBe('#FFFFFF');
    expect(COACH_SITE.accent).toBe('#006CFC');
  });
});

describe('coach page titles SportEasy', () => {
  it('conserve les titres des sections déplacées', () => {
    expect(getCoachPageIdentity('today').title).toBe('Accueil');
    expect(getCoachPageIdentity('equipe').title).toBe('Équipe');
    expect(getCoachPageIdentity('match_center').title).toBe('Matchs');
    expect(getCoachPageIdentity('entrainements').title).toBe('Entraînements');
    expect(getCoachPageIdentity('joueurs').title).toBe('Joueurs');
    expect(getCoachPageIdentity('coach_ia').title).toBe('Assistant IA');
    expect(getCoachPageIdentity('messages').title).toBe('Messagerie');
    expect(getCoachPageIdentity('plus').title).toBe('Menu');
    expect(getCoachPageIdentity('profil').title).toBe('Profil coach');
  });
});
