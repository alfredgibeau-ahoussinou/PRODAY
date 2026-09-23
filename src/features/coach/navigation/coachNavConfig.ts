import type { IconName } from '../../../components/ui/iconNames';
import type { CoachPortalChapterId } from '../../../content/coachPortalChapters';
import type { MainTabId } from '../../../navigation/mainTabConfig';

/**
 * Navigation Pôle Coach — **4 onglets**, conformément au README §0.2 :
 * ACCUEIL | CALENDRIER | ÉQUIPE | MENU.
 *
 * Les destinations secondaires (IA, Copilote, Messagerie, Profil, outils) sont
 * dans l’onglet Menu. Les anciennes destinations « IA » et « Profil » ne sont
 * plus dans la barre basse : elles y occupaient deux créneaux sur cinq, alors
 * que le référentiel impose quatre destinations dont Menu en dernière position.
 */

export type CoachNavFolderId =
  | 'accueil'
  | 'calendrier'
  | 'equipe'
  | 'match'
  | 'entrainements'
  | 'joueurs'
  | 'ia'
  | 'messagerie'
  | 'menu'
  | 'profil';

export type CoachNavItemId =
  | 'today'
  | 'calendrier'
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
  | 'copilot_chat'
  | 'mes_videos'
  | 'forme'
  | 'messages'
  | 'com_staff'
  | 'carpool'
  | 'rsvp_log'
  | 'profil'
  | 'plus'
  | 'pitch'
  | 'coaching_perso';

/** Alias legacy (deep links) — résolus par canonicalizeCoachNav. */
export type CoachNavLegacyId = 'accueil';

export type CoachNavResolvableId = CoachNavItemId | CoachNavLegacyId;

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
  /** Label court pour barre mobile 6 onglets. */
  shortLabel?: string;
};

export type CoachNavFolder = {
  id: CoachNavFolderId;
  label: string;
  items: CoachNavItem[];
};

export const COACH_PRIMARY_NAV_IDS: CoachNavItemId[] = [
  'today',
  'calendrier',
  'equipe',
  'plus',
];

/** Destinations de la barre coach mappées sur l’onglet main `home`. */
export const COACH_HOME_SHELL_NAV_IDS: CoachNavItemId[] = [
  'today',
  'calendrier',
  'equipe',
  'plus',
];

/** Outils secondaires — hors barre, accessibles depuis Accueil, Équipe, IA ou Profil. */
export const COACH_SECONDARY_NAV_IDS: CoachNavItemId[] = [
  'match_center',
  'entrainements',
  'joueurs',
  /**
   * Conversation du Copilote. Ajouté parce que l'écran de chat (`CoachAiHubScreen`)
   * était **importé mais jamais rendu** : `coach_ia` mène au Twin Match Lab, si bien
   * qu'aucune entrée de navigation n'ouvrait la conversation.
   */
  'copilot_chat',
  'mes_videos',
  'forme',
  'carpool',
  'com_staff',
  'gestion',
  /**
   * Historique des relances — traces `rsvp_reminder_log` de l'inbox staff.
   * Accessible depuis l'accueil (entrée dédiée) et le Menu.
   */
  'rsvp_log',
  'coaching_perso',
  /**
   * Sortis de la barre basse lors du passage à 4 onglets (README §0.2).
   * Ils restent des destinations réelles : Menu les liste (Assistant IA,
   * Copilote, Messagerie) et le header ouvre Profil.
   */
  'coach_ia',
  'messages',
  'profil',
];

/** Destinations secondaires — surlignent l’onglet Menu dans la barre. */
export const COACH_MENU_DEST_IDS: CoachNavItemId[] = [
  ...COACH_SECONDARY_NAV_IDS,
  'planning',
];

/** @deprecated Utiliser COACH_MENU_DEST_IDS */
export const COACH_HOME_DEST_IDS: CoachNavItemId[] = COACH_MENU_DEST_IDS;

/** @deprecated Utiliser COACH_SECONDARY_NAV_IDS — conservé pour compat tests/outils. */
export const COACH_MORE_NAV_IDS: CoachNavItemId[] = [
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
  tab: 'home',
};

const calendrierItem: CoachNavItem = {
  id: 'calendrier',
  label: 'Calendrier',
  shortLabel: 'Calendrier',
  hint: 'Événements · convocations · séances',
  icon: 'calendar',
  chapter: 'planning',
  tab: 'home',
};

const equipeItem: CoachNavItem = {
  id: 'equipe',
  label: 'Équipe',
  shortLabel: 'Équipe',
  hint: 'Terrain · effectif · notes joueurs',
  icon: 'football',
  chapter: 'effectif',
  tab: 'home',
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
  label: 'Tactique',
  shortLabel: 'Tactique',
  hint: 'Analyse · stratégie · causerie',
  icon: 'star-four-points',
  aiBadge: false,
  tab: 'home',
};

