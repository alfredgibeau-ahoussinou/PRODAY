/**
 * Tokens — ProDay Espace Admin (control room premium).
 * Ink sombre · or ops · densifié — rupture avec le wireframe teal clinique.
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
  bg: '#090B10',
  bgElevated: '#0F131A',
  surface: '#151A24',
  surfaceRaised: '#1C2330',
  surfaceMuted: '#12161F',
  surfaceGlass: 'rgba(28, 35, 48, 0.92)',
  border: 'rgba(244, 246, 248, 0.08)',
  borderStrong: 'rgba(244, 246, 248, 0.16)',
  borderLuxury: 'rgba(232, 184, 74, 0.42)',
  foreground: '#F4F6F8',
  muted: '#9AA3B2',
  faint: '#6B7382',
  accent: ADMIN,
  accentHot: '#E8B84A',
  accentSoft: 'rgba(232, 184, 74, 0.14)',
  accentText: '#0B0D12',
  signal: '#E8B84A',
  signalSoft: 'rgba(232, 184, 74, 0.16)',
  champagne: '#E8B84A',
  champagneBright: '#F5D078',
  champagneSoft: poleAccentSoft('admin', 0.12),
  champagneGlow: 'rgba(232, 184, 74, 0.28)',
  success: '#2ECC8A',
  successSoft: 'rgba(46, 204, 138, 0.14)',
  warn: '#E8A03A',
  warnSoft: 'rgba(232, 160, 58, 0.16)',
  danger: '#E85D4A',
  dangerSoft: 'rgba(232, 93, 74, 0.14)',
  info: '#5B8DEF',
  infoSoft: 'rgba(91, 141, 239, 0.14)',
  sidebarBg: '#05070B',
  headerBg: '#0F131A',
  dockBg: '#0F131A',
  overlay: 'rgba(5, 7, 11, 0.72)',
  hairline: 'rgba(244, 246, 248, 0.06)',
  ink: '#F4F6F8',
  healthGood: '#2ECC8A',
  healthMid: '#E8A03A',
  healthBad: '#E85D4A',
  railInk: '#F4F6F8',
  stripBg: '#0F131A',
};
