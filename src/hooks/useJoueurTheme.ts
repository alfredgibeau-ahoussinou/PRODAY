import { useMemo } from 'react';
import { useJoueurSession } from '../context/JoueurSessionContext';
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

/** Tokens UI joueur — identity session ou fallback adulte. */
export function useJoueurTheme(): JoueurThemeTokens {
  const session = useJoueurSession();
  return useMemo(() => {
    const identity = session?.identity ?? null;
    if (!identity) return FALLBACK;
    return {
      ready: Boolean(session?.ready && !session?.needsGate),
      identity,
      accent: PLAYER_DARK.accent,
      accentBright: PLAYER_DARK.accentAlt,
      ink: PLAYER_DARK.text,
      inkMuted: PLAYER_DARK.textMuted,
      surface: PLAYER_DARK.surface,
      elevated: PLAYER_DARK.surfaceRaised,
      border: PLAYER_DARK.border,
      panel: PLAYER_DARK.surface,
      shellBg: PLAYER_DARK.bg,
      radius: identity.radius,
      cardRadius: identity.density === 'playful' ? JOUEUR_RADIUS.lg : JOUEUR_RADIUS.md,
    };
  }, [session?.identity, session?.ready, session?.needsGate]);
}

export type { JoueurPageIdentity };
