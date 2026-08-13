import type { IconName } from '../../../components/ui/iconNames';
import type { CoachPortalChapterId } from '../../../content/coachPortalChapters';
import type { MainTabId } from '../../../navigation/mainTabConfig';

/**
 * Navigation Pôle Coach — dossiers FOC (aligné Club),
 * Soft-lock Smart Tactics si hors Coach Pro / club Tout inclus.
 */

export type CoachNavFolderId =
  | 'accueil'
  | 'equipe'
  | 'match'
  | 'performance'
  | 'communication'
  | 'compte';

export type CoachNavItemId =
  | 'today'
  | 'pitch'
  | 'effectif'
  | 'gestion'
  | 'planning'
  | 'matchs'
  | 'match_center'
  | 'smart_tactics'
  | 'mes_videos'
  | 'forme'
  | 'messages'
  | 'com_staff'
  | 'carpool'
  | 'profil';

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

export const COACH_NAV_FOLDERS: CoachNavFolder[] = [
  {
    id: 'accueil',
    label: 'Accueil',
    items: [
      {
        id: 'today',
        label: 'Aujourd’hui',
        hint: 'Briefing & priorités',
        icon: 'home',
        chapter: 'cockpit',
      },
      {
        id: 'pitch',
        label: 'Terrain',
        hint: 'Cockpit commandes',
        icon: 'football',
      },
    ],
  },
  {
    id: 'equipe',
    label: 'Équipe',
    items: [
      {
        id: 'effectif',
        label: 'Effectif & stade',
        hint: 'Roster · bourse · terrain',
        icon: 'people',
        chapter: 'effectif',
      },
      {
        id: 'gestion',
        label: 'Gestion',
        hint: 'Équipe & licences',
        icon: 'settings',
      },
    ],
  },
  {
    id: 'match',
    label: 'Match & planning',
    items: [
      {
        id: 'planning',
        label: 'Planning',
        hint: 'Séances & IA entraînement',
        icon: 'calendar',
        chapter: 'planning',
      },
      {
        id: 'matchs',
        label: 'Prochain match',
        hint: 'Causerie · flux match',
        icon: 'football-outline',
        chapter: 'matchs',
      },
      {
        id: 'match_center',
        label: 'Centre Match',
        hint: 'Live · convocs · amicaux',
        icon: 'trophy',
        tab: 'matchs',
      },
      {
        id: 'carpool',
        label: 'Covoiturage',
        hint: 'Déplacements équipe',
        icon: 'car',
        tab: 'covoiturage',
      },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    items: [
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
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    items: [
      {
        id: 'messages',
        label: 'Messages',
        hint: 'Staff & parents',
        icon: 'chat',
        tab: 'messages',
      },
      {
        id: 'com_staff',
        label: 'Parents & alertes',
        hint: 'Notifs · docs · annonces',
        icon: 'mail',
        chapter: 'communication',
      },
    ],
  },
  {
    id: 'compte',
    label: 'Compte',
    items: [
      {
        id: 'profil',
        label: 'Profil coach',
        hint: 'Diplômes & vitrine',
        icon: 'person',
        tab: 'profil',
      },
    ],
  },
];

export function findCoachNavItem(id: CoachNavItemId): CoachNavItem | undefined {
  for (const folder of COACH_NAV_FOLDERS) {
    const hit = folder.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function tabFromCoachNav(id: CoachNavItemId): MainTabId {
  const item = findCoachNavItem(id);
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

/** Zones cockpit terrain → nav coach. */
export const COACH_PITCH_ZONES: {
  id: string;
  label: string;
  title: string;
  nav: CoachNavItemId;
  x: number;
  y: number;
}[] = [
  { id: 'today', label: 'QG', title: 'Aujourd’hui', nav: 'today', x: 0.5, y: 0.18 },
  { id: 'effectif', label: 'Effectif', title: 'Effectif & stade', nav: 'effectif', x: 0.22, y: 0.38 },
  { id: 'planning', label: 'Plan', title: 'Planning', nav: 'planning', x: 0.78, y: 0.38 },
  { id: 'matchs', label: 'Match', title: 'Prochain match', nav: 'matchs', x: 0.5, y: 0.52 },
  { id: 'st', label: 'ST', title: 'Tactique IA', nav: 'smart_tactics', x: 0.22, y: 0.72 },
  { id: 'video', label: 'Vidéo', title: 'Mes vidéos', nav: 'mes_videos', x: 0.5, y: 0.78 },
  { id: 'forme', label: 'Forme', title: 'Analyse de forme', nav: 'forme', x: 0.78, y: 0.72 },
];
