import {
  COACH_HOME_TOOLS,
  COACH_MORE_NAV_IDS,
  COACH_NAV_FOLDERS,
  COACH_PRIMARY_NAV_IDS,
  canonicalizeCoachNav,
  coachNavFromTab,
  findCoachNavItem,
  primaryTabForCoachNav,
  tabFromCoachNav,
} from '../features/coach/navigation/coachNavConfig';
import {
  resolveCoachMoreItems,
  resolveCoachNavFolders,
} from '../features/coach/navigation/resolveCoachNavAccess';
import { COACH_SITE, getCoachPageIdentity } from '../content/coachPageIdentity';

describe('coachNavConfig', () => {
  it('expose 5 onglets SportEasy (Calendrier → Autres)', () => {
    const ids = COACH_NAV_FOLDERS.map((f) => f.id);
    expect(ids).toEqual(['accueil', 'messagerie', 'equipe', 'match', 'plus']);
    const dest = COACH_NAV_FOLDERS.flatMap((f) => f.items.map((i) => i.id));
    expect(dest).toEqual(['today', 'messages', 'effectif', 'match_center', 'plus']);
    expect(COACH_PRIMARY_NAV_IDS).toEqual(dest);
    expect(findCoachNavItem('today')?.label).toBe('Calendrier');
    expect(findCoachNavItem('messages')?.label).toBe('Messagerie');
    expect(findCoachNavItem('effectif')?.label).toBe('Membres');
    expect(findCoachNavItem('match_center')?.label).toBe('Statistiques');
    expect(findCoachNavItem('plus')?.label).toBe('Autres');
  });

  it('sort l’Agenda de la barre et le range dans Autres', () => {
    const dest = COACH_NAV_FOLDERS.flatMap((f) => f.items.map((i) => i.id));
    expect(dest).not.toContain('planning');
    expect(dest).not.toContain('pitch');
    expect(dest).not.toContain('gestion');
    expect(dest).not.toContain('carpool');
    expect(dest).not.toContain('smart_tactics');
    expect(dest).not.toContain('matchs');
    expect(COACH_MORE_NAV_IDS).toContain('planning');
    expect(primaryTabForCoachNav('planning')).toBe('plus');
  });

  it('mappe tabs ↔ nav et alias les anciennes pages', () => {
    expect(tabFromCoachNav('match_center')).toBe('matchs');
    expect(tabFromCoachNav('matchs')).toBe('matchs');
    expect(tabFromCoachNav('messages')).toBe('messages');
    expect(canonicalizeCoachNav('pitch')).toBe('today');
    expect(canonicalizeCoachNav('matchs')).toBe('match_center');
    expect(primaryTabForCoachNav('gestion')).toBe('effectif');
    expect(primaryTabForCoachNav('messages')).toBe('messages');
    expect(primaryTabForCoachNav('smart_tactics')).toBe('plus');
    expect(primaryTabForCoachNav('carpool')).toBe('plus');
    expect(coachNavFromTab('feed')).toBe('smart_tactics');
    expect(coachNavFromTab('home')).toBe('today');
    expect(findCoachNavItem('smart_tactics')?.requiresSmartTactics).toBe(true);
    expect(findCoachNavItem('mes_videos')?.label).toBe('Mes vidéos');
    expect(findCoachNavItem('pitch')?.id).toBe('today');
  });

  it('garde les outils dans Autres, plus sur Calendrier', () => {
    expect(COACH_HOME_TOOLS.map((t) => t.id)).toEqual([
      'coach_ia',
      'smart_tactics',
      'mes_videos',
      'forme',
      'carpool',
      'com_staff',
    ]);
    expect(COACH_MORE_NAV_IDS).toEqual([
      'coach_ia',
      'planning',
      'carpool',
      'com_staff',
      'smart_tactics',
      'mes_videos',
      'forme',
      'profil',
    ]);
    expect(COACH_MORE_NAV_IDS).not.toContain('messages');
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

  it('ouvre Mes vidéos si flag coach_video on', () => {
    const more = resolveCoachMoreItems({ canSmartTactics: true, canVideo: true });
    const video = more.find((i) => i.id === 'mes_videos');
    expect(video?.locked).toBe(false);
  });

  it('résout 5 dossiers primaires', () => {
    const folders = resolveCoachNavFolders({ canSmartTactics: true, canVideo: true });
    expect(folders).toHaveLength(5);
    expect(folders.flatMap((f) => f.items).map((i) => i.id)).toHaveLength(5);
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
  it('aligne les titres d’onglets sur Calendrier / Messagerie / Membres / Statistiques / Autres', () => {
    expect(getCoachPageIdentity('today').title).toBe('Calendrier');
    expect(getCoachPageIdentity('messages').title).toBe('Messagerie');
    expect(getCoachPageIdentity('effectif').title).toBe('Membres');
    expect(getCoachPageIdentity('match_center').title).toBe('Statistiques');
    expect(getCoachPageIdentity('coach_ia').title).toBe('Assistant IA');
    expect(getCoachPageIdentity('plus').title).toBe('Autres');
    expect(getCoachPageIdentity('planning').title).toBe('Agenda');
  });
});
