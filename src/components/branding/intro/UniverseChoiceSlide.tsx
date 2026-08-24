import React, { memo } from 'react';
import { Pressable } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { CarouselPoleId } from '../../../models/CarouselPole';
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
  interactionLocked: boolean;
  onPress: (index: number) => void;
};

/**
 * Slide mémoïsée — ne re-render que si `selected` (ou layout) change,
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
  interactionLocked,
  onPress,
}: UniverseChoiceSlideProps) {
  return (
    <Pressable
      style={{ width: itemWidth, height: layoutHeight || undefined }}
      onPress={() => onPress(index)}
      disabled={interactionLocked}
      accessibilityRole="button"
      accessibilityLabel={`Univers ${universePoleDisplayName(item)}`}
      accessibilityState={{ selected }}
    >
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
    </Pressable>
  );
});
