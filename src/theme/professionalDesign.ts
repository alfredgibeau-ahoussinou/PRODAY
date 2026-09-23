/**
 * Socle professionnel partagé — **Coach ↔ Club/Admin** (README §0.1 : « une seule
 * variante professionnelle partagée strictement entre Coach et Club/Admin »).
 *
 * Problème constaté : les deux pôles exprimaient le **même** registre visuel via
 * deux jeux de jetons différents. Le pôle Club/Admin est bâti sur
 * `features/club/theme/clubDesignSystem.ts` (typographie, forme, espacements,
 * rayons, ombres, tons d'événement) ; le pôle Coach n'avait que des points de
 * rupture de chrome (`coachDesignSystem.ts`) et recopiait ses dimensions écran
 * par écran, ce qui a produit des écarts mesurables (puces à aplat accent,
 * dock en capitales, libellés de 9 px).
 *
 * Ce module **ne redéfinit aucune valeur** : il ré-exporte le socle Club/Admin
 * sous des noms neutres, afin que les deux pôles consomment littéralement le
 * même objet. Une seule source de vérité, donc aucune dérive possible ;
 * `proDesignAlignment.test.ts` verrouille cette identité.
 */

import type { ViewStyle } from 'react-native';
import {
  clubChrome,
  clubEventTone,
  clubForm,
  clubMotion,
  clubRadius,
  clubShadow,
  clubSpace,
  clubType,
  type ClubEventKind,
  type ClubTypeVariant,
} from '../features/club/theme/clubDesignSystem';

import { CLUB_TOKENS } from '../features/club/theme/clubTokens';

/**
 * Statuts communs (README §0.1) : **vert = validé / présent / payé**,
 * **orange = en attente / à surveiller**, **rouge = erreur / critique**.
 * Les valeurs sont celles du socle, donc identiques dans les deux pôles ; le
 * pôle Coach n'a plus de rouge iOS écrit en dur dans ses composants.
 */
export const proSemantic = {
  success: CLUB_TOKENS.success,
  warning: CLUB_TOKENS.warning,
  danger: CLUB_TOKENS.danger,
  /** Fonds doux des statuts — mêmes valeurs que le socle Club. */
  successSoft: CLUB_TOKENS.successSoft,
  warningSoft: CLUB_TOKENS.warningSoft,
  dangerSoft: CLUB_TOKENS.dangerSoft,
  /** Information / données / accent secondaire — même bleu dans les deux pôles. */
  info: '#0A84FF',
  /** Texte posé sur un aplat de statut (bouton d'alerte) — blanc dans les deux pôles. */
  onDanger: '#FFFFFF',
} as const;

/**
 * Série de données « violet » — seconde couleur de schémas (joueur adverse,
 * zone de comparaison), distinguable de l'accent (vert) et de l'info (bleu).
 * Jamais pour un statut : uniquement pour les séries de diagrammes.
 */
export const PRO_DATA_VIOLET = '#8B5CF6';

export {
  clubChrome as proChrome,
  clubEventTone as proEventTone,
  clubForm as proForm,
  clubMotion as proMotion,
  clubRadius as proRadius,
  clubShadow as proShadow,
  clubSpace as proSpace,
  clubType as proType,
  type ClubEventKind as ProEventKind,
  type ClubTypeVariant as ProTypeVariant,
};

/**
 * Jetons **minimaux** dont un composant partagé a besoin. Structurellement
 * satisfaits par `ClubThemeTokens` comme par `CoachThemeTokens`, ce qui permet
 * d'écrire un composant unique et de l'injecter dans les deux thèmes.
 *
 * Les champs optionnels décrivent les différences réelles entre les deux jeux,
 * avec un repli explicite côté composant (`faint ?? muted`, `borderStrong ?? border`).
 */
export type ProSurfaceTokens = {
  surface: string;
  elevated: string;
  border: string;
  borderStrong?: string;
  foreground: string;
  muted: string;
  faint?: string;
  accent: string;
  onAccent: string;
  soft?: string;
  isLight?: boolean;
};

/** Barre d'état / teinte de repli quand un champ optionnel n'existe pas. */
export function proFaint(tokens: ProSurfaceTokens): string {
  return tokens.faint ?? tokens.muted;
}

export function proBorderStrong(tokens: ProSurfaceTokens): string {
  return tokens.borderStrong ?? tokens.border;
}

/**
 * Recette « puce » du registre professionnel — **géométrie et état partagés**.
 *
 * Une seule règle pour tout le monde : hauteur cible et rayon pilule du socle, et
 * une sélection qui se lit en **contour d'accent sur fond transparent**, jamais en
 * aplat plein. Le pôle Coach et le pôle Club/Admin passent par ici, donc leurs
 * puces ne peuvent plus diverger — c'est exactement la dérive que ce module
 * existe pour empêcher (DESIGN.md, règle de sélection des deux pôles).
 */
export function proChip(tokens: ProSurfaceTokens, active: boolean): ViewStyle {
  const geometry: ViewStyle = {
    minHeight: clubForm.chipHeight,
    borderRadius: clubForm.chipRadius,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  };
  return active
    ? { ...geometry, borderColor: tokens.accent, backgroundColor: 'transparent' }
    : { ...geometry, borderColor: tokens.border, backgroundColor: tokens.elevated };
}

/** Recette « carte plate » du registre professionnel. */
export function proCard(tokens: ProSurfaceTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: clubForm.groupRadius,
    borderWidth: 1,
    borderColor: tokens.border,
  };
}

/** Recette « surface élevée » (lignes, encarts internes). */
export function proSurfaceElevated(tokens: ProSurfaceTokens): ViewStyle {
  return {
    backgroundColor: tokens.elevated,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    borderColor: tokens.border,
  };
}

