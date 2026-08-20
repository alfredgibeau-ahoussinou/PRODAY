import type { MainTabId } from '../navigation/mainTabConfig';
import type { IconName } from '../components/ui/iconNames';

export type SupporterPlusAction =
  | { kind: 'tab'; tab: MainTabId }
  | { kind: 'live' }
  | { kind: 'map' }
  | { kind: 'suivis' }
  | { kind: 'ia' }
  | { kind: 'shop' };

export type SupporterPlusMenuItem = {
  id: string;
  label: string;
  subtitle: string;
  icon: IconName;
  action: SupporterPlusAction;
  badge?: number;
};

type BuildOptions = {
  unreadCount?: number;
  shopEnabled?: boolean;
};

export function buildSupporterPlusMenuItems({
  unreadCount = 0,
  shopEnabled = true,
}: BuildOptions = {}): SupporterPlusMenuItem[] {
  const items: SupporterPlusMenuItem[] = [
    {
      id: 'live',
      label: 'Live',
      subtitle: 'Scores en direct',
      icon: 'football',
      action: { kind: 'live' },
    },
    {
      id: 'explorer',
      label: 'Explorer',
      subtitle: 'Clubs, ligues, matchs',
      icon: 'search',
      action: { kind: 'tab', tab: 'feed' },
    },
    {
      id: 'videos',
      label: 'Vidéos',
      subtitle: 'Replays & highlights',
      icon: 'videocam',
      action: { kind: 'tab', tab: 'reels' },
    },
    {
      id: 'fil',
      label: 'Fil',
      subtitle: 'Tribune & débats',
      icon: 'chat',
      action: { kind: 'tab', tab: 'messages' },
      badge: unreadCount,
    },
    {
      id: 'carte',
      label: 'Carte',
      subtitle: 'ProDay près de toi',
      icon: 'location',
      action: { kind: 'map' },
    },
    {
      id: 'suivis',
      label: 'Mes clubs',
      subtitle: 'Clubs & joueurs suivis',
      icon: 'heart',
      action: { kind: 'suivis' },
    },
    {
      id: 'ia',
      label: 'IA',
      subtitle: 'Assistant supporter',
      icon: 'star-four-points',
      action: { kind: 'ia' },
    },
  ];

  if (shopEnabled) {
    items.push({
      id: 'shop',
      label: 'Shop',
      subtitle: 'Merch ProDay',
      icon: 'bag',
      action: { kind: 'shop' },
    });
  }

  return items;
}
