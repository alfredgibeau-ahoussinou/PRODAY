import type { IconName } from '../components/ui/Icon';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { UserRole } from '../models/User';
import { colors as baseColors } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

/**
 * Espace sponsor — sombre corporate or/noir (aligné site proday75.fr/sponsor).
 */
export const SPONSOR_THEME = {
  primary: '#D4AF37',
  primaryHover: '#F5D76E',
  primaryDark: '#92700C',
  primaryDeeper: '#070605',
  heroBg: '#070605',
  heroBgEnd: '#030303',
  background: '#070605',
  surface: '#0c0a06',
  surfaceMuted: '#14110a',
  surfaceElevated: '#1a1508',
  border: 'rgba(212, 175, 55, 0.22)',
  borderSubtle: 'rgba(212, 175, 55, 0.1)',
  primarySoft: 'rgba(212, 175, 55, 0.12)',
  primaryBg: '#070605',
  primaryBorder: 'rgba(212, 175, 55, 0.28)',
  text: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',
  gold: '#D4AF37',
  goldLight: '#F5D76E',
  goldMuted: '#B8941F',
  goldInk: '#1C1917',
  goldSurface: 'rgba(212, 175, 55, 0.12)',
  onPrimary: '#1C1917',
  heroText: '#FAFAF9',
  heroSubtext: 'rgba(250, 250, 249, 0.65)',
  ink: '#E7E5E4',
  sectionLabel: '#78716C',
  success: '#34D399',
  successSurface: 'rgba(52, 211, 153, 0.12)',
} as const;

/** Couleurs AppColors pour menus profil partenaire sur fond sombre. */
export function getSponsorAppColors(): AppColors {
  return {
    ...baseColors,
    background: SPONSOR_THEME.background,
    backgroundAlt: SPONSOR_THEME.surface,
    surface: SPONSOR_THEME.surface,
    surfaceMuted: SPONSOR_THEME.surfaceMuted,
    border: SPONSOR_THEME.borderSubtle,
    borderMedium: SPONSOR_THEME.border,
    text: SPONSOR_THEME.text,
    textSecondary: SPONSOR_THEME.textSecondary,
    textMuted: SPONSOR_THEME.textMuted,
    accent: SPONSOR_THEME.primary,
    accentSoft: SPONSOR_THEME.primarySoft,
    accentMuted: SPONSOR_THEME.primaryBorder,
    ink: SPONSOR_THEME.text,
    inkSecondary: SPONSOR_THEME.heroSubtext,
    brand: SPONSOR_THEME.primaryDark,
    brandLight: SPONSOR_THEME.primary,
  };
}

export function isSponsorRole(role?: UserRole | null): boolean {
  return role === 'sponsor';
}

export const SPONSOR_MAIN_TABS: MainTabId[] = ['home', 'matchs', 'messages', 'profil'];

export function getSponsorTabLabel(tab: MainTabId): string {
  switch (tab) {
    case 'home':
      return 'Accueil';
    case 'matchs':
      return 'Campagnes';
    case 'messages':
      return 'Réseau';
    case 'profil':
      return 'Marque';
    default:
      return tab;
  }
}

export function getSponsorTabIcon(tab: MainTabId): IconName {
  switch (tab) {
    case 'home':
      return 'home';
    case 'matchs':
      return 'briefcase';
    case 'messages':
      return 'chat';
    case 'profil':
      return 'business';
    default:
      return 'home';
  }
}
