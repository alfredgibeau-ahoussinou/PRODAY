import type { IconName } from '../../../components/ui/iconNames';
import type { ClubOfferFeatureId } from '../../../content/clubOffers';
import type { PlatformFeatureFlagKey } from '../../../content/platformFeatureFlags';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import type { DashboardDeepLink } from '../../../utils/navigationDeepLink';

/**
 * Navigation Pôle Club v1 — gestion amateur simple.
 * Mobile : 5 onglets + FAB « + CRÉER » · Desktop : sidebar complète.
 * Dock : Accueil · Équipes · Matchs · Outils · Club (labels ≥11, actif émeraude).
 */

export type ClubNavFolderId =
  | 'accueil'
  | 'effectifs'
  | 'sport'
  | 'ops'
  | 'club';

export type ClubNavItemId =
  | 'today'
  | 'teams'
  | 'players'
  | 'coaches'
  | 'calendar'
  | 'matches'
  | 'trainings'
  | 'standings'
  | 'communication'
  | 'club'
  | 'plus'
  | 'assistant'
  | 'events'
  | 'licenses'
  | 'finances'
  | 'sponsoring'
  | 'pack'
  | 'notifications'
  | 'permissions'
  | 'stats'
  | 'recruitment'
  | 'video';


export type ClubNavItem = {
  id: ClubNavItemId;
  label: string;
  icon: IconName;
  hint?: string;
  tab?: MainTabId;
  shortLabel?: string;
  requiresAnyFeature?: ClubOfferFeatureId[];
  lockMode?: 'soft' | 'hide';
  platformFlag?: PlatformFeatureFlagKey;
  aiBadge?: boolean;
};

export type ClubNavFolder = {
  id: ClubNavFolderId;
  label: string;
  items: ClubNavItem[];
};

/** Onglets barre mobile (5 max) — le reste via Outils / sidebar. */
export const CLUB_PRIMARY_NAV_IDS: ClubNavItemId[] = [
  'today',
  'teams',
  'matches',
  'plus',
  'club',
];

/** Destinations secondaires — surlignent l’onglet Outils. */
export const CLUB_MENU_DEST_IDS: ClubNavItemId[] = [
  'players',
  'coaches',
  'calendar',
  'trainings',
  'communication',
  'assistant',
  'events',
  'standings',
  'licenses',
  'finances',
  'sponsoring',
  'pack',
  'notifications',
  'permissions',
];

export type ClubCreateActionId =
  | 'match'
  | 'training'
  | 'player'
  | 'coach'
  | 'invite_member'
  | 'event'
  | 'invite_club';

export const CLUB_CREATE_ACTIONS: {
  id: ClubCreateActionId;
  label: string;
  icon: IconName;
  nav?: ClubNavItemId;
}[] = [
  { id: 'match', label: 'Match', icon: 'trophy', nav: 'matches' },
  { id: 'training', label: 'Entraînement', icon: 'football', nav: 'trainings' },
  { id: 'player', label: 'Joueur', icon: 'person', nav: 'players' },
  { id: 'coach', label: 'Coach', icon: 'school', nav: 'coaches' },
  { id: 'invite_member', label: 'Inviter un membre', icon: 'mail', nav: 'players' },
  { id: 'event', label: 'Événement', icon: 'calendar', nav: 'events' },
  { id: 'invite_club', label: 'Invitation autre club', icon: 'handshake', nav: 'matches' },
];

const todayItem: ClubNavItem = {
  id: 'today',
  label: 'Accueil',
  shortLabel: 'Accueil',
  hint: 'Situation du club',
  icon: 'home',
  tab: 'home',
};

const teamsItem: ClubNavItem = {
  id: 'teams',
  label: 'Équipes',
  shortLabel: 'Équipes',
  hint: 'U7 → Seniors',
  icon: 'football',
  tab: 'home',
  requiresAnyFeature: ['licensed_management'],
};

const playersItem: ClubNavItem = {
  id: 'players',
  label: 'Joueurs',
  shortLabel: 'Joueurs',
  hint: 'Effectif & fiches',
  icon: 'people',
  requiresAnyFeature: ['licensed_management'],
};

