import type { IconName } from '../../../components/ui/iconNames';
import type { ClubOfferFeatureId } from '../../../content/clubOffers';
import type { ClubPortalChapterId } from '../../../content/clubPortalChapters';
import type { PlatformFeatureFlagKey } from '../../../content/platformFeatureFlags';
import type { MainTabId } from '../../../navigation/mainTabConfig';

/**
 * Navigation Pôle Club — dossiers type Finder / Mail macOS,
 * adaptés à la formule (Amateur · Essentiel · Tout inclus · Pro + Veo).
 */

export type ClubNavFolderId =
  | 'accueil'
  | 'organisation'
  | 'sport'
  | 'communication'
  | 'ressources';

export type ClubNavItemId =
  | 'today'
  | 'assistant'
  | 'pitch'
  | 'structure'
  | 'vivier'
  | 'pipeline'
  | 'calendar'
  | 'invites'
  | 'events'
  | 'messages'
  | 'vitrine'
  | 'video'
  | 'offers'
  | 'equipment'
  | 'sponsors'
  | 'carpool'
  | 'shop';

export type ClubCompetitionFocus = 'invites' | 'events' | 'all';
export type ClubOutilsFocus = 'video' | 'offers' | 'equipment' | 'sponsors' | 'all';

export type ClubNavItem = {
  id: ClubNavItemId;
  label: string;
  icon: IconName;
  /** Sous-titre court (sidebar / mobile). */
  hint?: string;
  chapter?: ClubPortalChapterId;
  tab?: MainTabId;
  competitionFocus?: ClubCompetitionFocus;
  outilsFocus?: ClubOutilsFocus;
  /**
   * Au moins une de ces features doit être dans la formule.
   * Absent = accessible à tout compte club connecté.
   */
  requiresAnyFeature?: ClubOfferFeatureId[];
  /**
   * soft = visible avec cadenas + upsell · hide = retiré du menu.
   * Défaut soft si requiresAnyFeature.
   */
  lockMode?: 'soft' | 'hide';
  /** Flag plateforme (ex. shop, mercato). */
  platformFlag?: PlatformFeatureFlagKey;
  /** Badge « IA » dans le menu. */
  aiBadge?: boolean;
};

export type ClubNavFolder = {
  id: ClubNavFolderId;
  label: string;
  items: ClubNavItem[];
};