const copilotChatItem: CoachNavItem = {
  id: 'copilot_chat',
  label: 'Chat Copilote IA',
  shortLabel: 'Copilote',
  hint: 'Questions libres, séances, causerie',
  icon: 'chat',
  aiBadge: true,
  tab: 'home',
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
  label: 'Menu',
  shortLabel: 'Menu',
  hint: 'Matchs, séances, tactique, vidéos…',
  icon: 'hamburger',
  tab: 'home',
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
  calendrierItem,
  equipeItem,
  matchCenterItem,
  entrainementsItem,
  joueursItem,
  coachIaItem,
  copilotChatItem,
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
    label: 'Messagerie',
    hint: 'DM · groupes staff · parents',
    icon: 'chat',
    chapter: 'communication',
  },
  {
    id: 'rsvp_log',
    label: 'Historique des relances',
    hint: 'Relances envoyées aux joueurs',
    icon: 'notifications',
  },
  {
    id: 'carpool',
    label: 'Covoiturage',
    hint: 'Déplacements équipe',
    icon: 'car',
    tab: 'covoiturage',
  },
  {
    id: 'coaching_perso',
    label: 'Coaching perso',
    hint: 'Créneaux à l’heure · tarif joueurs',
    icon: 'time',
  },
];

/** 4 onglets primaires — sidebar + barre mobile (README §0.2). */
export const COACH_NAV_FOLDERS: CoachNavFolder[] = [
  { id: 'accueil', label: 'Accueil', items: [accueilItem] },
  { id: 'calendrier', label: 'Calendrier', items: [calendrierItem] },
  { id: 'equipe', label: 'Équipe', items: [equipeItem] },
  { id: 'menu', label: 'Menu', items: [plusItem] },
];

export type CoachToolGroupId = 'match' | 'club' | 'performance';

export type CoachToolGroup = {
  id: CoachToolGroupId;
  label: string;
  toolIds: CoachNavItemId[];
};

/** Groupes Outils — liste unique dans l’onglet Menu. */
export const COACH_TOOL_GROUPS: CoachToolGroup[] = [
  { id: 'match', label: 'Match', toolIds: ['match_center', 'entrainements'] },
  {
    id: 'club',
    label: 'Club',
    toolIds: ['gestion', 'com_staff', 'carpool', 'coaching_perso'],
  },
  {
    id: 'performance',
    label: 'Performance',
    toolIds: ['mes_videos', 'forme'],
  },
];

/** Libellés courts pour la liste Outils dans Menu. */
export const COACH_HOME_TOOLS: {
  id: CoachNavItemId;
  label: string;
  icon: IconName;
}[] = COACH_TOOL_GROUPS.flatMap((group) =>
  group.toolIds.map((id) => {
    const item = COACH_NAV_CATALOG.find((entry) => entry.id === id);
    return {
      id,
      label:
        id === 'entrainements'
          ? 'Séances'
          : id === 'com_staff'
            ? 'Messagerie'
            : id === 'mes_videos'
              ? 'Vidéos'
              : id === 'coaching_perso'
                ? 'Coaching perso'
                : (item?.label ?? id),
      icon: item?.icon ?? 'settings',
    };
  }),
);

/** Deep links d’anciennes pages → onglet parent. */
export function canonicalizeCoachNav(id: CoachNavResolvableId): CoachNavItemId {
  if (id === 'pitch' || id === 'accueil') return 'today';
  if (id === 'effectif' || id === 'smart_tactics') return 'equipe';
  if (id === 'planning') return 'entrainements';
  if (id === 'matchs') return 'match_center';
  return id;
}

/** Onglet de barre à allumer pour un dest (y compris outils secondaires). */
export function primaryTabForCoachNav(id: CoachNavItemId): CoachNavItemId {
  const canonical = canonicalizeCoachNav(id);
  if (COACH_PRIMARY_NAV_IDS.includes(canonical)) return canonical;
  /** Plus d’onglet « Profil » depuis le passage à 4 destinations : Menu porte l’état actif. */
  if (COACH_MENU_DEST_IDS.includes(canonical)) return 'plus';
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

/**
 * Synchronise navId interne quand le tab main change.
 * Sur `home`, conserve today / equipe / coach_ia / plus (et outils secondaires home).
 */
export function resolveCoachNavOnTabSync(
  prevNavId: CoachNavItemId,
  activeTab: MainTabId,
): CoachNavItemId {
  const canonical = canonicalizeCoachNav(prevNavId);
  const mappedTab = tabFromCoachNav(canonical);
  if (mappedTab !== activeTab) {
    return canonicalizeCoachNav(coachNavFromTab(activeTab));
  }
  if (activeTab === 'home') {
    return canonical;
  }
  return canonical;
}

/**
 * Fallback logique de navigation en cas d'ouverture directe sans historique.
 * - Outils secondaires -> 'today' (Accueil) ou 'plus' (Menu).
 * - Onglets racine -> 'today'.
 */
export function resolveCoachFallbackNav(id: CoachNavItemId): CoachNavItemId {
  const canonical = canonicalizeCoachNav(id);
  switch (canonical) {
    case 'entrainements':
    case 'match_center':
      return 'today';
    case 'forme':
    case 'copilot_chat':
    case 'smart_tactics':
    case 'mes_videos':
    case 'coaching_perso':
    case 'rsvp_log':
    case 'joueurs':
    case 'gestion':
    case 'com_staff':
    case 'carpool':
    case 'coach_ia':
    case 'messages':
    case 'profil':
      return 'plus';
    case 'calendrier':
    case 'equipe':
    case 'plus':
      return 'today';
    default:
      return 'today';
  }
}

/**
 * Fallback logique pour fermeture de fiche événement / match.
 */
export function resolveEventHubFallback(isMatch?: boolean): CoachNavItemId {
  return isMatch ? 'match_center' : 'calendrier';
}
