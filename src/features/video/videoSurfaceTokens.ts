/**
 * Passerelle de jetons pour l'espace Vidéo partagé.
 *
 * Le module Vidéo est **un seul** composant rendu par les deux pôles. Les jetons Club
 * (`ClubThemeTokens`) satisfont déjà `VideoSurfaceTokens` : ils sont passés directement.
 * Les jetons Coach sont plus étroits (pas de `borderStrong`, ni d'états sémantiques) :
 * cette fonction les adapte **sans inventer de couleur de marque** — les états
 * sémantiques viennent du socle `designTokens`, pas d'une teinte d'équipe.
 */
import { colors as baseColors } from '../../theme/designTokens';
import type { VideoSurfaceTokens } from './VideoWorkspacePanels';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';

/** États sémantiques lisibles sur les surfaces sombres des deux pôles. */
const SEMANTIC = {
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

/** Adapte les jetons Pôle Coach au contrat de surface du module Vidéo. */
export function coachVideoSurfaceTokens(tokens: CoachThemeTokens): VideoSurfaceTokens {
  return {
    bg: tokens.bg,
    surface: tokens.surface,
    elevated: tokens.elevated,
    border: tokens.border,
    // Le pôle Coach ne définit qu'un seul niveau de bordure : on ne l'invente pas.
    borderStrong: tokens.border,
    foreground: tokens.foreground,
    muted: tokens.muted,
    accent: tokens.accent,
    accentSoft: tokens.soft,
    onAccent: tokens.onAccent,
    warning: SEMANTIC.warning,
    danger: SEMANTIC.danger,
    success: SEMANTIC.success,
    isLight: tokens.isLight,
  };
}

/** Surfaces neutres de repli, utilisées hors shell (prévisualisation, tests). */
export const FALLBACK_VIDEO_SURFACE_TOKENS: VideoSurfaceTokens = {
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
  warning: SEMANTIC.warning,
  danger: SEMANTIC.danger,
  success: SEMANTIC.success,
  isLight: false,
};
