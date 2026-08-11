import { colors as baseColors } from './designTokens';
import type { AppColors } from './universeTheme';
import { CLUB_SITE } from '../content/clubPageIdentity';
import { fontFamily } from './typography';

/**
 * Admin ProDay — Football Operations Center.
 * Direction : terminal ops clair, ink navy, signal ProDay, touches terrain.
 * Typo display Syne · corps Inter. Pas graphite froid, pas violet.
 */
export const ADMIN_SIGNAL = CLUB_SITE.accent; // #006CFC
export const ADMIN_SIGNAL_HOT = '#2F7FFF';
export const ADMIN_SIGNAL_DEEP = CLUB_SITE.deep; // #002478
export const ADMIN_PITCH = CLUB_SITE.pitchLight; // #166534
export const ADMIN_PITCH_SOFT = 'rgba(22, 101, 52, 0.12)';
export const ADMIN_INK = '#071428';
export const ADMIN_CANVAS = '#EEF2F8';
export const ADMIN_ICE = '#F7F9FC';

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
  shell: '#FFFFFF',
  shellElevated: ADMIN_ICE,
  shellMid: '#E8EDF5',
  shellBorder: 'rgba(7, 20, 40, 0.09)',
  shellBorderStrong: 'rgba(7, 20, 40, 0.16)',
  accent: ADMIN_SIGNAL,
  accentHot: ADMIN_SIGNAL_HOT,
  accentDeep: ADMIN_SIGNAL_DEEP,
  accentMuted: 'rgba(0, 108, 252, 0.32)',
  accentGlow: 'rgba(0, 108, 252, 0.14)',
  soft: 'rgba(0, 108, 252, 0.09)',
  pitch: ADMIN_PITCH,
  pitchSoft: ADMIN_PITCH_SOFT,
  text: ADMIN_INK,
  textSecondary: 'rgba(7, 20, 40, 0.72)',
  textMuted: 'rgba(7, 20, 40, 0.5)',
  overlay: 'rgba(0, 108, 252, 0.05)',
  overlayStrong: 'rgba(0, 108, 252, 0.11)',
  atmosphereTop: '#FFFFFF',
  atmosphereMid: '#F2F6FC',
  atmosphereBottom: ADMIN_CANVAS,
  danger: '#DC2649',
  success: ADMIN_PITCH,
  warning: '#C9780A',
  band: ADMIN_CANVAS,
  rail: '#FFFFFF',
  railInk: ADMIN_INK,
  rowHover: 'rgba(7, 20, 40, 0.035)',
  rowActive: 'rgba(0, 108, 252, 0.1)',
  cardShadow: 'rgba(7, 20, 40, 0.07)',
  mono: adminType.mono,
  radius: 12,
  radiusSm: 8,
  radiusLg: 16,
  /** Accent rail width (sidebar / cards). */
  railWidth: 3,
} as const;

export const ADMIN_COLORS: AppColors = {
  ...baseColors,
  accent: ADMIN_SIGNAL,
  accentLight: ADMIN_SIGNAL_HOT,
  accentSoft: 'rgba(0, 108, 252, 0.1)',
  accentMuted: 'rgba(0, 108, 252, 0.32)',
  brand: ADMIN_SIGNAL,
  brandLight: ADMIN_SIGNAL_HOT,
  brandSoft: 'rgba(0, 108, 252, 0.1)',
  brandInverse: '#FFFFFF',
  ink: ADMIN_INK,
  inkSecondary: 'rgba(7, 20, 40, 0.72)',
  inkMuted: 'rgba(7, 20, 40, 0.5)',
  inkFaint: 'rgba(7, 20, 40, 0.32)',
  background: '#FFFFFF',
  backgroundAlt: ADMIN_CANVAS,
  surface: '#FFFFFF',
  surfaceMuted: ADMIN_ICE,
  surfaceInverse: ADMIN_INK,
  heroMuted: 'rgba(7, 20, 40, 0.5)',
  border: 'rgba(7, 20, 40, 0.09)',
  borderStrong: ADMIN_SIGNAL,
  borderMedium: 'rgba(7, 20, 40, 0.16)',
  text: ADMIN_INK,
  textSecondary: 'rgba(7, 20, 40, 0.72)',
  textMuted: 'rgba(7, 20, 40, 0.5)',
  success: adminChrome.success,
  successBg: ADMIN_PITCH_SOFT,
  warning: adminChrome.warning,
  warningBg: 'rgba(201, 120, 10, 0.1)',
  pending: 'rgba(7, 20, 40, 0.4)',
  pendingBg: 'rgba(7, 20, 40, 0.04)',
  error: adminChrome.danger,
  errorBg: 'rgba(220, 38, 73, 0.08)',
  tone1: ADMIN_SIGNAL_DEEP,
  tone2: ADMIN_SIGNAL,
  tone3: 'rgba(7, 20, 40, 0.5)',
  tone4: 'rgba(7, 20, 40, 0.32)',
  navy: ADMIN_SIGNAL_DEEP,
  navySoft: '#E8F1FF',
  blueBright: ADMIN_SIGNAL_HOT,
  bluePrimary: ADMIN_SIGNAL,
  blueCyan: ADMIN_SIGNAL,
  gradientStart: ADMIN_SIGNAL,
  gradientEnd: ADMIN_SIGNAL_DEEP,
};
