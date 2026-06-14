import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

interface PagerPageProps {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  children: React.ReactNode;
}

/** Page de pager — fondu + scale liés au scroll horizontal. */
export const PagerPage: React.FC<PagerPageProps> = ({
  index,
  scrollX,
  pageWidth,
  children,
}) => {
  const animStyle = useAnimatedStyle(() => {
    const w = Math.max(pageWidth, 1);
    const center = index * w;
    const opacity = interpolate(
      scrollX.value,
      [center - w, center, center + w],
      [0.55, 1, 0.55],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      [center - w, center, center + w],
      [0.96, 1, 0.96],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [center - w, center, center + w],
      [8, 0, 8],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <Animated.View style={[styles.page, { width: pageWidth }, animStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 0 },
});
