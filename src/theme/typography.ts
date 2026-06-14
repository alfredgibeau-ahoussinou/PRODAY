import { typography as tokens } from './designTokens';

export const fontFamily = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
} as const;

export const textVariants = {
  hero: {
    fontFamily: fontFamily.black,
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  title: {
    fontFamily: fontFamily.extrabold,
    fontSize: tokens.sizes.title,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  section: {
    fontFamily: fontFamily.extrabold,
    fontSize: tokens.sizes.section,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  eyebrow: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: tokens.sizes.body,
    fontWeight: '400' as const,
    lineHeight: 23,
  },
  caption: {
    fontFamily: fontFamily.semibold,
    fontSize: tokens.sizes.caption,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  brand: {
    fontFamily: fontFamily.extrabold,
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
    transform: [{ skewX: tokens.brandSlant }],
  },
} as const;

export type TextVariant = keyof typeof textVariants;
