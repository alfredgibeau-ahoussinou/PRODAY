import { useMemo } from 'react';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { JOUEUR_SITE, type JoueurPageIdentity } from '../content/joueurPageIdentity';
import { FUT18_PREMIUM } from '../theme/fut18PremiumPalette';
import { radius } from '../theme/designTokens';
import { JOUEUR_RADIUS, type JoueurThemeTokens } from '../theme/joueurDesignSystem';

export type { JoueurThemeTokens } from '../theme/joueurDesignSystem';

const FALLBACK: JoueurThemeTokens = {
  ready: false,
  identity: null,
  accent: JOUEUR_SITE.gold,
  accentBright: FUT18_PREMIUM.goldAccent,
  ink: JOUEUR_SITE.foreground,
  inkMuted: JOUEUR_SITE.muted,
  surface: JOUEUR_SITE.surface,
  elevated: JOUEUR_SITE.elevated,
  border: JOUEUR_SITE.border,
  panel: JOUEUR_SITE.panel,
  shellBg: JOUEUR_SITE.bg,
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
      accent: identity.accent,
      accentBright: identity.accentBright,
      ink: identity.ink,
      inkMuted: identity.inkMuted,
      surface: identity.surface,
      elevated: identity.elevated,
      border: identity.border,
      panel: JOUEUR_SITE.panel,
      shellBg: identity.shellBg,
      radius: identity.radius,
      cardRadius: identity.density === 'playful' ? JOUEUR_RADIUS.lg : JOUEUR_RADIUS.md,
    };
  }, [session?.identity, session?.ready, session?.needsGate]);
}

export type { JoueurPageIdentity };
