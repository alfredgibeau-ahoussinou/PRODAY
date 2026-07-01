import type { MainTabId } from '../../navigation/mainTabConfig';
import type { UserRole } from '../../models/User';
import type { IconName } from '../ui/Icon';
import {
  getPhysioTabIcon,
  isMedicalPractitionerRole,
} from '../../content/medicalExperience';
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
  reels: 'videocam',
  famille: 'shield',
  messages: 'chat',
  profil: 'person',
  shop: 'bag',
};

export function resolveTabIcon(
  tab: MainTabId,
  role?: UserRole | null,
): IconName {
  if (isMedicalPractitionerRole(role)) return getPhysioTabIcon(tab);
  if (isSponsorRole(role)) return getSponsorTabIcon(tab);
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
