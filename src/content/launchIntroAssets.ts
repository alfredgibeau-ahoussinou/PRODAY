/**
 * Assets de l'intro de lancement ProDay.
 *
 * La vidéo est pré-rendue (voir `scripts/build-intro-video.mjs`) : montage foot
 * + textes + logo + musique, le tout dans un seul MP4 vertical. L'app se contente
 * de le lire, ce qui garantit une lecture fluide (aucune composition à l'exécution).
 *
 * Médias : Mixkit (licence Mixkit Free — usage commercial, sans attribution).
 * Régénérer : `node scripts/build-intro-video.mjs`.
 */
export const LAUNCH_INTRO_VIDEO = require('../../assets/intro/proday-intro.mp4');

export const LAUNCH_INTRO_TIMING = {
  /** Sécurité : ferme l'intro même si l'événement de fin n'arrive pas. */
  maxDurationMs: 14000,
  /** Fondu de sortie vers l'app. */
  fadeOutMs: 420,
  /** Délai avant d'afficher le bouton « Passer ». */
  skipDelayMs: 1200,
} as const;
