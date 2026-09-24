/**
 * Design system Pôle Joueur — **socle partagé** de la refonte Player.
 *
 * Alignement strict avec les pôles Coach et Club approuvés :
 * - **Forme & Cartes** : Cartes groupées Apple, séparateurs en retrait, puces
 *   pilules ergonomiques, boutons d'action en pilule, grille modulaire 4 pt.
 * - **Surfaces & Typographie** : DESIGN.md §2.1–§2.3 — fond OLED et surfaces
 *   `PLAYER_DARK` (alignées sur le socle pro), et **pile Apple system**
 *   (San Francisco / SF Pro) via `APPLE_TYPOGRAPHY`.
 *
 * Ce module ne définit **aucune couleur littérale** : les surfaces viennent de
 * `PLAYER_DARK`, les statuts de `CLUB_TOKENS` (même registre sémantique que
 * Coach/Club : vert = validé/présent, orange = en attente, rouge = erreur/absent).
 * Le garde-fou `playerDesignSystem.test.ts` verrouille le zéro littéral et la
 * parité de forme avec le socle professionnel (`clubForm`).
 */

import type { TextStyle, ViewStyle } from 'react-native';
import { APPLE_TYPOGRAPHY } from './appleTypography';
import { PLAYER_DARK } from './playerDarkPremium';
import { CLUB_TOKENS } from '../features/club/theme/clubTokens';
import { proSemantic } from './professionalDesign';

/** Surfaces du pôle — réexport du socle sombre joueur (DESIGN.md §2.1). */
export const playerColors = PLAYER_DARK;

/**
 * Typographie **Apple system** — San Francisco / SF Pro. Les objets sont les
 * références d'`APPLE_TYPOGRAPHY` (identité garantie, pas une copie) : tout
 * l'écran Player — navigation, statistiques, cartes, messagerie, dialogues et
 * libellés du terrain — suit la même échelle HIG.
 */
export const playerType = {
  /** Titre d'écran (Ma Carte, sections majeures). */
  title: APPLE_TYPOGRAPHY.title1,
  /** Titre de carte ou de module. */
  section: APPLE_TYPOGRAPHY.title2,
  /** En-tête d'élément de liste. */
  headline: APPLE_TYPOGRAPHY.headline,
  /** Texte courant mis en valeur / libellé de bouton. */
  callout: APPLE_TYPOGRAPHY.callout,
  /** Sous-titres et métadonnées. */
  subheadline: APPLE_TYPOGRAPHY.subheadline,
  /** Légendes et horodatages. */
  caption: APPLE_TYPOGRAPHY.footnote,
  /** Micro-labels et badges compacts. */
  micro: APPLE_TYPOGRAPHY.caption2,
  /** Valeur statistique (compteurs, notes). */
  stat: APPLE_TYPOGRAPHY.title1,
  /** Libellé de navigation basse. */
  nav: APPLE_TYPOGRAPHY.footnote,
} as const satisfies Record<string, TextStyle>;

export type PlayerTypeVariant = keyof typeof playerType;

/**
 * Forme « Apple Fitness » — constantes de composition du pôle Joueur.
 * Parité assumée avec `clubForm` pour les mesures partagées (puces, actions,
 * lignes, champs, dock) : les deux pôles répondent aux mêmes cibles.
 */
export const playerForm = {
  /** Carte groupée Apple Fitness — rayon généreux, parité stricte avec le socle. */
  cardRadius: 22,
  /** Grand bloc hero (carte FUT, passeport). */
  heroRadius: 24,
  /** Marge intérieure d'une carte. */
  cardPaddingH: 16,
  cardPaddingV: 16,
  /** Hauteur utile d'une ligne de liste. */
  rowMinHeight: 62,
  /** Séparateur interne (sous le libellé, comme la référence). */
  separatorThickness: 1,
  /** Rayon des blocs de saisie. */
  fieldRadius: 18,
  /** Puce de filtre : pilule, sélection au contour d'accent. */
  chipHeight: 44,
  chipRadius: 999,
  chipGap: 10,
  /** Bouton d'action principal : pilule pleine largeur. */
  actionRadius: 999,
  actionMinHeight: 52,
  /** Grille KPI 2 colonnes. */
  kpiGap: 10,
  kpiMinHeight: 96,
  /** Dock bas. */
  dockLabelSize: 11,
  dockIconSize: 24,
  /** Espacements (grille 4 pt). */
  space: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
} as const;

/**
 * Jetons minimaux dont une recette de surface a besoin. Structurellement
 * satisfaits par `PLAYER_DARK` comme par `ClubThemeTokens`.
 */
export type PlayerSurfaceTokens = {
  surface: string;
  surfaceRaised: string;
  border: string;
  /** Filet plus visible des cartes hero / élevées (surfaces premium). */
  borderStrong?: string;
  accent: string;
  text: string;
  textMuted: string;
};

/** Recette « carte » — surface + rayon généreux + filet discret. */
export function playerCard(tokens: PlayerSurfaceTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: playerForm.cardRadius,
    borderWidth: 1,
    borderColor: tokens.border,
  };
}

/** Recette « carte élevée » — champs, modales, cartes pressées. */
export function playerCardElevated(tokens: PlayerSurfaceTokens): ViewStyle {
  return {
    backgroundColor: tokens.surfaceRaised,
    borderRadius: playerForm.cardRadius,
    borderWidth: 1,
    borderColor: tokens.borderStrong ?? tokens.border,
  };
}

/** Recette « hero » — grand bloc premium (passeport, carte FUT). */
export function playerHeroCard(tokens: PlayerSurfaceTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: playerForm.heroRadius,
    borderWidth: 1,
    borderColor: tokens.borderStrong ?? tokens.border,
    overflow: 'hidden',
  };
}

/**
 * Recette « puce » — pilule ; la sélection se lit en **contour d'accent sur
 * fond transparent**, jamais en aplat (même règle que `proChip`).
 */
export function playerChip(tokens: PlayerSurfaceTokens, active: boolean): ViewStyle {
  const geometry: ViewStyle = {
    minHeight: playerForm.chipHeight,
    borderRadius: playerForm.chipRadius,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  };
  return active
    ? { ...geometry, borderColor: tokens.accent, backgroundColor: 'transparent' }
    : { ...geometry, borderColor: tokens.border, backgroundColor: tokens.surfaceRaised };
}

/**
 * Tons de réponse convocation — registre sémantique commun Coach/Club :
 * vert = présent, orange = incertain, rouge = absent. L'encre posée sur les
 * aplats vient des jetons partagés (`onDanger`, fond OLED).
 */
export const playerResponseTone = {
  present: {
    label: 'Présent',
    color: CLUB_TOKENS.success,
    ink: PLAYER_DARK.bg,
  },
  pending: {
    label: 'Incertain',
    color: CLUB_TOKENS.warning,
    ink: PLAYER_DARK.bg,
  },
  absent: {
    label: 'Absent',
    color: CLUB_TOKENS.danger,
    ink: proSemantic.onDanger,
  },
} as const;

/** Jetons du thème joueur par défaut (recettes sans thème injecté). */
export const PLAYER_SURFACE_TOKENS: PlayerSurfaceTokens = {
  surface: PLAYER_DARK.surface,
  surfaceRaised: PLAYER_DARK.surfaceRaised,
  border: PLAYER_DARK.border,
  borderStrong: PLAYER_DARK.borderStrong,
  accent: PLAYER_DARK.accent,
  text: PLAYER_DARK.text,
  textMuted: PLAYER_DARK.textMuted,
};
