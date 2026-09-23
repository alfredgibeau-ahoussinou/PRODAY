/**
 * Passerelle de jetons du Copilote partagé.
 *
 * Un seul composant de conversation est rendu par les pôles. Il ne connaît pas les jetons
 * d'un pôle en particulier : il reçoit ce contrat structurel, alimenté par des adaptateurs
 * explicites. Les états sémantiques viennent du socle `designTokens`, pas d'une teinte
 * d'équipe : un « échec » doit rester rouge dans tous les pôles.
 */
import { colors as baseColors } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../club/theme/clubTokens';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

export type CopilotTokens = {
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  borderStrong: string;
  foreground: string;
  muted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  isLight: boolean;
};

const SEMANTIC = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

/** Jetons Club : satisfont déjà le contrat, transmis tels quels (aucune couleur inventée). */
export function clubCopilotTokens(tokens: ClubThemeTokens): CopilotTokens {
  return {
    bg: tokens.bg,
    surface: tokens.surface,
    elevated: tokens.elevated,
    border: tokens.border,
    borderStrong: tokens.borderStrong,
    foreground: tokens.foreground,
    muted: tokens.muted,
    accent: tokens.accent,
    accentSoft: tokens.accentSoft,
    onAccent: tokens.onAccent,
    success: tokens.success,
    warning: tokens.warning,
    danger: tokens.danger,
    dangerSoft: tokens.dangerSoft,
    isLight: tokens.isLight,
  };
}

/** Jetons Coach : plus étroits, complétés par les états du socle. */
export function coachCopilotTokens(tokens: CoachThemeTokens): CopilotTokens {
  return {
    bg: tokens.bg,
    surface: tokens.surface,
    elevated: tokens.elevated,
    border: tokens.border,
    borderStrong: tokens.border,
    foreground: tokens.foreground,
    muted: tokens.muted,
    accent: tokens.accent,
    accentSoft: tokens.soft,
    onAccent: tokens.onAccent,
    success: SEMANTIC.success,
    warning: SEMANTIC.warning,
    danger: SEMANTIC.danger,
    dangerSoft: 'rgba(239,68,68,0.16)',
    isLight: tokens.isLight,
  };
}

/**
 * Jetons du pôle Joueur.
 * `PLAYER_DARK` définit déjà ses propres surfaces sombres : on ne les remplace pas par celles
 * d'un autre pôle, sinon le Copilote cesserait de ressembler au reste de l'espace Joueur.
 */
export function playerCopilotTokens(): CopilotTokens {
  return {
    bg: PLAYER_DARK.bg,
    surface: PLAYER_DARK.surface,
    elevated: PLAYER_DARK.bgElevated,
    border: PLAYER_DARK.border,
    borderStrong: PLAYER_DARK.border,
    foreground: PLAYER_DARK.text,
    muted: PLAYER_DARK.textMuted,
    accent: PLAYER_DARK.accent,
    accentSoft: PLAYER_DARK.accentSoft,
    onAccent: PLAYER_DARK.bg,
    success: SEMANTIC.success,
    warning: SEMANTIC.warning,
    danger: SEMANTIC.danger,
    dangerSoft: 'rgba(239,68,68,0.16)',
    isLight: false,
  };
}

/** Surfaces neutres du socle, pour les contextes hors shell et les tests. */
export const FALLBACK_COPILOT_TOKENS: CopilotTokens = {
  bg: baseColors.background,
  surface: baseColors.surface,
  elevated: baseColors.surfaceMuted,
  border: baseColors.border,
  borderStrong: baseColors.borderStrong,
  foreground: baseColors.text,
  muted: baseColors.textSecondary,
  accent: baseColors.accent,
  accentSoft: baseColors.accentSoft,
  onAccent: baseColors.brandInverse,
  success: SEMANTIC.success,
  warning: SEMANTIC.warning,
  danger: SEMANTIC.danger,
  dangerSoft: 'rgba(239,68,68,0.16)',
  isLight: false,
};
