import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { prodayMotion } from '../tokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
};

/** Micro-interaction press — scale GPU-only, respecte reduced motion. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, anim]}
      disabled={disabled}
      onPressIn={(e) => {
        if (!reduced && !disabled) {
          scale.value = withSpring(scaleTo, prodayMotion.spring.snappy);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, prodayMotion.spring.snappy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (disabled) return;
        if (haptic) prodayHaptics.press();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
