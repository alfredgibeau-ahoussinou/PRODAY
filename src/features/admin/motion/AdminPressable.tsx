import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { adminMotion } from './adminMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

/** Micro-interaction press — scale GPU-only. */
export function AdminPressable({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
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
          scale.value = withSpring(scaleTo, adminMotion.spring.snappy);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, adminMotion.spring.snappy);
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
