import {
  CLUB_CREATE_ACTIONS,
  CLUB_MENU_DEST_IDS,
  CLUB_NAV_FOLDERS,
  CLUB_PRIMARY_NAV_IDS,
  CLUB_TOOL_GROUPS,
  canonicalizeClubNav,
  clubNavFromTab,
  findClubNavItem,
  primaryTabForClubNav,
  resolveClubNavOnTabSync,
  tabFromClubNav,
} from '../features/club/navigation/clubNavConfig';
import {
  resolveClubMenuItems,
  resolveClubNavFolders,
  resolveClubPrimaryNav,
} from '../features/club/navigation/resolveClubNavAccess';
import { planClubAiReply } from '../features/club/ai/clubAiExecutor';
import type { ClubWorkspace } from '../features/club/hooks/useClubWorkspace';

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

  it('surligne Menu pour les destinations secondaires', () => {
    expect(primaryTabForClubNav('players')).toBe('plus');
    expect(primaryTabForClubNav('trainings')).toBe('plus');
    expect(primaryTabForClubNav('assistant')).toBe('plus');
    expect(primaryTabForClubNav('today')).toBe('today');
    expect(primaryTabForClubNav('matches')).toBe('matches');
    expect(CLUB_MENU_DEST_IDS).toContain('coaches');
    expect(CLUB_MENU_DEST_IDS).toContain('notifications');
    expect(CLUB_MENU_DEST_IDS).toContain('permissions');
    expect(canonicalizeClubNav('players')).toBe('players');
  });

  it('conserve plus / outils lors de la sync tab', () => {
    expect(resolveClubNavOnTabSync('plus', 'home')).toBe('plus');
    expect(resolveClubNavOnTabSync('players', 'home')).toBe('players');
    expect(resolveClubNavOnTabSync('matches', 'home')).toBe('today');
    expect(resolveClubNavOnTabSync('matches', 'matchs')).toBe('matches');
    expect(resolveClubNavOnTabSync('carpool', 'covoiturage')).toBe('carpool');
  });

  it('expose 7 actions CRÉER en français', () => {
    expect(CLUB_CREATE_ACTIONS.map((a) => a.id)).toEqual([
      'match',
      'training',
      'player',
      'coach',
      'invite_member',
      'event',
      'invite_club',
    ]);
    expect(CLUB_CREATE_ACTIONS.find((a) => a.id === 'training')?.label).toBe('Entraînement');
    expect(CLUB_CREATE_ACTIONS.find((a) => a.id === 'invite_club')?.label).toBe(
      'Invitation autre club',
    );
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

  it('groupe les outils Menu par jobs (Fréquents / Aujourd’hui / Effectifs / Compétition / Admin)', () => {
    expect(CLUB_TOOL_GROUPS.map((g) => g.title)).toEqual([
      'Fréquents',
      'Aujourd’hui',
      'Effectifs',
      'Compétition',
      'Admin',
    ]);
    const allIds = CLUB_TOOL_GROUPS.flatMap((g) => g.ids);
    expect(new Set(allIds).size).toBe(allIds.length);
    const menu = resolveClubMenuItems({
      offerId: 'club_premium',
      isFeatureEnabled: allOn,
    });
    expect(menu.map((i) => i.id)).toContain('players');
    expect(menu.map((i) => i.id)).toContain('assistant');
    expect(menu.map((i) => i.id)).toContain('notifications');
  });
});

describe('planClubAiReply', () => {
  const ws = {
    briefingHeadline: 'Brief',
    briefingSummary: 'Résumé',
    statusLabel: 'OK',
    teamsWithoutCoach: 1,
    todayTrainings: [],
    events: [],
  } as unknown as ClubWorkspace;

  it('refuse l’auto-mouvement de joueurs', () => {
    const plan = planClubAiReply('Peux-tu déplacer le joueur ?', ws);
    expect(plan.reply).toMatch(/jamais/i);
    expect(plan.sensitive?.id).toBe('refuse_auto_move');
  });

  it('demande confirmation pour les rappels de convocation', () => {
    const plan = planClubAiReply('Envoie les rappels de convocation', ws);
    expect(plan.sensitive?.id).toBe('nav_trainings');
  });
});
