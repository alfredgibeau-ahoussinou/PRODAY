/**
 * Palette du terrain Coach — **dérivée des jetons partagés**, jamais d'un
 * système visuel parallèle.
 *
 * Le pôle Coach n'a pas de couleur de terrain à lui : on reprend les verts
 * profonds déjà déclarés dans `COACH_SITE` (pitchDeep / pitch / pitchLight) et
 * les surfaces Dark Premium du socle (DESIGN.md §2). Les traits se lisent comme
 * des **blancs alpha très bas** posés sur ce vert, pas comme des lignes
 * blanches pleines : c'est ce qui donne un tracé « subtil » plutôt qu'un
 * damier arc-en-ciel.
 *
 * Aucun décor : pas de tribunes, pas de projecteur, pas de damier à fort
 * contraste. Le terrain doit rester un fond lisible pour les noms.
 */

import { COACH_SITE } from '../../../content/coachPageIdentity';
import { proSemantic, type ProSurfaceTokens } from '../../../theme/professionalDesign';

/**
 * Jetons attendus par la couche de présentation Coach (terrain, banc, fiche).
 *
 * Ce sont **exactement** les jetons du socle professionnel (`ProSurfaceTokens`)
 * plus fond et accent adouci. `CoachThemeTokens` y satisfait, et un composant
 * partagé pourrait y injecter les jetons Club/Admin sans rien réécrire.
 */
export type CoachComponentTokens = ProSurfaceTokens & {
  bg: string;
  soft: string;
};

/**
 * Repli **hors shell Coach** (aperçus, tests, rendu isolé).
 *
 * La couche de présentation reçoit ses jetons en prop : elle ne dépend donc ni
 * du contexte de thème, ni de la session, ni de Firebase — c'est ce qui la rend
 * réutilisable et testable. Le repli reprend les surfaces officielles du pôle
 * (`COACH_SITE`), pas une palette inventée.
 */
export const COACH_COMPONENT_FALLBACK: CoachComponentTokens = {
  bg: COACH_SITE.bg,
  surface: COACH_SITE.surface,
  elevated: COACH_SITE.elevated,
  border: COACH_SITE.border,
  foreground: COACH_SITE.foreground,
  muted: COACH_SITE.muted,
  accent: COACH_SITE.accent,
  onAccent: COACH_SITE.bg,
  soft: COACH_SITE.soft,
  isLight: false,
};

export const COACH_PITCH = {
  /** Dégradé de pelouse — trois arrêts verticaux, du plus clair au plus dense. */
  turf: [COACH_SITE.pitchLight, COACH_SITE.pitch, COACH_SITE.pitchDeep] as const,
  /** Bande de ton alternée (tontes) — perceptible sans jamais gêner la lecture. */
  stripe: 'rgba(255, 255, 255, 0.022)',
  /** Trait courant : lignes de jeu, surface, rond central. */
  line: 'rgba(255, 255, 255, 0.18)',
  /** Trait d'appui : pourtour du terrain, seul repère franchement visible. */
  lineStrong: 'rgba(255, 255, 255, 0.28)',
  /** Fond du module terrain (hors pelouse) — surface partagée du pôle. */
  canvas: COACH_SITE.surface,
  /** Bandeau de banc / liste des remplaçants. */
  bench: COACH_SITE.elevated,
  /** Voile d'atténuation des lignes non concernées par l'étape guidée. */
  dimmed: 'rgba(0, 0, 0, 0.42)',
  /** Voile des modales (sélecteur, menu secondaire) — posé sur la pelouse. */
  scrim: 'rgba(0, 0, 0, 0.62)',
  /** Statuts — mêmes valeurs que le socle professionnel partagé. */
  available: proSemantic.success,
  pending: proSemantic.warning,
  unavailable: proSemantic.danger,
} as const;
