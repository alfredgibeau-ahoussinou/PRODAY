import {
  CLUB_NAV_FOLDERS,
  clubNavFromTab,
  findClubNavItem,
  tabFromClubNav,
} from '../features/club/navigation/clubNavConfig';
import { resolveClubNavFolders } from '../features/club/navigation/resolveClubNavAccess';

describe('clubNavConfig', () => {
  it('expose 5 dossiers Finder-like avec Assistant et Terrain', () => {
    expect(CLUB_NAV_FOLDERS.map((f) => f.id)).toEqual([
      'accueil',
      'organisation',
      'sport',
      'communication',
      'ressources',
    ]);
    const accueil = CLUB_NAV_FOLDERS[0]!.items.map((i) => i.id);
    expect(accueil).toEqual(['today', 'assistant', 'pitch']);
  });

  it('mappe les onglets legacy vers la sidebar', () => {
    expect(clubNavFromTab('home')).toBe('today');
    expect(clubNavFromTab('recrutement')).toBe('pipeline');
    expect(clubNavFromTab('matchs')).toBe('calendar');
    expect(clubNavFromTab('messages')).toBe('messages');
    expect(clubNavFromTab('profil')).toBe('vitrine');
    expect(clubNavFromTab('covoiturage')).toBe('carpool');
    expect(clubNavFromTab('shop')).toBe('shop');
  });

  it('conserve le tab home pour les chapitres portail', () => {
    expect(tabFromClubNav('today')).toBe('home');
    expect(tabFromClubNav('assistant')).toBe('home');
    expect(tabFromClubNav('structure')).toBe('home');
    expect(tabFromClubNav('video')).toBe('home');
    expect(tabFromClubNav('pipeline')).toBe('recrutement');
    expect(tabFromClubNav('calendar')).toBe('matchs');
  });

  it('retrouve les items ressources', () => {
    expect(findClubNavItem('equipment')?.label).toBe('Équipements');
    expect(findClubNavItem('carpool')?.tab).toBe('covoiturage');
    expect(findClubNavItem('assistant')?.aiBadge).toBe(true);
  });
});

describe('resolveClubNavAccess', () => {
  const allOn = () => true;

  it('Amateur : tournois et vidéo verrouillés, calendrier ouvert', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_amateur',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'calendar')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'video')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'sponsors')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'assistant')?.locked).toBe(false);
  });

  it('Essentiel : tournois et sponsors ouverts, vidéo verrouillée', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_essentiel',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'sponsors')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'video')?.locked).toBe(true);
  });

  it('Tout inclus : vidéo ouverte', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_premium',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'video')?.locked).toBe(false);
  });

  it('masque boutique si flag shop off', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_premium',
      isFeatureEnabled: (k) => k !== 'shop',
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'shop')).toBeUndefined();
  });

  it('sans formule : modules feature locked', () => {
    const folders = resolveClubNavFolders({
      offerId: null,
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'today')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'offers')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'structure')?.locked).toBe(true);
  });
});