const coachesItem: ClubNavItem = {
  id: 'coaches',
  label: 'Coach',
  shortLabel: 'Coach',
  hint: 'Staff & affectations',
  icon: 'school',
  requiresAnyFeature: ['licensed_management'],
};

const calendarItem: ClubNavItem = {
  id: 'calendar',
  label: 'Calendrier',
  shortLabel: 'Agenda',
  hint: 'Jour · semaine · mois',
  icon: 'calendar',
  tab: 'matchs',
  requiresAnyFeature: ['calendar'],
};

const matchesItem: ClubNavItem = {
  id: 'matches',
  label: 'Matchs',
  shortLabel: 'Matchs',
  hint: 'Convocs & invitations',
  icon: 'trophy',
  tab: 'matchs',
  requiresAnyFeature: ['calendar'],
};

const trainingsItem: ClubNavItem = {
  id: 'trainings',
  label: 'Entraînements',
  shortLabel: 'Séances',
  hint: 'Présences',
  icon: 'time',
  requiresAnyFeature: ['calendar'],
};

const communicationItem: ClubNavItem = {
  id: 'communication',
  label: 'Communication',
  shortLabel: 'Comm.',
  hint: 'Équipes · coachs · parents',
  icon: 'chat',
  tab: 'messages',
  requiresAnyFeature: ['communication'],
};

const clubItem: ClubNavItem = {
  id: 'club',
  label: 'Club',
  shortLabel: 'Club',
  hint: 'Identité & réglages',
  icon: 'business',
  tab: 'profil',
};

const plusItem: ClubNavItem = {
  id: 'plus',
  label: 'Outils',
  shortLabel: 'Outils',
  hint: 'Pilotage & métiers du club',
  icon: 'tune',
  tab: 'home',
};

const assistantItem: ClubNavItem = {
  id: 'assistant',
  label: 'Copilote Club',
  shortLabel: 'Copilote',
  hint: 'Dialogue IA · confirmation obligatoire',
  icon: 'chat',
  aiBadge: true,
};

const eventsItem: ClubNavItem = {
  id: 'events',
  label: 'Événements',
  shortLabel: 'Events',
  hint: 'Tournois & poules',
  icon: 'flag',
  requiresAnyFeature: ['competitions'],
};

const standingsItem: ClubNavItem = {
  id: 'standings',
  label: 'Classements',
  shortLabel: 'Classement',
  hint: 'Championnat officiel FFF',
  icon: 'trophy',
};

const licensesItem: ClubNavItem = {
  id: 'licenses',
  label: 'Licences',
  shortLabel: 'Docs',
  hint: 'Documents & licences',
  icon: 'document',
  requiresAnyFeature: ['licensed_management'],
};

const financesItem: ClubNavItem = {
  id: 'finances',
  label: 'Finances',
  shortLabel: '€',
  hint: 'Vue simple',
  icon: 'bag',
  requiresAnyFeature: ['full_admin'],
};

const sponsoringItem: ClubNavItem = {
  id: 'sponsoring',
  label: 'Sponsoring',
  shortLabel: 'Sponsors',
  hint: 'Partenaires',
  icon: 'gift',
  requiresAnyFeature: ['full_admin'],
};

const packItem: ClubNavItem = {
  id: 'pack',
  label: 'Pack Club',
  shortLabel: 'Pack',
  hint: 'SUR DEVIS · dès 3 € / adhérent',
  icon: 'star-outline',
};

const notificationsItem: ClubNavItem = {
  id: 'notifications',
  label: 'Notifications',
  shortLabel: 'Notifs',
  hint: 'Centre d’alertes',
  icon: 'notifications',
};

const permissionsItem: ClubNavItem = {
  id: 'permissions',
  label: 'Permissions',
  shortLabel: 'Rôles',
  hint: 'Admin · Dirigeant · DS · Coach',
  icon: 'shield',
};

