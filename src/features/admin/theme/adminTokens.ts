/**
 * Tokens — ProDay Bureau Ops (fondateur).
 * Console claire high-contrast · encre marine · signal teal instrument.
 * Rupture volontaire avec le void graphite / platine / acier précédent.
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
  /** CTA primaire ink-on-teal. */
  accentHot: string;
  accentSoft: string;
  accentText: string;
  /** Signal interactif teal instrument. */
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
  /** Bande rail gauche (papier frotté). */
  railInk: string;
  stripBg: string;
};

const ADMIN = PRODAY_POLE_ACCENTS.admin;

export const ADMIN_TOKENS: AdminThemeTokens = {
  bg: '#E6EAEE',
  bgElevated: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#DDE3E9',
  surfaceGlass: 'rgba(255, 255, 255, 0.92)',
  border: 'rgba(7, 21, 37, 0.12)',
  borderStrong: 'rgba(7, 21, 37, 0.28)',
  borderLuxury: 'rgba(13, 138, 138, 0.35)',
  foreground: '#071525',
  muted: '#4A5B6E',
  faint: '#7A8B9C',
  accent: ADMIN,
  accentHot: '#0D8A8A',
  accentSoft: 'rgba(13, 138, 138,.12)',
  accentText: '#FFFFFF',
  signal: '#0D8A8A',
  signalSoft: 'rgba(13, 138, 138, 0.14)',
  champagne: '#1A3348',
  champagneBright: '#071525',
  champagneSoft: poleAccentSoft('admin', 0.08),
  champagneGlow: 'rgba(13, 138, 138, 0.2)',
  success: '#1A8F6A',
  successSoft: 'rgba(26, 143, 106, 0.12)',
  warn: '#C47A12',
  warnSoft: 'rgba(196, 122, 18, 0.14)',
  danger: '#D64000',
  dangerSoft: 'rgba(214, 64, 0, 0.12)',
  info: '#1E5F8A',
  infoSoft: 'rgba(30, 95, 138, 0.12)',
  sidebarBg: '#0A1A2A',
  headerBg: '#F4F6F8',
  dockBg: '#F4F6F8',
  overlay: 'rgba(7, 21, 37, 0.45)',
  hairline: 'rgba(7, 21, 37, 0.08)',
  ink: '#071525',
  healthGood: '#1A8F6A',
  healthMid: '#C47A12',
  healthBad: '#D64000',
  railInk: '#F2F5F7',
  stripBg: '#FFFFFF',
};
