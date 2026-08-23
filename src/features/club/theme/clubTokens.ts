/**
 * Identité visuelle Pôle Club — surfaces dark premium + accent violet officiel.
 * Accent pôle = #7C3AED (pas émeraude) ; fonds restent navy/charcoal.
 */

import { PRODAY_POLE_ACCENTS, poleAccentSoft } from '../../../theme/prodayBrand';

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
  /** Lavage header teinté. */
  headerWash: string;
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

/** Tokens Club — night navy, accent violet pôle. */
export const CLUB_TOKENS: ClubThemeTokens = {
  bg: '#0B121F',
  surface: '#121A28',
  elevated: '#182233',
  raised: '#1E2A3C',
  border: 'rgba(186, 204, 230, 0.12)',
  borderStrong: 'rgba(186, 204, 230, 0.22)',
  foreground: '#F4F7FC',
  muted: 'rgba(186, 204, 230, 0.72)',
  faint: 'rgba(186, 204, 230, 0.48)',
  accent: CLUB,
  accentSoft: poleAccentSoft('club', 0.22),
  accentDeep: '#5B21B6',
  secondary: '#A78BFA',
  onAccent: '#FFFFFF',
  glow: poleAccentSoft('club', 0.5),
  headerWash: '#1A1030',
  success: '#10B981',
  successSoft: 'rgba(16, 185, 129, 0.18)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  pitch: '#5B21B6',
  pitchSoft: poleAccentSoft('club', 0.28),
  scrim: 'rgba(4, 8, 16, 0.78)',
  isLight: false,
};

/** Chrome site/legacy — aligné navy + violet pôle. */
export const CLUB_SITE_LEGACY = {
  accent: CLUB,
  deep: '#5B21B6',
  soft: poleAccentSoft('club', 0.22),
  glow: poleAccentSoft('club', 0.35),
  bg: '#0B121F',
  band: '#1A1030',
  surface: '#121A28',
  elevated: '#182233',
  border: 'rgba(186, 204, 230, 0.12)',
  foreground: '#F4F7FC',
  muted: 'rgba(186, 204, 230, 0.72)',
  pitchDeep: '#4C1D95',
  pitch: CLUB,
  pitchLight: '#A78BFA',
} as const;
