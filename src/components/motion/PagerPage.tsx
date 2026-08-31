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
  /** Hauteur mesurée du viewport pager (obligatoire dans un ScrollView horizontal). */
  pageHeight: number;
  children: React.ReactNode;
}

/** Page de pager — fondu + scale liés au scroll horizontal. */
export const PagerPage: React.FC<PagerPageProps> = ({
  index,
  scrollX,
  pageWidth,
  pageHeight,
  children,
}) => {
  const animStyle = useAnimatedStyle(() => {
    const w = Math.max(pageWidth, 1);
    const center = index * w;
    const opacity = interpolate(
      scrollX.value,
      [center - w, center, center + w],
      [0.75, 1, 0.75],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      [center - w, center, center + w],
      [0.98, 1, 0.98],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [center - w, center, center + w],
      [3, 0, 3],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.page,
        {
          width: pageWidth,
          // flex:1 ne remplit pas la hauteur dans un ScrollView horizontal RN.
          height: pageHeight > 0 ? pageHeight : undefined,
        },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  page: { minHeight: 0, overflow: 'hidden' },
});
