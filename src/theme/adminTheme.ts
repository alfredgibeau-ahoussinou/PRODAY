import { colors as baseColors } from './designTokens';
import type { AppColors } from './universeTheme';
import { CLUB_SITE } from '../content/clubPageIdentity';
import { fontFamily } from './typography';

/**
 * Admin ProDay — Football Operations Center.
 * Direction : cockpit ops sombre, ink navy profond, signal ProDay #006CFC.
 * Typo display Syne · corps Inter. Identité distincte des espaces Joueur/Coach.
 */
export const ADMIN_SIGNAL = CLUB_SITE.accent; // #006CFC
export const ADMIN_SIGNAL_HOT = '#3D8FFF';
export const ADMIN_SIGNAL_DEEP = CLUB_SITE.deep; // #002478
export const ADMIN_PITCH = '#22C55E';
export const ADMIN_PITCH_SOFT = 'rgba(34, 197, 94, 0.14)';
export const ADMIN_INK = '#E8EDF5';
export const ADMIN_CANVAS = '#060D18';
export const ADMIN_SURFACE = '#0C1526';

/** Texte sur fond accent (boutons, badges). */
export const ADMIN_ON_ACCENT = '#FFFFFF';

/** @deprecated aliases */
export const ADMIN_ACCENT = ADMIN_SIGNAL;
export const ADMIN_ACCENT_DEEP = ADMIN_SIGNAL_DEEP;
export const ADMIN_TEAL = ADMIN_PITCH;
export const ADMIN_TEAL_DEEP = CLUB_SITE.pitch;

export const adminType = {
  display: fontFamily.displayBold,
  displaySemi: fontFamily.display,
  body: fontFamily.regular,
  bodySemi: fontFamily.semibold,
  bodyBold: fontFamily.bold,
  bodyExtra: fontFamily.extrabold,
  mono: 'Menlo',
} as const;

export const adminChrome = {
  shell: ADMIN_SURFACE,
  shellElevated: '#111D32',
  shellMid: '#162038',
  shellBorder: 'rgba(232, 237, 245, 0.08)',
  shellBorderStrong: 'rgba(232, 237, 245, 0.16)',
  accent: ADMIN_SIGNAL,
  accentHot: ADMIN_SIGNAL_HOT,
  accentDeep: ADMIN_SIGNAL_DEEP,
  accentMuted: 'rgba(0, 108, 252, 0.45)',
  accentGlow: 'rgba(0, 108, 252, 0.22)',
  soft: 'rgba(0, 108, 252, 0.12)',
  pitch: ADMIN_PITCH,
  pitchSoft: ADMIN_PITCH_SOFT,
  text: ADMIN_INK,
  textSecondary: 'rgba(232, 237, 245, 0.72)',
  textMuted: 'rgba(232, 237, 245, 0.48)',
  overlay: 'rgba(0, 108, 252, 0.08)',
  overlayStrong: 'rgba(0, 108, 252, 0.16)',
  atmosphereTop: '#0F1829',
  atmosphereMid: '#0A1220',
  atmosphereBottom: ADMIN_CANVAS,
  danger: '#FF4D6D',
  success: ADMIN_PITCH,
  warning: '#F59E0B',
  band: ADMIN_CANVAS,
  rail: '#0A1220',
  railInk: ADMIN_INK,
  rowHover: 'rgba(232, 237, 245, 0.04)',
  rowActive: 'rgba(0, 108, 252, 0.14)',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  mono: adminType.mono,
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
  /** Accent rail width (sidebar / cards). */
  railWidth: 3,
  /** Backdrop modal mobile menu. */
  scrim: 'rgba(2, 8, 18, 0.72)',
} as const;

export const ADMIN_COLORS: AppColors = {
  ...baseColors,
  accent: ADMIN_SIGNAL,
  accentLight: ADMIN_SIGNAL_HOT,
  accentSoft: 'rgba(0, 108, 252, 0.14)',
  accentMuted: adminChrome.accentMuted,
  brand: ADMIN_SIGNAL,
  brandLight: ADMIN_SIGNAL_HOT,
  brandSoft: 'rgba(0, 108, 252, 0.14)',
  brandInverse: ADMIN_ON_ACCENT,
  ink: ADMIN_INK,
  inkSecondary: adminChrome.textSecondary,
  inkMuted: adminChrome.textMuted,
  inkFaint: 'rgba(232, 237, 245, 0.28)',
  background: ADMIN_CANVAS,
  backgroundAlt: adminChrome.band,
  surface: adminChrome.shell,
  surfaceMuted: adminChrome.shellElevated,
  surfaceInverse: ADMIN_INK,
  heroMuted: adminChrome.textMuted,
  border: adminChrome.shellBorder,
  borderStrong: ADMIN_SIGNAL,
  borderMedium: adminChrome.shellBorderStrong,
  text: adminChrome.text,
  textSecondary: adminChrome.textSecondary,
  textMuted: adminChrome.textMuted,
  success: adminChrome.success,
  successBg: ADMIN_PITCH_SOFT,
  warning: adminChrome.warning,
  warningBg: 'rgba(245, 158, 11, 0.12)',
  pending: 'rgba(232, 237, 245, 0.45)',
  pendingBg: 'rgba(232, 237, 245, 0.06)',
  error: adminChrome.danger,
  errorBg: 'rgba(255, 77, 109, 0.12)',
  tone1: ADMIN_SIGNAL_DEEP,
  tone2: ADMIN_SIGNAL,
  tone3: adminChrome.textMuted,
  tone4: 'rgba(232, 237, 245, 0.28)',
  navy: ADMIN_SIGNAL_DEEP,
  navySoft: 'rgba(0, 36, 120, 0.35)',
  blueBright: ADMIN_SIGNAL_HOT,
  bluePrimary: ADMIN_SIGNAL,
  blueCyan: ADMIN_SIGNAL,
  gradientStart: ADMIN_SIGNAL,
  gradientEnd: ADMIN_SIGNAL_DEEP,
};
