import React from 'react';
import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, surfaces } from '../../theme/designTokens';

type SurfaceVariant = 'card' | 'flat' | 'accent' | 'dark';

interface ProDaySurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Conteneur visuel cohérent ProDay v2 */
export const ProDaySurface: React.FC<ProDaySurfaceProps> = ({
  variant = 'card',
  children,
  style,
  ...rest
}) => (
  <View style={[styles.base, variantStyles[variant], style]} {...rest}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});

const variantStyles = StyleSheet.create({
  card: { ...surfaces.card },
  flat: { ...surfaces.cardFlat },
  accent: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    ...shadows.soft,
  },
  dark: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...shadows.interactive,
  },
});
