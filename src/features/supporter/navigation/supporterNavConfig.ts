import type { MainTabId } from '../../../navigation/mainTabConfig';
import type { IconName } from '../../../components/ui/iconNames';
import type { SupporterPageId } from '../../../content/supporterPageIdentity';

/**
 * Navigation Pôle Supporter — dock Accueil · Matchs · Profil · Plus.
 */

export type SupporterNavFolderId = 'live' | 'communaute' | 'compte';

export type SupporterNavItemId =
  | 'tribune'
  | 'matchs'
  | 'suivis'
  | 'debats'
  | 'moments'
  | 'shop'
  | 'compte';

export type SupporterNavItem = {
  id: SupporterNavItemId;
  label: string;
  hint?: string;
  icon: IconName;
  tab: MainTabId;
  pageId: SupporterPageId;
};

export type SupporterNavFolder = {
  id: SupporterNavFolderId;
  label: string;
  items: SupporterNavItem[];
};

export const SUPPORTER_NAV_FOLDERS: SupporterNavFolder[] = [
  {
    id: 'live',
    label: 'Live',
    items: [
      {
        id: 'tribune',
        label: 'Tribune',
        hint: 'Scores · alertes',
        icon: 'home',
        tab: 'home',
        pageId: 'tribune',
      },
      {
        id: 'matchs',
        label: 'Matchs',
        hint: 'Live · calendrier',
        icon: 'football',
        tab: 'matchs',
        pageId: 'matchs',
      },
      {
        id: 'suivis',
        label: 'Suivis',
        hint: 'Clubs · joueurs',
        icon: 'heart',
        tab: 'feed',
        pageId: 'suivis',
      },
    ],
  },
  {
    id: 'communaute',
    label: 'Communauté',
    items: [
      {
        id: 'debats',
        label: 'Fil',
        hint: 'Question · réponses',
        icon: 'chat',
        tab: 'messages',
        pageId: 'debats',
      },
      {
        id: 'moments',
        label: 'Moments',
        hint: 'Reels',
        icon: 'videocam',
        tab: 'reels',
        pageId: 'moments',
      },
      {
        id: 'shop',
        label: 'Shop',
        hint: 'Merch',
        icon: 'bag',
        tab: 'shop',
        pageId: 'shop',
      },
    ],
  },
  {
    id: 'compte',
    label: 'Compte',
    items: [
      {
        id: 'compte',
        label: 'Compte',
        hint: 'Alertes · profil',
        icon: 'person',
        tab: 'profil',
        pageId: 'compte',
      },
    ],
  },
];

export function findSupporterNavItem(id: SupporterNavItemId): SupporterNavItem | undefined {
  for (const folder of SUPPORTER_NAV_FOLDERS) {
    const hit = folder.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function supporterNavFromTab(tab: MainTabId): SupporterNavItemId {
  for (const folder of SUPPORTER_NAV_FOLDERS) {
    const hit = folder.items.find((i) => i.tab === tab);
    if (hit) return hit.id;
  }
  return 'tribune';
}
