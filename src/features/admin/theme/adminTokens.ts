/**
 * Tokens — ProDay Admin Control Center.
 * Surfaces graphite premium · accent pôle Admin #A3A3A3.
 */

import { PRODAY_POLE_ACCENTS, poleAccentSoft } from '../../../theme/prodayBrand';

export type AdminThemeTokens = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  surfaceGlass: string;
  border: string;
  borderStrong: string;
  borderLuxury: string;
  foreground: string;
  muted: string;
  faint: string;
  accent: string;
  /** Alias champagneBright — legacy panes. */
  accentHot: string;
  accentSoft: string;
  accentText: string;
  champagne: string;
  champagneBright: string;
  champagneSoft: string;
  champagneGlow: string;
  success: string;
  successSoft: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  sidebarBg: string;
  headerBg: string;
  dockBg: string;
  overlay: string;
  hairline: string;
  ink: string;
  healthGood: string;
  healthMid: string;
  healthBad: string;
};

const ADMIN = PRODAY_POLE_ACCENTS.admin;

export const ADMIN_TOKENS: AdminThemeTokens = {
  bg: '#05070E',
  bgElevated: '#0A0F1A',
  surface: '#0E1524',
  surfaceRaised: '#141E32',
  surfaceMuted: '#0B111C',
  surfaceGlass: 'rgba(20, 30, 50, 0.72)',
  border: 'rgba(163, 163, 163, 0.16)',
  borderStrong: 'rgba(163, 163, 163, 0.34)',
  borderLuxury: 'rgba(212, 212, 212, 0.28)',
  foreground: '#F7F3EB',
  muted: '#9AA3B8',
  faint: '#5A6478',
  accent: ADMIN,
  accentHot: '#D4D4D4',
  accentSoft: poleAccentSoft('admin', 0.14),
  accentText: '#0A0F1A',
  champagne: '#D4D4D4',
  champagneBright: '#E5E5E5',
  champagneSoft: poleAccentSoft('admin', 0.1),
  champagneGlow: poleAccentSoft('admin', 0.22),
  success: '#4AB894',
  successSoft: 'rgba(74, 184, 148, 0.14)',
  warn: '#D9A84A',
  warnSoft: 'rgba(217, 168, 74, 0.14)',
  danger: '#C86A6A',
  dangerSoft: 'rgba(200, 106, 106, 0.14)',
  info: '#7A96BE',
  infoSoft: 'rgba(122, 150, 190, 0.14)',
  sidebarBg: '#070B14',
  headerBg: 'rgba(5, 7, 14, 0.92)',
  dockBg: 'rgba(5, 7, 14, 0.96)',
  overlay: 'rgba(2, 4, 10, 0.78)',
  hairline: 'rgba(163, 163, 163, 0.12)',
  ink: '#03050A',
  healthGood: '#4AB894',
  healthMid: '#D9A84A',
  healthBad: '#C86A6A',
};
