import { typography as tokens } from './designTokens';
import { APPLE_FONT_STACK, APPLE_TYPOGRAPHY } from './appleTypography';

export { APPLE_FONT_STACK, APPLE_TYPOGRAPHY };

export const fontFamily = {
  regular: APPLE_FONT_STACK.system,
  semibold: APPLE_FONT_STACK.system,
  bold: APPLE_FONT_STACK.display,
  extrabold: APPLE_FONT_STACK.display,
  black: APPLE_FONT_STACK.display,
  display: APPLE_FONT_STACK.display,
  displayBold: APPLE_FONT_STACK.display,
  brand: APPLE_FONT_STACK.display,
  brandSemi: APPLE_FONT_STACK.system,
} as const;

export const textVariants = {
  hero: APPLE_TYPOGRAPHY.largeTitle,
  title: APPLE_TYPOGRAPHY.title1,
  section: APPLE_TYPOGRAPHY.title2,
  eyebrow: APPLE_TYPOGRAPHY.eyebrow,
  body: APPLE_TYPOGRAPHY.body,
  caption: APPLE_TYPOGRAPHY.caption1,
  brand: APPLE_TYPOGRAPHY.title3,
} as const;

export type TextVariant = keyof typeof textVariants;
