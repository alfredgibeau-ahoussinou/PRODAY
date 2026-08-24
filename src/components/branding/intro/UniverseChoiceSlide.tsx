import React, { memo, useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
import { prodayMotion } from '../../../motion';
import { UniverseChoicePage } from './UniverseChoicePage';
import { universePoleDisplayName } from './universePoleBrand';

type UniverseChoiceSlideProps = {
  item: CarouselPoleId;
  index: number;
  itemWidth: number;
  layoutHeight: number;
  pageWidth: number;
  scrollX: SharedValue<number>;
  reducedMotion: boolean;
  selected: boolean;
  confirming?: boolean;
  interactionLocked: boolean;
  onPress: (index: number) => void;
};

/**
 * Slide mémoïsée — ne re-render que si `selected` / `confirming` (ou layout) change,
 * pas à chaque tick de liveIndex pour les voisins.
 */
export const UniverseChoiceSlide = memo(function UniverseChoiceSlide({
  item,
  index,
  itemWidth,
  layoutHeight,
  pageWidth,
  scrollX,
  reducedMotion,
  selected,
  confirming = false,
  interactionLocked,
  onPress,
}: UniverseChoiceSlideProps) {
  const confirmProgress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      confirmProgress.value = confirming ? 1 : 0;
      return;
    }
    confirmProgress.value = withTiming(confirming ? 1 : 0, {
      duration: 120,
      easing: prodayMotion.easing.out,
    });
  }, [confirmProgress, confirming, reducedMotion]);

  const confirmStyle = useAnimatedStyle(() => ({
    opacity: 1 - confirmProgress.value * 0.08,
    transform: [{ scale: 1 - confirmProgress.value * 0.025 }],
  }));

  return (
    <Pressable
      style={{ width: itemWidth, height: layoutHeight || undefined }}
      onPress={() => onPress(index)}
      disabled={interactionLocked}
      accessibilityRole="button"
      accessibilityLabel={`Univers ${universePoleDisplayName(item)}`}
      accessibilityState={{ selected }}
    >
      <Animated.View style={[{ flex: 1 }, confirmStyle]}>
        <UniverseChoicePage
          line={item}
          index={index}
          pageWidth={pageWidth}
          pageHeight={layoutHeight}
          itemWidth={itemWidth}
          scrollX={scrollX}
          cinematic={false}
          reducedMotion={reducedMotion}
          focused={selected}
        />
      </Animated.View>
    </Pressable>
  );
});
