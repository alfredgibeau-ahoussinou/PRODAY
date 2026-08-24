import type { IconName } from '../components/ui/iconNames';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { UserRole } from '../models/User';
import { colors as baseColors } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { PRODAY_POLE_ACCENTS, poleAccentSoft } from '../theme/prodayBrand';

/**
 * Espace Sponsor — noir premium, accent violet planche (#92278F).
 * Source de vérité visuelle pour shell, discover et écrans métier.
 */
export const SPONSOR_THEME = {
  primary: PRODAY_POLE_ACCENTS.sponsor,
  primaryHover: '#A83AA3',
  primaryDark: '#6B1A68',
  primaryDeeper: '#000000',
  heroBg: '#000000',
  heroBgEnd: '#000000',
  background: '#000000',
  surface: '#0A0A0A',
  surfaceMuted: '#121212',
  surfaceElevated: '#161616',
  border: poleAccentSoft('sponsor', 0.28),
  borderSubtle: 'rgba(255,255,255,0.08)',
  primarySoft: poleAccentSoft('sponsor', 0.14),
  primaryBg: '#000000',
  primaryBorder: poleAccentSoft('sponsor', 0.36),
  text: '#FAFAF9',
  textSecondary: 'rgba(250,250,249,0.72)',
  textMuted: 'rgba(250,250,249,0.48)',
  /** Alias accent (historique « gold » — toujours violet Sponsor). */
  gold: PRODAY_POLE_ACCENTS.sponsor,
  goldLight: '#C45FBF',
  goldMuted: '#6B1A68',
  goldInk: '#FFFFFF',
  goldSurface: poleAccentSoft('sponsor', 0.14),
  onPrimary: '#FFFFFF',
  heroText: '#FAFAF9',
  heroSubtext: 'rgba(250, 250, 249, 0.58)',
  ink: '#E7E5E4',
  sectionLabel: 'rgba(250,250,249,0.38)',
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
