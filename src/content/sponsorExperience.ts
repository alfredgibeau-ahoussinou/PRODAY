import type { IconName } from '../components/ui/Icon';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { UserRole } from '../models/User';
import { proColorOverrides } from '../theme/universeTheme';
import { colors as baseColors } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';

/**
 * Espace partenaire — sombre (site Pro : blue-950 → slate-950) + bleu #1D4ED8 + or.
 */
export const SPONSOR_THEME = {
  primary: proColorOverrides.bluePrimary,
  primaryHover: proColorOverrides.accentLight,
  primaryDark: proColorOverrides.brand,
  primaryDeeper: '#172554',
  heroBg: '#172554',
  heroBgEnd: '#020617',
  background: '#020617',
  surface: '#0F172A',
  surfaceMuted: '#1E293B',
  surfaceElevated: '#172554',
  border: 'rgba(30, 58, 138, 0.5)',
  borderSubtle: 'rgba(148, 163, 184, 0.12)',
  primarySoft: 'rgba(29, 78, 216, 0.22)',
  primaryBg: '#020617',
  primaryBorder: 'rgba(59, 130, 246, 0.28)',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  gold: '#F59E0B',
  goldLight: '#FDE68A',
  goldMuted: '#FBBF24',
  goldInk: '#78350F',
  goldSurface: 'rgba(245, 158, 11, 0.12)',
  onPrimary: '#FFFFFF',
  heroText: '#FFFFFF',
  heroSubtext: proColorOverrides.inkFaint,
  ink: '#E2E8F0',
  sectionLabel: '#64748B',
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
