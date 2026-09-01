/**
 * ProDay Auth Experience — tokens signature (football × luxe × éditorial).
 * Fond #07100C profond ; CTA or master & gold vibrant ; design holographique.
 */

import { PRODAY_MASTER, PRODAY_TAGLINE } from '../../../theme/prodayBrand';

export const AUTH_XP = {
  black: PRODAY_MASTER.black,
  canvas: '#07100C',
  white: PRODAY_MASTER.white,
  gold: PRODAY_MASTER.gold,
  goldMaster: PRODAY_MASTER.gold,
  goldBright: '#F5D04A',
  goldDeep: '#9A7B2F',
  surface: 'rgba(18, 26, 22, 0.75)',
  surfaceRaised: 'rgba(24, 36, 30, 0.85)',
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 20,
  radiusFull: 999,
  border: 'rgba(255, 255, 255, 0.10)',
  borderHighlight: 'rgba(245, 208, 74, 0.35)',
  borderFocus: '#F5D04A',
  borderError: 'rgba(239, 68, 68, 0.85)',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  textDim: 'rgba(255, 255, 255, 0.40)',
  error: '#F87171',
  errorBg: 'rgba(239, 68, 68, 0.12)',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBgFilled: 'rgba(255, 255, 255, 0.08)',
  inputBgDisabled: 'rgba(255, 255, 255, 0.02)',
  overlay: 'rgba(7, 16, 12, 0.65)',
  overlayHeavy: 'rgba(7, 16, 12, 0.88)',
  headline: 'Tout commence sur un terrain.',
  tagline: PRODAY_TAGLINE,
  taglineDisplay: 'Connecter · Progresser · Révéler',
  brandShare: 0.58,
  formShare: 0.42,
  motionFast: 160,
  motionNormal: 220,
  motionReveal: 480,
} as const;

export const AUTH_HERO_SOURCE = require('../../../../assets/branding/auth/auth-hero-pitch-bw.jpg');
