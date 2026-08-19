import { TAB_BAR_CONTENT_INSET } from './tabBarLayout';
import { spacing } from '../theme/designTokens';

/** Padding horizontal commun des pages scrollables. */
export const SCREEN_PAD_X = spacing.lg;

/** Conteneur scroll standard (onglets + sous-écrans). */
export const screenScrollPad = (extraBottom: number = spacing.sm) => ({
  paddingHorizontal: SCREEN_PAD_X,
  paddingBottom: TAB_BAR_CONTENT_INSET + extraBottom,
});
