import type { MainTabId } from '../navigation/mainTabConfig';
import type { IconName } from '../components/ui/iconNames';
import type { DashboardDeepLink } from '../utils/navigationDeepLink';
import type { JoueurAgeGroup } from '../utils/joueurExperienceTheme';
import { getJoueurGameTabLabel } from './joueurGameMenu';

export type JoueurPlusMenuAction =
  | { kind: 'tab'; tab: MainTabId }
  | { kind: 'dashboard'; view: DashboardDeepLink }
  | { kind: 'shop' };

export type JoueurPlusMenuItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: IconName;
  action: JoueurPlusMenuAction;
  badge?: number;
  visible?: boolean;
};

type BuildPlusMenuOptions = {
  ageGroup?: JoueurAgeGroup | null;
  visibleTabs: MainTabId[];
  unreadCount?: number;
  isMinor?: boolean;
};

/** Items hub Plus — filtrés selon onglets visibles du pôle. */
export function buildJoueurPlusMenuItems({
  ageGroup,
  visibleTabs,
  unreadCount = 0,
  isMinor = false,
}: BuildPlusMenuOptions): JoueurPlusMenuItem[] {
  const has = (tab: MainTabId) => visibleTabs.includes(tab);

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
      id: 'recrutement',
      label: getJoueurGameTabLabel('recrutement', ageGroup),
      subtitle: 'Club, groupe & mercato',
      icon: 'people',
      action: { kind: 'tab', tab: 'recrutement' },
      visible: has('recrutement'),
    },
    {
      id: 'train',
      label: 'Entraînement',
      subtitle: 'Programme & séances',
      icon: 'football',
      action: { kind: 'dashboard', view: 'train' },
      visible: true,
    },
    {
      id: 'reels',
      label: getJoueurGameTabLabel('reels', ageGroup),
      subtitle: 'Clips & highlights',
      icon: 'videocam',
      action: { kind: 'tab', tab: 'reels' },
      visible: has('reels'),
    },
    {
      id: 'covoiturage',
      label: getJoueurGameTabLabel('covoiturage', ageGroup),
      subtitle: 'Trajets match & training',
      icon: 'car',
      action: { kind: 'tab', tab: 'covoiturage' },
      visible: has('covoiturage'),
    },
    {
      id: 'shop',
      label: getJoueurGameTabLabel('shop', ageGroup),
      subtitle: 'Équipement ProDay',
      icon: 'bag',
      action: { kind: 'shop' },
      visible: has('shop'),
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
      label: getJoueurGameTabLabel('progression', ageGroup),
      subtitle: 'XP, niveau & défis',
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
      action: { kind: 'dashboard', view: 'train_ai' },
      visible: true,
    },
  ];

  return items.filter((item) => item.visible !== false);
}
