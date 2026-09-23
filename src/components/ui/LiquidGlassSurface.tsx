import React from 'react';
import {
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  Pressable,
} from 'react-native';
import { getLiquidGlassTokens } from '../../theme/liquidGlass';
import { radius, spacing } from '../../theme/designTokens';

export type LiquidGlassVariant = 'card' | 'header' | 'footer' | 'pill' | 'interactive' | 'input';

export interface LiquidGlassSurfaceProps {
  variant?: LiquidGlassVariant;
  active?: boolean;
  forceOpaque?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityRole?: 'button' | 'none';
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * Surface Liquid Glass universelle avec Progressive Enhancement.
 * S'adapte automatiquement :
 * - Mode Glass (translucide + flou d'arrière-plan + reflets fins)
 * - Mode Opaque (Obsidian profond + bordure nette à haut contraste)
 */
export const LiquidGlassSurface: React.FC<LiquidGlassSurfaceProps> = ({
  variant = 'card',
  active = false,
  forceOpaque = false,
  style,
  contentStyle,
  onPress,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  disabled = false,
  children,
}) => {
  const tokens = getLiquidGlassTokens(forceOpaque);

  const containerBorderRadius =
    variant === 'pill'
      ? radius.pill
      : variant === 'header' || variant === 'footer'
        ? 0
        : radius.xl;

  const bg = active ? tokens.bgActive : variant === 'header' || variant === 'footer' ? tokens.bgElevated : tokens.bg;
  const borderColor = active ? tokens.borderActive : tokens.border;

  const containerStyle: ViewStyle = {
    borderRadius: containerBorderRadius,
    backgroundColor: bg,
    borderColor,
    borderWidth: 1,
    overflow: 'hidden',
    ...(tokens.shadow || {}),
    ...(tokens.blurStyle as ViewStyle),
  };

  if (variant === 'header') {
    containerStyle.borderTopWidth = 0;
    containerStyle.borderLeftWidth = 0;
    containerStyle.borderRightWidth = 0;
    containerStyle.borderBottomWidth = 1;
  } else if (variant === 'footer') {
    containerStyle.borderBottomWidth = 0;
    containerStyle.borderLeftWidth = 0;
    containerStyle.borderRightWidth = 0;
    containerStyle.borderTopWidth = 1;
    containerStyle.borderTopColor = tokens.specularTop;
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState ?? { selected: active, disabled }}
        style={({ pressed }) => [
          styles.base,
          containerStyle,
          pressed && styles.pressed,
          style,
        ]}
      >
        <View style={[styles.inner, contentStyle]}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, containerStyle, style]}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    position: 'relative',
  },
  inner: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
