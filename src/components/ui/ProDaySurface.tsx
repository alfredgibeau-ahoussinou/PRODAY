import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, shadows, surfaces } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

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
}) => {
  const { colors: c } = useAppTheme();
  const variantStyles = useMemo(() => createVariantStyles(c), [c]);

  return (
    <View style={[styles.base, variantStyles[variant], style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});

function createVariantStyles(c: AppColors) {
  return StyleSheet.create({
    card: { ...surfaces.card },
    flat: { ...surfaces.cardFlat },
    accent: {
      backgroundColor: c.brandSoft,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.accentMuted,
      ...shadows.soft,
    },
    dark: {
      backgroundColor: c.surfaceInverse,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      ...shadows.interactive,
    },
  });
}
