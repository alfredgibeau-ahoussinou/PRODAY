import React, { useMemo } from 'react';
import { View, StyleSheet, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, shadows, surfaces } from '../../theme/designTokens';
import { ProDayGradient } from './ProDayGradient';
import type { AppColors } from '../../theme/universeTheme';

type SurfaceVariant = 'card' | 'flat' | 'accent' | 'dark' | 'elevated' | 'module';

interface ProDaySurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentBar?: boolean;
}

/** Conteneur visuel ProDay — variantes sémantiques + barre d’accent optionnelle. */
export const ProDaySurface: React.FC<ProDaySurfaceProps> = ({
  variant = 'card',
  children,
  style,
  accentBar = false,
  ...rest
}) => {
  const { colors: c } = useAppTheme();
  const variantStyles = useMemo(() => createVariantStyles(c), [c]);

  return (
    <View style={[styles.base, variantStyles[variant], style]} {...rest}>
      {accentBar ? (
        <ProDayGradient kind="cta" style={styles.accentBar} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  accentBar: {
    height: 3,
    width: '100%',
  },
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
    elevated: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      ...shadows.interactive,
    },
    module: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
  });
}
