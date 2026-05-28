import React from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
interface DiscoverParallaxSectionProps extends ViewProps {
  sectionId: string;
  scrollY: SharedValue<number>;
  sectionY: number;
  children: React.ReactNode;
}

/** Section avec léger parallax + fade au scroll vertical. */
export const DiscoverParallaxSection: React.FC<DiscoverParallaxSectionProps> = ({
  sectionId,
  scrollY,
  sectionY,
  children,
  style,
  ...rest
}) => {
  const animStyle = useAnimatedStyle(() => {
    const rel = scrollY.value - sectionY + 120;
    return {
      opacity: interpolate(rel, [-80, 0, 400], [0.4, 1, 1], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(rel, [-100, 0, 200], [12, 0, -8], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <View
      {...rest}
      style={style}
      accessibilityLabel={`section-${sectionId}`}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </View>
  );
};
