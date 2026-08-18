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

export type AdminChromeTokens = {
  shell: string;
  shellElevated: string;
  shellMid: string;
  shellBorder: string;
  shellBorderStrong: string;
  accent: string;
  accentHot: string;
  accentDeep: string;
  accentMuted: string;
  accentGlow: string;
  soft: string;
  pitch: string;
  pitchSoft: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  overlay: string;
  overlayStrong: string;
  atmosphereTop: string;
  atmosphereMid: string;
  atmosphereBottom: string;
  danger: string;
  success: string;
  warning: string;
  band: string;
  rail: string;
  railInk: string;
  rowHover: string;
  rowActive: string;
  cardShadow: string;
  mono: string;
  radius: number;
  radiusSm: number;
  radiusLg: number;
  railWidth: number;
};

export type AdminThemePrefs = {
  primaryColor?: string;
  secondaryColor?: string;
  pitchAccent?: boolean;
  radius?: number;
};

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0, 108, 252, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildAdminChrome(prefs?: AdminThemePrefs): AdminChromeTokens {
  const accent = prefs?.primaryColor ?? ADMIN_SIGNAL;
  const pitch = prefs?.pitchAccent !== false ? (prefs?.secondaryColor ?? ADMIN_PITCH) : ADMIN_PITCH;
  const pitchSoft = hexToRgba(pitch, 0.12);
  const radius = prefs?.radius ?? 12;

  return {
    shell: '#FFFFFF',
    shellElevated: ADMIN_ICE,
    shellMid: '#E8EDF5',
    shellBorder: 'rgba(7, 20, 40, 0.09)',
    shellBorderStrong: 'rgba(7, 20, 40, 0.16)',
    accent,
    accentHot: ADMIN_SIGNAL_HOT,
    accentDeep: ADMIN_SIGNAL_DEEP,
    accentMuted: hexToRgba(accent, 0.32),
    accentGlow: hexToRgba(accent, 0.14),
    soft: hexToRgba(accent, 0.09),
    pitch,
    pitchSoft,
    text: ADMIN_INK,
    textSecondary: 'rgba(7, 20, 40, 0.72)',
    textMuted: 'rgba(7, 20, 40, 0.5)',
    overlay: hexToRgba(accent, 0.05),
    overlayStrong: hexToRgba(accent, 0.11),
    atmosphereTop: '#FFFFFF',
    atmosphereMid: '#F2F6FC',
    atmosphereBottom: ADMIN_CANVAS,
    danger: '#DC2649',
    success: pitch,
    warning: '#C9780A',
    band: ADMIN_CANVAS,
    rail: '#FFFFFF',
    railInk: ADMIN_INK,
    rowHover: 'rgba(7, 20, 40, 0.035)',
    rowActive: hexToRgba(accent, 0.1),
    cardShadow: 'rgba(7, 20, 40, 0.07)',
    mono: adminType.mono,
    radius,
    radiusSm: Math.max(6, radius - 4),
    radiusLg: radius + 4,
    railWidth: 3,
  };
}

export const adminChrome: AdminChromeTokens = buildAdminChrome();

export function buildAdminColors(prefs?: AdminThemePrefs): AppColors {
  const chrome = buildAdminChrome(prefs);
  return {
    ...baseColors,
    accent: chrome.accent,
    accentLight: chrome.accentHot,
    accentSoft: hexToRgba(chrome.accent, 0.1),
    accentMuted: chrome.accentMuted,
    brand: chrome.accent,
    brandLight: chrome.accentHot,
    brandSoft: hexToRgba(chrome.accent, 0.1),
    brandInverse: '#FFFFFF',
    ink: chrome.text,
    inkSecondary: chrome.textSecondary,
    inkMuted: chrome.textMuted,
    inkFaint: 'rgba(7, 20, 40, 0.32)',
    background: '#FFFFFF',
    backgroundAlt: ADMIN_CANVAS,
    surface: '#FFFFFF',
    surfaceMuted: ADMIN_ICE,
    surfaceInverse: ADMIN_INK,
    heroMuted: chrome.textMuted,
    border: chrome.shellBorder,
    borderStrong: chrome.accent,
    borderMedium: chrome.shellBorderStrong,
    text: chrome.text,
    textSecondary: chrome.textSecondary,
    textMuted: chrome.textMuted,
    success: chrome.success,
    successBg: chrome.pitchSoft,
    warning: chrome.warning,
    warningBg: 'rgba(201, 120, 10, 0.1)',
    pending: 'rgba(7, 20, 40, 0.4)',
    pendingBg: 'rgba(7, 20, 40, 0.04)',
    error: chrome.danger,
    errorBg: 'rgba(220, 38, 73, 0.08)',
    tone1: chrome.accentDeep,
    tone2: chrome.accent,
    tone3: chrome.textMuted,
    tone4: 'rgba(7, 20, 40, 0.32)',
    navy: chrome.accentDeep,
    navySoft: '#E8F1FF',
    blueBright: chrome.accentHot,
    bluePrimary: chrome.accent,
    blueCyan: chrome.accent,
    gradientStart: chrome.accent,
    gradientEnd: chrome.accentDeep,
  };
}

export const ADMIN_COLORS: AppColors = buildAdminColors();

/** Badges statut admin — centralisés, consommés par tableaux et cartes. */
export const adminStatusTokens = {
  active: { bg: 'rgba(22, 101, 52, 0.12)', fg: ADMIN_PITCH, label: 'Actif' },
  pending: { bg: 'rgba(201, 120, 10, 0.12)', fg: '#C9780A', label: 'En attente' },
  suspended: { bg: 'rgba(220, 38, 73, 0.1)', fg: '#DC2649', label: 'Suspendu' },
  verified: { bg: hexToRgba(ADMIN_SIGNAL, 0.1), fg: ADMIN_SIGNAL, label: 'Vérifié' },
  neutral: { bg: 'rgba(7, 20, 40, 0.06)', fg: 'rgba(7, 20, 40, 0.55)', label: '—' },
} as const;
