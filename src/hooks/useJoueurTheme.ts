import { useMemo } from 'react';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { usePlayerThemeColors } from '../context/PlayerThemeContext';
import { JOUEUR_SITE, type JoueurPageIdentity } from '../content/joueurPageIdentity';
import { PLAYER_DARK } from '../theme/playerDarkPremium';
import { radius } from '../theme/designTokens';
import { JOUEUR_RADIUS, type JoueurThemeTokens } from '../theme/joueurDesignSystem';

export type { JoueurThemeTokens } from '../theme/joueurDesignSystem';

const FALLBACK: JoueurThemeTokens = {
  ready: false,
  identity: null,
  accent: PLAYER_DARK.accent,
  accentBright: PLAYER_DARK.accentAlt,
  ink: PLAYER_DARK.text,
  inkMuted: PLAYER_DARK.textMuted,
  surface: PLAYER_DARK.surface,
  elevated: PLAYER_DARK.surfaceRaised,
  border: PLAYER_DARK.border,
  panel: PLAYER_DARK.surface,
  shellBg: PLAYER_DARK.bg,
  radius: radius.md,
  cardRadius: JOUEUR_RADIUS.md,
};

/** Tokens UI joueur — identity session + couleurs personnalisables. */
export function useJoueurTheme(): JoueurThemeTokens {
  const session = useJoueurSession();
  const playerColors = usePlayerThemeColors();
  return useMemo(() => {
    const identity = session?.identity ?? null;
    if (!identity) {
      return {
        ...FALLBACK,
        accent: playerColors.accent,
        accentBright: playerColors.accentAlt,
        shellBg: playerColors.bg,
        surface: playerColors.surface,
        elevated: playerColors.surfaceRaised,
        panel: playerColors.surface,
      };
    }
    return {
      ready: Boolean(session?.ready && !session?.needsGate),
      identity,
      accent: playerColors.accent,
      accentBright: playerColors.accentAlt,
      ink: PLAYER_DARK.text,
      inkMuted: PLAYER_DARK.textMuted,
      surface: playerColors.surface,
      elevated: playerColors.surfaceRaised,
      border: PLAYER_DARK.border,
      panel: playerColors.surface,
      shellBg: playerColors.bg,
      radius: identity.radius,
      cardRadius: identity.density === 'playful' ? JOUEUR_RADIUS.lg : JOUEUR_RADIUS.md,
    };
  }, [
    playerColors.accent,
    playerColors.accentAlt,
    playerColors.bg,
    playerColors.surface,
    playerColors.surfaceRaised,
    session?.identity,
    session?.ready,
    session?.needsGate,
  ]);
}

export type { JoueurPageIdentity };
