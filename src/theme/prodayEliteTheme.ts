/**
 * ProDay Elite Design System
 * Calibré pour le football de haut niveau : fonds minéraux sombres,
 * contrastes élevés (WCAG AAA), typographies sportives précises et 100% en Français.
 */

export const ELITE_COLORS = {
  // Fonds de structure
  background: '#07090E',      // Noir bleuté minéral profond
  surfacePrimary: '#0F131C',  // Cartes principales niveau 1
  surfaceSecondary: '#161B26',// Champs et cartes niveau 2
  surfaceRaised: '#1E2535',   // Éléments surélevés / badges actifs

  // Bordures
  borderLight: 'rgba(255, 255, 255, 0.07)',
  borderActive: 'rgba(0, 230, 118, 0.35)',
  borderGold: 'rgba(255, 255, 255, 0.18)',

  // Couleurs d'action football
  pitchGreen: '#00E676',       // Vert pelouse électrique ProDay
  pitchGreenGlow: 'rgba(0, 230, 118, 0.15)',
  goldMaster: '#00E676',
  goldGlow: 'rgba(0, 230, 118, 0.15)',
  alertRed: '#EF4444',         // Rouge Défaite / Absence
  alertRedGlow: 'rgba(239, 68, 68, 0.15)',
  titanium: '#94A3B8',         // Gris titane neutre

  // Alias sémantiques et compatibilité
  primary: '#00E676',
  primarySoft: 'rgba(0, 230, 118, 0.15)',
  secondary: '#94A3B8',
  gold: '#00E676',
  goldSoft: 'rgba(0, 230, 118, 0.15)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.15)',
  border: 'rgba(255, 255, 255, 0.07)',
  borderHighlight: 'rgba(255, 255, 255, 0.14)',
  borderAccent: 'rgba(0, 230, 118, 0.35)',
  bg: '#07090E',
  bgSurface: '#0F131C',
  bgSurfaceElevated: '#161B26',
  bgSurfaceSubtle: '#1E2535',

  // Textes
  textPrimary: '#FFFFFF',      // Blanc pur pour titres
  textSecondary: '#CBD5E1',    // Blanc cassé ultra-lisible (pas de gris terne)
  textMuted: '#64748B',        // Légendes et sous-textes
  textInverse: '#07090E',      // Texte sur bouton vert
} as const;

export const ELITE_RADIUS = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 9999,
} as const;

export const ELITE_SPACING = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
} as const;
