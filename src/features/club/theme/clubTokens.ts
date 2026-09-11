/**
 * Identité visuelle Pôle Club — fond #000 + overlay émeraude très léger.
 * Accents produit (émeraude) sur dock/CTA secondaires ; contrôles « mode »
 * métier suivent la couleur d’équipe via `buildClubThemeTokens`.
 */

import { PRODAY_POLE_ACCENTS, poleAccentSoft } from '../../../theme/prodayBrand';

/** Overlay shell — émeraude produit, pas la couleur d’équipe. */
export const CLUB_BG_WASH_HEX = '#10B981';
export const CLUB_BG_WASH_TOP = 'rgba(16, 185, 129, 0.06)';
export const CLUB_BG_WASH_MID = 'rgba(16, 185, 129, 0.03)';

export type ClubThemeTokens = {
  bg: string;
  /** Surface principale (cartes). */
  surface: string;
  /** Surface secondaire / chips. */
  elevated: string;
  /** Surface encore plus haute (modales, sheets). */
  raised: string;
  border: string;
  borderStrong: string;
  foreground: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  /** Couleur secondaire (logo / club). */
  secondary: string;
  /** Texte / icônes sur fond accent. */
  onAccent: string;
  glow: string;
  /** Lavage header — noir (pas de teinte). */
  headerWash: string;
  /** Overlay émeraude très léger (haut du shell). */
  bgWash: string;
  bgWashMid: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  pitch: string;
  pitchSoft: string;
  scrim: string;
  isLight: boolean;
};

const CLUB = PRODAY_POLE_ACCENTS.club;

/** Tokens Club — root noir, charcoal neutre, wash émeraude 6 % / 3 %. */
export const CLUB_TOKENS: ClubThemeTokens = {
  bg: '#000000',
  surface: '#141418',
  elevated: '#181820',
  raised: '#22222E',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  foreground: '#F4F7FC',
  muted: '#8B8B9A',
  faint: 'rgba(244, 247, 252, 0.44)',
  accent: CLUB,
  accentSoft: poleAccentSoft('club', 0.22),
  accentDeep: '#047857',
  secondary: '#34D399',
  onAccent: '#FFFFFF',
  glow: poleAccentSoft('club', 0.5),
  headerWash: '#000000',
  bgWash: CLUB_BG_WASH_TOP,
  bgWashMid: CLUB_BG_WASH_MID,
  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.18)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.16)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239, 68, 68, 0.16)',
  pitch: '#059669',
  pitchSoft: poleAccentSoft('club', 0.28),
  scrim: 'rgba(0, 0, 0, 0.78)',
  isLight: false,
};

/** Chrome site/legacy — noir + accents émeraude (pas de wash fond). */
export const CLUB_SITE_LEGACY = {
  accent: CLUB,
  deep: '#047857',
  soft: poleAccentSoft('club', 0.22),
  glow: poleAccentSoft('club', 0.35),
  bg: '#000000',
  band: '#000000',
  surface: '#0A0A0A',
  elevated: '#141414',
  border: 'rgba(255, 255, 255, 0.10)',
  foreground: '#F4F7FC',
  muted: 'rgba(244, 247, 252, 0.68)',
  pitchDeep: '#064E3B',
  pitch: CLUB,
  pitchLight: '#34D399',
} as const;
