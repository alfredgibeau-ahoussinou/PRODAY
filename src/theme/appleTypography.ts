/**
 * Apple System Typography Stack for ProDay Elite Design System
 * 
 * Basé sur le stack système natif Apple (San Francisco / SF Pro Text / SF Pro Display / -apple-system / BlinkMacSystemFont).
 * Offre un rendu parfaitement identique aux applications iOS officielles avec un suivi dynamique des espacements.
 */

import { Platform, TextStyle } from 'react-native';

export const APPLE_FONT_STACK = {
  system: Platform.select({
    ios: 'System',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
    android: 'Roboto',
    default: 'System',
  }),
  display: Platform.select({
    ios: 'System',
    web: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    web: '"SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

export const APPLE_TYPOGRAPHY = {
  /** Titre d'écran principal (ex: "Espace Club", "Centre Match") */
  largeTitle: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    letterSpacing: -0.6,
  } as TextStyle,

  /** Titre de section majeure */
  title1: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.4,
  } as TextStyle,

  /** Titre de carte ou module */
  title2: {
    fontFamily: APPLE_FONT_STACK.display,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    letterSpacing: -0.3,
  } as TextStyle,

  /** Sous-titre de bloc */
  title3: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.2,
  } as TextStyle,

  /** En-tête d'élément / Maintien d'attention */
  headline: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
    letterSpacing: -0.15,
  } as TextStyle,

  /** Texte principal */
  body: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.1,
  } as TextStyle,

  /** Texte principal mis en valeur */
  callout: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: -0.05,
  } as TextStyle,

  /** Légendes et métadonnées de sous-titres */
  subheadline: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0,
  } as TextStyle,

  /** Notes de bas de page et horodatages */
  footnote: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.1,
  } as TextStyle,

  /** Badges, tags et étiquettes secondaires */
  caption1: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.2,
  } as TextStyle,

  /** Badges ultra-compacts et micro-labels HIG Apple */
  caption2: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
    letterSpacing: 0.2,
  } as TextStyle,

  /** Sur-titres en majuscules (ex: "SAISON 2026/2027") */
  eyebrow: {
    fontFamily: APPLE_FONT_STACK.system,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

export type AppleTypographyStyle = keyof typeof APPLE_TYPOGRAPHY;
