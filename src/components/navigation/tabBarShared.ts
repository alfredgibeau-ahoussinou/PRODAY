import type { MainTabId } from '../../navigation/mainTabConfig';
import type { ProductLineId } from '../../models/ProductLine';
import { isProProductLine } from '../../models/ProductLine';
import type { UserRole } from '../../models/User';
import type { IconName } from '../ui/Icon';
import {
  getSponsorTabIcon,
  isSponsorRole,
} from '../../content/sponsorExperience';

export const TAB_ICONS: Record<MainTabId, IconName> = {
  home: 'home',
  recrutement: 'search',
  matchs: 'handshake',
  covoiturage: 'car',
  sante: 'heart',
  feed: 'star-four-points',
  progression: 'stats-chart',
  reels: 'videocam',
  famille: 'shield',
  messages: 'chat',
  profil: 'person',
  shop: 'bag',
  plus: 'hamburger',
};

const AMATEUR_TAB_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'shield',
  covoiturage: 'car',
  recrutement: 'people',
  matchs: 'football',
  messages: 'chat',
  profil: 'person',
};

const SUPPORTER_TAB_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'home',
  matchs: 'football',
  /** ProDay ≠ cœur — sparkles / star. */
  feed: 'star-four-points',
  /** Favoris = bookmark, pas heart (évite confusion likes). */
  plus: 'bookmark',
  profil: 'person',
  reels: 'videocam',
  messages: 'chat',
  shop: 'bag',
};

const PRO_PLAYER_TAB_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'briefcase',
  recrutement: 'search',
  reels: 'videocam',
  matchs: 'people',
  profil: 'person',
};

const PRO_CLUB_TAB_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'business',
  recrutement: 'search',
  matchs: 'calendar',
  messages: 'chat',
  profil: 'star',
};

const PRO_STAFF_TAB_ICONS: Partial<Record<MainTabId, IconName>> = {
  home: 'home',
  matchs: 'calendar',
  recrutement: 'search',
  covoiturage: 'car',
  feed: 'star-four-points',
  messages: 'chat',
  profil: 'person',
};

function resolvePoleTabIcon(
  tab: MainTabId,
  productLine: ProductLineId,
  role?: UserRole | null,
): IconName | undefined {
  if (productLine === 'amateur') return AMATEUR_TAB_ICONS[tab];
  if (productLine === 'supporter') return SUPPORTER_TAB_ICONS[tab];
  if (productLine === 'pro_player' || (isProProductLine(productLine) && role === 'player')) {
    return PRO_PLAYER_TAB_ICONS[tab];
  }
  if (productLine === 'pro_club' || (isProProductLine(productLine) && role === 'club')) {
    return PRO_CLUB_TAB_ICONS[tab];
  }
  if (
    productLine === 'pro_staff' ||
    (isProProductLine(productLine) &&
      role &&
      ['coach', 'agent', 'recruiter', 'organizer'].includes(role))
  ) {
    return PRO_STAFF_TAB_ICONS[tab];
  }
  return undefined;
}

export function resolveTabIcon(
  tab: MainTabId,
  role?: UserRole | null,
  productLine?: ProductLineId | null,
): IconName {
  if (isSponsorRole(role)) return getSponsorTabIcon(tab);
  if (productLine) {
    const poleIcon = resolvePoleTabIcon(tab, productLine, role);
    if (poleIcon) return poleIcon;
  }
  return TAB_ICONS[tab];
}

export function formatTabBadge(count: number): string {
  if (count > 99) return '99+';
  if (count > 9) return '9+';
  return String(count);
}

export type TabInkColors = {
  active: string;
  inactive: string;
  activePill: string;
};

export function resolveTabInkColors(
  active: boolean,
  immersive: boolean,
  accent: string,
  textMuted: string,
): TabInkColors {
  if (immersive) {
    return {
      active: '#fff',
      inactive: 'rgba(255,255,255,0.55)',
      activePill: 'rgba(255,255,255,0.2)',
    };
  }
  return {
    active: accent,
    inactive: textMuted,
    activePill: withAlpha(accent, 0.14),
  };
}

/** Convertit un hex (#RGB ou #RRGGBB) en rgba. */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  if (expanded.length !== 6) return `rgba(10, 10, 10, ${alpha})`;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