export const CLUB_NAV_FOLDERS: ClubNavFolder[] = [
  {
    id: 'accueil',
    label: 'Pilotage',
    items: [todayItem, assistantItem, notificationsItem],
  },
  {
    id: 'effectifs',
    label: 'Effectifs',
    items: [teamsItem, playersItem, coachesItem],
  },
  {
    id: 'sport',
    label: 'Sport',
    items: [calendarItem, matchesItem, trainingsItem, eventsItem, standingsItem],
  },

  {
    id: 'ops',
    label: 'Opérations',
    items: [communicationItem],
  },
  {
    id: 'club',
    label: 'Club',
    items: [
      clubItem,
      packItem,
      licensesItem,
      financesItem,
      sponsoringItem,
      permissionsItem,
    ],
  },
];

export const CLUB_NAV_ITEMS: ClubNavItem[] = [
  ...CLUB_NAV_FOLDERS.flatMap((f) => f.items),
  plusItem,
];

/** Groupes Menu mobile — jobs + fréquents en tête. */
export type ClubToolGroup = {
  title: string;
  ids: ClubNavItemId[];
  /** Si false, section toujours ouverte (Fréquents). */
  collapsible?: boolean;
  /** Déplié par défaut (ignoré si collapsible === false). */
  defaultExpanded?: boolean;
};

export const CLUB_TOOL_GROUPS: ClubToolGroup[] = [
  {
    title: 'Fréquents',
    ids: ['calendar', 'players', 'communication', 'finances', 'assistant'],
    collapsible: false,
  },
  {
    title: 'Aujourd’hui',
    ids: ['trainings', 'notifications'],
    collapsible: true,
    defaultExpanded: true,
  },
  {
    title: 'Effectifs',
    ids: ['coaches', 'teams'],
    collapsible: true,
    defaultExpanded: true,
  },
  {
    title: 'Compétition',
    ids: ['matches', 'events', 'standings'],
    collapsible: true,
    defaultExpanded: false,
  },

  {
    title: 'Admin',
    ids: ['pack', 'licenses', 'sponsoring', 'permissions'],
    collapsible: true,
    defaultExpanded: false,
  },
];

export function findClubNavItem(id: ClubNavItemId): ClubNavItem | undefined {
  return CLUB_NAV_ITEMS.find((i) => i.id === id);
}

export function primaryTabForClubNav(id: ClubNavItemId): ClubNavItemId {
  if ((CLUB_PRIMARY_NAV_IDS as string[]).includes(id)) return id;
  if ((CLUB_MENU_DEST_IDS as string[]).includes(id)) return 'plus';
  return 'today';
}

export function canonicalizeClubNav(id: ClubNavItemId): ClubNavItemId {
  return id;
}

export function clubNavFromTab(tab: MainTabId): ClubNavItemId {
  switch (tab) {
    case 'home':
      return 'today';
    case 'recrutement':
      return 'players';
    case 'matchs':
      return 'matches';
    case 'messages':
      return 'communication';
    case 'profil':
      return 'club';
    case 'covoiturage':
      return 'today';
    case 'shop':
      return 'today';
    case 'feed':
      return 'today';
    default:
      return 'today';
  }
}

export function tabFromClubNav(id: ClubNavItemId): MainTabId {
  const item = findClubNavItem(id);
  if (item?.tab) return item.tab;
  if (id === 'calendar' || id === 'matches' || id === 'trainings' || id === 'events') {
    return 'matchs';
  }
  if (id === 'communication') return 'messages';
  if (id === 'club' || id === 'pack') return 'profil';
  return 'home';
}

export function resolveClubNavOnTabSync(
  prev: ClubNavItemId,
  activeTab: MainTabId,
  intended?: ClubNavItemId | null,
): ClubNavItemId {
  if (intended) return canonicalizeClubNav(intended);
  const mapped = clubNavFromTab(activeTab);
  if (tabFromClubNav(prev) === activeTab) return prev;
  return mapped;
}

/** Deep links `openDashboard` → pane Club (ne pas forcer Accueil). */
export function clubNavFromDashboard(view: DashboardDeepLink): ClubNavItemId | null {
  if (view === 'gestion') return 'players';
  if (view === 'sponsors') return 'sponsoring';
  if (view === 'smart_tactics') return 'matches';
  return null;
}
