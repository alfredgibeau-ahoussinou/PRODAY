/**
 * Club Design System — identité visuelle premium sombre du Pôle Club.
 * Night pitch / charcoal, accents club, codes sportifs. Pas de thème Coach.
 *
 * Utiliser via `clubUi` / shell ; éviter les styles one-off sur les écrans.
 */

import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { CLUB_TOKENS, type ClubThemeTokens } from './clubTokens';
import { APPLE_FONT_STACK } from '../../../theme/appleTypography';

/**
 * Forme « application Apple Fitness / Apple HIG » (hiérarchie sport premium).
 *
 * Référence de **forme** retenue pour le pôle Club/Admin : rayons généreux,
 * conteneurs de liste groupée, séparateurs en retrait, puces pilule dont la
 * sélection est un **contour d'accent** (jamais un remplissage), champ de
 * recherche sans bordure, bouton d'action en pilule à contour fin, et FAB
 * central posé sur l'arête du dock.
 *
 * L'accent reste l'émeraude ProDay (D-006/D-008) : seule la forme est reprise.
 * Le socle de surfaces reste DESIGN.md §2.1.
 */
export const clubForm = {
  /** Conteneur de liste groupée (« Moi ») — rayon généreux, sans bordure. */
  groupRadius: 22,
  /** Écart vertical entre deux groupes sur le canvas. */
  groupGap: 28,
  /** Marge intérieure horizontale de l'encart groupé. */
  groupPaddingH: 18,
  /** Hauteur utile d'une ligne de réglage. */
  rowMinHeight: 62,
  rowIconSize: 22,
  /** Écart icône → libellé dans une ligne de réglage. */
  rowGap: 12,
  chevronSize: 15,
  /**
   * Séparateur interne en retrait : sa gauche tombe **sous le libellé**, comme
   * dans la référence — marge de l'encart + colonne d'icône + écart.
   */
  separatorInset: 18 + 22 + 12,
  separatorThickness: StyleSheet.hairlineWidth,
  /** Champ de recherche : sans bordure, sur fond élevé. */
  fieldHeight: 52,
  fieldRadius: 18,
  /** Puce de filtre : pilule ; sélection = contour d'accent + libellé accent. */
  chipHeight: 44,
  chipRadius: 999,
  chipGap: 10,
  /** Bouton d'action secondaire (« Réserver un cours ») : pilule à contour fin. */
  actionRadius: 999,
  actionMinHeight: 52,
  actionBorderWidth: 1,
  /** Pastille d'état en surimpression (badge plein sur une carte). */
  badgeRadius: 8,
  /** Dock : capsule flottante à extrémités pleinement arrondies. */
  dockRadius: 999,
  dockIconSize: 24,
  /** Libellés du dock en **bas de casse** (« Accueil », « Training »), jamais en capitales. */
  dockLabelSize: 11,
  /** FAB central du dock : 56, dont la moitié dépasse de l'arête supérieure. */
  fabSize: 56,
  fabIconSize: 24,
  fabOverlap: 0.5,
} as const;

/** Échelle typographique Club (Display → Nav). */
export const clubType = {
  /**
   * Typographie **Apple system** — San Francisco / SF Pro via la pile native
   * (System sur iOS, -apple-system sur web, Roboto en repli Android). Déclarée
   * ici **une seule fois** : aucun écran ne doit re-déclarer de fontFamily.
   */
  display: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  h1: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  h2: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.35,
    lineHeight: 26,
  },
  h3: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  body: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 21,
  },
  caption: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.7,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  score: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  nav: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 18,
  },
} satisfies Record<string, TextStyle>;

export type ClubTypeVariant = keyof typeof clubType;

/** Espacements Club (grille 4). */
export const clubSpace = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

/** Rayons. */
export const clubRadius = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

/** Ombres premium (profondeur sur fond sombre). */
export const clubShadow = {
  none: {} as ViewStyle,
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 3,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 6,
  } satisfies ViewStyle,
  lift: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.62,
    shadowRadius: 28,
    elevation: 8,
  } satisfies ViewStyle,
  accent: (tokens: ClubThemeTokens): ViewStyle => ({
    shadowColor: tokens.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 6,
  }),
};

/** Codes couleur événements calendrier / sport (soft adaptés dark). */
export const clubEventTone = {
  match: { key: 'match', label: 'MATCH', color: '#5BA3FF', soft: 'rgba(91,163,255,0.22)' },
  training: { key: 'training', label: 'ENTRAÎNEMENT', color: '#34D399', soft: 'rgba(52,211,153,0.20)' },
  tournament: { key: 'tournament', label: 'TOURNOI', color: '#10B981', soft: 'rgba(16,185,129,0.20)' },
  meeting: { key: 'meeting', label: 'RÉUNION', color: '#94A3B8', soft: 'rgba(148,163,184,0.18)' },
  event: { key: 'event', label: 'ÉVÉNEMENT', color: '#22D3EE', soft: 'rgba(34,211,238,0.18)' },
} as const;

export type ClubEventKind = keyof typeof clubEventTone;

/** Durées micro-interactions (ms). */
export const clubMotion = {
  press: 120,
  enter: 280,
  collapse: 220,
  shimmer: 1400,
} as const;

/** Largeurs chrome. */
export const clubChrome = {
  sidebarExpanded: 260,
  sidebarCollapsed: 76,
  wideBreakpoint: 900,
  tabletBreakpoint: 680,
  /** Largeur max contenu lisible (dashboard / listes) hors sidebar. */
  contentMaxWidth: 1180,
  headerHeight: 56,
  tabBarIcon: 22,
  /** Hauteur rail dock (hors safe area) — labels ≥11 + pill. */
  dockRailHeight: 56,
  /**
   * Offset FAB Créer depuis le bas du pane (au-dessus du dock).
   * Laisse de l’air entre le dock et la pastille bleue 56.
   */
  createFabBottom: 78,
} as const;

export function clubContentWidth(windowWidth: number, sidebarVisible: boolean, sidebarCollapsed = false): number {
  const side = sidebarVisible
    ? sidebarCollapsed
      ? clubChrome.sidebarCollapsed
      : clubChrome.sidebarExpanded
    : 0;
  return Math.min(windowWidth - side, clubChrome.contentMaxWidth);
}

/** Recettes de surface (cartes, chrome). */
export function clubSurfaceCard(tokens: ClubThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: clubRadius.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    ...clubShadow.card,
  };
}

export function clubSurfaceElevated(tokens: ClubThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.elevated,
    borderRadius: clubRadius.md,
    borderWidth: 1,
    borderColor: tokens.border,
  };
}

export function clubSurfacePremium(tokens: ClubThemeTokens): ViewStyle {
  return {
    backgroundColor: tokens.surface,
    borderRadius: clubRadius.xl,
    borderWidth: 1,
    borderColor: tokens.borderStrong,
    overflow: 'hidden' as const,
    ...clubShadow.lift,
  };
}

/** Export groupé pour imports uniques. */
export const clubDesignSystem = {
  tokens: CLUB_TOKENS,
  type: clubType,
  space: clubSpace,
  radius: clubRadius,
  form: clubForm,
  shadow: clubShadow,
  eventTone: clubEventTone,
  motion: clubMotion,
  chrome: clubChrome,
  surfaceCard: clubSurfaceCard,
  surfaceElevated: clubSurfaceElevated,
  surfacePremium: clubSurfacePremium,
} as const;
