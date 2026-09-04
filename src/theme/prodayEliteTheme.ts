/**
 * ProDay Elite Design System — Standard Visuel Unifié (Style MyCoach FFF / SportEasy / Footbar)
 * Un seul thème sombre athlétique, contrasté, responsive et lisible sur iPhone, iPad, Mac & PC.
 */
import { useWindowDimensions } from 'react-native';

export const ELITE_COLORS = {
  // Fonds
  bg: '#080B11',              // Fond principal noir carbone / bleu nuit profond
  bgSurface: '#101522',       // Carte niveau 1 (Glassmorphism sombre)
  bgSurfaceElevated: '#171F32', // Carte niveau 2 / Champs / Modales
  bgSurfaceSubtle: '#0D121D', // Zone secondaire / Tableaux

  // Bordures nettes
  border: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(255, 255, 255, 0.16)',
  borderAccent: 'rgba(0, 230, 118, 0.35)',
  borderGold: 'rgba(245, 158, 11, 0.35)',

  // Accents Sportifs
  primary: '#00E676',         // Vert Électrique Sport (Actions, Présent, Victoire)
  primarySoft: 'rgba(0, 230, 118, 0.14)',
  primaryGlow: 'rgba(0, 230, 118, 0.28)',

  secondary: '#3B82F6',       // Bleu Tactique (Info, Calendrier, Stats)
  secondarySoft: 'rgba(59, 130, 246, 0.14)',

  gold: '#F59E0B',            // Or Trophée / Étoiles / MVP / 1er place
  goldSoft: 'rgba(245, 158, 11, 0.15)',

  danger: '#EF4444',          // Rouge Absent / Défaite / Relégation
  dangerSoft: 'rgba(239, 68, 68, 0.15)',

  warning: '#F97316',         // Orange En attente / Attention
  warningSoft: 'rgba(249, 115, 22, 0.15)',

  // Copilote IA
  aiPurple: '#8B5CF6',
  aiPurpleSoft: 'rgba(139, 92, 246, 0.15)',
  aiPurpleGlow: 'rgba(139, 92, 246, 0.35)',

  // Textes & Typo
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',   // Gris ardoise lisible
  textMuted: '#64748B',       // Gris discret
  textDisabled: '#475569',
};

export const ELITE_RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const ELITE_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Breakpoints réactifs pour iPhone, iPad, Mac et PC Windows.
 */
export function useEliteResponsive() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 680;
  const isTablet = width >= 680 && width < 1024;
  const isDesktop = width >= 1024;
  const maxContentWidth = 1180;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    maxContentWidth,
    // Permet de centrer automatiquement et d'éviter les étirements démesurés sur grand écran
    containerStyle: {
      width: '100%' as const,
      maxWidth: maxContentWidth,
      alignSelf: 'center' as const,
    },
    contentPadding: isMobile ? ELITE_SPACING.lg : ELITE_SPACING.xl,
  };
}
