import type { IconName } from '../../../components/ui/iconNames';
import type { CoachPortalChapterId } from '../../../content/coachPortalChapters';
import type { MainTabId } from '../../../navigation/mainTabConfig';

/**
 * Navigation Pôle Coach — 8 onglets type SportEasy.
 * ACCUEIL | ÉQUIPE | MATCHS | ENTRAÎNEMENTS | JOUEURS | IA | MESSAGES | PROFIL
 */

export type CoachNavFolderId =
  | 'accueil'
  | 'equipe'
  | 'match'
  | 'entrainements'
  | 'joueurs'
  | 'ia'
  | 'messagerie'
  | 'profil';

export type CoachNavItemId =
  | 'today'
  | 'equipe'
  | 'effectif'
  | 'gestion'
  | 'planning'
  | 'entrainements'
  | 'matchs'
  | 'match_center'
  | 'joueurs'
  | 'smart_tactics'
  | 'coach_ia'
  | 'mes_videos'
  | 'forme'
  | 'messages'
  | 'com_staff'
  | 'carpool'
  | 'profil'
  | 'plus'
  | 'pitch';

export type CoachNavItem = {
  id: CoachNavItemId;
  label: string;
  icon: IconName;
  hint?: string;
  chapter?: CoachPortalChapterId;
  tab?: MainTabId;
  /** Soft-lock si pas d’accès Smart Tactics. */
  requiresSmartTactics?: boolean;
  /** Soft-lock si flag admin `coach_video` OFF. */
  requiresVideo?: boolean;
  lockMode?: 'soft' | 'hide';
  aiBadge?: boolean;
  /** Label court pour barre mobile 8 onglets. */
  shortLabel?: string;
};

export type CoachNavFolder = {
  id: CoachNavFolderId;
  label: string;
  items: CoachNavItem[];
};

export const COACH_PRIMARY_NAV_IDS: CoachNavItemId[] = [
  'today',
  'equipe',
  'match_center',
  'entrainements',
  'joueurs',
  'coach_ia',
  'messages',
  'profil',
];

/** Outils secondaires — plus dans la barre, accessibles depuis sections pertinentes. */
export const COACH_SECONDARY_NAV_IDS: CoachNavItemId[] = [
  'smart_tactics',
  'mes_videos',
  'forme',
  'carpool',
  'com_staff',
  'gestion',
  'plus',
];

/** @deprecated Utiliser COACH_SECONDARY_NAV_IDS — conservé pour compat tests/outils. */
export const COACH_MORE_NAV_IDS: CoachNavItemId[] = [
  'smart_tactics',
  'mes_videos',
  'forme',
  'carpool',
  'com_staff',
  'gestion',
  'planning',
];

const accueilItem: CoachNavItem = {
  id: 'today',
  label: 'Accueil',
  shortLabel: 'Accueil',
  hint: 'Briefing · calendrier du jour',
  icon: 'home',
  chapter: 'cockpit',
};

const equipeItem: CoachNavItem = {
  id: 'equipe',
  label: 'Équipe',
  shortLabel: 'Équipe',
  hint: 'Compo · terrain · gestion',
  icon: 'football',
  chapter: 'effectif',
};

const matchCenterItem: CoachNavItem = {
  id: 'match_center',
  label: 'Matchs',
  shortLabel: 'Matchs',
  hint: 'Live · convocs · stats',
  icon: 'trophy',
  chapter: 'matchs',
  tab: 'matchs',
};

const entrainementsItem: CoachNavItem = {
  id: 'entrainements',
  label: 'Entraînements',
  shortLabel: 'Séances',
  hint: 'Planning · séances',
  icon: 'calendar',
  chapter: 'planning',
};

const joueursItem: CoachNavItem = {
  id: 'joueurs',
  label: 'Joueurs',
  shortLabel: 'Joueurs',
  hint: 'Liste · notes · analyse IA',
  icon: 'people',
  chapter: 'effectif',
};

const coachIaItem: CoachNavItem = {
  id: 'coach_ia',
  label: 'IA',
  shortLabel: 'IA',
  hint: 'Analyse · stratégie · actions',
  icon: 'star-four-points',
  aiBadge: true,
};

const messagesItem: CoachNavItem = {
  id: 'messages',
  label: 'Messages',
  shortLabel: 'Messages',
  hint: 'Staff & parents',
  icon: 'chat',
  tab: 'messages',
};

const profilItem: CoachNavItem = {
  id: 'profil',
  label: 'Profil',
  shortLabel: 'Profil',
  hint: 'Diplômes & vitrine',
  icon: 'person',
  tab: 'profil',
};

const plusItem: CoachNavItem = {
  id: 'plus',
  label: 'Outils',
  hint: 'Tactique, vidéos, covoiturage…',
  icon: 'hamburger',
};

const planningItem: CoachNavItem = {
  id: 'planning',
  label: 'Agenda',
  hint: 'Séances & calendrier',
  icon: 'calendar',
  chapter: 'planning',
};

