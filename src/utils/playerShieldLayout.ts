import { Dimensions } from 'react-native';
import { spacing } from '../theme/designTokens';

/** Largeur carte shield responsive — iPhone SE friendly. */
export function resolvePlayerShieldWidth(max = 280): number {
  const screenWidth = Dimensions.get('window').width;
  return Math.min(max, Math.round(screenWidth - spacing.lg * 2));
}
