import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { prodayMotion, useReducedMotion } from '../../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableSpringProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
}

export const PressableSpring: React.FC<PressableSpringProps> = ({
  children,
  style,
  scaleTo = 0.98,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: reduced ? 1 : 0.9 + scale.value * 0.1,
  }));

  return (
    <AnimatedPressable
      style={[style, animStyle]}
      onPressIn={(e) => {
        if (!reduced && !rest.disabled) {
          scale.value = withSpring(scaleTo, prodayMotion.spring.snappy);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduced) scale.value = withSpring(1, prodayMotion.spring.snappy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (rest.disabled) return;
        if (haptic) prodayHaptics.press();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};
