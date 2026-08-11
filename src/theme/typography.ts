import { typography as tokens } from './designTokens';

export const fontFamily = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
  /** Display marketing uniquement (pas les titres d’écran UI). */
  display: 'Syne_700Bold',
  displayBold: 'Syne_800ExtraBold',
} as const;

/**
 * Titres d’app = Inter (lisible).
 * Syne réservé à `brand` / moments marketing.
 * Pas de fontWeight numérique : chaque graisse = fichier Expo.
 */
export const textVariants = {
  hero: {
    fontFamily: fontFamily.extrabold,
    fontSize: tokens.sizes.hero,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  title: {
    fontFamily: fontFamily.extrabold,
    fontSize: tokens.sizes.title,
    letterSpacing: -0.35,
    lineHeight: 28,
  },
  section: {
    fontFamily: fontFamily.bold,
    fontSize: tokens.sizes.section,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  eyebrow: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: tokens.sizes.body,
    lineHeight: 23,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: tokens.sizes.caption,
    lineHeight: 18,
  },
  brand: {
    fontFamily: fontFamily.displayBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
} as const;

export type TextVariant = keyof typeof textVariants;