export const CLUB_NAV_FOLDERS: ClubNavFolder[] = [
  {
    id: 'accueil',
    label: 'Accueil',
    items: [
      {
        id: 'today',
        label: 'Aujourd’hui',
        hint: 'Briefing & priorités',
        icon: 'home',
        chapter: 'aujourdhui',
      },
      {
        id: 'assistant',
        label: 'Assistant IA',
        hint: 'Chat live Mistral',
        icon: 'star-four-points',
        aiBadge: true,
      },
      {
        id: 'pitch',
        label: 'Terrain',
        hint: 'Cockpit 6 commandes',
        icon: 'football',
      },
    ],
  },
  {
    id: 'organisation',
    label: 'Organisation',
    items: [
      {
        id: 'structure',
        label: 'Structure',
        hint: 'Équipes & adhésions',
        icon: 'people',
        chapter: 'structure',
        requiresAnyFeature: ['licensed_management'],
      },
      {
        id: 'vivier',
        label: 'Vivier / Bourse',
        hint: 'Interne avant Mercato',
        icon: 'football-outline',
        chapter: 'vivier',
        requiresAnyFeature: ['licensed_management'],
      },
      {
        id: 'pipeline',
        label: 'Pipeline recrutement',
        hint: 'Observé → Intégré',
        icon: 'briefcase',
        tab: 'recrutement',
        requiresAnyFeature: ['licensed_management'],
        platformFlag: 'mercato',
        lockMode: 'hide',
      },
    ],
  },
  {
    id: 'sport',
    label: 'Sport',
    items: [
      {
        id: 'calendar',
        label: 'Calendrier',
        hint: 'Matchs & convocations',
        icon: 'calendar',
        tab: 'matchs',
        requiresAnyFeature: ['calendar'],
      },
      {
        id: 'invites',
        label: 'Invitations',
        hint: 'Matchs club ↔ club',
        icon: 'handshake',
        chapter: 'competition',
        competitionFocus: 'invites',
        requiresAnyFeature: ['calendar'],
      },
      {
        id: 'events',
        label: 'Tournois & Live',
        hint: 'Poules, QR, live',
        icon: 'trophy',
        chapter: 'competition',
        competitionFocus: 'events',
        requiresAnyFeature: ['competitions'],
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
        hint: 'Staff & effectif',
        icon: 'chat',
        tab: 'messages',
        requiresAnyFeature: ['communication'],
      },
      {
        id: 'vitrine',
        label: 'Vitrine',
        hint: 'Image publique',
        icon: 'image',
        tab: 'profil',
      },
    ],
  },
  {
    id: 'ressources',
    label: 'Ressources',
    items: [
      {
        id: 'offers',
        label: 'Offres & formule',
        hint: 'Amateur → Pro + Veo',
        icon: 'star-outline',
        chapter: 'outils',
        outilsFocus: 'offers',
      },
      {
        id: 'carpool',
        label: 'Covoiturage',
        hint: 'Matchs & déplacements',
        icon: 'car',
        tab: 'covoiturage',
        requiresAnyFeature: ['carpool'],
      },
      {
        id: 'equipment',
        label: 'Équipements',
        hint: 'Marketplace membres',
        icon: 'shirt',
        chapter: 'outils',
        outilsFocus: 'equipment',
        requiresAnyFeature: ['licensed_management'],
      },
      {
        id: 'sponsors',
        label: 'Sponsors',
        hint: 'Micro-sponsoring',
        icon: 'business',
        chapter: 'outils',
        outilsFocus: 'sponsors',
        requiresAnyFeature: ['full_admin'],
      },
      {
        id: 'video',
        label: 'Vidéo & caméras',
        hint: 'BYO ou Pro + Veo',
        icon: 'videocam',
        chapter: 'outils',
        outilsFocus: 'video',
        requiresAnyFeature: ['video_analysis', 'byo_video', 'hardware_kit'],
      },
      {
        id: 'shop',
        label: 'Boutique',
        hint: 'Shop ProDay',
        icon: 'bag',
        tab: 'shop',
        platformFlag: 'shop',
        lockMode: 'hide',
      },
    ],
  },
];

export const CLUB_NAV_ITEMS: ClubNavItem[] = CLUB_NAV_FOLDERS.flatMap((f) => f.items);

export function findClubNavItem(id: ClubNavItemId): ClubNavItem | undefined {
  return CLUB_NAV_ITEMS.find((i) => i.id === id);
}

/** Mappe un onglet mobile legacy vers un item sidebar Club. */
export function clubNavFromTab(tab: MainTabId): ClubNavItemId {
  switch (tab) {
    case 'home':
      return 'today';
    case 'recrutement':
      return 'pipeline';
    case 'matchs':
      return 'calendar';
    case 'messages':
      return 'messages';
    case 'profil':
      return 'vitrine';
    case 'covoiturage':
      return 'carpool';
    case 'shop':
      return 'shop';
    case 'feed':
      return 'today';
    default:
      return 'today';
  }
}

export function tabFromClubNav(id: ClubNavItemId): MainTabId {
  const item = findClubNavItem(id);
  if (item?.tab) return item.tab;
  if (id === 'calendar' || id === 'invites' || id === 'events') return 'matchs';
  if (id === 'pipeline') return 'recrutement';
  if (id === 'messages') return 'messages';
  if (id === 'vitrine') return 'profil';
  if (id === 'carpool') return 'covoiturage';
  if (id === 'shop') return 'shop';
  return 'home';
}
