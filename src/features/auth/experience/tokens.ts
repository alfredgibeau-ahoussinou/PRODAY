/**
 * ProDay Auth Experience — tokens signature (football × luxe × éditorial).
 * Fond noir profond ; CTA or master ; zéro glass / SaaS card.
 */

import { PRODAY_MASTER, PRODAY_TAGLINE } from '../../../theme/prodayBrand';

export const AUTH_XP = {
  black: PRODAY_MASTER.black,
  white: PRODAY_MASTER.white,
  gold: PRODAY_MASTER.gold,
  goldBright: PRODAY_MASTER.goldBright,
  goldDeep: PRODAY_MASTER.goldDeep,
  surface: '#0A0A0A',
  surfaceRaised: '#121212',
  border: 'rgba(255,255,255,0.12)',
  borderFocus: 'rgba(197,160,89,0.85)',
  borderError: 'rgba(239,68,68,0.75)',
  text: PRODAY_MASTER.white,
  textMuted: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.38)',
  error: '#F87171',
  errorBg: 'rgba(239,68,68,0.12)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBgFilled: 'rgba(255,255,255,0.07)',
  inputBgDisabled: 'rgba(255,255,255,0.02)',
  overlay: 'rgba(0,0,0,0.55)',
  overlayHeavy: 'rgba(0,0,0,0.72)',
  headline: 'Tout commence sur un terrain.',
  tagline: PRODAY_TAGLINE,
  taglineDisplay: 'Connecter. Progresser. Révéler.',
  brandShare: 0.58,
  formShare: 0.42,
  motionFast: 160,
  motionNormal: 220,
  motionReveal: 480,
} as const;

export const AUTH_HERO_SOURCE = require('../../../../assets/branding/auth/auth-hero-pitch-bw.jpg');
