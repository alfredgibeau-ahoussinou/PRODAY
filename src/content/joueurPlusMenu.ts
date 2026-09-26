import type { MainTabId } from '../navigation/mainTabConfig';
import type { IconName } from '../components/ui/iconNames';
import type { DashboardDeepLink } from '../utils/navigationDeepLink';
import type { JoueurAgeGroup } from '../utils/joueurExperienceTheme';
import type { PlatformFeatureFlags } from '../models/PlatformConfig';
import {
  featureFlagForTab,
  isPlatformFeatureEnabled,
  type PlatformFeatureFlagKey,
} from './platformFeatureFlags';
import { getJoueurGameTabLabel } from './joueurGameMenu';

export type JoueurPlusMenuAction =
  | { kind: 'tab'; tab: MainTabId }
  | { kind: 'dashboard'; view: DashboardDeepLink }
  | { kind: 'modal'; modal: 'journal' | 'extra_sessions' | 'equipment' | 'appointment' | 'cv_pdf' }
  | { kind: 'shop' };

export type JoueurPlusMenuItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: IconName;
  action: JoueurPlusMenuAction;
  badge?: number;
  visible?: boolean;
  /** Module beta non ouvert — alerte au tap, pas de navigation. */
  unavailable?: boolean;
};

/** Feature flags admin liés aux tuiles hub Plus (id menu → flag). */
/** Club / Équipe (recrutement) n’est pas le Mercato — jamais gated par `mercato`. */
export const PLUS_MENU_FEATURE_FLAG: Partial<Record<string, PlatformFeatureFlagKey>> = {
  reels: 'community_reels',
  shop: 'shop',
};

export function plusMenuFeatureFlag(itemId: string): PlatformFeatureFlagKey | null {
  return PLUS_MENU_FEATURE_FLAG[itemId] ?? null;
}

export function isJoueurUnavailableTab(
  tab: MainTabId,
  flags: PlatformFeatureFlags,
): boolean {
  const key = featureFlagForTab(tab);
  if (!key) return false;
  return !isPlatformFeatureEnabled(flags, key);
}

type BuildPlusMenuOptions = {
  ageGroup?: JoueurAgeGroup | null;
  visibleTabs: MainTabId[];
  unreadCount?: number;
  isMinor?: boolean;
  isFeatureEnabled?: (key: PlatformFeatureFlagKey) => boolean;
};

/** Items hub Plus — filtrés selon onglets visibles du pôle. */
export function buildJoueurPlusMenuItems({
  ageGroup,
  visibleTabs,
  unreadCount = 0,
  isMinor = false,
  isFeatureEnabled,
}: BuildPlusMenuOptions): JoueurPlusMenuItem[] {
  const has = (tab: MainTabId) => visibleTabs.includes(tab);
  const unavailable = (itemId: string) => {
    const flagKey = PLUS_MENU_FEATURE_FLAG[itemId];
    if (!flagKey || !isFeatureEnabled) return false;
    return !isFeatureEnabled(flagKey);
  };

  const items: JoueurPlusMenuItem[] = [
    {
      id: 'messages',
      label: getJoueurGameTabLabel('messages', ageGroup),
      subtitle: 'Chat équipe & convocations',
      icon: 'chat',
      action: { kind: 'tab', tab: 'messages' },
      visible: has('messages'),
      badge: unreadCount,
    },
    {
      id: 'covoiturage',
      label: 'Covoiturage',
      subtitle: 'Trajets équipe & matchs',
      icon: 'car',
      action: { kind: 'tab', tab: 'covoiturage' },
      visible: has('covoiturage'),
      unavailable: unavailable('covoiturage'),
    },
    {
      id: 'recrutement',
      label: getJoueurGameTabLabel('recrutement', ageGroup),
      subtitle: 'Club, groupe & mercato',
      icon: 'people',
      action: { kind: 'tab', tab: 'recrutement' },
      visible: has('recrutement'),
      unavailable: unavailable('recrutement'),
    },
    {
      id: 'reels',
      label: getJoueurGameTabLabel('reels', ageGroup),
      subtitle: 'Clips & résumés vidéo',
      icon: 'videocam',
      action: { kind: 'tab', tab: 'reels' },
      visible: has('reels'),
      unavailable: unavailable('reels'),
    },
    {
      id: 'shop',
      label: getJoueurGameTabLabel('shop', ageGroup),
      subtitle: 'Équipement ProDay',
      icon: 'bag',
      action: { kind: 'shop' },
      visible: has('shop'),
      unavailable: unavailable('shop'),
    },
    {
      id: 'famille',
      label: getJoueurGameTabLabel('famille', ageGroup),
      subtitle: 'Espace parent & consentements',
      icon: 'shield' as IconName,
      action: { kind: 'tab', tab: 'famille' },
      visible: isMinor && has('famille'),
    },
    {
      id: 'progression',
      label: 'Ma Saison',
      subtitle: 'Matchs, feuilles de match & progression',
      icon: 'stats-chart' as IconName,
      action: { kind: 'tab', tab: 'progression' },
      visible: has('progression'),
    },
    {
      id: 'settings',
      label: 'Mon compte',
      subtitle: 'Paramètres & préférences',
      icon: 'settings',
      action: { kind: 'tab', tab: 'profil' },
      visible: has('profil'),
    },
    {
      id: 'coach_ia',
      label: 'Mon Coach IA',
      subtitle: 'Conseils personnalisés',
      icon: 'star-four-points',
      action: { kind: 'dashboard', view: 'tactics_coach' },
      visible: true,
    },
    {
      id: 'journal',
      label: 'Mon Journal',
      subtitle: 'Notes privées & ressentis',
      icon: 'bookmark',
      action: { kind: 'modal', modal: 'journal' },
      visible: true,
    },
    {
      id: 'extra_sessions',
      label: 'Séances Extra',
      subtitle: 'Entraînements coéquipiers',
      icon: 'football',
      action: { kind: 'modal', modal: 'extra_sessions' },
      visible: true,
    },
    {
      id: 'equipment',
      label: 'Mes Équipements',
      subtitle: 'Dotations & équipements club',
      icon: 'shirt',
      action: { kind: 'modal', modal: 'equipment' },
      visible: true,
    },
    {
      id: 'appointment',
      label: 'Rendez-vous Coach',
      subtitle: 'Disponibilités & débriefs 1-à-1',
      icon: 'calendar',
      action: { kind: 'modal', modal: 'appointment' },
      visible: true,
    },
    {
      id: 'cv_pdf',
      label: 'CV Sportif',
      subtitle: 'Export PDF & profil vérifié',
      icon: 'document',
      action: { kind: 'modal', modal: 'cv_pdf' },
      visible: true,
    },
  ];

  return items.filter((item) => item.visible !== false);
}