export const COACH_NAV_CATALOG: CoachNavItem[] = [
  accueilItem,
  equipeItem,
  matchCenterItem,
  entrainementsItem,
  joueursItem,
  coachIaItem,
  messagesItem,
  profilItem,
  plusItem,
  planningItem,
  {
    id: 'effectif',
    label: 'Équipe',
    hint: 'Alias effectif → équipe',
    icon: 'football',
    chapter: 'effectif',
  },
  {
    id: 'pitch',
    label: 'Accueil',
    hint: 'Raccourcis (ex-Terrain)',
    icon: 'home',
    chapter: 'cockpit',
  },
  {
    id: 'matchs',
    label: 'Matchs',
    hint: 'Hub match unique',
    icon: 'trophy',
    chapter: 'matchs',
    tab: 'matchs',
  },
  {
    id: 'gestion',
    label: 'Gestion',
    hint: 'Équipe & licences',
    icon: 'settings',
  },
  {
    id: 'smart_tactics',
    label: 'Tactique IA',
    hint: 'Match · compo · effectif',
    icon: 'star-four-points',
    requiresSmartTactics: true,
    aiBadge: true,
  },
  {
    id: 'mes_videos',
    label: 'Mes vidéos',
    hint: 'Captation · IA · causerie',
    icon: 'videocam',
    requiresVideo: true,
    aiBadge: true,
  },
  {
    id: 'forme',
    label: 'Analyse de forme',
    hint: 'Charge · evals · objectifs',
    icon: 'heart',
    chapter: 'performance',
  },
  {
    id: 'com_staff',
    label: 'Parents & alertes',
    hint: 'Notifs · docs · annonces',
    icon: 'mail',
    chapter: 'communication',
  },
  {
    id: 'carpool',
    label: 'Covoiturage',
    hint: 'Déplacements équipe',
    icon: 'car',
    tab: 'covoiturage',
  },
];

/** 8 onglets primaires — sidebar + barre mobile. */
export const COACH_NAV_FOLDERS: CoachNavFolder[] = [
  { id: 'accueil', label: 'Accueil', items: [accueilItem] },
  { id: 'equipe', label: 'Équipe', items: [equipeItem] },
  { id: 'match', label: 'Matchs', items: [matchCenterItem] },
  { id: 'entrainements', label: 'Entraînements', items: [entrainementsItem] },
  { id: 'joueurs', label: 'Joueurs', items: [joueursItem] },
  { id: 'ia', label: 'IA', items: [coachIaItem] },
  { id: 'messagerie', label: 'Messages', items: [messagesItem] },
  { id: 'profil', label: 'Profil', items: [profilItem] },
];

/** Raccourcis depuis l’accueil cockpit vers outils secondaires. */
export const COACH_HOME_TOOLS: {
  id: CoachNavItemId;
  label: string;
  icon: IconName;
}[] = [
  { id: 'smart_tactics', label: 'Tactique IA', icon: 'star-four-points' },
  { id: 'mes_videos', label: 'Vidéos', icon: 'videocam' },
  { id: 'forme', label: 'Forme', icon: 'heart' },
  { id: 'carpool', label: 'Covoiturage', icon: 'car' },
  { id: 'com_staff', label: 'Parents', icon: 'mail' },
  { id: 'gestion', label: 'Gestion', icon: 'settings' },
];

/** Deep links d’anciennes pages → onglet parent. */
export function canonicalizeCoachNav(id: CoachNavItemId): CoachNavItemId {
  if (id === 'pitch') return 'today';
  if (id === 'effectif') return 'equipe';
  if (id === 'planning') return 'entrainements';
  if (id === 'matchs') return 'match_center';
  return id;
}

/** Onglet de barre à allumer pour un dest (y compris outils secondaires). */
export function primaryTabForCoachNav(id: CoachNavItemId): CoachNavItemId {
  const canonical = canonicalizeCoachNav(id);
  if (COACH_PRIMARY_NAV_IDS.includes(canonical)) return canonical;
  if (canonical === 'gestion') return 'equipe';
  if (COACH_SECONDARY_NAV_IDS.includes(canonical)) {
    if (canonical === 'smart_tactics' || canonical === 'mes_videos' || canonical === 'forme') {
      return 'coach_ia';
    }
    if (canonical === 'carpool' || canonical === 'com_staff') return 'match_center';
    if (canonical === 'plus') return 'today';
  }
  return 'today';
}

export function findCoachNavItem(id: CoachNavItemId): CoachNavItem | undefined {
  const canonical = canonicalizeCoachNav(id);
  return COACH_NAV_CATALOG.find((item) => item.id === canonical || item.id === id);
}

export function tabFromCoachNav(id: CoachNavItemId): MainTabId {
  const item = findCoachNavItem(canonicalizeCoachNav(id));
  if (item?.tab) return item.tab;
  return 'home';
}

export function coachNavFromTab(tab: MainTabId): CoachNavItemId {
  if (tab === 'matchs') return 'match_center';
  if (tab === 'messages') return 'messages';
  if (tab === 'covoiturage') return 'carpool';
  if (tab === 'profil') return 'profil';
  if (tab === 'feed') return 'smart_tactics';
  return 'today';
}
