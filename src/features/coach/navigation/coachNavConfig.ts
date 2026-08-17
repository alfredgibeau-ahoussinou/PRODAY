import type { IconName } from '../../../components/ui/iconNames';
import type { CoachPortalChapterId } from '../../../content/coachPortalChapters';
import type { MainTabId } from '../../../navigation/mainTabConfig';

/**
 * Navigation Pôle Coach — 5 onglets type SportEasy.
 * Agenda / planning vit dans Calendrier (+) et Autres, pas dans la barre.
 */

export type CoachNavFolderId = 'accueil' | 'messagerie' | 'equipe' | 'match' | 'plus';

export type CoachNavItemId =
  | 'today'
  | 'pitch'
  | 'effectif'
  | 'gestion'
  | 'planning'
  | 'matchs'
  | 'match_center'
  | 'smart_tactics'
  | 'coach_ia'
  | 'mes_videos'
  | 'forme'
  | 'messages'
  | 'com_staff'
  | 'carpool'
  | 'profil'
  | 'plus';

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
};

export type CoachNavFolder = {
  id: CoachNavFolderId;
  label: string;
  items: CoachNavItem[];
};

export const COACH_PRIMARY_NAV_IDS: CoachNavItemId[] = [
  'today',
  'messages',
  'effectif',
  'match_center',
  'plus',
];

export const COACH_MORE_NAV_IDS: CoachNavItemId[] = [
  'coach_ia',
  'planning',
  'carpool',
  'com_staff',
  'smart_tactics',
  'mes_videos',
  'forme',
  'profil',
];

const todayItem: CoachNavItem = {
  id: 'today',
  label: 'Calendrier',
  hint: 'Séances, matchs, présences',
  icon: 'calendar',
  chapter: 'cockpit',
};

const messagesItem: CoachNavItem = {
  id: 'messages',
  label: 'Messagerie',
  hint: 'Staff & parents',
  icon: 'chat',
  tab: 'messages',
};

const effectifItem: CoachNavItem = {
  id: 'effectif',
  label: 'Membres',
  hint: 'Compo · liste',
  icon: 'people',
  chapter: 'effectif',
};

const matchCenterItem: CoachNavItem = {
  id: 'match_center',
  label: 'Statistiques',
  hint: 'Live · convocs · amicaux',
  icon: 'stats-chart',
  tab: 'matchs',
};

const plusItem: CoachNavItem = {
  id: 'plus',
  label: 'Autres',
  hint: 'Agenda, outils, compte',
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
  todayItem,
  messagesItem,
  effectifItem,
  matchCenterItem,
  plusItem,
  planningItem,
  {
    id: 'pitch',
    label: 'Calendrier',
    hint: 'Raccourcis (ex-Terrain)',
    icon: 'calendar',
    chapter: 'cockpit',
  },
  {
    id: 'matchs',
    label: 'Statistiques',
    hint: 'Hub match unique',
    icon: 'stats-chart',
    tab: 'matchs',
  },
  {
    id: 'gestion',
    label: 'Gestion',
    hint: 'Équipe & licences',
    icon: 'settings',
  },
  {
    id: 'coach_ia',
    label: 'Assistant IA',
    hint: 'Analyse · stratégie · actions',
    icon: 'star-four-points',
    aiBadge: true,
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
  {
    id: 'profil',
    label: 'Profil coach',
    hint: 'Diplômes & vitrine',
    icon: 'person',
    tab: 'profil',
  },
];

/** 5 onglets primaires — sidebar compacte + barre mobile. */
export const COACH_NAV_FOLDERS: CoachNavFolder[] = [
  { id: 'accueil', label: 'Calendrier', items: [todayItem] },
  { id: 'messagerie', label: 'Messagerie', items: [messagesItem] },
  { id: 'equipe', label: 'Membres', items: [effectifItem] },
  { id: 'match', label: 'Statistiques', items: [matchCenterItem] },
  { id: 'plus', label: 'Autres', items: [plusItem] },
];

/** Outils déplacés vers Autres (plus dans le dump accueil). */
export const COACH_HOME_TOOLS: {
  id: CoachNavItemId;
  label: string;
  icon: IconName;
}[] = [
  { id: 'coach_ia', label: 'Assistant IA', icon: 'star-four-points' },
  { id: 'smart_tactics', label: 'Tactique IA', icon: 'star-four-points' },
  { id: 'mes_videos', label: 'Vidéos', icon: 'videocam' },
  { id: 'forme', label: 'Forme', icon: 'heart' },
  { id: 'carpool', label: 'Covoiturage', icon: 'car' },
  { id: 'com_staff', label: 'Parents', icon: 'mail' },
];

/** Deep links d’anciennes pages → onglet parent. */
export function canonicalizeCoachNav(id: CoachNavItemId): CoachNavItemId {
  if (id === 'pitch') return 'today';
  if (id === 'matchs') return 'match_center';
  return id;
}

/** Onglet de barre à allumer pour un dest (y compris outils Plus). */
export function primaryTabForCoachNav(id: CoachNavItemId): CoachNavItemId {
  const canonical = canonicalizeCoachNav(id);
  if (COACH_PRIMARY_NAV_IDS.includes(canonical)) return canonical;
  if (canonical === 'gestion') return 'effectif';
  return 'plus';
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
