import { readFileSync } from 'fs';
import path from 'path';
import {
  CLUB_CREATE_ACTIONS,
  CLUB_MENU_DEST_IDS,
  CLUB_NAV_FOLDERS,
  CLUB_PRIMARY_NAV_IDS,
  CLUB_TOOL_GROUPS,
  canonicalizeClubNav,
  clubNavFromDashboard,
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
    expect(CLUB_PRIMARY_NAV_IDS).toEqual(['today', 'calendar', 'teams', 'plus']);
  });

  it('mappe les onglets legacy vers la sidebar', () => {
    expect(clubNavFromTab('home')).toBe('today');
    expect(clubNavFromTab('recrutement')).toBe('players');
    expect(clubNavFromTab('matchs')).toBe('matches');
    expect(clubNavFromTab('messages')).toBe('communication');
    expect(clubNavFromTab('profil')).toBe('club');
    expect(clubNavFromTab('covoiturage')).toBe('today');
    expect(clubNavFromTab('shop')).toBe('today');
  });

  it('conserve le tab home pour le pilotage', () => {
    expect(tabFromClubNav('today')).toBe('home');
    expect(tabFromClubNav('assistant')).toBe('home');
    expect(tabFromClubNav('teams')).toBe('home');
    expect(tabFromClubNav('calendar')).toBe('matchs');
    expect(tabFromClubNav('matches')).toBe('matchs');
  });

  it('surligne Menu pour les destinations secondaires', () => {
    expect(primaryTabForClubNav('players')).toBe('plus');
    expect(primaryTabForClubNav('trainings')).toBe('plus');
    expect(primaryTabForClubNav('assistant')).toBe('plus');
    expect(primaryTabForClubNav('today')).toBe('today');
    // Matchs et Club ont quitté le dock : ils s'atteignent par le Menu.
    expect(primaryTabForClubNav('matches')).toBe('plus');
    expect(primaryTabForClubNav('club')).toBe('plus');
    expect(primaryTabForClubNav('calendar')).toBe('calendar');
    expect(primaryTabForClubNav('teams')).toBe('teams');
    expect(CLUB_MENU_DEST_IDS).toContain('coaches');
    expect(CLUB_MENU_DEST_IDS).toContain('notifications');
    expect(CLUB_MENU_DEST_IDS).toContain('permissions');
    expect(CLUB_MENU_DEST_IDS).toContain('matches');
    expect(CLUB_MENU_DEST_IDS).toContain('club');
    expect(canonicalizeClubNav('players')).toBe('players');
    expect(findClubNavItem('plus')?.shortLabel).toBe('Menu');
    expect(findClubNavItem('plus')?.icon).toBe('tune');
  });

  it('expose les labels dock Accueil · Calendrier · Équipes · Menu', () => {
    const labels = CLUB_PRIMARY_NAV_IDS.map((id) => {
      const item = findClubNavItem(id)!;
      return item.shortLabel ?? item.label;
    });
    expect(labels).toEqual(['Accueil', 'Calendrier', 'Équipes', 'Menu']);
  });

  it('conserve plus / outils lors de la sync tab', () => {
    expect(resolveClubNavOnTabSync('plus', 'home')).toBe('plus');
    expect(resolveClubNavOnTabSync('players', 'home')).toBe('players');
    expect(resolveClubNavOnTabSync('matches', 'home')).toBe('today');
    expect(resolveClubNavOnTabSync('matches', 'matchs')).toBe('matches');
  });

  it('conserve Pack Club lors du sync profil (évite Accueil)', () => {
    expect(tabFromClubNav('pack')).toBe('profil');
    expect(resolveClubNavOnTabSync('pack', 'profil')).toBe('pack');
    expect(resolveClubNavOnTabSync('plus', 'profil', 'pack')).toBe('pack');
    expect(resolveClubNavOnTabSync('plus', 'profil')).toBe('club');
  });

  it('mappe openDashboard club vers une pane (pas Accueil)', () => {
    expect(clubNavFromDashboard('gestion')).toBe('players');
    expect(clubNavFromDashboard('sponsors')).toBe('sponsoring');
    expect(clubNavFromDashboard('smart_tactics')).toBe('matches');
    expect(clubNavFromDashboard('train')).toBeNull();
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
    expect(findClubNavItem('assistant')?.aiBadge).toBe(true);
    expect(findClubNavItem('players')?.label).toBe('Joueurs');
  });
});

describe('resolveClubNavAccess', () => {
  const allOn = (k: string) => true;

  it('Amateur : événements et sponsoring verrouillés, calendrier ouvert', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_amateur',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'calendar')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'sponsoring')?.locked).toBe(true);
    expect(items.find((i) => i.id === 'assistant')?.locked).toBe(false);
  });

  it('Essentiel : événements et sponsoring ouverts', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_essentiel',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'sponsoring')?.locked).toBe(false);
  });

  it('Tout inclus : tout ouvert', () => {
    const folders = resolveClubNavFolders({
      offerId: 'club_premium',
      isFeatureEnabled: allOn,
    });
    const items = folders.flatMap((f) => f.items);
    expect(items.find((i) => i.id === 'events')?.locked).toBe(false);
    expect(items.find((i) => i.id === 'sponsoring')?.locked).toBe(false);
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

  it('barre mobile expose 4 onglets primaires', () => {
    const primary = resolveClubPrimaryNav({
      offerId: 'club_premium',
      isFeatureEnabled: allOn,
    });
    expect(primary.map((i) => i.id)).toEqual(['today', 'calendar', 'teams', 'plus']);
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
    // Aucun raccourci répété : le Menu ne redonne pas les destinations du dock.
    for (const dockId of CLUB_PRIMARY_NAV_IDS) {
      expect(allIds).not.toContain(dockId);
    }
    // Les modules sortis du dock restent joignables par le Menu.
    expect(allIds).toContain('matches');
    expect(allIds).toContain('club');
    const menu = resolveClubMenuItems({
      offerId: 'club_premium',
      isFeatureEnabled: allOn,
    });
    expect(menu.map((i) => i.id)).toContain('players');
    expect(menu.map((i) => i.id)).toContain('assistant');
    expect(menu.map((i) => i.id)).toContain('notifications');
    expect(menu.map((i) => i.id)).toContain('matches');
    expect(menu.map((i) => i.id)).toContain('club');
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

describe('Menu Club — une seule entrée par destination', () => {
  const menuSource = readFileSync(
    path.join(__dirname, '..', 'features/club/shell/ClubMenuPane.tsx'),
    'utf8',
  );

  it('n’expose pas « Rôles & Permissions » deux fois dans le même panneau', () => {
    // Le pôle Club listait cette destination à la fois comme ligne de menu et comme
    // lien du groupe Compte, sous deux libellés différents pour la même page.
    const labels = menuSource.match(/label: 'Rôles & Permissions'/g) ?? [];
    expect(labels).toHaveLength(1);
    // Une seule ligne de menu porte cette destination (rendu générique par `id`).
    const rows = menuSource.match(/id: 'permissions'/g) ?? [];
    expect(rows).toHaveLength(1);
    // Les liens du groupe Compte ne la dupliquent plus.
    expect(menuSource).not.toContain("key: 'permissions'");
    expect(menuSource).not.toContain("label: 'Profil club'");
  });
});
