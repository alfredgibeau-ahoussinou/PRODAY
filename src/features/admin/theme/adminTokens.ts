/**
 * Tokens — ProDay Admin Control Center.
 * Void graphite · platine pôle Admin · signal acier (pas émeraude club, pas or président).
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
  /** Signal interactif acier (focus, chrome actif). */
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
};

const ADMIN = PRODAY_POLE_ACCENTS.admin;

export const ADMIN_TOKENS: AdminThemeTokens = {
  bg: '#02040A',
  bgElevated: '#060A12',
  surface: '#0B111A',
  surfaceRaised: '#121A28',
  surfaceMuted: '#080C14',
  surfaceGlass: 'rgba(14, 20, 32, 0.78)',
  border: 'rgba(184, 190, 204, 0.12)',
  borderStrong: 'rgba(184, 190, 204, 0.28)',
  borderLuxury: 'rgba(232, 234, 238, 0.18)',
  foreground: '#F2F4F7',
  muted: '#8B93A7',
  faint: '#545C70',
  accent: ADMIN,
  accentHot: '#E8EAEE',
  accentSoft: poleAccentSoft('admin', 0.16),
  accentText: '#060A12',
  signal: '#8BA8C4',
  signalSoft: 'rgba(139, 168, 196, 0.16)',
  champagne: '#C4C8D0',
  champagneBright: '#E8EAEE',
  champagneSoft: poleAccentSoft('admin', 0.1),
  champagneGlow: poleAccentSoft('admin', 0.22),
  success: '#5CB89A',
  successSoft: 'rgba(92, 184, 154, 0.14)',
  warn: '#D4A85C',
  warnSoft: 'rgba(212, 168, 92, 0.14)',
  danger: '#D07070',
  dangerSoft: 'rgba(208, 112, 112, 0.14)',
  info: '#8BA8C4',
  infoSoft: 'rgba(139, 168, 196, 0.14)',
  sidebarBg: '#04070F',
  headerBg: 'rgba(2, 4, 10, 0.94)',
  dockBg: 'rgba(2, 4, 10, 0.97)',
  overlay: 'rgba(1, 2, 6, 0.82)',
  hairline: 'rgba(184, 190, 204, 0.1)',
  ink: '#010206',
  healthGood: '#5CB89A',
  healthMid: '#D4A85C',
  healthBad: '#D07070',
};
