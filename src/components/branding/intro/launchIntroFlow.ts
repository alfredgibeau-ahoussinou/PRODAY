import type { CarouselPoleId } from '../../../models/CarouselPole';
import {
  normalizeCarouselPole,
  productLineToCarouselPole,
} from '../../../models/CarouselPole';
import type { ClubShellMode } from '../../../models/ClubShellMode';
import type { ProductLineId } from '../../../models/ProductLine';
import type { UserRole } from '../../../models/User';

export type IntroExitAction = 'mark-complete' | 'close-manual';

/**
 * Timings sortie « Entrer dans [pôle] ».
 * Local BrandReveal ≈ 260 ms ; picker manuel délègue à Push (~220 ms) sans redo local.
 */
export const UNIVERSE_CONFIRM_LEAVE = {
  exitMs: 260,
  exitReducedMs: 90,
  veilMs: 110,
  /** PushScreenTransition quand skipLocalTransition. */
  pushExitMs: 220,
} as const;

/**
 * Reveal session / cold-start : logo composé → message → hold → sortie.
 * Fond charcoal constant (pas de cut noir, pas de PNG carré).
 * ~2s total — connect (Bienvenue) et disconnect (Au revoir).
 */
export const BRAND_SESSION_REVEAL = {
  /** Fade + scale soft du lockup. */
  logoInMs: 560,
  logoScaleFrom: 0.94,
  /** Décalage avant l’entrée du message (après début logo). */
  messageDelayMs: 320,
  messageInMs: 440,
  messageRisePx: 16,
  /** Pause premium avant la sortie. */
  holdMs: 720,
  holdReducedMs: 180,
  /** Sortie croisée (opacity, jamais cut brutal à 0). */
  exitMs: 420,
  exitReducedMs: 110,
  /** Floor d’opacity pendant la sortie (anti écran noir). */
  exitFloor: 0.08,
} as const;

/** Alias historique — même choreography que la session reveal. */
export const BRAND_WELCOME_REVEAL = {
  logoInMs: BRAND_SESSION_REVEAL.logoInMs,
  logoScaleFrom: BRAND_SESSION_REVEAL.logoScaleFrom,
  welcomeDelayMs: BRAND_SESSION_REVEAL.messageDelayMs,
  welcomeInMs: BRAND_SESSION_REVEAL.messageInMs,
  welcomeRisePx: BRAND_SESSION_REVEAL.messageRisePx,
  holdMs: BRAND_SESSION_REVEAL.holdMs,
  holdReducedMs: BRAND_SESSION_REVEAL.holdReducedMs,
  exitMs: BRAND_SESSION_REVEAL.exitMs,
  exitReducedMs: BRAND_SESSION_REVEAL.exitReducedMs,
  exitFloor: BRAND_SESSION_REVEAL.exitFloor,
} as const;

export type BrandSessionTone = 'welcome' | 'goodbye';

export const BRAND_SESSION_COPY: Record<BrandSessionTone, string> = {
  welcome: 'Bienvenue dans cette nouvelle expérience',
  goodbye: 'Au revoir',
};

/** Durée totale estimée jusqu’à `onComplete`. */
export function brandSessionTotalMs(reduced = false): number {
  if (reduced) {
    return BRAND_SESSION_REVEAL.holdReducedMs + BRAND_SESSION_REVEAL.exitReducedMs;
  }
  const { messageDelayMs, messageInMs, holdMs, exitMs } = BRAND_SESSION_REVEAL;
  return messageDelayMs + messageInMs + holdMs + exitMs;
}

/** @deprecated Prefer brandSessionTotalMs — même durée. */
export function brandWelcomeTotalMs(reduced = false): number {
  return brandSessionTotalMs(reduced);
}

/** Action à la fin de la transition selon le mode d'ouverture du sélecteur. */
export function resolveIntroExitAction(isManualOpen: boolean): IntroExitAction {
  return isManualOpen ? 'close-manual' : 'mark-complete';
}

/** Évite une transition inutile quand l'utilisateur confirme le pôle déjà actif. */
export function shouldSkipPoleTransition(
  chosenPole: CarouselPoleId,
  currentLine: ProductLineId | undefined,
  currentRole: UserRole | null | undefined,
  isManualReopen: boolean,
  currentClubShellMode?: ClubShellMode | null,
): boolean {
  if (!isManualReopen || currentLine == null) return false;
  const currentPole = productLineToCarouselPole(
    currentLine,
    currentRole,
    currentClubShellMode,
  );
  return normalizeCarouselPole(chosenPole) === normalizeCarouselPole(currentPole);
}
