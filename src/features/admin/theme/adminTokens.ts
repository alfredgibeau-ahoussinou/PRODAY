/**
 * Tokens — ProDay Espace Admin (ops desk raffiné).
 * Obsidian froid · champagne discret · hiérarchie nette (moins d’or saturé).
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
  accentHot: string;
  accentSoft: string;
  accentText: string;
  signal: string;
  signalSoft: string;
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
  railInk: string;
  stripBg: string;
};

const ADMIN = PRODAY_POLE_ACCENTS.admin;

export const ADMIN_TOKENS: AdminThemeTokens = {
  bg: '#07090E',
  bgElevated: '#0C1017',
  surface: '#121821',
  surfaceRaised: '#182029',
  surfaceMuted: '#0E131B',
  surfaceGlass: 'rgba(24, 32, 41, 0.94)',
  border: 'rgba(232, 236, 242, 0.07)',
  borderStrong: 'rgba(232, 236, 242, 0.14)',
  borderLuxury: 'rgba(212, 175, 95, 0.28)',
  foreground: '#EEF1F5',
  muted: '#8B95A5',
  faint: '#5E6878',
  accent: ADMIN,
  accentHot: '#D4AF5F',
  accentSoft: 'rgba(212, 175, 95, 0.12)',
  accentText: '#0A0C10',
  signal: '#D4AF5F',
  signalSoft: 'rgba(212, 175, 95, 0.12)',
  champagne: '#D4AF5F',
  champagneBright: '#E8C97A',
  champagneSoft: poleAccentSoft('admin', 0.1),
  champagneGlow: 'rgba(212, 175, 95, 0.18)',
  success: '#3DCF8E',
  successSoft: 'rgba(61, 207, 142, 0.12)',
  warn: '#E0A045',
  warnSoft: 'rgba(224, 160, 69, 0.14)',
  danger: '#E35A4A',
  dangerSoft: 'rgba(227, 90, 74, 0.12)',
  info: '#6B93F0',
  infoSoft: 'rgba(107, 147, 240, 0.12)',
  sidebarBg: '#05070B',
  headerBg: '#0C1017',
  dockBg: '#0C1017',
  overlay: 'rgba(5, 7, 11, 0.78)',
  hairline: 'rgba(232, 236, 242, 0.05)',
  ink: '#EEF1F5',
  healthGood: '#3DCF8E',
  healthMid: '#E0A045',
  healthBad: '#E35A4A',
  railInk: '#EEF1F5',
  stripBg: '#0C1017',
};
