import { colors as baseColors } from './designTokens';
import type { AppColors } from './universeTheme';
import { CLUB_SITE } from '../content/clubPageIdentity';
import { fontFamily } from './typography';

/**
 * Console admin ProDay — centre de contrôle SaaS clair.
 * Distinct du cockpit sombre FOC et des espaces Joueur / Coach.
 * Canvas ice, ink navy #071428, accent ProDay #006CFC.
 */
export const ADMIN_SIGNAL = CLUB_SITE.accent; // #006CFC
export const ADMIN_SIGNAL_HOT = '#1A7DFF';
export const ADMIN_SIGNAL_DEEP = CLUB_SITE.deep; // #002478
export const ADMIN_PITCH = '#16A34A';
export const ADMIN_PITCH_SOFT = 'rgba(22, 163, 74, 0.12)';
export const ADMIN_INK = '#071428';
export const ADMIN_CANVAS = '#F3F6FA';
export const ADMIN_SURFACE = '#FFFFFF';

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
  shellElevated: '#F8FAFC',
  shellMid: '#EEF3F8',
  shellBorder: 'rgba(7, 20, 40, 0.08)',
  shellBorderStrong: 'rgba(7, 20, 40, 0.14)',
  accent: ADMIN_SIGNAL,
  accentHot: ADMIN_SIGNAL_HOT,
  accentDeep: ADMIN_SIGNAL_DEEP,
  accentMuted: 'rgba(0, 108, 252, 0.35)',
  accentGlow: 'rgba(0, 108, 252, 0.12)',
  soft: 'rgba(0, 108, 252, 0.08)',
  pitch: ADMIN_PITCH,
  pitchSoft: ADMIN_PITCH_SOFT,
  text: ADMIN_INK,
  textSecondary: 'rgba(7, 20, 40, 0.72)',
  textMuted: 'rgba(7, 20, 40, 0.48)',
  overlay: 'rgba(0, 108, 252, 0.06)',
  overlayStrong: 'rgba(0, 108, 252, 0.12)',
  atmosphereTop: '#FFFFFF',
  atmosphereMid: '#F7FAFC',
  atmosphereBottom: ADMIN_CANVAS,
  danger: '#E11D48',
  success: ADMIN_PITCH,
  warning: '#D97706',
  band: ADMIN_CANVAS,
  rail: '#FAFBFD',
  railInk: ADMIN_INK,
  rowHover: 'rgba(7, 20, 40, 0.04)',
  rowActive: 'rgba(0, 108, 252, 0.10)',
  cardShadow: 'rgba(7, 20, 40, 0.08)',
  mono: adminType.mono,
  radius: 14,
  radiusSm: 10,
  radiusLg: 18,
  railWidth: 3,
  scrim: 'rgba(7, 20, 40, 0.45)',
} as const;

export const ADMIN_COLORS: AppColors = {
  ...baseColors,
  accent: ADMIN_SIGNAL,
  accentLight: ADMIN_SIGNAL_HOT,
  accentSoft: 'rgba(0, 108, 252, 0.10)',
  accentMuted: adminChrome.accentMuted,
  brand: ADMIN_SIGNAL,
  brandLight: ADMIN_SIGNAL_HOT,
  brandSoft: 'rgba(0, 108, 252, 0.10)',
  brandInverse: ADMIN_ON_ACCENT,
  ink: ADMIN_INK,
  inkSecondary: adminChrome.textSecondary,
  inkMuted: adminChrome.textMuted,
  inkFaint: 'rgba(7, 20, 40, 0.28)',
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
  warningBg: 'rgba(217, 119, 6, 0.10)',
  pending: 'rgba(7, 20, 40, 0.45)',
  pendingBg: 'rgba(7, 20, 40, 0.05)',
  error: adminChrome.danger,
  errorBg: 'rgba(225, 29, 72, 0.10)',
  tone1: ADMIN_SIGNAL_DEEP,
  tone2: ADMIN_SIGNAL,
  tone3: adminChrome.textMuted,
  tone4: 'rgba(7, 20, 40, 0.28)',
  navy: ADMIN_INK,
  navySoft: 'rgba(7, 20, 40, 0.08)',
  blueBright: ADMIN_SIGNAL_HOT,
  bluePrimary: ADMIN_SIGNAL,
  blueCyan: ADMIN_SIGNAL,
  gradientStart: ADMIN_SIGNAL,
  gradientEnd: ADMIN_SIGNAL_DEEP,
};
