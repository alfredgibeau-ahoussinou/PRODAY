import {
  CLUB_NAV_FOLDERS,
  CLUB_PRIMARY_NAV_IDS,
  clubNavFromTab,
  findClubNavItem,
  tabFromClubNav,
} from '../features/club/navigation/clubNavConfig';
import {
  resolveClubNavFolders,
  resolveClubPrimaryNav,
} from '../features/club/navigation/resolveClubNavAccess';

describe('clubNavConfig', () => {
  it('expose dossiers Pilotage / Effectifs / Sport / Ops / Club', () => {
    expect(CLUB_NAV_FOLDERS.map((f) => f.id)).toEqual([
      'accueil',
      'effectifs',
      'sport',
      'ops',
      'club',
    ]);
    expect(CLUB_PRIMARY_NAV_IDS).toEqual(['today', 'teams', 'matches', 'plus', 'club']);
  });

  it('mappe les onglets legacy vers la sidebar', () => {
    expect(clubNavFromTab('home')).toBe('today');
    expect(clubNavFromTab('recrutement')).toBe('recruitment');
    expect(clubNavFromTab('matchs')).toBe('matches');
    expect(clubNavFromTab('messages')).toBe('communication');
    expect(clubNavFromTab('profil')).toBe('club');
    expect(clubNavFromTab('covoiturage')).toBe('carpool');
    expect(clubNavFromTab('shop')).toBe('shop');
  });

  it('conserve le tab home pour le pilotage', () => {
    expect(tabFromClubNav('today')).toBe('home');
    expect(tabFromClubNav('assistant')).toBe('home');
    expect(tabFromClubNav('teams')).toBe('home');
    expect(tabFromClubNav('video')).toBe('home');
    expect(tabFromClubNav('recruitment')).toBe('recrutement');
    expect(tabFromClubNav('calendar')).toBe('matchs');
    expect(tabFromClubNav('matches')).toBe('matchs');
  });

  it('retrouve Pack Club et Assistant', () => {
    expect(findClubNavItem('pack')?.label).toBe('Pack Club');
    expect(findClubNavItem('pack')?.hint).toContain('SUR DEVIS');
    expect(findClubNavItem('carpool')?.tab).toBe('covoiturage');
    expect(findClubNavItem('assistant')?.aiBadge).toBe(true);
    expect(findClubNavItem('recruitment')?.label).toBe('Recrutement');
  });
});

describe('resolveClubNavAccess', () => {
  const allOn = (k: string) => k !== 'club_video' && k !== 'coach_video';

  it('Amateur : événements et vidéo verrouillés, calendrier ouvert', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_amateur',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'calendar')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'video')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'sponsoring')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'assistant')?.locked).toBe(false);
  });

  it('Essentiel : événements et sponsoring ouverts, vidéo verrouillée', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_essentiel',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'sponsoring')?.locked).toBe(false);
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

  it('flag admin club_video débloque la vidéo hors formule', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_amateur',
      isFeatureEnabled: (k) => k === 'club_video',
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'video')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(true);
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
    expect(items.find((i) => i.id === 'pack')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'teams')?.locked).toBe(true);
  });

  it('barre mobile expose 5 onglets primaires', () => {
    const primary = resolveClubPrimaryNav({
      offerId: 'club_premium',
      isFeatureEnabled: allOn,
    });
    expect(primary.map((i) => i.id)).toEqual(['today', 'teams', 'matches', 'plus', 'club']);
  });
});
