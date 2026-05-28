import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { PressableSpring } from './PressableSpring';
import { colors } from '../../theme/designTokens';

interface CarouselDotProps {
  index: number;
  scrollX: SharedValue<number>;
  snap: number;
  onPress: () => void;
}

export const CarouselDot: React.FC<CarouselDotProps> = ({
  index,
  scrollX,
  snap,
  onPress,
}) => {
  const style = useAnimatedStyle(() => ({
    width: interpolate(
      scrollX.value,
      [(index - 1) * snap, index * snap, (index + 1) * snap],
      [6, 20, 6],
      Extrapolation.CLAMP
    ),
    backgroundColor:
      interpolate(
        scrollX.value,
        [(index - 1) * snap, index * snap, (index + 1) * snap],
        [0, 1, 0],
        Extrapolation.CLAMP
      ) > 0.5
        ? colors.accent
        : colors.border,
  }));

  return (
    <PressableSpring onPress={onPress} scaleTo={0.9}>
      <Animated.View style={[styles.dot, style]} />
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
